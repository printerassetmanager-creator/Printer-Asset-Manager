import React, { useEffect, useState } from 'react';
import { hpPrintersAPI, cartridgesAPI } from '../utils/api';
import { useApp, PLANT_LOCATIONS, displayName } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

function CartGauge({ pct }) {
  if (pct === null || pct === undefined) {
    return <span style={{ fontSize: '11px', color: 'var(--text3)' }}>N/A</span>;
  }

  const color = pct >= 50 ? 'var(--green)' : pct >= 20 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="cart-gauge-wrap">
      <div className="cart-gauge-bar">
        <div className="cart-gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="cart-pct" style={{ color }}>{pct}%</div>
    </div>
  );
}

const emptyPrinter = {
  tag: '',
  model: '',
  ip: '',
  loc: '',
  stage: '',
  bay: '',
  wc: '',
  cartmodel: '',
  black_pct: 85,
  color_pct: null,
  online: true,
  plant_location: 'B26',
  error_status: null,
  last_cartridge_sync: null,
};

const emptyCart = {
  model: '',
  dn: '',
  type: 'Black',
  compat: '',
  stock: 0,
  min: 2,
  yield: '',
  loc: '',
};

export default function HpPrinters() {
  const { selectedPlants, user } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const loggedInUser = displayName(user?.email || 'guest');

  const [tab, setTab] = useState('overview');
  const [printers, setPrinters] = useState([]);
  const [carts, setCarts] = useState([]);
  const [usageLog, setUsageLog] = useState([]);
  const [pForm, setPForm] = useState(emptyPrinter);
  const [cForm, setCForm] = useState(emptyCart);
  const [editCartId, setEditCartId] = useState(null);
  const [pOpen, setPOpen] = useState(false);
  const [cOpen, setCOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [showUseCart, setShowUseCart] = useState(false);
  const [useCartForm, setUseCartForm] = useState({ dn: '', model: '', qty: 1, wc: '', ip: '', printer_location: '', printer_tag: '', used_by: loggedInUser });
  const [fetchingPrinterInfo, setFetchingPrinterInfo] = useState(false);
  const [fetchingCartridge, setFetchingCartridge] = useState(false);
  const [printerInfo, setPrinterInfo] = useState(null);

  const loadPrinters = () => hpPrintersAPI.getAll(selectedPlants)
    .then((r) => setPrinters(Array.isArray(r.data) ? r.data : []))
    .catch(() => setPrinters([]));
  const loadCarts = () => cartridgesAPI.getAll()
    .then((r) => setCarts(Array.isArray(r.data) ? r.data : []))
    .catch(() => setCarts([]));
  const loadUsageLog = () => cartridgesAPI.getUsageLog()
    .then((r) => setUsageLog(Array.isArray(r.data) ? r.data : []))
    .catch(() => setUsageLog([]));

  const fetchPrinterInfoByIp = async (ip) => {
    if (!ip) {
      setPrinterInfo(null);
      return;
    }
    setFetchingPrinterInfo(true);
    try {
      const matchedPrinter = printers.find((p) => p.ip === ip.trim());
      if (matchedPrinter) {
        setPrinterInfo(matchedPrinter);
        setUseCartForm((prev) => ({
          ...prev,
          printer_location: matchedPrinter.loc || '',
          printer_tag: matchedPrinter.tag || '',
          wc: matchedPrinter.wc || prev.wc,
        }));
      } else {
        setPrinterInfo(null);
      }
    } catch (error) {
      setPrinterInfo(null);
    } finally {
      setFetchingPrinterInfo(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [selectedPlants]);

  useEffect(() => {
    loadCarts();
    loadUsageLog();
  }, []);

  useEffect(() => {
    setUseCartForm((prev) => ({ ...prev, used_by: loggedInUser }));
  }, [loggedInUser]);

  const matchedCart = carts.find((cart) => {
    const formDn = String(useCartForm.dn || '').trim().toLowerCase();
    const formModel = String(useCartForm.model || '').trim().toLowerCase();
    const cartDn = String(cart.dn || '').trim().toLowerCase();
    const cartModel = String(cart.model || '').trim().toLowerCase();
    return (formDn && cartDn === formDn) || (formModel && cartModel === formModel);
  }) || null;

  const pfld = (key, value) => setPForm((prev) => ({ ...prev, [key]: value }));
  const cfld = (key, value) => setCForm((prev) => ({ ...prev, [key]: value }));

  const fetchCartridgeInfo = async () => {
    if (!pForm.ip) {
      setMsg('IP address required');
      return;
    }

    setFetchingCartridge(true);
    try {
      const response = await fetch(`/api/hp-printers/cartridge-info/${pForm.ip}`);
      const data = await response.json();
      if (data.error) {
        setMsg(`Error: ${data.error}`);
      } else {
        setPForm((prev) => ({
          ...prev,
          cartmodel: data.cartmodel,
          black_pct: data.black_pct || 85,
          color_pct: data.color_pct,
        }));
        setMsg('Cartridge info fetched successfully!');
      }
    } catch (error) {
      setMsg(`Failed to fetch: ${error.message}`);
    } finally {
      setFetchingCartridge(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const savePrinter = async () => {
    if (!pForm.model || !pForm.ip) {
      alert('Model and IP required');
      return;
    }

    const formatted = {
      ...pForm,
      model: toSentenceCase(pForm.model),
      loc: toSentenceCase(pForm.loc),
      tag: toSentenceCase(pForm.tag),
      stage: toSentenceCase(pForm.stage),
      bay: toSentenceCase(pForm.bay),
      wc: toSentenceCase(pForm.wc),
      cartmodel: toSentenceCase(pForm.cartmodel),
    };

    await hpPrintersAPI.create(formatted);
    loadPrinters();
    setPForm(emptyPrinter);
    setPOpen(false);
    setMsg('HP printer added');
    setTimeout(() => setMsg(''), 2000);
  };

  const saveCart = async () => {
    if (!cForm.model) {
      setMsg('Cartridge model required');
      return;
    }

    if (editCartId) {
      await cartridgesAPI.update(editCartId, cForm);
    } else {
      await cartridgesAPI.create(cForm);
    }

    loadCarts();
    setCForm(emptyCart);
    setEditCartId(null);
    setCOpen(false);
    setMsg('Saved');
    setTimeout(() => setMsg(''), 2000);
  };

  const delCart = async () => {
    if (!editCartId) return;
    await cartridgesAPI.delete(editCartId);
    loadCarts();
    setCForm(emptyCart);
    setEditCartId(null);
    setCOpen(false);
  };

  const editCart = (cart) => {
    setEditCartId(cart.id);
    setCForm({
      model: cart.model || '',
      dn: cart.dn || '',
      type: cart.type || 'Black',
      compat: cart.compat || '',
      stock: cart.stock || 0,
      min: cart.min || 2,
      yield: cart.yield || '',
      loc: cart.loc || '',
    });
    setCOpen(true);
  };

  const [showModelDNs, setShowModelDNs] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedModelDNs, setSelectedModelDNs] = useState([]);

  const showDNsForModel = (model) => {
    const modelValue = String(model || '').trim();
    if (!modelValue) return;
    const matches = carts.filter((cart) => String(cart.model || '').trim().toLowerCase() === modelValue.toLowerCase());
    setSelectedModel(modelValue);
    setSelectedModelDNs(matches);
    setShowModelDNs(true);
  };

  const resetUseCartForm = () => {
    setUseCartForm({ dn: '', model: '', qty: 1, wc: '', ip: '', printer_location: '', printer_tag: '', used_by: loggedInUser });
    setPrinterInfo(null);
  };

  const logUseCart = async () => {
    if (!useCartForm.dn && !useCartForm.model) {
      alert('DN No or cartridge model required');
      return;
    }

    if (!matchedCart) {
      alert('Matching cartridge model not found in inventory');
      return;
    }

    if ((matchedCart.stock || 0) < useCartForm.qty) {
      alert(`Only ${matchedCart.stock || 0} cartridge(s) available in stock`);
      return;
    }

    try {
      await cartridgesAPI.use({
        ...useCartForm,
        used_by: loggedInUser,
        printer_location: useCartForm.printer_location || useCartForm.wc,
        printer_tag: useCartForm.printer_tag,
      });
      setShowUseCart(false);
      loadCarts();
      loadUsageLog();
      resetUseCartForm();
      setMsg('Cartridge usage logged');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Unable to log cartridge usage');
      setTimeout(() => setMsg(''), 2500);
    }
  };

  return (
    <div className="screen">
      <div className="hp-tabs">
        {['overview', 'cartridge', 'hpdash'].map((screen, index) => (
          <div key={screen} className={`hp-tab${tab === screen ? ' active' : ''}`} onClick={() => setTab(screen)}>
            {['HP Printers Overview', 'Cartridge Inventory', 'Cartridge Dashboard'][index]}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="hp-panel active">
          <div className="card-hd" style={{ padding: 0, marginBottom: '12px' }}>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', flex: 1 }}>
              <div className="kpi" style={{ borderColor: 'rgba(34,211,238,.25)' }}>
                <div className="kpi-lbl">HP Printers</div>
                <div className="kpi-val" style={{ color: 'var(--cyan)' }}>{printers.length}</div>
                <div className="kpi-sub">Active</div>
              </div>
              <div className="kpi c-online">
                <div className="kpi-lbl">Online</div>
                <div className="kpi-val">{printers.filter((p) => p.online).length}</div>
                <div className="kpi-sub">Responding</div>
              </div>
              <div className="kpi c-due">
                <div className="kpi-lbl">Low Cartridge</div>
                <div className="kpi-val">{printers.filter((p) => p.black_pct < 20 || (p.color_pct !== null && p.color_pct < 20)).length}</div>
                <div className="kpi-sub">&lt; 20%</div>
              </div>
              <div className="kpi c-offline">
                <div className="kpi-lbl">Offline</div>
                <div className="kpi-val">{printers.filter((p) => !p.online).length}</div>
                <div className="kpi-sub">No ping</div>
              </div>
            </div>
            {isAdmin && (
              <div style={{ marginLeft: '14px', flexShrink: 0 }}>
                <button className="btn btn-primary" onClick={() => setPOpen((open) => !open)}>+ Add HP Printer</button>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className={`collapse-form${pOpen ? ' open' : ''}`}>
              <div className="cf-header">
                <div className="cf-title">Add HP Printer</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPOpen(false)}>Cancel</button>
              </div>
              <div className="fgrid fg4" style={{ marginBottom: '12px' }}>
                <div className="field"><label>HP Model *</label><input value={pForm.model} onChange={(e) => pfld('model', e.target.value)} placeholder="e.g. HP LaserJet Pro M404" /></div>
                <div className="field" style={{ position: 'relative' }}>
                  <label>IP Address *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input value={pForm.ip} onChange={(e) => pfld('ip', e.target.value)} placeholder="e.g. 192.168.1.201" style={{ flex: 1 }} />
                    <button className="btn btn-info btn-sm" onClick={fetchCartridgeInfo} disabled={fetchingCartridge} style={{ whiteSpace: 'nowrap', padding: '8px 12px' }}>
                      {fetchingCartridge ? 'Fetching...' : 'Fetch'}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Plant Location</label>
                  <select value={pForm.plant_location} onChange={(e) => pfld('plant_location', e.target.value)}>
                    {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
                  </select>
                </div>
                <div className="field"><label>Location</label><input value={pForm.loc} onChange={(e) => pfld('loc', e.target.value)} placeholder="e.g. Floor 1 - Admin Block" /></div>
                <div className="field"><label>Hostname / Tag</label><input value={pForm.tag} onChange={(e) => pfld('tag', e.target.value)} placeholder="e.g. HP-ADMIN-01" /></div>
                <div className="field"><label>Stage</label><input value={pForm.stage} onChange={(e) => pfld('stage', e.target.value)} placeholder="e.g. Admin" /></div>
                <div className="field"><label>Bay</label><input value={pForm.bay} onChange={(e) => pfld('bay', e.target.value)} placeholder="e.g. Bay-01" /></div>
                <div className="field"><label>Workcell</label><input value={pForm.wc} onChange={(e) => pfld('wc', e.target.value)} placeholder="e.g. WC-A1" /></div>
                <div className="field"><label>Cartridge Model</label><input value={pForm.cartmodel} onChange={(e) => pfld('cartmodel', e.target.value)} placeholder="e.g. HP 26A (CF226A)" /></div>
                <div className="field"><label>Black Cartridge %</label><input type="number" min="0" max="100" value={pForm.black_pct} onChange={(e) => pfld('black_pct', parseInt(e.target.value, 10))} placeholder="85" /></div>
                <div className="field"><label>Color Cartridge %</label><input type="number" min="0" max="100" value={pForm.color_pct || ''} onChange={(e) => pfld('color_pct', e.target.value ? parseInt(e.target.value, 10) : null)} placeholder="Optional" /></div>
              </div>
              <button className="btn btn-success" onClick={savePrinter}>Add HP Printer</button>
              {msg && <span style={{ fontSize: '12px', color: 'var(--green)', marginLeft: '10px' }}>{msg}</span>}
            </div>
          )}

          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Hostname / Tag</th><th>Model</th><th>IP Address</th><th>Location</th><th>Stage / Bay</th><th>Online</th><th>Cartridge Info</th><th>Levels</th><th>Status</th></tr></thead>
              <tbody>
                {printers.map((printer) => (
                  <tr key={printer.id}>
                    <td className="em">{printer.tag}</td>
                    <td>{printer.model}</td>
                    <td className="mono">{printer.ip}</td>
                    <td style={{ fontSize: '11px' }}>{printer.loc}</td>
                    <td>{printer.stage} / {printer.bay}</td>
                    <td>{printer.online ? <span className="badge b-online"><span className="badge-dot" />Online</span> : <span className="badge b-offline"><span className="badge-dot" />Offline</span>}</td>
                    <td style={{ fontSize: '11px' }}>
                      {printer.cartmodel ? (
                        <div>
                          <div>{printer.cartmodel}</div>
                          <div style={{ color: 'var(--text3)', fontSize: '10px', marginTop: '2px' }}>
                            Synced: {printer.last_cartridge_sync ? new Date(printer.last_cartridge_sync).toLocaleTimeString() : 'Never'}
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <CartGauge pct={printer.black_pct} />
                        {printer.color_pct !== null && <CartGauge pct={printer.color_pct} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {printer.error_status ? (
                          <span className="badge b-err" style={{ padding: '4px 8px', fontSize: '10px', textAlign: 'center' }}>{printer.error_status}</span>
                        ) : (
                          <span className={`badge ${printer.black_pct < 20 || (printer.color_pct !== null && printer.color_pct < 20) ? 'b-err' : 'b-ok'}`} style={{ padding: '4px 8px', fontSize: '10px' }}>
                            {printer.black_pct < 20 || (printer.color_pct !== null && printer.color_pct < 20) ? 'Low Cartridge' : 'OK'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'cartridge' && (
        <div className="hp-panel active">
          <div className="card-hd" style={{ padding: 0, marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Cartridge stock, model numbers, usage log and availability</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-amber btn-sm" onClick={() => setShowUseCart(true)}>Use Cartridge</button>
              {isAdmin && <button className="btn btn-primary" onClick={() => { setEditCartId(null); setCForm(emptyCart); setCOpen((open) => !open); }}>+ Add Cartridge</button>}
            </div>
          </div>

          {isAdmin && (
            <div className={`collapse-form${cOpen ? ' open' : ''}`}>
              <div className="cf-header">
                <div className="cf-title">Add / Edit Cartridge Details</div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setCOpen(false); setCForm(emptyCart); setEditCartId(null); }}>Cancel</button>
              </div>
              <div className="fgrid fg4" style={{ marginBottom: '12px' }}>
                <div className="field"><label>Cartridge Model *</label><input value={cForm.model} onChange={(e) => cfld('model', e.target.value)} placeholder="e.g. HP 26A (CF226A)" /></div>
                <div className="field"><label>DN / Part Number</label><input value={cForm.dn} onChange={(e) => cfld('dn', e.target.value)} placeholder="e.g. CF226A" /></div>
                <div className="field"><label>Type</label><select value={cForm.type} onChange={(e) => cfld('type', e.target.value)}><option>Black</option><option>Cyan</option><option>Magenta</option><option>Yellow</option><option>Color Set</option></select></div>
                <div className="field"><label>Compatible HP Models</label><input value={cForm.compat} onChange={(e) => cfld('compat', e.target.value)} placeholder="M404, M406, M428..." /></div>
                <div className="field"><label>Stock Available</label><input type="number" value={cForm.stock} onChange={(e) => cfld('stock', parseInt(e.target.value, 10) || 0)} min="0" /></div>
                <div className="field"><label>Storage Location</label><input value={cForm.loc} onChange={(e) => cfld('loc', e.target.value)} placeholder="Rack B - Shelf 2" /></div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-success" onClick={saveCart}>Save Cartridge</button>
                {editCartId && <button className="btn btn-danger btn-sm" onClick={delCart}>Delete</button>}
                {msg && <span style={{ fontSize: '12px', color: 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
              </div>
            </div>
          )}

          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Cartridge Model</th><th>Type</th><th>Compatible Models</th><th>Stock</th><th>Location</th><th>Status</th><th>Edit</th></tr></thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id}>
                    <td className="em">
                      <button
                        type="button"
                        onClick={() => showDNsForModel(cart.model)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          margin: 0,
                          color: 'var(--blue)',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontSize: 'inherit',
                          fontFamily: 'inherit',
                        }}
                      >
                        {cart.model}
                      </button>
                    </td>
                    <td>{cart.type}</td>
                    <td style={{ fontSize: '11px' }}>{cart.compat}</td>
                    <td className={cart.stock === 0 ? 'red' : cart.stock <= cart.min ? 'amber' : 'green'} style={{ fontWeight: 600 }}>{cart.stock}</td>
                    <td style={{ fontSize: '11px' }}>{cart.loc}</td>
                    <td><span className={`badge ${cart.stock === 0 ? 'b-out' : cart.stock <= cart.min ? 'b-low' : 'b-instock'}`}>{cart.stock === 0 ? 'Out' : cart.stock <= cart.min ? 'Low Stock' : 'In Stock'}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => editCart(cart)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showModelDNs && (
            <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowModelDNs(false); }}>
              <div className="modal" style={{ minWidth: '420px', maxWidth: '640px' }}>
                <div className="modal-title">Available DN / Part Numbers for {selectedModel}</div>
                <button className="modal-close" onClick={() => setShowModelDNs(false)}>X</button>
                <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text3)' }}>
                  Showing {selectedModelDNs.length} DN{selectedModelDNs.length === 1 ? '' : 's'} for this model.
                </div>
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>DN / Part No</th><th>Type</th><th>Stock</th><th>Location</th></tr></thead>
                    <tbody>
                      {selectedModelDNs.map((cart) => (
                        <tr key={cart.id}>
                          <td className="mono">{cart.dn || '—'}</td>
                          <td>{cart.type}</td>
                          <td>{cart.stock}</td>
                          <td style={{ fontSize: '11px' }}>{cart.loc || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '14px', marginTop: '14px' }}>
            <div className="card-title" style={{ marginBottom: '12px' }}>Cartridge Usage Log</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Model</th><th>DN / Part No</th><th>Qty</th><th>Workcell</th><th>Printer Location</th><th>Printer IP</th><th>Used By</th><th>Used At</th></tr></thead>
                <tbody>
                  {usageLog.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No cartridge usage logged yet</td></tr>
                  ) : usageLog.map((entry) => (
                    <tr key={entry.id}>
                      <td className="em">{entry.model || '—'}</td>
                      <td className="mono">{entry.dn || '—'}</td>
                      <td>{entry.qty}</td>
                      <td>{entry.wc || '—'}</td>
                      <td style={{ fontSize: '11px' }}>{entry.printer_location || '—'}</td>
                      <td className="mono">{entry.ip || '—'}</td>
                      <td style={{ color: 'var(--blue)' }}>{entry.used_by || '—'}</td>
                      <td>{entry.used_at ? new Date(entry.used_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'hpdash' && (
        <div className="hp-panel active">
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-title" style={{ marginBottom: '14px' }}>Cartridge Availability - Model Wise</div>
            <div className="g4">
              {carts.map((cart) => (
                <div key={cart.id} className="card" style={{ padding: '12px', borderColor: cart.stock === 0 ? 'rgba(224,82,82,.3)' : cart.stock <= cart.min ? 'rgba(232,160,32,.3)' : 'var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 600, marginBottom: '3px', wordBreak: 'break-all' }}>{cart.model}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px' }}>{cart.dn} · {cart.type}</div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: cart.stock === 0 ? 'var(--red)' : cart.stock <= cart.min ? 'var(--amber)' : 'var(--green)', marginBottom: '4px' }}>{cart.stock}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Stock level only</div>
                  <div style={{ marginTop: '8px' }}><span className={`badge ${cart.stock === 0 ? 'b-out' : cart.stock <= cart.min ? 'b-low' : 'b-instock'}`}>{cart.stock === 0 ? 'Out of Stock' : cart.stock <= cart.min ? 'Low Stock' : 'In Stock'}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="g2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>Low / Out of Stock Cartridges</div>
              {carts.filter((cart) => cart.stock <= cart.min).length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--green)', padding: '10px' }}>All cartridges adequately stocked</div>
              ) : carts.filter((cart) => cart.stock <= cart.min).map((cart) => (
                <div key={cart.id} style={{ background: cart.stock === 0 ? 'var(--red-bg)' : 'var(--amber-bg)', border: `1px solid ${cart.stock === 0 ? 'rgba(224,82,82,.3)' : 'rgba(232,160,32,.3)'}`, borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: cart.stock === 0 ? 'var(--red)' : 'var(--amber)', fontWeight: 600 }}>{cart.model}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>DN: {cart.dn} · Stock: {cart.stock} · Min: {cart.min}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '12px' }}>HP Printer Cartridge Status Live</div>
              {printers.map((printer) => (
                <div key={printer.id} style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{printer.tag}</span>
                    <span className={`badge ${printer.online ? 'b-online' : 'b-offline'}`}>{printer.online ? 'Online' : 'Offline'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px' }}>{printer.cartmodel}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '10px', color: 'var(--text3)' }}>
                    <span>Black:</span><CartGauge pct={printer.black_pct} />
                    {printer.color_pct !== null && <><span style={{ marginLeft: '8px' }}>Color:</span><CartGauge pct={printer.color_pct} /></>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showUseCart && (
        <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowUseCart(false); }}>
          <div className="modal">
            <div className="modal-title">Use Cartridge</div>
            <button className="modal-close" onClick={() => setShowUseCart(false)}>X</button>
            <div className="fgrid fg2" style={{ gap: '12px' }}>
              <div className="field"><label>DN No / Part No *</label><input value={useCartForm.dn} onChange={(e) => setUseCartForm((prev) => ({ ...prev, dn: e.target.value }))} placeholder="e.g. CF226A" /></div>
              <div className="field"><label>Cartridge Model *</label><input value={useCartForm.model} onChange={(e) => setUseCartForm((prev) => ({ ...prev, model: e.target.value }))} placeholder="e.g. HP 26A (CF226A)" /></div>
              <div className="field"><label>Qty Used</label><input type="number" value={useCartForm.qty} onChange={(e) => setUseCartForm((prev) => ({ ...prev, qty: parseInt(e.target.value, 10) || 1 }))} min="1" /></div>
              <div className="field">
                <label>Printer IP Address *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={useCartForm.ip}
                    onChange={(e) => {
                      const ip = e.target.value;
                      setUseCartForm((prev) => ({ ...prev, ip }));
                      fetchPrinterInfoByIp(ip);
                    }}
                    placeholder="e.g. 192.168.2.10"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="field"><label>HP Printer Workcell</label><input value={useCartForm.wc} onChange={(e) => setUseCartForm((prev) => ({ ...prev, wc: e.target.value }))} placeholder="e.g. WC-A1" /></div>
              <div className="field"><label>Used By</label><input className="af" readOnly value={useCartForm.used_by} placeholder="Logged-in user" /></div>
            </div>

            {printerInfo && (
              <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>✓ Printer Found</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: '1.6' }}>
                  <div><strong>Tag:</strong> {printerInfo.tag}</div>
                  <div><strong>Location:</strong> {printerInfo.loc}</div>
                  <div><strong>Model:</strong> {printerInfo.model}</div>
                  <div><strong>Cartridge:</strong> {printerInfo.cartmodel}</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', fontSize: '12px', color: matchedCart ? (matchedCart.stock > 0 ? 'var(--green)' : 'var(--red)') : 'var(--text3)' }}>
              {matchedCart
                ? `Available stock for ${matchedCart.model}: ${matchedCart.stock}${matchedCart.loc ? ` · ${matchedCart.loc}` : ''}`
                : 'Enter a matching DN or cartridge model from inventory to use stock from that cartridge.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setShowUseCart(false)}>Cancel</button>
              <button className="btn btn-success" onClick={logUseCart} disabled={!matchedCart || (matchedCart.stock || 0) < useCartForm.qty}>Log Cartridge Use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
