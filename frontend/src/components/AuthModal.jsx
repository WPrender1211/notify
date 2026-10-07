import React, { useState } from 'react';
import { PhoneIncoming, Lock, Mail, User, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '../config';

export const AuthModal = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBase = getApiBaseUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = `${apiBase}${isRegister ? '/api/auth/register' : '/api/auth/login'}`;
    const payload = isRegister
      ? { name, email, password, securityKey }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Server connection error. Please try again in a moment.');
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
            marginBottom: '12px'
          }}>
            <PhoneIncoming size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            CallNotify Hub
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-User Real-Time Phone Notification Platform
          </p>
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-tertiary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className={`btn ${!isRegister ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '7px', fontSize: '0.82rem' }}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn ${isRegister ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, padding: '7px', fontSize: '0.82rem' }}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--accent-rose-light)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--accent-rose)',
            fontSize: '0.8rem',
            marginBottom: '16px',
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  className="input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. Yash Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                className="input"
                style={{ paddingLeft: '36px' }}
                placeholder="yash@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: isRegister ? '14px' : '20px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="input"
                style={{ paddingLeft: '36px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Admin Registration Security Key */}
          {isRegister && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Admin Security Key</span>
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  className="input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Enter master registration key"
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Required for new account authorization.
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
            disabled={loading}
          >
            <span>{loading ? 'Authenticating...' : (isRegister ? 'Create My Account' : 'Sign In to Dashboard')}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
