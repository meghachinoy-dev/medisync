#include "firebase_handler.h"

FirebaseData  fbData;
FirebaseAuth  fbAuth;
FirebaseConfig fbConfig;

void firebase_init() {
  fbConfig.host = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);
  // Increase stream timeout to reduce disconnections on slow WiFi
  Firebase.setReadTimeout(fbData, 1000 * 60);
  Firebase.setwriteSizeLimit(fbData, "tiny");
  Serial.println(F("[Firebase] Initialised"));
}

bool firebase_connected() {
  return Firebase.ready();
}

// ─── Schedule loading ─────────────────────────────────────────────────────────
// Reads /medicines from Firebase and builds today's schedule array.
// Returns number of entries filled.
int firebase_load_schedule(ScheduleEntry* entries, int maxEntries) {
  int count = 0;

  if (!Firebase.getJSON(fbData, USER_BASE "/medicines")) {
    Serial.print(F("[Firebase] getJSON /medicines failed: "));
    Serial.println(fbData.errorReason());
    return 0;
  }

  StaticJsonDocument<4096> doc;
  DeserializationError err = deserializeJson(doc, fbData.payload());
  if (err) {
    Serial.print(F("[Firebase] JSON parse error: "));
    Serial.println(err.c_str());
    return 0;
  }

  // Today's day-of-week (0=Sun … 6=Sat) from RTC is set before this call
  // We use the system time which is synced from DS3231 on boot
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);
  int todayDow = t->tm_wday;

  for (JsonPair kv : doc.as<JsonObject>()) {
    if (count >= maxEntries) break;

    JsonObject med = kv.value().as<JsonObject>();
    if (!med["active"] | (bool)!med["active"]) continue;

    // Check scheduleDays array
    bool schedToday = false;
    for (JsonVariant day : med["scheduleDays"].as<JsonArray>()) {
      if (day.as<int>() == todayDow) { schedToday = true; break; }
    }
    if (!schedToday) continue;

    const char* medId   = kv.key().c_str();
    const char* medName = med["name"] | "Unknown";
    int compNum         = med["compartmentNumber"] | 0;

    // Fetch AI time shift for this medicine
    int shift = firebase_load_ai_shifts(medId);

    for (JsonVariant timeVal : med["doseTimes"].as<JsonArray>()) {
      if (count >= maxEntries) break;

      ScheduleEntry& e = entries[count];
      e.compartment = compNum;
      strncpy(e.medicineId,   medId,   sizeof(e.medicineId) - 1);
      strncpy(e.medicineName, medName, sizeof(e.medicineName) - 1);
      strncpy(e.scheduledTime, timeVal.as<const char*>(), sizeof(e.scheduledTime) - 1);
      e.shiftMinutes = shift;
      e.fired = false;
      count++;
    }
  }

  Serial.print(F("[Firebase] Schedule loaded, entries: "));
  Serial.println(count);
  return count;
}

bool firebase_check_schedule_update_flag() {
  if (!Firebase.getBool(fbData, USER_BASE "/hardware_commands/schedule_update")) return false;
  return fbData.boolData();
}

void firebase_clear_schedule_update_flag() {
  Firebase.setBool(fbData, USER_BASE "/hardware_commands/schedule_update", false);
}

// ─── Dose logging ─────────────────────────────────────────────────────────────
void firebase_log_dose(int compartment, const char* medicineId,
                       const char* scheduledTime, const char* status,
                       bool irConfirmed, int pillsRemaining) {
  time_t now = time(nullptr);
  struct tm* t = localtime(&now);

  char dateKey[12];
  snprintf(dateKey, sizeof(dateKey), "%04d-%02d-%02d", t->tm_year + 1900, t->tm_mon + 1, t->tm_mday);

  char logId[48];
  snprintf(logId, sizeof(logId), "hw_%ld", (long)now);

  char path[160];
  snprintf(path, sizeof(path), USER_BASE "/dose_logs/%s/%s", dateKey, logId);

  StaticJsonDocument<256> doc;
  doc["medicineId"]         = medicineId;
  doc["scheduledTime"]      = scheduledTime;
  doc["actualTime"]         = scheduledTime;
  doc["status"]             = status;
  doc["dispensedByHardware"] = true;
  doc["confirmedByIR"]      = irConfirmed;
  doc["pillsRemaining"]     = pillsRemaining;
  doc["timestamp"]          = (long)now * 1000L;

  String payload;
  serializeJson(doc, payload);

  FirebaseJson fbjson;
  fbjson.setJsonData(payload);
  if (!Firebase.setJSON(fbData, path, fbjson)) {
    Serial.print(F("[Firebase] log_dose failed: "));
    Serial.println(fbData.errorReason());
  }
}

// ─── Hardware status ──────────────────────────────────────────────────────────
void firebase_write_status(bool online, int batteryPct, int wifiRSSI,
                           unsigned long lastDispenseEpoch) {
  StaticJsonDocument<256> doc;
  doc["deviceId"]        = DEVICE_ID;
  doc["online"]          = online;
  doc["lastSeen"]        = (long)time(nullptr) * 1000L;
  doc["batteryPercent"]  = batteryPct;
  doc["wifiSSID"]        = WIFI_SSID;
  doc["wifiStrength"]    = wifiRSSI;
  doc["lastDispenseTime"] = (long)lastDispenseEpoch * 1000L;
  doc["firmwareVersion"] = FIRMWARE_VER;

  String payload;
  serializeJson(doc, payload);

  FirebaseJson fbjson;
  fbjson.setJsonData(payload);
  if (!Firebase.setJSON(fbData, USER_BASE "/hardware_status", fbjson)) {
    Serial.print(F("[Firebase] write_status failed: "));
    Serial.println(fbData.errorReason());
  }
}

// ─── Compartment pill counts ──────────────────────────────────────────────────
void firebase_write_compartment(int num, int pillsRemaining, const char* status) {
  char path[128];
  snprintf(path, sizeof(path), USER_BASE "/compartments/%d/pillsRemaining", num);
  Firebase.setInt(fbData, path, pillsRemaining);

  snprintf(path, sizeof(path), USER_BASE "/compartments/%d/status", num);
  Firebase.setString(fbData, path, status);
}

// ─── AI shift lookup ──────────────────────────────────────────────────────────
// Reads /ai_rules/ looking for an applied CONSECUTIVE_MISS rule for this medicine.
// Returns the shiftMinutes value (0 if none found).
int firebase_load_ai_shifts(const char* medicineId) {
  if (!Firebase.getJSON(fbData, USER_BASE "/ai_rules")) return 0;

  StaticJsonDocument<2048> doc;
  if (deserializeJson(doc, fbData.payload()) != DeserializationError::Ok) return 0;

  for (JsonPair kv : doc.as<JsonObject>()) {
    JsonObject rule = kv.value().as<JsonObject>();
    const char* rMedId = rule["medicineId"] | "";
    bool applied       = rule["applied"] | false;
    const char* ptype  = rule["patternType"] | "";

    if (applied && strcmp(rMedId, medicineId) == 0 &&
        strcmp(ptype, "CONSECUTIVE_MISS") == 0) {
      return rule["shiftMinutes"] | 0;
    }
  }
  return 0;
}

// ─── Force dispense command ───────────────────────────────────────────────────
bool firebase_check_force_dispense(int* compartmentOut) {
  if (!Firebase.getInt(fbData, USER_BASE "/hardware_commands/force_dispense")) return false;
  int comp = fbData.intData();
  if (comp >= 1 && comp <= 6) {
    *compartmentOut = comp;
    Firebase.setInt(fbData, USER_BASE "/hardware_commands/force_dispense", 0);
    return true;
  }
  return false;
}

// ─── LCD override message ─────────────────────────────────────────────────────
String firebase_get_lcd_message() {
  if (!Firebase.getString(fbData, USER_BASE "/hardware_commands/lcd_message")) return "";
  return fbData.stringData();
}
