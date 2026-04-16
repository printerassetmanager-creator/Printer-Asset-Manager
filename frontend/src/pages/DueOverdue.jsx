import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';

export default function DueOverdue() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dashboardAPI.getDueOverdue().then((r) => {
      setRows(r.data.filter((p) => p.pm_status === 'due' || p.pm_status === 'overdue'));
    }).catch(() => {});
  }, []);

  const overdue = rows.filter((p) => p.pm_status === 'overdue');
  const due = rows.filter((p) => p.pm_status === 'due');

  const exportCSV = () => {
    const hdr = 'PM No,Serial No,Make,Model,Stage,Bay,Workcell,Location,PM Date,Status\n';
    const body = rows.map((p) => `${p.pmno},${p.serial},${p.make},${p.model},${p.stage},${p.bay},${p.wc},${p.loc},${p.pmdate},${p.pm_status}`).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(hdr + body);
    a.download = 'due-overdue.csv';
    a.click();
  };

  const renderTable = (title, list, badgeCls) => (
    <div className="card" style={{ padding: '14px' }}>
      <div className="card-hd">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="card-title">{title}</div>
          <span className={`badge ${badgeCls}`}>{list.length}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export</button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>PM No</th><th>Serial No</th><th>Make / Model</th><th>Stage</th><th>Bay</th><th>Workcell</th><th>Location</th><th>PM Date</th><th>Days Overdue</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.length === 0
              ? <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>None</td></tr>
              : list.map((p, i) => {
                const days = p.pmdate ? Math.floor((Date.now() - new Date(p.pmdate)) / 86400000) : 0;
                return (
                  <tr key={p.id || i}>
                    <td className="em">{p.pmno}</td>
                    <td className="mono">{p.serial}</td>
                    <td>{p.make} {p.model}</td>
                    <td>{p.stage}</td>
                    <td>{p.bay}</td>
                    <td>{p.wc}</td>
                    <td style={{ fontSize: '11px' }}>{p.loc}</td>
                    <td>{p.pmdate}</td>
                    <td style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '11px', color: p.pm_status === 'overdue' ? 'var(--red)' : 'var(--amber)', fontWeight: 600 }}>{days > 0 ? `+${days}d` : '-'}</td>
                    <td><span className={`badge ${badgeCls}`}>{p.pm_status === 'overdue' ? 'Overdue' : 'Due'}</span></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="screen">
      {overdue.length > 0 && (
        <div className="notice n-err">{overdue.length} printer{overdue.length !== 1 ? 's' : ''} are overdue for PM - immediate action required</div>
      )}
      {renderTable('PM Overdue', overdue, 'b-overdue')}
      {renderTable('PM Due', due, 'b-due')}
    </div>
  );
}
