import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, Zap, X, ShieldCheck, ArrowDownCircle, FileArchive } from 'lucide-react';

export const AndroidSetupGuide = ({ isOpen, onClose, user }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedTab, setSelectedTab] = useState('app');

  if (!isOpen) return null;

  const serverWebhookUrl = `https://notify-uvff.onrender.com/api/calls/event`;
  const userApiKey = user?.apiKey || 'YOUR_USER_API_KEY';

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const samplePayload = `{
  "number": "+15552345678",
  "name": "Sarah Jenkins",
  "state": "RINGING",
  "device": "Android Phone",
  "apiKey": "${userApiKey}"
}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={20} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              CallNotify Android Mobile Setup
            </span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Method Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            <button
              className={`btn ${selectedTab === 'app' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSelectedTab('app')}
            >
              <Smartphone size={16} />
              <span>Native Android APK App</span>
            </button>
            <button
              className={`btn ${selectedTab === 'macrodroid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSelectedTab('macrodroid')}
            >
              <Zap size={16} />
              <span>Webhook / MacroDroid</span>
            </button>
          </div>

          {selectedTab === 'app' ? (
            <div>
              {/* Direct Download Callout Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(29, 78, 216, 0.04))',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  📱 Download CallNotify Mobile App
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Install directly on any Android 8.0+ smartphone to auto-forward incoming and live phone calls.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="/app-debug.apk"
                    download="CallNotify.apk"
                    className="btn btn-primary"
                    style={{ padding: '9px 18px', fontSize: '0.88rem', textDecoration: 'none', gap: '8px' }}
                  >
                    <ArrowDownCircle size={16} />
                    <span>Download APK Directly (.apk)</span>
                  </a>

                  <a
                    href="/CallNotifier-Android-App.zip"
                    download="CallNotifier-Android-App.zip"
                    className="btn btn-secondary"
                    style={{ padding: '9px 14px', fontSize: '0.85rem', textDecoration: 'none', gap: '6px' }}
                  >
                    <FileArchive size={15} />
                    <span>Download ZIP (.zip)</span>
                  </a>
                </div>
              </div>

              {/* 3 Step Setup Guide */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Install APK on your Phone</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Download the APK on your phone, tap Install, and allow installation if prompted.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Sign In with Web Account</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Enter your email (<code>{user?.email || 'your-email'}</code>) and password. Cloud server URL is already pre-configured.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Grant Permissions & Start</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Tap "Allow" for Phone Call & Contact permissions. The background service will stay active and forward live calls in real-time!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                If you prefer using <strong>MacroDroid</strong>, <strong>Tasker</strong>, or custom webhooks:
              </p>

              {/* User API Key Box */}
              <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Your Personal API Key:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {userApiKey}
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  onClick={() => copyToClipboard(userApiKey, 'key')}
                >
                  {copiedKey ? <Check size={13} style={{ color: 'var(--accent-green)' }} /> : <Copy size={13} />}
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>1. Trigger:</strong> Call State ➔ Incoming Call (Any Number)</div>
                <div><strong>2. Action:</strong> HTTP Request ➔ POST</div>
                <div><strong>3. Webhook URL:</strong> <code>{serverWebhookUrl}</code></div>
                <div>
                  <strong>4. Request Body (JSON):</strong>
                  <div className="code-block" style={{ marginTop: '4px', fontSize: '0.75rem' }}>
                    <pre style={{ margin: 0 }}>{samplePayload}</pre>
                    <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(samplePayload, 'json')} style={{ color: '#fff' }}>
                      {copiedJson ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
