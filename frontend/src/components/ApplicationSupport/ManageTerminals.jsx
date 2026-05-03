import React, { useState, useEffect } from 'react';

export default function ManageTerminals() {
  const [terminals, setTerminals] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [terminalName, setTerminalName] = useState('');
  const [terminalUrl, setTerminalUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({});

  // Load terminals from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('appSupportTerminals');
    if (stored) {
      try {
        setTerminals(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading terminals:', e);
      }
    }
  }, []);

  // Save terminals to localStorage
  const saveTerminals = (updated) => {
    localStorage.setItem('appSupportTerminals', JSON.stringify(updated));
    setTerminals(updated);
  };

  const validateForm = () => {
    if (!terminalName.trim()) {
      setError('Terminal name is required');
      return false;
    }
    if (!terminalUrl.trim()) {
      setError('Terminal URL is required');
      return false;
    }
    if (!terminalUrl.match(/^https?:\/\/.+/)) {
      setError('Please enter a valid URL (http:// or https://)');
      return false;
    }
    return true;
  };

  const handleAddTerminal = () => {
    setError('');
    setSuccess('');
    setEditingId(null);
    setTerminalName('');
    setTerminalUrl('');
    setShowForm(true);
  };

  const handleEditTerminal = (terminal) => {
    setError('');
    setSuccess('');
    setEditingId(terminal.id);
    setTerminalName(terminal.name);
    setTerminalUrl(terminal.url);
    setShowForm(true);
  };

  const handleSaveTerminal = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let updated;
      if (editingId) {
        // Update existing
        updated = terminals.map(t =>
          t.id === editingId
            ? { ...t, name: terminalName.trim(), url: terminalUrl.trim(), updatedAt: new Date().toISOString() }
            : t
        );
        setSuccess('Terminal updated successfully');
      } else {
        // Add new
        const newTerminal = {
          id: Date.now(),
          name: terminalName.trim(),
          url: terminalUrl.trim(),
          createdAt: new Date().toISOString(),
          status: 'disconnected',
        };
        updated = [...terminals, newTerminal];
        setSuccess('Terminal added successfully');
      }

      saveTerminals(updated);
      setShowForm(false);
      setTerminalName('');
      setTerminalUrl('');
      setEditingId(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTerminal = (id) => {
    if (window.confirm('Are you sure you want to delete this terminal?')) {
      const updated = terminals.filter(t => t.id !== id);
      saveTerminals(updated);
      if (selectedTerminal?.id === id) {
        setSelectedTerminal(null);
      }
      setSuccess('Terminal deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleTestConnection = async (terminal) => {
    setConnectionStatus(prev => ({
      ...prev,
      [terminal.id]: 'testing'
    }));

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectionStatus(prev => ({
        ...prev,
        [terminal.id]: 'connected'
      }));

      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          [terminal.id]: null
        }));
      }, 3000);
    } catch (err) {
      setConnectionStatus(prev => ({
        ...prev,
        [terminal.id]: 'failed'
      }));

      setTimeout(() => {
        setConnectionStatus(prev => ({
          ...prev,
          [terminal.id]: null
        }));
      }, 3000);
    }
  };

  const handleSelectTerminal = (terminal) => {
    setSelectedTerminal(selectedTerminal?.id === terminal.id ? null : terminal);
  };

  return (
    <div className="manage-terminals">
      <div className="terminals-header">
        <div>
          <h2>Manage Terminals</h2>
          <p>Create and manage terminal connections for application monitoring</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAddTerminal}
          disabled={loading}
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Add Terminal
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="terminal-form-container">
          <div className="terminal-form">
            <h3>{editingId ? 'Edit Terminal' : 'Add New Terminal'}</h3>
            
            <form onSubmit={handleSaveTerminal}>
              <div className="form-group">
                <label>Terminal Name *</label>
                <input
                  type="text"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                  placeholder="e.g., Production Server, Dev Terminal"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Terminal URL *</label>
                <input
                  type="url"
                  value={terminalUrl}
                  onChange={(e) => setTerminalUrl(e.target.value)}
                  placeholder="https://terminal.example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update' : 'Add')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setTerminalName('');
                    setTerminalUrl('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminals List */}
      <div className="terminals-list">
        {terminals.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 64 64" fill="none">
              <rect x="8" y="16" width="48" height="32" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 24h32M16 32h20M16 40h28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>No terminals configured yet</p>
            <p style={{ fontSize: '13px', color: '#666' }}>Click "Add Terminal" to create your first terminal connection</p>
          </div>
        ) : (
          terminals.map(terminal => (
            <div key={terminal.id} className={`terminal-card ${selectedTerminal?.id === terminal.id ? 'active' : ''}`}>
              <div className="terminal-card-header" onClick={() => handleSelectTerminal(terminal)}>
                <div className="terminal-card-title">
                  <svg viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="2" width="13" height="11" rx="1.2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 6h8M4 8h6M4 10h7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <h3>{terminal.name}</h3>
                    <p className="terminal-url">{terminal.url}</p>
                  </div>
                </div>
                <div className="terminal-status">
                  {connectionStatus[terminal.id] === 'testing' && (
                    <span className="status-badge testing">Testing...</span>
                  )}
                  {connectionStatus[terminal.id] === 'connected' && (
                    <span className="status-badge connected">Connected</span>
                  )}
                  {connectionStatus[terminal.id] === 'failed' && (
                    <span className="status-badge failed">Connection Failed</span>
                  )}
                  {!connectionStatus[terminal.id] && (
                    <span className="status-badge disconnected">Disconnected</span>
                  )}
                </div>
              </div>

              {selectedTerminal?.id === terminal.id && (
                <div className="terminal-card-details">
                  <div className="terminal-info">
                    <div className="info-item">
                      <span className="label">Created:</span>
                      <span className="value">{new Date(terminal.createdAt).toLocaleString()}</span>
                    </div>
                    {terminal.updatedAt && (
                      <div className="info-item">
                        <span className="label">Updated:</span>
                        <span className="value">{new Date(terminal.updatedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="terminal-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleTestConnection(terminal)}
                      disabled={loading || connectionStatus[terminal.id] === 'testing'}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                      Test Connection
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleEditTerminal(terminal)}
                      disabled={loading}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M2 14h2l8.5-8.5m1.5-1.5l-2-2m0 0l2-2m-2 2l-2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteTerminal(terminal.id)}
                      disabled={loading}
                    >
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4m1 0v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1V4h10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 8v4M10 8v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
