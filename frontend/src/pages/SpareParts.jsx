import React, { useEffect, useState, useMemo } from 'react';
import { sparePartsAPI } from '../utils/api';
import { useApp, PLANT_LOCATIONS } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';
import PartCatalogMenu from '../components/PartCatalogMenu';
import { findCatalogPart, getCatalogMatches } from '../utils/sparePartCatalog';

const empty = {code:'',name:'',compat:'All',loc:'',serial:'',condition:'New',plant_location:'B26',printer_model:'',category:''};

export default function SpareParts() {
  const { selectedPlants } = useApp();
  const [data, setData] = useState([]);
  const [usageLog, setUsageLog] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [useForm, setUseForm] = useState({code:'',name:'',qty:1,pmno:'',serial:'',wc:'',make:'All',model:'',used_by:'Aniket'});
  const [showUseModal, setShowUseModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [activePartPicker, setActivePartPicker] = useState(null);

  const normalizePartKey = (name, make, model) => {
    const raw = `${name || ''}`.toLowerCase();
    let normalized = raw;
    if (make) normalized = normalized.replace(new RegExp(`\\b${make.toLowerCase()}\\b`, 'g'), '');
    if (model) normalized = normalized.replace(new RegExp(`\\b${model.toLowerCase()}\\b`, 'g'), '');
    normalized = normalized.replace(/(honeywell|zebra|printer|part|assembly|unit|module|cartridge|spare)/g, '');
    normalized = normalized.replace(/head\b/g, 'printer head');
    normalized = normalized.replace(/print head\b/g, 'printer head');
    normalized = normalized.replace(/^head$/, 'printer head');
    normalized = normalized.replace(/[^a-z0-9 ]+/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized || raw.trim();
  };

  const totalRequired = useMemo(() => {
    const grouped = {};
    requirements.forEach((r) => {
      const key = normalizePartKey(r.name, r.make, r.model);
      if (!grouped[key]) grouped[key] = { name: r.name, make: r.make, model: r.model, total: 0 };
      grouped[key].total += parseInt(r.qty, 10) || 0;
    });
    return Object.values(grouped);
  }, [requirements]);

  const getStatus = (p) => {
    const partKey = normalizePartKey(p.name, p.compat, p.printer_model);
    const req = totalRequired.find(r => normalizePartKey(r.name, r.make, r.model) === partKey);
    const required = req ? req.total : 0;
    if (required === 0) return { text: 'Available', class: 'b-instock' };
    if (p.avail >= required) return { text: 'Available', class: 'b-instock' };
    if (p.avail > 0) return { text: 'Shortage', class: 'b-low' };
    return { text: 'Out of Stock', class: 'b-out' };
  };
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));
  const applyCatalogPart = (part, overrides = {}) => {
    if (!part) return setForm(f=>({...f,...overrides}));
    setForm(f=>({
      ...f,
      code: part.code,
      name: part.name,
      category: part.category
    }));
    setActivePartPicker(null);
  };
  const setPartCode = (value) => {
    const part = findCatalogPart(value);
    applyCatalogPart(part, { code: value });
  };
  const setPartName = (value) => {
    const part = findCatalogPart(value);
    applyCatalogPart(part, { name: value });
  };
  const isCatalogPartSelected = Boolean(findCatalogPart(form.name) || findCatalogPart(form.code));
  const nameCatalogMatches = useMemo(() => getCatalogMatches(form.name), [form.name]);
  const codeCatalogMatches = useMemo(() => getCatalogMatches(form.code), [form.code]);

  const load = () => { sparePartsAPI.getAll(selectedPlants).then(r=>setData(r.data)).catch(()=>{}); sparePartsAPI.getUsageLog().then(r=>setUsageLog(r.data)).catch(()=>{}); sparePartsAPI.getRequirements().then(r=>setRequirements(r.data)).catch(()=>{}); };
  useEffect(()=>{ load(); },[selectedPlants]);

  const save = async () => {
    if (!form.code || !form.name) { setMsg('Code and Name required'); return; }
    try {
      const selectedCatalogPart = findCatalogPart(form.code) || findCatalogPart(form.name);
      const payload = {
        ...form,
        code: selectedCatalogPart?.code || form.code.trim().toUpperCase(),
        name: selectedCatalogPart?.name || toSentenceCase(form.name),
        category: selectedCatalogPart?.category || form.category,
        loc: toSentenceCase(form.loc),
        serial: toSentenceCase(form.serial)
      };
      if (editId) await sparePartsAPI.update(editId, payload);
      else await sparePartsAPI.create(payload);
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error saving spare part');
      setTimeout(()=>setMsg(''),3000);
    }
  };

  const del = async () => { if (!editId) return; await sparePartsAPI.delete(editId); load(); clear(); setOpen(false); };
  const edit = (p) => { setEditId(p.id); setForm({code:p.code||'',name:p.name||'',compat:p.compat||'All',loc:p.loc||'',serial:p.serial||'',condition:p.condition||'New',plant_location:p.plant_location||'B26',printer_model:p.printer_model||'',category:p.category||''}); setOpen(true); };
  const clear = () => { setEditId(null); setForm(empty); setMsg(''); };

  const logUse = async () => {
    if ((!useForm.code && !useForm.name) || !useForm.pmno) {
      setMsg('Part Code or Name and PM No are required');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    try {
      await sparePartsAPI.use({ ...useForm, printer_model: useForm.model });
      setShowUseModal(false);
      setUseForm({code:'',name:'',qty:1,pmno:'',serial:'',wc:'',make:'All',model:'',used_by:'Aniket'});
      load();
      setMsg('Usage logged successfully');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error logging usage');
      setTimeout(() => setMsg(''), 2000);
    }
  };

  const groupAvailabilityByPart = (items) => {
    const map = new Map();
    items.forEach((part) => {
      const key = `${part.name?.trim().toLowerCase()}||${(part.printer_model||'').trim().toLowerCase()}||${(part.compat||'').trim().toLowerCase()}`;
      const current = map.get(key);
      if (current) {
        current.avail += part.avail || 0;
        if (!current.code.includes(part.code)) {
          current.code = current.code ? `${current.code}, ${part.code}` : part.code;
        }
      } else {
        map.set(key, { ...part, avail: part.avail || 0 });
      }
    });
    return Array.from(map.values());
  };

  const showRequirements = (part) => {
    const partKey = normalizePartKey(part.name, part.compat, part.printer_model);
    const reqs = requirements.filter((r) => normalizePartKey(r.name, r.make, r.model) === partKey);
    setAvailabilityList(reqs);
    setShowReqModal(true);
  };

  const showAvailability = () => {
    if (!useForm.name) {
      setMsg('Enter part name to view availability');
      setTimeout(() => setMsg(''), 2000);
      return;
    }
    const results = data.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(useForm.name.trim().toLowerCase());
      const modelMatch = !useForm.model || (p.printer_model || '').toLowerCase().includes(useForm.model.trim().toLowerCase());
      const makeMatch = useForm.make === 'All' || p.compat === useForm.make;
      return nameMatch && modelMatch && makeMatch;
    });
    setAvailabilityList(groupAvailabilityByPart(results));
    setShowAvailabilityModal(true);
  };

  const exportCSV = () => {
    const hdr = 'Code,Name,Compatible,Printer Model,Stock,Location,Status\n';
    const rows = data.map(p=>`${p.code},${p.name},${p.compat},${p.printer_model||''},${p.avail},${p.loc},${p.avail===0?'Out':'OK'}`).join('\n');
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
          <div className="field part-picker">
            <label>Part Name *</label>
            <input value={form.name} onFocus={()=>setActivePartPicker('name')} onBlur={()=>setTimeout(()=>setActivePartPicker(null),120)} onChange={e=>setPartName(e.target.value)} placeholder="Search part name"/>
            {activePartPicker === 'name' && <PartCatalogMenu items={nameCatalogMatches} onSelect={applyCatalogPart} />}
          </div>
          <div className="field part-picker">
            <label>Part Code *</label>
            <input className={isCatalogPartSelected ? 'af' : ''} value={form.code} readOnly={isCatalogPartSelected} onFocus={()=>{if(!isCatalogPartSelected)setActivePartPicker('code')}} onBlur={()=>setTimeout(()=>setActivePartPicker(null),120)} onChange={e=>setPartCode(e.target.value)} placeholder="Auto generated code"/>
            {activePartPicker === 'code' && <PartCatalogMenu items={codeCatalogMatches} onSelect={applyCatalogPart} />}
          </div>
          <div className="field"><label>Compatible With</label>
            <select value={form.compat} onChange={e=>fld('compat',e.target.value)}><option>All</option><option>Honeywell</option><option>Zebra</option></select>
          </div>
          <div className="field"><label>Printer Model No</label><input value={form.printer_model} onChange={e=>fld('printer_model',e.target.value)} placeholder="e.g. PX940"/></div>
          <div className="field"><label>Plant Location</label>
            <select value={form.plant_location} onChange={e=>fld('plant_location',e.target.value)}>
              {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
            </select>
          </div>
          <div className="field"><label>Storage Location</label><input value={form.loc} onChange={e=>fld('loc',e.target.value)} placeholder="Rack A - Shelf 1"/></div>
          <div className="field"><label>Condition</label><select value={form.condition} onChange={e=>fld('condition',e.target.value)}><option>New</option><option>Used</option></select></div>
          <div className="field"><label>Compatible Serial No</label><input value={form.serial} onChange={e=>fld('serial',e.target.value)} placeholder="optional"/></div>
          <div className="field"><label>Category</label><input value={form.category} onChange={e=>fld('category',e.target.value)} placeholder="e.g. Print Head"/></div>
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
            <thead><tr><th>Code</th><th>Part Name</th><th>Category</th><th>Compatible</th><th>Printer Model</th><th>Stock</th><th>Condition</th><th>Location</th><th>Status</th><th>See Req</th><th>Edit</th></tr></thead>
            <tbody>
              {data.map(p=>(
                <tr key={p.id}>
                  <td className="blue">{p.code}</td><td className="em">{p.name}</td><td>{p.category||'—'}</td><td>{p.compat}</td><td>{p.printer_model||'—'}</td>
                  <td className={p.avail===0?'red':'green'} style={{fontWeight:600}}>{p.avail}</td>
                  <td><span className={`badge ${(p.condition||'New')==='New'?'b-instock':'b-low'}`}>{p.condition||'New'}</span></td>
                  <td style={{fontSize:'11px'}}>{p.loc}</td>
                  <td><span className={`badge ${getStatus(p).class}`}>{getStatus(p).text}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>showRequirements(p)}>See Req</button></td>
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
            <div className="field"><label>Part Code *</label><input value={useForm.code} onChange={e=>setUseForm(f=>({...f,code:e.target.value}))} placeholder="Part code"/></div>
            <div className="field"><label>Part Name</label><input value={useForm.name} onChange={e=>setUseForm(f=>({...f,name:e.target.value}))} placeholder="Part name"/></div>
            <div className="field"><label>Make</label>
              <select value={useForm.make} onChange={e=>setUseForm(f=>({...f,make:e.target.value}))}>
                <option>All</option>
                <option>Honeywell</option>
                <option>Zebra</option>
              </select>
            </div>
            <div className="field"><label>Model</label><input value={useForm.model} onChange={e=>setUseForm(f=>({...f,model:e.target.value}))} placeholder="Printer model"/></div>
            <div className="field"><label>Qty Used</label><input type="number" value={useForm.qty} onChange={e=>setUseForm(f=>({...f,qty:parseInt(e.target.value)||1}))} min="1"/></div>
            <div className="field"><label>Serial No</label><input value={useForm.serial} onChange={e=>setUseForm(f=>({...f,serial:e.target.value}))} placeholder="Printer serial"/></div>
            <div className="field"><label>PM No *</label><input value={useForm.pmno} onChange={e=>setUseForm(f=>({...f,pmno:e.target.value}))} placeholder="1256"/></div>
            <div className="field"><label>Workcell</label><input value={useForm.wc} onChange={e=>setUseForm(f=>({...f,wc:e.target.value}))} placeholder="WC-14B"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>
            <button className="btn btn-ghost" onClick={()=>setShowUseModal(false)}>Cancel</button>
            <button className="btn btn-secondary btn-sm" onClick={showAvailability}>View Availability</button>
            <button className="btn btn-success" onClick={logUse}>Log Usage</button>
          </div>
        </div>
      </div>}

      {showAvailabilityModal && <div className="modal-bg show" onClick={e=>{if(e.target===e.currentTarget)setShowAvailabilityModal(false)}}>
        <div className="modal" style={{maxWidth:'760px',width:'100%'}}>
          <div className="modal-title">Availability for "{useForm.name}"</div>
          <button className="modal-close" onClick={()=>setShowAvailabilityModal(false)}>✕</button>
          <div style={{margin:'12px 0',fontSize:'13px',color:'var(--text3)'}}>
            Showing parts for model <strong>{useForm.model || 'any'}</strong> and make <strong>{useForm.make}</strong>.
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Code</th><th>Part Name</th><th>Model</th><th>Serial No</th><th>Location</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {availabilityList.length ? availabilityList.map((p) => (
                  <tr key={p.id}>
                    <td className="blue">{p.code}</td>
                    <td>{p.name}</td>
                    <td>{p.printer_model||'—'}</td>
                    <td>{p.serial||'—'}</td>
                    <td>{p.loc||'—'}</td>
                    <td>{p.avail}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{textAlign:'center',padding:'20px 0'}}>No matching parts found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {showReqModal && <div className="modal-bg show" onClick={e=>{if(e.target===e.currentTarget)setShowReqModal(false)}}>
        <div className="modal" style={{maxWidth:'760px',width:'100%'}}>
          <div className="modal-title">Requirements for this part</div>
          <button className="modal-close" onClick={()=>setShowReqModal(false)}>✕</button>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>PM No</th><th>Location</th><th>Qty Required</th><th>Engineer</th><th>Date</th></tr>
              </thead>
              <tbody>
                {availabilityList.length ? availabilityList.map((r, index) => (
                  <tr key={`${r.pmno}-${r.loc}-${index}`}>
                    <td className="blue">{r.pmno}</td>
                    <td>{r.loc}</td>
                    <td>{r.qty}</td>
                    <td>{r.engineer || '—'}</td>
                    <td>{r.checked_at ? new Date(r.checked_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{textAlign:'center',padding:'20px 0'}}>No requirements found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>}
    </div>
  );
}
