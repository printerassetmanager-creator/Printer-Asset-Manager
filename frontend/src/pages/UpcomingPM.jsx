import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../utils/api';

export default function UpcomingPM() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dashboardAPI.getDueOverdue().then((r) => {
      setRows(r.data.filter((p) => p.pm_status === 'upcoming'));
    }).catch(() => {});
  }, []);

  const exportCSV = () => {
    const hdr = 'PM No,Serial No,Make,Model,Stage,Bay,Workcell,PM Due Date\n';
    const body = rows.map((p) => `${p.pmno},${p.serial},${p.make},${p.model},${p.stage},${p.bay},${p.wc},${p.pmdate}`).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(hdr + body);
    a.download = 'upcoming-pm.csv';
    a.click();
  };

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text2)' }}>PMs due within the next <strong style={{ color: 'var(--purple)' }}>5 days</strong></div>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Download Report</button>
      </div>
      <div className="card" style={{ padding: '14px' }}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>PM No</th><th>Serial No</th><th>Make / Model</th>
                <th>Stage</th><th>Bay</th><th>Workcell</th>
                <th>PM Due Date</th><th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No upcoming PMs in the next 5 days</td></tr>
                : rows.map((p, i) => {
                  const daysLeft = p.pmdate ? Math.max(0, Math.ceil((new Date(p.pmdate) - Date.now()) / 86400000)) : '-';
                  return (
                    <tr key={p.id || i}>
                      <td className="em">{p.pmno}</td>
                      <td className="mono">{p.serial}</td>
                      <td>{p.make} {p.model}</td>
                      <td>{p.stage}</td>
                      <td>{p.bay}</td>
                      <td>{p.wc}</td>
                      <td><span className="badge b-upcoming">{p.pmdate}</span></td>
                      <td style={{ color: 'var(--purple)', fontWeight: 600, fontFamily: 'JetBrains Mono,monospace', fontSize: '11px' }}>{daysLeft}{typeof daysLeft === 'number' ? (daysLeft === 1 ? ' day' : ' days') : ''}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
