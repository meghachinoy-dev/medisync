# MediSync — IoT Smart Medicine Dispenser

**ICSE 10th Grade Computer Science / Electronics Project**

An IoT-powered smart medicine dispenser with AI adaptive scheduling, real-time cloud sync, and a React web dashboard.

---

## What It Does

MediSync automatically dispenses the correct medicine at the correct time. A NodeMCU ESP8266 microcontroller controls 6 SG90 servo motors (one per compartment), reads schedules from Firebase, and logs every dose event. A React web app lets caregivers manage medicines, view 30-day compliance analytics, and receive intelligent alerts powered by an AI pattern detection engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web App | React 18, Firebase 9 SDK, Recharts, React Router v6 |
| Cloud | Firebase Realtime Database |
| Firmware | Arduino C++ (ESP8266) |
| Hardware | NodeMCU, DS3231, SG90 × 6, 16×2 LCD, IR sensors, Buzzer |

---

## Project Structure

```
medisync/
├── app/                    React web dashboard
│   ├── src/
│   │   ├── components/     7 page components
│   │   ├── hooks/          useFirebase, useSchedule, useAIEngine
│   │   └── utils/          aiEngine, scheduleBuilder, complianceCalc, notifications
│   └── package.json
├── firmware/               NodeMCU ESP8266 Arduino firmware
│   └── medisync_firmware/
│       ├── *.ino           Main sketch
│       ├── *_handler.*     Firebase, RTC, servo, sensor, LCD modules
│       └── ai_rules.*      Embedded AI rule engine
├── firebase/
│   ├── database.rules.json Security rules
│   └── schema.md           Full database schema documentation
├── docs/
│   ├── project_report.md   Full ICSE board project report (2500+ words)
│   ├── circuit_diagram.md  Complete wiring table
│   ├── component_list.md   BOM with Indian prices (total: ₹2,314)
│   ├── setup_guide.md      Step-by-step setup instructions
│   └── ai_logic_explained.md  AI engine explanation for examiners
└── README.md
```

---

## Quick Start

### Web App (Demo Mode — no Firebase needed)

```bash
cd medisync/app
npm install
npm start
```

Opens at `http://localhost:3000` with 30 days of demo data.

### Web App (Live Firebase Mode)

```bash
cp app/.env.example app/.env
# Fill in your Firebase credentials
npm start
```

### Firmware

1. Open `firmware/medisync_firmware/medisync_firmware.ino` in Arduino IDE
2. Fill WiFi + Firebase credentials in `config.h`
3. Install libraries listed in `firmware/libraries_required.txt`
4. Select **NodeMCU 1.0 (ESP-12E)** board → Upload

---

## Firebase Setup (10 minutes)

1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database (asia-south1 / Mumbai region)
3. Copy config values to `app/.env`
4. Apply security rules from `firebase/database.rules.json`
5. Copy legacy database secret → paste into `firmware/config.h` as `FIREBASE_AUTH`

Full instructions: [`docs/setup_guide.md`](docs/setup_guide.md)

---

## Hardware Components (₹2,314 total)

| Component | Qty | Cost (₹) |
|---|---|---|
| NodeMCU ESP8266 | 1 | 220 |
| SG90 Servo Motor | 6 | 540 |
| DS3231 RTC Module | 1 | 120 |
| 16×2 I2C LCD | 1 | 180 |
| IR Obstacle Sensor | 6 | 270 |
| Active Buzzer | 1 | 30 |
| Power supply + misc | — | 954 |

Full BOM: [`docs/component_list.md`](docs/component_list.md)

Wiring: [`docs/circuit_diagram.md`](docs/circuit_diagram.md)

---

## AI Features

The adaptive scheduling engine detects 6 behavioural patterns:

| Pattern | Detection | Action |
|---|---|---|
| Consecutive Miss | Same dose missed 3+ days in a row | Shift reminder earlier |
| Day-of-Week | Consistently missed on specific day | Add secondary reminder |
| Low Stock | ≤5 pills remaining | Alert caregiver |
| Compliance Drop | 7-day rate < 70% | Doctor notification |
| Early Take | Consistently taken before scheduled time | Suggest schedule shift |
| Interaction Window | Two medicines within 15 min of each other | Recommend staggering |

Details: [`docs/ai_logic_explained.md`](docs/ai_logic_explained.md)

---

## Dashboard Features

- **Dashboard**: Today's dose timeline with status badges (taken/missed/pending/upcoming), weekly bar chart, live device sync panel
- **Medicine Manager**: Add/edit/delete medicines with compartment assignment, day/time picker
- **Schedule**: Full 7-day grid view, click any cell for dose details
- **Analytics**: 30-day compliance line chart, per-medicine bar chart, missed-dose heatmap by hour, best/worst day analysis
- **AI Insights**: Pattern detection cards with confidence levels and auto-apply status
- **Hardware Monitor**: Device online/offline, battery, WiFi signal, 6 compartment status cards with fill bars
- **Alerts**: Missed dose, low stock, doctor notify feed with mark-as-read and filter tabs

---

## License

Open source — built for educational use. Free to adapt for personal or academic projects.
