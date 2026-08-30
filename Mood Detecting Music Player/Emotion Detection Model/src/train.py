import torch
import torch.nn as nn
import torch.optim as optim

import json
import os

from dataset import create_dataloaders
from model import EmotionModel



# 1. Configuration


BATCH_SIZE = 32
MAX_LENGTH = 50

EMBEDDING_DIM = 128
HIDDEN_DIM = 128

NUM_CLASSES = 6

LEARNING_RATE = 0.001
EPOCHS = 15



# 2. Device
device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

print("Using device:", device)



# 3. Load vocabulary


with open(
    "models/vocabulary.json",
    "r",
    encoding="utf-8"
) as file:

    word_to_index = json.load(file)


vocab_size = len(word_to_index)

print("Vocabulary size:", vocab_size)



# 4. Create DataLoaders


train_loader, val_loader, test_loader = \
    create_dataloaders(
        batch_size=BATCH_SIZE,
        max_length=MAX_LENGTH
    )



# 5. Create Model


model = EmotionModel(
    vocab_size=vocab_size,
    embedding_dim=EMBEDDING_DIM,
    hidden_dim=HIDDEN_DIM,
    num_classes=NUM_CLASSES
)

model = model.to(device)

print("\nModel created successfully!")
print(model)



# 6. Loss Function

criterion = nn.CrossEntropyLoss()

# 7. Optimizer


optimizer = optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)



# 8. Training Loop

for epoch in range(EPOCHS):

    model.train()

    total_loss = 0
    correct = 0
    total = 0


    for inputs, labels in train_loader:

        # Move data to CPU/GPU
        inputs = inputs.to(device)
        labels = labels.to(device)


        # Clear previous gradients
        optimizer.zero_grad()


        # Forward pass
        outputs = model(inputs)


        # Calculate loss
        loss = criterion(
            outputs,
            labels
        )


        # Backpropagation
        loss.backward()


        # Update model parameters
        optimizer.step()


        # Track loss
        total_loss += loss.item()


        # Calculate predictions
        predictions = torch.argmax(
            outputs,
            dim=1
        )


        # Calculate accuracy
        total += labels.size(0)

        correct += (
            predictions == labels
        ).sum().item()


    # Calculate epoch results

    average_loss = (
        total_loss / len(train_loader)
    )

    accuracy = (
        correct / total
    ) * 100


    # Validation


    model.eval()

    val_correct = 0
    val_total = 0


    with torch.no_grad():

        for inputs, labels in val_loader:

            inputs = inputs.to(device)
            labels = labels.to(device)


            outputs = model(inputs)


            predictions = torch.argmax(
                outputs,
                dim=1
            )


            val_total += labels.size(0)

            val_correct += (
                predictions == labels
            ).sum().item()


    val_accuracy = (
        val_correct / val_total
    ) * 100


    print(
        f"\nEpoch [{epoch + 1}/{EPOCHS}]"
    )

    print(
        f"Training Loss: {average_loss:.4f}"
    )

    print(
        f"Training Accuracy: {accuracy:.2f}%"
    )

    print(
        f"Validation Accuracy: {val_accuracy:.2f}%"
    )



# 9. Save trained model


os.makedirs(
    "models",
    exist_ok=True
)

torch.save(
    model.state_dict(),
    "models/emotion_model.pth"
)

print(
    "\nModel saved successfully!"
)

print(
    "Location: models/emotion_model.pth"
)