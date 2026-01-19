import { useState, useEffect } from 'react';
import './AdminPage.css';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [tokenMint, setTokenMint] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validationErrors, setValidationErrors] = useState([]);

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/status`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  // Fetch current config
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/config`, {
        headers: {
          'Authorization': `Bearer ${password}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setTokenMint(data.data.tokenMint || '');
        setPublicKey(data.data.publicKey || '');
        // Private key is never sent back for security
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        fetchStatus();
        fetchConfig();
      } else {
        setAuthError('Invalid password');
      }
    } catch (error) {
      setAuthError('Connection error');
    }
  };

  // Validate inputs before submit
  const handleValidate = async () => {
    setValidationErrors([]);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_URL}/api/admin/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          tokenMint: tokenMint || undefined,
          privateKey: privateKey || undefined,
          publicKey: publicKey || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'All values are valid!' });

        // Auto-fill public key if derived from private key
        if (data.data.privateKey?.derivedPublicKey && !publicKey) {
          setPublicKey(data.data.privateKey.derivedPublicKey);
        }
      } else {
        setValidationErrors(data.errors || ['Validation failed']);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Validation request failed' });
    }
  };

  // Apply configuration
  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setValidationErrors([]);

    try {
      const res = await fetch(`${API_URL}/api/admin/update-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${password}`,
        },
        body: JSON.stringify({
          tokenMint: tokenMint || undefined,
          privateKey: privateKey || undefined,
          publicKey: publicKey || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Configuration updated! Now monitoring: ${data.data.tokenMint || 'Demo mode'}`
        });
        setPrivateKey(''); // Clear private key after successful update
        fetchStatus();
        fetchConfig();
      } else {
        setValidationErrors(data.errors || [data.error || 'Update failed']);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update configuration' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh status
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, password]);

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="admin-login-card">
            <h1>BUYMAX Admin</h1>
            <p>Enter your admin password to continue</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="password">Admin Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
              </div>

              {authError && <div className="error-message">{authError}</div>}

              <button type="submit" className="btn-primary">
                Login
              </button>
            </form>

            <a href="/" className="back-link">Back to BUYMAX</a>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <h1>BUYMAX Admin Panel</h1>
          <a href="/" className="back-link">Back to Game</a>
        </header>

        {/* Status Cards */}
        <div className="status-grid">
          <div className="status-card">
            <h3>Monitoring Status</h3>
            <div className={`status-indicator ${status?.monitoring?.isMonitoring ? 'active' : 'inactive'}`}>
              {status?.monitoring?.isMonitoring ? 'ACTIVE' : 'INACTIVE'}
            </div>
            <p className="status-detail">
              {status?.monitoring?.isDemo ? 'Demo Mode' : (status?.monitoring?.currentTokenMint ? `Token: ${status.monitoring.currentTokenMint.slice(0, 8)}...` : 'Not configured')}
            </p>
          </div>

          <div className="status-card">
            <h3>Dev Wallet</h3>
            <div className="status-value">
              {status?.devWallet?.balance?.toFixed(4) || '0.0000'} SOL
            </div>
            <p className="status-detail">
              {status?.devWallet?.publicKey ? `${status.devWallet.publicKey.slice(0, 8)}...${status.devWallet.publicKey.slice(-6)}` : 'Not configured'}
            </p>
          </div>

          <div className="status-card">
            <h3>Configuration</h3>
            <div className={`status-indicator ${status?.config?.isComplete ? 'active' : 'warning'}`}>
              {status?.config?.isComplete ? 'COMPLETE' : 'INCOMPLETE'}
            </div>
            <p className="status-detail">
              Last updated: {status?.config?.updatedAt ? new Date(status.config.updatedAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="config-section">
          <h2>Quick Configuration</h2>
          <p className="section-subtitle">Change token in less than 30 seconds - no server restart required!</p>

          <form onSubmit={handleApply}>
            <div className="form-group">
              <label htmlFor="tokenMint">
                Token Mint Address
                <span className="label-hint">The pump.fun token to monitor</span>
              </label>
              <input
                type="text"
                id="tokenMint"
                value={tokenMint}
                onChange={(e) => setTokenMint(e.target.value)}
                placeholder="e.g., So11111111111111111111111111111111111111112"
              />
            </div>

            <div className="form-group">
              <label htmlFor="privateKey">
                Dev Wallet Private Key
                <span className="label-hint">Base58 encoded - for sending rewards</span>
              </label>
              <input
                type="password"
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter new private key (leave empty to keep current)"
              />
              {status?.config?.devWallet?.isConfigured && !privateKey && (
                <span className="field-status success">Current key is configured</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="publicKey">
                Dev Wallet Public Key
                <span className="label-hint">Will be auto-derived if private key is provided</span>
              </label>
              <input
                type="text"
                id="publicKey"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              />
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                {validationErrors.map((error, index) => (
                  <div key={index} className="error-item">{error}</div>
                ))}
              </div>
            )}

            {/* Success/Error message */}
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleValidate}
              >
                Validate
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Applying...' : 'Apply & Restart Monitoring'}
              </button>
            </div>
          </form>
        </div>

        {/* Game Settings (Read-only) */}
        <div className="config-section readonly">
          <h2>Game Settings</h2>
          <p className="section-subtitle">These settings are configured via environment variables</p>

          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Round Duration</span>
              <span className="setting-value">{(status?.game?.roundDurationMs / 1000 / 60) || 15} minutes</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Reward Percentage</span>
              <span className="setting-value">{status?.game?.rewardPercentage || 5}%</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Min Reward</span>
              <span className="setting-value">{status?.game?.minRewardSol || 0.001} SOL</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <h3>Security Notice</h3>
          <ul>
            <li>Private keys are never logged or exposed in responses</li>
            <li>Configuration is stored in a local JSON file (not in environment)</li>
            <li>Always use a dedicated wallet for dev payouts</li>
            <li>Change the admin password in production (ADMIN_PASSWORD env var)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
