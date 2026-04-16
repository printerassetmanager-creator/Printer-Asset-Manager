import React, { useEffect, useState } from 'react';
import { recipesAPI } from '../utils/api';
import { IS_ADMIN } from '../context/AppContext';

const empty = {name:'',make:'Honeywell',model:'',dpi:'203',media:'Direct Thermal',width:'',length:'',top:'',left_margin:'',darkness:'',speed:'',loft:'',verifier:'None',calibration:'Smart Calibration',contrast:'+10',size:'',desc:''};
const makeColors = {Honeywell:'b-online',Zebra:'b-upcoming',Datamax:'b-due',Any:'b-user'};
const dpiColors = {'203':'b-hp','300':'b-instock','600':'b-warn'};

export default function LabelRecipes() {
  const [data, setData] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [makeF, setMakeF] = useState('');
  const [dpiF, setDpiF] = useState('');
  const [msg, setMsg] = useState('');
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));

  const load = () => recipesAPI.getAll().then(r=>setData(r.data)).catch(()=>{});
  useEffect(()=>{ load(); },[]);

  const filtered = data.filter(r=>{
    const q = search.toLowerCase();
    const m = !q || (r.name+r.make+r.model+r.dpi+(r.loft||'')+r.desc).toLowerCase().includes(q);
    return m && (!makeF||r.make===makeF) && (!dpiF||r.dpi===dpiF);
  });

  const save = async () => {
    if (!form.name) { setMsg('Label name required'); return; }
    const size = form.width && form.length ? form.width+'mm × '+form.length+'mm' : form.size;
    try {
      if (editId) await recipesAPI.update(editId, {...form, size});
      else await recipesAPI.create({...form, size});
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch { setMsg('Error saving'); }
  };

  const del = async () => { if (!editId) return; await recipesAPI.delete(editId); load(); clear(); setOpen(false); };

  const edit = (r) => {
    if (!IS_ADMIN) return;
    setEditId(r.id);
    setForm({name:r.name||'',make:r.make||'Honeywell',model:r.model||'',dpi:r.dpi||'203',media:r.media||'Direct Thermal',width:r.width||'',length:r.length||'',top:r.top||'',left_margin:r.left_margin||'',darkness:r.darkness||'',speed:r.speed||'',loft:r.loft||'',verifier:r.verifier||'None',calibration:r.calibration||'Smart Calibration',contrast:r.contrast||'+10',size:r.size||'',desc:r.desc||''});
    setOpen(true);
  };

  const clear = () => { setEditId(null); setForm(empty); setMsg(''); };
  const isHW = form.make === 'Honeywell';

  return (
    <div className="screen">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flex:1}}>
          <input style={{flex:1,maxWidth:'400px',background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none'}}
            placeholder="Search by label name, printer make, DPI, model..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <select value={makeF} onChange={e=>setMakeF(e.target.value)} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none'}}>
            <option value="">All Makes</option><option>Honeywell</option><option>Zebra</option><option>Datamax</option>
          </select>
          <select value={dpiF} onChange={e=>setDpiF(e.target.value)} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none'}}>
            <option value="">All DPI</option><option>203</option><option>300</option><option>600</option>
          </select>
        </div>
        {IS_ADMIN && <div style={{marginLeft:'10px'}}><button className="btn btn-primary" onClick={()=>{clear();setOpen(o=>!o);}}>+ Add Recipe</button></div>}
      </div>

      {IS_ADMIN && <div className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? 'Edit Label Recipe' : 'Add Label Recipe'}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'12px'}}>
          <div className="field"><label>Label Design Name *</label><input value={form.name} onChange={e=>fld('name',e.target.value)} placeholder="e.g. PCB Serial Label"/></div>
          <div className="field"><label>Printer Make *</label>
            <select value={form.make} onChange={e=>fld('make',e.target.value)}><option>Honeywell</option><option>Zebra</option><option>Datamax</option><option>Any</option></select>
          </div>
          <div className="field"><label>Printer Model *</label><input value={form.model} onChange={e=>fld('model',e.target.value)} placeholder="e.g. PM43, ZT410"/></div>
          <div className="field"><label>DPI *</label>
            <select value={form.dpi} onChange={e=>fld('dpi',e.target.value)}><option>203</option><option>300</option><option>600</option></select>
          </div>
          <div className="field"><label>Label Width (mm)</label><input value={form.width} onChange={e=>fld('width',e.target.value)} placeholder="e.g. 100"/></div>
          <div className="field"><label>Label Length (mm)</label><input value={form.length} onChange={e=>fld('length',e.target.value)} placeholder="e.g. 50"/></div>
          <div className="field"><label>Top Margin (mm)</label><input value={form.top} onChange={e=>fld('top',e.target.value)} placeholder="e.g. 2"/></div>
          <div className="field"><label>Left Margin (mm)</label><input value={form.left_margin} onChange={e=>fld('left_margin',e.target.value)} placeholder="e.g. 2"/></div>
          <div className="field"><label>Media Type</label>
            <select value={form.media} onChange={e=>fld('media',e.target.value)}><option>Direct Thermal</option><option>Thermal Transfer</option></select>
          </div>
          <div className="field"><label>Darkness</label><input value={form.darkness} onChange={e=>fld('darkness',e.target.value)} placeholder="e.g. 10"/></div>
          <div className="field"><label>Print Speed</label><input value={form.speed} onChange={e=>fld('speed',e.target.value)} placeholder="e.g. 4 ips"/></div>
          <div className="field"><label>Loftware Script Name</label><input value={form.loft} onChange={e=>fld('loft',e.target.value)} placeholder="Script file name..."/></div>
          {isHW && <>
            <div className="field"><label>Verifier</label><select value={form.verifier} onChange={e=>fld('verifier',e.target.value)}><option>None</option><option>Internal</option><option>External</option></select></div>
            <div className="field"><label>Media Calibration</label><select value={form.calibration} onChange={e=>fld('calibration',e.target.value)}><option>Smart Calibration</option><option>Manual Calibration</option><option>Feed Calibration</option></select></div>
            <div className="field"><label>Contrast</label><input value={form.contrast} onChange={e=>fld('contrast',e.target.value)} placeholder="e.g. +10"/></div>
          </>}
          <div className="field"><label>Size Summary</label><input className="af" readOnly value={form.width&&form.length ? form.width+'mm × '+form.length+'mm' : form.size} placeholder="Auto-calculated"/></div>
          <div className="field full"><label>Description / Notes</label><textarea value={form.desc} onChange={e=>fld('desc',e.target.value)} placeholder="Additional notes about this label recipe..." style={{minHeight:'60px'}}/></div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button className="btn btn-success" onClick={save}>Save Recipe</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>}
          {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
        </div>
      </div>}

      <div className="recipe-grid">
        {filtered.length === 0
          ? <div style={{color:'var(--text3)',padding:'20px',gridColumn:'1/-1'}}>No recipes found.</div>
          : filtered.map(r=>(
            <div key={r.id} className="recipe-card" onClick={()=>edit(r)}>
              <div className="recipe-name">{r.name}</div>
              <div className="recipe-meta">
                <span className={`recipe-tag badge ${makeColors[r.make]||'b-user'}`}>{r.make}</span>
                <span className="recipe-tag badge b-offline">{r.model}</span>
                <span className={`recipe-tag badge ${dpiColors[r.dpi]||'b-hp'}`}>{r.dpi} DPI</span>
                <span className="recipe-tag badge b-upcoming">{r.media}</span>
              </div>
              <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'8px',lineHeight:1.5}}>{r.desc||''}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px',fontSize:'11px',color:'var(--text3)'}}>
                {r.width&&r.length && <span>📐 {r.width}×{r.length}mm</span>}
                {r.top && <span>↕ Top:{r.top}mm</span>}
                {r.left_margin && <span>↔ Left:{r.left_margin}mm</span>}
                {r.darkness && <span>🔆 Dark:{r.darkness}</span>}
                {r.speed && <span>⚡ {r.speed}</span>}
                {r.loft && <span>📄 {r.loft}</span>}
                {r.make==='Honeywell'&&r.verifier && <span>🔍 Verifier:{r.verifier}</span>}
                {r.make==='Honeywell'&&r.calibration && <span>📏 {r.calibration}</span>}
                {r.make==='Honeywell'&&r.contrast && <span>◑ Contrast:{r.contrast}</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
