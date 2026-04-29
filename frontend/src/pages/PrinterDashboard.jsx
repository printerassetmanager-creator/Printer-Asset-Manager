import React, { useEffect, useState } from 'react';
import { printersAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

function includesText(value, query) {
  return String(value || '').toLowerCase().includes(String(query || '').toLowerCase());
}

function locationText(p) {
  return p.location_display || '-';
}

function onlineOfflineStatus(p) {
  return String(p.online_status || '').toLowerCase() === 'offline' ? 'Offline' : 'Online';
}

function conditionLabel(p) {
  const status = String(p.condition_status || '').toLowerCase();
  if (status === 'unknown') return p.error_reason || 'Unknown';
  return String(p.condition_status || '').toLowerCase() === 'error'
    ? (p.error_reason || 'Error')
    : 'Ready';
}

function conditionClass(p) {
  const status = String(p.condition_status || '').toLowerCase();
  if (status === 'error') return 'b-err';
  if (status === 'ready') return 'b-ok';
  return 'b-offline';
}

function fmtDateTime(v) {
  if (!v) return '-';
  const d = new Date(v);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const EVENT_LABEL = {
  ONLINE_STATUS_CHANGED: 'Online/Offline Changed',
  IP_CHANGED: 'IP Changed',
  CONDITION_CHANGED: 'Condition Changed',
};

export default function PrinterDashboard() {
  const { selectedPlants } = useApp();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    wc: '',
    bay: '',
    printerNo: '',
    pmno: '',
    stage: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    wc: '',
    bay: '',
    printerNo: '',
    pmno: '',
    stage: '',
  });

  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedPm, setSelectedPm] = useState('');
  const [statusLogs, setStatusLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const getLocationData = (printer) => ({
    wc: printer.resolved_wc || '-',
    stage: printer.resolved_stage || '-',
    bay: printer.resolved_bay || '-',
    plant: printer.plant_location || 'B26',
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await printersAPI.getDashboardLive(selectedPlants);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
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
    const dbInterval = setInterval(load, 60000);

    return () => clearInterval(dbInterval);
  }, [selectedPlants]);

  const openLogs = async (pmno) => {
    setSelectedPm(pmno);
    setShowLogsModal(true);
    setLogsLoading(true);
    try {
      const { data } = await printersAPI.getStatusLogs(pmno);
      setStatusLogs(Array.isArray(data) ? data : []);
    } catch {
      setStatusLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const filtered = rows.filter((p) => {
    const printerNoMatch =
      includesText(p.serial, appliedFilters.printerNo) ||
      includesText(p.sapno, appliedFilters.printerNo) ||
      includesText(p.mesno, appliedFilters.printerNo);

    const locData = getLocationData(p);

    return (
      includesText(locData.wc, appliedFilters.wc) &&
      includesText(locData.bay, appliedFilters.bay) &&
      includesText(p.pmno, appliedFilters.pmno) &&
      includesText(p.resolved_stage, appliedFilters.stage) &&
      printerNoMatch
    );
  });

  const total = filtered.length;
  const offline = filtered.filter((p) => String(p.online_status || '').toLowerCase() === 'offline').length;
  const error = filtered.filter((p) => String(p.condition_status || '').toLowerCase() === 'error').length;
  const online = total - offline;

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="screen">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi c-total">
          <div className="kpi-lbl">Total Printers</div>
          <div className="kpi-val">{total}</div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
        <div className="kpi c-online">
          <div className="kpi-lbl">Online</div>
          <div className="kpi-val">{online}</div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
        <div className="kpi c-offline">
          <div className="kpi-lbl">Offline</div>
          <div className="kpi-val">{offline}</div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
        <div className="kpi c-overdue">
          <div className="kpi-lbl">Printer With Error</div>
          <div className="kpi-val">{error}</div>
          <div className="kpi-sub">&nbsp;</div>
        </div>
      </div>

      <div className="card search-printers-card">
        <div className="sec">Search Printers</div>
        <div className="fgrid fg5" style={{ marginBottom: '8px' }}>
          <div className="field">
            <label>Workcell</label>
            <input value={filters.wc} onChange={(e) => setFilter('wc', e.target.value)} placeholder="Search by workcell" />
          </div>
          <div className="field">
            <label>Bay</label>
            <input value={filters.bay} onChange={(e) => setFilter('bay', e.target.value)} placeholder="Search by bay" />
          </div>
          <div className="field">
            <label>Printer No</label>
            <input value={filters.printerNo} onChange={(e) => setFilter('printerNo', e.target.value)} placeholder="Serial / SAP / MES" />
          </div>
          <div className="field">
            <label>PM No</label>
            <input value={filters.pmno} onChange={(e) => setFilter('pmno', e.target.value)} placeholder="Search by PM No" />
          </div>
          <div className="field">
            <label>Stage</label>
            <input value={filters.stage} onChange={(e) => setFilter('stage', e.target.value)} placeholder="Search by stage" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button className="btn btn-ghost btn-sm" onClick={refreshLive} style={{ marginRight: '8px' }}>Refresh Live</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAppliedFilters({ ...filters })}>Search</button>
        </div>
      </div>

      <div className="card">
        <div className="sec">Printer List {loading ? '(Updating...)' : ''}</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
<th>PM No</th>
                <th>Make / Model</th>
                <th>Online Status</th>
                <th>Current State</th>
                <th>Firmware</th>
                <th>Head KM</th>
                <th>IP Address</th>
                <th>Location</th>

              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
<td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>
                    No printers found
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td className="em">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openLogs(p.pmno)}
                          style={{ padding: '2px 8px' }}
                        >
                          {p.pmno || '-'}
                        </button>
                      </td>
                      <td>{p.make} {p.model}</td>
                      <td>
                        <span className={`badge ${onlineOfflineStatus(p) === 'Online' ? 'b-online' : 'b-offline'}`}>
                          ● {onlineOfflineStatus(p)}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        <span className={`badge ${conditionClass(p)}`}>{conditionLabel(p)}</span>
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {p.firmware_version || '-'}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {p.printer_km ? `${p.printer_km} km` : '-'}
                      </td>
                      <td className="mono">{p.ip || '-'}</td>
                      <td style={{ fontSize: '11px' }}>
                        {(() => {
                          const locData = getLocationData(p);
                          return `${locData.wc}, ${locData.stage}, ${locData.bay}`;
                        })()}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLogsModal && (
        <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowLogsModal(false); }}>
          <div className="modal" style={{ width: '900px' }}>
            <div className="modal-title">Status Logs - {selectedPm} (Last 1 Month)</div>
            <button className="modal-close" onClick={() => setShowLogsModal(false)}>X</button>

            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Reason</th>
                    <th>IP (Old - New)</th>
                    <th>Online (Old - New)</th>
                    <th>Condition (Old - New)</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</td></tr>
                  ) : statusLogs.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No logs found for past 1 month</td></tr>
                  ) : (
                    statusLogs.map((l) => (
                      <tr key={l.id}>
                        <td>{fmtDateTime(l.logged_at)}</td>
                        <td>{EVENT_LABEL[l.event_type] || l.event_type}</td>
                        <td>{l.reason || '-'}</td>
                        <td className="mono">{`${l.old_ip || '-'} -> ${l.new_ip || '-'}`}</td>
                        <td>{`${l.old_online_status || '-'} -> ${l.new_online_status || '-'}`}</td>
                        <td>{`${l.old_condition_status || '-'} -> ${l.new_condition_status || '-'}${l.new_error_reason ? ` (${l.new_error_reason})` : ''}`}</td>
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
