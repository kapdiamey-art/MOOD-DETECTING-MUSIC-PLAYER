# Emotion Detection Test Cases

This file contains sample sentences used to validate the mood classifier. Each case checks whether the system returns the expected emotion for direct emotional statements and leaves neutral only for ordinary factual statements.

| # | Text | Expected emotion | Model result | Status |
|---|------|------------------|-------------|--------|
| 1 | I am happy today | joy |  |  |
| 2 | I feel sad | sadness |  |  |
| 3 | I am angry | anger |  |  |
| 4 | I love this music | love |  |  |
| 5 | I am terrified | fear |  |  |
| 6 | I am so excited | joy |  |  |
| 7 | I am bored now | sadness |  |  |
| 8 | my day was not that good today i am bored now | sadness |  |  |
| 9 | I am not feeling well today | sadness |  |  |
| 10 | This is so frustrating | anger |  |  |
| 11 | I am worried | fear |  |  |
| 12 | I can't stop smiling at my phone screen | joy |  |  |
| 13 | The meeting got cancelled | neutral |  |  |
| 14 | I am fine | neutral |  |  |
| 15 | The weather is sunny | neutral |  |  |
| 16 | I am going to the office | neutral |  |  |
| 17 | I feel amazing | joy |  |  |
| 18 | I am exhausted | sadness |  |  |
| 19 | I was really hoping this would work, but it didn't | sadness |  |  |
| 20 | I thought I would be happy, but now I feel empty inside | sadness |  |  |
| 21 | I am not okay and everything feels too much | sadness |  |  |
| 22 | I wanted to be excited, but this is just so annoying | anger |  |  |
| 23 | I am trying to stay calm, but I am panicking | fear |  |  |
| 24 | I am stressed and my chest feels tight | fear |  |  |
| 25 | I was thrilled at first, then the whole plan fell apart | sadness |  |  |
| 26 | This is not what I wanted, and now I am furious | anger |  |  |
| 27 | The whole day was okay, but the ending left me disappointed | sadness |  |  |
| 28 | I am not that happy with how things turned out | sadness |  |  |
| 29 | I feel relieved but also a little scared | fear |  |  |
| 30 | I should be grateful, but I feel lonely | sadness |  |  |
| 31 | I am actually doing better than yesterday, so I feel lighter | joy |  |  |
| 32 | I was hoping for a good day, but now I feel drained | sadness |  |  |
| 33 | I keep pretending I am fine, but I am not | sadness |  |  |
| 34 | I am overwhelmed and I do not know what to do | fear |  |  |
| 35 | It should have been good, but it ended up being a disaster | anger |  |  |
| 36 | I am going to take it one step at a time and try to relax | neutral |  |  |
| 37 | I was supposed to meet them, but the call got cancelled | neutral |  |  |
| 38 | The room is quiet and the lights are off, and I feel uneasy | fear |  |  |
| 39 | I am glad the situation is settled, even if I am still tired | joy |  |  |
| 40 | I am okay for now, just a bit exhausted | sadness |  |  |
| 41 | I’m low today and honestly I don’t feel like doing anything | sadness |  |  |
| 42 | this is so draining, I can’t deal with this anymore | sadness |  |  |
| 43 | I’m kinda overwhelmed rn and I need a minute | fear |  |  |
| 44 | I’m actually feeling pretty good after all | joy |  |  |
| 45 | I’m not in the mood for this at all | sadness |  |  |
| 46 | this got on my nerves, like seriously | anger |  |  |
| 47 | i’m freaking out a little but trying to stay calm | fear |  |  |
| 48 | i’m so hyped for this, can’t wait | joy |  |  |
| 49 | i’m not okay, this is honestly exhausting | sadness |  |  |
| 50 | i am so done with this whole thing | anger |  |  |
| 51 | i’m feeling a bit off today, not my usual self | sadness |  |  |
| 52 | the weather is actually nice today, i’m in a good mood | joy |  |  |
| 53 | i’m fine, just tired and annoyed | sadness |  |  |
| 54 | honestly this is kind of stressing me out | fear |  |  |
| 55 | i’m not really happy about this, to be honest | sadness |  |  |
| 56 | i can’t stop smiling about it lol | joy |  |  |
| 57 | i’m so relieved this is over | joy |  |  |
| 58 | i feel completely drained after that call | sadness |  |  |
| 59 | this is so frustrating, i’m getting angry | anger |  |  |
| 60 | a bit anxious, but trying to stay positive | fear |  |  |
| 61 | I’m dead tired and just want to crash | sadness |  |  |
| 62 | I’m not feeling this today at all | sadness |  |  |
| 63 | this is giving me stress and I hate it | fear |  |  |
| 64 | I’m vibing today, everything feels good | joy |  |  |
| 65 | this is such a mood, honestly | joy |  |  |
| 66 | I’m not vibing with this at all | sadness |  |  |
| 67 | I’m kinda nervous but trying to be brave | fear |  |  |
| 68 | I’m so over it right now | anger |  |  |
| 69 | I’m done with this, honestly | anger |  |  |
| 70 | I feel kinda empty after that | sadness |  |  |
| 71 | I’m actually really happy about this | joy |  |  |
| 72 | I’m so anxious about tomorrow | fear |  |  |
| 73 | I’m not mad, just disappointed | sadness |  |  |
| 74 | this is so toxic and draining | sadness |  |  |
| 75 | I’m buzzing with excitement | joy |  |  |
| 76 | I’m trying to stay positive but I’m scared | fear |  |  |
| 77 | I’m lowkey exhausted from everything | sadness |  |  |
| 78 | I’m good, just a little tired | neutral |  |  |

## Validation note
All rows should match the expected emotion. If any row fails, the classifier logic must be adjusted before considering the model stable.
