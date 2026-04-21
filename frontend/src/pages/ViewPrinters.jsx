import React, { useEffect, useState } from 'react';
import { printersAPI, vlanAPI } from '../utils/api';
import { useApp } from '../context/AppContext';

export default function ViewPrinters() {
  const { selectedPlants } = useApp();
  const [printers, setPrinters] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [printerWebData, setPrinterWebData] = useState({});
  const [vlanData, setVlanData] = useState([]);

  // Function to get location data from VLAN if IP matches, otherwise from printer data
  const getLocationData = (printer) => {
    if (!printer.ip || !vlanData.length) {
      return {
        wc: printer.resolved_wc || '-',
        stage: printer.resolved_stage || '-',
        bay: printer.resolved_bay || '-',
        plant: printer.plant_location || 'B26',
        source: 'printer'
      };
    }

    // Find matching VLAN entry by IP
    const vlanMatch = vlanData.find(v => v.ip === printer.ip);
    if (vlanMatch) {
      return {
        wc: vlanMatch.wc || '-',
        stage: vlanMatch.stage || '-',
        bay: vlanMatch.bay || '-',
        plant: vlanMatch.plant_location || 'B26',
        source: 'vlan'
      };
    }

    // Fallback to printer data if no VLAN match
    return {
      wc: printer.resolved_wc || '-',
      stage: printer.resolved_stage || '-',
      bay: printer.resolved_bay || '-',
      plant: printer.plant_location || 'B26',
      source: 'printer'
    };
  };

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

  const loadVlanData = async () => {
    try {
      const { data } = await vlanAPI.getAll(selectedPlants);
      setVlanData(Array.isArray(data) ? data : []);
    } catch {
      setVlanData([]);
    }
  };

  const fetchPrinterWebData = async (printer) => {
    const locData = getLocationData(printer);

    if (!printer.pmno || !printer.serial) {
      setPrinterWebData((prev) => ({
        ...prev,
        [printer.id]: { error: 'No serial number', offline: true },
      }));
      return;
    }

    try {
      const { data } = await printersAPI.getLiveWebData(printer.pmno);
      
      if (data.error) {
        setPrinterWebData((prev) => ({
          ...prev,
          [printer.id]: { ...data, offline: true },
        }));
        try {
          await printersAPI.update(printer.id, { online_status: 'offline' });
        } catch {}
      } else {
        // Ping successful - save data to database and mark as online
        const updateData = {
          online_status: 'online',
          firmware: data.firmwareVersion || printer.firmware_version,
          head_km: data.headRunKm || printer.printer_km,
          wc: locData.wc,
          bay: locData.bay,
          loc: locData.location,
          plant_location: locData.plant,
          last_ip: printer.ip
        };
        
        setPrinterWebData((prev) => ({
          ...prev,
          [printer.id]: data,
        }));
        
        try {
          await printersAPI.update(printer.id, updateData);
        } catch {}
      }
    } catch (e) {
      // Exception during fetch - mark as offline
      setPrinterWebData((prev) => ({
        ...prev,
        [printer.id]: { error: 'Failed to fetch', offline: true },
      }));
      try {
        await printersAPI.update(printer.id, { online_status: 'offline' });
      } catch {}
    }
  };

  useEffect(() => {
    load();
    loadVlanData();
    
    // Refresh database data every 2 minutes
    const dbInterval = setInterval(refreshLive, 120000);
    
    // Refresh VLAN data every 30 seconds
    const vlanInterval = setInterval(loadVlanData, 30000);
    
    // Continuously fetch printer web data every 5 seconds
    const webDataInterval = setInterval(async () => {
      if (printers.length > 0) {
        // Fetch data from all printers in parallel
        await Promise.all(
          printers.map(async (printer) => {
            if (printer.pmno && printer.serial) {
              await fetchPrinterWebData(printer);
            }
          })
        );
      }
    }, 5000); // Fetch web data every 5 seconds
    
    return () => {
      clearInterval(dbInterval);
      clearInterval(vlanInterval);
      clearInterval(webDataInterval);
    };
  }, [selectedPlants, printers]);

  // Enhanced search logic
  const filtered = printers.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    // Exact match fields
    const pmno = String(p.pmno || '').toLowerCase();
    const serial = String(p.serial || '').toLowerCase();
    const printerNo = String(p.printer_no || '').toLowerCase();
    if (q === pmno || q === serial || q === printerNo) return true;

    // Get location data from VLAN if available
    const locData = getLocationData(p);

    // Fuzzy search for other fields
    const fuzzyFields = [
      p.make,
      p.model,
      p.ip,
      p.firmware_version,
      p.printer_km,
      locData.wc,
      locData.bay,
      locData.location,
      p.online_status,
      p.condition_status,
      p.error_reason,
      locData.plant,
    ];
    return fuzzyFields.some(f => String(f || '').toLowerCase().includes(q));
  });

  const exportCSV = () => {
    const header = 'PM No,Serial No,Make,Model,PM Date,IP Address,Firmware,Printer KM,Workcell,Location,Plant,Online,Condition,Error Reason\n';
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
        p.plant_location || 'B26',
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
                filtered.map((p) => {
                  const webData = printerWebData[p.id];
                  const locData = getLocationData(p);
                  const pmDate = p.pmdate ? new Date(p.pmdate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                  return (
                    <tr key={p.id}>
                      <td className="em">{p.pmno || '-'}</td>
                      <td className="mono">{p.serial || '-'}</td>
                      <td>{p.make} {p.model}</td>
                      <td className="mono">{webData?.ip || p.ip || '-'}</td>
                      <td>
                        <span className={`badge b-${String(p.online_status || '').toLowerCase() === 'online' ? 'online' : 'offline'}`}>
                          {String(p.online_status || '').toLowerCase() === 'online' ? '● Online' : '● Offline'}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px' }}>{pmDate}</td>
                      <td style={{ fontSize: '11px' }}>
                        {webData ? (
                          webData.error ? (
                            <span style={{ color: 'var(--text3)' }}>{webData.error}</span>
                          ) : (
                            <span style={{ color: webData.printerCondition ? 'var(--green)' : 'var(--text3)' }}>
                              {webData.printerCondition || '-'}
                            </span>
                          )
                        ) : (
                          <span className={`badge ${conditionClass(p)}`}>{conditionLabel(p)}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {webData && !webData.error ? (webData.firmwareVersion || '-') : (p.firmware_version || '-')}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {webData && !webData.error ? (webData.headRunKm !== null && webData.headRunKm !== undefined ? `${webData.headRunKm} km` : '-') : (p.printer_km ? `${p.printer_km} km` : '-')}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {`${locData.wc}, ${locData.stage}, ${locData.bay}${locData.source === 'vlan' ? ' (VLAN)' : ''}`}
                      </td>
                      <td style={{ fontSize: '11px', fontWeight: 500, color: 'var(--blue)' }}>{locData.plant}{locData.source === 'vlan' ? ' *' : ''}</td>
                      <td>
                        {String(p.online_status || '').toLowerCase() === 'online' && (webData?.ip || p.ip) ? (
                          <a
                            href={`http://${webData?.ip || p.ip}`}
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
    </div>
  );
}
