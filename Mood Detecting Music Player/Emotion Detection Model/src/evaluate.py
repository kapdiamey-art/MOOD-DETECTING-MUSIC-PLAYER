import json
from pathlib import Path

import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score

from dataset import create_dataloaders
from model import EmotionModel

BASE_DIR = Path(__file__).resolve().parent.parent
BATCH_SIZE, MAX_LENGTH = 32, 50
EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES = 128, 128, 6
CONFIDENCE_THRESHOLD, MARGIN_THRESHOLD = 0.70, 0.15
LABEL_NAMES = ["sadness", "joy", "love", "anger", "fear", "surprise"]

# Evaluation-only inputs: they are never written to, or loaded from, training data.
ROBUSTNESS_CASES = {
    "clear emotion": ["I am extremely happy today.", "I am furious.", "I feel completely alone.", "I am terrified.", "I love this so much.", "I can't believe this happened!"],
    "neutral": ["I am going to college today.", "The laptop is on the table.", "The meeting starts at 10."],
    "ambiguous": ["I don't know how I feel.", "Something feels different today.", "I can't explain what I'm feeling."],
    "nonsense": ["asdfghjkl", "qwertyuiop", "#$%^&*()"],
    "difficult": ["I am about to kill someone.", "I got exactly what I wanted but I feel empty.", "I can't stop crying but I don't know why."],
}


def evaluate():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    with open(BASE_DIR / "models" / "vocabulary.json", encoding="utf-8") as file:
        vocab_size = len(json.load(file))
    _, _, test_loader = create_dataloaders(BATCH_SIZE, MAX_LENGTH)
    model = EmotionModel(vocab_size, EMBEDDING_DIM, HIDDEN_DIM, NUM_CLASSES).to(device)
    model.load_state_dict(torch.load(BASE_DIR / "models" / "emotion_model.pth", map_location=device))
    model.eval()

    predictions, labels, confidences, margins, prediction_details = [], [], [], [], []
    with torch.no_grad():
        for inputs, batch_labels in test_loader:
            probabilities = torch.softmax(model(inputs.to(device)), dim=1)
            values, indices = torch.topk(probabilities, k=2, dim=1)
            predictions.extend(indices[:, 0].cpu().tolist())
            confidences.extend(values[:, 0].cpu().tolist())
            margins.extend((values[:, 0] - values[:, 1]).cpu().tolist())
            labels.extend(batch_labels.tolist())
            prediction_details.extend(
                {
                    "predicted_emotion": LABEL_NAMES[top],
                    "probability": confidence,
                    "second_emotion": LABEL_NAMES[second],
                    "second_probability": second_confidence,
                    "margin": confidence - second_confidence,
                }
                for top, second, confidence, second_confidence in zip(
                    indices[:, 0].cpu().tolist(), indices[:, 1].cpu().tolist(),
                    values[:, 0].cpu().tolist(), values[:, 1].cpu().tolist(),
                )
            )

    print("\nMODEL EVALUATION RESULTS")
    print(f"Accuracy  : {accuracy_score(labels, predictions) * 100:.2f}%")
    print(f"Precision : {precision_score(labels, predictions, average='weighted', zero_division=0) * 100:.2f}%")
    print(f"Recall    : {recall_score(labels, predictions, average='weighted', zero_division=0) * 100:.2f}%")
    print(f"F1 Score  : {f1_score(labels, predictions, average='weighted', zero_division=0) * 100:.2f}%")
    print("\nCLASSIFICATION REPORT")
    print(classification_report(labels, predictions, target_names=LABEL_NAMES, zero_division=0))
    print("CONFUSION MATRIX\nRows = actual, columns = predicted")
    print(confusion_matrix(labels, predictions))
    print("\nPREDICTION CONFIDENCE")
    print(f"Average confidence: {sum(confidences) / len(confidences):.4f}")
    print(f"Minimum confidence: {min(confidences):.4f}")
    print(f"Maximum confidence: {max(confidences):.4f}")
    print(f"Confidence records calculated: {len(prediction_details)}")
    accepted = [i for i, (c, m) in enumerate(zip(confidences, margins)) if c >= CONFIDENCE_THRESHOLD and m >= MARGIN_THRESHOLD]
    print(f"Threshold coverage ({CONFIDENCE_THRESHOLD:.2f}/{MARGIN_THRESHOLD:.2f}): {len(accepted) / len(labels):.2%}")
    if accepted:
        print(f"Accuracy of accepted predictions: {accuracy_score([labels[i] for i in accepted], [predictions[i] for i in accepted]):.2%}")
    print("Confidence-threshold comparison (same margin threshold):")
    for threshold in (0.60, 0.65, 0.70, 0.75):
        threshold_accepted = [i for i, (c, m) in enumerate(zip(confidences, margins)) if c >= threshold and m >= MARGIN_THRESHOLD]
        threshold_accuracy = accuracy_score([labels[i] for i in threshold_accepted], [predictions[i] for i in threshold_accepted]) if threshold_accepted else 0
        print(f"  {threshold:.2f}: coverage {len(threshold_accepted) / len(labels):.2%}, accepted accuracy {threshold_accuracy:.2%}")

    from predict import predict_emotion
    print("\nROBUSTNESS TEST SET (not training data)")
    print("Input | Prediction | Confidence | Second Prediction | Margin | Status")
    for category, texts in ROBUSTNESS_CASES.items():
        print(f"[{category}]")
        for text in texts:
            result = predict_emotion(text)
            print(f"{text!r} | {result.get('emotion')} | {result.get('confidence', 0):.4f} | {result.get('second_emotion', '-')} | {result.get('margin', 0):.4f} | {result['status']}")


if __name__ == "__main__":
    evaluate()
