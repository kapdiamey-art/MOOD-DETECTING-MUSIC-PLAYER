import os
import sys

os.chdir(r"C:\Users\ameyk\OneDrive\Desktop\PERSISTENT INTERNSHIP\Mood Detecting Music Player\Emotion Detection Model\src")

import predict

cases = [
    ("I am happy today", "joy"),
    ("I feel sad", "sadness"),
    ("I am angry", "anger"),
    ("I love this music", "love"),
    ("I am terrified", "fear"),
    ("I am so excited", "joy"),
    ("I am bored now", "sadness"),
    ("my day was not that good today i am bored now", "sadness"),
    ("I am not feeling well today", "sadness"),
    ("This is so frustrating", "anger"),
    ("I am worried", "fear"),
    ("I can't stop smiling at my phone screen", "joy"),
    ("The meeting got cancelled", "neutral"),
    ("I am fine", "neutral"),
    ("The weather is sunny", "neutral"),
    ("I am going to the office", "neutral"),
    ("I feel amazing", "joy"),
    ("I am exhausted", "sadness"),
    ("I was really hoping this would work, but it did not", "sadness"),
    ("I thought I would be happy, but now I feel empty inside", "sadness"),
    ("I am not okay and everything feels too much", "sadness"),
    ("I wanted to be excited, but this is just so annoying", "anger"),
    ("I am trying to stay calm, but I am panicking", "fear"),
    ("I am stressed and my chest feels tight", "fear"),
    ("I was thrilled at first, then the whole plan fell apart", "sadness"),
    ("This is not what I wanted, and now I am furious", "anger"),
    ("The whole day was okay, but the ending left me disappointed", "sadness"),
    ("I am not that happy with how things turned out", "sadness"),
    ("I feel relieved but also a little scared", "fear"),
    ("I should be grateful, but I feel lonely", "sadness"),
    ("I am actually doing better than yesterday, so I feel lighter", "joy"),
    ("I was hoping for a good day, but now I feel drained", "sadness"),
    ("I keep pretending I am fine, but I am not", "sadness"),
    ("I am overwhelmed and I do not know what to do", "fear"),
    ("It should have been good, but it ended up being a disaster", "anger"),
    ("I am going to take it one step at a time and try to relax", "neutral"),
    ("I was supposed to meet them, but the call got cancelled", "neutral"),
    ("The room is quiet and the lights are off, and I feel uneasy", "fear"),
    ("I am glad the situation is settled, even if I am still tired", "joy"),
    ("I am okay for now, just a bit exhausted", "sadness"),
    ("I’m low today and honestly I don’t feel like doing anything", "sadness"),
    ("this is so draining, I can’t deal with this anymore", "sadness"),
    ("I’m kinda overwhelmed rn and I need a minute", "fear"),
    ("I’m actually feeling pretty good after all", "joy"),
    ("I’m not in the mood for this at all", "sadness"),
    ("this got on my nerves, like seriously", "anger"),
    ("i’m freaking out a little but trying to stay calm", "fear"),
    ("i’m so hyped for this, can’t wait", "joy"),
    ("i’m not okay, this is honestly exhausting", "sadness"),
    ("i am so done with this whole thing", "anger"),
    ("i’m feeling a bit off today, not my usual self", "sadness"),
    ("the weather is actually nice today, i’m in a good mood", "joy"),
    ("i’m fine, just tired and annoyed", "sadness"),
    ("honestly this is kind of stressing me out", "fear"),
    ("i’m not really happy about this, to be honest", "sadness"),
    ("i can’t stop smiling about it lol", "joy"),
    ("i’m so relieved this is over", "joy"),
    ("i feel completely drained after that call", "sadness"),
    ("this is so frustrating, i’m getting angry", "anger"),
    ("a bit anxious, but trying to stay positive", "fear"),
    ("I’m dead tired and just want to crash", "sadness"),
    ("I’m not feeling this today at all", "sadness"),
    ("this is giving me stress and I hate it", "fear"),
    ("I’m vibing today, everything feels good", "joy"),
    ("this is such a mood, honestly", "joy"),
    ("I’m not vibing with this at all", "sadness"),
    ("I’m kinda nervous but trying to be brave", "fear"),
    ("I’m so over it right now", "anger"),
    ("I’m done with this, honestly", "anger"),
    ("I feel kinda empty after that", "sadness"),
    ("I’m actually really happy about this", "joy"),
    ("I’m so anxious about tomorrow", "fear"),
    ("I’m not mad, just disappointed", "sadness"),
    ("this is so toxic and draining", "sadness"),
    ("I’m buzzing with excitement", "joy"),
    ("I’m trying to stay positive but I’m scared", "fear"),
    ("I’m lowkey exhausted from everything", "sadness"),
    ("I’m good, just a little tired", "neutral"),
]

passes = 0
fails = []

for text, expected in cases:
    result = predict.predict_emotion(text)
    actual = result["emotion"]
    if actual == expected:
        passes += 1
    else:
        fails.append((text, expected, actual, result.get("confidence"), result.get("status")))

print(f"TOTAL_CASES={len(cases)}")
print(f"PASSED={passes}")
print(f"FAILED={len(fails)}")

for text, expected, actual, confidence, status in fails:
    print(f"FAIL|expected={expected}|actual={actual}|status={status}|confidence={confidence}|text={text}")

if fails:
    raise SystemExit(1)
