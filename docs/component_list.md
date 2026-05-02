# MediSync — Bill of Materials (BOM)

All prices in Indian Rupees (₹). Sources: Robu.in, Amazon India, Sunrom.com (as of 2025–26).

---

## Core Electronics

| # | Component | Specification | Quantity | Unit Price (₹) | Total (₹) | Source |
|---|---|---|---|---|---|---|
| 1 | NodeMCU ESP8266 | v3 (4MB flash, CP2102 USB-Serial) | 1 | 220 | 220 | Robu.in |
| 2 | DS3231 RTC Module | I2C, ±2ppm accuracy, battery backup | 1 | 120 | 120 | Robu.in |
| 3 | SG90 Servo Motor | 180°, 4.8–6V, 1.8 kg·cm torque | 6 | 90 | 540 | Robu.in |
| 4 | 16×2 LCD Display | With I2C backpack (PCF8574), blue/green backlight | 1 | 180 | 180 | Robu.in |
| 5 | IR Obstacle Sensor | Digital + Analog output, adjustable sensitivity | 6 | 45 | 270 | Robu.in |
| 6 | Active Buzzer Module | 5V, 2.3kHz, includes current-limiting resistor | 1 | 30 | 30 | Robu.in |

**Subtotal Electronics: ₹1,360**

---

## Passive Components & Transistors

| # | Component | Specification | Quantity | Unit Price (₹) | Total (₹) |
|---|---|---|---|---|---|
| 7 | BC547 NPN Transistor | For buzzer drive | 2 | 2 | 4 |
| 8 | Resistor 1kΩ | 1/4W carbon film | 5 | 0.50 | 3 |
| 9 | Resistor 10kΩ | Pull-down for D8 | 3 | 0.50 | 2 |
| 10 | Resistor 220Ω | LED current limiting | 5 | 0.50 | 3 |
| 11 | LED (Green) | 5mm, 2V | 2 | 3 | 6 |
| 12 | LED (Red) | 5mm, 2V | 2 | 3 | 6 |
| 13 | Capacitor 100µF | Bulk decoupling on 5V rail | 2 | 5 | 10 |
| 14 | Capacitor 100nF | Bypass caps near ICs | 5 | 2 | 10 |

**Subtotal Passives: ₹44**

---

## Power Supply

| # | Component | Specification | Quantity | Unit Price (₹) | Total (₹) |
|---|---|---|---|---|---|
| 15 | 5V 3A USB Power Supply | For servo power rail | 1 | 180 | 180 |
| 16 | USB Type-A to Micro-B Cable | 1m, for NodeMCU | 1 | 60 | 60 |
| 17 | CR2032 Battery | RTC backup | 1 | 30 | 30 |
| 18 | DC-DC Buck Converter | LM2596 module — optional voltage regulation | 1 | 80 | 80 |

**Subtotal Power: ₹350**

---

## Structural / Enclosure

| # | Component | Specification | Quantity | Unit Price (₹) | Total (₹) |
|---|---|---|---|---|---|
| 19 | Cardboard / PVC Sheet | For dispenser compartment box | 1 lot | 100 | 100 |
| 20 | Jumper Wires | Male-to-male + male-to-female, 20cm | 2 packs | 60 | 120 |
| 21 | Breadboard | 830 tie-points | 1 | 120 | 120 |
| 22 | Perfboard (PCB) | For final soldered version | 2 | 30 | 60 |
| 23 | Pin Headers | For module connections | 2 strips | 15 | 30 |
| 24 | Hot Glue + Sticks | Assembly | 1 pack | 80 | 80 |
| 25 | M3 Bolts & Nuts | Mounting servos | 1 pack | 50 | 50 |

**Subtotal Structure: ₹560**

---

## Software & Development (Zero cost)

| Tool | Cost |
|---|---|
| Arduino IDE | Free |
| Firebase Spark (Hobby) Plan | Free (1 GB storage, 10 GB/month transfer) |
| React (Create React App) | Free / Open Source |
| All libraries used | Free / Open Source |

---

## Cost Summary

| Category | Cost (₹) |
|---|---|
| Core Electronics | 1,360 |
| Passive Components | 44 |
| Power Supply | 350 |
| Structure & Assembly | 560 |
| **GRAND TOTAL** | **₹2,314** |

> **Project budget target: Under ₹4,000 ✅** — Total cost is ₹2,314, leaving ₹1,686 margin for replacement parts or upgrades.

---

## Optional Upgrades (not included in base BOM)

| Component | Cost (₹) | Purpose |
|---|---|---|
| CD4051 8-channel Analog Mux | 25 | Cleaner IR sensor multiplexing |
| 18650 Li-ion battery + TP4056 module | 250 | Portable battery operation |
| Piezo buzzer (louder) | 40 | Louder alerts |
| OLED 128×64 display | 250 | Upgraded display replacing 16×2 LCD |

---

## Where to Buy (India)

- **Robu.in** — Best for NodeMCU, servos, sensors, RTC
- **Amazon India** — Breadboards, jumper wires, power adapters
- **Sunrom.com** — ICs, passives, perfboards
- **Electronicscomp.com** — Local sourcing, same-day delivery in major cities
- **SP Road, Bengaluru / Lamington Road, Mumbai** — Physical market for all components
