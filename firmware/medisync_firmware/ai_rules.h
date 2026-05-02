#ifndef AI_RULES_H
#define AI_RULES_H

#include <Arduino.h>
#include "firebase_handler.h"
#include "config.h"

// Maximum rules stored in embedded rule cache
#define MAX_AI_RULES  12

struct AIRule {
  char   medicineId[32];
  char   patternType[32];
  int    shiftMinutes;
  int    extraBuzzBeeps;  // Additional beeps beyond default BUZZ_BEEPS
  bool   active;
};

// ─── Load rules from Firebase into local cache ───────────────────────────────
// Call once on boot and again whenever schedule_update flag is set.
int ai_rules_load(AIRule* rules, int maxRules);

// ─── Apply time shifts from cached rules to the schedule array ───────────────
// Modifies entries[].shiftMinutes in place.
void ai_rules_apply(ScheduleEntry* entries, int count, const AIRule* rules, int ruleCount);

// ─── Get buzzer extra beeps for a medicine (from CONSECUTIVE_MISS rule) ──────
int ai_rules_get_extra_beeps(const char* medicineId, const AIRule* rules, int ruleCount);

// ─── Buzzer helper ────────────────────────────────────────────────────────────
void ai_buzz_alert(int totalBeeps);

#endif // AI_RULES_H
