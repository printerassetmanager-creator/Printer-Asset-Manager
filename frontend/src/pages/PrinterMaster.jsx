import React, { useEffect, useState } from 'react';
import { printersAPI } from '../utils/api';
import { IS_ADMIN } from '../context/AppContext';
import CustomDatePicker from './DatePicker';
import { buildLoftwareValue, getDefaultLoftwareForSap, LOFTWARE_OPTIONS, parseLoftwareValue } from '../utils/loftware';

const empty = {pmno:'',serial:'',make:'Honeywell',model:'',dpi:'203',ip:'',wc:'',stage:'',bay:'',pmdate:'',sapno:'',mesno:'',loftware:'',remarks:''};

export default function PrinterMaster() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [secondaryLoftware, setSecondaryLoftware] = useState('');
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));
  const allowTwoLoftware = Boolean(form.sapno && form.mesno);

  const load = () => printersAPI.getAll().then(r=>setData(r.data)).catch(()=>{});
  useEffect(()=>{ load(); },[]);
  useEffect(() => {
    if (!allowTwoLoftware) setSecondaryLoftware('');
  }, [allowTwoLoftware]);
  useEffect(() => {
    if (form.sapno && !form.loftware) {
      fld('loftware', getDefaultLoftwareForSap(form.sapno));
    }
  }, [form.sapno, form.loftware]);

  // Enhanced search logic (fuzzy + exact)
  const filtered = data.filter(p => {
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
      p.dpi,
      p.ip,
      p.wc,
      p.stage,
      p.bay,
      p.sapno,
      p.mesno,
      p.loftware,
      p.remarks,
    ];
    return fuzzyFields.some(f => String(f || '').toLowerCase().includes(q));
  });

  const save = async () => {
    if (!form.pmno || !form.serial) { setMsg('PM No and Serial No required'); return; }
    const payload = { ...form, loftware: buildLoftwareValue(form.loftware, allowTwoLoftware ? secondaryLoftware : '') };
    try {
      if (editId) await printersAPI.update(editId, payload);
      else await printersAPI.create(payload);
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch (e) { setMsg(e.response?.data?.error || 'Error saving'); }
  };

  const del = async () => {
    if (!editId) return;
    if (!window.confirm('Delete this printer from master? This cannot be undone.')) return;
    await printersAPI.delete(editId); load(); clear(); setOpen(false);
  };

  const edit = (p) => {
    const loftware = parseLoftwareValue(p.loftware);
    setEditId(p.id);
    setForm({pmno:p.pmno||'',serial:p.serial||'',make:p.make||'Honeywell',model:p.model||'',dpi:p.dpi||'203',ip:p.ip||'',wc:p.wc||'',stage:p.stage||'',bay:p.bay||'',pmdate:p.pmdate||'',sapno:p.sapno||'',mesno:p.mesno||'',loftware:loftware.primary,remarks:p.remarks||''});
    setSecondaryLoftware(loftware.secondary);
    setOpen(true);
  };

  const clear = () => { setEditId(null); setForm(empty); setSecondaryLoftware(''); setMsg(''); };

  const exportCSV = () => {
    const hdr = 'PM No,Serial No,Make,Model,DPI,IP,Workcell,PM Date\n';
    const rows = data.map(p=>`${p.pmno},${p.serial},${p.make},${p.model},${p.dpi},${p.ip||''},${p.wc},${p.pmdate}`).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(hdr+rows); a.download='printers-master.csv'; a.click();
  };

  if (!IS_ADMIN) return (
    <div className="screen">
      <div className="notice n-err">🔒 Admin access required to view this section.</div>
    </div>
  );

  return (
    <div className="screen">
      <div className="notice n-warn">⚠ Admin Only — Changes here affect all screens. Add, edit or delete printers from the master database.</div>

      <div className="card-hd" style={{padding:0,marginBottom:'4px'}}>
        <div></div>
        <button className="btn btn-primary" onClick={()=>{clear();setOpen(o=>!o);}}>+ Add Printer</button>
      </div>

      <div className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? 'Edit Printer — '+form.pmno : 'Add New Printer'}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'12px'}}>
          <div className="field"><label>PM No *</label><input className="pm-in" value={form.pmno} onChange={e=>fld('pmno',e.target.value)} placeholder="e.g. 1256"/></div>
          <div className="field"><label>Serial No *</label><input value={form.serial} onChange={e=>fld('serial',e.target.value)} placeholder="e.g. HW-2301-A"/></div>
          <div className="field"><label>Make / Brand</label>
            <select value={form.make} onChange={e=>fld('make',e.target.value)}>
              <option>Honeywell</option><option>Zebra</option><option>Datamax</option><option>Other</option>
            </select>
          </div>
          <div className="field"><label>Model</label><input value={form.model} onChange={e=>fld('model',e.target.value)} placeholder="e.g. PM43"/></div>
          <div className="field"><label>DPI</label>
            <select value={form.dpi} onChange={e=>fld('dpi',e.target.value)}>
              <option>203</option><option>300</option><option>600</option>
            </select>
          </div>
          <div className="field"><label>IP Address</label><input value={form.ip} onChange={e=>fld('ip',e.target.value)} placeholder="e.g. 192.168.1.107"/></div>
          <div className="field"><label>Workcell</label><input value={form.wc} onChange={e=>fld('wc',e.target.value)} placeholder="e.g. WC-01A"/></div>
          <div className="field"><label>Stage</label><input value={form.stage} onChange={e=>fld('stage',e.target.value)} placeholder="e.g. F1"/></div>
          <div className="field"><label>Bay</label><input value={form.bay} onChange={e=>fld('bay',e.target.value)} placeholder="e.g. Bay-A"/></div>

          <div className="field"><label>PM Date</label><CustomDatePicker selected={form.pmdate} onChange={(date) => fld('pmdate', date)} placeholderText="Select PM Date" /></div>
          <div className="field"><label>SAP Printer No</label><input value={form.sapno} onChange={e=>fld('sapno',e.target.value)} placeholder="SAP No"/></div>
          <div className="field"><label>MES Printer No</label><input value={form.mesno} onChange={e=>fld('mesno',e.target.value)} placeholder="MES No"/></div>
          <div className="field"><label>{allowTwoLoftware ? 'Loftware Version 1' : 'Loftware Version'}</label>
            <select value={form.loftware} onChange={e=>fld('loftware',e.target.value)}>
              <option value="">-- Select --</option>
              {LOFTWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          {allowTwoLoftware && (
            <div className="field"><label>Loftware Version 2</label>
              <select value={secondaryLoftware} onChange={e=>setSecondaryLoftware(e.target.value)}>
                <option value="">-- Optional --</option>
                {LOFTWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          )}
          <div className="field full"><label>Remarks</label><input value={form.remarks} onChange={e=>fld('remarks',e.target.value)} placeholder="Any remarks..."/></div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button className="btn btn-success" onClick={save}>Save Printer</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete Printer</button>}
          {msg && <span style={{fontSize:'12px',color: msg.startsWith('Error')||msg.includes('required')?'var(--red)':'var(--green)',marginLeft:'8px'}}>{msg}</span>}
        </div>
      </div>

      <div className="card" style={{padding:'14px'}}>
        <div className="card-hd">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search printers..."
            style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'7px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none',width:'280px'}}/>
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export</button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>PM No</th><th>Serial No</th><th>Make</th><th>Model</th><th>DPI</th><th>IP</th><th>Workcell</th><th>PM Date</th><th>Edit</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="9" style={{textAlign:'center',padding:'20px',color:'var(--text3)'}}>No printers found</td></tr>
                : filtered.map(p=>(
                  <tr key={p.id}>
                    <td className="em">{p.pmno}</td>
                    <td className="mono">{p.serial}</td>
                    <td>{p.make}</td>
                    <td>{p.model}</td>
                    <td style={{color:'var(--text3)'}}>{p.dpi}</td>
                    <td className="mono">{p.ip||'—'}</td>
                    <td>{p.wc}</td>
                    <td>{p.pmdate}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={()=>edit(p)}>Edit</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
