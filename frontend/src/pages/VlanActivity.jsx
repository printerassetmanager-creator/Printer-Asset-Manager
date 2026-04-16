import React, { useEffect, useState } from 'react';
import { vlanAPI } from '../utils/api';
import { useApp, PLANT_LOCATIONS } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const empty = {port:'',ip:'',mac:'',sw:'',loc:'',stage:'',bay:'',wc:'',plant_location:'B26'};

export default function VlanActivity() {
  const { selectedPlants } = useApp();
  const [data, setData] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));

  const load = () => vlanAPI.getAll(selectedPlants).then(r=>setData(r.data)).catch(()=>{});
  useEffect(()=>{ load(); },[selectedPlants]);

  const save = async () => {
    if (!form.port || !form.ip) { setMsg('Port and IP are required'); return; }
    try {
      const payload = {
        ...form,
        port: toSentenceCase(form.port),
        sw: toSentenceCase(form.sw),
        loc: toSentenceCase(form.loc),
        stage: toSentenceCase(form.stage),
        bay: toSentenceCase(form.bay),
        wc: toSentenceCase(form.wc)
      };
      if (editId) await vlanAPI.update(editId, payload);
      else await vlanAPI.create(payload);
      load(); clear(); setOpen(false); setMsg('Saved successfully');
      setTimeout(()=>setMsg(''),2500);
    } catch { setMsg('Error saving'); }
  };

  const del = async () => {
    if (!editId) return;
    await vlanAPI.delete(editId);
    load(); clear(); setOpen(false);
  };

  const edit = (v) => { setEditId(v.id); setForm({port:v.port||'',ip:v.ip||'',mac:v.mac||'',sw:v.sw||'',loc:v.loc||'',stage:v.stage||'',bay:v.bay||'',wc:v.wc||'',plant_location:v.plant_location||'B26'}); setOpen(true); };
  const clear = () => { setEditId(null); setForm(empty); setMsg(''); };

  return (
    <div className="screen">
      <div className="card-hd" style={{padding:0,marginBottom:'4px'}}>
        <div></div>
        <button className="btn btn-primary" onClick={()=>{clear();setOpen(o=>!o);}}>+ Add Port</button>
      </div>

      <div className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? 'Edit VLAN Entry: '+form.port : 'Add VLAN Port Entry'}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg2" style={{marginBottom:'10px'}}>
          <div className="field"><label>Port Number *</label><input value={form.port} onChange={e=>fld('port',e.target.value)} placeholder="e.g. Port-04"/></div>
          <div className="field"><label>IP Address *</label><input value={form.ip} onChange={e=>fld('ip',e.target.value)} placeholder="e.g. 192.168.1.104"/></div>
          <div className="field"><label>MAC Address</label><input value={form.mac} onChange={e=>fld('mac',e.target.value)} placeholder="e.g. 00:1A:2B:3C:4D:04"/></div>
          <div className="field"><label>Switch Name</label><input value={form.sw} onChange={e=>fld('sw',e.target.value)} placeholder="e.g. Switch-A"/></div>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'14px'}}>
          <div className="field"><label>Location</label><input value={form.loc} onChange={e=>fld('loc',e.target.value)} placeholder="Floor 2 - Line B"/></div>
          <div className="field"><label>Stage</label><input value={form.stage} onChange={e=>fld('stage',e.target.value)} placeholder="e.g. SMT-2"/></div>
          <div className="field"><label>Bay</label><input value={form.bay} onChange={e=>fld('bay',e.target.value)} placeholder="e.g. Bay-3"/></div>
          <div className="field"><label>Plant Location</label>
            <select value={form.plant_location} onChange={e=>fld('plant_location',e.target.value)}>
              {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
            </select>
          </div>
        </div>
        <div className="fgrid fg2" style={{marginBottom:'14px'}}>
          <div className="field"><label>Workcell</label><input value={form.wc} onChange={e=>fld('wc',e.target.value)} placeholder="e.g. WC-05"/></div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button className="btn btn-success" onClick={save}>Save Entry</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>}
          {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
        </div>
      </div>

      <div className="card" style={{padding:'14px'}}>
        <div className="card-hd"><div className="card-title">VLAN Port List</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{data.length} entries</div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Port</th><th>IP Address</th><th>MAC Address</th><th>Switch</th><th>Stage</th><th>Bay</th><th>Workcell</th><th>Location</th><th>Edit</th></tr></thead>
            <tbody>
              {data.map(v=>(
                <tr key={v.id}>
                  <td className="em">{v.port}</td><td className="mono">{v.ip}</td><td className="mono" style={{fontSize:'10px'}}>{v.mac}</td>
                  <td>{v.sw||'—'}</td><td>{v.stage||'—'}</td><td>{v.bay||'—'}</td><td>{v.wc||'—'}</td>
                  <td style={{fontSize:'11px'}}>{v.loc}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>edit(v)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
