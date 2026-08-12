# Emotion Model

Emotion detection model for the Mood Detecting Music Player project.

## Structure

```
emotion-model/
├── data/
│   ├── raw/
│   │   └── emotions.csv      ← Kaggle dataset goes here
│   └── processed/
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   └── 02_model_experiments.ipynb
├── src/
│   ├── preprocessing.py
│   ├── train.py
│   ├── evaluate.py
│   └── predict.py
├── models/
├── requirements.txt
└── README.md
```

## Setup

```bash
pip install -r requirements.txt
```

## Usage

1. Place the Kaggle emotions dataset CSV in `data/raw/emotions.csv`
2. Explore the data using `notebooks/01_data_exploration.ipynb`
3. Train the model: `python src/train.py`
4. Evaluate: `python src/evaluate.py`
5. Predict: `python src/predict.py`
