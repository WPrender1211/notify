import React, { useState, useEffect } from 'react';
import { PhoneIncoming, Bell, BellOff, Volume2, VolumeX, Play, Smartphone, X, FileText, Check, LogOut, Copy } from 'lucide-react';

export const Header = ({
  user,
  onLogout,
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
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {activeCall.number}
                    </div>
                    {activeCall.company && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 600 }}>
                        🏢 {activeCall.company} {activeCall.tag && `• ${activeCall.tag}`}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowCallPopover(false)}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', fontSize: '0.78rem' }}>
                  <span className="tag-badge">Device: {activeCall.device || 'Android'}</span>
                  <span className="tag-badge" style={{ color: 'var(--accent-green)', borderColor: 'rgba(16,185,129,0.3)', background: 'var(--accent-green-light)' }}>
                    ⏱️ Active: {callTimer}
                  </span>
                  {isMuted && (
                    <span className="tag-badge" style={{ color: 'var(--accent-rose)', borderColor: 'rgba(225,29,72,0.3)', background: 'var(--accent-rose-light)' }}>
                      🔕 Muted
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Quick Note during call</label>
                  <textarea
                    className="form-textarea"
                    placeholder="E.g., Client requested follow up on invoice tomorrow..."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleSaveQuickNote}>
                    {noteSaved ? <><Check size={14} /> Saved</> : <><FileText size={14} /> Save Note</>}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="standby-pill">
            <div className="standby-dot" style={{ background: isMuted ? 'var(--accent-rose)' : 'var(--accent-green)', boxShadow: isMuted ? '0 0 6px rgba(225,29,72,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }} />
            <span>
              {isMuted ? 'Notifications Muted' : `Listening for ${user?.name?.split(' ')[0] || 'your'} calls`}
            </span>
            <div className="pill-divider" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isConnected ? 'Real-Time Connected' : 'Connecting...'}
            </span>
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* MUTE / UNMUTE NOTIFICATION BUTTON */}
        <button
          className={`btn ${isMuted ? 'btn-danger' : 'btn-secondary'}`}
          onClick={onToggleMute}
          title={isMuted ? 'Notifications are currently MUTED (OFF). Click to Unmute.' : 'Notifications are ACTIVE (ON). Click to Mute.'}
          style={{ fontWeight: 600 }}
        >
          {isMuted ? (
            <>
              <VolumeX size={15} style={{ color: 'var(--accent-rose)' }} />
              <span>Muted (Off)</span>
            </>
          ) : (
            <>
              <Volume2 size={15} style={{ color: 'var(--accent-cyan)' }} />
              <span>Alerts (On)</span>
            </>
          )}
        </button>

        {/* Browser Push Permission Toggle */}
        <button
          className={`btn ${pushEnabled ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={onTogglePush}
          title={pushEnabled ? 'Browser Desktop Push: Enabled' : 'Enable Browser Desktop Push'}
        >
          {pushEnabled ? <Bell size={16} style={{ color: 'var(--accent-cyan)' }} /> : <BellOff size={16} />}
        </button>

        {/* Test Simulator Button */}
        <button className="btn btn-secondary" onClick={onOpenSimulator} title="Simulate a test call for this user">
          <Play size={14} style={{ color: 'var(--accent-green)' }} />
          <span>Simulate</span>
        </button>

        {/* Android Guide Button */}
        <button className="btn btn-secondary" onClick={onOpenAndroidGuide} title="Android Phone & Webhook Setup">
          <Smartphone size={15} style={{ color: 'var(--accent-cyan)' }} />
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
