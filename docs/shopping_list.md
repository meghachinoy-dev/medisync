# MediSync — Component Shopping List

All prices in ₹ (Indian Rupees). Links verified June 2026. Grand total: **₹2,314**.

---

## Core Electronics (₹1,360)

| # | Component | Qty | Unit Price | Total | Buy Link |
|---|---|---|---|---|---|
| 1 | NodeMCU ESP8266 V3 (CP2102) | 1 | ₹220 | ₹220 | [Robu.in](https://robu.in/product/nodemcu-cp2102-board/) |
| 2 | DS3231 RTC Module (with CR2032 battery) | 1 | ₹120 | ₹120 | [Robu.in](https://robu.in/product/ds3231-real-time-clock-module-3-3v-5v-precise-with-battery/) |
| 3 | TowerPro SG90 Servo Motor 180° | 6 | ₹90 | ₹540 | [Robu.in](https://robu.in/product/towerpro-sg90-9gm-1-2kg-180-degree-rotation-servo-motor-good-quality) |
| 4 | 16×2 LCD with I2C backpack (PCF8574) | 1 | ₹180 | ₹180 | [Robu.in](https://robu.in/product/lcd1602-parallel-lcd-display-with-iic-i2c-interface/) |
| 5 | IR Obstacle Avoidance Sensor Module | 6 | ₹45 | ₹270 | [Robu.in](https://robu.in/product/ir-infrared-obstacle-avoidance-sensor-module/) |
| 6 | 5V Active Buzzer Module | 1 | ₹30 | ₹30 | [Robu.in](https://robu.in/product/5v-active-alarm-buzzer-module-arduino/) |

> **Note:** If the DS3231 module with battery is out of stock, get the [version without battery](https://robu.in/product/ds3231-rtc-module-precise-real-time-clock-i2c-at24c32-without-cell/) and buy a CR2032 separately (see Power section below).

---

## Passive Components & Transistors (₹44)

Buy these as kits — far cheaper and more convenient than individual pieces:

| # | Component | Qty Needed | Buy Link |
|---|---|---|---|
| 7 | BC547 NPN Transistor | 2 | [BC547 Pack of 20 — Robu.in](https://robu.in/product/bc547-npn-transistor-pack-of-20/) |
| 8 | Resistors: 220Ω, 1kΩ, 10kΩ (½W) | 5 each | [Resistor + Transistor Kit — Robu.in](https://robu.in/product/plusivo-bjt-transistors-assortment-kit-with-bonus-resistor-pack/) |
| 9 | Capacitor 100µF electrolytic | 2 | Included in most capacitor kits on Robu.in |
| 10 | Capacitor 100nF ceramic | 5 | Included in most capacitor kits on Robu.in |
| 11 | LED Green 5mm | 2 | Any local electronics shop or Robu.in |
| 12 | LED Red 5mm | 2 | Any local electronics shop or Robu.in |

> **Tip:** The Plusivo resistor kit covers all the values you need (220Ω, 1kΩ, 10kΩ). Capacitors can be bought at any local electronics shop (SP Road / Lamington Road) for a few rupees.

---

## Power Supply (₹350)

| # | Component | Qty | Price | Buy Link |
|---|---|---|---|---|
| 15 | 5V 3A USB-A to DC Power Adapter | 1 | ₹180 | [Amazon.in](https://www.amazon.in/M-Enterprises-Adaptor-Tablet-Arduino/dp/B01MSNO30Q) |
| 16 | USB Type-A to Micro-B Cable (1m) | 1 | ₹60 | [Amazon.in search](https://www.amazon.in/s?k=usb+micro+b+cable+1m) |
| 17 | CR2032 Coin Cell Battery (3V) | 1 | ₹30 | [Energizer CR2032 — Amazon.in](https://www.amazon.in/Energizer-2032-Battery-CR2032-Lithium/dp/B0042A9UXC) |
| 18 | LM2596 DC-DC Buck Converter Module *(optional)* | 1 | ₹80 | [Robu.in](https://robu.in/product/lm2596s-dc-dc-buck-converter-power-supply/) |

> **Note on power adapter:** The servos draw up to 700mA each at stall. With 6 servos, you need at least 3A on the 5V rail. Do **not** power servos from the NodeMCU's 3.3V pin — use a separate 5V supply.

---

## Structural / Prototyping (₹560)

| # | Component | Qty | Price | Buy Link |
|---|---|---|---|---|
| 19 | MB102 830 Tie-Point Solderless Breadboard | 1 | ₹120 | [Robu.in](https://robu.in/product/mb102-830-points-solderless-prototype-pcb-breadboard-high-quality/) |
| 20 | Jumper Wires Male-to-Female 40pcs 20cm | 2 packs | ₹60 | [Robu.in](https://robu.in/product/male-to-female-jumper-wires-40pcs-20cm/) |
| 21 | Jumper Wires Male-to-Male 40pcs 20cm | 1 pack | ₹60 | [Robu.in](https://robu.in/product/male-to-male-jumper-wires-40pcs-20cm/) |
| 22 | Cardboard / PVC sheet for enclosure | 1 lot | ₹100 | Local stationery store |
| 23 | Perfboard / Zero PCB (for final soldering) | 2 | ₹60 | [Robu.in PCB section](https://robu.in/product-category/electronic-components/pcb-board/) |
| 24 | Pin Headers (straight, 2.54mm) | 2 strips | ₹30 | Local electronics shop |
| 25 | Hot Glue Gun + sticks | 1 pack | ₹80 | Local stationery / hardware store |
| 26 | M3 Bolts & Nuts (for servo mounting) | 1 pack | ₹50 | Local hardware store |

---

## Optional Upgrades (not in base build)

| Component | Price | Why | Buy Link |
|---|---|---|---|
| CD4051 8-channel Analog Multiplexer | ₹25 | Cleaner IR sensor wiring | [Robu.in search](https://robu.in/product-tag/multiplexer/) |
| 18650 Li-ion Cell + TP4056 Module | ₹250 | Battery-powered operation | [Robu.in](https://robu.in/product/2-x-18650-lithium-battery-shield-for-arduinoesp32-esp8266/) |
| OLED 128×64 Display (SSD1306) | ₹250 | Upgrade from 16×2 LCD | [Robu.in](https://robu.in/product-category/electronic-modules/display-modules/) |

---

## Cost Summary

| Category | Cost |
|---|---|
| Core Electronics | ₹1,360 |
| Passives & Transistors | ₹44 |
| Power Supply | ₹350 |
| Structural / Prototyping | ₹560 |
| **Grand Total** | **₹2,314** |

Budget target: ₹4,000 — **₹1,686 margin remaining.**

---

## Where to Order

| Store | Best for | Shipping |
|---|---|---|
| [Robu.in](https://robu.in) | NodeMCU, servos, sensors, RTC, LCD | Free above ₹499 |
| [Amazon.in](https://amazon.in) | Power adapters, USB cables, batteries | Prime same-day in most cities |
| SP Road (Bengaluru) / Lamington Road (Mumbai) | Passives, transistors, capacitors, LEDs | Walk-in, same day |

> Order from Robu.in first — you can get items 1–6, 7, 19, 20, 21 in a single cart and qualify for free shipping.
