/*
 * MediSync IoT — Smart Medicine Dispenser Firmware
 * NodeMCU ESP8266 | DS3231 RTC | 6x SG90 Servo | 16x2 I2C LCD
 * ICSE 10th Grade Project — v2.1.4
 *
 * Pin mapping: see config.h
 * Libraries:   see ../libraries_required.txt
 */

#include <ESP8266WiFi.h>
#include "config.h"
#include "firebase_handler.h"
#include "servo_controller.h"
#include "rtc_handler.h"
#include "lcd_display.h"
#include "sensor_handler.h"
#include "ai_rules.h"

// ─── Global state ─────────────────────────────────────────────────────────────
static ScheduleEntry schedule[MAX_SCHEDULE_ENTRIES];
static int           scheduleCount = 0;
static AIRule        aiRules[MAX_AI_RULES];
static int           aiRuleCount  = 0;

static unsigned long lastStatusUpload    = 0;
static unsigned long lastSchedulePoll    = 0;
static unsigned long lastPillCountWrite  = 0;
static unsigned long lastDoseCheck       = 0;
static unsigned long lastDispenseEpoch   = 0;
static bool          firebaseReady       = false;   // set once Firebase is initialised

// WiFi event handlers — keep these alive for the whole program so the ESP8266
// keeps calling them. Used to print WHY the link drops (reason code) + IP events.
static WiFiEventHandler _onDisconnect;
static WiFiEventHandler _onGotIP;

// ─── Scan visible networks (diagnostic) ──────────────────────────────────────
// Prints every 2.4 GHz network the ESP8266 can actually see, with signal and
// security type. If our SSID doesn't appear, it's a channel/range problem; if
// it appears as WPA3/enterprise, the ESP8266 can't join it.
void scanNetworks() {
  Serial.println(F("[WiFi] Scanning visible networks..."));
  int n = WiFi.scanNetworks();
  if (n == 0) { Serial.println(F("[WiFi]   (none found)")); return; }
  for (int i = 0; i < n; i++) {
    Serial.print(F("[WiFi]   "));
    Serial.print(WiFi.SSID(i));
    Serial.print(F("  rssi="));
    Serial.print(WiFi.RSSI(i));
    Serial.print(F("  ch="));
    Serial.print(WiFi.channel(i));
    Serial.print(F("  enc="));
    switch (WiFi.encryptionType(i)) {
      case ENC_TYPE_NONE: Serial.println(F("OPEN")); break;
      case ENC_TYPE_WEP:  Serial.println(F("WEP")); break;
      case ENC_TYPE_TKIP: Serial.println(F("WPA")); break;
      case ENC_TYPE_CCMP: Serial.println(F("WPA2")); break;
      case ENC_TYPE_AUTO: Serial.println(F("WPA/WPA2")); break;
      default:            Serial.println(WiFi.encryptionType(i)); break;  // unknown = maybe WPA3
    }
  }
  WiFi.scanDelete();
}

// ─── WiFi connection ──────────────────────────────────────────────────────────
void connectWiFi() {
  lcd_show_wifi_connecting();
  Serial.print(F("[WiFi] Connecting to "));
  Serial.println(WIFI_SSID);

  // Stability settings — these fix the "connects then drops" behaviour seen on
  // phone hotspots, which kick clients that let their radio sleep:
  WiFi.persistent(false);              // don't hammer flash with every begin()
  WiFi.mode(WIFI_STA);                 // station only, never AP
  WiFi.setSleepMode(WIFI_NONE_SLEEP);  // KEY: keep the radio awake so the AP won't drop us
  WiFi.setAutoReconnect(true);         // auto re-associate if the link blips
  WiFi.setOutputPower(20.5);           // max TX power — helps a weak/marginal signal
  WiFi.hostname("MediSync");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print('.');
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[WiFi] Connected, IP: "));
    Serial.println(WiFi.localIP());
    lcd_show_wifi_connected(WIFI_SSID);
    delay(1500);
  } else {
    Serial.println(F("[WiFi] FAILED — will retry in loop"));
    lcd_show_message("WiFi FAILED     ", "Check credentials");
    delay(3000);
  }
}

// ─── Load full schedule and AI rules from Firebase ────────────────────────────
void loadSchedule() {
  lcd_show_syncing();
  Serial.println(F("[Main] Loading schedule from Firebase…"));

  // Reset fired flags before reloading
  for (int i = 0; i < scheduleCount; i++) schedule[i].fired = false;

  aiRuleCount   = ai_rules_load(aiRules, MAX_AI_RULES);
  scheduleCount = firebase_load_schedule(schedule, MAX_SCHEDULE_ENTRIES);
  ai_rules_apply(schedule, scheduleCount, aiRules, aiRuleCount);

  Serial.print(F("[Main] Total doses today: "));
  Serial.println(scheduleCount);
}

// ─── Dispense logic: buzz, LCD, servo, IR confirm, log ───────────────────────
void handleDispense(int idx) {
  ScheduleEntry& e = schedule[idx];
  e.fired = true;

  int totalBeeps = BUZZ_BEEPS + ai_rules_get_extra_beeps(e.medicineId, aiRules, aiRuleCount);

  // Alert the user
  lcd_show_medicine_due(e.medicineName, e.scheduledTime);
  ai_buzz_alert(totalBeeps);

  // Dispense
  bool servoOk = servo_dispense(e.compartment);

  // Check IR sensor for pill confirmation. Only IR_SENSOR_COMPARTMENT has a
  // sensor wired on this build — elsewhere we trust the servo and record the
  // dose as unconfirmed rather than falsely logging it as missed.
  delay(300);   // Brief settle time for pill to fall
  bool hasIR       = sensor_has_ir(e.compartment);
  bool irConfirmed = hasIR && sensor_pill_detected(e.compartment);

  const char* logStatus;
  if (servoOk && (irConfirmed || !hasIR)) {
    sensor_decrement_count(e.compartment);
    lcd_show_taken();
    logStatus = "taken";
    lastDispenseEpoch = time(nullptr);
    Serial.print(F("[Main] Dose dispensed: "));
    Serial.print(e.medicineName);
    Serial.println(hasIR ? F(" (IR confirmed)")
                         : F(" (unconfirmed — no IR sensor on this compartment)"));
  } else if (servoOk && hasIR && !irConfirmed) {
    // Servo moved but IR didn't detect — compartment may be empty
    logStatus = "missed";
    lcd_show_missed(e.medicineName);
    Serial.println(F("[Main] IR no pill — compartment may be empty"));
  } else {
    logStatus = "missed";
    lcd_show_missed(e.medicineName);
  }

  // Push dose log to Firebase
  firebase_log_dose(
    e.compartment,
    e.medicineId,
    e.scheduledTime,
    logStatus,
    irConfirmed,
    sensor_get_count(e.compartment)
  );

  // Low stock warning on LCD
  int remaining = sensor_get_count(e.compartment);
  if (remaining > 0 && remaining <= LOW_STOCK_THRESHOLD) {
    delay(2000);
    lcd_show_low_stock(e.compartment, remaining);
    ai_buzz_alert(2);
    delay(3000);
  }
}

// ─── Upload hardware status to Firebase ──────────────────────────────────────
void uploadStatus() {
  int batteryPct = 100;   // NodeMCU is typically USB-powered; extend with ADC voltage divider
  int rssi       = WiFi.RSSI();
  firebase_write_status(true, batteryPct, rssi, lastDispenseEpoch);
}

// ─── Write all compartment counts to Firebase ─────────────────────────────────
void writePillCounts() {
  for (int c = 1; c <= NUM_COMPARTMENTS; c++) {
    firebase_write_compartment(c, sensor_get_count(c), sensor_get_status(c));
  }
}

// ─── Initialise Firebase once WiFi is up ──────────────────────────────────────
// Safe to call every loop; it only does the work once, the first time WiFi is
// connected. This decouples Firebase init from setup() timing.
void ensureBackendReady() {
  if (firebaseReady) return;
  if (WiFi.status() != WL_CONNECTED) return;

  // WiFi is up — if the DS3231 wasn't found, get the real time from NTP now.
  rtc_sync_ntp();

  firebase_init();
  delay(1000);
  loadSchedule();
  uploadStatus();
  writePillCounts();
  firebaseReady = true;
  Serial.println(F("[Main] Firebase ready — status uploaded"));
}

// ─── Arduino setup ────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  // Give the USB-serial link ~2.5s to re-sync after the auto-reset so the early
  // boot diagnostics (I2C scan, LCD status) are actually captured by the monitor.
  delay(2500);
  Serial.println(F("\n\n===== [MediSync] Booting v2.1.4 ====="));

  // Buzzer
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // I2C bus first, with a timeout so a stuck device can't freeze boot,
  // then scan so the log shows exactly what's connected (LCD 0x27, RTC 0x68).
  i2c_bus_begin();
  i2c_scan();

  // Subsystem init
  lcd_init();
  servo_init();
  sensor_init();

  bool rtcOk = rtc_init();
  if (!rtcOk) {
    // Not fatal: NTP will set the clock once WiFi connects (see ensureBackendReady).
    lcd_show_message("No RTC - using  ", "internet time   ");
    Serial.println(F("[Main] No DS3231 — falling back to NTP once WiFi is up"));
  }

  // Register WiFi diagnostics BEFORE connecting so we capture every drop reason.
  _onDisconnect = WiFi.onStationModeDisconnected([](const WiFiEventStationModeDisconnected& e) {
    Serial.print(F("[WiFi] DROP — reason code "));
    Serial.println(e.reason);   // 200/201=beacon/no-AP(signal/power), 15=bad password, 4=assoc-expire
  });
  _onGotIP = WiFi.onStationModeGotIP([](const WiFiEventStationModeGotIP& e) {
    Serial.print(F("[WiFi] Got IP: "));
    Serial.println(e.ip);
  });

  WiFi.mode(WIFI_STA);   // needed before scanning
  scanNetworks();        // show what the ESP8266 can actually see
  connectWiFi();

  // Initialise Firebase now if WiFi came up; otherwise the loop will do it as
  // soon as WiFi connects (fixes "authentication was not initialized" when the
  // first connection attempt fails during setup).
  ensureBackendReady();

  // Startup beep
  ai_buzz_alert(1);

  char tStr[6], dStr[11];
  rtc_get_time_str(tStr, sizeof(tStr));
  rtc_get_date_str(dStr, sizeof(dStr));
  lcd_show_idle(tStr, dStr);

  Serial.println(F("[Main] Setup complete — entering main loop"));
}

// ─── Arduino loop ─────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // ── 1. WiFi watchdog ──────────────────────────────────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[WiFi] Disconnected — reconnecting"));
    connectWiFi();
    return;
  }

  // ── 1b. Bring Firebase up the first time WiFi is connected ────────────────
  ensureBackendReady();

  // ── 2. Schedule update polling (every 30s) ────────────────────────────────
  if (now - lastSchedulePoll >= SCHEDULE_POLL_INTERVAL_MS) {
    lastSchedulePoll = now;
    if (firebase_check_schedule_update_flag()) {
      Serial.println(F("[Main] Schedule update flag detected — reloading"));
      firebase_clear_schedule_update_flag();
      loadSchedule();
    }
  }

  // ── 3. Status heartbeat (every 60s) ──────────────────────────────────────
  if (now - lastStatusUpload >= STATUS_UPLOAD_INTERVAL_MS) {
    lastStatusUpload = now;
    uploadStatus();
  }

  // ── 4. Pill count sync (every 10min) ─────────────────────────────────────
  if (now - lastPillCountWrite >= PILL_COUNT_INTERVAL_MS) {
    lastPillCountWrite = now;
    writePillCounts();
  }

  // ── 5. Dose check (every second) ─────────────────────────────────────────
  if (now - lastDoseCheck >= DOSE_CHECK_INTERVAL_MS) {
    lastDoseCheck = now;

    char tStr[6], dStr[11];
    rtc_get_time_str(tStr, sizeof(tStr));
    rtc_get_date_str(dStr, sizeof(dStr));

    for (int i = 0; i < scheduleCount; i++) {
      if (schedule[i].fired) continue;
      if (rtc_time_matches(schedule[i].scheduledTime, schedule[i].shiftMinutes)) {
        handleDispense(i);
        // After dispensing, show idle again
        rtc_get_time_str(tStr, sizeof(tStr));
        rtc_get_date_str(dStr, sizeof(dStr));
        lcd_show_idle(tStr, dStr);
        break;   // Handle one dose per second loop pass
      }
    }

    // Update idle clock display
    lcd_show_idle(tStr, dStr);
  }

  // ── 6. Force dispense command from app ────────────────────────────────────
  static unsigned long lastForceCheck = 0;
  if (now - lastForceCheck >= 5000) {  // Check every 5s to reduce Firebase calls
    lastForceCheck = now;
    int forceComp = 0;
    if (firebase_check_force_dispense(&forceComp)) {
      Serial.print(F("[Main] Force dispense compartment "));
      Serial.println(forceComp);
      // Find the schedule entry for this compartment and dispense
      for (int i = 0; i < scheduleCount; i++) {
        if (schedule[i].compartment == forceComp) {
          schedule[i].fired = false;   // Allow re-fire
          handleDispense(i);
          break;
        }
      }
    }

    // LCD override message from app
    String msg = firebase_get_lcd_message();
    if (msg.length() > 0) {
      // Display first 16 chars on each line
      char l1[17] = {}, l2[17] = {};
      strncpy(l1, msg.c_str(), 16);
      if (msg.length() > 16) strncpy(l2, msg.c_str() + 16, 16);
      lcd_show_message(l1, l2);
      delay(3000);
      Firebase.setString(fbData, "/hardware_commands/lcd_message", "");
    }
  }

  // Small yield to keep WiFi stack happy
  yield();
}
