import React, { useEffect, useState } from 'react';
import { dashboardAPI, issuesAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

function KpiIcon({ type }) {
  const icons = {
    total: <svg viewBox="0 0 24 24" fill="none"><path d="M7 8V4h10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><rect x="5" y="12" width="14" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><rect x="4" y="8" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 15h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
    online: <svg viewBox="0 0 24 24" fill="none"><path d="M4 13h4l2-7 4 13 2-6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    offline: <svg viewBox="0 0 24 24" fill="none"><path d="M4.5 9.5c4.4-3.8 10.6-3.8 15 0M7.5 12.5c2.7-2.1 6.3-2.1 9 0M10.5 15.5c.9-.6 2.1-.6 3 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="18" r="1.4" fill="currentColor" /></svg>,
    upcoming: <svg viewBox="0 0 24 24" fill="none"><rect x="5" y="6" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 4v4M16 4v4M5 10h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M9 14h2M13 14h2M9 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
    due: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
    overdue: <svg viewBox="0 0 24 24" fill="none"><path d="M12 4 21 19H3L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="16.5" r="1" fill="currentColor" /></svg>,
  };

  return <span className={`desktop-kpi-icon desktop-kpi-icon-${type}`}>{icons[type]}</span>;
}

function EmptyCalendar() {
  return (
    <div className="desktop-empty-state">
      <div className="desktop-empty-calendar">
        <span className="pin pin-left" />
        <span className="pin pin-right" />
        <div className="calendar-grid">
          <i /><i /><i /><i /><i /><i />
        </div>
        <b />
      </div>
      <p>No upcoming PM records</p>
    </div>
  );
}

function EmptyPerformance() {
  return (
    <div className="desktop-performance-empty">
      <div className="desktop-users-icon"><span /></div>
      <div>
        <strong>No engineer activity yet</strong>
        <p>No performance data available for this period.</p>
      </div>
      <div className="desktop-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
    </div>
  );
}

export default function Dashboard() {
  const { setCurrentScreen, selectedPlants } = useApp();
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    upcoming: 0,
    due: 0,
    overdue: 0,
    openIssues: 0,
    performance: [],
  });
  const [dueData, setDueData] = useState([]);
  const [openIssuesList, setOpenIssuesList] = useState([]);

  useEffect(() => {
    dashboardAPI
      .getStats(selectedPlants)
      .then((r) => setStats((s) => ({ ...s, ...r.data, performance: r.data.performance || [] })))
      .catch(() => {});
    dashboardAPI.getDueOverdue(selectedPlants).then((r) => setDueData(r.data)).catch(() => {});
    issuesAPI
      .getAll(selectedPlants)
      .then((r) => setOpenIssuesList(r.data.filter((i) => i.status === 'open')))
      .catch(() => {});
  }, [selectedPlants]);

  const perf = stats.performance || [];
  const maxPerf = Math.max(...perf.flatMap((p) => [p.checkups || 0, p.pasted || 0]), 1);
  const dueRows = dueData.filter((p) => p.pm_status === 'due' || p.pm_status === 'overdue').slice(0, 8);
  const upcomingRows = dueData.filter((p) => p.pm_status === 'upcoming').slice(0, 4);
  const topIssues = [...openIssuesList]
    .sort((a, b) => {
      const s = { High: 0, Medium: 1, Low: 2 };
      return (s[a.severity] || 1) - (s[b.severity] || 1);
    })
    .slice(0, 4);

  const breachedCount = openIssuesList.filter((issue) => {
    const created = new Date(issue.created_at);
    const severityDays = { High: 1, Medium: 3, Low: 7 };
    const days = severityDays[issue.severity] || 3;
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + days);
    return deadline < Date.now() && issue.status === 'open';
  }).length;
  const highSevCount = openIssuesList.filter((i) => i.severity === 'High' && i.status === 'open').length;

  const kpis = [
    { key: 'total', label: 'Total Printers', value: stats.total, sub: 'Honeywell + Zebra' },
    { key: 'online', label: 'Online', value: stats.online, sub: 'Ping responding' },
    { key: 'offline', label: 'Offline', value: stats.offline, sub: 'No response' },
    { key: 'upcoming', label: 'Upcoming PM', value: stats.upcoming, sub: 'Within 5 days' },
    { key: 'due', label: 'PM Due', value: stats.due, sub: 'Label not pasted' },
    { key: 'overdue', label: 'PM Overdue', value: stats.overdue, sub: '7+ days passed' },
  ];

  return (
    <div className="screen desktop-dashboard">
      <div className="desktop-kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.key} className={`desktop-kpi desktop-kpi-${kpi.key}`}>
            <div>
              <div className="desktop-kpi-label">{kpi.label}</div>
              <div className="desktop-kpi-value">{kpi.value}</div>
              <div className="desktop-kpi-sub">{kpi.sub}</div>
            </div>
            <KpiIcon type={kpi.key} />
          </div>
        ))}
        <div className="desktop-kpi desktop-kpi-critical" onClick={() => setCurrentScreen('issues')}>
          <div className="desktop-kpi-label">Critical Issues</div>
          <div className="desktop-critical-split">
            <div><strong>{highSevCount}</strong><span>High</span></div>
            <i />
            <div><strong>{breachedCount}</strong><span>Breached</span></div>
          </div>
          <div className="desktop-kpi-sub">Action needed</div>
        </div>
      </div>

      <div className="desktop-dashboard-grid">
        <div className="desktop-panel desktop-due-panel">
          <div className="desktop-panel-header">
            <div className="desktop-panel-title"><span className="desktop-panel-glyph">PM</span>PM Due &amp; Overdue</div>
          </div>
          <div className="desktop-table-wrap">
            <table className="desktop-table">
              <thead><tr><th>PM No</th><th>Serial No</th><th>Location</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {dueRows.length ? dueRows.map((p) => (
                  <tr key={p.id}>
                    <td className="desktop-em">{p.pmno}</td>
                    <td className="desktop-mono">{p.serial}</td>
                    <td>{[p.stage, p.bay, p.wc].filter(Boolean).join(', ')}</td>
                    <td>{p.pmdate}</td>
                    <td><span className={`desktop-status ${p.pm_status === 'overdue' ? 'overdue' : 'due'}`}>{p.pm_status === 'overdue' ? 'Overdue' : 'Due'}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="desktop-empty-cell">No due or overdue PM records</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {dueRows.length > 0 && (
            <button className="desktop-wide-button" type="button" onClick={() => setCurrentScreen('dueoverdue')}>
              View All <span>-&gt;</span>
            </button>
          )}
        </div>

        <div className="desktop-side-stack">
          <div className="desktop-panel">
            <div className="desktop-panel-header">
              <div className="desktop-panel-title"><span className="desktop-panel-glyph alt">UP</span>Upcoming PM - Next 5 Days</div>
            </div>
            <div className="desktop-table-wrap desktop-upcoming-table">
              <table className="desktop-table">
                <thead><tr><th>PM No</th><th>Serial No</th><th>Location</th><th>Due Date</th></tr></thead>
                <tbody>
                  {upcomingRows.length ? upcomingRows.map((p) => (
                    <tr key={p.id}>
                      <td className="desktop-em">{p.pmno}</td>
                      <td className="desktop-mono">{p.serial}</td>
                      <td>{[p.stage, p.bay, p.wc].filter(Boolean).join(', ')}</td>
                      <td>{p.pmdate}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4"><EmptyCalendar /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="desktop-panel desktop-performance-panel">
            <div className="desktop-panel-header">
              <div className="desktop-panel-title">Engineer Performance</div>
              <span className="desktop-panel-note">Checkups + PM Pasted - This Month</span>
            </div>
            {perf.length === 0 ? (
              <EmptyPerformance />
            ) : perf.map((p) => (
              <div key={p.name} className="desktop-performance-row">
                <strong>{p.name}</strong>
                <div className="desktop-perf-meter">
                  <span>Checkups</span>
                  <div><i style={{ width: `${Math.round(((p.checkups || 0) / maxPerf) * 100)}%` }}>{p.checkups || 0}</i></div>
                </div>
                <div className="desktop-perf-meter green">
                  <span>PM Pasted</span>
                  <div><i style={{ width: `${Math.round(((p.pasted || 0) / maxPerf) * 100)}%` }}>{p.pasted || 0}</i></div>
                </div>
              </div>
            ))}
          </div>

          <div className="desktop-panel">
            <div className="desktop-panel-header">
              <div className="desktop-panel-title">Active Issues</div>
              <button className="desktop-view-button" type="button" onClick={() => setCurrentScreen('issues')}>View All <span>-&gt;</span></button>
            </div>
            {topIssues.length === 0 ? (
              <div className="desktop-empty-cell">No open issues</div>
            ) : topIssues.map((issue) => {
              const age = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000);
              return (
                <div key={issue.id} className="desktop-issue-row" onClick={() => setCurrentScreen('issues')}>
                  <div>
                    <strong>{issue.pmno} - {issue.title}</strong>
                    <p>{issue.model || '-'} - {issue.loc || '-'} - {age === 0 ? 'Today' : `${age} days ago`}</p>
                  </div>
                  <span className={`desktop-severity ${String(issue.severity || '').toLowerCase()}`}>{issue.severity}</span>
                </div>
              );
            })}
            {openIssuesList.length > 4 && (
              <button className="desktop-more-issues" type="button" onClick={() => setCurrentScreen('issues')}>
                +{openIssuesList.length - 4} more issues - View all -&gt;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
