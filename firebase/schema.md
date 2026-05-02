# MediSync Firebase Realtime Database Schema

Base URL: `https://YOUR_PROJECT-default-rtdb.firebaseio.com`

---

## `/medicines/{medicineId}`

Stores all medicine configurations. Written by the React app; read by both app and NodeMCU.

```json
{
  "med001": {
    "id": "med001",
    "name": "Metformin",
    "dosage": "500mg",
    "form": "tablet",
    "compartmentNumber": 1,
    "colorHex": "#3b82f6",
    "scheduleDays": [0, 1, 2, 3, 4, 5, 6],
    "doseTimes": ["08:00", "20:00"],
    "addedAt": 1714550400000,
    "active": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Same as key |
| `name` | string | Medicine display name |
| `dosage` | string | Strength e.g. "500mg" |
| `form` | string | tablet / capsule / syrup / injection / drops |
| `compartmentNumber` | number | 1–6 |
| `colorHex` | string | Hex color for UI display |
| `scheduleDays` | array\<number\> | 0=Sun, 1=Mon … 6=Sat |
| `doseTimes` | array\<string\> | "HH:MM" format (24h) |
| `addedAt` | number | Unix epoch ms |
| `active` | boolean | Soft-delete flag |

---

## `/dose_logs/{date}/{logId}`

Written by NodeMCU after each dispense attempt; read by app for analytics.

```json
{
  "2026-05-01": {
    "hw_1714550400": {
      "medicineId": "med001",
      "scheduledTime": "08:00",
      "actualTime": "08:00",
      "status": "taken",
      "dispensedByHardware": true,
      "confirmedByIR": true,
      "pillsRemaining": 23,
      "timestamp": 1714550400000
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `medicineId` | string | Reference to `/medicines/{id}` |
| `scheduledTime` | string | Original scheduled "HH:MM" |
| `actualTime` | string | When actually dispensed (null if missed) |
| `status` | string | taken / missed / pending / upcoming |
| `dispensedByHardware` | boolean | NodeMCU triggered |
| `confirmedByIR` | boolean | IR sensor detected pill exit |
| `pillsRemaining` | number | Count after this dispense |
| `timestamp` | number | Unix epoch ms |

---

## `/hardware_status`

Written by NodeMCU every 60 seconds. Read by app for Hardware Monitor page.

```json
{
  "deviceId": "MEDISYNC-001",
  "online": true,
  "lastSeen": 1714550400000,
  "batteryPercent": 87,
  "wifiSSID": "HomeNetwork",
  "wifiStrength": -62,
  "lastDispenseTime": 1714546800000,
  "firmwareVersion": "2.1.4"
}
```

| Field | Type | Description |
|---|---|---|
| `online` | boolean | Updated to false on clean shutdown |
| `lastSeen` | number | Epoch ms of last heartbeat |
| `wifiStrength` | number | RSSI in dBm (e.g. -62 = good) |
| `firmwareVersion` | string | Semantic version string |

---

## `/compartments/{number}`

Written by NodeMCU every 10 minutes. Read by app for pill count display.

```json
{
  "1": {
    "medicineId": "med001",
    "pillsRemaining": 24,
    "pillsMax": 30,
    "lastRefilled": 1714204800000,
    "status": "OK"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `pillsRemaining` | number | Estimated remaining (decremented per dispense) |
| `pillsMax` | number | Capacity when full (default: 30) |
| `status` | string | OK / LOW (≤5) / EMPTY (0) / UNASSIGNED |

---

## `/alerts/{alertId}`

Written by app (AI engine) when patterns are detected. Read for Notification Panel.

```json
{
  "alert001": {
    "type": "LOW_STOCK",
    "severity": "warning",
    "message": "Amlodipine in compartment 2 has only 4 pills remaining.",
    "medicineId": "med002",
    "compartment": 2,
    "createdAt": 1714550400000,
    "read": false,
    "sentToCaregiver": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `type` | string | MISSED_DOSE / LOW_STOCK / EMPTY / DOCTOR_NOTIFY / INFO |
| `severity` | string | critical / warning / info |
| `sentToCaregiver` | boolean | True when severity = critical |

---

## `/ai_rules/{ruleId}`

Written by the app's AI engine. Read by NodeMCU on boot to apply schedule shifts.

```json
{
  "rule001": {
    "patternType": "CONSECUTIVE_MISS",
    "medicineId": "med002",
    "detectedAt": 1714550400000,
    "action": "SHIFT_REMINDER_EARLIER",
    "applied": true,
    "shiftMinutes": 15,
    "confidence": 0.87
  }
}
```

| Field | Type | Description |
|---|---|---|
| `patternType` | string | CONSECUTIVE_MISS / DAY_OF_WEEK / LOW_STOCK / COMPLIANCE_THRESHOLD / EARLY_TAKE_PATTERN / INTERACTION_WINDOW |
| `action` | string | SHIFT_REMINDER_EARLIER / ADD_SECONDARY_REMINDER / GENERATE_REFILL_ALERT / GENERATE_DOCTOR_NOTIFY / LOG_ONLY |
| `applied` | boolean | NodeMCU only acts on rules with applied=true |
| `shiftMinutes` | number | Minutes to shift scheduled time earlier (0 if N/A) |
| `confidence` | number | 0.0–1.0; rules ≥0.9 are auto-pushed |

---

## `/hardware_commands`

Written by app; polled by NodeMCU to receive remote commands.

```json
{
  "schedule_update": false,
  "force_dispense": 0,
  "led_test": false,
  "lcd_message": ""
}
```

| Field | Type | Description |
|---|---|---|
| `schedule_update` | boolean | App sets true → NodeMCU reloads schedule, resets to false |
| `force_dispense` | number | 1–6 = compartment to dispense immediately; 0 = none |
| `led_test` | boolean | Triggers servo test sweep |
| `lcd_message` | string | Override text shown on LCD (max 32 chars) |

---

## `/schedule/{date}/{timeSlot}`

Optional — used for pre-computed schedule cache. The app also computes schedule client-side.

```json
{
  "2026-05-01": {
    "08:00": {
      "medicineId": "med001",
      "compartmentNumber": 1,
      "status": "taken",
      "adaptedTime": "07:45",
      "originalTime": "08:00"
    }
  }
}
```
