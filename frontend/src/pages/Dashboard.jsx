import React, { useEffect, useState } from 'react';
import { dashboardAPI, issuesAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  const { setCurrentScreen } = useApp();
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
      .getStats()
      .then((r) => setStats((s) => ({ ...s, ...r.data, performance: r.data.performance || [] })))
      .catch(() => {});
    dashboardAPI.getDueOverdue().then((r) => setDueData(r.data)).catch(() => {});
    issuesAPI
      .getAll()
      .then((r) => setOpenIssuesList(r.data.filter((i) => i.status === 'open')))
      .catch(() => {});
  }, []);

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

  return (
    <div className="screen">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
        <div className="kpi c-total"><div className="kpi-lbl">Total Printers</div><div className="kpi-val">{stats.total}</div><div className="kpi-sub">Honeywell + Zebra</div></div>
        <div className="kpi c-online"><div className="kpi-lbl">Online</div><div className="kpi-val">{stats.online}</div><div className="kpi-sub">Ping responding</div></div>
        <div className="kpi c-offline"><div className="kpi-lbl">Offline</div><div className="kpi-val">{stats.offline}</div><div className="kpi-sub">No response</div></div>
        <div className="kpi c-upcoming"><div className="kpi-lbl">Upcoming PM</div><div className="kpi-val">{stats.upcoming}</div><div className="kpi-sub">Within 5 days</div></div>
        <div className="kpi c-due"><div className="kpi-lbl">PM Due</div><div className="kpi-val">{stats.due}</div><div className="kpi-sub">Label not pasted</div></div>
        <div className="kpi c-overdue"><div className="kpi-lbl">PM Overdue</div><div className="kpi-val">{stats.overdue}</div><div className="kpi-sub">7+ days passed</div></div>
        <div className="kpi" style={{ borderColor: 'rgba(224,82,82,.3)', cursor: 'pointer' }} onClick={() => setCurrentScreen('issues')}>
          <div className="kpi-lbl">Open Issues</div><div className="kpi-val" style={{ color: 'var(--red)' }}>{stats.openIssues}</div><div className="kpi-sub">Logged issues</div>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd"><div className="card-title">PM Due &amp; Overdue</div></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>PM No</th><th>Serial No</th><th>Location</th><th>Workcell</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {dueRows.length ? dueRows.map((p) => (
                <tr key={p.id}>
                  <td className="em">{p.pmno}</td>
                  <td className="mono">{p.serial}</td>
                  <td>{p.loc}</td>
                  <td>{p.wc}</td>
                  <td>{p.pmdate}</td>
                  <td><span className={`badge ${p.pm_status === 'overdue' ? 'b-overdue' : 'b-due'}`}>{p.pm_status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No due or overdue PM records</td></tr>
              )}
            </tbody>
          </table></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="card-hd"><div className="card-title">Upcoming PM - Next 5 Days</div></div>
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>PM No</th><th>Serial No</th><th>Location</th><th>Due Date</th></tr></thead>
              <tbody>
                {upcomingRows.length ? upcomingRows.map((p) => (
                  <tr key={p.id}><td className="em">{p.pmno}</td><td className="mono">{p.serial}</td><td>{p.loc}</td><td><span className="badge b-upcoming">{p.pmdate}</span></td></tr>
                )) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No upcoming PM records</td></tr>
                )}
              </tbody>
            </table></div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title">Engineer Performance</div><span style={{ fontSize: '10px', color: 'var(--text3)' }}>Checkups + PM Pasted · This Month</span></div>
            {perf.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text3)', fontSize: '12px' }}>No engineer activity yet</div>
            ) : perf.map((p) => (
              <div key={p.name} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, marginBottom: '5px' }}>{p.name}</div>
                <div className="perf-row" style={{ marginBottom: '4px' }}>
                  <div className="perf-name" style={{ fontSize: '10px', color: 'var(--text3)' }}>Checkups</div>
                  <div className="perf-bar-bg"><div className="perf-bar-fill" style={{ width: `${Math.round(((p.checkups || 0) / maxPerf) * 100)}%`, background: 'var(--blue)', color: '#b0d4ff' }}>{p.checkups || 0}</div></div>
                </div>
                <div className="perf-row">
                  <div className="perf-name" style={{ fontSize: '10px', color: 'var(--text3)' }}>PM Pasted</div>
                  <div className="perf-bar-bg"><div className="perf-bar-fill" style={{ width: `${Math.round(((p.pasted || 0) / maxPerf) * 100)}%`, background: 'var(--green)', color: '#a0f0c0' }}>{p.pasted || 0}</div></div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-hd" style={{ marginBottom: '10px' }}>
              <div className="card-title">Active Issues</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrentScreen('issues')}>View All -&gt;</button>
            </div>
            {topIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px', color: 'var(--text3)', fontSize: '12px' }}>No open issues</div>
            ) : topIssues.map((issue) => {
              const age = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000);
              const col = issue.severity === 'High' ? 'var(--red)' : issue.severity === 'Medium' ? 'var(--amber)' : 'var(--blue)';
              const bg = issue.severity === 'High' ? 'var(--red-bg)' : issue.severity === 'Medium' ? 'var(--amber-bg)' : 'var(--blue-bg)';
              return (
                <div key={issue.id} style={{ background: 'rgba(224,82,82,.05)', border: '1px solid rgba(224,82,82,.18)', borderRadius: 'var(--r)', padding: '9px 12px', marginBottom: '7px', cursor: 'pointer' }} onClick={() => setCurrentScreen('issues')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>{issue.pmno} - {issue.title}</span>
                    <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '10px', background: bg, color: col }}>{issue.severity}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{issue.model || '-'} · {issue.loc || '-'} · {age === 0 ? 'Today' : `${age} days ago`}</div>
                </div>
              );
            })}
            {openIssuesList.length > 4 && <div style={{ textAlign: 'center', padding: '6px', fontSize: '11px', color: 'var(--text3)', cursor: 'pointer' }} onClick={() => setCurrentScreen('issues')}>+{openIssuesList.length - 4} more issues - View all -&gt;</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
