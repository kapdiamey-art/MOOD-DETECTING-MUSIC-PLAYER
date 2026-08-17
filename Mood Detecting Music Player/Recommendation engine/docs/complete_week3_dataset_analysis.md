# Week 3 — Music Dataset Analysis & Recommendation Preparation

## 1. Objective

The objective of Week 3 was to analyze and validate the cleaned music dataset, examine its class/genre distribution, perform data-quality and error analysis, evaluate the existing mood profiles, and prepare observations that will support the recommendation engine development in Week 4.

The Week 3 responsibility for Member 2 includes dataset analysis, label cleaning, class distribution, error analysis, and continued music dataset preparation.

---

## 2. Dataset Overview

The raw music dataset initially contained:

- 114,000 tracks
- 21 columns

The raw dataset contained an unnecessary `Unnamed: 0` index column. This column was removed during preprocessing.

The cleaned dataset contains:

- 113,549 tracks
- 20 useful columns
- 114 unique genres

The reproducible preprocessing pipeline is implemented in:

`src/data_preprocessing.py`

The cleaned dataset is stored at:

`data/processed/music_dataset_clean.csv`

---

## 3. Data Cleaning Results

The following preprocessing operations were performed:

1. Loaded the raw music dataset.
2. Removed the unnecessary `Unnamed: 0` index column.
3. Checked missing values.
4. Removed records missing essential metadata:
   - artists
   - album_name
   - track_name
5. Identified and removed duplicate records.
6. Saved the cleaned dataset.

### Cleaning Summary

| Stage | Rows | Columns |
|---|---:|---:|
| Raw dataset | 114,000 | 21 |
| After removing index column | 114,000 | 20 |
| After removing missing metadata | 113,999 | 20 |
| After removing duplicates | 113,549 | 20 |

A total of 451 records were removed:

- 1 record with missing essential metadata
- 450 duplicate records

The final dataset contains no missing values and no duplicate rows.

---

## 4. Available Metadata and Audio Features

The cleaned dataset contains the following important metadata:

- `track_id`
- `artists`
- `album_name`
- `track_name`
- `popularity`
- `explicit`
- `track_genre`

The main audio features available for recommendation analysis are:

- `danceability`
- `energy`
- `loudness`
- `speechiness`
- `acousticness`
- `instrumentalness`
- `liveness`
- `valence`
- `tempo`
- `time_signature`

The recommendation baseline currently uses:

- `energy`
- `valence`
- `danceability`
- `acousticness`

---

## 5. Audio Feature Analysis

Descriptive statistics were calculated for the main recommendation-related features.

| Feature | Mean | Minimum | Maximum |
|---|---:|---:|---:|
| Danceability | 0.567 | 0.000 | 0.985 |
| Energy | 0.642 | 0.000 | 1.000 |
| Loudness | -8.243 | -49.531 | 4.532 |
| Speechiness | 0.085 | 0.000 | 0.965 |
| Acousticness | 0.314 | 0.000 | 0.996 |
| Instrumentalness | 0.156 | 0.000 | 1.000 |
| Liveness | 0.214 | 0.000 | 1.000 |
| Valence | 0.474 | 0.000 | 0.995 |
| Tempo | 122.176 | 0.000 | 243.372 |
| Popularity | 33.324 | 0 | 100 |

These statistics provide a baseline understanding of the feature distribution of the music dataset.

---

## 6. Genre/Class Distribution

The cleaned dataset contains 114 unique genres.

Many genres contain approximately 1,000 tracks, although the distribution is not perfectly uniform.

Examples of highly represented genres include:

- acoustic — 1,000
- emo — 1,000
- rock-n-roll — 1,000
- reggaeton — 1,000
- disco — 1,000
- r-n-b — 1,000
- electronic — 1,000
- rock — 1,000
- reggae — 1,000

Some genres have fewer records:

- psych-rock — 996
- pop — 993
- latin — 990
- iranian — 988
- honky-tonk — 981
- dance — 965
- german — 963
- classical — 933
- romance — 904

The genre distribution is therefore relatively balanced but not perfectly uniform.

No genre rebalancing was performed because the recommendation engine primarily uses audio-feature similarity rather than supervised genre classification.

---

## 7. Mood Profiles

Five target mood profiles are currently defined:

| Mood | Energy | Valence | Danceability | Acousticness |
|---|---:|---:|---:|---:|
| Happy | 0.75 | 0.80 | 0.75 | 0.30 |
| Sad | 0.35 | 0.20 | 0.35 | 0.60 |
| Angry | 0.85 | 0.20 | 0.50 | 0.15 |
| Calm | 0.25 | 0.60 | 0.30 | 0.75 |
| Energetic | 0.90 | 0.70 | 0.85 | 0.20 |

These profiles represent target positions in the four-dimensional audio-feature space.

The current recommendation baseline calculates Euclidean distance between a song's feature vector and the selected mood profile.

---

## 8. Feature Correlation Analysis

Correlation analysis was performed on the main recommendation features.

| Feature Relationship | Correlation |
|---|---:|
| Energy ↔ Acousticness | -0.733 |
| Valence ↔ Danceability | +0.477 |
| Energy ↔ Valence | +0.258 |
| Energy ↔ Tempo | +0.247 |
| Acousticness ↔ Tempo | -0.208 |
| Danceability ↔ Acousticness | -0.169 |
| Valence ↔ Acousticness | -0.106 |
| Danceability ↔ Tempo | -0.052 |

### Key observations

Energy and acousticness have a strong negative relationship.

This indicates that higher-energy tracks in this dataset generally tend to have lower acousticness.

Valence and danceability have a moderate positive relationship, meaning tracks with higher positive musical characteristics tend to be somewhat more danceable.

However, the relationships are not strong enough to treat the features as interchangeable. Multiple features are therefore retained for mood matching.

---

## 9. Genre and Audio-Feature Analysis

Average audio features were calculated by genre.

### Highest-energy genres

Examples:

- death-metal — 0.931
- grindcore — 0.924
- metalcore — 0.914
- hardstyle — 0.901
- drum-and-bass — 0.876

### Lowest-energy genres

Examples:

- classical — 0.195
- new-age — 0.214
- ambient — 0.237
- romance — 0.299
- disney — 0.303

### Highest-valence genres

Examples:

- salsa — 0.815
- forro — 0.760
- rockabilly — 0.727
- afrobeat — 0.698
- ska — 0.697

### Lowest-valence genres

Examples:

- sleep — 0.058
- iranian — 0.153
- ambient — 0.167
- new-age — 0.183
- black-metal — 0.192

An important observation is that high energy does not necessarily mean positive valence.

For example, death-metal has very high average energy but relatively low valence. Similarly, black-metal has high energy but low valence.

This supports the use of multiple audio characteristics instead of relying on a single feature for mood recommendation.

---

## 10. Data-Quality and Error Analysis

Several potential edge cases were examined.

### Zero-value counts

| Feature | Zero values |
|---|---:|
| Danceability | 157 |
| Energy | 1 |
| Speechiness | 157 |
| Acousticness | 39 |
| Instrumentalness | 38,637 |
| Liveness | 2 |
| Valence | 176 |
| Tempo | 157 |

The large number of zero values for instrumentalness was not treated as a data error because zero can represent a valid non-instrumental track.

Extreme values were also inspected.

The dataset contains tempo values above 200 BPM, with a maximum of 243.372 BPM.

These values were retained because extreme audio characteristics can represent legitimate musical tracks.

No additional filtering was performed based only on extreme values.

---

## 11. Mood Profile Separation

Euclidean distances were calculated between the five mood profiles.

| | Happy | Sad | Angry | Calm | Energetic |
|---|---:|---:|---:|---:|---:|
| Happy | 0.000 | 0.877 | 0.675 | 0.834 | 0.229 |
| Sad | 0.877 | 0.000 | 0.689 | 0.442 | 0.981 |
| Angry | 0.675 | 0.689 | 0.000 | 0.959 | 0.614 |
| Calm | 0.834 | 0.442 | 0.959 | 0.000 | 1.019 |
| Energetic | 0.229 | 0.981 | 0.614 | 1.019 | 0.000 |

### Observations

Happy and Energetic are the closest mood profiles with a distance of 0.229.

Sad and Calm are also relatively close at 0.442.

Calm and Energetic are the most separated profiles at 1.019.

This indicates that the five moods do not occupy equally separated regions of the feature space.

---

## 12. Mood Ambiguity Analysis

Each song was compared against all five mood profiles.

The difference between the closest and second-closest mood was used as an ambiguity measure.

Results:

| Measure | Result |
|---|---:|
| Total songs | 113,549 |
| Exact ties | 3 |
| Gap < 0.01 | 6,074 |
| Gap < 0.05 | 27,786 |
| Gap < 0.10 | 50,352 |
| Mean mood gap | 0.1568 |
| Median mood gap | 0.1163 |

Only three songs had an exact tie between their closest mood profiles.

However, a significant number of songs have relatively small differences between their closest and second-closest moods, indicating that some tracks are naturally ambiguous in the current four-feature representation.

These should not be treated as incorrect labels because the dataset does not provide ground-truth mood annotations.

---

## 13. Derived Mood Distribution

Using the current mood profiles and nearest-profile Euclidean distance, each song was assigned to its closest derived mood.

| Derived Mood | Tracks | Percentage |
|---|---:|---:|
| Angry | 37,277 | 32.83% |
| Happy | 28,280 | 24.91% |
| Sad | 20,697 | 18.23% |
| Energetic | 16,303 | 14.36% |
| Calm | 10,992 | 9.68% |
| **Total** | **113,549** | **100%** |

### Interpretation

The distribution is uneven, with the Angry profile receiving the largest number of tracks and Calm receiving the fewest.

These are derived assignments rather than ground-truth emotion labels.

Therefore, the result should be interpreted as:

> 32.83% of songs are closest to the current Angry profile in the selected four-dimensional feature space.

It should not be interpreted as saying that 32.83% of the dataset is objectively angry music.

This result will be useful when evaluating and potentially recalibrating the recommendation profiles during Week 4.

---

## 14. Dataset Limitations

The current music dataset does not contain explicit:

- song-level mood labels
- language labels
- release dates

Therefore, mood assignments are currently based on audio-feature profiles rather than ground-truth mood annotations.

Language and release-date information cannot be reliably derived from the current dataset alone.

These limitations should be considered when extending the recommendation engine.

---

## 15. Week 3 Conclusions

The Week 3 analysis established that the cleaned dataset is suitable for recommendation-engine development.

The main conclusions are:

1. The dataset was successfully cleaned and reduced to 113,549 unique usable tracks.
2. The dataset contains 114 genres with relatively balanced representation.
3. Audio features provide meaningful variation for mood-based recommendation.
4. Energy and acousticness have a strong negative relationship.
5. Valence and danceability have a moderate positive relationship.
6. High energy does not necessarily indicate positive mood.
7. The five mood profiles are not equally separated.
8. Some songs are ambiguous between multiple mood profiles.
9. Derived mood assignments are uneven and should not be treated as ground-truth labels.
10. The current four-feature representation provides a suitable baseline for building the Week 4 recommendation and ranking engine.

## 16. Next Step — Week 4

The findings from Week 3 will be used to develop the Week 4 recommendation pipeline:

Emotion
↓
Music Characteristics
↓
Candidate Songs
↓
Ranking
↓
Top Recommendations

The Week 4 focus will be improving the current baseline from simple nearest-profile matching into a more structured candidate-generation and ranking system.