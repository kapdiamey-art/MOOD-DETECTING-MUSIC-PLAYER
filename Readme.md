# 🎵 Mood Detecting Music Player

An AI-powered music player that detects the user's **emotion from text** and recommends music based on their current mood.

The project uses a **custom Emotion Detection Model built from scratch using PyTorch and LSTM**, combined with a recommendation engine and music player.

---

## 🚀 Project Overview

The system follows:

```text
User Input
    ↓
Text / Voice
    ↓
Emotion Detection Model
    ↓
Detected Emotion
    ↓
Recommendation Engine
    ↓
Recommended Songs
    ↓
Music Player
```

---

# 🏗️ Overall System Architecture
                    ┌─────────────────────┐
                    │      USER           │
                    │                     │
                    │ Text / Voice Input  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FRONTEND       │
                    │     React.js        │
                    │                     │
                    │ Mood Input / Player │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       BACKEND       │
                    │     FastAPI         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ EMOTION DETECTION   │
                    │      MODEL          │
                    │                     │
                    │ Tokenizer           │
                    │      ↓              │
                    │ Embedding           │
                    │      ↓              │
                    │ LSTM                │
                    │      ↓              │
                    │ Emotion             │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ EMOTION RESULT      │
                    │                     │
                    │ Joy / Sadness /     │
                    │ Anger / Fear /      │
                    │ Love / Surprise     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ RECOMMENDATION      │
                    │ ENGINE              │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             User Preferences       Emotion → Music
                    │                     │
                    └──────────┬──────────┘
                               ▼
                    ┌───────────────────────────--┐
                    │ SONG DATABASE / SPOTIFY API │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ RECOMMENDED SONGS   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     MUSIC PLAYER    │
                    │                     │
                    │ ▶ Play              │
                    │ ⏸ Pause             │
                    │ ⏭ Next              │
                    │ 🔊 Volume           │
                    └─────────────────────┘

---

# 🧠 Emotion Detection Model

The emotion model is developed **from scratch using PyTorch**.

### ML Pipeline

```text
Input Text
    ↓
Preprocessing
    ↓
Tokenization
    ↓
Token IDs
    ↓
Padding
    ↓
Embedding Layer
    ↓
LSTM
    ↓
Fully Connected Layer
    ↓
Softmax
    ↓
Predicted Emotion
```

### Supported Emotions

The current dataset contains:

```text
Sadness
Anger
Surprise
Joy
Love
Fear
```

---

# 🎵 Recommendation System

The recommendation engine uses the detected emotion to select suitable music.

```text
Detected Emotion
       +
User Preferences
       +
Listening History
       ↓
Recommendation Engine
       ↓
Recommended Songs
```

Example:

```text
Joy      → Happy / Energetic Songs
Sadness  → Calm / Emotional Songs
Anger    → Powerful / High-Energy Songs
Fear     → Calm / Relaxing Songs
Love     → Romantic Songs
Surprise → Upbeat Songs
```

# 🛠️ Tech Stack

### Machine Learning

* Python
* PyTorch
* LSTM
* Pandas
* NumPy
* Scikit-learn

### Frontend

* React.js
* JavaScript
* CSS / Tailwind CSS

### Backend

* FastAPI
* Python

### Database

* MongoDB

### Tools

* Git
* GitHub
* Jupyter Notebook

---

# 📊 Current Model Performance

The current baseline model achieved:

```text
Training Accuracy   : ~79%
Validation Accuracy : 74.67%
```

The model is currently being improved through further training, testing, and error analysis.

---

# 🔮 Future Scope

* Personalized music recommendations
* Voice-based emotion detection
* Listening-history based recommendations
* Facial emotion detection
* Improved NLP model
* Real-time mood detection
* Mobile application

---

## 🎯 Goal

> **Understand the Mood. Play the Moment.**

The goal is to create a music player that understands the user's current emotional state and provides a more personalized listening experience.
