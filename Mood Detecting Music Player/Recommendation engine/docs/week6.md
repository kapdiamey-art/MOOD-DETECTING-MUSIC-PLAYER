# Week 6 — ML Emotion + Recommendation Pipeline Integration

## 1. Objective

The objective of Week 6 was to integrate the Emotion Detection Model with the Recommendation Engine.

The completed pipeline takes a user's natural-language description of their current feeling, predicts an emotion using the ML model, maps the predicted emotion to the recommendation engine's emotion labels, and generates personalized music recommendations based on the detected emotion and optional user preferences.

---

## 2. Integrated Pipeline

The Week 6 pipeline is:

User text
↓
Emotion Detection Model
↓
Predicted emotion + confidence
↓
Emotion label mapping
↓
Recommendation Engine
↓
Mood-based ranking
↓
Genre / Artist personalization
↓
Top 5 recommended songs

The integration is implemented in:

`src/week6_integration.py`

---

## 3. Emotion Detection

The Emotion Detection Model accepts raw natural-language text.

Example inputs tested:

- `bored and unhappy`
- `joy`
- `sad and depressed`
- `i feel really happy today`
- `i feel energetic`
- `angry`
- `confused and ashtonished`

The model returns an emotion and confidence score.

The supported ML emotion labels are:

- sadness
- joy
- love
- anger
- fear
- surprise

---

## 4. Emotion Label Mapping

The Emotion Detection Model uses the label:

`anger`

The Recommendation Engine uses:

`angry`

Therefore, the Week 6 integration performs the following mapping:

`anger → angry`

The other supported emotion labels are passed through without modification.

This ensures compatibility between the two modules.

---

## 5. Recommendation Engine Integration

After detecting the emotion, the predicted emotion is passed to the Recommendation Engine.

The Recommendation Engine uses precomputed mood scores in:

`data/processed/music_dataset_expanded.csv`

The mood-related columns are:

- `mood_joy`
- `mood_angry`
- `mood_love`
- `mood_surprise`
- `mood_fear`
- `mood_sadness`
- `primary_mood`

The appropriate mood score is used according to the detected emotion.

---

## 6. User Preferences

The Week 6 interface supports two optional user preferences:

### Genre Preference

The user can enter a preferred genre such as:

- pop
- k-pop
- indie
- rock
- alternative

The user can also enter:

`none`

or leave the field blank to indicate no genre preference.

### Artist Preference

The user can enter an artist such as:

- Taylor Swift
- Lana Del Rey
- Billie Eilish
- Lorde
- BTS

The user can also enter:

`none`

or leave the field blank to indicate no artist preference.

Partial artist matching is supported. For example, entering `lana` can match Lana Del Rey.

---

## 7. Personalized Recommendation Ranking

Recommendations are ranked using multiple factors.

The current ranking considers:

- mood similarity
- genre preference
- language preference
- artist preference
- audio-feature similarity
- popularity
- recency
- feedback

Mood similarity is the primary component of the recommendation score.

When an artist preference is supplied and matching tracks exist, the recommendation engine restricts recommendations to the matching artist pool.

Genre preferences influence the ranking when provided.

---

## 8. Week 6 Validation Tests

### Test 1 — Sadness + Alternative + Lana Del Rey

Input:

`bored and unhappy`

Genre:

`alternative`

Artist:

`lana`

Result:

- ML emotion: sadness
- Confidence: 92.79%
- Mapped emotion: sadness
- Five Lana Del Rey recommendations returned

Top recommendation:

`Video Games — Lana Del Rey`

Mood score:

`0.829474`

---

### Test 2 — Joy + Taylor

Input:

`joy`

Genre:

`none`

Artist:

`taylor`

Result:

- ML emotion: joy
- Confidence: 81.46%
- Mapped emotion: joy
- Five matching Taylor-related recommendations returned

The partial artist matching allows artists containing `Taylor` in their artist name to be considered.

Examples included:

- Taylor Swift
- Ebo Taylor

This behavior is intentional.

---

### Test 3 — Sadness + Billie

Input:

`sad and depressed`

Genre:

`billie`

Artist:

`billie`

Result:

- ML emotion: sadness
- Confidence: 99.58%
- Mapped emotion: sadness
- Billie-related recommendations returned

Top recommendation:

`Happier Than Ever — Billie Eilish`

Mood score:

`0.836201`

---

### Test 4 — Joy Without Preferences

Input:

`i feel really happy today`

Genre:

`none`

Artist:

blank

Result:

- ML emotion: joy
- Confidence: 100.00%
- Mapped emotion: joy
- Five recommendations returned

The engine successfully operated without genre or artist restrictions.

---

### Test 5 — Joy + Rock

Input:

`i feel energetic`

Genre:

`rock`

Artist:

blank

Result:

- ML emotion: joy
- Confidence: 100.00%
- Mapped emotion: joy
- Rock-related recommendations returned

Example:

`Sweet Dreams (Are Made of This) - Remastered`

Genre:

`rock`

Mood score:

`0.921674`

---

### Test 6 — Sadness + Lana Del Rey

Input:

`i feel heartbroen`

Genre:

`none`

Artist:

`lana`

Result:

- ML emotion: sadness
- Confidence: 92.97%
- Mapped emotion: sadness
- Five Lana Del Rey recommendations returned

Top recommendation:

`Video Games — Lana Del Rey`

Mood score:

`0.829474`

---

### Test 7 — Joy + Lana Del Rey

Input:

`happy`

Genre:

`none`

Artist:

`lana`

Result:

- ML emotion: joy
- Confidence: 99.58%
- Mapped emotion: joy
- Five Lana Del Rey recommendations returned

Top recommendation:

`Diet Mountain Dew — Lana Del Rey`

Mood score:

`0.642081`

---

### Test 8 — Joy + Taylor

Input:

`energetic`

Genre:

`none`

Artist:

`taylor`

Result:

- ML emotion: joy
- Confidence: 99.37%
- Mapped emotion: joy
- Taylor-related recommendations returned

Top recommendation:

`Stay Stay Stay — Taylor Swift`

Mood score:

`0.901116`

---

### Test 9 — Anger + Taylor

Input:

`angry`

Genre:

`none`

Artist:

`taylor`

Result:

- ML emotion: anger
- Confidence: 98.98%
- Mapped emotion: angry
- Taylor-related recommendations returned

Top recommendation:

`Out Of The Woods (Taylor's Version) — Taylor Swift`

Mood score:

`0.883828`

This test also verified the `anger → angry` emotion mapping.

---

### Test 10 — Fear + Lorde

Input:

`confused and ashtonished`

Genre:

`none`

Artist:

`lorde`

Result:

- ML emotion: fear
- Confidence: 86.31%
- Mapped emotion: fear
- Five Lorde recommendations returned

Top recommendation:

`Ribs — Lorde`

Mood score:

`0.680480`

---

## 9. Validation Summary

The Week 6 integration successfully demonstrated:

- ML model loading
- Natural-language emotion prediction
- Emotion confidence calculation
- Emotion label compatibility between modules
- `anger → angry` mapping
- Precomputed mood-score usage
- Genre personalization
- Artist personalization
- Partial artist matching
- `none` and blank preference handling
- Mood-based recommendation ranking
- Top-5 recommendation generation
- End-to-end ML → Recommendation Engine execution
- Successful execution without runtime errors during final validation

---

## 10. Files Used

### ML Model

`Emotion Detection Model/src/predict.py`

`Emotion Detection Model/src/model.py`

`Emotion Detection Model/models/emotion_model.pth`

`Emotion Detection Model/models/vocabulary.json`

### Recommendation Engine

`Recommendation engine/src/recommendation.py`

`Recommendation engine/src/week6_integration.py`

### Dataset

`Recommendation engine/data/processed/music_dataset_expanded.csv`

The expanded dataset contains approximately 113K tracks and includes additional tracks for selected artists.

---

## 11. Week 6 Outcome

Week 6 successfully completed the integration between the Emotion Detection Model and the Music Recommendation Engine.

The system can now accept a user's natural-language emotional input, detect the user's emotion, and generate personalized music recommendations using the detected emotion together with optional genre and artist preferences.

This establishes the core end-to-end recommendation pipeline for the Mood Detecting Music Player.

## Status

**Week 6: COMPLETE**
