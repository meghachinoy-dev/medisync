# MediSync — Circuit Diagram & Wiring Table

## NodeMCU ESP8266 Pin Reference

| NodeMCU Label | GPIO | Notes |
|---|---|---|
| D0 | GPIO16 | No PWM; avoid for servos |
| D1 | GPIO5 | I2C SCL (default) |
| D2 | GPIO4 | I2C SDA (default) |
| D3 | GPIO0 | Boot mode pin — use with care |
| D4 | GPIO2 | Onboard LED — boot mode pin |
| D5 | GPIO14 | SPI CLK — free for general use |
| D6 | GPIO12 | SPI MISO — free for general use |
| D7 | GPIO13 | SPI MOSI — free for general use |
| D8 | GPIO15 | Pull-down required on boot |
| A0 | ADC0 | Single 10-bit analog input (0–3.3V) |
| 3V3 | — | 3.3V regulated output |
| 5V (VIN) | — | 5V USB power input |
| GND | — | Common ground |

---

## Complete Wiring Table

### DS3231 Real-Time Clock (RTC)

| DS3231 Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|
| VCC | → | 3V3 | 3.3V power |
| GND | → | GND | Common ground |
| SDA | → | D2 (GPIO4) | I2C data — shared with LCD |
| SCL | → | D1 (GPIO5) | I2C clock — shared with LCD |
| SQW | — | Not connected | Square wave output (unused) |

> Both DS3231 (0x68) and LCD (0x27) share the I2C bus. This is fine as they have different addresses.

---

### 16×2 I2C LCD Display (PCF8574 backpack)

| LCD Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|
| VCC | → | 3V3 | Power the PCF8574 backpack from 3.3V — see note |
| GND | → | GND | Common ground |
| SDA | → | D2 (GPIO4) | I2C data — shared with RTC |
| SCL | → | D1 (GPIO5) | I2C clock — shared with RTC |

> **Power the LCD backpack from 3V3, not 5V.** The PCF8574's I2C pull-ups tie to
> its own VCC. At 5V they pull SDA/SCL toward 5V, which is out of spec for the
> ESP8266's 3.3V-rated GPIOs (they are **not** 5V-tolerant) and shares the bus
> with the 3.3V DS3231. Running the whole bus at 3.3V keeps it consistent and safe.

> **Contrast:** at 3.3V a 16×2 HD44780 can look dim. Turn the blue contrast pot on
> the back of the backpack until the characters are crisp. If you specifically need
> full 5V brightness, power VCC from 5V **and** add a bidirectional I2C level
> shifter on SDA/SCL — do not connect a 5V-powered backpack straight to the ESP8266.

> Default I2C address: 0x27. If display doesn't initialize, try 0x3F.  
> I2C address can be found with an I2C scanner sketch.

---

### SG90 Servo Motors (×6, one per compartment)

All six servos connect directly to NodeMCU GPIO. Only the **signal** line differs
per servo — every servo's VCC (red) goes to the external 5V rail and GND (brown)
to common ground.

| Servo | Signal → NodeMCU Pin | GPIO | Notes |
|---|---|---|---|
| Servo 1 (Comp 1) | D5 | GPIO14 | Clean GPIO |
| Servo 2 (Comp 2) | D6 | GPIO12 | Clean GPIO |
| Servo 3 (Comp 3) | D7 | GPIO13 | Clean GPIO |
| Servo 4 (Comp 4) | D3 | GPIO0 | Boot pin — HIGH at boot (internal pull-up); disconnect signal while flashing |
| Servo 5 (Comp 5) | D4 | GPIO2 | Boot pin — HIGH at boot (internal pull-up, onboard LED); disconnect signal while flashing |
| Servo 6 (Comp 6) | D8 | GPIO15 | Boot pin — LOW at boot; **requires 10kΩ pull-down to GND**; disconnect signal while flashing |

> **Power**: Servo motors draw 250–700 mA each under load. Do NOT power any of
> them from NodeMCU's 3.3V pin. Use an external 5V 3A supply and tie its GND to
> the NodeMCU GND (common ground).

> **Boot pins (comps 4–6)**: D3/D4 must be HIGH and D8 must be LOW at power-up.
> An SG90 signal input is high-impedance so it won't fight the strapping, but
> **disconnect the comp-4/5/6 signal wires whenever you flash firmware** — the
> auto-reset/flash sequence toggles these pins. The D8 pull-down must stay in place.

---

### IR Sensor (×1, compartment 1 only)

The ESP8266 has a **single analog input (A0)**, so exactly one IR sensor can be
read directly — it goes on compartment 1. Comps 2–6 dispense without sensor
confirmation and the firmware logs those doses as "taken (unconfirmed)".

| IR Sensor 1 Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|
| OUT | → | A0 (ADC0) | LM393 comparator output; A0 sits near 0 or ~1023 |
| VCC | → | 3V3 | |
| GND | → | GND | Common ground |

> **Threshold**: `IR_PILL_THRESHOLD = 512` in `config.h`. Below it = beam
> interrupted = pill present in the drop path.

> **Adding IR to more compartments** later needs a channel multiplexer (CD4051)
> or an I2C ADC/expander, since A0 is the only native analog pin. Not part of the
> current build.

---

### Active Buzzer

Driven from **D0 (GPIO16)** — D8 is now servo 6. GPIO16 has no PWM, which is fine
for a self-oscillating active buzzer that only needs HIGH/LOW.

| Buzzer Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|
| + (positive) | → | 5V (through buzzer, low-side switched) | |
| - (negative) | → | Collector of NPN transistor | |

> Low-side switch with a BC547 (or 2N2222) NPN transistor:
> - Base → D0 (GPIO16) via 1kΩ resistor
> - Collector → Buzzer (−)
> - Buzzer (+) → 5V
> - Emitter → GND

---

### Status LEDs — not available on this build

With 6 servos direct + I2C + IR + buzzer, **every usable GPIO is allocated**
(D0 buzzer, D1/D2 I2C, D3–D8 servos, A0 IR), so there is no free pin for status
LEDs. Online/offline state is shown on the LCD and mirrored to Firebase instead.
Add-on LEDs would require offloading the servos to a PCA9685 to free up pins.

---

## Power Supply Diagram

```
USB 5V ──┬── NodeMCU VIN (powers NodeMCU)
         │
         └── External 5V 3A supply ──── Servo VCC rail (all 6 servos)

NodeMCU 3V3 ──┬── LCD VCC (PCF8574 backpack)
              ├── DS3231 RTC VCC
              └── IR sensor 1 VCC

Common GND: NodeMCU GND + External supply GND + All component GNDs
```

---

## I2C Address Summary

| Component | I2C Address |
|---|---|
| DS3231 RTC | 0x68 |
| LCD (PCF8574) | 0x27 (or 0x3F) |

Use this I2C scanner to verify addresses on your hardware:
```cpp
#include <Wire.h>
void setup() {
  Wire.begin(); Serial.begin(115200);
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0)
      Serial.println(addr, HEX);
  }
}
void loop() {}
```
