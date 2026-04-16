import React, { useEffect, useState } from 'react';
import { printersAPI, vlanAPI, healthAPI } from '../utils/api';
import { PLANT_LOCATIONS } from '../context/AppContext';
import { buildLoftwareValue, getDefaultLoftwareForSap, LOFTWARE_OPTIONS, parseLoftwareValue } from '../utils/loftware';
import { toSentenceCase } from '../utils/textFormat';

const CURRENT_USER = 'Admin';

function nowStr() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function fmtDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateNextPMDate(pmdate) {
  if (!pmdate) return '-';
  try {
    const date = new Date(pmdate);
    date.setMonth(date.getMonth() + 3);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '-';
  }
}

export default function HealthCheckup() {
  const [pm, setPm] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    serial: '',
    model: '',
    make: '',
    sapno: '',
    mesno: '',
    dpi: '',
    firmware: '',
    km: '',
    loftware: '',
    ip: '',
    mac: '',
    loc: '',
    stage: '',
    bay: '',
    wc: '',
    pmdate: '',
    nextpmdate: '',
    plant_location: '',
    health: 'ok',
    issue_desc: '',
    req_parts: '',
    is_repeat: false,
    engineer: 'Aniket'
  });
  const [vlanInfo, setVlanInfo] = useState(null);
  const [usedParts, setUsedParts] = useState([]);
  const [dmgParts, setDmgParts] = useState([]);
  const [showDmgModal, setShowDmgModal] = useState(false);
  const [showUsePartModal, setShowUsePartModal] = useState(false);
  const [dmgForm, setDmgForm] = useState({ name: '', code: '', qty: 1, cond: 'Worn' });
  const [usePartForm, setUsePartForm] = useState({ code: '', name: '', qty: 1, serial: '', pmno: '', wc: '' });
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [msg, setMsg] = useState('');
  const [secondaryLoftware, setSecondaryLoftware] = useState('');

  const fld = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const allowTwoLoftware = Boolean(form.sapno && form.mesno);

  const loadActivityLog = async () => {
    setLoadingActivity(true);
    try {
      const { data } = await healthAPI.getActivityLog();
      setActivityLog(Array.isArray(data) ? data : []);
    } catch {
      setActivityLog([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    loadActivityLog();
  }, []);

  useEffect(() => {
    if (!allowTwoLoftware) setSecondaryLoftware('');
  }, [allowTwoLoftware]);

  useEffect(() => {
    if (form.sapno && !form.loftware) {
      fld('loftware', getDefaultLoftwareForSap(form.sapno));
    }
  }, [form.sapno, form.loftware]);

  const fetchPrinter = async () => {
    if (!pm.trim()) {
      setStatus(<span style={{ color: 'var(--red)' }}>Please enter PM No</span>);
      return;
    }

    try {
      const { data: p } = await printersAPI.getOne(pm.trim().toUpperCase());
      const loftware = parseLoftwareValue(p.loftware);
      setStatus(<span style={{ color: 'var(--green)' }}>✓ PM found</span>);
      const nextPMDate = calculateNextPMDate(p.pmdate);
      setForm((f) => ({
        ...f,
        serial: p.serial || '',
        model: p.model || '',
        make: p.make || '',
        dpi: `${p.dpi || ''} DPI`,
        firmware: p.firmware || '',
        km: '',
        loftware: loftware.primary || '',
        ip: p.ip || '',
        stage: p.stage || '',
        bay: p.bay || '',
        wc: p.wc || '',
        sapno: p.sapno || '',
        mesno: p.mesno || '',
        pmdate: p.pmdate || '',
        nextpmdate: nextPMDate,
        plant_location: p.plant_location || 'B26',
        pmno_disp: p.pmno || ''
      }));
      setSecondaryLoftware(loftware.secondary || '');

      if (p.ip) {
        try {
          const { data: vl } = await vlanAPI.getByIp(p.ip);
          setVlanInfo(vl);
          if (vl) setForm((f) => ({ ...f, mac: `${vl.sw} / ${vl.mac}` }));
        } catch {
          // no-op
        }
      }
    } catch {
      setStatus(<span style={{ color: 'var(--red)' }}>PM not found</span>);
    }
  };

  const save = async () => {
    try {
      await healthAPI.create({
        ...form,
        pmno: form.pmno_disp || pm.trim().toUpperCase(),
        engineer: toSentenceCase(form.engineer),
        issue_desc: toSentenceCase(form.issue_desc),
        req_parts: toSentenceCase(form.req_parts),
        loftware: buildLoftwareValue(form.loftware, allowTwoLoftware ? secondaryLoftware : ''),
        logged_at: nowStr(),
        vlan: vlanInfo
      });
      await loadActivityLog();
      setMsg('Saved');
      setTimeout(() => setMsg(''), 2500);
    } catch {
      setMsg('Error saving');
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <div className="sec">PM Lookup - Enter PM No to auto-fetch all details</div>
        <div className="frow" style={{ gap: '10px', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div className="field" style={{ maxWidth: '200px' }}>
            <label>PM Number <span style={{ fontSize: '10px', color: 'var(--amber)' }}>- Enter first</span></label>
            <input className="pm-in" placeholder="e.g. 1256" value={pm} onChange={(e) => setPm(e.target.value)} />
          </div>
          <div className="field" style={{ maxWidth: '150px' }}>
            <label>Plant Location</label>
            <select value={form.plant_location || ''} onChange={(e) => fld('plant_location', e.target.value)}>
              <option value="">Select...</option>
              {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchPrinter}>Fetch Details</button>
          <div style={{ fontSize: '12px', paddingBottom: '4px' }}>{status}</div>
        </div>
      </div>

      <div className="g2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="sec">Printer Details <span className="tag-a">Auto-fetched from PM</span></div>
            
            {/* Row 1: Basic Printer Info */}
            <div className="fgrid fg3" style={{ marginBottom: '12px' }}>
              <div className="field"><label>Serial No <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.serial} placeholder="-" /></div>
              <div className="field"><label>Model <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.model} placeholder="-" /></div>
              <div className="field"><label>Make <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.make} placeholder="-" /></div>
            </div>

            {/* Row 2: SAP & MES Numbers */}
            <div className="fgrid fg2" style={{ marginBottom: '12px' }}>
              <div className="field"><label>SAP Printer No</label><input value={form.sapno} onChange={(e) => fld('sapno', e.target.value)} placeholder="SAP No" /></div>
              <div className="field"><label>MES Printer No</label><input value={form.mesno} onChange={(e) => fld('mesno', e.target.value)} placeholder="MES No" /></div>
            </div>

            {/* Row 3: System Information */}
            <div className="fgrid fg3" style={{ marginBottom: '12px' }}>
              <div className="field"><label>DPI <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.dpi} placeholder="-" /></div>
              <div className="field"><label>Firmware <span className="tag-r">Saved</span></label><input className="af" readOnly value={form.firmware} placeholder="-" /></div>
              <div className="field"><label>Printer KM</label><input className="af" readOnly value={form.km} placeholder="-" /></div>
            </div>

            {/* Row 4: Loftware Versions */}
            <div className="fgrid fg3" style={{ marginBottom: '12px' }}>
              <div className="field"><label>{allowTwoLoftware ? 'Loftware Version 1' : 'Loftware Ver'} <span className="tag-r">Auto</span></label>
                <select value={form.loftware} onChange={(e) => fld('loftware', e.target.value)}>
                  <option value="">-- Select --</option>
                  {LOFTWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              {allowTwoLoftware && (
                <div className="field"><label>Loftware Version 2</label>
                  <select value={secondaryLoftware} onChange={(e) => setSecondaryLoftware(e.target.value)}>
                    <option value="">-- Optional --</option>
                    {LOFTWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              )}
              {!allowTwoLoftware && <div></div>}
            </div>

            {/* Row 5: Location & Workcell Info */}
            <div className="fgrid fg3" style={{ marginBottom: '12px' }}>
              <div className="field"><label>Stage</label><input value={form.stage} onChange={(e) => fld('stage', e.target.value)} placeholder="e.g. Assembly" /></div>
              <div className="field"><label>Bay</label><input value={form.bay} onChange={(e) => fld('bay', e.target.value)} placeholder="e.g. B-14" /></div>
              <div className="field"><label>Workcell</label><input value={form.wc} onChange={(e) => fld('wc', e.target.value)} placeholder="e.g. WC-01" /></div>
            </div>

            {/* Row 6: PM Dates */}
            <div className="fgrid fg2" style={{ marginBottom: '0' }}>
              <div className="field"><label>Next PM Date <span className="tag-a">+3 Months</span></label><input className="af" readOnly value={form.nextpmdate} placeholder="-" /></div>
              <div className="field"><label>PM Date <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.pmdate} placeholder="-" /></div>
            </div>
          </div>

          <div className="card">
            <div className="sec">Health Status</div>
            <div className="fgrid fg2">
              <div className="field">
                <label>Printer Health</label>
                <div className="htoggle">
                  <button className={`htbtn ok${form.health === 'ok' ? ' sel' : ''}`} onClick={() => fld('health', 'ok')}>OK</button>
                  <button className={`htbtn nok${form.health === 'nok' ? ' sel' : ''}`} onClick={() => fld('health', 'nok')}>NOT OK</button>
                </div>
              </div>
              <div className="field"><label>Engineer Name</label><input value={form.engineer} onChange={(e) => fld('engineer', e.target.value)} placeholder="PM done by..." /></div>
            </div>

            {form.health === 'nok' && (
              <div style={{ marginTop: '12px' }}>
                <div className="notice n-err">Printer marked as NOT OK - fill issue details below</div>
                <div className="fgrid fg2" style={{ marginBottom: '12px' }}>
                  <div className="field full"><label>Issue Description</label><textarea value={form.issue_desc} onChange={(e) => fld('issue_desc', e.target.value)} placeholder="Describe the issue in detail..." style={{ minHeight: '60px' }} /></div>
                  <div className="field"><label>Required Parts</label><input value={form.req_parts} onChange={(e) => fld('req_parts', e.target.value)} placeholder="e.g. Print Head, Media Sensor" /></div>
                  <div className="field"><label><input type="checkbox" checked={form.is_repeat} onChange={(e) => fld('is_repeat', e.target.checked)} style={{ width: '13px', height: '13px', marginRight: '5px' }} /> Flag as Repeating Issue</label></div>
                </div>
                <div className="sec" style={{ marginBottom: '10px' }}>Damaged Parts Observed</div>
                <div className="tbl-wrap" style={{ marginBottom: '8px' }}>
                  <table className="tbl"><thead><tr><th>Part Name</th><th>Code</th><th>Qty</th><th>Condition</th><th></th></tr></thead>
                    <tbody>{dmgParts.map((d, i) => <tr key={i}><td className="em">{d.name}</td><td>{d.code}</td><td>{d.qty}</td><td className="amber">{d.cond}</td><td><button className="btn btn-xs btn-danger" onClick={() => setDmgParts((dp) => dp.filter((_, j) => j !== i))}>Remove</button></td></tr>)}</tbody></table>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowDmgModal(true)}>+ Add Damaged Part</button>
              </div>
            )}
          </div>

          {msg && <div className="notice n-ok">{msg}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-success" onClick={save}>Save Checkup</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="sec">Spare Parts Used</div>
            <div className="tbl-wrap" style={{ marginBottom: '8px' }}>
              <table className="tbl"><thead><tr><th>Part Name</th><th>Code</th><th>Qty</th><th>PM No</th><th>Serial</th><th>Workcell</th><th>Stock After</th></tr></thead>
                <tbody>{usedParts.map((p, i) => <tr key={i}><td className="em">{p.name || p.code}</td><td>{p.code}</td><td>{p.qty}</td><td className="blue">{p.pmno || '-'}</td><td>{p.serial || '-'}</td><td>{p.wc || '-'}</td><td className="green">Updated</td></tr>)}</tbody></table>
            </div>
          </div>

          <div className="card">
            <div className="sec">Activity Log (Last 1 Month)</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>PM No</th><th>User</th><th>Engineer</th><th>Date &amp; Time</th></tr>
                </thead>
                <tbody>
                  {loadingActivity
                    ? <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading...</td></tr>
                      : activityLog.length === 0
                        ? <tr><td colSpan="4" style={{ textAlign: 'center' }}>No activity found</td></tr>
                      : activityLog.map((a) => (
                        <tr key={a.id}>
                          <td className="em">{a.pmno || '-'}</td>
                          <td>{a.user || CURRENT_USER}</td>
                          <td>{a.engineer || '-'}</td>
                          <td>{fmtDateTime(a.checked_at)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showDmgModal && <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowDmgModal(false); }}>
        <div className="modal">
          <div className="modal-title">Add Damaged Part</div>
          <button className="modal-close" onClick={() => setShowDmgModal(false)}>X</button>
          <div className="fgrid fg2" style={{ gap: '12px' }}>
            <div className="field"><label>Part Name</label><input value={dmgForm.name} onChange={(e) => setDmgForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Print Head" /></div>
            <div className="field"><label>Part Code</label><input value={dmgForm.code} onChange={(e) => setDmgForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. PM43-PH-001" /></div>
            <div className="field"><label>Qty</label><input type="number" value={dmgForm.qty} onChange={(e) => setDmgForm((f) => ({ ...f, qty: e.target.value }))} min="1" /></div>
            <div className="field"><label>Condition</label><select value={dmgForm.cond} onChange={(e) => setDmgForm((f) => ({ ...f, cond: e.target.value }))}><option>Worn</option><option>Dirty</option><option>Damaged</option><option>Broken</option><option>Faulty</option></select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-ghost" onClick={() => setShowDmgModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => {
              if (dmgForm.name) {
                setDmgParts((d) => [...d, { ...dmgForm }]);
                setDmgForm({ name: '', code: '', qty: 1, cond: 'Worn' });
                setShowDmgModal(false);
              }
            }}>Add Part</button>
          </div>
        </div>
      </div>}

      {showUsePartModal && <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowUsePartModal(false); }}>
        <div className="modal">
          <div className="modal-title">Log Used Spare Part</div>
          <button className="modal-close" onClick={() => setShowUsePartModal(false)}>X</button>
          <div className="fgrid fg2" style={{ gap: '12px' }}>
            <div className="field"><label>Part Code</label><input value={usePartForm.code} onChange={(e) => setUsePartForm((f) => ({ ...f, code: e.target.value }))} placeholder="Part code" /></div>
            <div className="field"><label>Part Name</label><input value={usePartForm.name} onChange={(e) => setUsePartForm((f) => ({ ...f, name: e.target.value }))} placeholder="Part name" /></div>
            <div className="field"><label>Qty Used</label><input type="number" value={usePartForm.qty} onChange={(e) => setUsePartForm((f) => ({ ...f, qty: e.target.value }))} min="1" /></div>
            <div className="field"><label>Serial No</label><input value={usePartForm.serial} onChange={(e) => setUsePartForm((f) => ({ ...f, serial: e.target.value }))} placeholder="Printer serial no" /></div>
            <div className="field"><label>PM No</label><input value={usePartForm.pmno} onChange={(e) => setUsePartForm((f) => ({ ...f, pmno: e.target.value }))} placeholder="1256" /></div>
            <div className="field"><label>Workcell</label><input value={usePartForm.wc} onChange={(e) => setUsePartForm((f) => ({ ...f, wc: e.target.value }))} placeholder="WC-14B" /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="btn btn-ghost" onClick={() => setShowUsePartModal(false)}>Cancel</button>
            <button className="btn btn-success" onClick={() => {
              if (usePartForm.code) {
                setUsedParts((u) => [...u, { ...usePartForm }]);
                setUsePartForm({ code: '', name: '', qty: 1, serial: '', pmno: '', wc: '' });
                setShowUsePartModal(false);
              }
            }}>Log Usage</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
