import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function ServerCleanup({ isSuperAdmin }) {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const servers = useMemo(
    () => inventory.flatMap((terminal) => (terminal.servers || []).map((server) => server.name)),
    [inventory]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, historyRes, inventoryRes] = await Promise.all([
        applicationSupportAPI.getServerCleanupStatus(),
        applicationSupportAPI.getServerCleanupHistory(),
        applicationSupportAPI.getInventory(),
      ]);
      setStatus(statusRes.data || statusRes);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load cleanup information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunCleanup = async () => {
    setError('');
    setMessage('');
    if (!isSuperAdmin) {
      setError('Only super admins can trigger server cleanup.');
      return;
    }

    setRunning(true);
    try {
      const payload = {};
      if (selectedServer) {
        payload.serverName = selectedServer;
      }
      const { data } = await applicationSupportAPI.runServerCleanup(payload);
      setMessage(data.message || 'Cleanup request completed');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to trigger server cleanup');
    } finally {
      setRunning(false);
    }
  };

  const lastCleanup = status;

  return (
    <div className="tab-content">
      <div className="app-dashboard-header" style={{ marginBottom: '18px' }}>
        <div>
          <h2>Server Cleanup Manager</h2>
          <p>Schedule cleanup every 5 hours and run manual cleanup securely from the Application Support console.</p>
        </div>
      </div>

      {(error || message) && (
        <div className={error ? 'alert alert-error' : 'alert alert-success'}>
          {error || message}
        </div>
      )}

      <div className="app-dashboard-grid">
        <div className="app-dashboard-panel">
          <h3>Last Cleanup Summary</h3>
          <div className="app-dashboard-value" style={{ marginBottom: '12px' }}>
            {lastCleanup?.created_at ? formatDate(lastCleanup.created_at) : 'No cleanup run yet'}
          </div>
          <div className="app-dashboard-label">Server</div>
          <div style={{ marginBottom: '12px', color: '#cbd5e1' }}>{lastCleanup?.server_name || '--'}</div>
          <div className="app-dashboard-label">Status</div>
          <div style={{ marginBottom: '12px', color: lastCleanup?.status === 'success' ? '#22c55e' : '#f97316' }}>{lastCleanup?.status || 'idle'}</div>
          <div className="app-dashboard-label">Profiles deleted</div>
          <div style={{ marginBottom: '12px', color: '#cbd5e1' }}>{Array.isArray(lastCleanup?.deleted_profiles) ? lastCleanup.deleted_profiles.length : 0}</div>
          <div className="app-dashboard-label">Recovered space</div>
          <div style={{ color: '#cbd5e1' }}>{formatBytes(lastCleanup?.space_freed_bytes)}</div>
        </div>

        <div className="app-dashboard-panel">
          <h3>Manual Cleanup</h3>
          <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Choose a server</label>
          <select
            value={selectedServer}
            onChange={(event) => setSelectedServer(event.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.25)', background: '#050b17', color: '#e2e8f0' }}
          >
            <option value="">All servers</option>
            {servers.map((server) => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>

          <div style={{ marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRunCleanup}
              disabled={running || loading || !isSuperAdmin}
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
            Cleanup will preserve active users, administrator accounts, and service accounts. Only inactive and cached profiles are removed.
          </div>
        </div>
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
    </div>
  );
}
