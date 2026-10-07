import React from 'react';
import { Phone, PhoneCall, PhoneIncoming, PhoneMissed } from 'lucide-react';

export const StatsCards = ({ stats }) => {
  const cards = [
    {
      label: "Today's Calls",
      value: stats?.todayCount || 0,
      icon: PhoneIncoming,
      color: 'var(--accent-cyan)',
      bg: 'rgba(56, 189, 248, 0.12)'
    },
    {
      label: 'Answered',
      value: stats?.answered || 0,
      icon: PhoneCall,
      color: 'var(--accent-green)',
      bg: 'rgba(16, 185, 129, 0.12)'
    },
    {
      label: 'Missed Calls',
      value: stats?.missed || 0,
      icon: PhoneMissed,
      color: 'var(--accent-rose)',
      bg: 'rgba(244, 63, 94, 0.12)'
    },
    {
      label: 'Total Logs',
      value: stats?.total || 0,
      icon: Phone,
      color: 'var(--accent-purple)',
      bg: 'rgba(168, 85, 247, 0.12)'
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="stat-card glass-card">
            <div className="stat-card-icon" style={{ color: card.color, background: card.bg }}>
              <Icon size={20} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-label">{card.label}</span>
              <span className="stat-card-value">{card.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
