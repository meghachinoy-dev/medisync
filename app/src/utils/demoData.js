// Demo data used when no Firebase credentials are configured
export const demoMedicines = {
  med001: {
    id: 'med001',
    name: 'Metformin',
    dosage: '500mg',
    form: 'tablet',
    compartmentNumber: 1,
    colorHex: '#3b82f6',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    doseTimes: ['08:00', '20:00'],
    addedAt: Date.now() - 30 * 86400000,
    active: true,
  },
  med002: {
    id: 'med002',
    name: 'Amlodipine',
    dosage: '5mg',
    form: 'tablet',
    compartmentNumber: 2,
    colorHex: '#ef4444',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    doseTimes: ['09:00'],
    addedAt: Date.now() - 25 * 86400000,
    active: true,
  },
  med003: {
    id: 'med003',
    name: 'Vitamin D3',
    dosage: '60000 IU',
    form: 'capsule',
    compartmentNumber: 3,
    colorHex: '#f59e0b',
    scheduleDays: [0],
    doseTimes: ['10:00'],
    addedAt: Date.now() - 20 * 86400000,
    active: true,
  },
  med004: {
    id: 'med004',
    name: 'Aspirin',
    dosage: '75mg',
    form: 'tablet',
    compartmentNumber: 4,
    colorHex: '#10b981',
    scheduleDays: [0, 1, 2, 3, 4, 5, 6],
    doseTimes: ['13:00'],
    addedAt: Date.now() - 15 * 86400000,
    active: true,
  },
  med005: {
    id: 'med005',
    name: 'Omeprazole',
    dosage: '20mg',
    form: 'capsule',
    compartmentNumber: 5,
    colorHex: '#8b5cf6',
    scheduleDays: [1, 2, 3, 4, 5],
    doseTimes: ['07:30'],
    addedAt: Date.now() - 10 * 86400000,
    active: true,
  },
};

export const demoCompartments = {
  1: { medicineId: 'med001', pillsRemaining: 24, pillsMax: 30, lastRefilled: Date.now() - 7 * 86400000, status: 'OK' },
  2: { medicineId: 'med002', pillsRemaining: 4, pillsMax: 30, lastRefilled: Date.now() - 26 * 86400000, status: 'LOW' },
  3: { medicineId: 'med003', pillsRemaining: 0, pillsMax: 4, lastRefilled: Date.now() - 28 * 86400000, status: 'EMPTY' },
  4: { medicineId: 'med004', pillsRemaining: 18, pillsMax: 30, lastRefilled: Date.now() - 12 * 86400000, status: 'OK' },
  5: { medicineId: 'med005', pillsRemaining: 9, pillsMax: 20, lastRefilled: Date.now() - 10 * 86400000, status: 'OK' },
  6: { medicineId: null, pillsRemaining: 0, pillsMax: 30, lastRefilled: null, status: 'UNASSIGNED' },
};

export const demoHardwareStatus = {
  deviceId: 'MEDISYNC-001',
  online: true,
  lastSeen: Date.now() - 45000,
  batteryPercent: 87,
  wifiSSID: 'HomeNetwork',
  wifiStrength: -62,
  lastDispenseTime: Date.now() - 3600000,
  firmwareVersion: '2.1.4',
};

function generateDoseLogs() {
  const logs = {};
  const now = Date.now();
  const medicines = Object.values(demoMedicines);

  for (let d = 29; d >= 0; d--) {
    const date = new Date(now - d * 86400000);
    const dateKey = date.toISOString().split('T')[0];
    logs[dateKey] = {};

    medicines.forEach((med) => {
      const dayOfWeek = date.getDay();
      if (!med.scheduleDays.includes(dayOfWeek)) return;

      med.doseTimes.forEach((time, idx) => {
        const logId = `log_${dateKey}_${med.id}_${idx}`;
        const rand = Math.random();
        let status;
        if (d === 0) {
          const [h, m] = time.split(':').map(Number);
          const now2 = new Date();
          const scheduled = new Date(date);
          scheduled.setHours(h, m, 0, 0);
          status = scheduled > now2 ? 'pending' : rand > 0.15 ? 'taken' : 'missed';
        } else {
          status = rand > 0.18 ? 'taken' : 'missed';
        }

        const [h, m] = time.split(':').map(Number);
        const scheduledTs = new Date(date);
        scheduledTs.setHours(h, m, 0, 0);

        logs[dateKey][logId] = {
          medicineId: med.id,
          scheduledTime: time,
          actualTime: status === 'taken' ? time : null,
          status,
          dispensedByHardware: status === 'taken',
          confirmedByIR: status === 'taken' && Math.random() > 0.05,
          pillsRemaining: demoCompartments[med.compartmentNumber].pillsRemaining,
          timestamp: scheduledTs.getTime(),
        };
      });
    });
  }
  return logs;
}

export const demoDoseLogs = generateDoseLogs();

export const demoAlerts = {
  alert001: {
    id: 'alert001',
    type: 'LOW_STOCK',
    severity: 'warning',
    message: 'Amlodipine in compartment 2 has only 4 pills remaining. Please refill.',
    medicineId: 'med002',
    compartment: 2,
    createdAt: Date.now() - 7200000,
    read: false,
    sentToCaregiver: true,
  },
  alert002: {
    id: 'alert002',
    type: 'EMPTY',
    severity: 'critical',
    message: 'Vitamin D3 in compartment 3 is empty. Refill immediately.',
    medicineId: 'med003',
    compartment: 3,
    createdAt: Date.now() - 3600000,
    read: false,
    sentToCaregiver: true,
  },
  alert003: {
    id: 'alert003',
    type: 'MISSED_DOSE',
    severity: 'warning',
    message: 'Metformin 8:00 PM dose was missed yesterday.',
    medicineId: 'med001',
    compartment: 1,
    createdAt: Date.now() - 86400000,
    read: true,
    sentToCaregiver: false,
  },
  alert004: {
    id: 'alert004',
    type: 'MISSED_DOSE',
    severity: 'info',
    message: 'Omeprazole morning dose missed — Friday pattern detected.',
    medicineId: 'med005',
    compartment: 5,
    createdAt: Date.now() - 172800000,
    read: true,
    sentToCaregiver: false,
  },
};

export const demoAIRules = {
  rule001: {
    id: 'rule001',
    patternType: 'CONSECUTIVE_MISS',
    medicineId: 'med002',
    detectedAt: Date.now() - 259200000,
    action: 'SHIFT_REMINDER_EARLIER',
    applied: true,
    shiftMinutes: 15,
    confidence: 0.87,
  },
  rule002: {
    id: 'rule002',
    patternType: 'DAY_OF_WEEK',
    medicineId: 'med005',
    detectedAt: Date.now() - 172800000,
    action: 'ADD_SECONDARY_REMINDER',
    applied: true,
    shiftMinutes: 30,
    confidence: 0.92,
  },
  rule003: {
    id: 'rule003',
    patternType: 'LOW_STOCK',
    medicineId: 'med002',
    detectedAt: Date.now() - 7200000,
    action: 'GENERATE_REFILL_ALERT',
    applied: true,
    shiftMinutes: 0,
    confidence: 1.0,
  },
};
