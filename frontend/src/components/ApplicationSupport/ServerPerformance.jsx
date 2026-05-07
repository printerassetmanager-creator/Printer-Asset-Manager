import React, { useEffect, useState } from 'react';
import { applicationSupportAPI } from '../../utils/api';

const formatSeconds = (value, fallback = '-- sec') => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return fallback;
  return `${Math.round(Number(value))} sec`;
};

const formatTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return [hrs, mins, secs].map((part) => String(part).padStart(2, '0')).join(':');
};

const formatCountdown = (targetTimestamp, now) => {
  if (!targetTimestamp) return '--';
  const diff = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getStatusTone = (color) => {
  if (color === 'green') return 'running';
  if (color === 'yellow') return 'slow';
  if (color === 'red') return 'failed';
  return 'launching';
};

const buildLogMessage = (log) => {
  const label = log.server_name || 'Server';
  const seconds = Math.round((Number(log.elapsed_ms || 0) / 1000) * 10) / 10;
  if (log.status === 'success') return `${label} desktop opened in ${seconds} sec`;
  if (log.status === 'slow') return `${label} desktop launch slow: ${seconds} sec`;
  if (log.status === 'invalid_credentials') return `${label} stopped monitoring due to invalid credentials`;
  if (log.error_text) return `${label}: ${log.error_text}`;
  return `${label} failed after ${log.retry_count || 0} retries`;
};

export default function ServerPerformance({ canManage }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [runningNow, setRunningNow] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [statusRes, logsRes] = await Promise.all([
          applicationSupportAPI.getServerPerformanceStatus(),
          applicationSupportAPI.getServerPerformanceLogs(),
        ]);
        if (!mounted) return;
        setStatus(statusRes.data || statusRes);
        setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        setError('');
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.error || 'Unable to load server performance data');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const intervalId = setInterval(load, 5000);
    const clockId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
      clearInterval(clockId);
    };
  }, []);

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const refreshData = async () => {
    const [statusRes, logsRes] = await Promise.all([
      applicationSupportAPI.getServerPerformanceStatus(),
      applicationSupportAPI.getServerPerformanceLogs(),
    ]);
    setStatus(statusRes.data || statusRes);
    setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
  };

  const handleStart = async () => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to control server performance monitoring.');
      return;
    }
    if (!username || !password) {
      setError('Enter server credentials to start monitoring');
      return;
    }

    setStarting(true);
    try {
      const { data } = await applicationSupportAPI.startServerPerformance({ username, password });
      setMessage(data?.message || 'Server performance monitoring started');
      setPassword('');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to start server performance monitoring');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to control server performance monitoring.');
      return;
    }

    setStopping(true);
    try {
      const { data } = await applicationSupportAPI.stopServerPerformance();
      setMessage(data?.message || 'Server performance monitoring stopped');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to stop server performance monitoring');
    } finally {
      setStopping(false);
    }
  };

  const handleRunNow = async () => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to run server performance checks.');
      return;
    }

    setRunningNow(true);
    try {
      const { data } = await applicationSupportAPI.runServerPerformance();
      setMessage(data?.message || 'Server performance cycle completed');
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to run server performance cycle');
    } finally {
      setRunningNow(false);
    }
  };

  const servers = Array.isArray(status?.servers)
    ? status.servers.map((server) => ({
      ...server,
      tone: getStatusTone(server.statusColor),
    }))
    : [];

  const nextCycleAt = status?.lastCompletedAt
    ? new Date(status.lastCompletedAt).getTime() + Number(status?.intervalMs || 10 * 60 * 1000)
    : status?.lastRunAt
    ? new Date(status.lastRunAt).getTime() + Number(status?.intervalMs || 10 * 60 * 1000)
    : null;

  const recentLogs = logs.slice(0, 12).map((log) => ({
    ...log,
    tone: getStatusTone(log.details_json?.color),
    text: buildLogMessage(log),
  }));

  const uptimeSeconds = status?.active && status?.lastStartedAt
    ? Math.floor((now - new Date(status.lastStartedAt).getTime()) / 1000)
    : 0;

  return (
    <div className="server-performance-page">
      <div className="terminals-header">
        <div>
          <h2>Server Performance</h2>
          <p>Measures server desktop open time after password acceptance and checks all active servers every 10 minutes.</p>
        </div>
        <div className="server-performance-header-meta">
          <span className={`app-dashboard-role ${status?.active ? 'running' : ''}`}>{status?.active ? 'Monitoring Active' : 'Monitoring Stopped'}</span>
        </div>
      </div>

      {(error || message) && (
        <div className={`monitor-banner ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}

      <div className="server-performance-grid">
        <div className="server-performance-panel">
          <div className="server-performance-panel-header">
            <h3>Monitoring Control</h3>
          </div>
          <div className="server-performance-kpis">
            <div className="server-performance-kpi">
              <span>Status</span>
              <strong>{status?.active ? 'Running' : 'Stopped'}</strong>
            </div>
            <div className="server-performance-kpi">
              <span>Uptime</span>
              <strong>{formatDuration(uptimeSeconds)}</strong>
            </div>
            <div className="server-performance-kpi">
              <span>Next Cycle</span>
              <strong>{formatCountdown(nextCycleAt, now)}</strong>
            </div>
            <div className="server-performance-kpi">
              <span>Last Run</span>
              <strong>{formatTime(status?.lastCompletedAt || status?.lastRunAt)}</strong>
            </div>
          </div>

          <div className="server-performance-form">
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Network Security ID" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
            <div className="server-performance-actions">
              <button type="button" className="btn btn-primary" onClick={handleStart} disabled={starting || loading}>
                {starting ? 'Starting...' : 'Start'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleRunNow} disabled={runningNow || loading || !status?.active}>
                {runningNow ? 'Running...' : 'Run Now'}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleStop} disabled={stopping || loading}>
                {stopping ? 'Stopping...' : 'Stop'}
              </button>
            </div>
          </div>

          <div className="server-performance-note">
            Credentials are stored in the backend monitor until invalid credentials are detected.
          </div>
        </div>

        <div className="server-performance-panel">
          <div className="server-performance-panel-header">
            <h3>Recent Logs</h3>
          </div>
          <div className="server-performance-log-list">
            {recentLogs.length ? recentLogs.map((log) => (
              <div key={log.id} className="server-performance-log-row">
                <time>{formatTime(log.run_at)}</time>
                <span className={`monitor-log-glyph ${log.tone}`}>{log.tone === 'running' ? 'O' : log.tone === 'slow' ? '!' : log.tone === 'failed' ? 'X' : 'i'}</span>
                <p>{log.text}</p>
              </div>
            )) : (
              <div className="app-dashboard-empty">No server performance logs yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="server-performance-panel">
        <div className="server-performance-panel-header">
          <h3>All Servers</h3>
        </div>
        {loading ? (
          <div className="app-dashboard-empty">Loading server performance...</div>
        ) : (
          <div className="server-performance-table-wrap">
            <table className="server-performance-table">
              <thead>
                <tr>
                  <th>Server Name</th>
                  <th>Terminal</th>
                  <th>Current Open Time</th>
                  <th>Average Open Time</th>
                  <th>Retry Count</th>
                  <th>Status</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.serverName}>
                    <td>{server.serverName}</td>
                    <td>{server.terminalCode || '--'}</td>
                    <td>{formatSeconds(server.currentLaunchSeconds)}</td>
                    <td>{formatSeconds(server.averageLaunchSeconds)}</td>
                    <td>{server.retryCount || 0}</td>
                    <td>
                      <span className={`monitor-status-dot ${server.tone}`} />
                      <span className={`monitor-status-text ${server.tone}`}>
                        {server.tone === 'running' ? 'Running' : server.tone === 'slow' ? 'Slow' : server.tone === 'failed' ? 'Failed' : 'Launching'}
                      </span>
                    </td>
                    <td>{formatTime(server.lastRunAt)}</td>
                  </tr>
                ))}
                {servers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="server-performance-empty">No active servers configured.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
