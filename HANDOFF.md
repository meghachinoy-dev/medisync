# MediSync — Session Handoff (for continuing on another device)

**Paste this file's contents into Claude Code on the Windows machine** (or just say
"read HANDOFF.md") to resume with full context.

_Last updated: 2026-11-17_

## What MediSync is
IoT smart medicine dispenser — ICSE 10th-grade project.
- **Web app:** React + Firebase, deployed at **medisync-umber.vercel.app** (auto-deploys from `main` on Vercel).
- **Firmware:** ESP8266 (NodeMCU), DS3231 RTC (optional), 6× SG90 servos, 16×2 I²C LCD.
- **Repo:** github.com/meghachinoy-dev/medisync — **fully pushed and current** (latest commit `768ffb0`).
- Per-user accounts: all data namespaced at `/users/{uid}/…` in Firebase Realtime DB.

## Current working state (everything below is DONE and verified)
- ✅ **Device comes online** — WiFi connects, Firebase writes `hardware_status`.
- ✅ **Per-user login** (email/password); firmware writes to the owner UID in `config.h`.
- ✅ **Online/offline accuracy** — web now shows offline when the heartbeat is stale (>150s); device heartbeats every 60s.
- ✅ **NTP time fallback** — the DS3231 is optional; if absent, the ESP8266 gets real time from NTP over WiFi (India Standard Time, UTC+5:30). Timestamps are 64-bit (a 32-bit overflow bug was fixed).
- ✅ **SSL/heap fix** — BearSSL buffers shrunk so the TLS handshake fits in RAM (free heap ~28 KB).
- ✅ **WiFi stability** — modem sleep disabled, auto-reconnect, max TX power; plus boot diagnostics (I²C scan, disconnect reason codes, 2.5s boot delay so early logs are captured).
- ✅ **3D enclosure** — OpenSCAD source + STL + STEP in `enclosure/`.

## Known open issue
- ⚠️ **LCD not working.** It was detected earlier at `0x27`, then after moving VCC from 3V3 to 5V (Vin) the **entire I²C bus went dead** (`[I2C] NONE found`), even though the backlight still lights. Fresh jumper wires didn't help. **Most likely the PCF8574 backpack was damaged during the 5V rewiring** (backlight is a separate circuit, so it lights even if the I²C chip is dead). A less likely alternative is damaged NodeMCU D1/D2 pins.
  - **The device runs fully headless** — the LCD is a display nicety, NOT a functional blocker. Everything else works.
  - **To fix:** test the LCD on another board, or test another I²C device on D1/D2, to see which part died; otherwise replace the ~₹150 I²C LCD/backpack. Correct wiring: VCC→5V(VU/Vin), GND→GND, SDA→D2, SCL→D1. Firmware already handles it (`i2c_scan()` + probing `lcd_init()`).

## How things are wired / configured
- **`config.h` is gitignored** and lives **only on the Windows machine** (holds WiFi SSID/password, Firebase host, legacy auth secret, and `FIREBASE_OWNER_UID`). It is NOT in the repo or the zip's git — the repo copy has placeholders.
- Firmware is compiled/uploaded from the **Windows** machine (Arduino IDE).
- Servo pins: D5/D6/D7 (comps 1–3), D3/D4/D8 (comps 4–6, boot pins — disconnect their signal wires while flashing).
- I²C (LCD + RTC): SDA=D2, SCL=D1.

## Standing preferences
- **Auto-zip backup:** after ANY change to the project, rebuild a single Desktop backup zip (`medisync_backup_<date>.zip`), excluding `node_modules`, `.git`, `build`. (On Linux side; replicate on Windows if desired.)
- User prefers to paste the Firebase UID manually rather than have it auto-queried.

## Immediate next steps / ideas
1. Resolve the LCD (replace backpack, or confirm it's dead and run headless).
2. Optionally add a Firebase `onDisconnect` "last will" in firmware for instant offline (currently inferred from staleness on the web side — works fine).
3. Add medicines in the web app to exercise the schedule → dispense loop end-to-end.

## To continue on Windows
```bash
# get the code
git clone https://github.com/meghachinoy-dev/medisync.git
# (config.h stays local — recreate from config.h.example or your saved copy)
```
Then open Claude Code in the folder and paste this file, or run `claude` and say "read HANDOFF.md".
