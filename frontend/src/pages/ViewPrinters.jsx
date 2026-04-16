import React, { useEffect, useState } from 'react';
import { printersAPI } from '../utils/api';

export default function ViewPrinters() {
  const [printers, setPrinters] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await printersAPI.getDashboardLive();
      setPrinters(Array.isArray(data) ? data : []);
    } catch {
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshLive = async () => {
    try {
      await printersAPI.refreshDashboardLive();
    } catch {
      // no-op
    }
    await load();
  };

  useEffect(() => {
    load();
    const t = setInterval(refreshLive, 120000);
    return () => clearInterval(t);
  }, []);

  // Enhanced search logic
  const filtered = printers.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    // Exact match fields
    const pmno = String(p.pmno || '').toLowerCase();
    const serial = String(p.serial || '').toLowerCase();
    const printerNo = String(p.printer_no || '').toLowerCase();
    if (q === pmno || q === serial || q === printerNo) return true;

    // Fuzzy search for other fields
    const fuzzyFields = [
      p.make,
      p.model,
      p.ip,
      p.firmware_version,
      p.printer_km,
      p.resolved_wc,
      p.location_display,
      p.online_status,
      p.condition_status,
      p.error_reason,
    ];
    return fuzzyFields.some(f => String(f || '').toLowerCase().includes(q));
  });

  const exportCSV = () => {
    const header = 'PM No,Serial No,Make,Model,PM Date,IP Address,Firmware,Printer KM,Workcell,Location,Online,Condition,Error Reason\n';
    const rows = filtered
      .map((p) => [
        p.pmno || '',
        p.serial || '',
        p.make || '',
        p.model || '',
        p.pmdate || '',
        p.ip || '',
        p.firmware_version || '',
        p.printer_km || '',
        p.resolved_wc || '',
        p.location_display || '',
        p.online_status || '',
        p.condition_status || '',
        p.error_reason || '',
      ].join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(header + rows);
    a.download = 'printers-live.csv';
    a.click();
  };

  const conditionClass = (printer) => {
    const status = String(printer.condition_status || '').toLowerCase();
    if (status === 'error') return 'b-err';
    if (status === 'ready') return 'b-ok';
    return 'b-offline';
  };

  const conditionLabel = (printer) => {
    const status = String(printer.condition_status || '').toLowerCase();
    if (status === 'error') return printer.error_reason || 'Error';
    if (status === 'ready') return 'Ready';
    return printer.error_reason || 'Unknown';
  };

  return (
    <div className="screen">
      <div className="card" style={{ padding: '14px' }}>
        <div className="search-row">
          <input
            placeholder="Search PM No, Serial, Make, Model, Workcell, Error..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 11px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}
          >
            <option value="">All Status</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Error</option>
            <option>Ready</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export</button>
          <button className="btn btn-primary btn-sm" onClick={refreshLive}>↻ Refresh Live</button>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>PM No</th>
                <th>Serial No</th>
                <th>IP</th>
                <th>Status</th>
                <th>Firmware</th>
                <th>Head KM</th>
                <th>Workcell</th>
                <th>Location</th>
                <th>Open UI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
                    {loading ? 'Updating printers...' : 'No results'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="em">{p.pmno || '-'}</td>
                    <td className="mono">{p.serial || '-'}</td>
                    <td className="mono">{p.ip || '-'}</td>
                    <td>
                      <span className={`badge b-${String(p.online_status || '').toLowerCase() === 'online' ? 'online' : 'offline'}`}>{String(p.online_status || '').toLowerCase() === 'online' ? 'Online' : 'Offline'}</span>
                      <span className={`badge ${conditionClass(p)}`} style={{ marginLeft: 4 }}>{conditionLabel(p)}</span>
                    </td>
                    <td>{p.firmware_version || '-'}</td>
                    <td>{p.printer_km || '-'}</td>
                    <td>{p.resolved_wc || '-'}</td>
                    <td style={{ fontSize: '11px' }}>{p.location_display || '-'}</td>
                    <td>
                      {String(p.online_status || '').toLowerCase() === 'online' && p.ip ? (
                        <a
                          href={`http://${p.ip}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-ghost"
                          title="Open Printer Web UI"
                        >
                          Open UI
                        </a>
                      ) : (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
