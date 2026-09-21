# Week 8 — Recommendation Engine Documentation, Evaluation and Finalization

## 1. Objective

The objective of Week 8 was to finalize and document the Recommendation Engine developed during the internship.

The documentation covers the recommendation architecture, emotion-based ranking, user personalization, feedback handling, Spotify metadata integration, evaluation methodology, evaluation results, limitations, and the final integration flow.

The Recommendation Engine is responsible for converting a detected user emotion and optional preferences into a ranked list of music recommendations.

---

## 2. Final Recommendation Pipeline

The final recommendation workflow is:

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
Candidate song selection
↓
Mood similarity scoring
↓
Preference personalization
↓
Feedback scoring
↓
Popularity / recency scoring
↓
Final ranking
↓
Controlled recommendation randomization
↓
Top 15 songs
↓
Spotify metadata

The main Recommendation Engine implementation is:

`src/recommendation.py`

The ML-to-Recommendation integration is implemented in:

`src/week6_integration.py`

The recommendation evaluation system is implemented in:

`src/evaluate_recommendations.py`

---

## 3. Dataset

The final recommendation dataset is:

`data/processed/music_dataset_expanded.csv`

The dataset contains the original cleaned Spotify track dataset together with additional selected-artist tracks.

The dataset contains audio characteristics used by the recommendation system, including:

- energy
- valence
- danceability
- acousticness
- popularity
- tempo
- instrumentalness
- speechiness
- liveness
- track genre
- artist
- track name

Mood scores were generated for:

- joy
- angry
- love
- surprise
- fear
- sadness

The dataset also contains:

`primary_mood`

which represents the strongest calculated mood for a track.

---

## 4. Emotion Profiles

The Recommendation Engine uses emotion-specific target profiles.

### Joy

- High energy
- High valence
- High danceability
- Lower acousticness

### Angry

- Very high energy
- Lower valence
- Moderate danceability
- Low acousticness

### Love

- Moderate energy
- High valence
- Moderate-high danceability
- Moderate acousticness

### Surprise

- High energy
- Moderate-high valence
- High danceability
- Low acousticness

### Fear

- Moderate-high energy
- Low valence
- Lower danceability
- Moderate acousticness

### Sadness

- Low energy
- Low valence
- Low danceability
- Higher acousticness

The recommendation engine compares the detected emotion with these characteristics to calculate mood similarity.

---

## 5. Mood Scoring

Mood similarity is the primary component of recommendation ranking.

The audio features used for mood similarity are:

- energy
- valence
- danceability
- acousticness

Different emotions use different feature weights.

This allows the same audio characteristics to have different importance depending on the detected emotion.

For example, energy is particularly important for angry recommendations, while acousticness and valence have greater importance for sadness-related recommendations.

---

## 6. Recommendation Ranking

The final recommendation ranking combines multiple signals.

The base ranking components are:

| Component | Weight |
|---|---:|
| Mood | 0.50 |
| Genre | 0.15 |
| Language | 0.10 |
| Artist | 0.10 |
| Audio | 0.10 |
| Popularity | 0.03 |
| Recency | 0.02 |

User feedback is incorporated through the feedback score during ranking.

Mood similarity remains the primary recommendation signal.

---

## 7. Genre Personalization

Users can optionally provide a preferred genre.

Examples:

- pop
- rock
- alternative
- k-pop
- indie

When a genre preference is provided, matching tracks receive a higher genre score.

The recommendation engine therefore combines the requested emotion with the user's genre preference rather than using a fixed playlist.

---

## 8. Artist Personalization

Users can optionally provide an artist preference.

Examples:

- Taylor Swift
- Lana Del Rey
- Billie Eilish
- Lorde
- BTS

Artist matching supports partial input.

For example:

`lana`

can match:

`Lana Del Rey`

When a matching artist pool exists, the recommendation engine can prioritize recommendations from that artist.

This allows recommendations to remain personalized while still being influenced by the detected emotional state.

---

## 9. Language Personalization

The dataset does not contain a dedicated language column.

Therefore, language matching is implemented as a metadata-based heuristic.

The Hindi-language heuristic considers:

- Hindi-related genres
- known Indian artist metadata
- Devanagari characters in track names or artist information

The implementation intentionally avoids treating generic genres such as:

`indie-pop`

as Hindi.

English matching is treated as the alternative metadata category when the track does not match the Indian/Hindi heuristic.

Because this is a heuristic rather than a dedicated language classification model, language evaluation results should be interpreted accordingly.

---

## 10. Audio Feature Matching

The Recommendation Engine uses audio characteristics to improve recommendations beyond simple genre matching.

The relevant features include:

- energy
- valence
- danceability
- acousticness

The system compares the characteristics of candidate songs with the target characteristics associated with the detected emotion.

This helps distinguish between songs belonging to the same genre but having different emotional characteristics.

---

## 11. Popularity and Recency

Popularity and recency are secondary ranking signals.

Popularity contributes a small portion of the final score so that popular tracks can receive a modest ranking advantage without overriding mood relevance.

Recency is also given a small contribution.

Spotify metadata is stored in:

`data/processed/spotify_metadata.csv`

The metadata includes fields such as:

- track name
- artist
- Spotify ID
- release date
- album name
- recency score
- album image
- preview URL
- Spotify URL

The Spotify metadata is used for recommendation enrichment and presentation.

---

## 12. Recommendation Count and Candidate Pool

The final Recommendation Engine returns:

**15 recommendations**

The candidate pool was increased to:

**100 songs**

before the final recommendation list is selected.

This provides the ranking system with a larger set of candidates before producing the final results.

---

## 13. Controlled Recommendation Randomization

The Recommendation Engine introduces a small controlled random variation after ranking.

The system first sorts songs according to their recommendation score.

A high-quality recommendation pool is then selected from the top candidates.

A small random value is added to the ranking score within this pool.

The random variation is limited so that low-quality songs cannot easily move to the top.

The purpose is to avoid returning exactly the same ordering for repeated requests while preserving recommendation quality.

---

## 14. User Feedback

The Recommendation Engine supports user feedback through:

- liked artists
- liked genres
- liked tracks
- skipped artists
- skipped genres
- skipped tracks

Feedback is converted into a feedback score.

Positive feedback can contribute:

`+1/3`

Negative feedback can contribute:

`-1/3`

when the relevant artist, genre, or track matches.

The feedback score is then incorporated into recommendation ranking.

This allows the recommendation engine to adapt to user interaction instead of relying only on the initial mood and preferences.

---

## 15. Like Feedback Evaluation

The Week 7 evaluation tested a Like interaction using Lana Del Rey.

The baseline recommendation used Lana Del Rey as the artist preference without feedback.

A second recommendation request used the same preference together with:

`liked_artists = ["Lana Del Rey"]`

Results:

- Baseline recommendations: 10/10
- Liked recommendations: 10/10
- Maximum positive feedback score: 0.333
- Average final-score change: +0.0163

The result demonstrates that a positive artist feedback signal is incorporated into recommendation scoring.

---

## 16. Dislike Feedback Evaluation

The Week 7 evaluation tested a Dislike interaction using Taylor Swift.

The baseline recommendation used Taylor Swift as the artist preference without feedback.

A second recommendation request used:

`skipped_artists = ["Taylor Swift"]`

Results:

- Baseline recommendations: 10/10
- Disliked recommendations: 10/10
- Minimum negative feedback score: -0.333
- Average final-score change: -0.2271

The result demonstrates that negative artist feedback reduces the recommendation score for matching tracks.

---

## 17. Evaluation Methodology

The project does not contain human-labelled recommendation ground truth.

Therefore, recommendation quality was evaluated using proxy metrics.

The evaluation script is:

`src/evaluate_recommendations.py`

The evaluation includes:

- Mood Alignment@10
- Genre Match@10
- Artist Match@10
- Language Match@10
- Diversity@10
- Like feedback response
- Dislike feedback response

The evaluation results are stored in:

`data/processed/week7_evaluation_results.csv`

---

## 18. Week 7 Evaluation Results

The final evaluation produced the following average results:

| Metric | Result |
|---|---:|
| Mood Alignment@10 | 86.00% |
| Genre Match@10 | 100.00% |
| Artist Match@10 | 100.00% |
| Language Match@10 | 97.50% |
| Diversity@10 | 42.00% |

These metrics are proxy indicators and should not be interpreted as human-validated recommendation accuracy.

---

## 19. Evaluation Test Cases

The evaluation included the following scenarios:

### Happy mood

Mood Alignment@10:

100%

Diversity@10:

85%

### Sad + Lana Del Rey

Mood Alignment@10:

90%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

10%

### Angry + Rock

Mood Alignment@10:

100%

Genre Match@10:

100%

Language Match@10:

90%

Diversity@10:

80%

### Joy + Taylor Swift

Mood Alignment@10:

50%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

15%

### Sad + Billie Eilish

Mood Alignment@10:

90%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

20%

---

## 20. Week 6 Integration Validation

The Recommendation Engine was integrated with the Emotion Detection Model during Week 6.

The integration supports:

- natural-language emotion input
- emotion prediction
- confidence score
- emotion label mapping
- genre preference
- artist preference
- recommendation generation

The emotion mapping includes:

`anger → angry`

This resolves the difference between the Emotion Detection Model's label and the Recommendation Engine's label.

---

## 21. Example End-to-End Flow

Example user input:

`psychotic as fuck`

Genre:

`alternative`

Artist:

`none`

The ML model produced:

Emotion:

`anger`

Confidence:

`70.40%`

The integration mapped:

`anger → angry`

The Recommendation Engine then produced five test recommendations including:

- Numb — Linkin Park
- Nightmare — Avenged Sevenfold
- Epic - Radio Edit — Faith No More
- POWERLESS — Linkin Park
- The Catalyst — Linkin Park

The final system configuration supports up to 15 recommendations through the Recommendation Engine.

---

## 22. Limitations

### Language Detection

The dataset does not contain an explicit language field.

Language personalization therefore uses metadata heuristics rather than a dedicated language classifier.

### Recommendation Evaluation

There is no human-labelled recommendation ground truth.

The evaluation therefore uses proxy metrics based on the requested mood and preferences.

### Diversity

Strong artist preferences can naturally produce highly concentrated recommendation lists.

For example, the Lana Del Rey and Taylor Swift test cases showed relatively low diversity because the artist preference strongly restricts the recommendation pool.

### Spotify Availability

Spotify metadata enrichment depends on available Spotify metadata/API access.

The recommendation engine can continue operating using local dataset information when Spotify metadata is unavailable.

### Feedback Evaluation

The current feedback evaluation measures the direct effect of artist Like/Dislike signals on recommendation scoring.

It does not represent long-term user behaviour because the project does not contain a large historical user-feedback dataset.

---

## 23. Final Recommendation Engine Architecture

The final Recommendation Engine can be summarized as:

```text
                USER INPUT
                    |
                    v
          Emotion Detection Model
                    |
                    v
          Emotion + Confidence
                    |
                    v
            Emotion Mapping
                    |
                    v
          Candidate Song Pool
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
      Mood       User         Audio
     Matching  Preferences   Similarity
        |           |           |
        +-----------+-----------+
                    |
                    v
             Feedback Score
                    |
                    v
          Popularity / Recency
                    |
                    v
             Final Ranking
                    |
                    v
        Controlled Randomization
                    |
                    v
              Top 15 Songs
                    |
                    v
          Spotify Metadata







cat > docs/week8.md <<'EOF'
# Week 8 — Recommendation Engine Documentation, Evaluation and Finalization

## 1. Objective

The objective of Week 8 was to finalize and document the Recommendation Engine developed during the internship.

The documentation covers the recommendation architecture, emotion-based ranking, user personalization, feedback handling, Spotify metadata integration, evaluation methodology, evaluation results, limitations, and the final integration flow.

The Recommendation Engine is responsible for converting a detected user emotion and optional preferences into a ranked list of music recommendations.

---

## 2. Final Recommendation Pipeline

The final recommendation workflow is:

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
Candidate song selection
↓
Mood similarity scoring
↓
Preference personalization
↓
Feedback scoring
↓
Popularity / recency scoring
↓
Final ranking
↓
Controlled recommendation randomization
↓
Top 15 songs
↓
Spotify metadata

The main Recommendation Engine implementation is:

`src/recommendation.py`

The ML-to-Recommendation integration is implemented in:

`src/week6_integration.py`

The recommendation evaluation system is implemented in:

`src/evaluate_recommendations.py`

---

## 3. Dataset

The final recommendation dataset is:

`data/processed/music_dataset_expanded.csv`

The dataset contains the original cleaned Spotify track dataset together with additional selected-artist tracks.

The dataset contains audio characteristics used by the recommendation system, including:

- energy
- valence
- danceability
- acousticness
- popularity
- tempo
- instrumentalness
- speechiness
- liveness
- track genre
- artist
- track name

Mood scores were generated for:

- joy
- angry
- love
- surprise
- fear
- sadness

The dataset also contains:

`primary_mood`

which represents the strongest calculated mood for a track.

---

## 4. Emotion Profiles

The Recommendation Engine uses emotion-specific target profiles.

### Joy

- High energy
- High valence
- High danceability
- Lower acousticness

### Angry

- Very high energy
- Lower valence
- Moderate danceability
- Low acousticness

### Love

- Moderate energy
- High valence
- Moderate-high danceability
- Moderate acousticness

### Surprise

- High energy
- Moderate-high valence
- High danceability
- Low acousticness

### Fear

- Moderate-high energy
- Low valence
- Lower danceability
- Moderate acousticness

### Sadness

- Low energy
- Low valence
- Low danceability
- Higher acousticness

The recommendation engine compares the detected emotion with these characteristics to calculate mood similarity.

---

## 5. Mood Scoring

Mood similarity is the primary component of recommendation ranking.

The audio features used for mood similarity are:

- energy
- valence
- danceability
- acousticness

Different emotions use different feature weights.

This allows the same audio characteristics to have different importance depending on the detected emotion.

For example, energy is particularly important for angry recommendations, while acousticness and valence have greater importance for sadness-related recommendations.

---

## 6. Recommendation Ranking

The final recommendation ranking combines multiple signals.

The base ranking components are:

| Component | Weight |
|---|---:|
| Mood | 0.50 |
| Genre | 0.15 |
| Language | 0.10 |
| Artist | 0.10 |
| Audio | 0.10 |
| Popularity | 0.03 |
| Recency | 0.02 |

User feedback is incorporated through the feedback score during ranking.

Mood similarity remains the primary recommendation signal.

---

## 7. Genre Personalization

Users can optionally provide a preferred genre.

Examples:

- pop
- rock
- alternative
- k-pop
- indie

When a genre preference is provided, matching tracks receive a higher genre score.

The recommendation engine therefore combines the requested emotion with the user's genre preference rather than using a fixed playlist.

---

## 8. Artist Personalization

Users can optionally provide an artist preference.

Examples:

- Taylor Swift
- Lana Del Rey
- Billie Eilish
- Lorde
- BTS

Artist matching supports partial input.

For example:

`lana`

can match:

`Lana Del Rey`

When a matching artist pool exists, the recommendation engine can prioritize recommendations from that artist.

This allows recommendations to remain personalized while still being influenced by the detected emotional state.

---

## 9. Language Personalization

The dataset does not contain a dedicated language column.

Therefore, language matching is implemented as a metadata-based heuristic.

The Hindi-language heuristic considers:

- Hindi-related genres
- known Indian artist metadata
- Devanagari characters in track names or artist information

The implementation intentionally avoids treating generic genres such as:

`indie-pop`

as Hindi.

English matching is treated as the alternative metadata category when the track does not match the Indian/Hindi heuristic.

Because this is a heuristic rather than a dedicated language classification model, language evaluation results should be interpreted accordingly.

---

## 10. Audio Feature Matching

The Recommendation Engine uses audio characteristics to improve recommendations beyond simple genre matching.

The relevant features include:

- energy
- valence
- danceability
- acousticness

The system compares the characteristics of candidate songs with the target characteristics associated with the detected emotion.

This helps distinguish between songs belonging to the same genre but having different emotional characteristics.

---

## 11. Popularity and Recency

Popularity and recency are secondary ranking signals.

Popularity contributes a small portion of the final score so that popular tracks can receive a modest ranking advantage without overriding mood relevance.

Recency is also given a small contribution.

Spotify metadata is stored in:

`data/processed/spotify_metadata.csv`

The metadata includes fields such as:

- track name
- artist
- Spotify ID
- release date
- album name
- recency score
- album image
- preview URL
- Spotify URL

The Spotify metadata is used for recommendation enrichment and presentation.

---

## 12. Recommendation Count and Candidate Pool

The final Recommendation Engine returns:

**15 recommendations**

The candidate pool was increased to:

**100 songs**

before the final recommendation list is selected.

This provides the ranking system with a larger set of candidates before producing the final results.

---

## 13. Controlled Recommendation Randomization

The Recommendation Engine introduces a small controlled random variation after ranking.

The system first sorts songs according to their recommendation score.

A high-quality recommendation pool is then selected from the top candidates.

A small random value is added to the ranking score within this pool.

The random variation is limited so that low-quality songs cannot easily move to the top.

The purpose is to avoid returning exactly the same ordering for repeated requests while preserving recommendation quality.

---

## 14. User Feedback

The Recommendation Engine supports user feedback through:

- liked artists
- liked genres
- liked tracks
- skipped artists
- skipped genres
- skipped tracks

Feedback is converted into a feedback score.

Positive feedback can contribute:

`+1/3`

Negative feedback can contribute:

`-1/3`

when the relevant artist, genre, or track matches.

The feedback score is then incorporated into recommendation ranking.

This allows the recommendation engine to adapt to user interaction instead of relying only on the initial mood and preferences.

---

## 15. Like Feedback Evaluation

The Week 7 evaluation tested a Like interaction using Lana Del Rey.

The baseline recommendation used Lana Del Rey as the artist preference without feedback.

A second recommendation request used the same preference together with:

`liked_artists = ["Lana Del Rey"]`

Results:

- Baseline recommendations: 10/10
- Liked recommendations: 10/10
- Maximum positive feedback score: 0.333
- Average final-score change: +0.0163

The result demonstrates that a positive artist feedback signal is incorporated into recommendation scoring.

---

## 16. Dislike Feedback Evaluation

The Week 7 evaluation tested a Dislike interaction using Taylor Swift.

The baseline recommendation used Taylor Swift as the artist preference without feedback.

A second recommendation request used:

`skipped_artists = ["Taylor Swift"]`

Results:

- Baseline recommendations: 10/10
- Disliked recommendations: 10/10
- Minimum negative feedback score: -0.333
- Average final-score change: -0.2271

The result demonstrates that negative artist feedback reduces the recommendation score for matching tracks.

---

## 17. Evaluation Methodology

The project does not contain human-labelled recommendation ground truth.

Therefore, recommendation quality was evaluated using proxy metrics.

The evaluation script is:

`src/evaluate_recommendations.py`

The evaluation includes:

- Mood Alignment@10
- Genre Match@10
- Artist Match@10
- Language Match@10
- Diversity@10
- Like feedback response
- Dislike feedback response

The evaluation results are stored in:

`data/processed/week7_evaluation_results.csv`

---

## 18. Week 7 Evaluation Results

The final evaluation produced the following average results:

| Metric | Result |
|---|---:|
| Mood Alignment@10 | 86.00% |
| Genre Match@10 | 100.00% |
| Artist Match@10 | 100.00% |
| Language Match@10 | 97.50% |
| Diversity@10 | 42.00% |

These metrics are proxy indicators and should not be interpreted as human-validated recommendation accuracy.

---

## 19. Evaluation Test Cases

The evaluation included the following scenarios:

### Happy mood

Mood Alignment@10:

100%

Diversity@10:

85%

### Sad + Lana Del Rey

Mood Alignment@10:

90%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

10%

### Angry + Rock

Mood Alignment@10:

100%

Genre Match@10:

100%

Language Match@10:

90%

Diversity@10:

80%

### Joy + Taylor Swift

Mood Alignment@10:

50%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

15%

### Sad + Billie Eilish

Mood Alignment@10:

90%

Artist Match@10:

100%

Language Match@10:

100%

Diversity@10:

20%

---

## 20. Week 6 Integration Validation

The Recommendation Engine was integrated with the Emotion Detection Model during Week 6.

The integration supports:

- natural-language emotion input
- emotion prediction
- confidence score
- emotion label mapping
- genre preference
- artist preference
- recommendation generation

The emotion mapping includes:

`anger → angry`

This resolves the difference between the Emotion Detection Model's label and the Recommendation Engine's label.

---

## 21. Example End-to-End Flow

Example user input:

`psychotic as fuck`

Genre:

`alternative`

Artist:

`none`

The ML model produced:

Emotion:

`anger`

Confidence:

`70.40%`

The integration mapped:

`anger → angry`

The Recommendation Engine then produced five test recommendations including:

- Numb — Linkin Park
- Nightmare — Avenged Sevenfold
- Epic - Radio Edit — Faith No More
- POWERLESS — Linkin Park
- The Catalyst — Linkin Park

The final system configuration supports up to 15 recommendations through the Recommendation Engine.

---

## 22. Limitations

### Language Detection

The dataset does not contain an explicit language field.

Language personalization therefore uses metadata heuristics rather than a dedicated language classifier.

### Recommendation Evaluation

There is no human-labelled recommendation ground truth.

The evaluation therefore uses proxy metrics based on the requested mood and preferences.

### Diversity

Strong artist preferences can naturally produce highly concentrated recommendation lists.

For example, the Lana Del Rey and Taylor Swift test cases showed relatively low diversity because the artist preference strongly restricts the recommendation pool.

### Spotify Availability

Spotify metadata enrichment depends on available Spotify metadata/API access.

The recommendation engine can continue operating using local dataset information when Spotify metadata is unavailable.

### Feedback Evaluation

The current feedback evaluation measures the direct effect of artist Like/Dislike signals on recommendation scoring.

It does not represent long-term user behaviour because the project does not contain a large historical user-feedback dataset.

---

## 23. Final Recommendation Engine Architecture

The final Recommendation Engine can be summarized as:

```text
                USER INPUT
                    |
                    v
          Emotion Detection Model
                    |
                    v
          Emotion + Confidence
                    |
                    v
            Emotion Mapping
                    |
                    v
          Candidate Song Pool
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
      Mood       User         Audio
     Matching  Preferences   Similarity
        |           |           |
        +-----------+-----------+
                    |
                    v
             Feedback Score
                    |
                    v
          Popularity / Recency
                    |
                    v
             Final Ranking
                    |
                    v
        Controlled Randomization
                    |
                    v
              Top 15 Songs
                    |
                    v
          Spotify Metadata
```

---

## 24. Final Week 4–8 Progress

Week 4

Built the core emotion-to-music recommendation engine.

Week 5

Added personalized ranking using:

* mood
* genre
* language
* artist
* audio characteristics
* popularity
* recency

Week 6

Integrated the Emotion Detection Model with the Recommendation Engine.

Week 7

Added and evaluated:

* recommendation-quality metrics
* diversity evaluation
* language evaluation
* Like feedback
* Dislike feedback
* feedback ranking response

Week 8

Finalized the Recommendation Engine documentation, evaluation results, limitations, and implementation details.

---

## 25. Final Outcome

The Recommendation Engine is no longer a simple emotion-to-playlist system.

The final implementation supports:

* natural-language emotion input through the ML pipeline
* six supported emotions
* mood-based audio matching
* genre personalization
* artist personalization
* partial artist matching
* language personalization using metadata heuristics
* audio-feature similarity
* popularity and recency signals
* Like/Dislike feedback
* 100-song candidate pool
* controlled recommendation randomization
* 15-song recommendation output
* Spotify metadata enrichment
* recommendation-quality evaluation

The Recommendation Engine is therefore ready for final project integration, demonstration, and presentation.
