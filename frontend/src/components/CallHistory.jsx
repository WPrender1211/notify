import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit3, Check, Clock, Phone, Smartphone, ChevronRight } from 'lucide-react';

export const CallHistory = ({ calls, onUpdateNotes, onDeleteCall, onClearCalls }) => {
  const [filterState, setFilterState] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const filteredCalls = calls.filter((call) => {
    const matchesFilter = filterState === 'ALL' || call.state === filterState;
    const matchesSearch =
      (call.number && call.number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (call.name && call.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (call.company && call.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (call.notes && call.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleStartEdit = (call) => {
    setEditingId(call.id);
    setEditNotes(call.notes || '');
  };

  const handleSaveEdit = (callId) => {
    onUpdateNotes(callId, editNotes);
    setEditingId(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'RINGING':
        return <span className="status-badge status-ringing">Ringing</span>;
      case 'ANSWERED':
        return <span className="status-badge status-answered">Answered</span>;
      case 'ENDED':
        return <span className="status-badge status-ended">Completed</span>;
      case 'MISSED':
        return <span className="status-badge status-missed">Missed</span>;
      case 'REJECTED':
        return <span className="status-badge status-rejected">Rejected</span>;
      default:
        return <span className="status-badge">{state}</span>;
    }
  };

  return (
    <div className="section-container glass-card">
      {/* Table Controls */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input input-search"
            placeholder="Search by caller, number, company, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div className="filter-buttons">
            {['ALL', 'RINGING', 'ANSWERED', 'ENDED', 'MISSED'].map((st) => (
              <button
                key={st}
                className={`filter-btn ${filterState === st ? 'active' : ''}`}
                onClick={() => setFilterState(st)}
              >
                {st === 'ALL' ? 'All Calls' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {calls.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (window.confirm('Clear all call logs for your account?')) {
                  onClearCalls();
                }
              }}
              title="Clear all logs"
            >
              <Trash2 size={15} style={{ color: 'var(--accent-rose)' }} />
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem' }}>Clear Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Calls Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Caller Information</th>
              <th>Duration</th>
              <th>Timestamp</th>
              <th>Call Notes & Action Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                  <Phone size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    No call logs found
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Incoming phone calls will automatically stream and populate here in real time.
                  </div>
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => (
                <tr key={call.id} className={call.state === 'RINGING' ? 'row-ringing' : ''}>
                  <td>{getStateBadge(call.state)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>
                        {call.name || 'Unknown Caller'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {call.number}
                      </span>
                      {call.company && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                          🏢 {call.company} {call.tag && `• ${call.tag}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {formatDuration(call.duration)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {formatDate(call.timestamp)}
                    </span>
                  </td>
                  <td>
                    {editingId === call.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input input-plain"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Enter notes..."
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(call.id)}
                        />
                        <button className="btn btn-primary btn-icon" onClick={() => handleSaveEdit(call.id)}>
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEdit(call)}
                        style={{
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: call.notes ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontStyle: call.notes ? 'normal' : 'italic'
                        }}
                      >
                        {call.notes || '+ Click to add note...'}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleStartEdit(call)}
                        title="Edit note"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => onDeleteCall(call.id)}
                        title="Delete log"
                      >
                        <Trash2 size={14} style={{ color: 'var(--accent-rose)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
