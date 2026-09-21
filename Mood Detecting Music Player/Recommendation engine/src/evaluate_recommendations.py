"""
Week 7 - Recommendation Engine Evaluation

Evaluates the existing recommendation engine using proxy metrics.

Because the project does not contain human-labelled "correct"
recommendations, these metrics measure whether recommendations
follow the user's requested mood and preferences.

Metrics:
    - Mood Alignment@K
    - Genre Match@K
    - Artist Match@K
    - Language Match@K
    - Diversity@K
    - Feedback Response

This script does NOT modify the recommendation engine.
"""

from pathlib import Path
import sys
import pandas as pd


# =========================================================
# PROJECT PATHS
# =========================================================

ROOT = Path(__file__).resolve().parents[1]

sys.path.insert(
    0,
    str(ROOT / "src")
)

from recommendation import recommend


DATASET_PATH = (
    ROOT
    / "data"
    / "processed"
    / "music_dataset_expanded.csv"
)


# =========================================================
# CONFIGURATION
# =========================================================

K = 10


# =========================================================
# TEST CASES
# =========================================================

TEST_CASES = [

    {
        "name": "Happy mood",
        "emotion": "joy",
        "genre": "none",
        "artist": "none",
        "language": "all",
    },

    {
        "name": "Sad + Lana Del Rey",
        "emotion": "sadness",
        "genre": "none",
        "artist": "Lana Del Rey",
        "language": "english",
    },

    {
        "name": "Angry + Rock",
        "emotion": "angry",
        "genre": "rock",
        "artist": "none",
        "language": "english",
    },

    {
        "name": "Joy + Taylor Swift",
        "emotion": "joy",
        "genre": "none",
        "artist": "Taylor Swift",
        "language": "english",
    },

    {
        "name": "Sad + Billie Eilish",
        "emotion": "sadness",
        "genre": "none",
        "artist": "Billie Eilish",
        "language": "english",
    },

]


# =========================================================
# HELPERS
# =========================================================

def safe_text(value):

    if pd.isna(value):
        return ""

    return str(value).strip()


def artist_matches(
    value,
    requested_artist
):

    if not requested_artist:
        return False

    requested = (
        safe_text(
            requested_artist
        )
        .lower()
    )

    if requested in [
        "none",
        "all",
        "any",
        "",
    ]:
        return False

    artists = (
        safe_text(value)
        .lower()
    )

    # Match the recommendation engine's
    # useful partial artist matching.
    return requested in artists


def genre_matches(
    value,
    requested_genre
):

    if not requested_genre:
        return False

    requested = (
        safe_text(
            requested_genre
        )
        .lower()
    )

    if requested in [
        "none",
        "all",
        "any",
        "",
    ]:
        return False

    genre = (
        safe_text(value)
        .lower()
    )

    return requested in genre


def language_matches(
    row,
    requested_language
):

    """
    Proxy language check.

    The current recommendation engine does not have a dedicated
    language column. Its language scoring uses Indian genre/
    artist information and non-ASCII characters as heuristics.

    This evaluation therefore reports language matching as a
    heuristic metric rather than a verified language label.
    """

    requested = (
        safe_text(
            requested_language
        )
        .lower()
    )

    if requested in [
        "",
        "all",
        "any",
        "none",
    ]:
        return False

    artist = safe_text(
        row.get(
            "artists",
            ""
        )
    ).lower()

    genre = safe_text(
        row.get(
            "track_genre",
            ""
        )
    ).lower()

    track = safe_text(
        row.get(
            "track_name",
            ""
        )
    )

    indian_artists = {
        "arijit singh",
        "diljit dosanjh",
        "ap dhillon",
        "shubh",
        "anuv jain",
        "armaan malik",
    }

    indian_genre_terms = [
        "indian",
        "bollywood",
        "bhangra",
        "desi",
        "punjabi",
        "hindi",
    ]

    is_indian = (
        artist in indian_artists
        or any(
            term in genre
            for term in indian_genre_terms
        )
        or any(
            ord(char) > 127
            for char in track
        )
    )

    if requested == "hindi":
        return is_indian

    if requested == "english":
        return not is_indian

    return False


def calculate_diversity(results):

    if results.empty:
        return 0.0

    unique_artists = (
        results[
            "artists"
        ]
        .astype(str)
        .nunique()
    )

    unique_genres = (
        results[
            "track_genre"
        ]
        .astype(str)
        .nunique()
    )

    artist_diversity = (
        unique_artists
        / len(results)
    )

    genre_diversity = (
        unique_genres
        / len(results)
    )

    return (
        artist_diversity
        + genre_diversity
    ) / 2.0


def metric_rate(
    matches,
    total
):

    if total == 0:
        return 0.0

    return (
        sum(matches)
        / total
    )


# =========================================================
# RUN ONE TEST CASE
# =========================================================

def evaluate_case(case):

    print()
    print("=" * 70)
    print(
        case["name"]
    )
    print("=" * 70)

    preferences = {
        "genres": [
            case["genre"]
        ],
        "artists": [
            case["artist"]
        ],
    }

    results = recommend(

        case["emotion"],

        n=K,

        preferences=preferences,

        confidence=1.0,

        feedback=None,

        use_spotify=False,

        language=case["language"]
    )

    if results is None:

        print(
            "No recommendations returned."
        )

        return None

    if not isinstance(
        results,
        pd.DataFrame
    ):

        results = pd.DataFrame(
            results
        )

    results = (
        results
        .head(K)
        .copy()
    )

    if results.empty:

        print(
            "No recommendations returned."
        )

        return None

    total = len(results)

    # -----------------------------------------------------
    # Mood Alignment
    # -----------------------------------------------------

    mood_matches = []

    for _, row in results.iterrows():

        primary_mood = (
            safe_text(
                row.get(
                    "primary_mood",
                    ""
                )
            )
            .lower()
        )

        requested_mood = (
            safe_text(
                case["emotion"]
            )
            .lower()
        )

        mood_matches.append(
            primary_mood
            == requested_mood
        )

    mood_alignment = metric_rate(
        mood_matches,
        total
    )

    # -----------------------------------------------------
    # Genre Match
    # -----------------------------------------------------

    requested_genre = (
        safe_text(
            case["genre"]
        )
        .lower()
    )

    if requested_genre in [
        "",
        "none",
        "all",
        "any",
    ]:

        genre_match = None

    else:

        genre_matches_list = [

            genre_matches(
                row.get(
                    "track_genre",
                    ""
                ),
                case["genre"]
            )

            for _, row
            in results.iterrows()
        ]

        genre_match = metric_rate(
            genre_matches_list,
            total
        )

    # -----------------------------------------------------
    # Artist Match
    # -----------------------------------------------------

    requested_artist = (
        safe_text(
            case["artist"]
        )
        .lower()
    )

    if requested_artist in [
        "",
        "none",
        "all",
        "any",
    ]:

        artist_match = None

    else:

        artist_matches_list = [

            artist_matches(
                row.get(
                    "artists",
                    ""
                ),
                case["artist"]
            )

            for _, row
            in results.iterrows()
        ]

        artist_match = metric_rate(
            artist_matches_list,
            total
        )

    # -----------------------------------------------------
    # Language Match
    # -----------------------------------------------------

    requested_language = (
        safe_text(
            case["language"]
        )
        .lower()
    )

    if requested_language in [
        "",
        "none",
        "all",
        "any",
    ]:

        language_match = None

    else:

        language_matches_list = [

            language_matches(
                row,
                case["language"]
            )

            for _, row
            in results.iterrows()
        ]

        language_match = metric_rate(
            language_matches_list,
            total
        )

    # -----------------------------------------------------
    # Diversity
    # -----------------------------------------------------

    diversity = calculate_diversity(
        results
    )

    # -----------------------------------------------------
    # Display
    # -----------------------------------------------------

    print()

    print(
        f"Recommendations evaluated : "
        f"{total}"
    )

    print(
        f"Mood Alignment@{K}        : "
        f"{mood_alignment * 100:.2f}%"
    )

    if genre_match is not None:

        print(
            f"Genre Match@{K}          : "
            f"{genre_match * 100:.2f}%"
        )

    else:

        print(
            f"Genre Match@{K}          : N/A"
        )

    if artist_match is not None:

        print(
            f"Artist Match@{K}         : "
            f"{artist_match * 100:.2f}%"
        )

    else:

        print(
            f"Artist Match@{K}         : N/A"
        )

    if language_match is not None:

        print(
            f"Language Match@{K}       : "
            f"{language_match * 100:.2f}%"
        )

    else:

        print(
            f"Language Match@{K}       : N/A"
        )

    print(
        f"Diversity@{K}            : "
        f"{diversity * 100:.2f}%"
    )

    # -----------------------------------------------------
    # Show recommendations
    # -----------------------------------------------------

    print()
    print(
        "Top recommendations:"
    )

    display_columns = [
        column
        for column in [
            "track_name",
            "artists",
            "track_genre",
            "primary_mood",
            "final_score",
        ]
        if column in results.columns
    ]

    print(
        results[
            display_columns
        ].to_string(
            index=False
        )
    )

    return {

        "test_case":
            case["name"],

        "recommendations":
            total,

        "mood_alignment":
            mood_alignment,

        "genre_match":
            genre_match,

        "artist_match":
            artist_match,

        "language_match":
            language_match,

        "diversity":
            diversity,
    }


# =========================================================
# FEEDBACK EVALUATION
# =========================================================

def evaluate_feedback():

    print()
    print("=" * 70)
    print("FEEDBACK / LIKE-DISLIKE EVALUATION")
    print("=" * 70)

    def run_case(artist, emotion, feedback):

        return recommend(
            emotion,
            n=10,
            preferences={
                "genres": ["none"],
                "artists": [artist]
            },
            confidence=1.0,
            feedback=feedback,
            use_spotify=False,
            language="english"
        )

    # -----------------------------------------------------
    # LIKE TEST — Lana Del Rey
    # -----------------------------------------------------

    lana_baseline = run_case(
        "Lana Del Rey",
        "sadness",
        None
    )

    lana_liked = run_case(
        "Lana Del Rey",
        "sadness",
        {
            "liked_artists": ["Lana Del Rey"],
            "liked_genres": [],
            "liked_tracks": [],
            "skipped_artists": [],
            "skipped_genres": [],
            "skipped_tracks": []
        }
    )

    # -----------------------------------------------------
    # DISLIKE TEST — Taylor Swift
    # -----------------------------------------------------

    taylor_baseline = run_case(
        "Taylor Swift",
        "joy",
        None
    )

    taylor_disliked = run_case(
        "Taylor Swift",
        "joy",
        {
            "liked_artists": [],
            "liked_genres": [],
            "liked_tracks": [],
            "skipped_artists": ["Taylor Swift"],
            "skipped_genres": [],
            "skipped_tracks": []
        }
    )

    def prepare(result):

        if result is None:
            return pd.DataFrame()

        if not isinstance(result, pd.DataFrame):
            result = pd.DataFrame(result)

        return result.head(10).copy()

    lana_baseline = prepare(lana_baseline)
    lana_liked = prepare(lana_liked)
    taylor_baseline = prepare(taylor_baseline)
    taylor_disliked = prepare(taylor_disliked)

    if (
        lana_baseline.empty
        or lana_liked.empty
        or taylor_baseline.empty
        or taylor_disliked.empty
    ):
        print("Feedback evaluation could not be completed.")
        return None

    # -----------------------------------------------------
    # LIKE RESULTS
    # -----------------------------------------------------

    lana_feedback_scores = (
        lana_liked["feedback_score"].tolist()
        if "feedback_score" in lana_liked.columns
        else []
    )

    lana_baseline_scores = (
        lana_baseline["final_score"].tolist()
        if "final_score" in lana_baseline.columns
        else []
    )

    lana_liked_scores = (
        lana_liked["final_score"].tolist()
        if "final_score" in lana_liked.columns
        else []
    )

    max_lana_feedback = (
        max(lana_feedback_scores)
        if lana_feedback_scores
        else 0.0
    )

    lana_average_score_change = (
        sum(lana_liked_scores) / len(lana_liked_scores)
        - sum(lana_baseline_scores) / len(lana_baseline_scores)
        if lana_liked_scores and lana_baseline_scores
        else 0.0
    )

    # -----------------------------------------------------
    # DISLIKE RESULTS
    # -----------------------------------------------------

    taylor_feedback_scores = (
        taylor_disliked["feedback_score"].tolist()
        if "feedback_score" in taylor_disliked.columns
        else []
    )

    taylor_baseline_scores = (
        taylor_baseline["final_score"].tolist()
        if "final_score" in taylor_baseline.columns
        else []
    )

    taylor_disliked_scores = (
        taylor_disliked["final_score"].tolist()
        if "final_score" in taylor_disliked.columns
        else []
    )

    min_taylor_feedback = (
        min(taylor_feedback_scores)
        if taylor_feedback_scores
        else 0.0
    )

    taylor_average_score_change = (
        sum(taylor_disliked_scores) / len(taylor_disliked_scores)
        - sum(taylor_baseline_scores) / len(taylor_baseline_scores)
        if taylor_disliked_scores and taylor_baseline_scores
        else 0.0
    )

    # -----------------------------------------------------
    # Print results
    # -----------------------------------------------------

    print()
    print("LIKE TEST — LANA DEL REY")
    print("-" * 70)

    print(
        f"Baseline recommendations : "
        f"{len(lana_baseline)}/10"
    )

    print(
        f"Liked recommendations    : "
        f"{len(lana_liked)}/10"
    )

    print(
        f"Maximum positive feedback score: "
        f"{max_lana_feedback:.3f}"
    )

    print(
        f"Average final-score change: "
        f"{lana_average_score_change:+.4f}"
    )

    print()
    print(
        lana_liked[
            [
                column
                for column in [
                    "track_name",
                    "artists",
                    "feedback_score",
                    "final_score"
                ]
                if column in lana_liked.columns
            ]
        ].to_string(index=False)
    )

    print()
    print("DISLIKE TEST — TAYLOR SWIFT")
    print("-" * 70)

    print(
        f"Baseline recommendations : "
        f"{len(taylor_baseline)}/10"
    )

    print(
        f"Disliked recommendations : "
        f"{len(taylor_disliked)}/10"
    )

    print(
        f"Minimum negative feedback score: "
        f"{min_taylor_feedback:.3f}"
    )

    print(
        f"Average final-score change: "
        f"{taylor_average_score_change:+.4f}"
    )

    print()
    print(
        taylor_disliked[
            [
                column
                for column in [
                    "track_name",
                    "artists",
                    "feedback_score",
                    "final_score"
                ]
                if column in taylor_disliked.columns
            ]
        ].to_string(index=False)
    )

    return {
        "liked_artist_count": len(lana_liked),
        "skipped_artist_count": len(taylor_disliked),
        "liked_positive_score": max_lana_feedback,
        "skipped_negative_score": min_taylor_feedback,
        "liked_average_score_change": lana_average_score_change,
        "disliked_average_score_change": taylor_average_score_change
    }


# =========================================================
# MAIN
# =========================================================

def main():

    print()
    print("#" * 70)
    print(
        "WEEK 7 - RECOMMENDATION ENGINE EVALUATION"
    )
    print("#" * 70)

    if not DATASET_PATH.exists():

        print()
        print(
            "Dataset not found:"
        )

        print(
            DATASET_PATH
        )

        return

    print()
    print(
        "Dataset:"
    )

    print(
        DATASET_PATH
    )

    # Confirm dataset is readable.
    dataset = pd.read_csv(
        DATASET_PATH,
        nrows=5
    )

    print()
    print(
        "Dataset loaded successfully."
    )

    print()
    print(
        "Evaluation uses proxy metrics because "
        "no human-labelled recommendation ground truth "
        "is available."
    )

    all_results = []

    for case in TEST_CASES:

        result = evaluate_case(
            case
        )

        if result:

            all_results.append(
                result
            )

    feedback_result = (
        evaluate_feedback()
    )

    # -----------------------------------------------------
    # Summary
    # -----------------------------------------------------

    if all_results:

        summary = pd.DataFrame(
            all_results
        )

        print()
        print("=" * 70)
        print(
            "EVALUATION SUMMARY"
        )
        print("=" * 70)

        print()

        print(
            f"Average Mood Alignment : "
            f"{summary['mood_alignment'].mean() * 100:.2f}%"
        )

        genre_values = (
            summary[
                "genre_match"
            ]
            .dropna()
        )

        if not genre_values.empty:

            print(
                f"Average Genre Match    : "
                f"{genre_values.mean() * 100:.2f}%"
            )

        artist_values = (
            summary[
                "artist_match"
            ]
            .dropna()
        )

        if not artist_values.empty:

            print(
                f"Average Artist Match   : "
                f"{artist_values.mean() * 100:.2f}%"
            )

        language_values = (
            summary[
                "language_match"
            ]
            .dropna()
        )

        if not language_values.empty:

            print(
                f"Average Language Match : "
                f"{language_values.mean() * 100:.2f}%"
            )

        print(
            f"Average Diversity      : "
            f"{summary['diversity'].mean() * 100:.2f}%"
        )

        # -------------------------------------------------
        # Save CSV report
        # -------------------------------------------------

        output_path = (
            ROOT
            / "data"
            / "processed"
            / "week7_evaluation_results.csv"
        )

        summary.to_csv(
            output_path,
            index=False
        )

        print()
        print(
            "Evaluation report saved to:"
        )

        print(
            output_path
        )

    print()
    print("#" * 70)
    print(
        "WEEK 7 EVALUATION COMPLETE"
    )
    print("#" * 70)


if __name__ == "__main__":

    main()
