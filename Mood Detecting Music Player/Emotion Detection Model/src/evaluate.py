import torch
import torch.nn as nn

import json

from dataset import create_dataloaders
from model import EmotionModel

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)



# 1. Configuration


BATCH_SIZE = 32
MAX_LENGTH = 50

EMBEDDING_DIM = 128
HIDDEN_DIM = 128

NUM_CLASSES = 6



# 2. Emotion Labels


LABEL_NAMES = [
    "sadness",
    "joy",
    "love",
    "anger",
    "fear",
    "surprise"
]



# 3. Select Device


device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)


# 4. Load Vocabulary


with open(
    "models/vocabulary.json",
    "r",
    encoding="utf-8"
) as file:

    word_to_index = json.load(file)


vocab_size = len(word_to_index)

print("Vocabulary size:", vocab_size)


# 5. Load Test Dataset


_, _, test_loader = create_dataloaders(
    batch_size=BATCH_SIZE,
    max_length=MAX_LENGTH
)



# 6. Create Model


model = EmotionModel(
    vocab_size=vocab_size,
    embedding_dim=EMBEDDING_DIM,
    hidden_dim=HIDDEN_DIM,
    num_classes=NUM_CLASSES
)

model = model.to(device)


# 7. Load Trained Model


model.load_state_dict(
    torch.load(
        "models/emotion_model.pth",
        map_location=device
    )
)

print("\nTrained model loaded successfully!")



# 8. Evaluation Mode


model.eval()


all_predictions = []
all_labels = []


# 9. Test Model


with torch.no_grad():

    for inputs, labels in test_loader:

        # Move data to device
        inputs = inputs.to(device)
        labels = labels.to(device)


        # Get predictions
        outputs = model(inputs)


        # Select class with highest score
        predictions = torch.argmax(
            outputs,
            dim=1
        )


        # Store predictions and actual labels
        all_predictions.extend(
            predictions.cpu().numpy()
        )

        all_labels.extend(
            labels.cpu().numpy()
        )



# 10. Calculate Metrics


accuracy = accuracy_score(
    all_labels,
    all_predictions
)

precision = precision_score(
    all_labels,
    all_predictions,
    average="weighted",
    zero_division=0
)

recall = recall_score(
    all_labels,
    all_predictions,
    average="weighted",
    zero_division=0
)

f1 = f1_score(
    all_labels,
    all_predictions,
    average="weighted",
    zero_division=0
)


# 11. Display Overall Results

print("\n" + "=" * 50)
print("MODEL EVALUATION RESULTS")
print("=" * 50)

print(
    f"Accuracy  : {accuracy * 100:.2f}%"
)

print(
    f"Precision : {precision * 100:.2f}%"
)

print(
    f"Recall    : {recall * 100:.2f}%"
)

print(
    f"F1 Score  : {f1 * 100:.2f}%"
)


# 12. Classification Report


print("\n" + "=" * 50)
print("CLASSIFICATION REPORT")
print("=" * 50)

print(
    classification_report(
        all_labels,
        all_predictions,
        target_names=LABEL_NAMES,
        zero_division=0
    )
)


# 13. Confusion Matrix


print("\n" + "=" * 50)
print("CONFUSION MATRIX")
print("=" * 50)

cm = confusion_matrix(
    all_labels,
    all_predictions
)

print("\nRows = Actual Emotion")
print("Columns = Predicted Emotion\n")

print(cm)