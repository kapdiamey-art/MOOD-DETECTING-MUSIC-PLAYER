"""
Self-Training PyTorch Model From Scratch
----------------------------------------
Trains an upgraded PyTorch BiLSTM + Multi-Head Self-Attention model from scratch.
Does NOT use any 3rd party pre-trained weights (BERT/Transformer downloads).

Key Features:
- Bidirectional LSTM (Captures past + future context)
- Multi-Head Self-Attention (Attends to key emotion words in sequence)
- Label Smoothing Cross-Entropy Loss (Prevents overconfidence)
- AdamW Optimizer with Weight Decay & Cosine Annealing Scheduler

Usage:
    python train_from_scratch.py
"""

import os
import sys
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import CosineAnnealingLR

# Path setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.join(BASE_DIR, "src") not in sys.path:
    sys.path.insert(0, os.path.join(BASE_DIR, "src"))

from dataset import create_dataloaders
from model import SelfTrainedAttentionEmotionModel


def train_model():
    print("=" * 70)
    print("SELF-TRAINING PYTORCH MODEL FROM SCRATCH")
    print("=" * 70)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}")

    # Load vocabulary
    vocab_path = os.path.join(BASE_DIR, "models", "vocabulary.json")
    with open(vocab_path, "r", encoding="utf-8") as f:
        word_to_index = json.load(f)
    vocab_size = len(word_to_index)
    print(f"Loaded vocabulary size: {vocab_size:,} tokens")

    # Load DataLoaders
    batch_size = 32
    max_length = 50
    print("\nLoading datasets...")
    train_loader, val_loader, test_loader = create_dataloaders(batch_size=batch_size, max_length=max_length)

    # Initialize model from scratch
    model = SelfTrainedAttentionEmotionModel(vocab_size=vocab_size, embedding_dim=128, hidden_dim=128, num_classes=7)
    model = model.to(device)

    # Label Smoothing Cross-Entropy Loss to prevent overconfidence
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # AdamW Optimizer + Weight Decay
    optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

    # Cosine Annealing Learning Rate Scheduler
    epochs = 30
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)

    best_val_acc = 0.0

    print(f"\nStarting training loop for {epochs} epochs...")
    for epoch in range(epochs):
        model.train()
        total_loss, correct, total = 0.0, 0, 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()

            # Gradient Clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            total_loss += loss.item()
            preds = torch.argmax(outputs, dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

        train_acc = (correct / total) * 100
        avg_train_loss = total_loss / len(train_loader)

        # Validation Pass
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                preds = torch.argmax(outputs, dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

        val_acc = (val_correct / val_total) * 100
        scheduler.step()

        print(f"Epoch [{epoch+1:02d}/{epochs}] | Train Loss: {avg_train_loss:.4f} | Train Acc: {train_acc:.2f}% | Val Acc: {val_acc:.2f}%")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_path = os.path.join(BASE_DIR, "models", "emotion_model.pth")
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            torch.save(model.state_dict(), save_path)

    print(f"\nTraining Complete! Best Validation Accuracy achieved: {best_val_acc:.2f}%")
    print(f"Saved self-trained model checkpoint to: models/emotion_model.pth")


if __name__ == "__main__":
    train_model()
