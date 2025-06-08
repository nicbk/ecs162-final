import React, { useState } from 'react';
import styles from './Register.module.scss';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('✅ Account created successfully! User added to database and synced to Dex.');
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        
        // Wait a bit for Dex to restart, then show next steps
        setTimeout(() => {
          setSuccess('✅ Registration complete! You can now login using the "Login with Dex" button below.');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    window.location.href = `${backendUrl}/login`;
  };

  const checkDebugInfo = async () => {
    try {
      const response = await fetch('/api/v1/debug/sync-test');
      const data = await response.json();
      setDebugInfo(data);
      setShowDebug(true);
    } catch (err) {
      setError('Failed to fetch debug info');
    }
  };

  const forcSync = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/debug/force-sync', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('✅ Force sync completed successfully!');
        // Refresh debug info
        checkDebugInfo();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError('Network error during sync');
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/debug/create-test-user', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`✅ Test user created: ${data.username} / ${data.password}`);
        // Refresh debug info
        checkDebugInfo();
      } else {
        setError(data.error || 'Test user creation failed');
      }
    } catch (err) {
      setError('Network error during test user creation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1>🍴 Foodie</h1>
          <h2>Create Your Account</h2>
          <p>Register once, then login with Dex OAuth</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating Account & Syncing to Dex...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Already have an account?</p>
          <button onClick={goToLogin} className={styles.loginBtn}>
            Login with Dex
          </button>
        </div>

        {/* Debug Section - Remove in production */}
        <div className={styles.debugSection} style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Debug Tools (Development Only)</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
            <button onClick={checkDebugInfo} type="button" style={{ padding: '8px 12px', fontSize: '12px' }}>
              Check Sync Status
            </button>
            <button onClick={forcSync} type="button" style={{ padding: '8px 12px', fontSize: '12px' }} disabled={loading}>
              Force Sync to Dex
            </button>
            <button onClick={createTestUser} type="button" style={{ padding: '8px 12px', fontSize: '12px' }} disabled={loading}>
              Create Test User
            </button>
          </div>
          
          {showDebug && debugInfo && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Information</summary>
              <pre style={{ 
                background: '#fff', 
                padding: '1rem', 
                borderRadius: '4px', 
                overflow: 'auto', 
                fontSize: '11px',
                maxHeight: '300px'
              }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;