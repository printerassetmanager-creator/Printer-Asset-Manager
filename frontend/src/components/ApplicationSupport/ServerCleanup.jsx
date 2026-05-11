import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { applicationSupportAPI } from '../../utils/api';

const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (Number.isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  let amount = bytes;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(1)} ${units[index]}`;
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString([], { hour12: true, month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ServerCleanup({ isSuperAdmin, inventory: propInventory, onInventoryRefresh }) {
  if (!isSuperAdmin) {
    return (
      <div className="app-dashboard-empty">
        Cleanup manager access is restricted to super admins only.
      </div>
    );
  }

  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [localInventory, setLocalInventory] = useState([]);
  const [selectedServers, setSelectedServers] = useState([]);
  const [hasInitializedServerSelection, setHasInitializedServerSelection] = useState(false);
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [cleanupRunStatus, setCleanupRunStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Use prop inventory if provided, otherwise use local state
  const inventory = propInventory || localInventory;

  // Real-time cleanup state
  const [realTimeLogs, setRealTimeLogs] = useState([]);
  const [activeCleanups, setActiveCleanups] = useState(new Map());
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const logsEndRef = useRef(null);

  const servers = useMemo(
    () => inventory.flatMap((terminal) => (terminal.servers || []).map((server) => server.name)),
    [inventory]
  );

  const allServersSelected = useMemo(
    () => servers.length > 0 && selectedServers.length === servers.length,
    [servers, selectedServers]
  );

  const selectedServerLabel = useMemo(() => {
    if (servers.length > 0 && selectedServers.length === servers.length) return 'All servers';
    if (selectedServers.length === 0) return 'No server selected';
    if (selectedServers.length > 3) return `${selectedServers.length} servers selected`;
    return selectedServers.join(', ');
  }, [selectedServers, servers.length]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const promises = [
        applicationSupportAPI.getServerCleanupStatus(),
        applicationSupportAPI.getServerCleanupHistory(),
      ];

      // Only load inventory if not provided as prop
      if (!propInventory) {
        promises.push(applicationSupportAPI.getInventory());
      }

      const [statusRes, historyRes, ...rest] = await Promise.all(promises);
      setStatus(statusRes.data || statusRes);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);

      if (!propInventory) {
        const inventoryRes = rest[0];
        setLocalInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load cleanup information');
    } finally {
      setLoading(false);
    }
  }, [propInventory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset server selection when inventory changes (e.g., new server added)
  useEffect(() => {
    if (servers.length > 0) {
      setSelectedServers(servers);
    }
  }, [servers]);

  // Socket.IO connection setup
  useEffect(() => {
    const backendUrl = process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:5000';

    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setSocketConnected(true);
      addLogEntry('System', 'Connected to real-time cleanup monitoring');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      addLogEntry('System', 'Disconnected from real-time cleanup monitoring');
    });

    // Cleanup events
    socket.on('cleanup-started', (data) => {
      setActiveCleanups(prev => new Map(prev.set(data.serverName, {
        ...data,
        logs: []
      })));
      addLogEntry(data.serverName, `Cleanup started for ${data.serverName}`);
    });

    socket.on('cleanup-log', (logEntry) => {
      addLogEntry(logEntry.serverName || 'Unknown', logEntry.message || JSON.stringify(logEntry));
    });

    socket.on('cleanup-progress', (progress) => {
      // Update progress if needed
    });

    socket.on('cleanup-completed', (result) => {
      setActiveCleanups(prev => {
        const newMap = new Map(prev);
        newMap.delete(result.serverName);
        return newMap;
      });
      addLogEntry(result.serverName, `Cleanup completed: ${result.results.deleted?.length || 0} profiles deleted`);
      // Refresh data
      loadData();
    });

    socket.on('cleanup-failed', (error) => {
      setActiveCleanups(prev => {
        const newMap = new Map(prev);
        newMap.delete(error.serverName);
        return newMap;
      });
      addLogEntry(error.serverName, `Cleanup failed: ${error.error}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [realTimeLogs]);

  const addLogEntry = (server, message) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      server,
      message
    };
    setRealTimeLogs(prev => [...prev.slice(-99), logEntry]); // Keep last 100 logs
  };

  const joinCleanupRoom = (serverName) => {
    if (socketRef.current && serverName) {
      socketRef.current.emit('join-cleanup-room', serverName);
    }
  };

  const leaveCleanupRoom = (serverName) => {
    if (socketRef.current && serverName) {
      socketRef.current.emit('leave-cleanup-room', serverName);
    }
  };

  const handleToggleServer = (server) => {
    setSelectedServers((current) =>
      current.includes(server)
        ? current.filter((name) => name !== server)
        : [...current, server]
    );
  };

  const handleSelectAllServers = () => {
    setSelectedServers(servers);
  };

  const handleClearServerSelection = () => {
    setSelectedServers([]);
  };

  const handleRunCleanup = async () => {
    setError('');
    setMessage('');
    if (!isSuperAdmin) {
      setError('Only super admins can trigger server cleanup.');
      return;
    }
    if (!adminId.trim() || !adminPassword) {
      setError('Enter server admin ID and password before running cleanup.');
      return;
    }
    if (selectedServers.length === 0) {
      setError('Select at least one server or choose All servers.');
      return;
    }

    setRunning(true);
    const targetServers = selectedServers;
    setCleanupRunStatus({
      status: 'running',
      serverName: allServersSelected ? 'All servers' : selectedServers.join(', '),
      startedAt: new Date(),
      triggeredBy: adminId.trim(),
      results: [],
      message: 'Cleanup is running...',
    });

    // Join cleanup room(s) for real-time updates
    targetServers.forEach(joinCleanupRoom);

    try {
      const payload = {
        username: adminId.trim(),
        password: adminPassword,
        serverNames: targetServers,
      };
      const { data } = await applicationSupportAPI.runServerCleanup(payload);
      setMessage(data.message || 'Cleanup request completed');
      setCleanupRunStatus({
        status: (data.results || []).some((item) => item.status !== 'success') ? 'failed' : 'success',
        serverName: allServersSelected ? 'All servers' : selectedServers.join(', '),
        completedAt: new Date(),
        triggeredBy: adminId.trim(),
        results: Array.isArray(data.results) ? data.results : [],
        message: data.message || 'Cleanup request completed',
      });
      setAdminPassword('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to trigger server cleanup');
      setCleanupRunStatus({
        status: 'failed',
        serverName: allServersSelected ? 'All servers' : selectedServers.join(', '),
        completedAt: new Date(),
        triggeredBy: adminId.trim(),
        results: [],
        message: err.response?.data?.details || err.response?.data?.error || 'Failed to trigger server cleanup',
      });
    } finally {
      setRunning(false);
      // Leave room after a delay
      setTimeout(() => {
        targetServers.forEach(leaveCleanupRoom);
      }, 300000); // 5 minutes
    }
  };

  const lastCleanup = status;

  return (
    <div className="tab-content">
      <div className="app-dashboard-header" style={{ marginBottom: '18px' }}>
        <div>
          <h2>Server Cleanup Manager</h2>
          <p>Schedule cleanup every 8 hours and run manual cleanup securely from the Application Support console.</p>
        </div>
      </div>

      {(error || message) && (
        <div className={error ? 'alert alert-error' : 'alert alert-success'}>
          {error || message}
        </div>
      )}

      <div className="app-dashboard-grid">
        {lastCleanup?.created_at && (
          <div className="app-dashboard-panel">
            <h3>Last Cleanup Summary</h3>
            <div className="app-dashboard-value" style={{ marginBottom: '12px' }}>
              {formatDate(lastCleanup.created_at)}
            </div>
            <div className="app-dashboard-label">Server</div>
            <div style={{ marginBottom: '12px', color: '#cbd5e1' }}>{lastCleanup.server_name || '--'}</div>
            <div className="app-dashboard-label">Status</div>
            <div style={{ marginBottom: '12px', color: lastCleanup.status === 'success' ? '#22c55e' : '#f97316' }}>{lastCleanup.status || 'idle'}</div>
            <div className="app-dashboard-label">Profiles deleted</div>
            <div style={{ marginBottom: '12px', color: '#cbd5e1' }}>{Array.isArray(lastCleanup.deleted_profiles) ? lastCleanup.deleted_profiles.length : 0}</div>
            <div className="app-dashboard-label">Recovered space</div>
            <div style={{ color: '#cbd5e1' }}>{formatBytes(lastCleanup.space_freed_bytes)}</div>
          </div>
        )}

        <div className="app-dashboard-panel">
          <h3>Manual Cleanup</h3>
          <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Choose server(s)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSelectAllServers}
              style={{ minWidth: '120px' }}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearServerSelection}
              style={{ minWidth: '120px' }}
            >
              Clear Selection
            </button>
            <span style={{ alignSelf: 'center', color: '#cbd5e1' }}>{selectedServerLabel}</span>
          </div>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setServerDropdownOpen((open) => !open)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: '#050b17',
                color: '#e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              aria-haspopup="listbox"
              aria-expanded={serverDropdownOpen}
            >
              <span>{selectedServerLabel}</span>
              <span style={{ opacity: 0.75 }}>{serverDropdownOpen ? '▴' : '▾'}</span>
            </button>

            {serverDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  borderRadius: '14px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  background: '#050b17',
                  zIndex: 1000,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
                }}
              >
                {servers.length === 0 ? (
                  <div style={{ padding: '14px 16px', color: '#94a3b8' }}>No servers configured</div>
                ) : (
                  servers.map((server) => (
                    <label
                      key={server}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        color: '#e2e8f0',
                        background: selectedServers.includes(server) ? 'rgba(148, 163, 184, 0.08)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServers.includes(server)}
                        onChange={() => handleToggleServer(server)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{server}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Server admin ID</label>
              <input
                value={adminId}
                onChange={(event) => setAdminId(event.target.value)}
                placeholder="Network Security ID"
                autoComplete="username"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunCleanup}
              disabled={running || loading || !isSuperAdmin || !adminId.trim() || !adminPassword || selectedServers.length === 0}
            >
              {running ? 'Running cleanup...' : 'Run Cleanup'}
            </button>
          </div>

          {!isSuperAdmin && (
            <div style={{ marginTop: '16px', color: '#fbbf24' }}>
              Super admin permission is required to trigger cleanup.
            </div>
          )}

          <div style={{ marginTop: '18px', color: '#94a3b8', fontSize: '13px' }}>
            This ID/password is used for the remote server admin session only. Cleanup will preserve active users, administrator accounts, and service accounts.
          </div>
        </div>
      </div>

      <div className="app-dashboard-panel" style={{ marginTop: '20px' }}>
        <h3>Cleanup Run Status</h3>
        {cleanupRunStatus ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <div className="app-dashboard-label">Target</div>
                <div style={{ marginTop: '8px', color: '#e2e8f0' }}>{cleanupRunStatus.serverName}</div>
              </div>
              <div>
                <div className="app-dashboard-label">Status</div>
                <div style={{ marginTop: '8px', color: cleanupRunStatus.status === 'success' ? '#22c55e' : cleanupRunStatus.status === 'failed' ? '#f97316' : '#60a5fa' }}>{cleanupRunStatus.status}</div>
              </div>
              <div>
                <div className="app-dashboard-label">Admin ID</div>
                <div style={{ marginTop: '8px', color: '#e2e8f0' }}>{cleanupRunStatus.triggeredBy || '--'}</div>
              </div>
              <div>
                <div className="app-dashboard-label">Time</div>
                <div style={{ marginTop: '8px', color: '#e2e8f0' }}>{formatDate(cleanupRunStatus.completedAt || cleanupRunStatus.startedAt)}</div>
              </div>
            </div>
            <div style={{ color: '#cbd5e1' }}>{cleanupRunStatus.message}</div>
            {cleanupRunStatus.results.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Server</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Profiles</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Space</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanupRunStatus.results.map((item) => (
                      <tr key={`${item.serverName}-${item.status}`}>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{item.serverName || '--'}</td>
                        <td style={{ padding: '10px 12px', color: item.status === 'success' ? '#22c55e' : '#f97316' }}>{item.status}</td>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{Array.isArray(item.deletedProfiles) ? item.deletedProfiles.length : 0}</td>
                        <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{formatBytes(item.spaceFreedBytes)}</td>
                        <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{item.details || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="app-dashboard-empty">Enter server admin credentials and run cleanup to see live status here.</div>
        )}
      </div>

      <div className="app-dashboard-panel" style={{ marginTop: '20px' }}>
        <h3>Recent Cleanup History</h3>
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>When</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Server</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Profiles</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Space</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '16px 12px', color: '#94a3b8' }}>No cleanup history available.</td>
                </tr>
              ) : history.map((item) => (
                <tr key={`${item.server_name}-${item.created_at}`}>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{formatDate(item.created_at)}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{item.server_name}</td>
                  <td style={{ padding: '10px 12px', color: item.status === 'success' ? '#22c55e' : '#f97316' }}>{item.status}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{Array.isArray(item.deleted_profiles) ? item.deleted_profiles.length : 0}</td>
                  <td style={{ padding: '10px 12px', color: '#e2e8f0' }}>{formatBytes(item.space_freed_bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="app-dashboard-panel" style={{ marginTop: '20px' }}>
        <h3>
          Real-Time Cleanup Logs
          <span style={{
            marginLeft: '10px',
            fontSize: '12px',
            color: socketConnected ? '#22c55e' : '#f97316'
          }}>
            ● {socketConnected ? 'Connected' : 'Disconnected'}
          </span>
        </h3>
        <div style={{
          marginTop: '16px',
          maxHeight: '300px',
          overflowY: 'auto',
          background: '#0a0f1c',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          borderRadius: '8px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          {realTimeLogs.length === 0 ? (
            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              No real-time logs available. Start a cleanup to see live updates.
            </div>
          ) : (
            realTimeLogs.map((log) => (
              <div key={log.id} style={{
                marginBottom: '4px',
                color: '#e2e8f0',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                paddingBottom: '2px'
              }}>
                <span style={{ color: '#94a3b8', marginRight: '8px' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span style={{ color: '#60a5fa', fontWeight: 'bold', marginRight: '8px' }}>
                  {log.server}:
                </span>
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        {activeCleanups.size > 0 && (
          <div style={{ marginTop: '12px', color: '#fbbf24', fontSize: '13px' }}>
            Active cleanups: {Array.from(activeCleanups.keys()).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
