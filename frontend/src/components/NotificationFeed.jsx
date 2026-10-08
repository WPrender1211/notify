import React, { useState } from 'react';
import {
  Search, Trash2, Bell, MessageSquare, Car, ShoppingBag, Mail,
  Smartphone, Copy, Check, Filter, ExternalLink, ShieldCheck, Clock
} from 'lucide-react';

export const NotificationFeed = ({
  notifications,
  onDeleteNotification,
  onClearNotifications,
  onOpenAppRules
}) => {
  const [selectedApp, setSelectedApp] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // App Categories & Brand Colors
  const getAppMeta = (packageName = '', appName = '') => {
    const pkg = packageName.toLowerCase();
    const name = appName.toLowerCase();

    if (pkg.includes('whatsapp') || name.includes('whatsapp')) {
      return { label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.12)', icon: '🟢' };
    }
    if (pkg.includes('instagram') || name.includes('instagram')) {
      return { label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.12)', icon: '🟣' };
    }
    if (pkg.includes('uber') || name.includes('uber') || pkg.includes('olacabs') || pkg.includes('rapido')) {
      return { label: 'Ride / Uber', color: '#000000', bg: 'rgba(0,0,0,0.08)', icon: '🚗' };
    }
    if (pkg.includes('swiggy') || pkg.includes('zomato') || pkg.includes('zepto') || pkg.includes('blinkit')) {
      return { label: 'Food & Groceries', color: '#FC8019', bg: 'rgba(252,128,25,0.12)', icon: '🍔' };
    }
    if (pkg.includes('telegram') || name.includes('telegram')) {
      return { label: 'Telegram', color: '#229ED9', bg: 'rgba(34,158,217,0.12)', icon: '✈️' };
    }
    if (pkg.includes('messaging') || pkg.includes('mms') || pkg.includes('sms') || name.includes('message')) {
      return { label: 'SMS / OTP', color: '#2563EB', bg: 'rgba(37,99,235,0.12)', icon: '💬' };
    }
    if (pkg.includes('gm') || pkg.includes('mail') || name.includes('mail')) {
      return { label: 'Email', color: '#EA4335', bg: 'rgba(234,67,53,0.12)', icon: '✉️' };
    }

    return { label: appName || 'App', color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: '📱' };
  };

  const uniqueApps = Array.from(new Set(notifications.map(n => n.appName || 'App')));

  const filteredNotifications = notifications.filter((notif) => {
    const matchesApp = selectedApp === 'ALL' || notif.appName === selectedApp;
    const matchesSearch =
      (notif.appName && notif.appName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (notif.title && notif.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (notif.text && notif.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (notif.subText && notif.subText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesApp && matchesSearch;
  });

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="section-container glass-card">
      {/* Top Controls */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input input-search"
            placeholder="Search notifications, messages, OTPs, or apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <button
            className="btn btn-ghost"
            onClick={onOpenAppRules}
            style={{ color: 'var(--accent-primary)', fontWeight: 600, gap: '6px' }}
          >
            <Filter size={15} />
            <span>🎛️ App Filter Rules</span>
          </button>

          {notifications.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (window.confirm('Clear all app notifications for your account?')) {
                  onClearNotifications();
                }
              }}
              title="Clear all notifications"
            >
              <Trash2 size={15} style={{ color: 'var(--accent-rose)' }} />
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick App Category Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <button
          className={`filter-btn ${selectedApp === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedApp('ALL')}
        >
          All Apps ({notifications.length})
        </button>
        {uniqueApps.map((app) => (
          <button
            key={app}
            className={`filter-btn ${selectedApp === app ? 'active' : ''}`}
            onClick={() => setSelectedApp(app)}
          >
            {getAppMeta('', app).icon} {app}
          </button>
        ))}
      </div>

      {/* Notifications Cards Stream */}
      {filteredNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text-muted)' }}>
          <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No app notifications yet
          </div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px', maxWidth: '400px', margin: '6px auto 0' }}>
            Notifications from WhatsApp, Instagram, Uber, SMS, and other apps on your phone will automatically appear here in real-time.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => {
            const meta = getAppMeta(notif.packageName, notif.appName);
            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: meta.bg,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {notif.appName || 'App'}
                      </span>
                      {notif.subText && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {notif.subText}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatDate(notif.timestamp)}
                      </span>
                    </div>

                    {notif.title && (
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {notif.title}
                      </div>
                    )}

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {notif.text}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginLeft: '14px', alignItems: 'center' }}>
                  {notif.text && (
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleCopyText(notif.id, notif.text)}
                      title="Copy notification text / OTP"
                      style={{ padding: '6px' }}
                    >
                      {copiedId === notif.id ? <Check size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={14} />}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => onDeleteNotification(notif.id)}
                    title="Delete log"
                    style={{ padding: '6px', color: 'var(--accent-rose)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
