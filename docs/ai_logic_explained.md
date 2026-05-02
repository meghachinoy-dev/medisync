# MediSync AI Adaptive Scheduling Engine — Explained for Examiners

## What is "AI" in MediSync?

The term Artificial Intelligence (AI) is often associated with large neural networks and complex machine learning. In MediSync, we use a **rule-based adaptive AI system** — a well-established AI paradigm that:
1. **Observes** historical behaviour (dose logs over 30 days)
2. **Detects** patterns in that data
3. **Makes decisions** about how to adapt the system
4. **Takes action** automatically without human intervention
5. **Learns** by continuously updating rules as new data arrives

This qualifies as AI because the system exhibits **adaptive behaviour driven by data** — it changes how it operates based on what it observes about the user. A fixed alarm clock is NOT AI. A system that moves the alarm time based on the user's past behaviour IS AI.

---

## The Six Detection Patterns

### Pattern 1: Consecutive Miss Detection

**What it observes**: Did the patient miss the same dose at the same time for 3 or more days in a row?

**Algorithm**:
```
For each medicine M, for each scheduled time T:
  streak = 0
  For each of the last 14 days (most recent first):
    If dose M at time T was "missed":
      streak++
    Else: break
  If streak >= 3:
    Raise insight: CONSECUTIVE_MISS
```

**What it does**: Shifts the reminder time `min(streak × 5, 30)` minutes earlier. If you've missed your 8:00 PM dose 6 days in a row, the system now reminds you at 7:30 PM. The buzzer also beeps more times (up to 3 extra beeps) to ensure the alert is noticed.

**Why this is adaptive AI**: The system *learns* that this particular patient is not responding to the current reminder time and *adapts* — just as a doctor would tell you "since you keep forgetting your evening medicine, let's try reminding you earlier."

---

### Pattern 2: Day-of-Week Pattern Detection

**What it observes**: Does the patient consistently miss doses on specific days of the week?

**Algorithm**:
```
For each medicine M, for each day-of-week D:
  Count doses scheduled on day D in last 4 weeks
  Count doses missed on day D in last 4 weeks
  missRate = missed / total
  If total >= 3 AND missRate >= 0.65:
    Raise insight: DAY_OF_WEEK
```

**What it does**: Adds a secondary reminder 30 minutes earlier on the problematic day. For example, if Omeprazole is missed every Friday (because of a different morning routine), the system adds a 7:00 AM reminder on Fridays (30 min before the 7:30 AM scheduled time).

**Confidence calculation**: `0.5 + missRate × 0.5` — if you miss 80% of Fridays, confidence = 0.90 (very high). If only 65%, confidence = 0.825.

---

### Pattern 3: Low Stock Detection

**What it observes**: Are pills running low in any compartment?

**Algorithm**:
```
For each compartment C:
  If pillsRemaining <= 5 AND pillsRemaining > 0:
    Raise: LOW_STOCK (warning, confidence 1.0)
  If pillsRemaining == 0:
    Raise: EMPTY_COMPARTMENT (critical, confidence 1.0)
```

**What it does**: Auto-generates an alert that is marked for caregiver notification. The NodeMCU also shows "LOW STOCK!" on the LCD and beeps twice after dispensing from a low compartment.

**Why confidence is 1.0**: This is a deterministic measurement — the count is either ≤5 or it isn't. No probability needed.

---

### Pattern 4: Compliance Threshold Alert

**What it observes**: What is the 7-day rolling compliance rate for each medicine?

**Algorithm**:
```
For each medicine M:
  total = count of scheduled doses in last 7 days
  taken = count of "taken" doses in last 7 days
  rate = taken / total
  If rate < 0.70 (70%):
    Raise: COMPLIANCE_THRESHOLD
    Severity = "critical" if rate < 0.50, else "warning"
```

**What it does**: Generates a DOCTOR_NOTIFY alert. This tells the caregiver or doctor that the patient's adherence to this specific medicine has fallen below the medically recommended threshold. Many chronic medications (e.g. antihypertensives, diabetes drugs) require >70% compliance to be therapeutically effective.

---

### Pattern 5: Early-Take Pattern Detection

**What it observes**: Does the patient consistently take their medicine before the scheduled time?

**Algorithm**:
```
For each medicine M, for each time T:
  Collect all instances where medicine was taken >= 10 min before T (last 21 days)
  If we have >= 5 such instances:
    avgEarlyMinutes = mean of (scheduledTime - actualTime)
    Raise: EARLY_TAKE_PATTERN
    suggestedAction = move schedule T minutes earlier
```

**What it does**: This is a *suggestion* (autoApply = false) rather than an automatic change. It tells the user "You consistently take Aspirin 20 minutes before the scheduled 1:00 PM time. Would you like to move the schedule to 12:40 PM?" This reduces friction and makes the schedule match the patient's natural rhythm.

---

### Pattern 6: Interaction Window Detection

**What it observes**: Are two medicines scheduled within 15 minutes of each other?

**Algorithm**:
```
For each pair of medicines (A, B) with shared schedule days:
  For each time TA in A and TB in B:
    diff = |TA - TB| in minutes
    If 0 < diff <= 15:
      Raise: INTERACTION_WINDOW
```

**What it does**: Recommends staggering the two doses by at least 30 minutes. While not a pharmacological drug interaction check, taking two medicines simultaneously can cause patient confusion about which compartment to use, and some medicines (e.g. calcium supplements and thyroid medication) should not be taken together.

---

## Why This Qualifies as Artificial Intelligence

| AI Criterion | MediSync Implementation |
|---|---|
| **Data-driven decisions** | All rules are derived from analysing 30 days of dose log data |
| **Adaptive behaviour** | The system changes its outputs (reminder times, buzzer patterns) based on what it observes |
| **Feedback loop** | Rule outcomes feed back into the system — if a shifted reminder leads to higher compliance, subsequent analysis sees fewer misses |
| **Automated reasoning** | The system reasons: "If this person has missed this dose 4 times in a row at this time, moving the reminder earlier is likely to help" |
| **Confidence scores** | The engine quantifies how certain it is about each pattern (0–100%), reflecting probabilistic thinking |
| **No hardcoded thresholds for every patient** | The system learns each patient's specific patterns rather than applying one-size-fits-all rules |

### Comparison to Other AI Types

| Type | Example | How MediSync Compares |
|---|---|---|
| Expert Systems | Medical diagnosis rules | MediSync's rule engine is an expert system for medication adherence |
| Machine Learning (ML) | Neural network predicting disease | MediSync uses simpler deterministic rules, but the *output* (adapted schedule) is equivalent |
| Adaptive Systems | Recommendation engines | MediSync adapts recommendations and actions based on user behaviour |

> **For the examiner**: The distinction from a simple alarm is crucial. A simple alarm rings at a fixed time regardless of behaviour. MediSync's system analyses patterns, infers causes, and automatically adjusts — this adaptive, data-driven decision-making is the core definition of AI.

---

## Data Flow of the AI Engine

```
Firebase dose_logs (30 days)
         │
         ▼
   aiEngine.js (React app)
   ┌──────────────────────────────┐
   │  runAIEngine(logs, meds)     │
   │  → detectConsecutiveMiss()   │
   │  → detectDayOfWeekPattern()  │
   │  → detectLowStock()          │
   │  → detectComplianceThreshold │
   │  → detectEarlyTakePattern()  │
   │  → detectInteractionWindow() │
   └──────────────────────────────┘
         │
         ▼
   Array of insights (sorted by severity + confidence)
         │
         ├──► AIInsights.jsx — displayed as insight cards
         │
         └──► buildAdaptiveRules() → /ai_rules in Firebase
                                          │
                                          ▼
                               NodeMCU reads /ai_rules on boot
                               → ai_rules_apply() modifies local schedule
                               → Buzzer plays extra beeps for missed patterns
                               → LCD can show pattern-based messages
```

---

## Glossary for Examiners

**Confidence level**: A percentage (0–100%) expressing how certain the AI is about a detected pattern. Higher confidence = more data supporting the pattern.

**Adaptive rule**: A rule that automatically changes the system's behaviour (e.g. "shift reminder time") based on detected patterns.

**autoApply**: Rules with this flag set to true are automatically pushed to Firebase and the NodeMCU acts on them. Rules with autoApply = false are suggestions for the user to consider.

**Compliance rate**: The percentage of scheduled doses that were actually taken. Medical guidelines for chronic conditions typically require ≥70% compliance for therapeutic effectiveness.

**Rule-based AI**: A form of AI where decisions are made by applying a set of logical rules to observed data, as opposed to neural network AI which learns weights from training data. Both are valid and widely used forms of AI.
