#include "servo_controller.h"

static Servo servos[NUM_COMPARTMENTS];
static const int SERVO_PINS[NUM_COMPARTMENTS] = {
  SERVO1_PIN, SERVO2_PIN, SERVO3_PIN,
  SERVO4_PIN, SERVO5_PIN, SERVO6_PIN
};

// A compartment is usable only if its servo is physically wired (pin != -1).
bool servo_is_wired(int compartment) {
  if (compartment < 1 || compartment > NUM_COMPARTMENTS) return false;
  return SERVO_PINS[compartment - 1] >= 0;
}

void servo_init() {
  int wired = 0;
  for (int i = 0; i < NUM_COMPARTMENTS; i++) {
    if (SERVO_PINS[i] < 0) continue;   // Not wired on this build
    servos[i].attach(SERVO_PINS[i]);
    servos[i].write(SERVO_CLOSE_ANGLE);
    delay(50);   // Stagger startup to avoid power spike
    wired++;
  }
  Serial.print(F("[Servo] "));
  Serial.print(wired);
  Serial.println(F(" servo(s) initialised at 0°"));
}

bool servo_dispense(int compartment) {
  if (!servo_is_wired(compartment)) {
    Serial.print(F("[Servo] Compartment not wired on this build: "));
    Serial.println(compartment);
    return false;
  }

  int idx = compartment - 1;

  Serial.print(F("[Servo] Dispensing compartment "));
  Serial.println(compartment);

  servos[idx].write(SERVO_OPEN_ANGLE);
  delay(SERVO_HOLD_MS);
  servos[idx].write(SERVO_CLOSE_ANGLE);
  delay(300);   // Allow servo to settle before returning

  Serial.print(F("[Servo] Compartment "));
  Serial.print(compartment);
  Serial.println(F(" closed"));
  return true;
}

void servo_test_all() {
  Serial.println(F("[Servo] Running test sweep…"));
  for (int i = 0; i < NUM_COMPARTMENTS; i++) {
    if (SERVO_PINS[i] < 0) continue;
    servos[i].write(SERVO_OPEN_ANGLE);
    delay(400);
    servos[i].write(SERVO_CLOSE_ANGLE);
    delay(200);
  }
  Serial.println(F("[Servo] Test complete"));
}

void servo_close_all() {
  for (int i = 0; i < NUM_COMPARTMENTS; i++) {
    if (SERVO_PINS[i] < 0) continue;
    servos[i].write(SERVO_CLOSE_ANGLE);
  }
}
