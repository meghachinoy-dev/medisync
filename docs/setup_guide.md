# MediSync — Step-by-Step Setup Guide

---

## Part 1: Firebase Setup (5–10 minutes)

### Step 1: Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → Name it `medisync` → Continue
3. Disable Google Analytics (not needed) → **"Create project"**

### Step 2: Enable Realtime Database

1. In the left sidebar, click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose location: **"asia-south1 (Mumbai)"** for India
4. Start in **"Test mode"** (we'll add proper rules later)
5. Copy your database URL: `https://medisync-XXXXX-default-rtdb.asia-south1.firebasedatabase.app`

### Step 3: Get Firebase Config

1. Click the gear icon → **"Project settings"**
2. Scroll to **"Your apps"** → Click **"</>"** (Web app)
3. Register app name: `medisync-web` → Click **"Register app"**
4. Copy the `firebaseConfig` object values

### Step 4: Apply Security Rules

1. In Realtime Database, click **"Rules"** tab
2. Replace the content with the contents of `firebase/database.rules.json`
3. Click **"Publish"**

### Step 5: Get Database Secret (for NodeMCU)

1. **Project settings** → **"Service accounts"** tab
2. Click **"Database secrets"** → Show → Copy the legacy secret

---

## Part 2: React App Setup (5 minutes)

### Step 1: Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org)

Verify: `node --version` should show v18 or higher.

### Step 2: Install Dependencies

```bash
cd medisync/app
npm install
```

This installs React, Firebase SDK, Recharts, React Router.

### Step 3: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=medisync-xxxxx.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://medisync-xxxxx-default-rtdb.asia-south1.firebasedatabase.app
REACT_APP_FIREBASE_PROJECT_ID=medisync-xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=medisync-xxxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### Step 4: Start the App

```bash
npm start
```

Opens at `http://localhost:3000`. If `.env` is not configured, it runs in Demo Mode with sample data.

### Step 5: Build for Production (optional)

```bash
npm run build
```

Produces optimised files in `app/build/` ready for deployment to Netlify, Vercel, or GitHub Pages.

---

## Part 3: Hardware Assembly

### Step 1: Physical Dispenser Box

1. Cut 6 equal compartments from cardboard/PVC (approx. 8cm × 8cm × 5cm each)
2. Arrange in a 2×3 grid
3. Mount one SG90 servo at the bottom of each compartment
4. Create a rotating disc or sliding gate mechanism attached to each servo horn
5. Cut a small pill exit hole at the bottom front of each compartment
6. Mount the IR sensor (compartment 1 only) pointing downward through its exit hole

### Step 2: Electronics Wiring

For a full step-by-step breadboard walkthrough (rail setup, assembly order, flash
ritual, smoke test), see [`build_guide.md`](build_guide.md). The complete pin
reference table is in [`circuit_diagram.md`](circuit_diagram.md).

Key points:
- Power servos from external 5V 3A supply, NOT from NodeMCU
- Connect all GNDs together (NodeMCU + external supply)
- Add 100µF capacitor on 5V rail near servos
- DS3231 and LCD share the I2C bus (D1=SCL, D2=SDA)
- Power the DS3231 and LCD backpack from NodeMCU **3V3**, not 5V — the shared I2C bus must stay at 3.3V (ESP8266 pins are not 5V-tolerant)
- Buzzer is on **D0 (GPIO16)** via an NPN transistor; all 6 servo signals are on D3–D8

### Step 3: Test Each Servo

Upload this minimal test sketch to verify each servo works before the full firmware:

```cpp
#include <Servo.h>
Servo s;
void setup() { s.attach(14); }  // Change pin to test each servo
void loop() { s.write(180); delay(1000); s.write(0); delay(1000); }
```

### Step 4: Verify I2C Devices

Run the I2C scanner (in `docs/circuit_diagram.md`) to confirm DS3231 (0x68) and LCD (0x27) are detected.

---

## Part 4: Firmware Setup (15–20 minutes)

### Step 1: Install Arduino IDE

Download Arduino IDE 2.x from [arduino.cc/en/software](https://www.arduino.cc/en/software)

### Step 2: Add ESP8266 Board Support

1. Open Arduino IDE → **File** → **Preferences**
2. Add to "Additional boards manager URLs":
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. **Tools** → **Board** → **Boards Manager** → Search "esp8266" → Install

### Step 3: Install Required Libraries

**Tools → Manage Libraries**, install each:
- Firebase ESP8266 Client (by Mobizt) — v4.4.0+
- RTClib (by Adafruit) — v2.1.1+
- LiquidCrystal I2C (by Frank de Brabander) — v1.1.2+
- ArduinoJson (by Benoit Blanchon) — v6.21.0+

### Step 4: Configure `config.h`

Open `firmware/medisync_firmware/config.h` and fill in:

```cpp
#define WIFI_SSID     "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"
#define FIREBASE_HOST "medisync-xxxxx-default-rtdb.asia-south1.firebasedatabase.app"
#define FIREBASE_AUTH "your-database-legacy-secret"
#define DEVICE_ID     "MEDISYNC-001"
```

### Step 5: Select Board & Port

1. **Tools** → **Board** → **ESP8266 Boards** → **NodeMCU 1.0 (ESP-12E Module)**
2. **Tools** → **Port** → Select the COM port for your NodeMCU (e.g. COM3 on Windows, /dev/ttyUSB0 on Linux)
3. **Tools** → **Upload Speed** → 115200
4. **Tools** → **Flash Size** → 4MB (FS:2MB, OTA:~1019KB)

### Step 6: Flash Firmware

1. Open `firmware/medisync_firmware/medisync_firmware.ino` in Arduino IDE
2. Click the **Upload** button (right arrow)
3. Wait for "Done uploading" message

> **Note**: Disconnect servo 3 and 4 signal wires from D3 and D4 before flashing. Reconnect after upload.

### Step 7: Monitor Serial Output

**Tools → Serial Monitor** → Baud rate: 115200

You should see:
```
[MediSync] Booting v2.1.4
[LCD] Initialised
[Servo] All 6 servos initialised at 0°
[RTC] Initialised
[WiFi] Connecting to YourWiFiName
[WiFi] Connected, IP: 192.168.1.x
[Firebase] Initialised
[AI] Rules loaded: 0
[Firebase] Schedule loaded, entries: 5
[Main] Setup complete — entering main loop
```

---

## Part 5: Adding Medicines (React App)

1. Open the app at `http://localhost:3000`
2. Click **"Medicines"** in the sidebar
3. Click **"+ Add Medicine"**
4. Fill in: Name, Dosage, Form, Compartment number, Days, Times
5. Click **"Save Medicine"**

The app writes to Firebase. Within 30 seconds, the NodeMCU polls Firebase and loads the new schedule. You'll see "Schedule loaded, entries: X" in the serial monitor.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| App shows "Demo Mode" | No `.env` file or wrong DATABASE_URL — check `.env` |
| LCD shows nothing | Check I2C address with scanner; try 0x3F instead of 0x27 |
| RTC shows wrong time | Sketch uses compile time — upload and run immediately |
| Servo twitches on boot | Add 100µF cap on 5V rail; external power supply needed |
| Firebase `getJSON` fails | Check FIREBASE_HOST (no `https://`), check legacy secret |
| NodeMCU resets repeatedly | Watchdog timer — check for blocking code in loop() |
| IR sensor always triggers | Adjust pot on IR module; check IR_PILL_THRESHOLD value |
| WiFi won't connect | Check SSID/password; NodeMCU only supports 2.4GHz WiFi |
