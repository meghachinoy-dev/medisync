import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MedicineManager from './components/MedicineManager';
import Schedule from './components/Schedule';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import HardwareMonitor from './components/HardwareMonitor';
import NotificationPanel from './components/NotificationPanel';
import { useFirebaseData } from './hooks/useFirebase';
import { useSchedule } from './hooks/useSchedule';
import { useAIEngine } from './hooks/useAIEngine';

function LoadingScreen() {
  return (
    <div className="loading-state" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" />
      <div>Connecting to MediSync…</div>
    </div>
  );
}

export default function App() {
  const {
    medicines, compartments, hardwareStatus, doseLogs,
    alerts, aiRules, loading, error, lastSync, isDemo,
    addMedicine, updateMedicine, deleteMedicine, markAlertRead, pushAIRule,
  } = useFirebaseData();

  const { todaySchedule, weekSchedule } = useSchedule(medicines, doseLogs, aiRules);
  const { insights, adaptiveRules } = useAIEngine(doseLogs, medicines, compartments, pushAIRule);

  const unreadAlerts = Object.values(alerts).filter((a) => !a.read).length;

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="app-shell" style={{ padding: 40 }}>
        <div className="error-state">
          Firebase connection error: {error}. Check your .env file and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        isDemo={isDemo}
        hardwareStatus={hardwareStatus}
        alertCount={unreadAlerts}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                todaySchedule={todaySchedule}
                doseLogs={doseLogs}
                medicines={medicines}
                hardwareStatus={hardwareStatus}
                lastSync={lastSync}
                isDemo={isDemo}
              />
            }
          />
          <Route
            path="/medicines"
            element={
              <MedicineManager
                medicines={medicines}
                addMedicine={addMedicine}
                updateMedicine={updateMedicine}
                deleteMedicine={deleteMedicine}
              />
            }
          />
          <Route
            path="/schedule"
            element={<Schedule medicines={medicines} weekSchedule={weekSchedule} />}
          />
          <Route
            path="/analytics"
            element={<Analytics doseLogs={doseLogs} medicines={medicines} />}
          />
          <Route
            path="/ai-insights"
            element={
              <AIInsights
                insights={insights}
                adaptiveRules={adaptiveRules}
                aiRules={aiRules}
              />
            }
          />
          <Route
            path="/hardware"
            element={
              <HardwareMonitor
                hardwareStatus={hardwareStatus}
                compartments={compartments}
                medicines={medicines}
                isDemo={isDemo}
              />
            }
          />
          <Route
            path="/notifications"
            element={
              <NotificationPanel
                alerts={alerts}
                markAlertRead={markAlertRead}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
