import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { applicationSupportAPI } from '../../utils/api';

const terminalColors = ['#22d3ee', '#3db87a', '#4a7fd4', '#a78bfa', '#e8a020', '#e05252'];
const chartRangeOptions = [
  { label: '1 Week', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '1 Day', value: 24 * 60 * 60 * 1000 },
  { label: '6 Hr', value: 6 * 60 * 60 * 1000 },
  { label: '3 Hr', value: 3 * 60 * 60 * 1000 },
  { label: '1 Hr', value: 60 * 60 * 1000 },
  { label: '30 Min', value: 30 * 60 * 1000 },
  { label: '10 Min', value: 10 * 60 * 1000 },
  { label: '5 Min', value: 5 * 60 * 1000 },
];
const maxRangeMs = chartRangeOptions[0].value;
const maxVisiblePoints = 300;

const formatPointTime = (timestamp, rangeMs) => {
  const date = new Date(timestamp);
  if (rangeMs > 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  if (rangeMs >= 24 * 60 * 60 * 1000) {
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const downsamplePoints = (points) => {
  if (points.length <= maxVisiblePoints) {
    return points;
  }

  const step = Math.ceil(points.length / maxVisiblePoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

const LiveTerminalChart = ({ inline = false, onExit, onFullScreen }) => {
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedRangeMs, setSelectedRangeMs] = useState(60 * 60 * 1000);

  const getCurrentValue = (terminal) => {
    const activeUsers = Number(terminal.active_users || 0);
    const serverCount = Number(terminal.server_count || 0);
    return serverCount > 0 ? Number((activeUsers / serverCount).toFixed(1)) : 0;
  };

  const fetchHistory = async (hours) => {
    try {
      const { data } = await applicationSupportAPI.getDashboardHistory(hours);
      const historicalPoints = [];

      Object.keys(data).forEach(terminalCode => {
        data[terminalCode].forEach(point => {
          let existingPoint = historicalPoints.find(p => p.timestamp === point.timestamp);
          if (!existingPoint) {
            existingPoint = { timestamp: point.timestamp };
            historicalPoints.push(existingPoint);
          }
          existingPoint[terminalCode] = Math.min(point.value, 35);
        });
      });

      // Sort by timestamp
      historicalPoints.sort((a, b) => a.timestamp - b.timestamp);

      setHistory(prev => {
        // Merge historical data with existing live data
        const merged = [...historicalPoints];
        const cutoff = Date.now() - maxRangeMs;

        // Add live data points that are newer than historical
        prev.forEach(point => {
          if (point.timestamp >= cutoff && !merged.find(p => p.timestamp === point.timestamp)) {
            merged.push(point);
          }
        });

        return merged.filter(point => point.timestamp >= cutoff).sort((a, b) => a.timestamp - b.timestamp);
      });
    } catch (error) {
      console.error('Unable to fetch historical terminal data', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const { data } = await applicationSupportAPI.getDashboard();
      setDashboard(data);

      const now = Date.now();
      const point = { timestamp: now };

      (data.terminals || []).forEach((terminal) => {
        point[terminal.code] = Math.min(getCurrentValue(terminal), 35);
      });

      setHistory((prev) => {
        const cutoff = now - maxRangeMs;
        const newHistory = [...prev, point].filter((item) => item.timestamp >= cutoff);
        return newHistory.sort((a, b) => a.timestamp - b.timestamp);
      });
    } catch (error) {
      console.error('Unable to fetch live terminal dashboard data', error);
    }
  };

  useEffect(() => {
    const hours = selectedRangeMs / (60 * 60 * 1000);
    fetchHistory(hours);
  }, [selectedRangeMs]);

  useEffect(() => {
    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const displayData = useMemo(() => {
    const cutoff = Date.now() - selectedRangeMs;
    const filtered = history.filter((point) => point.timestamp >= cutoff);

    const terminalCodes = [
      ...(dashboard?.terminals || []).map((terminal) => terminal.code),
      ...history.flatMap((point) => Object.keys(point).filter((key) => key !== 'timestamp' && key !== 'time')),
    ].filter((code, index, codes) => code && codes.indexOf(code) === index);

    return downsamplePoints(filtered).map((point) => ({
      ...terminalCodes.reduce((acc, code) => {
        acc[code] = Number(point[code] || 0);
        return acc;
      }, {}),
      timestamp: point.timestamp,
      time: formatPointTime(point.timestamp, selectedRangeMs),
    }));
  }, [dashboard, history, selectedRangeMs]);

  const terminalSeries = useMemo(() => {
    const terminalByCode = new Map((dashboard?.terminals || []).map((terminal) => [terminal.code, terminal]));
    history.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key !== 'timestamp' && key !== 'time' && !terminalByCode.has(key)) {
          terminalByCode.set(key, { code: key, name: key, active_users: 0, server_count: 0, max_users: 30 });
        }
      });
    });

    return Array.from(terminalByCode.values()).map((terminal, index) => ({
      ...terminal,
      color: terminalColors[index % terminalColors.length],
      value: getCurrentValue(terminal),
    }));
  }, [dashboard, history]);

  const handleExit = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (onExit) {
      onExit();
    }
  };

  if (!dashboard) {
    return null;
  }

  const selectedRangeLabel = chartRangeOptions.find((option) => option.value === selectedRangeMs)?.label || '1 Hr';

  const chartControls = (
    <div className="live-terminal-chart-controls">
      <label className="live-terminal-chart-range-label" htmlFor={inline ? 'terminal-chart-range-inline' : 'terminal-chart-range-fullscreen'}>
        Time Period
      </label>
      <select
        id={inline ? 'terminal-chart-range-inline' : 'terminal-chart-range-fullscreen'}
        className="live-terminal-chart-range"
        value={selectedRangeMs}
        onChange={(event) => setSelectedRangeMs(Number(event.target.value))}
      >
        {chartRangeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="live-terminal-chart-range-note">{selectedRangeLabel}</span>
    </div>
  );

  const summaryContent = (
    <div className="live-terminal-chart-summary">
      {terminalSeries.map((terminal) => (
        <div className="chart-summary-card" key={terminal.code} style={{ borderColor: terminal.color }}>
          <div className="chart-summary-card-title">{terminal.code}</div>
          <div className="chart-summary-card-value" style={{ color: terminal.color }}>
            {terminal.value}
            <span>/ {terminal.max_users || 30}</span>
          </div>
          <div className="chart-summary-card-meta">{terminal.active_users || 0} Users - {terminal.server_count || 0} Servers</div>
        </div>
      ))}
    </div>
  );

  const chartContent = (
    <div className={inline ? 'live-terminal-chart-graph' : 'fullscreen-chart-body'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.12)" />
          <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 35]} stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            wrapperStyle={{ fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 16px 48px rgba(15, 23, 42, 0.25)' }}
            contentStyle={{ background: '#020617', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#f8fafc' }}
            labelStyle={{ color: '#f8fafc' }}
          />
          {terminalSeries.map((terminal) => (
            <Line
              key={terminal.code}
              type="monotone"
              dataKey={terminal.code}
              stroke={terminal.color}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: terminal.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  if (inline) {
    return (
      <div className="live-terminal-chart-panel">
        <div className="live-terminal-chart-header">
          <div>
            <div className="live-terminal-chart-title">Live Terminal Load Chart</div>
            <div className="live-terminal-chart-subtitle">Real-time average load per server</div>
          </div>
          <div className="live-terminal-chart-header-actions">
            {chartControls}
            {onFullScreen && (
              <button type="button" className="btn btn-primary" onClick={onFullScreen}>
                Full Screen
              </button>
            )}
          </div>
        </div>
        {summaryContent}
        {chartContent}
      </div>
    );
  }

  return (
    <div className="fullscreen-chart-overlay">
      <div className="live-terminal-chart-panel fullscreen-live-terminal-panel">
        <div className="live-terminal-chart-header">
          <div>
            <div className="live-terminal-chart-title">Live Terminal Load Chart</div>
            <div className="live-terminal-chart-subtitle">Real-time average load per server</div>
          </div>
          <div className="live-terminal-chart-header-actions">
            {chartControls}
            <button type="button" className="btn btn-danger fullscreen-chart-exit" onClick={handleExit}>
              Exit Full Screen
            </button>
          </div>
        </div>
        {summaryContent}
        {chartContent}
      </div>
    </div>
  );
};

export default LiveTerminalChart;
