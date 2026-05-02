#ifndef FIREBASE_HANDLER_H
#define FIREBASE_HANDLER_H

#include <Arduino.h>
#include <FirebaseESP8266.h>
#include <ArduinoJson.h>
#include "config.h"

// Maximum doses stored in memory (across all compartments for one day)
#define MAX_SCHEDULE_ENTRIES  24

struct ScheduleEntry {
  int   compartment;    // 1–6
  char  medicineId[32];
  char  medicineName[32];
  char  scheduledTime[6];  // "HH:MM"
  int   shiftMinutes;      // from AI rules; 0 if no shift
  bool  fired;             // has this dose been triggered today?
};

// ─── Firebase initialisation ─────────────────────────────────────────────────
void firebase_init();
bool firebase_connected();

// ─── Schedule ────────────────────────────────────────────────────────────────
int  firebase_load_schedule(ScheduleEntry* entries, int maxEntries);
bool firebase_check_schedule_update_flag();
void firebase_clear_schedule_update_flag();

// ─── Dose logs ───────────────────────────────────────────────────────────────
void firebase_log_dose(int compartment, const char* medicineId,
                       const char* scheduledTime, const char* status,
                       bool irConfirmed, int pillsRemaining);

// ─── Hardware status ─────────────────────────────────────────────────────────
void firebase_write_status(bool online, int batteryPct, int wifiRSSI,
                           unsigned long lastDispenseEpoch);

// ─── Compartments ────────────────────────────────────────────────────────────
void firebase_write_compartment(int num, int pillsRemaining, const char* status);

// ─── AI rules ────────────────────────────────────────────────────────────────
int firebase_load_ai_shifts(const char* medicineId);  // returns shiftMinutes for a medicine

// ─── Hardware commands ────────────────────────────────────────────────────────
bool firebase_check_force_dispense(int* compartmentOut);
String firebase_get_lcd_message();

extern FirebaseData fbData;
extern FirebaseAuth fbAuth;
extern FirebaseConfig fbConfig;

#endif // FIREBASE_HANDLER_H
