import pandas as pd
import torch

from torch.utils.data import Dataset, DataLoader

import json
import re


# 1. Tokenization function

def tokenize(text):
    """
    Convert a sentence into a list of lowercase words.
    """

    text = text.lower()

    tokens = re.findall(
        r"\b\w+(?:'\w+)?\b",
        text
    )

    return tokens



# 2. Load vocabulary


with open(
    "models/vocabulary.json",
    "r",
    encoding="utf-8"
) as file:

    word_to_index = json.load(file)


print("Vocabulary loaded!")
print("Vocabulary size:", len(word_to_index))


# 3. Emotion labels


LABEL_MAP = {
    "sadness": 0,
    "joy": 1,
    "love": 2,
    "anger": 3,
    "fear": 4,
    "surprise": 5
}


# 4. Convert text into numerical sequence


def text_to_sequence(text):

    tokens = tokenize(text)

    sequence = [
        word_to_index.get(
            token,
            word_to_index["<UNK>"]
        )
        for token in tokens
    ]

    return sequence


# 5. Padding function


def pad_sequence(sequence, max_length):

    # If sequence is longer than maximum length
    if len(sequence) > max_length:

        sequence = sequence[:max_length]

    # If sequence is shorter
    else:

        padding_length = max_length - len(sequence)

        sequence = sequence + [
            word_to_index["<PAD>"]
        ] * padding_length

    return sequence


# 6. Custom Emotion Dataset


class EmotionDataset(Dataset):

    def __init__(
        self,
        csv_file,
        max_length=50
    ):

        # Load CSV
        self.data = pd.read_csv(csv_file)

        self.max_length = max_length

        print(
            f"Loaded {csv_file}: "
            f"{len(self.data)} examples"
        )


   
    # Number of examples

    def __len__(self):

        return len(self.data)

    # Get one example


    def __getitem__(self, index):

        # Get text
        text = str(
            self.data.iloc[index]["text"]
        )

        # Get emotion
        emotion = self.data.iloc[index]["emotion"]

        # Convert emotion to numerical label
        label = LABEL_MAP[emotion]

        # Convert text to token IDs
        sequence = text_to_sequence(text)

        # Pad sequence
        sequence = pad_sequence(
            sequence,
            self.max_length
        )

        # Convert input to tensor
        input_ids = torch.tensor(
            sequence,
            dtype=torch.long
        )

        # Convert label to tensor
        label = torch.tensor(
            label,
            dtype=torch.long
        )

        return input_ids, label


# 7. Create DataLoaders

def create_dataloaders(
    batch_size=32,
    max_length=50
):

    # Create datasets

    train_dataset = EmotionDataset(
        "data/processed/train.csv",
        max_length
    )

    val_dataset = EmotionDataset(
        "data/processed/val.csv",
        max_length
    )

    test_dataset = EmotionDataset(
        "data/processed/test.csv",
        max_length
    )


    # Create DataLoaders

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False
    )

    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False
    )


    return (
        train_loader,
        val_loader,
        test_loader
    )


# 8. Test Dataset


if __name__ == "__main__":

    print("\nCreating DataLoaders...\n")

    train_loader, val_loader, test_loader = \
        create_dataloaders(
            batch_size=32,
            max_length=50
        )


    # Get one batch
    inputs, labels = next(
        iter(train_loader)
    )


    print("\nDataset test successful!")

    print(
        "Input shape:",
        inputs.shape
    )

    print(
        "Label shape:",
        labels.shape
    )

    print("\nFirst input:")
    print(inputs[0])

    print("\nFirst label:")
    print(labels[0])

    print("\nFirst 5 labels:")
    print(labels[:5])