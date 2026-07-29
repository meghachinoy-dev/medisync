import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MedicineManager from './components/MedicineManager';
import Schedule from './components/Schedule';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import HardwareMonitor from './components/HardwareMonitor';
import NotificationPanel from './components/NotificationPanel';
import { useAuth } from './hooks/useAuth';
import { useFirebaseData } from './hooks/useFirebase';
import { useSchedule } from './hooks/useSchedule';
import { useAIEngine } from './hooks/useAIEngine';

function LoadingScreen({ label = 'Connecting to MediSync…' }) {
  return (
    <div className="loading-state" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" />
      <div>{label}</div>
    </div>
  );
}

// The full dashboard — only mounted once a user is authenticated, so all the
// data hooks run with a valid uid.
function AuthedApp({ user, logout }) {
  const {
    medicines, compartments, hardwareStatus, doseLogs,
    alerts, aiRules, loading, error, lastSync, isDemo,
    addMedicine, updateMedicine, deleteMedicine, markAlertRead, pushAIRule,
  } = useFirebaseData(user.uid);

  const { todaySchedule, weekSchedule } = useSchedule(medicines, doseLogs, aiRules);
  const { insights, adaptiveRules } = useAIEngine(doseLogs, medicines, compartments, pushAIRule);

  const unreadAlerts = Object.values(alerts).filter((a) => !a.read).length;

  if (loading) return <LoadingScreen />;

  const isPermissionError = typeof error === 'string' && error.toLowerCase().includes('permission');

  return (
    <div className="app-shell">
      <Sidebar
        isDemo={isDemo}
        hardwareStatus={hardwareStatus}
        alertCount={unreadAlerts}
        user={user}
        onLogout={logout}
      />
      <main className="main-content">
        {error && (
          <div className="error-state" role="alert" style={{ margin: '0 0 16px' }}>
            {isPermissionError ? (
              <>
                Firebase denied access ({error}). The database security rules for{' '}
                <code>medisync-120311</code> need to be deployed — run{' '}
                <code>firebase deploy --only database</code>. Showing whatever data loaded.
              </>
            ) : (
              <>Firebase connection error: {error}. Check your <code>.env</code> and network, then retry.</>
            )}
          </div>
        )}
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

export default function App() {
  const { user, authLoading, login, signup, logout } = useAuth();

  if (authLoading) return <LoadingScreen label="Loading…" />;
  if (!user) return <Login login={login} signup={signup} />;

  return <AuthedApp user={user} logout={logout} />;
}
