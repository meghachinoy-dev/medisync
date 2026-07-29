import { useState } from 'react';

export default function Login({ login, signup }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isSignup && password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      // On success, onAuthStateChanged swaps this screen out — nothing else to do.
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Medi<span>Sync</span></h1>
          <p>Smart Medicine Dispenser</p>
        </div>

        <div className="auth-title">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </div>
        <div className="auth-subtitle">
          {isSignup
            ? 'Sign up to manage your own medicines and dispenser.'
            : 'Sign in to access your dashboard.'}
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vansh Chinoy"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {error && (
            <div className="error-state" role="alert" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={switchMode}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
