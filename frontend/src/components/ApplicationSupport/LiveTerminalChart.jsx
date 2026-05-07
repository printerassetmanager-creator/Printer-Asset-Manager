import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { applicationSupportAPI, dashboardAPI } from '../../utils/api';

const refreshIntervalMs = 60 * 1000;
const historyRetentionMs = 2 * 60 * 60 * 1000;
const warningLoadThreshold = 27;
const criticalLoadThreshold = 31;
const recommendedLoadPerServer = 30;
const terminalPriority = ['P01', 'VAO01', 'VA01', 'M01', 'D01', 'E01'];
const yTicks = [0, 5, 10, 15, 20, 25, 30, 35];

const rangeOptions = [
  { value: 10080, label: '1 Week' },
  { value: 1440, label: '1 Day' },
  { value: 720, label: '12 Hr' },
  { value: 360, label: '6 Hr' },
  { value: 180, label: '3 Hr' },
  { value: 60, label: '1 Hr' },
  { value: 30, label: '30 Minutes' },
  { value: 10, label: '10 Min' },
];

const terminalColorMap = {
  P01: '#22c55e',
  VAO01: '#ffc21a',
  VA01: '#ffc21a',
  M01: '#1597ff',
  D01: '#ff5048',
  E01: '#9b5cff',
};

const formatTimeLabel = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sortTerminalCodes = (codes) => [...codes].sort((a, b) => {
  const aIndex = terminalPriority.indexOf(a.toUpperCase());
  const bIndex = terminalPriority.indexOf(b.toUpperCase());
  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }
  return a.localeCompare(b);
});

const getAvgLoad = (users, servers) => {
  if (!servers) return 0;
  return Number((users / servers).toFixed(1));
};

const getTerminalColor = (code) => terminalColorMap[code] || '#94a3b8';

const getLoadColor = (value) => {
  if (value >= criticalLoadThreshold) return '#ff5048';
  if (value >= warningLoadThreshold) return '#ffc21a';
  return getTerminalColor('P01');
};

const getTerminalStatus = (avgLoad) => {
  if (avgLoad >= criticalLoadThreshold) return 'Critical';
  if (avgLoad >= warningLoadThreshold) return 'Warning';
  return 'Healthy';
};

const buildSparklinePoints = (values) => {
  const cleanValues = values.length ? values : [0, 0];
  const maxValue = Math.max(35, ...cleanValues);
  const width = 128;
  const height = 42;
  const xStep = cleanValues.length > 1 ? width / (cleanValues.length - 1) : width;

  return cleanValues
    .map((value, index) => {
      const x = Number((index * xStep).toFixed(1));
      const y = Number((height - (Number(value || 0) / maxValue) * height).toFixed(1));
      return `${x},${y}`;
    })
    .join(' ');
};

const LiveTerminalChart = ({ inline = false, onExit, onFullScreen }) => {
  const [history, setHistory] = useState([]);
  const [terminalCodes, setTerminalCodes] = useState([]);
  const [latestData, setLatestData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rangeMinutes, setRangeMinutes] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const loadHistory = async (minutes) => {
    const rangeHours = Math.max(1, Math.ceil(minutes / 60));
    const { data } = await applicationSupportAPI.getDashboardHistory(rangeHours);
    const buckets = new Map();
    const codes = Object.keys(data || {});

    codes.forEach((code) => {
      (data[code] || []).forEach((entry) => {
        const timestamp = Number(entry.timestamp);
        if (!Number.isFinite(timestamp)) return;
        if (!buckets.has(timestamp)) {
          buckets.set(timestamp, { timestamp, time: formatTimeLabel(timestamp) });
        }
        buckets.get(timestamp)[code] = Number(entry.value || 0);
      });
    });

    return {
      codes,
      points: Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp),
    };
  };

  const loadData = async () => {
    try {
      const [{ data }, historical] = await Promise.all([
        dashboardAPI.getActiveUsers(),
        loadHistory(rangeMinutes),
      ]);
      const timestamp = Date.now();
      const point = { timestamp, time: formatTimeLabel(timestamp) };
      const latest = {};
      const codes = Object.keys(data || {});

      codes.forEach((code) => {
        const terminal = data[code] || {};
        const users = Number(terminal.users || 0);
        const servers = Number(terminal.servers || 0);
        const avgLoad = getAvgLoad(users, servers);
        point[code] = avgLoad;
        latest[code] = { avgLoad, users, servers, name: terminal.name || code };
      });

      const allCodes = sortTerminalCodes(Array.from(new Set([...codes, ...historical.codes])));
      setTerminalCodes((current) => sortTerminalCodes(Array.from(new Set([...current, ...allCodes]))));
      setLatestData(latest);
      setLastUpdated(timestamp);
      setHistory((current) => {
        const next = historical.points.length ? [...historical.points] : [...current];
        const last = next.length ? next[next.length - 1] : null;
        if (last && Math.abs(last.timestamp - timestamp) < 30000) {
          next[next.length - 1] = { ...last, ...point };
        } else {
          next.push(point);
        }
        const cutoff = timestamp - historyRetentionMs;
        return next.filter((item) => item.timestamp >= cutoff);
      });
      setError(null);
    } catch (fetchError) {
      console.error('Live terminal load chart fetch error:', fetchError);
      setError('Unable to load active terminal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    timerRef.current = window.setInterval(loadData, refreshIntervalMs);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [rangeMinutes]);

  const sortedCodes = useMemo(() => sortTerminalCodes(terminalCodes), [terminalCodes]);
  const chartLines = useMemo(
    () => sortedCodes.map((code) => ({ key: code, color: getTerminalColor(code) })),
    [sortedCodes]
  );

  const visibleData = useMemo(() => {
    const cutoff = Date.now() - rangeMinutes * 60 * 1000;
    return history.filter((point) => point.timestamp >= cutoff);
  }, [history, rangeMinutes]);

  const legendItems = sortedCodes.map((code) => {
    const value = latestData[code]?.avgLoad || 0;
    return {
      code,
      name: latestData[code]?.name || code,
      value,
      users: latestData[code]?.users || 0,
      servers: latestData[code]?.servers || 0,
      status: getTerminalStatus(value),
      color: getTerminalColor(code),
    };
  });

  const hasCriticalTerminal = legendItems.some((terminal) => terminal.value >= criticalLoadThreshold);
  const hasWarningTerminal = legendItems.some((terminal) => terminal.value >= warningLoadThreshold);
  const statusColor = hasCriticalTerminal ? '#ff5048' : hasWarningTerminal ? '#ffc21a' : '#22c55e';
  const statusLabel = hasCriticalTerminal ? 'Critical' : hasWarningTerminal ? 'Warning' : 'Healthy';
  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  const renderCards = () => (
    <div className="live-terminal-card-grid">
      {legendItems.map((item) => (
        <div key={item.code} className={`live-terminal-card ${item.status.toLowerCase()}`} style={{ '--terminal-color': item.color }}>
          <div className="live-terminal-card-head">
            <strong>{item.code}</strong>
            <span />
          </div>
          <div className="live-terminal-card-value" style={{ color: getLoadColor(item.value) }}>
            {Math.round(item.value)}
            <small>/ {recommendedLoadPerServer}</small>
          </div>
          <div className="live-terminal-card-meta">
            <span>{item.users} Users</span>
            <i />
            <span>{item.servers} Servers</span>
          </div>
          <div className="live-terminal-card-foot">
            <span className={`live-terminal-card-status ${item.status.toLowerCase()}`}>{item.status}</span>
            <svg className="live-terminal-sparkline" viewBox="0 0 128 42" preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points={buildSparklinePoints(visibleData.map((point) => Number(point[item.code] || 0)).slice(-16))}
                fill="none"
                stroke={item.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLegend = () => (
    <div className="live-terminal-chart-legend compact">
      {legendItems.map((item) => (
        <div key={item.code} className="chart-legend-pill compact" style={{ '--terminal-color': item.color }}>
          <span className="chart-legend-dot" />
          <strong>{item.code}</strong>
        </div>
      ))}
    </div>
  );

  const tooltipRenderer = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const uniquePayload = Array.from(
      payload.reduce((entries, entry) => {
        if (!entries.has(entry.dataKey) || entry.stroke !== 'none') {
          entries.set(entry.dataKey, entry);
        }
        return entries;
      }, new Map()).values()
    );

    return (
      <div className="terminal-chart-tooltip">
        <div className="terminal-chart-tooltip-time">{label}</div>
        {uniquePayload.map((entry) => {
          const terminal = latestData[entry.dataKey] || { users: 0, servers: 0 };
          return (
            <div key={entry.dataKey} className="terminal-chart-tooltip-row">
              <div>
                <span style={{ background: entry.stroke }} />
                <strong>{entry.name}</strong>
              </div>
              <em>{Number(entry.value || 0).toFixed(1)} <small>({terminal.users} / {terminal.servers})</small></em>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`live-terminal-chart-panel ${inline ? 'live-terminal-chart-inline' : 'live-terminal-chart-fullscreen'}`}>
      <div className="live-terminal-chart-header">
        <div className="live-terminal-chart-title-wrap">
          <span className="live-terminal-chart-glyph">LC</span>
          <div>
            <div className="live-terminal-chart-title">Live Terminal Load Chart</div>
            <div className="live-terminal-chart-subtitle">Real-time average load per server (Users / Server)</div>
          </div>
        </div>

        <div className="live-terminal-chart-header-actions">
          <div className="live-terminal-chart-updated">{formattedLastUpdated}</div>
          <div className="live-terminal-chart-status-pill" style={{ background: `${statusColor}20`, color: statusColor, borderColor: `${statusColor}55` }}>
            <span />
            {statusLabel}
          </div>
          <select
            className="live-terminal-chart-range-select"
            value={rangeMinutes}
            onChange={(event) => setRangeMinutes(Number(event.target.value))}
          >
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {onFullScreen && !onExit && (
            <button type="button" className="live-terminal-icon-button" onClick={onFullScreen} title="Full screen" aria-label="Full screen">
              FS
            </button>
          )}
          {onExit && (
            <button type="button" className="live-terminal-icon-button" onClick={onExit} title="Exit full screen" aria-label="Exit full screen">
              X
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="live-terminal-chart-loading">
          <div className="app-dashboard-empty">Loading chart data...</div>
        </div>
      ) : error ? (
        <div className="live-terminal-chart-error">
          <div className="alert alert-error">{error}</div>
        </div>
      ) : terminalCodes.length === 0 ? (
        <div className="live-terminal-chart-empty">
          <div className="app-dashboard-empty">No terminal data available. Please check your connection.</div>
        </div>
      ) : visibleData.length === 0 ? (
        <div className="live-terminal-chart-empty">
          <div className="app-dashboard-empty">Waiting for data... Refreshes every 1 minute.</div>
        </div>
      ) : (
        <>
          {renderCards()}
          {renderLegend()}

          <div className="live-terminal-chart-graph">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={visibleData} margin={{ top: 28, right: 58, left: 0, bottom: 16 }}>
                <CartesianGrid stroke="rgba(82,111,164,0.18)" strokeDasharray="3 4" />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 35]}
                  ticks={yTicks}
                  stroke="#94a3b8"
                  tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={warningLoadThreshold} stroke="#ffc21a" strokeDasharray="6 5" label={{ value: `${warningLoadThreshold} (Warning)`, position: 'right', fill: '#ffc21a', fontSize: 12 }} />
                <ReferenceLine y={criticalLoadThreshold} stroke="#ff5048" strokeDasharray="6 5" label={{ value: `${criticalLoadThreshold} (Critical)`, position: 'right', fill: '#ff5048', fontSize: 12 }} />
                <Tooltip content={tooltipRenderer} cursor={{ stroke: 'rgba(235,244,255,0.45)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                {chartLines.map((line) => (
                  <React.Fragment key={line.key}>
                    <Area
                      type="monotone"
                      dataKey={line.key}
                      name={line.key}
                      fill={line.color}
                      fillOpacity={0.08}
                      stroke="none"
                      tooltipType="none"
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={line.key}
                      name={line.key}
                      stroke={line.color}
                      strokeWidth={3}
                      dot={{ r: 3, fill: line.color, stroke: 'rgba(4, 10, 22, 0.96)', strokeWidth: 1 }}
                      activeDot={{ r: 7, strokeWidth: 3, fill: line.color, stroke: '#ffffff' }}
                      isAnimationActive={false}
                    />
                  </React.Fragment>
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-footer-note">
            <span>Average Load = Total Active Users / Total Servers</span>
            <span>Warning: {warningLoadThreshold} Users | Critical: {criticalLoadThreshold} Users</span>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveTerminalChart;
