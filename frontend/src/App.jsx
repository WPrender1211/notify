import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { CallHistory } from './components/CallHistory';
import { ContactsManager } from './components/ContactsManager';
import { SimulatorModal } from './components/SimulatorModal';
import { AndroidSetupGuide } from './components/AndroidSetupGuide';
import { Stealth404Screen } from './components/Stealth404Screen';
import { Phone, Users } from 'lucide-react';
import { getApiBaseUrl } from './config';

export function App() {
  const apiBase = getApiBaseUrl();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('call_notify_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('call_notify_token') || null);

  const [show404Screen, setShow404Screen] = useState(!user || !token);
  const [activeTab, setActiveTab] = useState('history');
  const [calls, setCalls] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ total: 0, todayCount: 0, missed: 0, answered: 0 });
  const [serverSettings, setServerSettings] = useState({ localIps: [], port: 5000 });
  const [isConnected, setIsConnected] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('call_notify_muted') === 'true');

  // Modals
  const [showSimulator, setShowSimulator] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  const handleToggleMute = async () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    localStorage.setItem('call_notify_muted', String(nextVal));
    try {
      await authFetch('/api/tray/toggle-mute', {
        method: 'POST',
        body: JSON.stringify({ isMuted: nextVal })
      });
    } catch (e) {}
  };

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setShow404Screen(false);
    localStorage.setItem('call_notify_user', JSON.stringify(userData));
    localStorage.setItem('call_notify_token', userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setShow404Screen(true);
    setCalls([]);
    setActiveCall(null);
    setContacts([]);
    localStorage.removeItem('call_notify_user');
    localStorage.removeItem('call_notify_token');
  };

  // Automated Daily Auto-Logout at 10:40 PM IST (22:40 IST)
  useEffect(() => {
    if (!token) return;

    const checkDailyAutoLogout = () => {
      try {
        const now = new Date();
        const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istString);
        const hours = istDate.getHours();
        const minutes = istDate.getMinutes();

        // If current time is 10:40 PM IST (22:40), perform scheduled auto-logout & lock to 404
        if (hours === 22 && minutes === 40) {
          console.log('⏰ 10:40 PM IST reached: Daily auto-logout triggered.');
          handleLogout();
        }
      } catch (err) {}
    };

    checkDailyAutoLogout();
    const interval = setInterval(checkDailyAutoLogout, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [token]);

  // Authenticated fetch helper (with persistent session protection)
  const authFetch = useCallback(async (url, options = {}) => {
    if (!token) return null;
    const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    };
    try {
      const res = await fetch(fullUrl, { ...options, headers });
      if (!res.ok) {
        return null;
      }
      return res.json();
    } catch (err) {
      console.warn('Network fetch warning:', err.message);
      return null;
    }
  }, [token, apiBase]);

  // Fetch initial data for logged in user
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [callsRes, contactsRes, statsRes, settingsRes] = await Promise.all([
        authFetch('/api/calls'),
        authFetch('/api/contacts'),
        authFetch('/api/calls/stats'),
        authFetch('/api/settings')
      ]);

      if (callsRes?.calls) setCalls(callsRes.calls);
      if (callsRes?.activeCall) setActiveCall(callsRes.activeCall);
      if (contactsRes?.contacts) setContacts(contactsRes.contacts);
      if (statsRes) setStats(statsRes);
      if (settingsRes) setServerSettings(settingsRes);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  }, [token, authFetch]);

  // Stable, Long-Lived Real-Time Socket Connection
  useEffect(() => {
    if (!token) return;

    fetchData();

    // Authenticated Socket.io connection scoped to user room (supports remote Render server)
    const socket = io(apiBase || undefined, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Real-time socket connected for user:', user?.name);
    });

    socket.on('disconnect', (reason) => {
      console.log('Real-time socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    socket.on('call:event', ({ event, call }) => {
      console.log('User call event:', event, call);

      if (event === 'RINGING' || event === 'ANSWERED') {
        setActiveCall(call);
      } else if (event === 'ENDED' || event === 'MISSED' || event === 'REJECTED') {
        setActiveCall(null);
      }

      // Trigger instant native desktop notification if tab is minimized, hidden, or unfocused (and not muted)
      const currentMuted = localStorage.getItem('call_notify_muted') === 'true';
      const isTabBackgrounded = document.visibilityState === 'hidden' || !document.hasFocus();

      if (!currentMuted && isTabBackgrounded && Notification.permission === 'granted') {
        const title = event === 'RINGING'
          ? `Incoming: ${call.name || 'Unknown Caller'}`
          : (event === 'MISSED' ? `Missed: ${call.name || 'Unknown Caller'}` : null);

        if (title) {
          const body = `${call.number} ${call.company ? `(${call.company})` : ''}`.trim();
          const options = {
            body: body,
            tag: 'active-call-alert',
            renotify: true,
            requireInteraction: event === 'RINGING'
          };

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              reg.showNotification(title, options);
            }).catch(() => {
              try { new Notification(title, options); } catch (e) {}
            });
          } else {
            try { new Notification(title, options); } catch (e) {}
          }
        }
      }

      setCalls((prev) => {
        const index = prev.findIndex(c => c.id === call.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = call;
          return updated;
        }
        return [call, ...prev];
      });

      authFetch('/api/calls/stats').then(s => s && setStats(s)).catch(() => {});
    });

    socket.on('tray:mute-changed', ({ isMuted: remoteMuted }) => {
      setIsMuted(remoteMuted);
      localStorage.setItem('call_notify_muted', String(remoteMuted));
    });

    socket.on('call:updated', (updatedCall) => {
      setCalls((prev) => prev.map(c => c.id === updatedCall.id ? updatedCall : c));
      setActiveCall((prev) => (prev && prev.id === updatedCall.id ? updatedCall : prev));
    });

    socket.on('call:deleted', ({ id }) => {
      setCalls((prev) => prev.filter(c => c.id !== id));
      setActiveCall((prev) => (prev && prev.id === id ? null : prev));
    });

    socket.on('call:cleared', () => {
      setCalls([]);
      setActiveCall(null);
    });

    socket.on('contact:created', (newContact) => {
      setContacts((prev) => [newContact, ...prev]);
    });

    socket.on('contact:updated', (updatedContact) => {
      setContacts((prev) => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    });

    socket.on('contact:deleted', ({ id }) => {
      setContacts((prev) => prev.filter(c => c.id !== id));
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      socket.disconnect();
    };
  }, [token]);

  // Push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      }
    }
  }, []);

  const handleTogglePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Browser Push Notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission was denied in browser settings.');
        return;
      }
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch(`${apiBase}/api/push/public-key`).then(r => r.json());

      const rawKey = window.atob(keyRes.publicKey.replace(/-/g, '+').replace(/_/g, '/'));
      const outputArray = new Uint8Array(rawKey.length);
      for (let i = 0; i < rawKey.length; ++i) {
        outputArray[i] = rawKey.charCodeAt(i);
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      await authFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });

      setPushEnabled(true);
      await authFetch('/api/push/test', { method: 'POST' });
    } catch (err) {
      console.error('Error enabling push:', err);
    }
  };

  const handleUpdateNotes = async (callId, notes) => {
    await authFetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
  };

  const handleDeleteCall = async (callId) => {
    await authFetch(`/api/calls/${callId}`, { method: 'DELETE' });
  };

  const handleClearCalls = async () => {
    await authFetch('/api/calls', { method: 'DELETE' });
  };

  const handleAddContact = async (contactData) => {
    await authFetch('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  };

  const handleDeleteContact = async (contactId) => {
    await authFetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
  };

  const handleTriggerSimulation = async (simData) => {
    await authFetch('/api/simulator/trigger', {
      method: 'POST',
      body: JSON.stringify(simData)
    });
  };

  // If 404 Stealth Screen is active, disguise the dashboard immediately (session preserved)
  if (show404Screen) {
    return <Stealth404Screen onUnlock={() => setShow404Screen(false)} />;
  }

  // If not logged in, show Auth Modal
  if (!user || !token) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Header with Multi-User Dropdown and Compact Live Call Indicator */}
      <Header
        user={user}
        onLogout={handleLogout}
        onHideDashboard={() => setShow404Screen(true)}
        activeCall={activeCall}
        isConnected={isConnected}
        onOpenSimulator={() => setShowSimulator(true)}
        onOpenAndroidGuide={() => setShowAndroidGuide(true)}
        pushEnabled={pushEnabled}
        onTogglePush={handleTogglePush}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onUpdateCallNotes={handleUpdateNotes}
      />

      <main className="main-content">
        {/* Navigation Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Phone size={16} />
            <span>Call Feed</span>
            <span className="tab-count">{calls.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            <Users size={16} />
            <span>Contacts Directory</span>
            <span className="tab-count">{contacts.length}</span>
          </button>
        </div>

        {/* Tab 1: Call Feed & Stats */}
        {activeTab === 'history' && (
          <>
            <StatsCards stats={stats} />
            <CallHistory
              calls={calls}
              onUpdateNotes={handleUpdateNotes}
              onDeleteCall={handleDeleteCall}
              onClearCalls={handleClearCalls}
            />
          </>
        )}

        {/* Tab 2: Contacts Directory */}
        {activeTab === 'contacts' && (
          <ContactsManager
            contacts={contacts}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
          />
        )}
      </main>

      {/* Simulator Modal */}
      <SimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        onTriggerSimulation={handleTriggerSimulation}
        activeCall={activeCall}
      />

      {/* Android Setup Guide Modal */}
      <AndroidSetupGuide
        isOpen={showAndroidGuide}
        onClose={() => setShowAndroidGuide(false)}
        localIps={serverSettings.localIps}
        port={serverSettings.port}
        user={user}
      />
    </div>
  );
}

export default App;
