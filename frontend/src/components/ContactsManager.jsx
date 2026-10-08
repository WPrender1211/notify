import React, { useState } from 'react';
import { UserPlus, Search, Phone, Mail, Building, Tag, Trash2, X, Check, Users } from 'lucide-react';

export const ContactsManager = ({ contacts, onAddContact, onDeleteContact }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('Client');
  const [notes, setNotes] = useState('');

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.number && c.number.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.tag && c.tag.toLowerCase().includes(q))
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !number) return;
    onAddContact({ name, number, company, email, tag, notes });
    setName('');
    setNumber('');
    setCompany('');
    setEmail('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="section-container glass-card">
      {/* Header Controls */}
      <div className="table-controls">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input input-search"
            placeholder="Search contacts by name, company, number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
        {filteredContacts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              No contacts in your personal directory
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Add VIP contacts, clients, or team members to automatically show company tags during incoming calls.
            </div>
          </div>
        ) : (
          filteredContacts.map((c) => (
            <div
              key={c.id}
              className="glass-card"
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {c.number}
                    </div>
                  </div>
                  <span className="tag-badge" style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)' }}>
                    {c.tag || 'Contact'}
                  </span>
                </div>

                {c.company && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                    <Building size={12} />
                    <span>{c.company}</span>
                  </div>
                )}

                {c.email && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                    <Mail size={12} />
                    <span>{c.email}</span>
                  </div>
                )}

                {c.notes && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', background: 'rgba(0,0,0,0.04)', padding: '6px 8px', borderRadius: '6px' }}>
                    {c.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ color: 'var(--accent-rose)', padding: '4px' }}
                  onClick={() => onDeleteContact(c.id)}
                  title="Delete contact"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Add New Contact</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="input input-plain"
                    placeholder="e.g. David Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number * (Include country code)</label>
                  <input
                    type="text"
                    required
                    className="input input-plain"
                    placeholder="e.g. +1 555-234-5678"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Organization</label>
                  <input
                    type="text"
                    className="input input-plain"
                    placeholder="e.g. FinTech Solutions"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="input input-plain"
                    placeholder="e.g. david@fintech.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category / Tag</label>
                  <select
                    className="input input-plain"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  >
                    <option value="VIP Client">VIP Client</option>
                    <option value="Client">Client</option>
                    <option value="Lead">Lead</option>
                    <option value="Partner">Partner</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Private Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Key account details or preferred follow up method..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
