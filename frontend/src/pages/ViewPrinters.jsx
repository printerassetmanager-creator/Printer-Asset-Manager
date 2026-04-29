import React, { useEffect, useState } from 'react';
import { printersAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

function fmtDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocationSummary(parts = {}) {
  const combined = [parts.wc, parts.stage, parts.bay].filter(Boolean).join(', ');
  return combined || '-';
}

function formatLocationLogEntry(log, prefix) {
  const plant = log[`${prefix}_plant_location`];
  const wc = log[`${prefix}_wc`];
  const stage = log[`${prefix}_stage`];
  const bay = log[`${prefix}_bay`];
  const loc = log[`${prefix}_loc`];
  const details = [plant, wc, stage, bay].filter(Boolean).join(' / ');
  return loc || details || '-';
}

export default function ViewPrinters() {
  const { selectedPlants } = useApp();
  const [printers, setPrinters] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [locationLogs, setLocationLogs] = useState([]);
  const [loadingLocationLogs, setLoadingLocationLogs] = useState(false);

  const getLocationData = (printer) => ({
    wc: printer.resolved_wc || '',
    stage: printer.resolved_stage || '',
    bay: printer.resolved_bay || '',
    plant: printer.plant_location || 'B26',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await printersAPI.getDashboardLive(selectedPlants);
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

  const openLocationLogs = async (printer) => {
    setSelectedPrinter(printer);
    setShowLocationModal(true);
    setLoadingLocationLogs(true);
    try {
      const { data } = await printersAPI.getLocationLogs(printer.pmno);
      setLocationLogs(Array.isArray(data) ? data : []);
    } catch {
      setLocationLogs([]);
    } finally {
      setLoadingLocationLogs(false);
    }
  };

  useEffect(() => {
    load();
    const dbInterval = setInterval(load, 60000);

    return () => clearInterval(dbInterval);
  }, [selectedPlants]);

  const filtered = printers.filter((printer) => {
    const statusFilter = filter.trim().toLowerCase();
    if (statusFilter) {
      const onlineStatus = String(printer.online_status || '').toLowerCase();
      const conditionStatus = String(printer.condition_status || '').toLowerCase();
      if (statusFilter === 'online' && onlineStatus !== 'online') return false;
      if (statusFilter === 'offline' && onlineStatus !== 'offline') return false;
      if (statusFilter === 'error' && conditionStatus !== 'error') return false;
      if (statusFilter === 'ready' && conditionStatus !== 'ready') return false;
    }

    const query = search.trim().toLowerCase();
    if (!query) return true;

    const location = getLocationData(printer);
    const exactFields = [
      printer.pmno,
      printer.serial,
      printer.printer_no,
    ];

    if (exactFields.some((field) => String(field || '').toLowerCase() === query)) {
      return true;
    }

    const fuzzyFields = [
      printer.make,
      printer.model,
      printer.ip,
      printer.firmware_version,
      printer.printer_km,
      location.wc,
      location.stage,
      location.bay,
      printer.location_display,
      printer.online_status,
      printer.condition_status,
      printer.error_reason,
      location.plant,
    ];

    return fuzzyFields.some((field) => String(field || '').toLowerCase().includes(query));
  });

  const exportCSV = () => {
    const header = 'PM No,Serial No,Make,Model,PM Date,IP Address,Firmware,Printer KM,Workcell,Location,Plant,Online,Condition,Error Reason\n';
    const rows = filtered
      .map((printer) => [
        printer.pmno || '',
        printer.serial || '',
        printer.make || '',
        printer.model || '',
        printer.pmdate || '',
        printer.ip || '',
        printer.firmware_version || '',
        printer.printer_km || '',
        printer.resolved_wc || '',
        printer.location_display || '',
        printer.plant_location || 'B26',
        printer.online_status || '',
        printer.condition_status || '',
        printer.error_reason || '',
      ].join(','))
      .join('\n');
    const anchor = document.createElement('a');
    anchor.href = `data:text/csv;charset=utf-8,${encodeURIComponent(header + rows)}`;
    anchor.download = 'printers-live.csv';
    anchor.click();
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
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 11px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}
          >
            <option value="">All Status</option>
            <option>Online</option>
            <option>Offline</option>
            <option>Error</option>
            <option>Ready</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Export</button>
          <button className="btn btn-primary btn-sm" onClick={refreshLive}>Refresh Live</button>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>PM No</th>
                <th>Serial No</th>
                <th>Make / Model</th>
                <th>IP</th>
                <th>Online</th>
                <th>PM Date</th>
                <th>Current State</th>
                <th>Firmware</th>
                <th>Head KM</th>
                <th>Location</th>
                <th>Plant</th>
                <th>Open UI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
                    {loading ? 'Updating printers...' : 'No results'}
                  </td>
                </tr>
              ) : (
                filtered.map((printer) => {
                  const location = getLocationData(printer);
                  const pmDate = printer.pmdate
                    ? new Date(printer.pmdate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '-';

                  return (
                    <tr key={printer.id}>
                      <td className="em">{printer.pmno || '-'}</td>
                      <td className="mono">{printer.serial || '-'}</td>
                      <td>{[printer.make, printer.model].filter(Boolean).join(' ') || '-'}</td>
                      <td className="mono">{printer.ip || '-'}</td>
                      <td>
                        <span className={`badge b-${String(printer.online_status || '').toLowerCase() === 'online' ? 'online' : 'offline'}`}>
                          {String(printer.online_status || '').toLowerCase() === 'online' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px' }}>{pmDate}</td>
                      <td style={{ fontSize: '11px' }}>
                        <span className={`badge ${conditionClass(printer)}`}>{conditionLabel(printer)}</span>
                      </td>
                      <td style={{ fontSize: '11px' }}>{printer.firmware_version || '-'}</td>
                      <td style={{ fontSize: '11px' }}>{printer.printer_km ? `${printer.printer_km} km` : '-'}</td>
                      <td style={{ fontSize: '11px' }}>
                        <button
                          type="button"
                          onClick={() => openLocationLogs(printer)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'var(--blue)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            font: 'inherit',
                            textDecoration: 'underline',
                          }}
                          title="View location history"
                        >
                          {formatLocationSummary(location)}
                        </button>
                      </td>
                      <td style={{ fontSize: '11px', fontWeight: 500, color: 'var(--blue)' }}>{location.plant}</td>
                      <td>
                        {String(printer.online_status || '').toLowerCase() === 'online' && printer.ip ? (
                          <a
                            href={`http://${printer.ip}`}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLocationModal && (
        <div className="modal-bg show" onClick={(event) => { if (event.target === event.currentTarget) setShowLocationModal(false); }}>
          <div className="modal" style={{ width: '900px', maxWidth: '96vw' }}>
            <div className="modal-title">Location History - {selectedPrinter?.pmno || '-'}</div>
            <button className="modal-close" onClick={() => setShowLocationModal(false)}>X</button>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '14px' }}>
              Clicked from current location: {selectedPrinter ? `${selectedPrinter.location_display || formatLocationSummary(getLocationData(selectedPrinter))} (${selectedPrinter.plant_location || 'B26'})` : '-'}
            </div>
            <div className="tbl-wrap" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Changed At</th>
                    <th>Source</th>
                    <th>Changed By</th>
                    <th>Old Location</th>
                    <th>New Location</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLocationLogs ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading location history...</td>
                    </tr>
                  ) : locationLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No location history found for this printer</td>
                    </tr>
                  ) : (
                    locationLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '11px' }}>{fmtDateTime(log.changed_at)}</td>
                        <td>{String(log.source || '').replace(/_/g, ' ') || '-'}</td>
                        <td>{log.changed_by || '-'}</td>
                        <td style={{ fontSize: '11px' }}>{formatLocationLogEntry(log, 'old')}</td>
                        <td style={{ fontSize: '11px' }}>{formatLocationLogEntry(log, 'new')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
