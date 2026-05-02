#include "sensor_handler.h"

int pillCounts[6];

// MUX select table for channels 0–5 (2-bit binary on MUX_SEL_A, MUX_SEL_B)
// Only 4 channels possible with 2 bits; compartments 5/6 share channels 0/1
// with a small delay between reads to avoid contention in a real design.
// A CD4051 8-channel mux uses 3 address lines — extend if needed.
static const int MUX_A[6] = { 0, 1, 0, 1, 0, 1 };
static const int MUX_B[6] = { 0, 0, 1, 1, 0, 0 };

void sensor_init() {
  pinMode(IR_ANALOG_PIN, INPUT);
  pinMode(MUX_SEL_A, OUTPUT);
  pinMode(MUX_SEL_B, OUTPUT);

  for (int i = 0; i < 6; i++) {
    pillCounts[i] = DEFAULT_PILLS_MAX;
  }
  Serial.println(F("[Sensor] IR sensor + pill counts initialised"));
}

bool sensor_pill_detected(int compartment) {
  if (compartment < 1 || compartment > 6) return false;
  int idx = compartment - 1;

  // Select the mux channel for this compartment
  digitalWrite(MUX_SEL_A, MUX_A[idx]);
  digitalWrite(MUX_SEL_B, MUX_B[idx]);
  delayMicroseconds(100);   // Allow mux to settle

  int reading = analogRead(IR_ANALOG_PIN);
  // Below threshold = IR beam interrupted = pill present in path
  bool detected = reading < IR_PILL_THRESHOLD;

  Serial.print(F("[Sensor] Comp "));
  Serial.print(compartment);
  Serial.print(F(" IR: "));
  Serial.print(reading);
  Serial.print(F(" -> "));
  Serial.println(detected ? F("PILL DETECTED") : F("no pill"));

  return detected;
}

void sensor_decrement_count(int compartment) {
  if (compartment < 1 || compartment > 6) return;
  int idx = compartment - 1;
  if (pillCounts[idx] > 0) pillCounts[idx]--;
  Serial.print(F("[Sensor] Comp "));
  Serial.print(compartment);
  Serial.print(F(" pills remaining: "));
  Serial.println(pillCounts[idx]);
}

void sensor_refill(int compartment) {
  if (compartment < 1 || compartment > 6) return;
  pillCounts[compartment - 1] = DEFAULT_PILLS_MAX;
  Serial.print(F("[Sensor] Comp "));
  Serial.print(compartment);
  Serial.println(F(" refilled to max"));
}

int sensor_get_count(int compartment) {
  if (compartment < 1 || compartment > 6) return 0;
  return pillCounts[compartment - 1];
}

const char* sensor_get_status(int compartment) {
  int count = sensor_get_count(compartment);
  if (count == 0)                    return "EMPTY";
  if (count <= LOW_STOCK_THRESHOLD)  return "LOW";
  return "OK";
}

// LOW_STOCK_THRESHOLD not defined in config.h — define it here to mirror app
#ifndef LOW_STOCK_THRESHOLD
#define LOW_STOCK_THRESHOLD 5
#endif
