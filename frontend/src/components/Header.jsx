import React, { useState, useEffect } from 'react';
import { PhoneIncoming, Bell, BellOff, Volume2, VolumeX, Play, Smartphone, X, FileText, Check, LogOut, Copy, EyeOff, MonitorDown } from 'lucide-react';

export const Header = ({
  user,
  onLogout,
  onHideDashboard,
  activeCall,
  isConnected,
  onOpenSimulator,
  onOpenAndroidGuide,
  pushEnabled,
  onTogglePush,
  isMuted,
  onToggleMute,
  onUpdateCallNotes
}) => {
  const [showCallPopover, setShowCallPopover] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [callTimer, setCallTimer] = useState('00:00');
  const [quickNote, setQuickNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Live timer for active call
  useEffect(() => {
    if (!activeCall) {
      setCallTimer('00:00');
      setShowCallPopover(false);
      return;
    }

    setQuickNote(activeCall.notes || '');

    const startTime = activeCall.timestamp ? new Date(activeCall.timestamp).getTime() : Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
      const secs = String(elapsedSeconds % 60).padStart(2, '0');
      setCallTimer(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCall]);

  const handleSaveQuickNote = () => {
    if (activeCall && onUpdateCallNotes) {
      onUpdateCallNotes(activeCall.id, quickNote);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <header className="header-nav">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <PhoneIncoming size={19} />
        </div>
        <div>
          <span className="brand-title">CallNotify</span>
          <span className="brand-badge">Multi-User</span>
        </div>
      </div>

      {/* Center Slot: Compact Top Navigation Bar Live Call Indicator */}
      <div className="nav-center-slot" style={{ position: 'relative' }}>
        {activeCall ? (
          <>
            <div
              className={`live-call-pill ${activeCall.state === 'ANSWERED' ? 'answered' : ''}`}
              onClick={() => setShowCallPopover(!showCallPopover)}
              title="Click to view details or add quick note"
            >
              <div className="pill-dot" />
              <span className="pill-label">
                {activeCall.state === 'RINGING' ? (isMuted ? 'Incoming (Muted)' : 'Incoming') : 'In Call'}
              </span>
              <div className="pill-divider" />
              <span className="pill-caller">{activeCall.name || 'Unknown Caller'}</span>
              <span className="pill-number">({activeCall.number})</span>
              <span className="pill-timer">{callTimer}</span>
            </div>

            {/* Quick Popover Dropdown */}
            {showCallPopover && (
              <div className="call-popover-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {activeCall.name || 'Unknown Caller'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {activeCall.number}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setShowCallPopover(false)}
                    style={{ padding: '4px' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Device: <strong style={{ color: 'var(--text-secondary)' }}>{activeCall.device || 'Android Phone'}</strong>
                </div>

                {/* Quick Note Input */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Quick Call Note
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="input"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', flex: 1 }}
                      placeholder="e.g., Client confirmed 3 PM meeting..."
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveQuickNote();
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={handleSaveQuickNote}
                    >
                      {noteSaved ? <Check size={14} /> : <FileText size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="status-badge connected">
            <div className="status-dot connected" />
            <span>Listening for <strong>{user?.name?.split(' ')[0] || 'your'}</strong> calls</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-Time Connected</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Stealth 404 Screen Button */}
        <button
          className="btn btn-ghost"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            gap: '6px'
          }}
          onClick={onHideDashboard}
          title="Instantly disguise dashboard as a 404 Error Page (Unhide: Ctrl+Y -> Alt+S)"
        >
          <EyeOff size={15} style={{ color: 'var(--accent-rose)' }} />
          <span>Stealth (404)</span>
        </button>

        {/* Windows Tray App Download Button */}
        <a
          href="/CallNotify-Tray-Companion.bat"
          download="CallNotify-Tray-Companion.bat"
          className="btn btn-ghost"
          style={{ textDecoration: 'none', color: 'inherit' }}
          title="Download Windows Taskbar Tray App (Single file - No installation needed)"
        >
          <MonitorDown size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Windows Tray App</span>
        </a>

        {/* Audio Mute Toggle */}
        <button
          className={`btn ${isMuted ? 'btn-danger' : 'btn-ghost'}`}
          onClick={onToggleMute}
          title={isMuted ? 'Audio alerts are muted (Click to unmute)' : 'Audio alerts are active (Click to mute)'}
          style={{ padding: '6px 10px' }}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span style={{ fontSize: '0.8rem' }}>{isMuted ? 'Muted' : 'Alerts (On)'}</span>
        </button>

        {/* Browser Push Toggle */}
        <button
          className={`btn ${pushEnabled ? 'btn-ghost' : 'btn-ghost'}`}
          onClick={onTogglePush}
          title={pushEnabled ? 'Push notifications active' : 'Enable browser background push'}
          style={{ padding: '6px 10px' }}
        >
          {pushEnabled ? <Bell size={15} style={{ color: 'var(--accent-primary)' }} /> : <BellOff size={15} />}
        </button>

        {/* Simulator Button */}
        <button className="btn btn-ghost" onClick={onOpenSimulator} title="Simulate incoming & answered calls">
          <Play size={14} />
          <span>Simulate</span>
        </button>

        {/* Android App Button */}
        <button className="btn btn-ghost" onClick={onOpenAndroidGuide} title="Android mobile setup instructions">
          <Smartphone size={14} />
          <span>Android App</span>
        </button>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', gap: '8px' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600 }}>{user?.name?.split(' ')[0] || 'User'}</span>
          </button>

          {showUserMenu && (
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '270px',
                padding: '16px',
                zIndex: 100,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                background: '#ffffff'
              }}
            >
              <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Your Phone API Token:
                </div>
                <div className="code-block" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                    {user?.apiKey}
                  </span>
                  <button className="btn btn-ghost btn-icon" onClick={copyApiKey} title="Copy API Key" style={{ color: '#fff', padding: '3px' }}>
                    {copiedKey ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Download Tray App in Menu */}
              <a
                href="/CallNotify-Tray-Companion.bat"
                download="CallNotify-Tray-Companion.bat"
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start', color: 'var(--text-secondary)', textDecoration: 'none' }}
                title="Download Windows Tray Companion"
              >
                <MonitorDown size={14} style={{ color: 'var(--accent-primary)' }} />
                <span>Download Windows Tray App</span>
              </a>

              {/* Hide to 404 Option in Menu */}
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginBottom: '8px', justifyContent: 'flex-start', color: 'var(--text-secondary)' }}
                onClick={() => {
                  setShowUserMenu(false);
                  onHideDashboard();
                }}
              >
                <EyeOff size={14} style={{ color: 'var(--accent-rose)' }} />
                <span>Hide as 404 (Stealth)</span>
              </button>

              <button
                className="btn btn-danger"
                style={{ width: '100%', padding: '8px 10px', fontSize: '0.82rem' }}
                onClick={onLogout}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
