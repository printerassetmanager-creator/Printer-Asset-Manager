import React, { useEffect, useState } from 'react';
import { applicationSupportAPI } from '../../utils/api';

const emptyForm = {
  mode: 'server',
  terminalId: '',
  terminalCode: '',
  terminalName: '',
  serverName: '',
};

export default function ManageTerminals({ canManage = false, onInventoryChange }) {
  const [terminals, setTerminals] = useState([]);
  const [expandedTerminalId, setExpandedTerminalId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await applicationSupportAPI.getInventory();
      setTerminals(Array.isArray(data) ? data : []);
      onInventoryChange?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load terminals and servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAddForm = (mode, terminal = null) => {
    setForm({
      ...emptyForm,
      mode,
      terminalId: terminal?.id || '',
      terminalCode: terminal?.code || '',
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (form.mode === 'terminal') {
        await applicationSupportAPI.createTerminal({
          code: form.terminalCode,
          name: form.terminalName,
        });
        setSuccess('Terminal added successfully');
      } else {
        await applicationSupportAPI.createServer({
          terminalId: form.terminalId,
          name: form.serverName,
        });
        setSuccess('Server added successfully');
      }

      closeForm();
      await loadInventory();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manage-terminals">
      <div className="terminals-header">
        <div>
          <h2>Terminal and Server</h2>
          <p>View terminal groups, server capacity, and active user load</p>
        </div>
        {canManage && (
          <div className="terminal-header-actions">
            <button className="btn btn-primary" onClick={() => openAddForm('terminal')} disabled={loading}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add Terminal
            </button>
            <button className="btn btn-primary" onClick={() => openAddForm('server')} disabled={loading || terminals.length === 0}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add Server
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="terminal-form-container">
          <div className="terminal-form">
            <h3>{form.mode === 'terminal' ? 'Add Terminal' : 'Add Server'}</h3>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Type</label>
                <select value={form.mode} onChange={(e) => setField('mode', e.target.value)} disabled={saving}>
                  <option value="terminal">Terminal</option>
                  <option value="server">Server</option>
                </select>
              </div>

              {form.mode === 'terminal' ? (
                <>
                  <div className="form-group">
                    <label>Terminal Code *</label>
                    <input value={form.terminalCode} onChange={(e) => setField('terminalCode', e.target.value)} placeholder="e.g., P02" disabled={saving} />
                  </div>
                  <div className="form-group">
                    <label>Terminal Name *</label>
                    <input value={form.terminalName} onChange={(e) => setField('terminalName', e.target.value)} placeholder="e.g., P02" disabled={saving} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Terminal *</label>
                    <select value={form.terminalId} onChange={(e) => setField('terminalId', e.target.value)} disabled={saving}>
                      <option value="">Select terminal</option>
                      {terminals.map((terminal) => (
                        <option key={terminal.id} value={terminal.id}>{terminal.code} - {terminal.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Server Name *</label>
                    <input value={form.serverName} onChange={(e) => setField('serverName', e.target.value)} placeholder="e.g., INRJNM0RDSHP55" disabled={saving} />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading terminals and servers...</div>
      ) : terminals.length === 0 ? (
        <div className="empty-state">
          <p>No terminals configured yet</p>
          <p style={{ fontSize: '13px', color: '#666' }}>Admins can add terminals and servers here.</p>
        </div>
      ) : (
        <div className="terminals-list">
          {terminals.map((terminal) => {
            const activeUsers = terminal.servers.reduce((sum, server) => sum + Number(server.active_users || 0), 0);
            const capacity = terminal.servers.reduce((sum, server) => sum + Number(server.max_users || 30), 0);
            const isExpanded = expandedTerminalId === terminal.id;

            return (
              <div key={terminal.id} className={`terminal-card ${isExpanded ? 'active' : ''}`}>
                <div className="terminal-card-header" onClick={() => setExpandedTerminalId(isExpanded ? null : terminal.id)}>
                  <div className="terminal-card-title">
                    <svg viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="2" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 6h8M4 8h6M4 10h7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <h3>{terminal.code}</h3>
                      <p className="terminal-url">{terminal.servers.length} servers, {activeUsers}/{capacity} active users</p>
                    </div>
                  </div>
                  <div className="terminal-status">
                    <span className="status-badge connected">{activeUsers} Active</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="terminal-card-details">
                    <div className="server-table-wrap">
                      <table className="server-table">
                        <thead>
                          <tr>
                            <th>Server</th>
                            <th>Active Users</th>
                            <th>Limit</th>
                            <th>Status</th>
                            <th>Last Checked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {terminal.servers.map((server) => {
                            const isNearLimit = Number(server.active_users || 0) >= Number(server.max_users || 30);
                            return (
                              <tr key={server.id}>
                                <td>{server.name}</td>
                                <td className={isNearLimit ? 'server-load-high' : ''}>{server.active_users || 0}</td>
                                <td>{server.max_users || 30}</td>
                                <td>
                                  <span className={`status-badge ${server.status === 'online' ? 'connected' : 'failed'}`}>
                                    {server.status || 'unknown'}
                                  </span>
                                </td>
                                <td>{server.last_checked_at ? new Date(server.last_checked_at).toLocaleString() : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {canManage && (
                      <div className="terminal-actions">
                        <button className="btn btn-sm btn-outline" onClick={() => openAddForm('server', terminal)}>
                          Add Server to {terminal.code}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
