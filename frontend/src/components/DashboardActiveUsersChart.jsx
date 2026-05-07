import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardAPI } from '../utils/api';

const terminalPriority = ['P01', 'VA01', 'M01', 'D01', 'E01'];
const defaultTicks = [0, 5, 10, 15, 20, 25, 30];
const refreshIntervalMs = 60 * 1000;
const historyWindowMs = 60 * 60 * 1000;

const formatTimeLabel = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const sortTerminalCodes = (codes) => {
  return [...codes].sort((a, b) => {
    const aIndex = terminalPriority.indexOf(a.toUpperCase());
    const bIndex = terminalPriority.indexOf(b.toUpperCase());
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.localeCompare(b);
  });
};

const getLoadColor = (value) => {
  if (value > 30) return '#e05252';
  if (value > 20) return '#e8a020';
  return '#3db87a';
};

const buildLegendPayload = (codes, latestValues) => {
  return codes.map((code) => ({
    id: code,
    value: code,
    type: 'line',
    color: getLoadColor(latestValues[code] || 0),
  }));
};

const DashboardActiveUsersChart = ({ plants }) => {
  const [history, setHistory] = useState([]);
  const [terminalCodes, setTerminalCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const latestValuesRef = useRef({});
  const timerRef = useRef(null);

  const loadData = async () => {
    try {
      const { data } = await dashboardAPI.getActiveUsers(plants);
      const timestamp = Date.now();
      const point = { timestamp, time: formatTimeLabel(timestamp) };

      const codes = Object.keys(data || {}).sort();
      codes.forEach((code) => {
        const terminal = data[code] || {};
        const users = Number(terminal.users || 0);
        point[code] = users;
        latestValuesRef.current[code] = users;
      });

      setTerminalCodes((current) => sortTerminalCodes(Array.from(new Set([...current, ...codes]))));
      setHistory((current) => {
        const next = [...current];
        const last = next.length ? next[next.length - 1] : null;
        if (last && Math.abs(last.timestamp - timestamp) < 30000) {
          next[next.length - 1] = point;
        } else {
          next.push(point);
        }
        const cutoff = timestamp - historyWindowMs;
        return next.filter((item) => item.timestamp >= cutoff);
      });
      setError(null);
    } catch (fetchError) {
      setError('Unable to load active user chart data');
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
  }, [plants]);

  const sortedCodes = useMemo(() => sortTerminalCodes(terminalCodes), [terminalCodes]);

  const legendPayload = useMemo(
    () => buildLegendPayload(sortedCodes, latestValuesRef.current),
    [sortedCodes, history]
  );

  const chartLines = useMemo(
    () =>
      sortedCodes.map((code) => ({
        key: code,
        color: getLoadColor(latestValuesRef.current[code] || 0),
      })),
    [sortedCodes, history]
  );

  const tooltipRenderer = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(7, 14, 29, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 14,
        padding: 12,
        color: '#f8fafc',
        minWidth: 160,
      }}>
        <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 8 }}>{label}</div>
        {payload.map((item) => (
          <div key={item.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
            <span style={{ color: item.stroke, fontSize: 12, fontWeight: 700 }}>{item.name}</span>
            <span style={{ color: '#f8fafc', fontSize: 12 }}>{Number(item.value || 0).toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  };

  const visibleData = useMemo(() => {
    const cutoff = Date.now() - historyWindowMs;
    return history.filter((point) => point.timestamp >= cutoff);
  }, [history]);

  const overloadedCodes = sortedCodes.filter((code) => (latestValuesRef.current[code] || 0) > 30);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 420, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>Live Terminal Users</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Total active users per terminal (updates every 60s)</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {overloadedCodes.length > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(224,82,82,0.1)', color: '#ffb4b4', borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#e05252' }} />
              Overloaded: {overloadedCodes.join(', ')}
            </div>
          )}
          {error && (
            <div style={{ color: '#f8b4b4', fontSize: 12, padding: '6px 10px', borderRadius: 10, background: 'rgba(224,82,82,0.1)' }}>
              {error}
            </div>
          )}
          {loading && (
            <div style={{ color: '#cbd5e1', fontSize: 12, padding: '6px 10px', borderRadius: 10, background: 'rgba(148, 163, 184, 0.08)' }}>
              Loading...
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 360, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 18, right: 30, left: 10, bottom: 8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={[0, 30]}
              ticks={defaultTicks}
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={tooltipRenderer} cursor={{ stroke: 'rgba(148,163,184,0.18)', strokeWidth: 2 }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              payload={legendPayload}
              formatter={(value) => <span style={{ color: '#f8fafc', fontSize: 12 }}>{value}</span>}
            />
            {chartLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.key}
                stroke={line.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: line.color }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardActiveUsersChart;
