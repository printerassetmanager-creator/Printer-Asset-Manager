import React, { useEffect, useState } from 'react';
import { printersAPI, vlanAPI, pmPastedAPI } from '../utils/api';
import { buildLoftwareValue, getDefaultLoftwareForSap, LOFTWARE_OPTIONS, parseLoftwareValue } from '../utils/loftware';

function nowStr() { return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }

export default function PmForm() {
  const [pm, setPm] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({serial:'',model:'',make:'',dpi:'',ip:'',firmware:'',pmno_disp:'',pmdate:'',pasted_at:nowStr(),stage:'',bay:'',wc:'',loc:'',sapno:'',mesno:'',loftware:'',engineer:'Aniket',shift:'1st Shift',remarks:''});
  const [vlanInfo, setVlanInfo] = useState(null);
  const [msg, setMsg] = useState('');
  const [secondaryLoftware, setSecondaryLoftware] = useState('');
  const fld = (k,v) => setForm(f=>({...f,[k]:v}));
  const allowTwoLoftware = Boolean(form.sapno && form.mesno);

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
      if (p.ip) {
        try { const { data: vl } = await vlanAPI.getByIp(p.ip); setVlanInfo(vl); } catch {}
      }
    } catch {
      if (pm.length > 2) setStatus(<span style={{color:'var(--red)'}}>Not found</span>);
    }
  };

  const save = async () => {
    try {
      await pmPastedAPI.create({ ...form, pmno: pm.trim().toUpperCase(), loftware: buildLoftwareValue(form.loftware, allowTwoLoftware ? secondaryLoftware : '') });
      setMsg('✓ PM pasted log saved'); setTimeout(()=>setMsg(''),2500);
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
            <div className="sec">Printer Details <span style={{fontSize:'10px',color:'var(--text3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>Auto-filled · Editable</span></div>
            <div className="fgrid fg2" style={{marginBottom:'10px'}}>
              <div className="field"><label>Serial No</label><input value={form.serial} onChange={e=>fld('serial',e.target.value)} placeholder="Serial number"/></div>
              <div className="field"><label>Model</label><input value={form.model} onChange={e=>fld('model',e.target.value)} placeholder="Printer model"/></div>
              <div className="field"><label>Make / Brand</label><input value={form.make} onChange={e=>fld('make',e.target.value)} placeholder="Honeywell / Zebra..."/></div>
              <div className="field"><label>DPI</label><input value={form.dpi} onChange={e=>fld('dpi',e.target.value)} placeholder="e.g. 203"/></div>
              <div className="field"><label>IP Address</label><input value={form.ip} onChange={e=>fld('ip',e.target.value)} placeholder="e.g. 192.168.1.101"/></div>
              <div className="field"><label>Firmware Version</label><input value={form.firmware} onChange={e=>fld('firmware',e.target.value)} placeholder="Firmware ver."/></div>
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
              <div className="field"><label>Remarks</label><input value={form.remarks} onChange={e=>fld('remarks',e.target.value)} placeholder="Any remarks..."/></div>
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          <div className="card">
            <div className="sec">Location Details</div>
            {vlanInfo !== null && (
              vlanInfo
                ? <div className="vlan-match" style={{marginBottom:'8px'}}>✓ Location from VLAN — edit if wrong</div>
                : <div className="vlan-nomatch" style={{marginBottom:'8px'}}>⚠ IP not in VLAN — enter manually</div>
            )}
            <div className="fgrid" style={{gap:'10px'}}>
              <div className="field"><label>Stage</label><input value={form.stage} onChange={e=>fld('stage',e.target.value)} placeholder="e.g. SMT-2"/></div>
              <div className="field"><label>Bay</label><input value={form.bay} onChange={e=>fld('bay',e.target.value)} placeholder="e.g. Bay-04"/></div>
              <div className="field"><label>Workcell</label><input value={form.wc} onChange={e=>fld('wc',e.target.value)} placeholder="e.g. WC-14B"/></div>
              <div className="field"><label>Full Location <span style={{fontSize:'9px',color:'var(--amber)'}}>(editable if wrong)</span></label><input value={form.loc} onChange={e=>fld('loc',e.target.value)} placeholder="Floor / Line description"/></div>
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
            <div className="sec">Audit Trail</div>
            <div style={{fontSize:'12px',color:'var(--text3)',padding:'14px',textAlign:'center'}}>No PM paste records yet</div>
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
