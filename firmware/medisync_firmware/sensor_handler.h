#ifndef SENSOR_HANDLER_H
#define SENSOR_HANDLER_H

#include <Arduino.h>
#include "config.h"

// ─── Pill counts per compartment (estimated, not absolute) ───────────────────
extern int pillCounts[NUM_COMPARTMENTS];  // Index 0 = compartment 1

// ─── Initialise IR sensor pins ───────────────────────────────────────────────
void sensor_init();

// ─── True if this compartment has an IR sensor wired on the current build ────
// Only IR_SENSOR_COMPARTMENT does, since A0 is the ESP8266's sole analog input.
bool sensor_has_ir(int compartment);

// ─── Read IR sensor for a given compartment (1–6) ────────────────────────────
// Returns true if a pill was detected (object sensed = low ADC reading).
// Returns false for compartments without a sensor — check sensor_has_ir() first,
// since false there means "unknown", not "no pill".
bool sensor_pill_detected(int compartment);

// ─── Decrement pill count after confirmed dispense ───────────────────────────
void sensor_decrement_count(int compartment);

// ─── Refill a compartment — reset count to DEFAULT_PILLS_MAX ─────────────────
void sensor_refill(int compartment);

// ─── Get current estimated pill count for compartment ────────────────────────
int sensor_get_count(int compartment);

// ─── Status string based on count ────────────────────────────────────────────
// Returns "OK", "LOW", "EMPTY"
const char* sensor_get_status(int compartment);

#endif // SENSOR_HANDLER_H
