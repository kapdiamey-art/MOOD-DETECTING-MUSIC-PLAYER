Week 4 — Recommendation Engine & Spotify
Integration

Week 4 focused on developing the first functional mood-based recommendation engine and integrating Spotify Web API to
introduce recent-music awareness. The system takes one of five supported moods — Happy, Sad, Angry, Calm, or Energetic
— and ranks songs according to their similarity to the selected mood.

1. Mood-Based Recommendation
The recommendation engine uses Energy, Valence, Danceability, and Acousticness. Mood-specific weights were introduced
because different features have different importance for different moods.
Mood Energy Valence Danceability Acousticness
Happy 0.25 0.35 0.25 0.15
Sad 0.30 0.40 0.10 0.20
Angry 0.40 0.30 0.15 0.15
Calm 0.30 0.20 0.15 0.35
Energetic 0.35 0.20 0.35 0.10
Weighted Euclidean distance compares each song with the selected mood profile:
distance = sqrt(Σ weight × (song_feature - mood_feature)²)
The distance is converted into a mood score:
mood_score = 1 - mood_distance
A smaller distance therefore represents a stronger mood match.


2. Candidate Generation
The cleaned dataset contains 113,549 songs. The system first selects the 50 songs with the smallest mood distance before
performing Spotify enrichment.
113,549 songs
↓
Weighted mood matching
↓
Top 50 candidates
↓
Spotify metadata
↓
Final ranking
↓
Top 5 recommendations


3. Final Ranking
85% Mood Match
10% Popularity
5% Recency
final_score =
0.85 × mood_score
+ 0.10 × popularity_score
+ 0.05 × recency_score
Mood similarity remains the primary factor, while popularity and recency provide secondary ranking information.


4. Spotify API Integration
A Spotify Developer application named Mood Detecting Music Player was created for the project. Spotify Web API was
integrated using the Client Credentials authentication flow.
Credentials are loaded from environment variables:
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
The main Spotify functionality is implemented in src/spotify_api.py. The API is used to search tracks and retrieve Spotify
Track ID, track name, artist, album name, release date, and release-date precision.


5. Recent Music / Recency Score
Spotify release dates are used to calculate a recency score between 0 and 1 using a five-year half-life decay:
recency_score = 2 ^ (-age_years / 5)
Track Release Recency Score
Mamma Mia — ABBA 1975 0.0008
CASE 143 — Stray Kids 2022-10-07 0.5851
This gives newer songs a small ranking advantage without overriding mood similarity.


6. Spotify Metadata Cache
Spotify metadata is cached in data/processed/spotify_metadata.csv.
track_name
artists
spotify_id
release_date
release_date_precision
album_name
recency_score
Caching avoids unnecessary repeated Spotify API requests.


7. Duplicate Handling
Duplicate dataset entries are removed using track_name + artists. After Spotify metadata is retrieved, Spotify Track IDs are
also used to remove duplicate Spotify tracks.


8. Testing
HAPPY → 5 unique recommendations
SAD → 5 unique recommendations
ANGRY → 5 unique recommendations
CALM → 5 unique recommendations
ENERGETIC → 5 unique recommendations
All five moods successfully returned five unique recommendations.
Invalid mood test:
Input: excited
Invalid mood 'excited'. Choose from: ['happy', 'sad', 'angry', 'calm', 'energetic']


9. Example Recommendation Results
Happy
Track Artist Mood Pop. Recent Final
Like BTS 0.981917 72 0.9439 0.953824
Lemonade Diljit Dosanjh 0.976664 74 0.5668 0.932505
Kiss Me More (feat. SZA) Doja Cat; SZA 0.969443 81 0.4897 0.929511
Hecha Pa' Mi Boza 0.968121 75 0.4322 0.919513
Mamma Mia ABBA 0.983871 77 0.0008 0.913330
Sad
Track Artist Mood Pop. Recent Final
Stairway to Heaven - Remaster Led Zeppelin 0.988686 79 0.0005 0.919408
Mais Que Uma Voz Eyshila; Weslei Santos 0.977146 47 0.4781 0.901479
Gehraiyaan Title Track OAFF; Savera; Lothika; Ankur Tewari 0.962701 56 0.5326 0.900926
One More Time Around Tyler Ward; Karis; Ray Lorraine 0.972612 47 0.5000 0.898720
Heart Full of Praise Phil Wickham 0.987131 35 0.4897 0.898547
Angry
Track Artist Mood Pop. Recent Final
Soul of Doctor (Theme) Anirudh Ravichander; Niranjana Ramanan 0.974609 59 0.5077 0.912803
Wouldn't Change A Thing ILLENIUM; Thirty Seconds To Mars 0.962136 54 0.5110 0.897366
The Final Countdown Europe 0.963537 78 0.0038 0.897197
Let's Go Home (Erlando Remix) Eklo; Erlando 0.980305 50 0.2532 0.895919
Your Loving Arms - ALPHA 9 Remix Karen Overton; ALPHA 9 0.964451 49 0.5403 0.895799
Calm
Track Artist Mood Pop. Recent Final
Under Your Skin BluntOne; Baen Mow 0.938181 55 0.4082 0.872863
Mr. Tambourine Man Bob Dylan 0.945011 64 0.0002 0.867269
Fast Car Boyce Avenue; Kina Grannis 0.935970 61 0.1422 0.863684
In the Ghetto Elvis Presley 0.933067 69 0.0004 0.862127
That's Amore - Remastered Dean Martin 0.942356 58 0.0125 0.859627
Energetic
Track Artist Mood Pop. Recent Final
De Taali (From "Bhool Bhulaiyaa 2") Pritam; Yo Yo Honey Singh; Armaan Malik; Shashwat Singh; Amitabh Bhattacharya0.971665 67 0.5536 0.920596
Ussumu Laresey Vijay Antony; Emcee Jazz; Janaki Iyer 0.984458 58 0.1108 0.900329
Things I Need Peruzzi 0.968917 45 0.5728 0.897219
Mallige Hoova All Ok; Ashika Ranganath 0.966688 44 0.5787 0.894620
Jhak Maar Ke Pritam; Neeraj Shridhar; Harshdeep Kaur 0.967378 62 0.1280 0.890671


10. Files
src/recommendation.py
src/spotify_api.py
data/processed/spotify_metadata.csv
docs/week4_recommendation_engine.md
Spotify credentials are stored locally in .env and should not be committed to GitHub.


11. Week 4 Outcome
Mood
↓
Mood Profile
↓
Weighted Audio-Feature Matching
↓
Top 50 Candidates
↓
Spotify Metadata
