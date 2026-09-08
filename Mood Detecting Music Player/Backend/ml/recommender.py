import random

SONGS = {
    "Happy": [
        {"title": "Happy", "artist": "Pharrell Williams", "duration": "3:53"},
        {"title": "Can't Stop the Feeling", "artist": "Justin Timberlake", "duration": "3:56"},
        {"title": "Uptown Funk", "artist": "Bruno Mars", "duration": "4:30"},
        {"title": "Good as Hell", "artist": "Lizzo", "duration": "2:39"},
        {"title": "Dancing Queen", "artist": "ABBA", "duration": "3:51"},
        {"title": "Walking on Sunshine", "artist": "Katrina & The Waves", "duration": "3:35"},
        {"title": "Shake It Off", "artist": "Taylor Swift", "duration": "3:39"},
        {"title": "Levitating", "artist": "Dua Lipa", "duration": "3:23"},
        {"title": "Blinding Lights", "artist": "The Weeknd", "duration": "3:20"},
        {"title": "As It Was", "artist": "Harry Styles", "duration": "2:37"},
    ],
    "Sad": [
        {"title": "Someone Like You", "artist": "Adele", "duration": "4:45"},
        {"title": "The Night We Met", "artist": "Lord Huron", "duration": "3:28"},
        {"title": "Skinny Love", "artist": "Bon Iver", "duration": "3:58"},
        {"title": "Hurt", "artist": "Johnny Cash", "duration": "3:38"},
        {"title": "Fix You", "artist": "Coldplay", "duration": "4:55"},
        {"title": "Everybody Hurts", "artist": "R.E.M.", "duration": "5:17"},
        {"title": "The Scientist", "artist": "Coldplay", "duration": "5:09"},
        {"title": "Say Something", "artist": "A Great Big World", "duration": "3:49"},
        {"title": "All I Want", "artist": "Kodaline", "duration": "5:05"},
        {"title": "Let Her Go", "artist": "Passenger", "duration": "4:14"},
    ],
    "Calm": [
        {"title": "Weightless", "artist": "Marconi Union", "duration": "8:09"},
        {"title": "Clair de Lune", "artist": "Claude Debussy", "duration": "5:07"},
        {"title": "River Flows in You", "artist": "Yiruma", "duration": "3:14"},
        {"title": "Experience", "artist": "Ludovico Einaudi", "duration": "5:13"},
        {"title": "Gymnopédie No.1", "artist": "Erik Satie", "duration": "3:04"},
        {"title": "Lo-fi Study Beats", "artist": "ChilledCow", "duration": "4:00"},
        {"title": "Sunset Lover", "artist": "Petit Biscuit", "duration": "4:12"},
        {"title": "Breathe (2 AM)", "artist": "Anna Nalick", "duration": "4:14"},
        {"title": "Here Comes the Sun", "artist": "The Beatles", "duration": "3:05"},
        {"title": "The Sound of Silence", "artist": "Simon & Garfunkel", "duration": "3:05"},
    ],
    "Energetic": [
        {"title": "Eye of the Tiger", "artist": "Survivor", "duration": "4:04"},
        {"title": "Lose Yourself", "artist": "Eminem", "duration": "5:26"},
        {"title": "Thunderstruck", "artist": "AC/DC", "duration": "4:52"},
        {"title": "Don't Stop Me Now", "artist": "Queen", "duration": "3:29"},
        {"title": "Stronger", "artist": "Kanye West", "duration": "5:11"},
        {"title": "Till I Collapse", "artist": "Eminem", "duration": "4:57"},
        {"title": "Power", "artist": "Kanye West", "duration": "4:52"},
        {"title": "Pump It", "artist": "Black Eyed Peas", "duration": "3:33"},
        {"title": "Enter Sandman", "artist": "Metallica", "duration": "5:32"},
        {"title": "Seven Nation Army", "artist": "The White Stripes", "duration": "3:51"},
    ],
    "Angry": [
        {"title": "Break Stuff", "artist": "Limp Bizkit", "duration": "2:46"},
        {"title": "Killing in the Name", "artist": "Rage Against the Machine", "duration": "5:13"},
        {"title": "Bodies", "artist": "Drowning Pool", "duration": "3:22"},
        {"title": "Given Up", "artist": "Linkin Park", "duration": "3:09"},
        {"title": "Chop Suey", "artist": "System of a Down", "duration": "3:30"},
        {"title": "Numb", "artist": "Linkin Park", "duration": "3:05"},
        {"title": "Down with the Sickness", "artist": "Disturbed", "duration": "4:37"},
        {"title": "Faint", "artist": "Linkin Park", "duration": "2:42"},
        {"title": "Break the Silence", "artist": "Disturbed", "duration": "4:40"},
        {"title": "Victim", "artist": "Avenged Sevenfold", "duration": "5:29"},
    ],
    "Anxious": [
        {"title": "Breathe", "artist": "Pink Floyd", "duration": "2:50"},
        {"title": "Anxiety", "artist": "Blackbear", "duration": "3:16"},
        {"title": "Heavy", "artist": "Birdtalker", "duration": "3:50"},
        {"title": "Let It Be", "artist": "The Beatles", "duration": "3:50"},
        {"title": "Unwell", "artist": "Matchbox Twenty", "duration": "3:41"},
        {"title": "Keep Your Head Up", "artist": "Ben Howard", "duration": "5:02"},
        {"title": "It Will Be Okay", "artist": "Shinedown", "duration": "4:11"},
        {"title": "Slow Down", "artist": "Surfaces", "duration": "3:07"},
        {"title": "Better Place", "artist": "Rachel Platten", "duration": "3:27"},
        {"title": "I Will Survive", "artist": "Gloria Gaynor", "duration": "3:16"},
    ],
    "Stressed": [
        {"title": "Don't Worry Be Happy", "artist": "Bobby McFerrin", "duration": "4:46"},
        {"title": "Three Little Birds", "artist": "Bob Marley", "duration": "3:00"},
        {"title": "Hakuna Matata", "artist": "Disney", "duration": "3:33"},
        {"title": "Don't Panic", "artist": "Coldplay", "duration": "2:17"},
        {"title": "Take It Easy", "artist": "Eagles", "duration": "3:31"},
        {"title": "Sunflower", "artist": "Post Malone", "duration": "2:38"},
        {"title": "Watermelon Sugar", "artist": "Harry Styles", "duration": "2:54"},
        {"title": "Put It All Down", "artist": "James TW", "duration": "3:16"},
        {"title": "Here Comes the Sun", "artist": "The Beatles", "duration": "3:05"},
        {"title": "Lovely Day", "artist": "Bill Withers", "duration": "4:16"},
    ],
}


def get_songs_for_mood(mood, limit=6):
    songs = SONGS.get(mood, SONGS["Calm"]).copy()
    random.shuffle(songs)
    return [{"mood_tag": mood, **s} for s in songs[:limit]]


def get_discover_songs(limit=12):
    all_songs = []
    for mood, songs in SONGS.items():
        for s in songs:
            all_songs.append({"mood_tag": mood, **s})
    random.shuffle(all_songs)
    return all_songs[:limit]
