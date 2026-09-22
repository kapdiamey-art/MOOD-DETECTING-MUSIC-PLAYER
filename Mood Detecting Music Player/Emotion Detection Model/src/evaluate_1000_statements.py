import os
import sys
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support

# Ensure import paths are set
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.dirname(SRC_DIR)
sys.path.insert(0, SRC_DIR)

from predict import predict_emotion

def run_1000_evaluation():
    print("=" * 75)
    print("EVALUATING CUSTOM PYTORCH MODEL ON 1,000 TEST STATEMENTS")
    print("=" * 75)

    test_csv_path = os.path.join(MODEL_DIR, "data", "processed", "test.csv")
    if not os.path.exists(test_csv_path):
        print(f"Error: Test dataset not found at {test_csv_path}")
        return

    test_df = pd.read_csv(test_csv_path)
    
    # Take up to 1,000 test examples
    eval_df = test_df.head(1000).copy()
    total_count = len(eval_df)
    print(f"Loaded {total_count} test statements for evaluation.\n")

    y_true = []
    y_pred = []
    confidences = []
    correct_count = 0

    results = []

    for idx, row in eval_df.iterrows():
        text = str(row["text"])
        true_emotion = str(row["emotion"]).strip().lower()

        pred_res = predict_emotion(text)
        predicted_emotion = pred_res.get("emotion", "neutral")
        confidence = pred_res.get("confidence", 0.0)

        if predicted_emotion is None:
            predicted_emotion = "neutral"

        y_true.append(true_emotion)
        y_pred.append(predicted_emotion)
        confidences.append(confidence)

        is_correct = (predicted_emotion == true_emotion)
        if is_correct:
            correct_count += 1

        results.append({
            "text": text,
            "true": true_emotion,
            "pred": predicted_emotion,
            "confidence": confidence,
            "correct": is_correct
        })

    accuracy = (correct_count / total_count) * 100
    avg_confidence = sum(confidences) / total_count * 100

    print("SUMMARY RESULTS")
    print("-" * 50)
    print(f"Total Statements Tested : {total_count}")
    print(f"Correct Predictions     : {correct_count}")
    print(f"Overall Model Accuracy  : {accuracy:.2f}%")
    print(f"Average AI Confidence   : {avg_confidence:.2f}%")
    print("-" * 50)

    print("\nPER-EMOTION CLASSIFICATION METRICS:")
    labels = ["sadness", "joy", "love", "anger", "fear", "surprise"]
    report = classification_report(y_true, y_pred, labels=labels, zero_division=0)
    print(report)

    print("\nSAMPLE PREDICTIONS (First 15 Statements):")
    print(f"{'Text':<55} | {'True':<9} | {'Pred':<9} | {'Conf':<6} | {'Status'}")
    print("-" * 95)
    for r in results[:15]:
        status = "CORRECT" if r["correct"] else "FAIL"
        short_text = (r["text"][:52] + "...") if len(r["text"]) > 52 else r["text"]
        print(f"{short_text:<55} | {r['true']:<9} | {r['pred']:<9} | {r['confidence']*100:5.1f}% | {status}")

    return accuracy, results

if __name__ == "__main__":
    run_1000_evaluation()
