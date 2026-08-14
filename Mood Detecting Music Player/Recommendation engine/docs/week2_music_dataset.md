# Week 2 — Music Dataset Preparation

## 1. Objective

The objective of Week 2 was to collect, inspect, clean, and prepare the music dataset for the recommendation engine.

The dataset provides song metadata and audio characteristics that can later be used for mood-based music recommendation.

## 2. Dataset Overview

The raw dataset contains:

- 114,000 tracks
- 21 columns
- 114 music genres

The raw dataset includes an unnecessary `Unnamed: 0` index column, which was removed during preprocessing.

After preprocessing, the dataset contains:

- 113,549 tracks
- 20 useful columns

## 3. Metadata and Audio Features

Important metadata fields include:

- `track_id`
- `artists`
- `album_name`
- `track_name`
- `popularity`
- `explicit`
- `track_genre`

Important audio features include:

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

## 4. Data Cleaning

The preprocessing pipeline performs the following operations:

1. Loads the raw CSV dataset.
2. Removes the unnecessary `Unnamed: 0` index column.
3. Checks missing values.
4. Removes records missing essential metadata:
   - artist
   - album name
   - track name
5. Removes duplicate records.
6. Saves the cleaned dataset to:

`data/processed/music_dataset_clean.csv`

### Cleaning Results

| Stage | Rows | Columns |
|---|---:|---:|
| Raw dataset | 114,000 | 21 |
| After removing index column | 114,000 | 20 |
| After removing missing metadata | 113,999 | 20 |
| After removing duplicates | 113,549 | 20 |

A total of 451 records were removed: 1 incomplete metadata record and 450 duplicate records.

## 5. Genre Analysis

The cleaned dataset contains 114 unique genres.

The dataset is highly balanced by genre, with the inspected genres containing approximately 1,000 tracks each.

The `track_genre` field can therefore be used as genre metadata during later recommendation development.

## 6. Audio Feature Analysis

The main feature statistics observed in the cleaned dataset were:

| Feature | Mean | Minimum | Maximum |
|---|---:|---:|---:|
| Danceability | 0.567 | 0.000 | 0.985 |
| Energy | 0.642 | 0.000 | 1.000 |
| Valence | 0.474 | 0.000 | 0.995 |
| Acousticness | 0.314 | 0.000 | 0.996 |
| Instrumentalness | 0.156 | 0.000 | 1.000 |
| Tempo | 122.176 | 0.000 | 243.372 |
| Popularity | 33.324 | 0 | 100 |
| Loudness | -8.243 | -49.531 | 4.532 |
| Speechiness | 0.085 | 0.000 | 0.965 |
| Liveness | 0.214 | 0.000 | 1.000 |

These features provide the numerical basis for comparing songs with mood profiles.

## 7. Mood Profiles

Mood profiles were prepared for:

- Happy
- Sad
- Angry
- Calm
- Energetic

The current recommendation baseline uses:

- `energy`
- `valence`
- `danceability`
- `acousticness`

The recommendation engine calculates the distance between a song's feature vector and the selected mood profile.

## 8. Dataset Limitations

The current dataset does not contain explicit:

- Language labels
- Song-level mood labels
- Release dates

Therefore, language and explicit song mood should not be inferred as ground-truth metadata from this dataset.

Mood recommendation currently uses audio-feature profiles rather than manually assigned mood labels.

Release-date metadata is also unavailable in the current dataset, so the dataset alone cannot reliably identify the newest songs.

## 9. Reproducible Preprocessing

The cleaning process is implemented in:

`src/data_preprocessing.py`

This allows the cleaned dataset to be regenerated from the raw dataset instead of relying on manual cleaning.

## 10. Week 2 Outcome

The music dataset has been collected, cleaned, analyzed, and prepared for recommendation-engine development.

The resulting dataset is ready for subsequent recommendation ranking and evaluation work.

statistical analysis:
         danceability  energy     loudness     speechiness  acousticness   instrumentalness liveness    valence   tempo.   popularity
count    113549.000  113549.000  113549.000   113549.000    113549.000        113549.000  113549.000  113549.000  113549.000  113549.000
mean          0.567       0.642      -8.243        0.085         0.314             0.156       0.214       0.474     122.176      33.324
std           0.173       0.251       5.011        0.106         0.332             0.309       0.190       0.259      29.973      22.284
min           0.000       0.000     -49.531        0.000         0.000             0.000       0.000       0.000       0.000       0.000
25%           0.456       0.473      -9.998        0.036         0.017             0.000       0.098       0.260      99.296      17.000
50%           0.580       0.685      -6.997        0.049         0.168             0.000       0.132       0.464     122.020      35.000
75%           0.695       0.854      -5.001        0.084         0.596             0.049       0.273       0.683     140.074      50.000
max           0.985       1.000       4.532        0.965         0.996             1.000       1.000       0.995     243.372     100.000




Unique genres: 114

Top 20 genres:
track_genre
acoustic       1000
emo            1000
rock-n-roll    1000
reggaeton      1000
disco          1000
r-n-b          1000
punk-rock      1000
pagode         1000
electronic     1000
mpb            1000
country        1000
metalcore      1000
mandopop       1000
funk           1000
garage         1000
j-rock         1000
industrial     1000
indie-pop      1000
rock           1000
reggae         1000
