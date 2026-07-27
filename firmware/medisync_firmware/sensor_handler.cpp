#include "sensor_handler.h"

int pillCounts[NUM_COMPARTMENTS];

void sensor_init() {
  pinMode(IR_ANALOG_PIN, INPUT);

  for (int i = 0; i < NUM_COMPARTMENTS; i++) {
    pillCounts[i] = DEFAULT_PILLS_MAX;
  }
  Serial.print(F("[Sensor] Pill counts initialised; IR sensor on compartment "));
  Serial.println(IR_SENSOR_COMPARTMENT);
}

bool sensor_has_ir(int compartment) {
  return compartment == IR_SENSOR_COMPARTMENT;
}

bool sensor_pill_detected(int compartment) {
  // A0 is the only analog input, so just one compartment can be sensed. Callers
  // must check sensor_has_ir() first — an unsensed compartment reports false
  // here, which is "unknown", not "no pill".
  if (!sensor_has_ir(compartment)) return false;

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
  if (compartment < 1 || compartment > NUM_COMPARTMENTS) return;
  int idx = compartment - 1;
  if (pillCounts[idx] > 0) pillCounts[idx]--;
  Serial.print(F("[Sensor] Comp "));
  Serial.print(compartment);
  Serial.print(F(" pills remaining: "));
  Serial.println(pillCounts[idx]);
}

void sensor_refill(int compartment) {
  if (compartment < 1 || compartment > NUM_COMPARTMENTS) return;
  pillCounts[compartment - 1] = DEFAULT_PILLS_MAX;
  Serial.print(F("[Sensor] Comp "));
  Serial.print(compartment);
  Serial.println(F(" refilled to max"));
}

int sensor_get_count(int compartment) {
  if (compartment < 1 || compartment > NUM_COMPARTMENTS) return 0;
  return pillCounts[compartment - 1];
}

const char* sensor_get_status(int compartment) {
  int count = sensor_get_count(compartment);
  if (count == 0)                    return "EMPTY";
  if (count <= LOW_STOCK_THRESHOLD)  return "LOW";
  return "OK";
}
