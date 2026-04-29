import React, { useEffect, useState } from 'react';
import { backupPrintersAPI, printersAPI } from '../utils/api';
import { useApp } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const EMPTY_FORM = {
  pmno: '',
  serial: '',
  make: '',
  dpi: '',
  plant_location: '',
  storage_location: '',
  remarks: '',
};

export default function BackupPrinters() {
  const { selectedPlants } = useApp();
  const [data, setData] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  const setField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyPrinterSnapshot = (printer) => {
    setForm((previous) => ({
      ...previous,
      pmno: (printer.pmno || previous.pmno || '').toUpperCase(),
      serial: printer.serial || '',
      make: printer.make || '',
      dpi: printer.dpi || '',
      plant_location: printer.plant_location || '',
    }));
  };

  const load = () => {
    backupPrintersAPI.getAll(selectedPlants).then((response) => {
      setData(Array.isArray(response.data) ? response.data : []);
    }).catch(() => setData([]));
  };

  useEffect(() => {
    load();
  }, [selectedPlants]);

  useEffect(() => {
    if (!open) return undefined;

    const normalizedPm = form.pmno.trim().toUpperCase();
    if (!normalizedPm) {
      setLookupLoading(false);
      setLookupError('');
      setForm((previous) => ({
        ...previous,
        serial: '',
        make: '',
        dpi: '',
        plant_location: '',
      }));
      return undefined;
    }

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      setLookupError('');
      try {
        const { data: printer } = await printersAPI.getOne(normalizedPm);
        applyPrinterSnapshot(printer || {});
      } catch {
        setLookupError('PM No not found in printer master');
        setForm((previous) => ({
          ...previous,
          serial: '',
          make: '',
          dpi: '',
          plant_location: '',
        }));
      } finally {
        setLookupLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.pmno, open]);

  const clear = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setMsg('');
    setLookupError('');
    setLookupLoading(false);
  };

  const save = async () => {
    if (!form.pmno || !form.storage_location) {
      setMsg('PM No and Storage Location are required');
      return;
    }

    if (!form.serial || !form.make || !form.dpi || !form.plant_location) {
      setMsg('Select a valid PM No so serial, make, DPI, and plant can load automatically');
      return;
    }

    const payload = {
      ...form,
      pmno: form.pmno.trim().toUpperCase(),
      serial: form.serial.trim(),
      make: toSentenceCase(form.make),
      storage_location: toSentenceCase(form.storage_location),
      remarks: toSentenceCase(form.remarks),
    };

    try {
      if (editId) await backupPrintersAPI.update(editId, payload);
      else await backupPrintersAPI.create(payload);
      load();
      clear();
      setOpen(false);
      setMsg('Saved');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error saving');
    }
  };

  const del = async () => {
    if (!editId) return;
    if (!window.confirm('Delete this backup printer?')) return;

    try {
      await backupPrintersAPI.delete(editId);
      load();
      clear();
      setOpen(false);
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error deleting');
    }
  };

  const edit = (printer) => {
    setEditId(printer.id);
    setForm({
      pmno: printer.pmno || '',
      serial: printer.serial || '',
      make: printer.make || '',
      dpi: printer.dpi || '',
      plant_location: printer.plant_location || '',
      storage_location: printer.storage_location || '',
      remarks: printer.remarks || '',
    });
    setLookupError('');
    setOpen(true);
  };

  const filtered = data.filter((printer) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    const fields = [
      printer.pmno,
      printer.serial,
      printer.make,
      printer.dpi,
      printer.plant_location,
      printer.storage_location,
      printer.remarks,
    ];

    return fields.some((field) => String(field || '').toLowerCase().includes(query));
  });

  return (
    <div className="screen">
      <div className="notice n-info">Add backup printers here so printer-down issues can suggest a same-DPI fallback in the same plant. Serial, make, DPI, and plant now load automatically from the main printer list by PM No.</div>

      <div className="card-hd" style={{ padding: 0, marginBottom: '4px' }}>
        <div></div>
        <button className="btn btn-primary" onClick={() => { clear(); setOpen((previous) => !previous); }}>+ Add Backup Printer</button>
      </div>

      <div className={`collapse-form${open ? ' open' : ''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? `Edit Backup Printer - ${form.pmno}` : 'Add Backup Printer'}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); clear(); }}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{ marginBottom: '12px' }}>
          <div className="field">
            <label>PM No *</label>
            <input
              className="pm-in"
              value={form.pmno}
              onChange={(event) => setField('pmno', event.target.value)}
              onBlur={() => setField('pmno', form.pmno.trim().toUpperCase())}
              placeholder="e.g. 1256"
            />
            <div style={{ fontSize: '11px', marginTop: '6px', color: lookupError ? 'var(--red)' : 'var(--text3)' }}>
              {lookupLoading ? 'Loading printer details...' : (lookupError || 'Loads from printer master automatically')}
            </div>
          </div>
          <div className="field"><label>Serial No *</label><input className="af" readOnly value={form.serial} placeholder="Auto from PM No" /></div>
          <div className="field"><label>Make *</label><input className="af" readOnly value={form.make} placeholder="Auto from PM No" /></div>
          <div className="field"><label>DPI *</label><input className="af" readOnly value={form.dpi} placeholder="Auto from PM No" /></div>
          <div className="field"><label>Plant Location *</label><input className="af" readOnly value={form.plant_location} placeholder="Auto from PM No" /></div>
          <div className="field full"><label>Storage Location *</label><input value={form.storage_location} onChange={(event) => setField('storage_location', event.target.value)} placeholder="e.g. Backup rack A / B26 store room" /></div>
          <div className="field full"><label>Remarks</label><input value={form.remarks} onChange={(event) => setField('remarks', event.target.value)} placeholder="Optional notes..." /></div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-success" onClick={save}>Save Backup Printer</button>
          {editId && <button className="btn btn-danger btn-sm" onClick={del}>Delete</button>}
          {msg && <span style={{ fontSize: '12px', color: msg.toLowerCase().includes('error') || msg.includes('required') || msg.includes('valid PM No') ? 'var(--red)' : 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '14px' }}>
        <div className="card-hd">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search backup printers..."
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '7px 11px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none', width: '280px' }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{filtered.length} backup printers</div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>PM No</th>
                <th>Serial No</th>
                <th>Make</th>
                <th>DPI</th>
                <th>Plant</th>
                <th>Storage Location</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)' }}>No backup printers found</td>
                </tr>
              ) : (
                filtered.map((printer) => (
                  <tr key={printer.id}>
                    <td className="em">{printer.pmno}</td>
                    <td className="mono">{printer.serial}</td>
                    <td>{printer.make}</td>
                    <td>{printer.dpi}</td>
                    <td>{printer.plant_location}</td>
                    <td>{printer.storage_location}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => edit(printer)}>Edit</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
