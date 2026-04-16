import React, { useEffect, useState } from 'react';
import { hpPrintersAPI, cartridgesAPI } from '../utils/api';
import { IS_ADMIN } from '../context/AppContext';

function CartGauge({ pct }) {
  if (pct === null || pct === undefined) return <span style={{fontSize:'11px',color:'var(--text3)'}}>N/A</span>;
  const c = pct >= 50 ? 'var(--green)' : pct >= 20 ? 'var(--amber)' : 'var(--red)';
  return <div className="cart-gauge-wrap"><div className="cart-gauge-bar"><div className="cart-gauge-fill" style={{width:`${pct}%`,background:c}}/></div><div className="cart-pct" style={{color:c}}>{pct}%</div></div>;
}

const emptyPrinter = {tag:'',model:'',ip:'',loc:'',stage:'',bay:'',wc:'',cartmodel:'',black_pct:85,color_pct:null,online:true};
const emptyCart = {model:'',dn:'',type:'Black',compat:'',stock:0,min:2,yield:'',loc:''};

export default function HpPrinters() {
  const [tab, setTab] = useState('overview');
  const [printers, setPrinters] = useState([]);
  const [carts, setCarts] = useState([]);
  const [pForm, setPForm] = useState(emptyPrinter);
  const [cForm, setCForm] = useState(emptyCart);
  const [editCartId, setEditCartId] = useState(null);
  const [pOpen, setPOpen] = useState(false);
  const [cOpen, setCOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [showUseCart, setShowUseCart] = useState(false);
  const [useCartForm, setUseCartForm] = useState({dn:'',model:'',qty:1,wc:'',ip:'',used_by:'Aniket'});

  const loadPrinters = () => hpPrintersAPI.getAll().then(r=>setPrinters(r.data)).catch(()=>{});
  const loadCarts = () => cartridgesAPI.getAll().then(r=>setCarts(r.data)).catch(()=>{});
  useEffect(()=>{ loadPrinters(); loadCarts(); },[]);

  const savePrinter = async () => {
    if (!pForm.model || !pForm.ip) { alert('Model and IP required'); return; }
    await hpPrintersAPI.create(pForm); loadPrinters(); setPForm(emptyPrinter); setPOpen(false); setMsg('HP Printer added');
    setTimeout(()=>setMsg(''),2000);
  };

  const removePrinter = async (id) => { if (!window.confirm('Remove this printer?')) return; await hpPrintersAPI.delete(id); loadPrinters(); };

  const saveCart = async () => {
    if (!cForm.model) { setMsg('Cartridge model required'); return; }
    if (editCartId) await cartridgesAPI.update(editCartId, cForm); else await cartridgesAPI.create(cForm);
    loadCarts(); setCForm(emptyCart); setEditCartId(null); setCOpen(false); setMsg('Saved');
    setTimeout(()=>setMsg(''),2000);
  };

  const delCart = async () => { if (!editCartId) return; await cartridgesAPI.delete(editCartId); loadCarts(); setCForm(emptyCart); setEditCartId(null); setCOpen(false); };
  const editCart = (c) => { setEditCartId(c.id); setCForm({model:c.model||'',dn:c.dn||'',type:c.type||'Black',compat:c.compat||'',stock:c.stock||0,min:c.min||2,yield:c.yield||'',loc:c.loc||''}); setCOpen(true); };

  const logUseCart = async () => {
    if (!useCartForm.dn && !useCartForm.model) { alert('DN No or Cartridge Model required'); return; }
    await cartridgesAPI.use(useCartForm); setShowUseCart(false); loadCarts();
    setUseCartForm({dn:'',model:'',qty:1,wc:'',ip:'',used_by:'Aniket'});
  };

  const pfld = (k,v) => setPForm(f=>({...f,[k]:v}));
  const cfld = (k,v) => setCForm(f=>({...f,[k]:v}));

  return (
    <div className="screen">
      <div className="hp-tabs">
        {['overview','cartridge','hpdash'].map((t,i) => (
          <div key={t} className={`hp-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
            {['HP Printers Overview','Cartridge Inventory','Cartridge Dashboard'][i]}
          </div>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab==='overview' && <div className="hp-panel active">
        <div className="card-hd" style={{padding:0,marginBottom:'12px'}}>
          <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',flex:1}}>
            <div className="kpi" style={{borderColor:'rgba(34,211,238,.25)'}}><div className="kpi-lbl">HP Printers</div><div className="kpi-val" style={{color:'var(--cyan)'}}>{printers.length}</div><div className="kpi-sub">Active</div></div>
            <div className="kpi c-online"><div className="kpi-lbl">Online</div><div className="kpi-val">{printers.filter(p=>p.online).length}</div><div className="kpi-sub">Responding</div></div>
            <div className="kpi c-due"><div className="kpi-lbl">Low Cartridge</div><div className="kpi-val">{printers.filter(p=>p.black_pct<20||(p.color_pct!==null&&p.color_pct<20)).length}</div><div className="kpi-sub">&lt; 20%</div></div>
            <div className="kpi c-offline"><div className="kpi-lbl">Offline</div><div className="kpi-val">{printers.filter(p=>!p.online).length}</div><div className="kpi-sub">No ping</div></div>
          </div>
          {IS_ADMIN && <div style={{marginLeft:'14px',flexShrink:0}}><button className="btn btn-primary" onClick={()=>setPOpen(o=>!o)}>+ Add HP Printer</button></div>}
        </div>

        {IS_ADMIN && <div className={`collapse-form${pOpen?' open':''}`}>
          <div className="cf-header"><div className="cf-title">Add HP Printer</div><button className="btn btn-ghost btn-sm" onClick={()=>setPOpen(false)}>Cancel</button></div>
          <div className="fgrid fg4" style={{marginBottom:'12px'}}>
            <div className="field"><label>HP Model *</label><input value={pForm.model} onChange={e=>pfld('model',e.target.value)} placeholder="e.g. HP LaserJet Pro M404"/></div>
            <div className="field"><label>IP Address *</label><input value={pForm.ip} onChange={e=>pfld('ip',e.target.value)} placeholder="e.g. 192.168.1.201"/></div>
            <div className="field"><label>Location</label><input value={pForm.loc} onChange={e=>pfld('loc',e.target.value)} placeholder="e.g. Floor 1 - Admin Block"/></div>
            <div className="field"><label>Hostname / Tag</label><input value={pForm.tag} onChange={e=>pfld('tag',e.target.value)} placeholder="e.g. HP-ADMIN-01"/></div>
            <div className="field"><label>Stage</label><input value={pForm.stage} onChange={e=>pfld('stage',e.target.value)} placeholder="e.g. Admin"/></div>
            <div className="field"><label>Bay</label><input value={pForm.bay} onChange={e=>pfld('bay',e.target.value)} placeholder="e.g. Bay-01"/></div>
            <div className="field"><label>Workcell</label><input value={pForm.wc} onChange={e=>pfld('wc',e.target.value)} placeholder="e.g. WC-A1"/></div>
            <div className="field"><label>Cartridge Model</label><input value={pForm.cartmodel} onChange={e=>pfld('cartmodel',e.target.value)} placeholder="e.g. HP 26A (CF226A)"/></div>
          </div>
          <button className="btn btn-success" onClick={savePrinter}>Add HP Printer</button>
          {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'10px'}}>{msg}</span>}
        </div>}

        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Hostname / Tag</th><th>Model</th><th>IP Address</th><th>Location</th><th>Stage / Bay</th><th>Online</th><th>Cartridge Model</th><th>Black %</th><th>Color %</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {printers.map(p=>(
                <tr key={p.id}>
                  <td className="em">{p.tag}</td><td>{p.model}</td><td className="mono">{p.ip}</td>
                  <td style={{fontSize:'11px'}}>{p.loc}</td><td>{p.stage} / {p.bay}</td>
                  <td>{p.online?<span className="badge b-online"><span className="badge-dot"/>Online</span>:<span className="badge b-offline"><span className="badge-dot"/>Offline</span>}</td>
                  <td>{p.cartmodel}</td>
                  <td><CartGauge pct={p.black_pct}/></td>
                  <td><CartGauge pct={p.color_pct}/></td>
                  <td><span className={`badge ${p.black_pct<20||(p.color_pct!==null&&p.color_pct<20)?'b-err':'b-ok'}`}>{p.black_pct<20||(p.color_pct!==null&&p.color_pct<20)?'Low Cartridge':'OK'}</span></td>
                  <td><button className="btn btn-danger btn-xs" onClick={()=>removePrinter(p.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ── CARTRIDGE INVENTORY ── */}
      {tab==='cartridge' && <div className="hp-panel active">
        <div className="card-hd" style={{padding:0,marginBottom:'12px'}}>
          <div style={{fontSize:'13px',color:'var(--text2)'}}>Cartridge stock, model numbers and DN details</div>
          <div style={{display:'flex',gap:'8px'}}>
            <button className="btn btn-amber btn-sm" onClick={()=>setShowUseCart(true)}>Use Cartridge</button>
            {IS_ADMIN && <button className="btn btn-primary" onClick={()=>{setEditCartId(null);setCForm(emptyCart);setCOpen(o=>!o);}}>+ Add Cartridge</button>}
          </div>
        </div>

        {IS_ADMIN && <div className={`collapse-form${cOpen?' open':''}`}>
          <div className="cf-header"><div className="cf-title">Add / Edit Cartridge Details</div><button className="btn btn-ghost btn-sm" onClick={()=>{setCOpen(false);setCForm(emptyCart);setEditCartId(null);}}>Cancel</button></div>
          <div className="fgrid fg4" style={{marginBottom:'12px'}}>
            <div className="field"><label>Cartridge Model *</label><input value={cForm.model} onChange={e=>cfld('model',e.target.value)} placeholder="e.g. HP 26A (CF226A)"/></div>
            <div className="field"><label>DN / Part Number</label><input value={cForm.dn} onChange={e=>cfld('dn',e.target.value)} placeholder="e.g. CF226A"/></div>
            <div className="field"><label>Type</label><select value={cForm.type} onChange={e=>cfld('type',e.target.value)}><option>Black</option><option>Cyan</option><option>Magenta</option><option>Yellow</option><option>Color Set</option></select></div>
            <div className="field"><label>Compatible HP Models</label><input value={cForm.compat} onChange={e=>cfld('compat',e.target.value)} placeholder="M404, M406, M428..."/></div>
            <div className="field"><label>Stock Available</label><input type="number" value={cForm.stock} onChange={e=>cfld('stock',parseInt(e.target.value)||0)} min="0"/></div>
            <div className="field"><label>Min Stock Level</label><input type="number" value={cForm.min} onChange={e=>cfld('min',parseInt(e.target.value)||0)} min="0"/></div>
            <div className="field"><label>Yield (Pages)</label><input value={cForm.yield} onChange={e=>cfld('yield',e.target.value)} placeholder="e.g. 3100 pages"/></div>
            <div className="field"><label>Storage Location</label><input value={cForm.loc} onChange={e=>cfld('loc',e.target.value)} placeholder="Rack B - Shelf 2"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <button className="btn btn-success" onClick={saveCart}>Save Cartridge</button>
            {editCartId && <button className="btn btn-danger btn-sm" onClick={delCart}>Delete</button>}
            {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
          </div>
        </div>}

        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Cartridge Model</th><th>DN / Part No</th><th>Type</th><th>Compatible Models</th><th>Stock</th><th>Min Stock</th><th>Yield</th><th>Location</th><th>Status</th><th>Edit</th></tr></thead>
            <tbody>
              {carts.map(c=>(
                <tr key={c.id}>
                  <td className="em">{c.model}</td><td className="mono">{c.dn}</td><td>{c.type}</td><td style={{fontSize:'11px'}}>{c.compat}</td>
                  <td className={c.stock===0?'red':c.stock<=c.min?'amber':'green'} style={{fontWeight:600}}>{c.stock}</td>
                  <td style={{color:'var(--text3)'}}>{c.min}</td><td style={{fontSize:'11px'}}>{c.yield}</td><td style={{fontSize:'11px'}}>{c.loc}</td>
                  <td><span className={`badge ${c.stock===0?'b-out':c.stock<=c.min?'b-low':'b-instock'}`}>{c.stock===0?'Out':c.stock<=c.min?'Low Stock':'In Stock'}</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>editCart(c)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* ── DASHBOARD ── */}
      {tab==='hpdash' && <div className="hp-panel active">
        <div className="card" style={{marginBottom:'14px'}}>
          <div className="card-title" style={{marginBottom:'14px'}}>Cartridge Availability — Model Wise</div>
          <div className="g4">
            {carts.map(c=>(
              <div key={c.id} className="card" style={{padding:'12px',borderColor:c.stock===0?'rgba(224,82,82,.3)':c.stock<=c.min?'rgba(232,160,32,.3)':'var(--border)'}}>
                <div style={{fontSize:'11px',color:'var(--text)',fontWeight:600,marginBottom:'3px',wordBreak:'break-all'}}>{c.model}</div>
                <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:'8px'}}>{c.dn} · {c.type}</div>
                <div style={{fontSize:'24px',fontWeight:600,color:c.stock===0?'var(--red)':c.stock<=c.min?'var(--amber)':'var(--green)',marginBottom:'4px'}}>{c.stock}</div>
                <div style={{fontSize:'10px',color:'var(--text3)'}}>min: {c.min} · {c.yield}</div>
                <div style={{marginTop:'8px'}}><span className={`badge ${c.stock===0?'b-out':c.stock<=c.min?'b-low':'b-instock'}`}>{c.stock===0?'Out of Stock':c.stock<=c.min?'Low Stock':'In Stock'}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="g2">
          <div className="card">
            <div className="card-title" style={{marginBottom:'12px'}}>Low / Out of Stock Cartridges</div>
            {carts.filter(c=>c.stock<=c.min).length===0
              ? <div style={{fontSize:'12px',color:'var(--green)',padding:'10px'}}>✓ All cartridges adequately stocked</div>
              : carts.filter(c=>c.stock<=c.min).map(c=>(
                <div key={c.id} style={{background:c.stock===0?'var(--red-bg)':'var(--amber-bg)',border:`1px solid ${c.stock===0?'rgba(224,82,82,.3)':'rgba(232,160,32,.3)'}`,borderRadius:'var(--r)',padding:'10px 12px',marginBottom:'8px'}}>
                  <div style={{fontSize:'13px',color:c.stock===0?'var(--red)':'var(--amber)',fontWeight:600}}>{c.model}</div>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'3px'}}>DN: {c.dn} · Stock: {c.stock} · Min: {c.min}</div>
                </div>
              ))}
          </div>
          <div className="card">
            <div className="card-title" style={{marginBottom:'12px'}}>HP Printer Cartridge Status Live</div>
            {printers.map(p=>(
              <div key={p.id} style={{padding:'10px',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                  <span style={{fontSize:'13px',color:'var(--text)',fontWeight:500}}>{p.tag}</span>
                  <span className={`badge ${p.online?'b-online':'b-offline'}`}>{p.online?'Online':'Offline'}</span>
                </div>
                <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'6px'}}>{p.cartmodel}</div>
                <div style={{display:'flex',gap:'8px',alignItems:'center',fontSize:'10px',color:'var(--text3)'}}>
                  <span>Black:</span><CartGauge pct={p.black_pct}/>
                  {p.color_pct!==null && <><span style={{marginLeft:'8px'}}>Color:</span><CartGauge pct={p.color_pct}/></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Use Cartridge Modal */}
      {showUseCart && <div className="modal-bg show" onClick={e=>{if(e.target===e.currentTarget)setShowUseCart(false)}}>
        <div className="modal">
          <div className="modal-title">Use Cartridge</div>
          <button className="modal-close" onClick={()=>setShowUseCart(false)}>✕</button>
          <div className="fgrid fg2" style={{gap:'12px'}}>
            <div className="field"><label>DN No / Part No *</label><input value={useCartForm.dn} onChange={e=>setUseCartForm(f=>({...f,dn:e.target.value}))} placeholder="e.g. CF226A"/></div>
            <div className="field"><label>Cartridge Model *</label><input value={useCartForm.model} onChange={e=>setUseCartForm(f=>({...f,model:e.target.value}))} placeholder="e.g. HP 26A (CF226A)"/></div>
            <div className="field"><label>Qty Used</label><input type="number" value={useCartForm.qty} onChange={e=>setUseCartForm(f=>({...f,qty:parseInt(e.target.value)||1}))} min="1"/></div>
            <div className="field"><label>HP Printer Workcell</label><input value={useCartForm.wc} onChange={e=>setUseCartForm(f=>({...f,wc:e.target.value}))} placeholder="e.g. WC-A1"/></div>
            <div className="field"><label>Printer IP Address</label><input value={useCartForm.ip} onChange={e=>setUseCartForm(f=>({...f,ip:e.target.value}))} placeholder="e.g. 192.168.2.10"/></div>
            <div className="field"><label>Used By</label><input value={useCartForm.used_by} onChange={e=>setUseCartForm(f=>({...f,used_by:e.target.value}))} placeholder="Engineer name"/></div>
          </div>
          <div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'16px'}}>
            <button className="btn btn-ghost" onClick={()=>setShowUseCart(false)}>Cancel</button>
            <button className="btn btn-success" onClick={logUseCart}>Log Cartridge Use</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
