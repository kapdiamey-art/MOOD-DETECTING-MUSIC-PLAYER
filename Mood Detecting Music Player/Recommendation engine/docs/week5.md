1. Objective
Week 5 focused on extending the existing mood-based recommendation engine into a personalized
recommendation system. The engine was updated to work with the six emotions produced by the ML model: Joy,
Angry, Love, Surprise, Fear, and Sadness. User preferences were introduced so recommendations can be
influenced by preferred genres, artists, and audio characteristics.


2. Six-Emotion Integration
The recommendation engine was aligned with the emotions used by the ML model: joy, angry, love, surprise, fear,
sadness. Each emotion has its own musical profile using Energy, Valence, Danceability, and Acousticness.
Emotion-specific feature weights are used to calculate how closely a song matches the detected emotion.


3. Personalized Recommendation
The recommendation function was extended to accept user preferences. Supported preferences include preferred
genres, preferred artists, preferred audio characteristics, and optional language preferences.


4. Expanded Candidate Generation
The system now combines multiple candidate sources rather than relying only on the strongest mood matches.
Mood Candidates + Genre Candidates + Artist Candidates + Feedback Candidates → Combined Candidate Pool
→ Personalized Ranking → Top-N Recommendations. This allows preferences to influence both candidate
selection and final ranking.


5. Artist and Genre Personalization
Genre and artist preferences directly affect recommendation scores. With a K-pop and BTS preference, BTS tracks
such as Like and Filter appeared at the top, with artist_score = 1.0 and genre_score = 1.0.


6. Audio Preference Personalization
Users can specify preferred Energy, Valence, Danceability, and Acousticness. The system calculates an
audio_score based on similarity between the user's preferred values and each song's audio characteristics.


7. Emotion Confidence
The recommendation engine accepts an optional confidence value from the emotion model. Higher confidence
gives the detected emotion stronger influence over ranking, while lower confidence allows personalization to have
relatively greater influence. Example: recommend("joy", confidence=0.90).


8. User Feedback
A feedback mechanism was added to prepare the system for learning from user interactions. Supported feedback
includes liked_artists, liked_genres, liked_tracks, skipped_artists, skipped_genres, and skipped_tracks. Liked
content receives a positive feedback score, while skipped content receives a ranking penalty.


9. Spotify Recency
The existing Spotify integration from Week 4 was retained. Spotify metadata can provide Spotify Track ID, track
name, artist, album, release date, release-date precision, and recency score. Metadata is cached locally in
data/processed/spotify_metadata.csv.


10. Language Preference
Language preference support was added to the recommendation interface. However, the current cleaned music
dataset does not contain a language column, so language_score currently remains 0.0 until reliable language
metadata is added. Language is not inferred from track names or genres.


11. Personalized Ranking
The final recommendation score combines mood similarity, genre preference, language preference, artist
preference, audio preference, popularity, Spotify recency, and user feedback. The influence of mood is also
adjusted using the confidence supplied by the emotion model.


12. Personalization Validation
User A: Genre = k-pop, Artist = BTS. Results included Like — BTS, Filter — BTS, Bad Boy — Red Velvet,
Kovakkara Kiliye, and Vandha Kadha.
User B: Genre = indian, Artist = Diljit Dosanjh. Results included Tum Mile, Pee Loon, Kya, Allah Maaf Kare, and
Billo Rani.
The same emotion therefore produced different recommendations for different user preferences, validating the
personalization layer.


13. Validation Testing
Emotion Result
JOY 5 recommendations
ANGRY 5 recommendations
LOVE 5 recommendations
SURPRISE 5 recommendations
FEAR 5 recommendations
SADNESS 5 recommendations
An invalid emotion, happy, was also tested and correctly rejected with a ValueError because it is not one of the six
emotions produced by the ML model.


14. Week 5 Architecture
ML Model
 ↓
Emotion + Confidence
 ↓
Emotion Profile
 ↓
Mood Similarity
 ↓
Candidate Generation
 ■■■ Mood Candidates
 ■■■ Genre Candidates
 ■■■ Artist Candidates
 ■■■ Feedback Candidates
 ↓
Personalization Scoring
 ■■■ Mood Score
 ■■■ Genre Score
 ■■■ Language Score
 ■■■ Artist Score
 ■■■ Audio Score
 ■■■ Feedback Score
 ■■■ Popularity
 ■■■ Spotify Recency
 ↓
Final Personalized Ranking
 ↓
Top-N Recommendations


15. Files Used
Main recommendation engine: src/recommendation.py
Spotify integration: src/spotify_api.py
Spotify metadata cache: data/processed/spotify_metadata.csv
Mood profiles: data/processed/mood_profiles.csv


16. Week 5 Outcome
Week 5 successfully extended the original recommendation engine into a personalized mood-based
recommendation system. The system can work with all six ML emotions, match songs to detected emotions, use
genre and artist preferences, use preferred audio characteristics, incorporate emotion confidence and user
feedback, use Spotify recency information, generate different recommendations for different users, and return a
configurable number of recommendations. The main remaining enhancement is adding reliable language metadata
to the music dataset.