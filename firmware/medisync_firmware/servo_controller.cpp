#include "servo_controller.h"

static Servo servos[6];
static const int SERVO_PINS[6] = {
  SERVO1_PIN, SERVO2_PIN, SERVO3_PIN,
  SERVO4_PIN, SERVO5_PIN, SERVO6_PIN
};

void servo_init() {
  for (int i = 0; i < 6; i++) {
    servos[i].attach(SERVO_PINS[i]);
    servos[i].write(SERVO_CLOSE_ANGLE);
    delay(50);   // Stagger startup to avoid power spike
  }
  Serial.println(F("[Servo] All 6 servos initialised at 0°"));
}

bool servo_dispense(int compartment) {
  if (compartment < 1 || compartment > 6) {
    Serial.print(F("[Servo] Invalid compartment: "));
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
  for (int i = 0; i < 6; i++) {
    servos[i].write(SERVO_OPEN_ANGLE);
    delay(400);
    servos[i].write(SERVO_CLOSE_ANGLE);
    delay(200);
  }
  Serial.println(F("[Servo] Test complete"));
}

void servo_close_all() {
  for (int i = 0; i < 6; i++) {
    servos[i].write(SERVO_CLOSE_ANGLE);
  }
}
