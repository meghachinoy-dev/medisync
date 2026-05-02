#include "ai_rules.h"

int ai_rules_load(AIRule* rules, int maxRules) {
  if (!Firebase.getJSON(fbData, "/ai_rules")) {
    Serial.println(F("[AI] Could not load rules from Firebase"));
    return 0;
  }

  StaticJsonDocument<2048> doc;
  if (deserializeJson(doc, fbData.payload()) != DeserializationError::Ok) return 0;

  int count = 0;
  for (JsonPair kv : doc.as<JsonObject>()) {
    if (count >= maxRules) break;

    JsonObject rule = kv.value().as<JsonObject>();
    if (!rule["applied"] | (bool)!rule["applied"]) continue;

    AIRule& r = rules[count];
    strncpy(r.medicineId,  rule["medicineId"]  | "", sizeof(r.medicineId) - 1);
    strncpy(r.patternType, rule["patternType"] | "", sizeof(r.patternType) - 1);
    r.shiftMinutes  = rule["shiftMinutes"] | 0;
    // Consecutive miss rules get extra beeps proportional to shift
    r.extraBuzzBeeps = (strcmp(r.patternType, "CONSECUTIVE_MISS") == 0)
                       ? min(r.shiftMinutes / 10, 3)
                       : 0;
    r.active = true;
    count++;
  }

  Serial.print(F("[AI] Rules loaded: "));
  Serial.println(count);
  return count;
}

void ai_rules_apply(ScheduleEntry* entries, int count, const AIRule* rules, int ruleCount) {
  for (int i = 0; i < count; i++) {
    for (int j = 0; j < ruleCount; j++) {
      if (!rules[j].active) continue;
      if (strcmp(entries[i].medicineId, rules[j].medicineId) != 0) continue;
      if (strcmp(rules[j].patternType, "CONSECUTIVE_MISS") == 0) {
        entries[i].shiftMinutes = rules[j].shiftMinutes;
        Serial.print(F("[AI] Shifting "));
        Serial.print(entries[i].medicineName);
        Serial.print(F(" by "));
        Serial.print(rules[j].shiftMinutes);
        Serial.println(F(" min"));
      }
    }
  }
}

int ai_rules_get_extra_beeps(const char* medicineId, const AIRule* rules, int ruleCount) {
  for (int i = 0; i < ruleCount; i++) {
    if (!rules[i].active) continue;
    if (strcmp(rules[i].medicineId, medicineId) == 0) {
      return rules[i].extraBuzzBeeps;
    }
  }
  return 0;
}

void ai_buzz_alert(int totalBeeps) {
  for (int i = 0; i < totalBeeps; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(BUZZ_SHORT_MS);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < totalBeeps - 1) delay(BUZZ_GAP_MS);
  }
}
