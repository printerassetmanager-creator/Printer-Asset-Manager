import React, { useEffect, useState, useRef } from 'react';
import { issuesAPI, printersAPI } from '../utils/api';
import { useApp, CURRENT_USER, PLANT_LOCATIONS } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const displayName = (u) => u.split('.').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
const empty = {pmno:'',serial:'',model:'',loc:'',sapno:'',mesno:'',title:'',desc:'',action:'',severity:'Medium',category:'Other',reporter:displayName(CURRENT_USER),plant_location:'B26'};

export default function IssuesTracker() {
  const { refreshIssueCount, selectedPlants } = useApp();
  const formRef = useRef(null);
  const [data, setData] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sevF, setSevF] = useState('');
  const [statF, setStatF] = useState('');
  const [msg, setMsg] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [upgradingId, setUpgradingId] = useState(null);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [downgradingId, setDowngradingId] = useState(null);
  const [downgradeReason, setDowngradeReason] = useState('');
  const [downgradeTo, setDowngradeTo] = useState('Medium');
  const [assigningId, setAssigningId] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [users, setUsers] = useState([]);
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));

  const load = async () => {
    const { data: issues } = await issuesAPI.getAll(selectedPlants).catch(()=>({data:[]}));
    setData(issues);
    refreshIssueCount();
  };

  const loadUsers = async () => {
    try {
      const { data: userList } = await issuesAPI.getUsers();
      setUsers(userList);
    } catch {}
  };

  useEffect(()=>{ load(); loadUsers(); },[selectedPlants]);

  const autoFill = async (pmno) => {
    fld('pmno', pmno);
    if (pmno.length >= 4) {
      try {
        const { data: p } = await printersAPI.getOne(pmno.trim().toUpperCase());
        const fullLoc = [p.wc, p.loc].filter(Boolean).join(' / ') || p.loc || '';
        setForm(f=>({...f,serial:p.serial||'',model:p.model||'',loc:fullLoc,sapno:p.sapno||'',mesno:p.mesno||''}));
      } catch {}
    }
  };

  const save = async () => {
    if (!form.title || !form.desc) { setMsg('Title and Description required'); return; }
    try {
      const formatted = {
        ...form,
        title: toSentenceCase(form.title),
        desc: toSentenceCase(form.desc),
        action: form.action ? toSentenceCase(form.action) : '',
        user_name: displayName(CURRENT_USER)
      };
      if (editId) await issuesAPI.update(editId, formatted);
      else await issuesAPI.create(formatted);
      load(); clear(); setOpen(false); setMsg('Saved'); setTimeout(()=>setMsg(''),2000);
    } catch { setMsg('Error saving'); }
  };

  const doResolve = async () => {
    if (!actionTaken || !actionTaken.trim()) { setMsg('Action Taken is required'); return; }
    if (!editId) return;
    try {
      await issuesAPI.resolve(editId, { action_taken: actionTaken, user_name: displayName(CURRENT_USER) });
      load(); clear(); setOpen(false); setMsg('Issue resolved'); setTimeout(()=>setMsg(''),2000);
    } catch (e) { setMsg(e.response?.data?.error || 'Error resolving'); }
  };

  const doDowngrade = async () => {
    if (!downgradeReason || !downgradeReason.trim()) { setMsg('Reason is required'); return; }
    if (!downgradingId) return;
    try {
      await issuesAPI.downgrade(downgradingId, { new_severity: downgradeTo, reason: downgradeReason, user_name: displayName(CURRENT_USER) });
      setMsg('Severity downgraded'); setTimeout(()=>setMsg(''),2000);
      setDowngradingId(null);
      setDowngradeReason('');
      load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error downgrading'); }
  };

  const doUpgrade = async () => {
    if (!upgradeReason || !upgradeReason.trim()) { setMsg('Reason is required'); return; }
    if (!upgradingId) return;
    try {
      const issue = data.find(i => i.id === upgradingId);
      const severities = ['Low', 'Medium', 'High'];
      const currentIdx = severities.indexOf(issue.severity);
      const newSeverity = currentIdx < 2 ? severities[currentIdx + 1] : 'High';
      
      await issuesAPI.upgrade(upgradingId, { new_severity: newSeverity, reason: upgradeReason, user_name: displayName(CURRENT_USER) });
      setMsg('Severity upgraded'); setTimeout(()=>setMsg(''),2000);
      setUpgradingId(null);
      setUpgradeReason('');
      load();
    } catch (e) { setMsg(e.response?.data?.error || 'Error upgrading'); }
  };

  const doAssign = async () => {
    if (!assignTo || !assignTo.trim()) { setMsg('Please select a user'); return; }
    if (!assigningId) return;
    try {
      await issuesAPI.assign(assigningId, { assigned_to: assignTo, user_name: displayName(CURRENT_USER) });
      setMsg('Issue assigned'); 
      setTimeout(()=>setMsg(''),2000);
      setAssigningId(null);
      setAssignTo('');
      load();
    } catch (e) { 
      console.error('Error assigning:', e);
      setMsg(e.response?.data?.error || 'Error assigning'); 
    }
  };

  const edit = (issue) => {
    setEditId(issue.id);
    setForm({pmno:issue.pmno||'',serial:issue.serial||'',model:issue.model||'',loc:issue.loc||'',sapno:issue.sapno||'',mesno:issue.mesno||'',title:issue.title||'',desc:issue.desc||'',action:issue.action||'',severity:issue.severity||'Medium',category:issue.category||'Other',reporter:issue.reporter||'',plant_location:issue.plant_location||'B26',status:issue.status||'open'});
    setOpen(true);
    setIsResolving(false);
    setActionTaken('');
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const loadHistory = async (id) => {
    try {
      const { data: hist } = await issuesAPI.getHistory(id);
      setHistory(hist);
      setShowHistory(true);
    } catch {}
  };

  const clear = () => { setEditId(null); setForm(empty); setMsg(''); setIsResolving(false); setActionTaken(''); };

  const filtered = data.filter(i => {
    const q = search.trim().toLowerCase();
    if (!q) return (!sevF||i.severity===sevF) && (!statF||i.status===statF);
    const pmno = String(i.pmno || '').toLowerCase();
    const serial = String(i.serial || '').toLowerCase();
    if (q === pmno || q === serial) return (!sevF||i.severity===sevF) && (!statF||i.status===statF);
    const fuzzyFields = [i.title, i.model, i.loc, i.desc, i.category, i.action, i.reporter];
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
  const breached_c = data.filter(i=>{
    const created = new Date(i.created_at);
    const severityDays = { High: 1, Medium: 3, Low: 7 };
    const days = severityDays[i.severity] || 3;
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + days);
    return deadline < Date.now() && i.status === 'open';
  }).length;

  return (
    <div className="screen">
      <div className="notice n-warn">
        ⚠ High severity issues are stored permanently for audit trail. Other issues are automatically deleted after 10 days of resolution.
      </div>

      <div className="issues-stat-row">
        <div className="kpi" style={{borderColor:'rgba(224,82,82,.3)'}}><div className="kpi-lbl">Open Issues</div><div className="kpi-val" style={{color:'var(--red)'}}>{open_c}</div><div className="kpi-sub">Active on printers</div></div>
        <div className="kpi" style={{borderColor:'rgba(232,160,32,.3)'}}><div className="kpi-lbl">High Severity</div><div className="kpi-val" style={{color:'var(--amber)'}}>{high_c}</div><div className="kpi-sub">Urgent action needed</div></div>
        <div className="kpi"><div className="kpi-lbl">Resolved</div><div className="kpi-val" style={{color:'var(--green)'}}>{resolved_c}</div><div className="kpi-sub">Closed total</div></div>
        <div className="kpi" style={{borderColor:'rgba(239,68,68,.3)'}}><div className="kpi-lbl">Breached Issues</div><div className="kpi-val" style={{color:'var(--red)'}}>{breached_c}</div><div className="kpi-sub">Deadline exceeded</div></div>
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

      <div ref={formRef} className={`collapse-form${open?' open':''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? 'Edit Issue — '+form.pmno : 'Log New Issue'}</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setOpen(false);clear();}}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{marginBottom:'12px'}}>
          <div className="field"><label>PM No *</label><input disabled={editId && !isResolving} value={form.pmno} onChange={e=>autoFill(e.target.value)} placeholder="e.g. 1256"/></div>
          <div className="field"><label>Serial No <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.serial} placeholder="—"/></div>
          <div className="field"><label>Printer Model <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.model} placeholder="—"/></div>
          <div className="field"><label>Location <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.loc} placeholder="—"/></div>
          <div className="field"><label>SAP Printer No <span className="tag-a">Auto</span></label><input disabled={editId && !isResolving} value={form.sapno} onChange={e=>fld('sapno',e.target.value)} placeholder="—"/></div>
          <div className="field"><label>MES Printer No <span className="tag-a">Auto</span></label><input disabled={editId && !isResolving} value={form.mesno} onChange={e=>fld('mesno',e.target.value)} placeholder="—"/></div>
          <div className="field"><label>Plant Location</label>
            <select disabled={editId && !isResolving} value={form.plant_location} onChange={e=>fld('plant_location',e.target.value)}>
              {PLANT_LOCATIONS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
            </select>
          </div>
          <div className="field"><label>Issue Title *</label><input disabled={editId && !isResolving} value={form.title} onChange={e=>fld('title',e.target.value)} placeholder="Brief title of the issue"/></div>
          <div className="field"><label>Severity</label>
            <select disabled={editId && !isResolving} value={form.severity} onChange={e=>fld('severity',e.target.value)}>
              <option value="High">High — Printer Down</option>
              <option value="Medium">Medium — Degraded</option>
              <option value="Low">Low — Minor</option>
            </select>
          </div>
          <div className="field"><label>Category</label>
            <select disabled={editId && !isResolving} value={form.category} onChange={e=>fld('category',e.target.value)}>
              <option>Print Head</option><option>Media / Ribbon</option><option>Connectivity</option>
              <option>Firmware</option><option>Mechanical</option><option>Label Quality</option><option>Other</option>
            </select>
          </div>
          <div className="field"><label>Reported By</label><input disabled={editId && !isResolving} value={form.reporter} onChange={e=>fld('reporter',e.target.value)} placeholder="Your name"/></div>
          <div className="field full"><label>Issue Description *</label><textarea disabled={editId && !isResolving} value={form.desc} onChange={e=>fld('desc',e.target.value)} placeholder="Describe the issue in detail..." style={{minHeight:'70px'}}/></div>
          {!editId || isResolving ? null : <div className="field full"><label>Action Taken</label><textarea value={form.action} onChange={e=>fld('action',e.target.value)} placeholder="What was tried or done to resolve this..." style={{minHeight:'50px'}}/></div>}
          
          {editId && isResolving && (
            <div className="field full"><label>Action Taken *</label><textarea value={actionTaken} onChange={e=>setActionTaken(e.target.value)} placeholder="Describe what action you took to resolve this issue..." style={{minHeight:'70px',borderColor:'var(--green)',backgroundColor:'rgba(74,222,128,.05)'}}/></div>
          )}
        </div>
        
        <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          {!editId ? (
            <>
              <button className="btn btn-success" onClick={save}>Save Issue</button>
              {msg && <span style={{fontSize:'12px',color:'var(--green)',marginLeft:'8px'}}>{msg}</span>}
            </>
          ) : isResolving ? (
            <>
              <button className="btn btn-success" onClick={doResolve}>✓ Resolve Issue</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setIsResolving(false)}>Cancel Resolve</button>
              {msg && <span style={{fontSize:'12px',color:msg.startsWith('Error')?'var(--red)':'var(--green)',marginLeft:'8px'}}>{msg}</span>}
            </>
          ) : form.status === 'resolved' ? (
            <>
              <span style={{fontSize:'12px',color:'var(--green)',fontWeight:'600'}}>✓ Issue Resolved</span>
              <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(editId)} style={{marginLeft:'12px'}}>📋 History</button>
              {msg && <span style={{fontSize:'12px',color:msg.startsWith('Error')?'var(--red)':'var(--green)',marginLeft:'8px'}}>{msg}</span>}
            </>
          ) : (
            <>
              <button className="btn btn-success btn-sm" onClick={()=>setIsResolving(true)}>✓ Resolve</button>
              {form.severity !== 'Low' && <button className="btn btn-ghost btn-sm" onClick={() => { setDowngradingId(editId); setDowngradeTo(form.severity === 'High' ? 'Medium' : 'Low'); setDowngradeReason(''); }}>↓ Downgrade</button>}
              {form.severity !== 'High' && <button className="btn btn-ghost btn-sm" onClick={() => { setUpgradingId(editId); setUpgradeReason(''); }}>↑ Upgrade</button>}
              <button className="btn btn-info btn-sm" onClick={() => { setAssigningId(editId); setAssignTo(data.find(i=>i.id===editId)?.assigned_to || ''); }}>👤 Assign</button>
              <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(editId)}>📋 History</button>
              {msg && <span style={{fontSize:'12px',color:msg.startsWith('Error')?'var(--red)':'var(--green)',marginLeft:'8px'}}>{msg}</span>}
            </>
          )}
        </div>
      </div>

      {/* Downgrade Modal */}
      {downgradingId && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={(e)=>{ if(e.target===e.currentTarget) setDowngradingId(null); }}>
          <div style={{background:'var(--bg)',borderRadius:'8px',padding:'20px',minWidth:'350px',border:'1px solid var(--border)',boxShadow:'0 4px 12px rgba(0,0,0,.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
              <h3 style={{margin:0,color:'var(--text)'}}>⬇ Downgrade Severity</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDowngradingId(null)} style={{padding:'4px 8px'}}>✕</button>
            </div>
            <div className="field" style={{marginBottom:'12px'}}>
              <label>Downgrade to:</label>
              <select value={downgradeTo} onChange={e=>setDowngradeTo(e.target.value)} style={{width:'100%',padding:'8px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)'}}>
                {form.severity === 'High' && <><option value="Medium">Medium</option><option value="Low">Low</option></> }
                {form.severity === 'Medium' && <option value="Low">Low</option>}
              </select>
            </div>
            <div className="field" style={{marginBottom:'15px'}}>
              <label>Reason *</label>
              <textarea value={downgradeReason} onChange={e=>setDowngradeReason(e.target.value)} placeholder="Why are you downgrading this issue?" style={{width:'100%',padding:'8px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)',minHeight:'80px',boxSizing:'border-box'}}/>
            </div>
            {msg && <div style={{fontSize:'12px',color:msg.includes('Error')?'var(--red)':'var(--green)',marginBottom:'10px',padding:'8px',background:msg.includes('Error')?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',borderRadius:'4px'}}>{msg}</div>}
            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setDowngradingId(null)}>Cancel</button>
              <button className="btn btn-warning" onClick={doDowngrade} disabled={!downgradeReason.trim()}>Confirm Downgrade</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradingId && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={(e)=>{ if(e.target===e.currentTarget) setUpgradingId(null); }}>
          <div style={{background:'var(--bg)',borderRadius:'8px',padding:'20px',minWidth:'350px',border:'1px solid var(--border)',boxShadow:'0 4px 12px rgba(0,0,0,.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
              <h3 style={{margin:0,color:'var(--text)'}}>⬆ Upgrade Severity</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setUpgradingId(null)} style={{padding:'4px 8px'}}>✕</button>
            </div>
            <div className="field" style={{marginBottom:'12px'}}>
              <label>Upgrade to:</label>
              <select disabled style={{width:'100%',padding:'8px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)'}}>
                {form.severity === 'Low' && <option>Medium</option>}
                {form.severity === 'Medium' && <option>High</option>}
              </select>
            </div>
            <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:'15px'}}>Severity will be upgraded to next level. Countdown will restart from now.</p>
            <div className="field" style={{marginBottom:'15px'}}>
              <label>Reason *</label>
              <textarea value={upgradeReason} onChange={e=>setUpgradeReason(e.target.value)} placeholder="Why are you upgrading this issue?" style={{width:'100%',padding:'8px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)',minHeight:'80px',boxSizing:'border-box'}}/>
            </div>
            {msg && <div style={{fontSize:'12px',color:msg.includes('Error')?'var(--red)':'var(--green)',marginBottom:'10px',padding:'8px',background:msg.includes('Error')?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',borderRadius:'4px'}}>{msg}</div>}
            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setUpgradingId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={doUpgrade} disabled={!upgradeReason.trim()}>Confirm Upgrade</button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {assigningId && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={(e)=>{ if(e.target===e.currentTarget) { setAssigningId(null); setAssignTo(''); } }}>
          <div style={{background:'var(--bg)',borderRadius:'8px',padding:'20px',minWidth:'350px',border:'1px solid var(--border)',boxShadow:'0 4px 12px rgba(0,0,0,.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
              <h3 style={{margin:0,color:'var(--text)'}}>👤 Assign Issue</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setAssigningId(null);setAssignTo('');}} style={{padding:'4px 8px'}}>✕</button>
            </div>
            <div className="field" style={{marginBottom:'15px'}}>
              <label>Assign to User *</label>
              <select value={assignTo} onChange={e=>setAssignTo(e.target.value)} style={{width:'100%',padding:'8px',borderRadius:'4px',border:'1px solid var(--border)',background:'var(--bg)',color:'var(--text)'}}>
                <option value="">-- Select User --</option>
                {users && users.length > 0 ? users.map(u => <option key={u} value={u}>{u}</option>) : <option value="">No users found</option>}
              </select>
            </div>
            {msg && <div style={{fontSize:'12px',color:msg.includes('Error')?'var(--red)':'var(--green)',marginBottom:'10px',padding:'8px',background:msg.includes('Error')?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)',borderRadius:'4px'}}>{msg}</div>}
            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setAssigningId(null);setAssignTo('');}}>Cancel</button>
              <button className="btn btn-primary" onClick={doAssign} disabled={!assignTo}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,overflow:'auto'}}>
          <div style={{background:'var(--bg)',borderRadius:'8px',padding:'20px',minWidth:'500px',maxHeight:'85vh',border:'1px solid var(--border)',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
              <h3 style={{margin:0,color:'var(--text)'}}>📋 Issue Activity History</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowHistory(false)}>✕</button>
            </div>
            {history.length === 0 ? (
              <p style={{color:'var(--text3)',textAlign:'center',padding:'20px'}}>No activity recorded</p>
            ) : (
              <div style={{fontSize:'13px',lineHeight:'1.6'}}>
                {history.map((act, idx) => {
                  let icon = '•';
                  let color = 'var(--blue)';
                  let title = act.activity_type;
                  
                  if (act.activity_type === 'created') { icon = '✚'; title = 'Issue Created'; color = 'var(--green)'; }
                  else if (act.activity_type === 'resolved') { icon = '✓'; title = 'Issue Resolved'; color = 'var(--green)'; }
                  else if (act.activity_type === 'upgraded') { icon = '↑'; title = 'Severity Upgraded'; color = 'var(--orange)'; }
                  else if (act.activity_type === 'downgraded') { icon = '↓'; title = 'Severity Downgraded'; color = 'var(--text2)'; }
                  else if (act.activity_type === 'assigned') { icon = '👤'; title = 'Issue Assigned'; color = 'var(--blue)'; }
                  
                  return (
                    <div key={idx} style={{background:'var(--bg2)',borderRadius:'6px',padding:'14px',marginBottom:'12px',borderLeft:'4px solid '+color,boxShadow:'0 1px 3px rgba(0,0,0,.1)'}}>
                      <div style={{fontWeight:'700',color:color,marginBottom:'8px',fontSize:'14px'}}>
                        {icon} {title}
                      </div>
                      
                      <div style={{color:'var(--text2)',fontSize:'12px',marginBottom:'8px'}}>
                        <strong>By:</strong> <span style={{color:'var(--text)',fontWeight:'600'}}>{act.user_name}</span> · 
                        <span style={{marginLeft:'8px',color:'var(--text3)'}}>{new Date(act.created_at).toLocaleString('en-GB')}</span>
                      </div>
                      
                      {act.old_severity && act.new_severity && (
                        <div style={{marginTop:'8px',background:'var(--bg)',padding:'8px 10px',borderRadius:'4px',borderLeft:'2px solid var(--border)'}}>
                          <span style={{color:'var(--text3)'}}>Severity Changed:</span> 
                          <span style={{marginLeft:'6px',color:'var(--text)',fontWeight:'600'}}>{act.old_severity}</span>
                          <span style={{marginLeft:'6px',color:'var(--text3)'}}>→</span>
                          <span style={{marginLeft:'6px',color:'var(--text)',fontWeight:'600'}}>{act.new_severity}</span>
                        </div>
                      )}
                      
                      {act.reason && (
                        <div style={{marginTop:'8px',color:'var(--text)',fontSize:'12px',background:'var(--bg)',padding:'8px 10px',borderRadius:'4px',borderLeft:'2px solid var(--border)',fontStyle:'italic'}}>
                          <strong>Reason:</strong> {act.reason}
                        </div>
                      )}
                      
                      {act.action_taken && (
                        <div style={{marginTop:'8px',color:'var(--text)',fontSize:'12px',background:'var(--bg)',padding:'10px',borderRadius:'4px',borderLeft:'3px solid var(--green)'}}>
                          <div style={{fontWeight:'600',color:'var(--green)',marginBottom:'4px'}}>✓ Action Taken by {act.user_name}:</div>
                          <div style={{color:'var(--text)',paddingLeft:'4px'}}>{act.action_taken}</div>
                        </div>
                      )}
                      
                      {act.assigned_to && (
                        <div style={{marginTop:'8px',color:'var(--text)',fontSize:'12px',background:'var(--bg)',padding:'8px 10px',borderRadius:'4px',borderLeft:'2px solid var(--blue)'}}>
                          <strong>👤 Assigned to:</strong> <span style={{color:'var(--blue)',fontWeight:'600'}}>{act.assigned_to}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        {filtered.length === 0
          ? <div className="issues-empty">No issues found.<br/><span style={{fontSize:'11px',color:'var(--text3)'}}>Click "+ Log Issue" to report a new problem.</span></div>
          : filtered.map(issue => {
            const created = new Date(issue.created_at);
            
            // Calculate deadline if not set (for backward compatibility)
            let deadline = issue.resolution_deadline ? new Date(issue.resolution_deadline) : null;
            if (!deadline) {
              const severityDays = {
                'High': 1,
                'Medium': 3,
                'Low': 7
              };
              const days = severityDays[issue.severity] || 3;
              deadline = new Date(created);
              deadline.setDate(deadline.getDate() + days);
            }
            
            const now = Date.now();
            const msLeft = deadline - now;
            const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;
            const hoursLeft = msLeft > 0 ? Math.ceil(msLeft / 3600000) : 0;
            const isBreached = msLeft <= 0 && issue.status === 'open';
            
            let timeDisplay = '';
            if (issue.status === 'open') {
              if (daysLeft > 1) timeDisplay = `${daysLeft}d left`;
              else if (daysLeft === 1) timeDisplay = `${hoursLeft}h left`;
              else if (hoursLeft > 0) timeDisplay = `${hoursLeft}h left`;
              else timeDisplay = 'Breached!';
            }
            
            const sevCls = issue.severity==='High'?'severity-high':issue.severity==='Medium'?'severity-medium':'severity-low';
            const sevBadge = issue.severity==='High'?'ib-high':issue.severity==='Medium'?'ib-medium':'ib-low';
            const statBadge = issue.status==='open'?'ib-open':'ib-resolved';
            const age = Math.floor((Date.now() - created.getTime()) / 86400000);
            
            // Calculate progress for progress bar
            const msTotal = deadline - created.getTime();
            const msUsed = now - created.getTime();
            const progressPercent = msTotal > 0 ? Math.min(100, (msUsed / msTotal) * 100) : 100;
            const progressColor = isBreached ? 'var(--red)' : progressPercent > 75 ? 'var(--amber)' : progressPercent > 50 ? 'var(--orange)' : 'var(--green)';
            
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
                    {issue.status === 'open' && (
                      <div style={{display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end',width:'70px'}}>
                        <span style={{fontSize:'11px',fontWeight:700,color:isBreached?'var(--red)':'var(--text)',padding:'4px 8px',background:isBreached?'rgba(239,68,68,.15)':'rgba(217,119,6,.15)',borderRadius:'4px',border:'1px solid '+( isBreached?'rgba(239,68,68,.3)':'rgba(217,119,6,.3)'),whiteSpace:'nowrap',width:'100%',textAlign:'center'}}>
                          {isBreached ? '⚠️ Breached' : `⏱ ${timeDisplay}`}
                        </span>
                        <div style={{position:'relative',height:'12px',background:'transparent',borderRadius:'6px',overflow:'hidden',border:'1.5px solid '+progressColor,boxShadow:'0 1px 4px rgba(0,0,0,.15)',width:'100%'}}>
                          <div style={{height:'100%',width:progressPercent+'%',background:progressColor,transition:'width 0.3s ease',borderRadius:'5px',boxShadow:'inset 0 1px 2px rgba(255,255,255,.2)'}}/>
                        </div>
                        <div style={{fontSize:'9px',color:progressColor,fontWeight:'700',textAlign:'center',width:'100%'}}>
                          {progressPercent.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="issue-desc">{issue.desc}</div>
                {issue.action && <div style={{fontSize:'11px',color:'var(--text3)',background:'var(--bg)',borderRadius:'5px',padding:'6px 10px',marginBottom:'8px',border:'1px solid var(--border)'}}><strong>Action:</strong> {issue.action}</div>}
                <div className="issue-footer">
                  <span>By {issue.last_activity_user||issue.reporter} · {age===0?'Today':age+' day'+(age!==1?'s':'')+' ago'}</span>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
                    {issue.severity_at_resolve && <span style={{fontSize:'9px',color:'var(--text2)',padding:'2px 7px',borderRadius:'10px',background:'var(--bg2)'}}>Resolved as {issue.severity_at_resolve}</span>}
                    {issue.resolved_at && <span style={{fontSize:'9px',color:'var(--green)',padding:'2px 7px',borderRadius:'10px',background:'var(--green-bg)'}}>✓ {new Date(issue.resolved_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>}
                    {issue.assigned_to && <span style={{fontSize:'9px',color:'var(--blue)',padding:'2px 7px',borderRadius:'10px',background:'rgba(59,130,246,.1)'}}>👤 {issue.assigned_to}</span>}
                  </div>
                </div>
                {isBreached && issue.status === 'open' && (
                  <div style={{display:'flex',gap:'6px',marginTop:'10px',padding:'10px',background:'rgba(239,68,68,.08)',borderRadius:'4px',borderTop:'2px solid var(--red)',flexWrap:'wrap'}}>
                    <button className="btn btn-success btn-sm" onClick={(e)=>{e.stopPropagation();setIsResolving(true);setEditId(issue.id);setForm({pmno:issue.pmno||'',serial:issue.serial||'',model:issue.model||'',loc:issue.loc||'',sapno:issue.sapno||'',mesno:issue.mesno||'',title:issue.title||'',desc:issue.desc||'',action:issue.action||'',severity:issue.severity||'Medium',category:issue.category||'Other',reporter:issue.reporter||'',plant_location:issue.plant_location||'B26',status:issue.status||'open'});}}>✓ Resolve</button>
                    {issue.severity !== 'Low' && <button className="btn btn-ghost btn-sm" onClick={(e)=>{e.stopPropagation();setDowngradingId(issue.id);setDowngradeTo(issue.severity === 'High' ? 'Medium' : 'Low');setDowngradeReason('');}}>↓ Downgrade</button>}
                    {issue.severity !== 'High' && <button className="btn btn-ghost btn-sm" onClick={(e)=>{e.stopPropagation();setUpgradingId(issue.id);setUpgradeReason('');}}>↑ Upgrade</button>}
                    <button className="btn btn-info btn-sm" onClick={(e)=>{e.stopPropagation();setAssigningId(issue.id);setAssignTo('');}}>👤 Assign</button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
