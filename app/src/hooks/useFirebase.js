import { useEffect, useState, useCallback } from 'react';
import { database, ref, onValue, set, push, update, remove, DEMO_MODE } from '../firebase';
import {
  demoMedicines,
  demoCompartments,
  demoHardwareStatus,
  demoDoseLogs,
  demoAlerts,
  demoAIRules,
} from '../utils/demoData';

// The device pushes a heartbeat (lastSeen) every 60s. If we haven't heard from
// it within this window, treat it as offline — the firmware can't write
// online:false when it's unplugged or loses power, so we infer it from staleness.
const HEARTBEAT_STALE_MS = 150000; // 2.5 min ≈ 2 missed 60s heartbeats

// All data is namespaced per user at /users/{uid}/… so each account has its own
// medicines, logs, hardware, etc. Demo mode ignores uid and uses local fixtures.
export function useFirebaseData(uid) {
  const [medicines, setMedicines] = useState(DEMO_MODE ? demoMedicines : {});
  const [compartments, setCompartments] = useState(DEMO_MODE ? demoCompartments : {});
  const [hardwareStatus, setHardwareStatus] = useState(DEMO_MODE ? demoHardwareStatus : null);
  const [doseLogs, setDoseLogs] = useState(DEMO_MODE ? demoDoseLogs : {});
  const [alerts, setAlerts] = useState(DEMO_MODE ? demoAlerts : {});
  const [aiRules, setAIRules] = useState(DEMO_MODE ? demoAIRules : {});
  const [loading, setLoading] = useState(!DEMO_MODE);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(DEMO_MODE ? Date.now() : null);
  // Ticks every 20s so the online/offline check below re-runs even when the
  // device has gone silent (no Firebase update arrives to trigger a re-render).
  const [now, setNow] = useState(Date.now());

  // Build a path scoped to the current user.
  const userPath = useCallback((p) => `/users/${uid}${p}`, [uid]);

  useEffect(() => {
    if (DEMO_MODE) return;
    const id = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(id);
  }, []);

  // Overlay a staleness-aware `online`: true only if the raw flag is set AND the
  // last heartbeat is recent. A powered-off device stops updating lastSeen, so it
  // flips to offline within HEARTBEAT_STALE_MS instead of showing online forever.
  const hardwareStatusView = (() => {
    if (DEMO_MODE) return hardwareStatus;
    if (!hardwareStatus || typeof hardwareStatus !== 'object') return hardwareStatus;
    const lastSeen = Number(hardwareStatus.lastSeen) || 0;
    const fresh = lastSeen > 0 && now - lastSeen < HEARTBEAT_STALE_MS;
    return { ...hardwareStatus, online: Boolean(hardwareStatus.online) && fresh };
  })();

  useEffect(() => {
    if (DEMO_MODE || !uid) return;

    // Reset state when the signed-in user changes so data never leaks between accounts.
    setMedicines({});
    setCompartments({});
    setHardwareStatus(null);
    setDoseLogs({});
    setAlerts({});
    setAIRules({});
    setError(null);
    setLoading(true);

    const unsubs = [];

    const listen = (path, setter) => {
      try {
        const dbRef = ref(database, path);
        const unsub = onValue(dbRef, (snap) => {
          setter(snap.val() || {});
          setLastSync(Date.now());
        }, (err) => setError(err.message));
        unsubs.push(unsub);
      } catch (e) {
        setError(e.message);
      }
    };

    listen(userPath('/medicines'), setMedicines);
    listen(userPath('/compartments'), setCompartments);
    listen(userPath('/hardware_status'), (v) => setHardwareStatus(v));
    listen(userPath('/alerts'), setAlerts);
    listen(userPath('/ai_rules'), setAIRules);

    // Dose logs — last 30 days
    const today = new Date();
    for (let d = 0; d <= 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateKey = date.toISOString().split('T')[0];
      listen(userPath(`/dose_logs/${dateKey}`), (data) => {
        setDoseLogs((prev) => ({ ...prev, [dateKey]: data }));
      });
    }

    setLoading(false);
    return () => unsubs.forEach((u) => typeof u === 'function' && u());
  }, [uid, userPath]);

  const addMedicine = useCallback(async (medicine) => {
    if (DEMO_MODE) {
      const id = `med_${Date.now()}`;
      setMedicines((prev) => ({ ...prev, [id]: { ...medicine, id, addedAt: Date.now(), active: true } }));
      return id;
    }
    const medicinesRef = ref(database, userPath('/medicines'));
    const newRef = push(medicinesRef);
    const id = newRef.key;
    await set(newRef, { ...medicine, id, addedAt: Date.now(), active: true });
    await set(ref(database, userPath('/hardware_commands/schedule_update')), true);
    return id;
  }, [userPath]);

  const updateMedicine = useCallback(async (id, updates) => {
    if (DEMO_MODE) {
      setMedicines((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }));
      return;
    }
    await update(ref(database, userPath(`/medicines/${id}`)), updates);
    await set(ref(database, userPath('/hardware_commands/schedule_update')), true);
  }, [userPath]);

  const deleteMedicine = useCallback(async (id) => {
    if (DEMO_MODE) {
      setMedicines((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    await remove(ref(database, userPath(`/medicines/${id}`)));
    await set(ref(database, userPath('/hardware_commands/schedule_update')), true);
  }, [userPath]);

  const markAlertRead = useCallback(async (alertId) => {
    if (DEMO_MODE) {
      setAlerts((prev) => ({ ...prev, [alertId]: { ...prev[alertId], read: true } }));
      return;
    }
    await update(ref(database, userPath(`/alerts/${alertId}`)), { read: true });
  }, [userPath]);

  const pushAIRule = useCallback(async (rule) => {
    if (DEMO_MODE) {
      setAIRules((prev) => ({ ...prev, [rule.id]: rule }));
      return;
    }
    await set(ref(database, userPath(`/ai_rules/${rule.id}`)), rule);
  }, [userPath]);

  return {
    medicines,
    compartments,
    hardwareStatus: hardwareStatusView,
    doseLogs,
    alerts,
    aiRules,
    loading,
    error,
    lastSync,
    isDemo: DEMO_MODE,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    markAlertRead,
    pushAIRule,
  };
}
