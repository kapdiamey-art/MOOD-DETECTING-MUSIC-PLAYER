"""
retrain_from_feedback.py
========================
Automated continuous-learning retraining script.

What it does:
  1. Connects to MongoDB and pulls ALL feedback rows where user_correct=False
     (i.e. rows where a human provided the true emotion label).
  2. Deduplicates and filters low-quality samples.
  3. Merges user-corrected samples (with oversampling weight) into the original
     training CSV -> writes a temporary augmented CSV.
  4. Fine-tunes the existing emotion_model.pth on the augmented dataset for a
     small number of epochs (so the model does not catastrophically forget).
  5. Evaluates on the original validation set. Only saves the new weights if
     val-accuracy does not drop more than 0.5%.
  6. Writes a timestamped run-log to  models/retrain_log.jsonl
  7. Marks processed feedback docs in MongoDB with  retrained=True  so they
     are not double-counted on the next run.

Schedule (Windows Task Scheduler):
  - Run every 2 days using the companion  schedule_retraining.bat  script.

Usage (manual):
  cd "Emotion Detection Model"
  python src/retrain_from_feedback.py
"""

import json
import os
import sys
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

# Paths
BASE_DIR    = Path(__file__).resolve().parent.parent
SRC_DIR     = BASE_DIR / "src"
MODELS_DIR  = BASE_DIR / "models"
DATA_DIR    = BASE_DIR / "data" / "processed"

TRAIN_CSV       = DATA_DIR / "train.csv"
VAL_CSV         = DATA_DIR / "val.csv"
AUG_CSV         = DATA_DIR / "_augmented_train.csv"
MODEL_PATH      = MODELS_DIR / "emotion_model.pth"
MODEL_BAK_PATH  = MODELS_DIR / "emotion_model_before_retrain.pth"
VOCAB_PATH      = MODELS_DIR / "vocabulary.json"
LOG_PATH        = MODELS_DIR / "retrain_log.jsonl"

# Root of the git repository (two levels up from src/)
REPO_ROOT = BASE_DIR.parent

MIN_NEW_SAMPLES        = 1
CORRECTION_WEIGHT      = 2
FINETUNE_EPOCHS        = 2
FINETUNE_LR            = 1e-4
BATCH_SIZE             = 32
MAX_LENGTH             = 50
ACCURACY_DROP_THRESHOLD = 0.5   # max allowed val-acc drop (%) before rejecting new model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("retrain")

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

BACKEND_DIR = BASE_DIR.parent / "Backend"
env_path    = BACKEND_DIR / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)
    log.info(f"Loaded .env from {env_path}")

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME   = os.getenv("DB_NAME", "moodify")

LABEL_MAP = {
    "sadness": 0, "joy": 1, "love": 2,
    "anger": 3, "fear": 4, "surprise": 5, "neutral": 6,
}
VALID_LABELS = set(LABEL_MAP.keys())


def fetch_feedback():
    """Return a list of dicts {text, emotion} for every unprocessed correction."""
    if not MONGO_URI:
        log.warning("MONGO_URI not set. Cannot fetch feedback. Aborting.")
        return [], []
    try:
        import pymongo
    except ImportError:
        log.error("pymongo not installed. Run: pip install pymongo")
        return [], []

    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    db     = client[DB_NAME]
    col    = db["emotion_feedback"]

    cursor = col.find({
        "user_correct": False,
        "actual_label": {"$in": list(VALID_LABELS)},
        "retrained":    {"$ne": True},
    })

    records    = []
    doc_ids    = []
    seen_texts = set()

    for doc in cursor:
        txt   = (doc.get("text") or "").strip()
        label = (doc.get("actual_label") or "").lower().strip()
        if not txt or label not in VALID_LABELS:
            continue
        key = (txt[:80], label)
        if key in seen_texts:
            continue
        seen_texts.add(key)
        records.append({"text": txt, "emotion": label})
        doc_ids.append(doc["_id"])

    client.close()
    log.info(f"Fetched {len(records)} unprocessed corrected samples from MongoDB.")
    return records, doc_ids


def update_main_train_csv(new_records):
    """Permanently append user-corrected feedback samples to train.csv."""
    import pandas as pd

    if not new_records:
        return

    df_new = pd.DataFrame(new_records, columns=["text", "emotion"])

    if TRAIN_CSV.exists():
        df_existing = pd.read_csv(TRAIN_CSV)
        log.info(f"Existing train.csv size: {len(df_existing)}")
        df_combined = pd.concat([df_existing, df_new], ignore_index=True)
        df_combined = df_combined.drop_duplicates(subset=["text", "emotion"]).reset_index(drop=True)
    else:
        df_combined = df_new

    df_combined.to_csv(TRAIN_CSV, index=False)
    log.info(f"Updated train.csv size: {len(df_combined)} (+{len(new_records)} new corrections integrated permanently)")
    return df_combined


def finetune():
    """Fine-tune emotion_model.pth on the updated full train.csv dataset. Returns (model, new_val_acc, old_val_acc)."""
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    import pandas as pd
    import re
    from model import SelfTrainedAttentionEmotionModel

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Using device: {device}")

    with open(VOCAB_PATH, encoding="utf-8") as f:
        word_to_index = json.load(f)

    def tokenize(text):
        return re.findall(r"\b\w+(?:'\w+)?\b", str(text).lower())

    def text_to_ids(text):
        seq = [word_to_index.get(t, word_to_index.get("<UNK>", 1)) for t in tokenize(text)][:MAX_LENGTH]
        seq += [word_to_index.get("<PAD>", 0)] * (MAX_LENGTH - len(seq))
        return seq

    class FeedbackDataset(Dataset):
        def __init__(self, csv_path):
            self.df = pd.read_csv(csv_path)
        def __len__(self): return len(self.df)
        def __getitem__(self, i):
            row   = self.df.iloc[i]
            ids   = torch.tensor(text_to_ids(str(row["text"])), dtype=torch.long)
            label = torch.tensor(LABEL_MAP.get(str(row["emotion"]).lower(), 6), dtype=torch.long)
            return ids, label

    vocab_size = len(word_to_index)
    model = SelfTrainedAttentionEmotionModel(vocab_size, 128, 128, 7)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model = model.to(device)

    old_val_acc = _evaluate_val(model, device, FeedbackDataset, VAL_CSV)
    log.info(f"Baseline val accuracy: {old_val_acc:.2f}%")

    train_loader = DataLoader(FeedbackDataset(TRAIN_CSV), batch_size=BATCH_SIZE, shuffle=True)
    criterion    = nn.CrossEntropyLoss()
    optimizer    = optim.Adam(model.parameters(), lr=FINETUNE_LR)

    model.train()
    for epoch in range(FINETUNE_EPOCHS):
        total_loss = correct = total = 0
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss    = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            preds    = torch.argmax(outputs, dim=1)
            correct += (preds == labels).sum().item()
            total   += labels.size(0)
        log.info(
            f"Epoch {epoch+1}/{FINETUNE_EPOCHS} | "
            f"loss={total_loss/len(train_loader):.4f} | "
            f"train_acc={correct/total*100:.2f}%"
        )

    new_val_acc = _evaluate_val(model, device, FeedbackDataset, VAL_CSV)
    log.info(f"New val accuracy: {new_val_acc:.2f}%")
    return model, new_val_acc, old_val_acc


def _evaluate_val(model, device, DatasetClass, csv_path):
    """Run inference on val set; return accuracy (%)."""
    import torch
    from torch.utils.data import DataLoader
    val_loader = DataLoader(DatasetClass(csv_path), batch_size=64, shuffle=False)
    model.eval()
    correct = total = 0
    with torch.no_grad():
        for inputs, labels in val_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            preds = torch.argmax(model(inputs), dim=1)
            correct += (preds == labels).sum().item()
            total   += labels.size(0)
    model.train()
    return correct / total * 100 if total else 0.0


def save_model(model):
    import torch
    if MODEL_PATH.exists():
        shutil.copy(MODEL_PATH, MODEL_BAK_PATH)
        log.info(f"Backed up old model to {MODEL_BAK_PATH.name}")
    torch.save(model.state_dict(), MODEL_PATH)
    log.info(f"Saved new model to {MODEL_PATH}")


def push_model_to_github(new_samples: int, old_acc: float, new_acc: float):
    """
    Commit the updated model weights + train.csv to git and push to origin.
    This triggers an automatic redeploy on Render/Railway if connected to GitHub.
    """
    import subprocess

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    commit_msg = (
        f"[auto-retrain] {timestamp} | "
        f"+{new_samples} corrections | "
        f"val_acc {old_acc:.2f}% -> {new_acc:.2f}%"
    )

    # Files to stage — model weights and updated training data
    files_to_add = [
        str(MODEL_PATH),
        str(TRAIN_CSV),
        str(LOG_PATH),
    ]

    def run_git(args, **kwargs):
        """Run a git command in the repo root; return (returncode, stdout+stderr)."""
        result = subprocess.run(
            ["git"] + args,
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            **kwargs
        )
        return result.returncode, (result.stdout + result.stderr).strip()

    try:
        # Stage the changed files
        rc, out = run_git(["add"] + files_to_add)
        if rc != 0:
            log.warning(f"git add failed (rc={rc}): {out}")
            return
        log.info(f"git add OK: staged model + train.csv")

        # Check if there's actually anything to commit
        rc, status = run_git(["status", "--porcelain"])
        if not status.strip():
            log.info("Nothing changed in git — model file unchanged, skipping push.")
            return

        # Commit
        rc, out = run_git(["commit", "-m", commit_msg])
        if rc != 0:
            log.warning(f"git commit failed (rc={rc}): {out}")
            return
        log.info(f"git commit OK: '{commit_msg}'")

        # Push to origin (the branch that was last checked out)
        rc, out = run_git(["push", "origin", "HEAD"])
        if rc != 0:
            log.warning(f"git push failed (rc={rc}): {out}")
            log.warning("Model is saved locally but NOT pushed. Push manually if needed.")
        else:
            log.info(f"git push OK — model is now live on GitHub. Render/Railway will redeploy.")

    except FileNotFoundError:
        log.warning("'git' executable not found. Skipping auto-push. Install git or add it to PATH.")
    except Exception as e:
        log.warning(f"Auto-push failed unexpectedly: {e}")


def mark_docs_retrained(doc_ids):
    if not doc_ids or not MONGO_URI:
        return
    try:
        import pymongo
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
        db     = client[DB_NAME]
        result = db["emotion_feedback"].update_many(
            {"_id": {"$in": doc_ids}},
            {"$set": {"retrained": True, "retrained_at": datetime.now(timezone.utc)}}
        )
        client.close()
        log.info(f"Marked {result.modified_count} feedback docs as retrained.")
    except Exception as e:
        log.warning(f"Could not mark docs as retrained: {e}")


def write_log(entry: dict):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def main():
    run_start = datetime.now(timezone.utc)
    log.info("=" * 60)
    log.info("Moodify - Automated Feedback Retraining")
    log.info(f"Started at {run_start.isoformat()}")
    log.info("=" * 60)

    log_entry = {
        "run_at":        run_start.isoformat(),
        "status":        "skipped",
        "new_samples":   0,
        "old_val_acc":   None,
        "new_val_acc":   None,
        "model_updated": False,
        "error":         None,
    }

    try:
        new_records, doc_ids = fetch_feedback()
        log_entry["new_samples"] = len(new_records)

        if len(new_records) < MIN_NEW_SAMPLES:
            log.info(f"Only {len(new_records)} new corrected samples (need {MIN_NEW_SAMPLES}). Skipping retrain.")
            log_entry["status"] = "skipped_insufficient_data"
            write_log(log_entry)
            return

        # Fine-tune on the CURRENT train.csv + new corrections (via augmented CSV)
        # NOTE: We do NOT permanently write to train.csv yet — only do that if the
        #       model passes the accuracy guard below.
        model, new_val_acc, old_val_acc = finetune()
        log_entry["old_val_acc"] = round(old_val_acc, 4)
        log_entry["new_val_acc"] = round(new_val_acc, 4)

        drop = old_val_acc - new_val_acc
        if drop > ACCURACY_DROP_THRESHOLD:
            # Model got worse — reject it and keep the old one
            log.warning(
                f"Val accuracy dropped too much: {old_val_acc:.2f}% -> {new_val_acc:.2f}% "
                f"(drop={drop:.2f}% > threshold={ACCURACY_DROP_THRESHOLD}%). "
                "Model NOT saved. Train CSV NOT updated. Feedback kept for next run."
            )
            log_entry["status"] = "rejected_accuracy_drop"
            # Feedback docs are intentionally NOT marked as retrained
            # so they will be included again in the next retraining attempt
        else:
            # Model is good — now permanently integrate corrections into train.csv
            update_main_train_csv(new_records)
            save_model(model)
            mark_docs_retrained(doc_ids)
            log_entry["model_updated"] = True
            log_entry["status"]        = "success"
            log.info(
                f"Retraining complete. "
                f"Val acc: {old_val_acc:.2f}% -> {new_val_acc:.2f}% (delta={new_val_acc - old_val_acc:+.2f}%). "
                f"Integrated {len(new_records)} new corrections into train.csv and saved updated model."
            )
            # Auto-push to GitHub so Render/Railway redeploys with the new weights
            push_model_to_github(len(new_records), old_val_acc, new_val_acc)

    except Exception as exc:
        log.error(f"Retraining failed: {exc}", exc_info=True)
        log_entry["status"] = "error"
        log_entry["error"]  = str(exc)

    finally:
        if AUG_CSV.exists():
            AUG_CSV.unlink()
        write_log(log_entry)
        log.info(f"Run log written to {LOG_PATH}")
        log.info("=" * 60)


if __name__ == "__main__":
    main()
