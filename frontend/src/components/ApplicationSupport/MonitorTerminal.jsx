import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { applicationSupportAPI } from '../../utils/api';

const TERMINAL_COLORS = {
  VAO01: '#12cfff',
  M01: '#a865ff',
  P01: '#2e86ff',
  D01: '#63e35f',
};

const RANGE_OPTIONS = [
  { label: '1 Week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '1 Day', value: 24 * 60 * 60 * 1000 },
  { label: '12 Hr', value: 12 * 60 * 60 * 1000 },
  { label: '6 Hr', value: 6 * 60 * 60 * 1000 },
  { label: '3 Hr', value: 3 * 60 * 60 * 1000 },
  { label: '1 Hr', value: 60 * 60 * 1000 },
  { label: '30 Min', value: 30 * 60 * 1000 },
  { label: '10 Min', value: 10 * 60 * 1000 },
];

const getFileHeading = (fileName) => String(fileName || '').replace(/\.rdp$/i, '') || 'Terminal';

const formatSeconds = (value, fallback = '-- sec') => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return fallback;
  return `${Math.round(Number(value))} sec`;
};

const formatTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatClock = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const label = log.terminal_label || log.terminal_code;
  const seconds = Math.round((Number(log.elapsed_ms || 0) / 1000) * 10) / 10;
  if (log.status === 'success') return `${label} launched successfully in ${seconds} sec`;
  if (log.status === 'slow') return `${label} launch slow: ${seconds} sec`;
  if (log.status === 'invalid_credentials') return `${label} stopped monitoring due to invalid credentials`;
  if (log.error_text) return `${label}: ${log.error_text}`;
  return `${label} failed after ${log.retry_count || 0} retries`;
};

const buildChartData = (logs, rangeMs) => {
  const cutoff = Date.now() - rangeMs;
  const grouped = new Map();

  logs
    .filter((log) => new Date(log.run_at).getTime() >= cutoff)
    .forEach((log) => {
      const timestamp = new Date(log.run_at).getTime();
      if (!Number.isFinite(timestamp)) return;
      const point = grouped.get(timestamp) || { timestamp };
      point[log.terminal_code] = Math.round((Number(log.elapsed_ms || 0) / 1000) * 10) / 10;
      grouped.set(timestamp, point);
    });

  return Array.from(grouped.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((point) => ({
      ...point,
      label: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
};

const buildSparklineData = (logs, terminalCode) => {
  return logs
    .filter((log) => log.terminal_code === terminalCode)
    .slice()
    .sort((a, b) => new Date(a.run_at).getTime() - new Date(b.run_at).getTime())
    .slice(-14)
    .map((log, index) => ({
      index,
      value: Math.round((Number(log.elapsed_ms || 0) / 1000) * 10) / 10,
    }));
};

export default function MonitorTerminal({ canManage }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [activePanel, setActivePanel] = useState('');
  const [selectedRange, setSelectedRange] = useState(60 * 60 * 1000);
  const [now, setNow] = useState(Date.now());
  const [uploadTerminalCode, setUploadTerminalCode] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const inferTerminalCodeFromFileName = (fileName) => {
    if (!fileName) return '';
    const base = String(fileName).replace(/\.[^/.]+$/, '');
    const upper = base.toUpperCase();
    const match = upper.match(/\b(VAO01|M01|P01|D01|E01)\b/);
    return match ? match[1] : '';
  };

  const openUploadPanel = (terminalCode = '') => {
    setUploadTerminalCode(terminalCode || '');
    setUploadFile(null);
    setActivePanel('files');
    resetMessages();
  };

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, logsRes, filesRes] = await Promise.all([
        applicationSupportAPI.getMonitorStatus(),
        applicationSupportAPI.getMonitorLogs(),
        applicationSupportAPI.getMonitorRdpFiles(),
      ]);
      setStatus(statusRes.data || statusRes);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load monitor terminal data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const intervalId = setInterval(fetchStatus, 5000);
    const clockId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(intervalId);
      clearInterval(clockId);
    };
  }, [fetchStatus]);

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const terminalFilesMap = useMemo(
    () => new Map(files.map((file) => [file.terminal_code, file])),
    [files]
  );

  const handleTestRdpFile = async (file) => {
    resetMessages();
    if (!file) return;
    setMessage(`Checking RDP file ${file.file_name} for ${file.terminal_code}...`);

    try {
      const logsRes = await applicationSupportAPI.getMonitorLogs();
      const logsData = Array.isArray(logsRes.data) ? logsRes.data : [];
      setLogs(logsData);
      const latestLog = logsData.find(
        (log) => log.terminal_code === file.terminal_code && log.source_file_name === file.file_name
      );

      if (latestLog) {
        const statusLabel =
          latestLog.status === 'success'
            ? 'Success'
            : latestLog.status === 'slow'
            ? 'Slow'
            : latestLog.status === 'failed'
            ? 'Failed'
            : latestLog.status;
        const detail = latestLog.error_text ? `: ${latestLog.error_text}` : '';
        setMessage(`Test result for ${file.terminal_code}: ${statusLabel}${detail}`);
      } else {
        setMessage(`No recent run found for ${file.file_name}. Start monitoring to validate it.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || `Unable to test RDP file for ${file.terminal_code}`);
    }
  };

  const handleStart = async () => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to control monitoring.');
      return;
    }
    if (!username || !password) {
      setError('Enter terminal credentials to start monitoring');
      return;
    }
    setStarting(true);
    try {
      const { data } = await applicationSupportAPI.startMonitorTerminal({ username, password });
      setMessage(data?.message || 'Monitor terminal started');
      setPassword('');
      fetchStatus();
      setActivePanel('');
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to start monitor terminal');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to control monitoring.');
      return;
    }
    setStopping(true);
    try {
      const { data } = await applicationSupportAPI.stopMonitorTerminal();
      setMessage(data?.message || 'Monitor terminal stopped');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to stop monitor terminal');
    } finally {
      setStopping(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to upload RDP files.');
      return;
    }
    if (!uploadFile) {
      setError('Select an RDP file to upload');
      return;
    }

    setSaving(true);
    try {
      const fileText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(uploadFile);
      });
      const base64 = window.btoa(unescape(encodeURIComponent(fileText)));
      const inferredCode = inferTerminalCodeFromFileName(uploadFile.name);
      const terminalCode = uploadTerminalCode.trim().toUpperCase() || inferredCode;
      await applicationSupportAPI.uploadMonitorRdpFile({
        terminalCode,
        fileName: uploadFile.name,
        contentBase64: base64,
      });
      setMessage('RDP file uploaded successfully.');
      setUploadTerminalCode('');
      setUploadFile(null);
      fetchStatus();
      setActivePanel('');
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to upload RDP file');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    resetMessages();
    if (!canManage) {
      setError('Admin access is required to remove RDP files.');
      return;
    }
    try {
      await applicationSupportAPI.deleteMonitorRdpFile(fileId);
      setMessage('RDP file removed successfully.');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Failed to delete RDP file');
    }
  };

  const terminals = useMemo(() => {
    const base = Array.isArray(status?.terminals) ? status.terminals : [];
    return base
      .map((terminal) => ({
        ...terminal,
        color: TERMINAL_COLORS[terminal.terminalCode] || '#35d7ff',
        tone: getStatusTone(terminal.statusColor),
      }))
      .sort((a, b) => a.terminalLabel.localeCompare(b.terminalLabel));
  }, [status]);

  const overallAverage = terminals.length
    ? Math.round((terminals.reduce((sum, terminal) => sum + Number(terminal.averageLaunchSeconds || 0), 0) / terminals.length) * 10) / 10
    : 0;
  const chartData = useMemo(() => buildChartData(logs, selectedRange), [logs, selectedRange]);
  const nextCycleAt = (status?.lastCompletedAt ? new Date(status.lastCompletedAt).getTime() : status?.lastRunAt ? new Date(status.lastRunAt).getTime() : null)
    ? (status?.lastCompletedAt ? new Date(status.lastCompletedAt).getTime() : new Date(status.lastRunAt).getTime()) + (5 * 60 * 1000)
    : null;

  const alertItems = useMemo(() => {
    const items = [];
    const latestFailed = logs.find((log) => ['failed', 'error', 'invalid_credentials'].includes(log.status));
    const latestSlow = logs.find((log) => log.status === 'slow');
    if (latestFailed) {
      items.push({
        type: 'danger',
        title: `${latestFailed.terminal_label || latestFailed.terminal_code} - Launch Failed`,
        message: latestFailed.error_text || 'Exceeded timeout 130 sec',
        time: formatTime(latestFailed.run_at),
      });
    }
    if (latestSlow) {
      items.push({
        type: 'warning',
        title: `${latestSlow.terminal_label || latestSlow.terminal_code} - Slow Launch`,
        message: `Launch time ${Math.round((Number(latestSlow.elapsed_ms || 0) / 1000) * 10) / 10} sec is above normal`,
        time: formatTime(latestSlow.run_at),
      });
    }
    items.push({
      type: 'info',
      title: 'Next Cycle',
      message: 'Monitoring will run next cycle',
      time: nextCycleAt ? formatTime(nextCycleAt) : '--',
    });
    return items;
  }, [logs, nextCycleAt]);

  const recentLogs = useMemo(
    () => logs.slice(0, 6).map((log) => ({
      ...log,
      tone: getStatusTone(log.details_json?.color),
      text: buildLogMessage(log),
    })),
    [logs]
  );

  const uptimeSeconds = status?.active && status?.lastStartedAt
    ? Math.floor((now - new Date(status.lastStartedAt).getTime()) / 1000)
    : 0;

  return (
    <div className="monitor-desktop">
      <section className="monitor-main">
        <header className="monitor-topbar">
          <div className="monitor-title-wrap">
            <div className="monitor-title-row">
              <span className="monitor-menu-glyph">=</span>
              <h1>Terminal Launch Time Chart</h1>
              <span className="monitor-live-pill">Live</span>
            </div>
            <p>Real-time monitoring of RDP terminal launch performance</p>
          </div>

          <div className="monitor-top-stats">
            <div className="monitor-top-stat">
              <span>Monitoring Status</span>
              <strong className={`monitor-top-pill ${status?.active ? 'running' : 'stopped'}`}>{status?.active ? 'RUNNING' : 'STOPPED'}</strong>
            </div>
            <div className="monitor-top-stat">
              <span>Uptime</span>
              <strong>{formatDuration(uptimeSeconds)}</strong>
            </div>
            <div className="monitor-top-stat">
              <span>Last Scan</span>
              <strong>{formatClock(status?.lastCompletedAt || status?.lastRunAt)}</strong>
            </div>
            <div className="monitor-top-stat monitor-file-upload">
              <button type="button" className="monitor-action-button primary" onClick={() => openUploadPanel()}>
                Add .rdp File
              </button>
            </div>
          </div>
        </header>

        {(error || message) && (
          <div className={`monitor-banner ${error ? 'error' : 'success'}`}>
            {error || message}
          </div>
        )}

        <div className="monitor-content">
          <div className="monitor-kpi-row">
            {terminals.slice(0, 4).map((terminal) => (
              <div key={terminal.terminalCode} className="monitor-hero-card">
                <div className="monitor-hero-card-header">
                  <span className="monitor-hero-name" style={{ color: terminal.color }}>{terminal.terminalLabel}</span>
                </div>
                <div className="monitor-hero-value">{formatSeconds(terminal.currentLaunchSeconds)}</div>
                <div className="monitor-hero-meta">Avg: {formatSeconds(terminal.averageLaunchSeconds, '-- sec')}</div>
                <div className="monitor-hero-meta">Retry: {terminal.retryCount || 0}</div>
                <div className="monitor-hero-meta">Last Run: {formatTime(terminal.lastRunAt)}</div>
                <div className="monitor-sparkline">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={buildSparklineData(logs, terminal.terminalCode)}>
                      <defs>
                        <linearGradient id={`spark-${terminal.terminalCode}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={terminal.color} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={terminal.color} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke={terminal.color} strokeWidth={2} fill={`url(#spark-${terminal.terminalCode})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}

            <div className="monitor-hero-card side">
              <div className="monitor-hero-card-header">
                <span className="monitor-hero-name blue">Overall Average</span>
              </div>
              <div className="monitor-hero-value">{formatSeconds(overallAverage)}</div>
              <div className="monitor-hero-meta">All Terminals Avg</div>
              <div className="monitor-sparkline">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="overall-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2ea8ff" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#2ea8ff" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={terminals[0]?.terminalCode || 'VAO01'} stroke="#2ea8ff" strokeWidth={2} fill="url(#overall-gradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="monitor-chart-panel">
            <div className="monitor-panel-header">
              <div className="monitor-panel-title">Launch Time (Seconds)</div>
              <div className="monitor-chart-toolbar">
                <div className="monitor-chart-legend">
                  {terminals.slice(0, 4).map((terminal) => (
                    <span key={terminal.terminalCode}>
                      <i style={{ background: terminal.color }} />
                      {terminal.terminalLabel}
                    </span>
                  ))}
                  <span className="threshold">
                    <i />
                    Timeout Threshold (130 sec)
                  </span>
                </div>
                <div className="monitor-chart-actions">
                  <select value={selectedRange} onChange={(event) => setSelectedRange(Number(event.target.value))}>
                    {RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button type="button" className="monitor-fullscreen-btn" onClick={() => setIsFullscreen(true)} title="Full Screen">
                    Full Screen
                  </button>
                </div>
              </div>
            </div>

            <div className="monitor-chart-wrap full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 28, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(34, 63, 108, 0.65)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#cbd7ec', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis 
                    domain={[0, 150]} 
                    ticks={[5, 10, 15, 20, 25, 30]} 
                    tick={{ fill: '#cbd7ec', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ background: '#071526', border: '1px solid rgba(60, 100, 168, 0.55)', borderRadius: 10 }}
                    labelStyle={{ color: '#f4f7ff' }}
                  />
                  <ReferenceLine y={130} stroke="#ff5a4f" strokeDasharray="6 6" />
                  <Legend content={() => null} />
                  {terminals.slice(0, 4).map((terminal) => (
                    <Line
                      key={terminal.terminalCode}
                      type="monotone"
                      dataKey={terminal.terminalCode}
                      stroke={terminal.color}
                      strokeWidth={2.6}
                      dot={{ r: 3, fill: terminal.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: terminal.color }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="monitor-grid bottom monitor-info-grid">
            <div className="monitor-panel" id="monitor-alert-summary">
              <div className="monitor-panel-header">
                <div className="monitor-panel-title">Alerts Summary</div>
              </div>
              <div className="monitor-alert-list">
                {alertItems.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`monitor-alert-card ${item.type}`}>
                    <div className="monitor-alert-icon">{item.type === 'danger' ? '!' : item.type === 'warning' ? '!' : 'i'}</div>
                    <div className="monitor-alert-copy">
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                    </div>
                    <time>{item.time}</time>
                  </div>
                ))}
              </div>
              <button type="button" className="monitor-link-button">View All Alerts -&gt;</button>
            </div>

            <div className="monitor-panel">
              <div className="monitor-panel-header">
                <div className="monitor-panel-title">Terminal Status</div>
              </div>
              <div className="monitor-table-wrap">
                <table className="monitor-table">
                  <thead>
                    <tr>
                      <th>Terminal</th>
                      <th>Current Launch Time</th>
                      <th>Average Launch Time</th>
                      <th>Retry Count</th>
                      <th>Status</th>
                      <th>Last Run Time</th>
                      <th>Next Run In</th>
                      <th>RDP File</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {terminals.map((terminal) => {
                      const rdpFile = terminalFilesMap.get(terminal.terminalCode);
                      return (
                        <tr key={terminal.terminalCode}>
                          <td style={{ color: terminal.color, fontWeight: 800 }}>{terminal.terminalLabel}</td>
                          <td>{formatSeconds(terminal.currentLaunchSeconds)}</td>
                          <td>{formatSeconds(terminal.averageLaunchSeconds)}</td>
                          <td>{terminal.retryCount || 0}</td>
                          <td>
                            <span className={`monitor-status-dot ${terminal.tone}`} />
                            <span className={`monitor-status-text ${terminal.tone}`}>{terminal.tone === 'running' ? 'Running' : terminal.tone === 'slow' ? 'Slow' : terminal.tone === 'failed' ? 'Failed' : 'Launching'}</span>
                          </td>
                          <td>{formatTime(terminal.lastRunAt)}</td>
                          <td>{terminal.tone === 'failed' ? '--' : formatCountdown(nextCycleAt, now)}</td>
                          <td>{rdpFile?.file_name || '--'}</td>
                          <td className="monitor-file-actions">
                            {canManage ? (
                              rdpFile ? (
                                <>
                                  <button
                                    type="button"
                                    className="monitor-action-button"
                                    onClick={() => handleTestRdpFile(rdpFile)}
                                  >
                                    Test
                                  </button>
                                  <button
                                    type="button"
                                    className="monitor-action-button secondary"
                                    onClick={() => handleDeleteFile(rdpFile.id)}
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="monitor-action-button primary"
                                  onClick={() => openUploadPanel(terminal.terminalCode)}
                                >
                                  Upload
                                </button>
                              )
                            ) : (
                              rdpFile ? 'Uploaded' : 'No file'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="monitor-panel" id="monitor-recent-logs">
              <div className="monitor-panel-header">
                <div className="monitor-panel-title">Recent Logs</div>
                <button type="button" className="monitor-link-button compact">View All -&gt;</button>
              </div>
              <div className="monitor-recent-log-list">
                {recentLogs.map((log) => (
                  <div key={log.id} className="monitor-recent-log-row">
                    <time>{formatTime(log.run_at)}</time>
                    <span className={`monitor-log-glyph ${log.tone}`}>{log.tone === 'running' ? 'O' : log.tone === 'slow' ? '!' : log.tone === 'failed' ? 'X' : 'i'}</span>
                    <p>{log.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="monitor-grid">
            {canManage ? (
              <div className="monitor-panel monitor-control-panel">
                <div className="monitor-panel-header">
                  <div className="monitor-panel-title">Monitoring Control</div>
                </div>
                <div className="monitor-panel-body">
                  <div className="monitor-control-row">
                    <span>Auto Monitoring</span>
                    <button
                      type="button"
                      className={`monitor-toggle ${status?.active ? 'enabled' : ''}`}
                      onClick={status?.active ? handleStop : () => setActivePanel('credentials')}
                    >
                      <span />
                    </button>
                  </div>
                  <div className="monitor-control-status">{status?.active ? 'Enabled' : 'Disabled'}</div>
                  <div className="monitor-control-divider" />
                  <div className="monitor-control-row">
                    <span>Next Cycle In</span>
                    <strong>{formatCountdown(nextCycleAt, now)}</strong>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="monitor-panel monitor-critical-panel">
              <div className="monitor-panel-header">
                <div className="monitor-panel-title">Critical Alert</div>
              </div>
              <div className="monitor-critical-copy">
                {status?.criticalAlert?.message || 'Invalid credentials will stop the monitoring service immediately.'}
              </div>
            </div>
          </div>

          <footer className="monitor-footer">
            <span>Terminal Launch Time Monitoring System</span>
            <span>Version 1.0.0</span>
          </footer>
        </div>
      </section>

      {activePanel && (
        <div className="monitor-overlay" onClick={() => setActivePanel('')}>
          <div className="monitor-overlay-card" onClick={(event) => event.stopPropagation()}>
            <div className="monitor-overlay-header">
              <h3>{activePanel === 'credentials' ? 'Credentials' : 'RDP Terminals'}</h3>
              <button type="button" onClick={() => setActivePanel('')}>x</button>
            </div>

            {activePanel === 'credentials' ? (
              <div className="monitor-overlay-body">
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Network Security ID" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
                <div className="monitor-overlay-actions">
                  <button type="button" className="primary" onClick={handleStart} disabled={starting || loading}>{starting ? 'Starting...' : 'Start Monitor'}</button>
                  <button type="button" className="secondary" onClick={handleStop} disabled={stopping || loading}>{stopping ? 'Stopping...' : 'Stop Monitor'}</button>
                </div>
              </div>
            ) : (
              <div className="monitor-overlay-body">
                <form onSubmit={handleUpload} className="monitor-overlay-form">
                  <div className="monitor-overlay-note">
                    Terminal code will be inferred from the .rdp filename if left blank. Supported codes: VAO01, M01, P01, D01, E01.
                  </div>
                  <input
                    value={uploadTerminalCode}
                    onChange={(event) => setUploadTerminalCode(event.target.value.toUpperCase())}
                    placeholder="Terminal code (optional)"
                    disabled={!canManage || saving}
                  />
                  <input
                    type="file"
                    accept=".rdp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setUploadFile(file);
                      if (file && !uploadTerminalCode) {
                        const inferredCode = inferTerminalCodeFromFileName(file.name);
                        if (inferredCode) {
                          setUploadTerminalCode(inferredCode);
                        }
                      }
                    }}
                    disabled={!canManage || saving}
                  />
                  <button type="submit" className="primary" disabled={!canManage || saving}>{saving ? 'Uploading...' : 'Upload RDP File'}</button>
                </form>
                <div className="monitor-overlay-file-list">
                  {files.map((file) => (
                    <div key={file.id} className="monitor-overlay-file-row">
                      <div>
                        <strong>{getFileHeading(file.file_name)}</strong>
                        <span>{file.terminal_code}</span>
                      </div>
                      {canManage ? <button type="button" className="secondary" onClick={() => handleDeleteFile(file.id)}>Remove</button> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="monitor-fullscreen-overlay">
          <div className="monitor-fullscreen-header">
            <h2>Terminal Launch Time Chart - Full Screen</h2>
          </div>

          <div className="monitor-fullscreen-content">
            <div className="monitor-kpi-row">
              {terminals.slice(0, 4).map((terminal) => (
                <div key={terminal.terminalCode} className="monitor-hero-card">
                  <div className="monitor-hero-card-header">
                    <span className="monitor-hero-name" style={{ color: terminal.color }}>{terminal.terminalLabel}</span>
                  </div>
                  <div className="monitor-hero-value">{formatSeconds(terminal.currentLaunchSeconds)}</div>
                  <div className="monitor-hero-meta">Avg: {formatSeconds(terminal.averageLaunchSeconds, '-- sec')}</div>
                  <div className="monitor-hero-meta">Retry: {terminal.retryCount || 0}</div>
                  <div className="monitor-hero-meta">Last Run: {formatTime(terminal.lastRunAt)}</div>
                  <div className="monitor-sparkline">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={buildSparklineData(logs, terminal.terminalCode)}>
                        <defs>
                          <linearGradient id={`spark-${terminal.terminalCode}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={terminal.color} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={terminal.color} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={terminal.color} strokeWidth={2} fill={`url(#spark-${terminal.terminalCode})`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}

              <div className="monitor-hero-card side">
                <div className="monitor-hero-card-header">
                  <span className="monitor-hero-name blue">Overall Average</span>
                </div>
                <div className="monitor-hero-value">{formatSeconds(overallAverage)}</div>
                <div className="monitor-hero-meta">All Terminals Avg</div>
                <div className="monitor-sparkline">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="overall-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2ea8ff" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#2ea8ff" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey={terminals[0]?.terminalCode || 'VAO01'} stroke="#2ea8ff" strokeWidth={2} fill="url(#overall-gradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="monitor-chart-panel fullscreen">
              <div className="monitor-panel-header">
                <div className="monitor-panel-title">Launch Time (Seconds)</div>
                <div className="monitor-chart-toolbar">
                  <div className="monitor-chart-legend">
                    {terminals.slice(0, 4).map((terminal) => (
                      <span key={terminal.terminalCode}>
                        <i style={{ background: terminal.color }} />
                        {terminal.terminalLabel}
                      </span>
                    ))}
                    <span className="threshold">
                      <i />
                      Timeout Threshold (130 sec)
                    </span>
                  </div>
                  <select value={selectedRange} onChange={(event) => setSelectedRange(Number(event.target.value))}>
                    {RANGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button type="button" className="monitor-close-fullscreen compact" onClick={() => setIsFullscreen(false)}>
                    Exit Full Screen
                  </button>
                </div>
              </div>

              <div className="monitor-chart-wrap fullscreen-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 28, left: 60, bottom: 8 }}>
                    <CartesianGrid stroke="rgba(34, 63, 108, 0.65)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#cbd7ec', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis 
                      domain={[0, 150]} 
                      ticks={[5, 10, 15, 20, 25, 30]} 
                      tick={{ fill: '#cbd7ec', fontSize: 12 }} 
                      axisLine={{ stroke: 'rgba(100, 150, 200, 0.3)' }}
                      tickLine={false} 
                    />
                    <Tooltip
                      contentStyle={{ background: '#071526', border: '1px solid rgba(60, 100, 168, 0.55)', borderRadius: 10 }}
                      labelStyle={{ color: '#f4f7ff' }}
                    />
                    <ReferenceLine y={130} stroke="#ff5a4f" strokeDasharray="6 6" />
                    <Legend content={() => null} />
                    {terminals.slice(0, 4).map((terminal) => (
                      <Line
                        key={terminal.terminalCode}
                        type="monotone"
                        dataKey={terminal.terminalCode}
                        stroke={terminal.color}
                        strokeWidth={2.6}
                        dot={{ r: 3, fill: terminal.color, strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: terminal.color }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
