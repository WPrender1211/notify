import React, { useState, useEffect } from 'react';
import { X, Check, Filter, Plus, Info, Bell, Globe, Shield, Smartphone } from 'lucide-react';

const PRESET_APPS = [
  { packageName: 'com.whatsapp', appName: 'WhatsApp', icon: '🟢', color: '#25D366' },
  { packageName: 'com.instagram.android', appName: 'Instagram', icon: '🟣', color: '#E1306C' },
  { packageName: 'com.ubercab', appName: 'Uber', icon: '🚗', color: '#000000' },
  { packageName: 'com.olacabs.customer', appName: 'Ola Cabs', icon: '🚖', color: '#D2E603' },
  { packageName: 'in.swiggy.android', appName: 'Swiggy', icon: '🍔', color: '#FC8019' },
  { packageName: 'com.application.zomato', appName: 'Zomato', icon: '🍕', color: '#E23744' },
  { packageName: 'org.telegram.messenger', appName: 'Telegram', icon: '✈️', color: '#229ED9' },
  { packageName: 'com.google.android.apps.messaging', appName: 'SMS / Messages', icon: '💬', color: '#2563EB' },
  { packageName: 'com.google.android.gm', appName: 'Gmail', icon: '✉️', color: '#EA4335' }
];

export const AppRulesModal = ({
  isOpen,
  onClose,
  rules,
  onSaveRule
}) => {
  const [activeRules, setActiveRules] = useState([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customPkg, setCustomPkg] = useState('');
  const [customName, setCustomName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Merge presets with user-defined and auto-discovered rules
    const map = new Map();

    PRESET_APPS.forEach(preset => {
      map.set(preset.packageName, {
        packageName: preset.packageName,
        appName: preset.appName,
        icon: preset.icon,
        color: preset.color,
        logToWeb: true,
        showPopup: true
      });
    });

    rules.forEach(r => {
      const existing = map.get(r.packageName) || {};
      map.set(r.packageName, {
        ...existing,
        packageName: r.packageName,
        appName: r.appName || existing.appName || r.packageName,
        icon: existing.icon || '📱',
        color: existing.color || '#64748B',
        logToWeb: r.logToWeb !== undefined ? r.logToWeb : true,
        showPopup: r.showPopup !== undefined ? r.showPopup : true
      });
    });

    setActiveRules(Array.from(map.values()));
  }, [rules]);

  if (!isOpen) return null;

  const handleToggle = (packageName, field) => {
    const item = activeRules.find(r => r.packageName === packageName);
    if (!item) return;

    const updatedItem = {
      ...item,
      [field]: !item[field]
    };

    onSaveRule(updatedItem.packageName, updatedItem.appName, updatedItem.logToWeb, updatedItem.showPopup);

    setActiveRules(prev => prev.map(r => r.packageName === packageName ? updatedItem : r));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customPkg) return;

    const name = customName.trim() || customPkg.trim();
    onSaveRule(customPkg.trim(), name, true, true);

    setShowAddCustom(false);
    setCustomPkg('');
    setCustomName('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: '640px', background: '#ffffff', borderRadius: 'var(--radius-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                App Notification Filters &amp; Checkboxes
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Customize which apps log quietly to web vs. show desktop popups
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: '16px 20px' }}>
          {/* Explanation Box */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px' }}>
            <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>2-Tier Checkboxes:</strong><br />
              • <strong>🌐 Log to Web Feed:</strong> Saves message to your private web dashboard feed.<br />
              • <strong>🔔 Desktop Popup:</strong> Pops up a Windows desktop toast and rings chime on PC.
            </div>
          </div>

          {/* Table of App Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeRules.map((app) => (
              <div
                key={app.packageName}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{app.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {app.appName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {app.packageName}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Checkbox 1: Log to Web Feed */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: app.logToWeb ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={app.logToWeb}
                      onChange={() => handleToggle(app.packageName, 'logToWeb')}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <span>🌐 Log to Web</span>
                  </label>

                  {/* Checkbox 2: Desktop Popup */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: app.showPopup ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={app.showPopup}
                      onChange={() => handleToggle(app.packageName, 'showPopup')}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <span>🔔 Desktop Popup</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom App Package */}
          {showAddCustom ? (
            <form onSubmit={handleAddCustom} style={{ marginTop: '16px', padding: '14px', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Add Custom Android App
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="App Name (e.g., Slack)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Package (e.g., com.Slack)"
                  value={customPkg}
                  onChange={(e) => setCustomPkg(e.target.value)}
                  required
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddCustom(false)} style={{ fontSize: '0.78rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.78rem' }}>
                  Add App Rule
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => setShowAddCustom(true)}
              style={{ width: '100%', marginTop: '12px', border: '1px dashed var(--border-color)', color: 'var(--accent-primary)', fontSize: '0.82rem', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Add Another Android App Package</span>
            </button>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {savedSuccess && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Rule saved!
              </span>
            )}
          </div>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
