import React, { useEffect, useState } from 'react';
import { printersAPI, pmPastedAPI } from '../utils/api';
import { buildLoftwareValue, getDefaultLoftwareForSap, LOFTWARE_OPTIONS, parseLoftwareValue } from '../utils/loftware';
import { CURRENT_USER } from '../context/AppContext';

function nowStr() { return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

export default function PmForm() {
  const [pm, setPm] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({serial:'',model:'',make:'',dpi:'',ip:'',firmware:'',pmno_disp:'',pmdate:'',pasted_at:nowStr(),stage:'',bay:'',wc:'',loc:'',sapno:'',mesno:'',loftware:'',user:CURRENT_USER,engineer:'Aniket',shift:'1st Shift'});
  const [msg, setMsg] = useState('');
  const [secondaryLoftware, setSecondaryLoftware] = useState('');
  const [auditTrail, setAuditTrail] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));
  const allowTwoLoftware = Boolean(form.sapno && form.mesno);

  const loadAuditTrail = async () => {
    setLoadingAudit(true);
    try {
      const { data } = await pmPastedAPI.getAll();
      setAuditTrail(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch {
      setAuditTrail([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadAuditTrail();
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
    const pmno = pm.trim().toUpperCase();
    try {
      const { data: p } = await printersAPI.getOne(pmno);
      const loftware = parseLoftwareValue(p.loftware);
      setForm(f=>({...f,serial:p.serial||'',model:p.model||'',make:p.make||'',dpi:p.dpi||'',ip:p.ip||'',firmware:'R17.09.01',pmno_disp:p.pmno,pmdate:p.pmdate||'',stage:p.stage||'',bay:p.bay||'',wc:p.wc||'',loc:p.loc||'',sapno:p.sapno||'',mesno:p.mesno||'',loftware:loftware.primary||'',pasted_at:nowStr()}));
      setSecondaryLoftware(loftware.secondary || '');
      setStatus(<span style={{color:'var(--green)'}}>✓ {p.serial} loaded</span>);
    } catch {
      if (pm.length > 2) setStatus(<span style={{color:'var(--red)'}}>Not found</span>);
    }
  };

  const save = async () => {
    try {
      await pmPastedAPI.create({ ...form, pmno: pm.trim().toUpperCase(), loftware: buildLoftwareValue(form.loftware, allowTwoLoftware ? secondaryLoftware : '') });
      setMsg('✓ PM pasted log saved'); 
      setTimeout(()=>setMsg(''),2500);
      await loadAuditTrail();
    } catch { setMsg('Error saving'); }
  };

  return (
    <div className="screen">
      <div className="notice n-info">ℹ Enter PM number to load printer details. PM Pasted date/time is locked to current time.</div>
      <div className="frow" style={{alignItems:'flex-end',gap:'10px',marginBottom:'0'}}>
        <div className="field" style={{maxWidth:'200px'}}>
          <label>PM Number *</label>
          <input className="pm-in" placeholder="e.g. 1256" value={pm} onChange={e=>setPm(e.target.value)}/>
        </div>
        <button className="btn btn-primary" onClick={fetchPrinter}>▶ Load Details</button>
        <div style={{fontSize:'12px',color:'var(--text3)',paddingBottom:'4px'}}>{status}</div>
      </div>

      <div className="g2" style={{alignItems:'start'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div className="card">
            <div className="sec">Printer Details <span style={{fontSize:'10px',color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>Auto-filled</span></div>
            <div className="fgrid fg2" style={{marginBottom:'10px'}}>
              <div className="field"><label>Serial No <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.serial} placeholder="-"/></div>
              <div className="field"><label>Model <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.model} placeholder="-"/></div>
              <div className="field"><label>Make / Brand <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.make} placeholder="-"/></div>
              <div className="field"><label>DPI <span className="tag-r">Auto</span></label><input className="af" readOnly value={form.dpi} placeholder="-"/></div>
              <div className="field"><label>IP Address</label><input value={form.ip} onChange={e=>fld('ip',e.target.value)} placeholder="e.g. 192.168.1.101"/></div>
            </div>
            <div className="fgrid fg2">
              <div className="field"><label>SAP Printer No</label><input value={form.sapno} onChange={e=>fld('sapno',e.target.value)} placeholder="SAP Printer No"/></div>
              <div className="field"><label>MES Printer No</label><input value={form.mesno} onChange={e=>fld('mesno',e.target.value)} placeholder="MES Printer No"/></div>
              <div className="field"><label>{allowTwoLoftware ? 'Loftware Version 1' : 'Loftware Version'}</label>
                <select value={form.loftware} onChange={e=>fld('loftware',e.target.value)}>
                  <option value="">-- Select Loftware --</option>
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
            </div>
          </div>
          <div className="card">
            <div className="sec">PM Details</div>
            <div className="fgrid fg2">
              <div className="field"><label>PM No</label><input className="af" readOnly value={form.pmno_disp} placeholder="—"/></div>
              <div className="field"><label>PM Date</label><input value={form.pmdate} onChange={e=>fld('pmdate',e.target.value)} placeholder="Last PM date"/></div>
              <div className="field"><label>PM Pasted Date &amp; Time <span className="tag-r" style={{color:'var(--red)'}}>Locked · Auto</span></label><input className="af" readOnly value={form.pasted_at} style={{cursor:'not-allowed'}}/></div>
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div className="card">
            <div className="sec">Location Details</div>
            <div className="fgrid fg3" style={{gap:'10px',marginBottom:'10px'}}>
              <div className="field"><label>Stage</label><input value={form.stage} onChange={e=>fld('stage',e.target.value)} placeholder="e.g. SMT-2"/></div>
              <div className="field"><label>Bay</label><input value={form.bay} onChange={e=>fld('bay',e.target.value)} placeholder="e.g. Bay-04"/></div>
              <div className="field"><label>Workcell</label><input value={form.wc} onChange={e=>fld('wc',e.target.value)} placeholder="e.g. WC-14B"/></div>
            </div>
            <div className="fgrid">
              <div className="field"><label>Full Location <span style={{fontSize:'9px',color:'var(--green)'}}>Auto-combined</span></label><input className="af" readOnly value={[form.wc, form.bay, form.stage].filter(Boolean).join(' / ') || '-'} placeholder="Workcell / Bay / Stage"/></div>
            </div>
          </div>
          <div className="card">
            <div className="sec">Engineer Info</div>
            <div className="fgrid fg2">
              <div className="field"><label>Engineer Name</label><input value={form.engineer} onChange={e=>fld('engineer',e.target.value)} placeholder="PM pasted by..."/></div>
              <div className="field"><label>Shift</label>
                <select value={form.shift} onChange={e=>fld('shift',e.target.value)}>
                  <option>1st Shift</option><option>2nd Shift</option><option>3rd Shift</option><option>General Shift</option>
                </select>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="sec">Audit Trail - PM Pasted Log</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PM No</th>
                    <th>User</th>
                    <th>Engineer</th>
                    <th>Shift</th>
                    <th>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAudit ? (
                    <tr><td colSpan="5" style={{textAlign:'center'}}>Loading...</td></tr>
                  ) : auditTrail.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign:'center',color:'var(--text3)'}}>No PM paste records yet</td></tr>
                  ) : (
                    auditTrail.map((a, i) => {
                      const dateTime = a.pasted_at ? new Date(a.pasted_at).toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';
                      return (
                        <tr key={i}>
                          <td className="em">{a.pmno || '-'}</td>
                          <td>{a.user || '-'}</td>
                          <td>{a.engineer || '-'}</td>
                          <td>{a.shift || '-'}</td>
                          <td style={{fontSize:'11px'}}>{dateTime}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {msg && <div className="notice n-ok">{msg}</div>}
      <div style={{display:'flex',gap:'8px'}}>
        <button className="btn btn-success" onClick={save}>Save PM Log</button>
      </div>
    </div>
  );
}
