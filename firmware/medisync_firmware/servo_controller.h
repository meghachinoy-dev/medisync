#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <Arduino.h>
#include <Servo.h>
#include "config.h"

// ─── Initialise all 6 servos ─────────────────────────────────────────────────
void servo_init();

// ─── Dispense one pill from the specified compartment (1–6) ──────────────────
// Rotates servo to SERVO_OPEN_ANGLE, holds SERVO_HOLD_MS, returns to SERVO_CLOSE_ANGLE.
// Returns true on success.
bool servo_dispense(int compartment);

// ─── Test sweep all servos in sequence (used during LED test command) ─────────
void servo_test_all();

// ─── Return servo to rest position (called on error/reset) ───────────────────
void servo_close_all();

#endif // SERVO_CONTROLLER_H
