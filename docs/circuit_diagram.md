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
| VCC | → | VIN (5V) | LCD requires 5V |
| GND | → | GND | Common ground |
| SDA | → | D2 (GPIO4) | I2C data — shared with RTC |
| SCL | → | D1 (GPIO5) | I2C clock — shared with RTC |

> Default I2C address: 0x27. If display doesn't initialize, try 0x3F.  
> I2C address can be found with an I2C scanner sketch.

---

### SG90 Servo Motors (×6, one per compartment)

| Servo | Wire | → | NodeMCU Pin | Notes |
|---|---|---|---|---|
| Servo 1 (Comp 1) | Signal (Orange) | → | D5 (GPIO14) | PWM output |
| Servo 1 | VCC (Red) | → | 5V rail | Do NOT power from NodeMCU 3V3 |
| Servo 1 | GND (Brown) | → | GND | Common ground |
| Servo 2 (Comp 2) | Signal | → | D6 (GPIO12) | PWM output |
| Servo 2 | VCC | → | 5V rail | |
| Servo 2 | GND | → | GND | |
| Servo 3 (Comp 3) | Signal | → | D3 (GPIO0) | Boot pin — servo must be disconnected during flash |
| Servo 3 | VCC | → | 5V rail | |
| Servo 3 | GND | → | GND | |
| Servo 4 (Comp 4) | Signal | → | D4 (GPIO2) | Boot pin — servo must be disconnected during flash |
| Servo 4 | VCC | → | 5V rail | |
| Servo 4 | GND | → | GND | |
| Servo 5 (Comp 5) | Signal | → | D7 (GPIO13) | Free general PWM |
| Servo 5 | VCC | → | 5V rail | |
| Servo 5 | GND | → | GND | |
| Servo 6 (Comp 6) | Signal | → | D8 (GPIO15) | Must have 10kΩ pull-down to GND |
| Servo 6 | VCC | → | 5V rail | |
| Servo 6 | GND | → | GND | |

> **IMPORTANT**: Servo motors draw 250–700 mA each under load. Do NOT power all 6 from NodeMCU's 3.3V pin.  
> Use an external 5V 3A supply with a common GND. Connect NodeMCU GND to the external supply GND.

> **Boot pins**: D3 (GPIO0) and D4 (GPIO2) must be HIGH on boot. Disconnect servos 3 & 4 signal wires when flashing firmware.

---

### IR Sensors (×6, one per compartment) via CD4051 Multiplexer

| Component | Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|---|
| CD4051 MUX | VCC | → | 3V3 | |
| CD4051 MUX | GND | → | GND | |
| CD4051 MUX | INH | → | GND | Enable always |
| CD4051 MUX | A (select bit 0) | → | D7 (GPIO13) | MUX_SEL_A |
| CD4051 MUX | B (select bit 1) | → | D8 (GPIO15) | MUX_SEL_B |
| CD4051 MUX | C (select bit 2) | → | GND | Only 4 channels used |
| CD4051 MUX | COM OUT | → | A0 | Analog reading |
| IR Sensor 1 OUT | → | CD4051 Y0 | Channel 0 = Compartment 1 |
| IR Sensor 2 OUT | → | CD4051 Y1 | Channel 1 = Compartment 2 |
| IR Sensor 3 OUT | → | CD4051 Y2 | Channel 2 = Compartment 3 |
| IR Sensor 4 OUT | → | CD4051 Y3 | Channel 3 = Compartment 4 |
| IR Sensor 5 OUT | → | CD4051 Y0 | Channel 0 (time-shared with Comp 1) |
| IR Sensor 6 OUT | → | CD4051 Y1 | Channel 1 (time-shared with Comp 2) |
| Each IR Sensor VCC | → | 3V3 | |
| Each IR Sensor GND | → | GND | |

> For a school project with ≤4 compartments active at once, direct connection to D-pins is simpler. The MUX is for the full 6-compartment version.

---

### Active Buzzer

| Buzzer Pin | → | NodeMCU Pin | Notes |
|---|---|---|---|
| + (positive) | → | D8 (GPIO15) via NPN transistor | |
| - (negative) | → | GND | |

> Use a 2N2222 or BC547 NPN transistor to drive the buzzer:
> - Base → D8 via 1kΩ resistor
> - Collector → Buzzer (+)
> - Emitter → GND
> - Buzzer other end → 5V

---

### Status LEDs (optional)

| LED Color | Anode → | Resistor | → NodeMCU | Purpose |
|---|---|---|---|---|
| Green | → | 220Ω | → D0 (GPIO16) | WiFi/online status |
| Red | → | 220Ω | → GND (inverted) | Error / offline |

---

## Power Supply Diagram

```
USB 5V ──┬── NodeMCU VIN (powers NodeMCU)
         │
         └── External 5V 3A supply ──┬── Servo VCC rail (all 6 servos)
                                     └── LCD VCC
                                     
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
