week 1 & 2 
# Emotion Model

Emotion detection model for the Mood Detecting Music Player project.

## Structure

```
emotion-model/
├── data/
│   ├── raw/
│   │   └── emotions.csv
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

training approach
"I had an amazing day"
          │
          ▼
      TOKENIZER
          │
          ▼
["I", "had", "an", "amazing", "day"]
          │
          ▼
[12, 45, 78, 23, 91]
          │
          ▼
     EMBEDDING
          │
          ▼
Numerical vectors
          │
          ▼
        LSTM
          │
          ▼
Sentence representation
          │
          ▼
      DENSE LAYER
          │
          ▼
    Raw emotion scores
          │
          ▼
       SOFTMAX
          │
          ▼
 ┌─────────────────────┐
 │ Joy       82%       │
 │ Love       8%       │
 │ Surprise   5%       │
 │ Sadness    3%       │
 │ Anger      1%       │
 │ Fear       1%       │
 └─────────────────────┘
 
WEEK 1
Research
├── Sentiment vs emotion       ✅
├── Dataset research           ✅
├── Fine-tuning concept        ✅
└── Evaluation metrics         ✅

WEEK 2
Dataset preparation
├── Download dataset            ✅
├── TXT → CSV                   ✅
├── Train split                 ✅
├── Validation split            ✅
├── Test split                  ✅
├── preprocessing.py            ✅


week 3
├── Tokenization & Vocabulary Building ✅
├── Word → Token ID Conversion ✅
├── <PAD> and <UNK> Token Handling ✅
├── Vocabulary saved as vocabulary.json ✅
├── dataset.py ✅
├── Text → Numerical Sequence ✅
├── Sequence Padding ✅
├── Emotion Labels → Numerical Labels ✅
├── PyTorch Dataset & DataLoader ✅


WEEK 4
Model Building & Training
├── model.py                    ✅
├── train.py                    ✅
├── evaluate.py                 ✅
└── predict.py                  ✅


WEEK 5
Model Improvement & Deployment Preparation
├── Model Performance Analysis          ⬅️
├── Hyperparameter Tuning               ⬅️
├── Architecture Experiments           ⬅️
├── Overfitting / Underfitting Analysis ⬅️
├── Performance Visualization           ⬅️
├── Error Analysis                      ⬅️
├── Save Best Model                     ⬅️
└── Prepare Model for Integration       ⬅️