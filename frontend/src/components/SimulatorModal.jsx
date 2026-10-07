import React, { useState, useEffect } from 'react';
import { Play, PhoneIncoming, PhoneMissed, PhoneOff, X, Sparkles, Clock } from 'lucide-react';

export const SimulatorModal = ({ isOpen, onClose, onTriggerSimulation, activeCall }) => {
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      handleSimulate('RINGING');
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSimulate = async (type) => {
    setTriggering(true);
    await onTriggerSimulation({
      type,
      customName: customName || undefined,
      customNumber: customNumber || undefined,
      customCompany: customCompany || undefined
    });
    setTriggering(false);
  };

  const startDelayedSimulation = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    setCountdown(5);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Real-Time Call Simulator
            </span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Minimized Tab Testing Highlight Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary-light), var(--accent-purple-light))',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem', marginBottom: '4px' }}>
              <Clock size={16} />
              <span>Test Minimized / Background Tab Alert</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Click below, then <strong>minimize this browser tab</strong>. In 5 seconds, an incoming alert will pop up on your Windows desktop.
            </p>

            {countdown !== null ? (
              <div style={{
                background: '#ffffff',
                border: '1.5px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  ⏳ {countdown}s
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                  Minimize this browser window now!
                </div>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                onClick={startDelayedSimulation}
              >
                <Clock size={16} />
                <span>Start 5-Second Delay & Test Minimized Tab</span>
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Instant Test Actions:
          </p>

          {/* Instant Preset Simulation Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '10px', flexDirection: 'column', height: 'auto', gap: '4px', textAlign: 'left', alignItems: 'flex-start' }}
              disabled={triggering}
              onClick={() => handleSimulate('AUTO_SEQUENCE')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <Play size={14} style={{ color: 'var(--accent-green)' }} />
                <span>Auto Lifecycle</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Rings (4s) → Answers → Ends
              </span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px', flexDirection: 'column', height: 'auto', gap: '4px', textAlign: 'left', alignItems: 'flex-start' }}
              disabled={triggering}
              onClick={() => handleSimulate('RINGING')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-rose)' }}>
                <PhoneIncoming size={14} />
                <span>Start Ringing</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Rings continuously
              </span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px', flexDirection: 'column', height: 'auto', gap: '4px', textAlign: 'left', alignItems: 'flex-start' }}
              disabled={triggering}
              onClick={() => handleSimulate('MISSED')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-amber)' }}>
                <PhoneMissed size={14} />
                <span>Missed Call</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                Logs instant missed call
              </span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '10px', flexDirection: 'column', height: 'auto', gap: '4px', textAlign: 'left', alignItems: 'flex-start' }}
              disabled={triggering || !activeCall}
              onClick={() => handleSimulate('ENDED')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                <PhoneOff size={14} />
                <span>End Active</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {activeCall ? 'Terminates active call' : 'No active call'}
              </span>
            </button>
          </div>

          {/* Custom Caller Overrides */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Custom Caller (Optional):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Caller Name (e.g. John Doe)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Number (+1 555-0199)"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
              />
            </div>
            <input
              type="text"
              className="input"
              placeholder="Company (e.g. Acme Corp)"
              value={customCompany}
              onChange={(e) => setCustomCompany(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
