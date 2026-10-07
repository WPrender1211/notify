import React, { useState } from 'react';
import { Smartphone, Copy, Check, Zap, Wifi, X, Key, ShieldCheck } from 'lucide-react';

export const AndroidSetupGuide = ({ isOpen, onClose, localIps, port, user }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [selectedTab, setSelectedTab] = useState('app');

  if (!isOpen) return null;

  const defaultIp = localIps && localIps.length > 0 ? localIps[0].ip : 'YOUR_COMPUTER_IP';
  const serverWebhookUrl = `http://${defaultIp}:${port || 5000}/api/calls/event`;
  const userApiKey = user?.apiKey || 'YOUR_USER_API_KEY';

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'key') {
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
            <Smartphone size={19} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Connect Android Device for {user?.name || 'Your Account'}
            </span>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* User Specific API Key Pill */}
          <div style={{
            background: 'var(--accent-primary-light)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-primary)', fontWeight: 700 }}>
                🔑 Your Personal Device API Key:
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {userApiKey}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              onClick={() => copyToClipboard(userApiKey, 'key')}
            >
              {copiedKey ? <><Check size={14} style={{ color: 'var(--accent-green)' }} /> Copied</> : <><Copy size={14} /> Copy Key</>}
            </button>
          </div>

          {/* Method Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              className={`btn ${selectedTab === 'app' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSelectedTab('app')}
            >
              <Smartphone size={16} />
              <span>Native Android App</span>
            </button>
            <button
              className={`btn ${selectedTab === 'macrodroid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setSelectedTab('macrodroid')}
            >
              <Zap size={16} />
              <span>MacroDroid / Webhook</span>
            </button>
          </div>

          {selectedTab === 'app' ? (
            <div>
              <ol style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li>
                  <strong>Install the Android Companion App</strong> from the APK generated in the <code>android-app/</code> folder.
                </li>
                <li>
                  Open the app and grant <strong>Phone State & Contact Permissions</strong>.
                </li>
                <li>
                  In the app's <strong>Server URL</strong> field, enter your endpoint:
                  <div className="code-block" style={{ marginTop: '6px' }}>
                    <span>{serverWebhookUrl}</span>
                    <button className="btn btn-ghost btn-icon" onClick={() => copyToClipboard(serverWebhookUrl, 'url')} style={{ color: '#fff' }}>
                      {copiedUrl ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </li>
                <li>
                  Enter your <strong>Personal Device API Key</strong> from above and tap <strong>"Start Background Service"</strong>.
                </li>
              </ol>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Use <strong>MacroDroid</strong> or <strong>Tasker</strong> to forward incoming phone calls to this server:
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>1. Trigger:</strong> Call State ➔ Incoming Call (Any Number)</div>
                <div><strong>2. Action:</strong> HTTP Request ➔ POST</div>
                <div><strong>3. URL:</strong> <code>{serverWebhookUrl}</code></div>
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
