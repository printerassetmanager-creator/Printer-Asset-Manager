import React, { useEffect, useState } from 'react';
import { issuesAPI, printersAPI } from '../utils/api';
import { useApp, CURRENT_USER } from '../context/AppContext';

const displayName = (u) => u.split('.').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
const empty = {pmno:'',serial:'',model:'',loc:'',title:'',desc:'',action:'',severity:'Medium',category:'Other',reporter:displayName(CURRENT_USER)};

export default function IssuesTracker() {
  const { refreshIssueCount } = useApp();
  const [data, setData] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sevF, setSevF] = useState('');
  const [statF, setStatF] = useState('');
  const [msg, setMsg] = useState('');
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));

  const load = async () => {
    const { data: issues } = await issuesAPI.getAll().catch(()=>({data:[]}));
    setData(issues);
    refreshIssueCount();
  };

  useEffect(()=>{ load(); },[]);

  const autoFill = async (pmno) => {
    fld('pmno', pmno);
    if (pmno.length >= 4) {
      try {
        const { data: p } = await printersAPI.getOne(pmno.trim().toUpperCase());
        setForm(f=>({...f,serial:p.serial||'',model:p.model||'',loc:p.loc||''}));
      } catch {}
    }
  };

  const save = async () => {
    if (!form.title || !form.desc) { setMsg('Title and Description required'); return; }
    try {
      if (editId) await issuesAPI.update(editId, form);
      else await issuesAPI.create(form);
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch { setMsg('Error saving'); }
  };

  const del = async () => { if (!editId) return; await issuesAPI.delete(editId); load(); clear(); setOpen(false); };

  const resolve = async () => {
    if (!editId) return;
    await issuesAPI.resolve(editId); load(); clear(); setOpen(false);
  };

  const edit = (issue) => {
    setEditId(issue.id);
    setForm({pmno:issue.pmno||'',serial:issue.serial||'',model:issue.model||'',loc:issue.loc||'',title:issue.title||'',desc:issue.desc||'',action:issue.action||'',severity:issue.severity||'Medium',category:issue.category||'Other',reporter:issue.reporter||''});
    setOpen(true);
  };

  const clear = () => { setEditId(null); setForm(empty); setMsg(''); };

  // Enhanced search logic (fuzzy + exact)
  const filtered = data.filter(i => {
    const q = search.trim().toLowerCase();
    if (!q) return (!sevF||i.severity===sevF) && (!statF||i.status===statF);
    // Exact match fields
    const pmno = String(i.pmno || '').toLowerCase();
    const serial = String(i.serial || '').toLowerCase();
    const printerNo = String(i.printer_no || '').toLowerCase();
    if (q === pmno || q === serial || q === printerNo) return (!sevF||i.severity===sevF) && (!statF||i.status===statF);
    // Fuzzy search for other fields
    const fuzzyFields = [
      i.title,
      i.model,
      i.loc,
      i.desc,
      i.category,
      i.action,
      i.reporter,
    ];
    const fuzzyMatch = fuzzyFields.some(f => String(f || '').toLowerCase().includes(q));
    return fuzzyMatch && (!sevF||i.severity===sevF) && (!statF||i.status===statF);
  }).sort((a,b)=>{
    if (a.status!==b.status) return a.status==='open'?-1:1;
    const s={High:0,Medium:1,Low:2};
    if (a.severity!==b.severity) return (s[a.severity]||1)-(s[b.severity]||1);
    return new Date(b.created_at)-new Date(a.created_at);
  });

  const open_c = data.filter(i=>i.status==='open').length;
  const high_c = data.filter(i=>i.status==='open'&&i.severity==='High').length;
  const resolved_c = data.filter(i=>i.status==='resolved').length;
  const expiring_c = data.filter(i=>i.status==='open'&&(new Date(i.expires_at)-Date.now())<2*86400000).length;

  return (
    <div className="screen">
      <div className="notice n-warn">
        ⚠ Issues are automatically deleted after <strong>10 days</strong> of being logged. Resolve issues early to keep them in history.
      </div>

      <div className="issues-stat-row">
        <div className="kpi" style={{borderColor:'rgba(224,82,82,.3)'}}><div className="kpi-lbl">Open Issues</div><div className="kpi-val" style={{color:'var(--red)'}}>{open_c}</div><div className="kpi-sub">Active on printers</div></div>
        <div className="kpi" style={{borderColor:'rgba(232,160,32,.3)'}}><div className="kpi-lbl">High Severity</div><div className="kpi-val" style={{color:'var(--amber)'}}>{high_c}</div><div className="kpi-sub">Urgent action needed</div></div>
        <div className="kpi"><div className="kpi-lbl">Resolved</div><div className="kpi-val" style={{color:'var(--green)'}}>{resolved_c}</div><div className="kpi-sub">Closed total</div></div>
        <div className="kpi"><div className="kpi-lbl">Expiring Soon</div><div className="kpi-val" style={{color:'var(--purple)'}}>{expiring_c}</div><div className="kpi-sub">Within 2 days</div></div>
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',gap:'10px',flexWrap:'wrap'}}>
        <div className="issues-filter-row" style={{marginBottom:0,flex:1}}>
          <input placeholder="Search by PM No, serial, model, description..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <select value={sevF} onChange={e=>setSevF(e.target.value)} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none'}}>
            <option value="">All Severity</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select value={statF} onChange={e=>setStatF(e.target.value)} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:'8px 11px',fontSize:'13px',color:'var(--text)',fontFamily:'Inter,sans-serif',outline:'none'}}>
            <option value="">All Status</option><option value="open">Open</option><option value="resolved">Resolved</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={()=>{clear();setOpen(o=>!o);}}>+ Log Issue</button>
      </div>

      <div className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? 'Edit Issue — '+form.pmno : 'Log New Issue'}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'12px'}}>
          <div className="field"><label>PM No *</label><input value={form.pmno} onChange={e=>autoFill(e.target.value)} placeholder="e.g. 1256"/></div>
          <div className="field"><label>Serial No <span className="tag-a">Auto</span></label><input className="af" readOnly value={form.serial} placeholder="—"/></div>
          <div className="field"><label>Printer Model <span className="tag-a">Auto</span></label><input className="af" readOnly value={form.model} placeholder="—"/></div>
          <div className="field"><label>Location <span className="tag-a">Auto</span></label><input className="af" readOnly value={form.loc} placeholder="—"/></div>
          <div className="field"><label>Issue Title *</label><input value={form.title} onChange={e=>fld('title',e.target.value)} placeholder="Brief title of the issue"/></div>
          <div className="field"><label>Severity</label>
            <select value={form.severity} onChange={e=>fld('severity',e.target.value)}>
              <option value="High">High — Printer Down</option>
              <option value="Medium">Medium — Degraded</option>
              <option value="Low">Low — Minor</option>
            </select>
          </div>
          <div className="field"><label>Category</label>
            <select value={form.category} onChange={e=>fld('category',e.target.value)}>
              <option>Print Head</option><option>Media / Ribbon</option><option>Connectivity</option>
              <option>Firmware</option><option>Mechanical</option><option>Label Quality</option><option>Other</option>
            </select>
          </div>
          <div className="field"><label>Reported By</label><input value={form.reporter} onChange={e=>fld('reporter',e.target.value)} placeholder="Your name"/></div>
          <div className="field full"><label>Issue Description *</label><textarea value={form.desc} onChange={e=>fld('desc',e.target.value)} placeholder="Describe the issue in detail — what is happening, when it started, frequency..." style={{minHeight:'70px'}}/></div>
          <div className="field full"><label>Action Taken</label><textarea value={form.action} onChange={e=>fld('action',e.target.value)} placeholder="What was tried or done to resolve this..." style={{minHeight:'50px'}}/></div>
        </div>
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          <button className="btn btn-success" onClick={save}>Save Issue</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>}
          {editId && <button className="btn btn-ghost btn-sm" onClick={resolve}>✓ Mark Resolved</button>}
          {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
        </div>
      </div>

      <div>
        {filtered.length === 0
          ? <div className="issues-empty">No issues found.<br/><span style={{fontSize:'11px',color:'var(--text3)'}}>Click "+ Log Issue" to report a new problem.</span></div>
          : filtered.map(issue => {
            const created = new Date(issue.created_at);
            const expires = new Date(issue.expires_at);
            const daysLeft = Math.max(0, Math.ceil((expires - Date.now()) / 86400000));
            const age = Math.floor((Date.now() - created.getTime()) / 86400000);
            const sevCls = issue.severity==='High'?'severity-high':issue.severity==='Medium'?'severity-medium':'severity-low';
            const sevBadge = issue.severity==='High'?'ib-high':issue.severity==='Medium'?'ib-medium':'ib-low';
            const statBadge = issue.status==='open'?'ib-open':'ib-resolved';
            return (
              <div key={issue.id} className={`issue-card ${sevCls}`} onClick={()=>edit(issue)}>
                <div className="issue-header">
                  <div>
                    <div className="issue-title">{issue.title}</div>
                    <div className="issue-meta">
                      <span>📋 {issue.pmno}</span>
                      <span>🔧 {issue.serial||'—'}</span>
                      <span>🖨 {issue.model||'—'}</span>
                      <span>📍 {issue.loc||'—'}</span>
                      <span>📁 {issue.category}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'5px',flexShrink:0,flexDirection:'column',alignItems:'flex-end'}}>
                    <span className={`issue-badge ${sevBadge}`}>{issue.severity}</span>
                    <span className={`issue-badge ${statBadge}`}>{issue.status==='open'?'Open':'Resolved'}</span>
                  </div>
                </div>
                <div className="issue-desc">{issue.desc}</div>
                {issue.action && <div style={{fontSize:'11px',color:'var(--text3)',background:'var(--bg)',borderRadius:'5px',padding:'6px 10px',marginBottom:'8px',border:'1px solid var(--border)'}}><strong>Action taken:</strong> {issue.action}</div>}
                <div className="issue-footer">
                  <span>By {issue.reporter} · {age===0?'Today':age+' day'+(age!==1?'s':'')+' ago'}</span>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    {issue.status==='open' && <span className="issue-expiry">⏰ Expires in {daysLeft} day{daysLeft!==1?'s':''}</span>}
                    {issue.resolved_at && <span style={{fontSize:'9px',color:'var(--green)',padding:'2px 7px',borderRadius:'10px',background:'var(--green-bg)'}}>Resolved {new Date(issue.resolved_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>}
                    <span>{created.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
