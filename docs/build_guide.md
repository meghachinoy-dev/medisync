# MediSync — Physical Build & Breadboard Assembly Walkthrough

A hands-on, step-by-step guide to wiring MediSync on a breadboard, from bare
components to a running dispenser. Follow the steps **in order** — the sequence is
designed so you never power a half-wired board and never fry a pin.

> Pin map, addresses, and the full reference table live in
> [`circuit_diagram.md`](circuit_diagram.md). This guide is the *procedure*; that
> file is the *reference*. If they ever disagree, `config.h` in the firmware wins.

---

## 0. Before You Start

### Tools
- Half+ size breadboard (830 tie-points) — or two joined
- Male–male and male–female jumper wires (~40)
- 5V 3A DC power supply (barrel jack → screw terminal or breakout)
- Multimeter (for the smoke test — do not skip)
- Small Phillips screwdriver, wire stripper
- Micro-USB cable for the NodeMCU

### Parts (from the BOM)
- NodeMCU ESP8266 (v3 / Amica)
- DS3231 RTC module (with CR2032 cell)
- 16×2 I2C LCD (PCF8574 backpack)
- 6× SG90 servos
- 1× IR obstacle sensor (LM393)
- 1× active buzzer
- 1× BC547 (or 2N2222) NPN transistor
- 1× 1kΩ resistor (buzzer base)
- 1× 10kΩ resistor (D8 pull-down)
- 1× 100µF electrolytic capacitor (servo rail decoupling)

### Golden rules
1. **Wire everything with all power OFF.** USB unplugged, 5V supply off.
2. **Common ground is sacred.** NodeMCU GND *and* the external 5V supply GND must
   be tied together, or nothing works and signals float.
3. **Never power servos from the NodeMCU.** They pull 250–700 mA each; the onboard
   regulator will brown out and reboot the ESP8266 mid-dispense.
4. **The I2C bus stays at 3.3V.** LCD and RTC VCC go to NodeMCU **3V3**, not 5V.
   ESP8266 GPIOs are *not* 5V-tolerant.
5. **Servos 4/5/6 use boot-strapping pins (D3/D4/D8).** Their signal wires must be
   **unplugged every time you flash firmware** (see Step 8).

---

## 1. Set Up the Breadboard Power Rails

A breadboard has two rail pairs (top and bottom), each with a `+` and `−` line.
You will run **two different voltages**, so label them clearly:

```
TOP rail     (+) = 3.3V   from NodeMCU 3V3    ← LCD, RTC, IR sensor
TOP rail     (−) = GND    common ground
BOTTOM rail  (+) = 5V     from external supply ← servos only
BOTTOM rail  (−) = GND    common ground
```

Steps:
1. Seat the NodeMCU across the center trench, USB end facing off the board edge.
2. Jumper **NodeMCU 3V3 → TOP (+) rail**.
3. Jumper **NodeMCU GND → TOP (−) rail**.
4. Bring the **external 5V supply (+) → BOTTOM (+) rail**. Leave the supply OFF.
5. Bring the **external 5V supply (−) → BOTTOM (−) rail**.
6. **Tie the grounds:** jumper **TOP (−) rail → BOTTOM (−) rail.** This is rule #2.
7. Drop the **100µF capacitor across the BOTTOM rail** (`+` leg to 5V, the striped
   `−` leg to GND). This smooths the current spikes when servos move.

> ⚠️ Electrolytic caps are polarity-sensitive. The stripe marks the negative leg.
> Backwards + powered = it pops. Double-check before power-on.

---

## 2. Wire the I2C Bus (LCD + RTC)

Both devices share two wires. Do them together.

| From | To | Wire |
|---|---|---|
| DS3231 VCC | TOP (+) 3.3V rail | red |
| DS3231 GND | TOP (−) GND rail | black |
| DS3231 SDA | NodeMCU **D2 (GPIO4)** | — |
| DS3231 SCL | NodeMCU **D1 (GPIO5)** | — |
| LCD VCC | TOP (+) 3.3V rail | red |
| LCD GND | TOP (−) GND rail | black |
| LCD SDA | NodeMCU **D2 (GPIO4)** | — |
| LCD SCL | NodeMCU **D1 (GPIO5)** | — |

SDA and SCL are a *bus* — both modules land on the same two NodeMCU pins. Use the
breadboard rows to fan out: run D2 to an empty column, then two jumpers from that
column to each module's SDA (same for D1/SCL).

> The DS3231 module has its own on-board pull-ups, which is enough for the bus.
> LCD address is usually `0x27` (sometimes `0x3F`), RTC is `0x68`.

---

## 3. Wire the IR Sensor (Compartment 1)

Only compartment 1 gets a sensor — the ESP8266 has a single analog pin.

| From | To |
|---|---|
| IR VCC | TOP (+) 3.3V rail |
| IR GND | TOP (−) GND rail |
| IR OUT | NodeMCU **A0** |

The LM393 output swings near 0 or ~1023; the firmware threshold is 512. You'll tune
the little pot on the module later so an interrupted beam reads low.

---

## 4. Build the Buzzer Sub-Circuit (NPN Low-Side Switch)

GPIO16 (D0) can't drive a buzzer directly at enough current, so switch it with a
transistor. Build this small circuit on a spare breadboard block:

```
   NodeMCU D0 ──[ 1kΩ ]──► BASE (B)
                                          BC547 (flat face toward you: E-B-C)
   Buzzer (+) ── 5V rail (BOTTOM +)
   Buzzer (−) ──────────────► COLLECTOR (C)
                              EMITTER  (E) ──► GND rail
```

| From | To |
|---|---|
| NodeMCU **D0 (GPIO16)** | 1kΩ resistor → transistor **Base** |
| Transistor **Emitter** | GND rail |
| Transistor **Collector** | Buzzer (−) |
| Buzzer (+) | 5V rail (BOTTOM +) |

> BC547 pinout, flat side facing you, legs down: **Collector – Base – Emitter**
> (C-B-E). A 2N2222 is E-B-C — check yours before inserting. Wrong pinout = silent
> buzzer (usually harmless).

---

## 5. Wire Servos 1–3 (Clean GPIOs)

Every servo has three wires: **brown = GND, red = VCC (5V), orange = signal**.
VCC and GND go to the **BOTTOM (5V) rail** for all six. Only the signal pin differs.

| Servo | Signal → NodeMCU | Red → | Brown → |
|---|---|---|---|
| 1 | **D5 (GPIO14)** | 5V rail | GND rail |
| 2 | **D6 (GPIO12)** | 5V rail | GND rail |
| 3 | **D7 (GPIO13)** | 5V rail | GND rail |

These three are "clean" pins with no boot-strapping caveats — wire and forget.

---

## 6. Wire Servos 4–6 (Boot-Strapping Pins) — Read Carefully

Compartments 4/5/6 land on pins the ESP8266 samples at power-up to decide boot mode.
This is fine for a servo (its signal input is high-impedance), **with two rules**:

- Servo 6's pin **D8 (GPIO15) needs a 10kΩ pull-down to GND** — install it and
  leave it in place permanently.
- The signal wires for servos **4, 5, and 6 must be unplugged while flashing**
  (Step 8). The flash/reset sequence toggles these pins.

| Servo | Signal → NodeMCU | Boot state | Extra part |
|---|---|---|---|
| 4 | **D3 (GPIO0)** | HIGH at boot (internal pull-up) | — |
| 5 | **D4 (GPIO2)** | HIGH at boot (onboard LED pin) | — |
| 6 | **D8 (GPIO15)** | LOW at boot | **10kΩ from D8 → GND** |

For the D8 pull-down: put one leg of the 10kΩ in the same breadboard row as the D8
jumper, the other leg into the GND rail.

> If the NodeMCU refuses to boot or won't accept a sketch, a servo-4/5/6 signal wire
> is almost always still connected, or the D8 pull-down is missing. Recheck here first.

---

## 7. Pin Map Sanity Check (before any power)

Every usable pin is now allocated. Verify against this:

| Pin | GPIO | Used by |
|---|---|---|
| D0 | 16 | Buzzer (via transistor) |
| D1 | 5 | I2C SCL (LCD + RTC) |
| D2 | 4 | I2C SDA (LCD + RTC) |
| D3 | 0 | Servo 4 |
| D4 | 2 | Servo 5 |
| D5 | 14 | Servo 1 |
| D6 | 12 | Servo 2 |
| D7 | 13 | Servo 3 |
| D8 | 15 | Servo 6 (+ 10kΩ pull-down) |
| A0 | ADC0 | IR sensor (comp 1) |

Walk each row with your finger on the actual wire. Then check:
- [ ] LCD & RTC VCC on the **3.3V** rail (not 5V)
- [ ] All 6 servo VCC on the **5V** rail
- [ ] TOP GND and BOTTOM GND rails jumpered together
- [ ] 100µF cap polarity correct on 5V rail
- [ ] 10kΩ pull-down present on D8
- [ ] Servo 4/5/6 signal wires ready to unplug for flashing

---

## 8. First Flash (Servos 4/5/6 Signals OFF)

1. **Unplug the signal wires of servos 4, 5, and 6** (D3, D4, D8). Leave their
   power wires in — only the orange signal lines come out.
2. Leave the external 5V supply **OFF** for now; the NodeMCU powers from USB.
3. Fill in `firmware/medisync_firmware/config.h` — `WIFI_SSID`, `WIFI_PASSWORD`
   (Firebase host/auth are already set).
4. In Arduino IDE: Board = "NodeMCU 1.0 (ESP-12E Module)", correct COM port,
   Upload speed 115200. Install the libraries in
   [`libraries_required.txt`](../firmware/libraries_required.txt).
5. Upload `medisync_firmware.ino`. Watch for "Done uploading".
6. **Reconnect the servo 4/5/6 signal wires** after the flash completes.

> You repeat step 1 + 6 every time you re-flash. It's a 20-second ritual, not a
> redesign.

---

## 9. Power-On Smoke Test

1. Keep USB plugged in. **Now switch the external 5V supply ON.**
2. Immediately put the multimeter across the 5V rail: expect **4.9–5.1V**. Across
   the 3.3V rail: **~3.3V**. If either is wrong or a chip gets warm, cut power.
3. The LCD backlight should glow. If it's blank/faint, turn the blue **contrast
   pot** on the LCD backpack until characters appear.
4. Open the Arduino **Serial Monitor at 115200**. You should see boot logs:
   servo init count, RTC found, WiFi connecting, Firebase connected.

---

## 10. Bring-Up Verification (in order)

Run these checks before trusting a real dose:

1. **I2C scan** — flash the scanner sketch from `circuit_diagram.md` §I2C. Expect
   `0x27` (LCD) and `0x68` (RTC). Missing one = recheck Step 2 wiring/address.
2. **RTC time** — confirm the serial log prints the correct current time. If it's
   wrong or 2000-01-01, the CR2032 is dead or absent.
3. **Servo sweep** — the firmware runs a startup test sweep, or use the minimal
   sketch in [`setup_guide.md`](setup_guide.md) Step 3, changing the pin per servo
   (14,12,13,0,2,15). Each should open and close once.
4. **IR sensor** — pass your hand under compartment 1's sensor; the serial log's A0
   reading should cross the 512 threshold. Adjust the module pot if it doesn't.
5. **Buzzer** — trigger a test dose (or set a dose 1 minute ahead in the app);
   you should hear 3 short beeps.
6. **End-to-end** — set a real scheduled dose from the web app, wait for the match
   window, and confirm: buzzer → LCD message → servo opens → dose logged to Firebase
   → appears on the dashboard.

---

## 11. Common First-Build Problems

| Symptom | Most likely cause |
|---|---|
| NodeMCU won't accept upload / boot-loops | Servo 4/5/6 signal still connected, or D8 pull-down missing |
| LCD blank or garbled | Wrong I2C address (try 0x3F); contrast pot; VCC on wrong rail |
| RTC not found / wrong time | Dead CR2032; SDA/SCL swapped; not on 3.3V |
| Servo twitches / NodeMCU reboots on dispense | Servos on NodeMCU power instead of external 5V; missing 100µF cap |
| Everything dead / random | Grounds not tied together (rule #2) |
| Buzzer silent | Transistor pinout reversed; base resistor missing |
| IR never triggers / always triggers | Module pot needs tuning; check `IR_PILL_THRESHOLD` |

More troubleshooting in [`setup_guide.md`](setup_guide.md) §Troubleshooting.

---

## Assembly Order at a Glance

```
Power rails (2 voltages, common GND, cap)
        │
   I2C bus (LCD + RTC on 3.3V)
        │
   IR sensor (A0)
        │
   Buzzer transistor circuit (D0)
        │
   Servos 1–3 (clean pins)
        │
   Servos 4–6 (boot pins + D8 pull-down)
        │
   Pin sanity check ──► Flash (4/5/6 signals off) ──► Smoke test ──► Verify
```

Wire cold, check twice, power once. Good luck.
