#ifndef SERVO_CONTROLLER_H
#define SERVO_CONTROLLER_H

#include <Arduino.h>
#include <Servo.h>
#include "config.h"

// ─── Initialise every physically wired servo ─────────────────────────────────
void servo_init();

// ─── True if this compartment's servo is wired on the current build ──────────
bool servo_is_wired(int compartment);

// ─── Dispense one pill from the specified compartment (1–6) ──────────────────
// Rotates servo to SERVO_OPEN_ANGLE, holds SERVO_HOLD_MS, returns to SERVO_CLOSE_ANGLE.
// Returns false if the compartment is out of range or not wired on this build.
bool servo_dispense(int compartment);

// ─── Test sweep all servos in sequence (used during LED test command) ─────────
void servo_test_all();

// ─── Return servo to rest position (called on error/reset) ───────────────────
void servo_close_all();

#endif // SERVO_CONTROLLER_H
