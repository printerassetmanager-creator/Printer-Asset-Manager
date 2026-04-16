import React, { useEffect, useState } from 'react';
import { sparePartsAPI } from '../utils/api';
import { useApp, PLANT_LOCATIONS } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const empty = {code:'',name:'',compat:'All',avail:0,min:2,loc:'',serial:'',condition:'New',plant_location:'B26'};

export default function SpareParts() {
  const { selectedPlants } = useApp();
  const [data, setData] = useState([]);
  const [usageLog, setUsageLog] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [showUseModal, setShowUseModal] = useState(false);
  const [useForm, setUseForm] = useState({code:'',name:'',qty:1,pmno:'',serial:'',wc:'',used_by:'Aniket'});
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));

  const load = () => { sparePartsAPI.getAll(selectedPlants).then(r=>setData(r.data)).catch(()=>{}); sparePartsAPI.getUsageLog().then(r=>setUsageLog(r.data)).catch(()=>{}); };
  useEffect(()=>{ load(); },[selectedPlants]);

  const save = async () => {
    if (!form.code || !form.name) { setMsg('Code and Name required'); return; }
    try {
      const payload = {
        ...form,
        name: toSentenceCase(form.name),
        loc: toSentenceCase(form.loc),
        serial: toSentenceCase(form.serial)
      };
      if (editId) await sparePartsAPI.update(editId, payload);
      else await sparePartsAPI.create(payload);
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch { setMsg('Error'); }
  };

  const del = async () => { if (!editId) return; await sparePartsAPI.delete(editId); load(); clear(); setOpen(false); };
  const edit = (p) => { setEditId(p.id); setForm({code:p.code||'',name:p.name||'',compat:p.compat||'All',avail:p.avail||0,min:p.min||2,loc:p.loc||'',serial:p.serial||'',condition:p.condition||'New',plant_location:p.plant_location||'B26'}); setOpen(true); };
  const clear = () => { setEditId(null); setForm(empty); setMsg(''); };

  const logUse = async () => {
    if (!useForm.code) return;
    try {
      await sparePartsAPI.use(useForm);
      setShowUseModal(false);
      setUseForm({code:'',name:'',qty:1,pmno:'',serial:'',wc:'',used_by:'Aniket'});
      load();
    } catch {}
  };

  const exportCSV = () => {
    const hdr = 'Code,Name,Compatible,Stock,Min,Location,Status\n';
    const rows = data.map(p=>`${p.code},${p.name},${p.compat},${p.avail},${p.min},${p.loc},${p.avail===0?'Out':p.avail<=p.min?'Low':'OK'}`).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(hdr+rows); a.download='parts.csv'; a.click();
  };

  return (
    <div className="screen">
      <div className="card-hd" style={{padding:0,marginBottom:'4px'}}>
        <div></div>
        <button className="btn btn-primary" onClick={()=>{clear();setOpen(o=>!o);}}>+ Add Part</button>
      </div>

      <div className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">Add / Edit Spare Part</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'10px'}}>
          <div className="field"><label>Part Code *</label><input value={form.code} onChange={e=>fld('code',e.target.value)} placeholder="e.g. PH-HW-001"/></div>
          <div className="field"><label>Part Name *</label><input value={form.name} onChange={e=>fld('name',e.target.value)} placeholder="e.g. Print Head 203dpi"/></div>
          <div className="field"><label>Compatible With</label>
            <select value={form.compat} onChange={e=>fld('compat',e.target.value)}><option>All</option><option>Honeywell</option><option>Zebra</option><option>Datamax</option></select>
          </div>
          <div className="field"><label>Plant Location</label>
            <select value={form.plant_location} onChange={e=>fld('plant_location',e.target.value)}>
              {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
            </select>
          </div>
          <div className="field"><label>Storage Location</label><input value={form.loc} onChange={e=>fld('loc',e.target.value)} placeholder="Rack A - Shelf 1"/></div>
          <div className="field"><label>Qty in Stock</label><input type="number" value={form.avail} onChange={e=>fld('avail',parseInt(e.target.value)||0)} min="0"/></div>
          <div className="field"><label>Min Stock Level</label><input type="number" value={form.min} onChange={e=>fld('min',parseInt(e.target.value)||0)} min="0"/></div>
          <div className="field"><label>Condition</label><select value={form.condition} onChange={e=>fld('condition',e.target.value)}><option>New</option><option>Used</option></select></div>
          <div className="field"><label>Compatible Serial No</label><input value={form.serial} onChange={e=>fld('serial',e.target.value)} placeholder="optional"/></div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button className="btn btn-success" onClick={save}>Save Part</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>}
          {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
        </div>
      </div>

      <div className="card" style={{padding:'14px'}}>
        <div className="card-hd">
          <div className="card-title">Parts Inventory</div>
          <div style={{display:'flex',gap:'8px'}}>
            <button className="btn btn-amber btn-sm" onClick={()=>setShowUseModal(true)}>Use Part</button>
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Export</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Code</th><th>Part Name</th><th>Compatible</th><th>Stock</th><th>Min</th><th>Condition</th><th>Location</th><th>Status</th><th>Edit</th></tr></thead>
            <tbody>
              {data.map(p=>(
                <tr key={p.id}>
                  <td className="blue">{p.code}</td><td className="em">{p.name}</td><td>{p.compat}</td>
                  <td className={p.avail<=p.min?(p.avail===0?'red':'amber'):'green'} style={{fontWeight:600}}>{p.avail}</td>
                  <td style={{color:'var(--text3)'}}>{p.min}</td>
                  <td><span className={`badge ${(p.condition||'New')==='New'?'b-instock':'b-low'}`}>{p.condition||'New'}</span></td>
                  <td style={{fontSize:'11px'}}>{p.loc}</td>
                  <td><span className={`badge ${p.avail===0?'b-out':p.avail<=p.min?'b-low':'b-instock'}`}>{p.avail===0?'Out of Stock':p.avail<=p.min?'Low Stock':'In Stock'}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>edit(p)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{padding:'14px'}}>
        <div className="card-title" style={{marginBottom:'12px'}}>Parts Usage Log</div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Code</th><th>Part Name</th><th>Qty</th><th>PM No</th><th>Serial No</th><th>Workcell</th><th>Date</th><th>By</th></tr></thead>
            <tbody>
              {usageLog.map(u=>(
                <tr key={u.id}>
                  <td className="blue">{u.code}</td><td className="em">{u.name}</td><td>{u.qty}</td>
                  <td className="blue">{u.pmno||'—'}</td><td>{u.serial||'—'}</td><td>{u.wc||'—'}</td>
                  <td>{u.used_at ? new Date(u.used_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
                  <td style={{color:'var(--blue)'}}>{u.used_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUseModal && <div className="modal-bg show" onClick={e=>{if(e.target===e.currentTarget)setShowUseModal(false)}}>
        <div className="modal">
          <div className="modal-title">Log Used Spare Part</div>
          <button className="modal-close" onClick={()=>setShowUseModal(false)}>✕</button>
          <div className="fgrid fg2" style={{gap:'12px'}}>
            <div className="field"><label>Part Code</label><input value={useForm.code} onChange={e=>setUseForm(f=>({...f,code:e.target.value}))} placeholder="Part code"/></div>
            <div className="field"><label>Part Name</label><input value={useForm.name} onChange={e=>setUseForm(f=>({...f,name:e.target.value}))} placeholder="Part name"/></div>
            <div className="field"><label>Qty Used</label><input type="number" value={useForm.qty} onChange={e=>setUseForm(f=>({...f,qty:parseInt(e.target.value)||1}))} min="1"/></div>
            <div className="field"><label>Serial No</label><input value={useForm.serial} onChange={e=>setUseForm(f=>({...f,serial:e.target.value}))} placeholder="Printer serial"/></div>
            <div className="field"><label>PM No</label><input value={useForm.pmno} onChange={e=>setUseForm(f=>({...f,pmno:e.target.value}))} placeholder="1256"/></div>
            <div className="field"><label>Workcell</label><input value={useForm.wc} onChange={e=>setUseForm(f=>({...f,wc:e.target.value}))} placeholder="WC-14B"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>
            <button className="btn btn-ghost" onClick={()=>setShowUseModal(false)}>Cancel</button>
            <button className="btn btn-success" onClick={logUse}>Log Usage</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
