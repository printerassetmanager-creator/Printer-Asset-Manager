import React, { useEffect, useRef, useState } from 'react';
import { issuesAPI, printersAPI } from '../utils/api';
import { useApp, CURRENT_USER, PLANT_LOCATIONS } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const displayName = (value) =>
  String(value || '')
    .split('.')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');

const normalizeUserId = (value) => String(value || '').trim().toLowerCase();

const getIssueSearchParam = () => {
  try {
    return new URLSearchParams(window.location.search).get('issue') || '';
  } catch {
    return '';
  }
};

const createUserOption = (user) => {
  if (!user) return null;
  if (typeof user === 'string') {
    const email = user.trim();
    return email ? { value: email, label: email } : null;
  }

  const email = String(user.email || user.value || '').trim();
  if (!email) return null;

  return {
    value: email,
    label: String(user.name || user.full_name || email).trim(),
  };
};

const buildIssueFormState = (issue) => ({
  pmno: issue.pmno || '',
  serial: issue.serial || '',
  model: issue.model || '',
  loc: issue.loc || '',
  sapno: issue.sapno || '',
  mesno: issue.mesno || '',
  title: issue.title || '',
  desc: issue.desc || '',
  action: issue.action || '',
  severity: issue.severity || 'Medium',
  category: issue.category || 'Other',
  reporter: issue.reporter || '',
  plant_location: issue.plant_location || 'B26',
  status: issue.status || 'open',
  assigned_to: '',
  assignment_note: '',
});

const getIssueNumber = (issue) =>
  issue?.issue_unique_id || (issue?.id ? `ISSU${String(issue.id).padStart(2, '0')}` : '');

const formatIssueDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const getTimelineDisplay = (issue) => {
  if (issue.status === 'resolved') {
    return {
      label: issue.resolved_at ? `Resolved ${formatIssueDate(issue.resolved_at)}` : 'Resolved',
      tone: 'resolved',
    };
  }

  if (issue.timeRemaining?.isBreached) {
    return {
      label: 'Breached',
      tone: 'breached',
    };
  }

  return {
    label: issue.timeRemaining?.display || '-',
    tone: 'active',
  };
};

const EMPTY_FORM = {
  pmno: '',
  serial: '',
  model: '',
  loc: '',
  sapno: '',
  mesno: '',
  title: '',
  desc: '',
  action: '',
  severity: 'Medium',
  category: 'Other',
  reporter: displayName(CURRENT_USER),
  plant_location: 'B26',
  assigned_to: '',
  assignment_note: '',
};

export default function IssuesTracker() {
  const { refreshIssueCount, selectedPlants, user } = useApp();
  const formRef = useRef(null);
  const handledLinkedIssueRef = useRef('');
  const [data, setData] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
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
  const [upgradeTo, setUpgradeTo] = useState('Medium');
  const [downgradingId, setDowngradingId] = useState(null);
  const [downgradeReason, setDowngradeReason] = useState('');
  const [downgradeTo, setDowngradeTo] = useState('Medium');
  const [assigningId, setAssigningId] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [users, setUsers] = useState([]);

  const currentUserEmail = user?.email || CURRENT_USER;
  const currentUserName = user?.full_name || user?.fullName || displayName(currentUserEmail);

  const setField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const getIssueById = (issueId) => data.find((issue) => String(issue.id) === String(issueId));
  const isIssueInMyBucket = (issue) =>
    !!issue && normalizeUserId(issue.assigned_to) === normalizeUserId(currentUserEmail);
  const getCurrentUserOption = () =>
    users.find((entry) => normalizeUserId(entry.value) === normalizeUserId(currentUserEmail)) ||
    createUserOption({ email: currentUserEmail, name: currentUserName });
  const getAssignableUsers = (issue) => {
    if (!issue || !isIssueInMyBucket(issue)) {
      return [getCurrentUserOption()];
    }

    const otherUsers = users.filter(
      (entry) => normalizeUserId(entry.value) !== normalizeUserId(currentUserEmail)
    );
    return otherUsers.length ? otherUsers : [getCurrentUserOption()];
  };

  const load = async () => {
    const linkedIssue = getIssueSearchParam();
    const { data: issues } = await issuesAPI
      .getAll(linkedIssue ? undefined : selectedPlants)
      .catch(() => ({ data: [] }));
    setData(Array.isArray(issues) ? issues : []);
    refreshIssueCount();
  };

  const loadUsers = async () => {
    try {
      const { data: userList } = await issuesAPI.getUsers();
      const normalized = Array.isArray(userList)
        ? userList.map(createUserOption).filter(Boolean)
        : [];
      setUsers(normalized);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    load();
    loadUsers();
  }, [selectedPlants]);

  const autoFill = async (pmno) => {
    setField('pmno', pmno);
    if (pmno.length < 4) return;

    try {
      const { data: printer } = await printersAPI.getOne(pmno.trim().toUpperCase());
      const fullLoc = [printer.wc, printer.loc].filter(Boolean).join(' / ') || printer.loc || '';
      setForm((previous) => ({
        ...previous,
        serial: printer.serial || '',
        model: printer.model || '',
        loc: fullLoc,
        sapno: printer.sapno || '',
        mesno: printer.mesno || '',
      }));
    } catch {}
  };

  const clear = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setMsg('');
    setIsResolving(false);
    setActionTaken('');
  };

  const openIssueEditor = (issue) => {
    setEditId(issue.id);
    setForm(buildIssueFormState(issue));
    setOpen(true);
    setIsResolving(false);
    setActionTaken('');
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const startResolve = (issue) => {
    setEditId(issue.id);
    setForm(buildIssueFormState(issue));
    setOpen(true);
    setIsResolving(true);
    setActionTaken('');
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const save = async () => {
    if (!form.title || !form.desc) {
      setMsg('Title and Description required');
      return;
    }

    if (
      !editId &&
      (form.severity === 'Medium' || form.severity === 'Low') &&
      !form.assigned_to.trim()
    ) {
      setMsg('Assignment is required for Medium/Low severity issues');
      return;
    }

    try {
      const formatted = {
        ...form,
        title: toSentenceCase(form.title),
        desc: toSentenceCase(form.desc),
        action: form.action ? toSentenceCase(form.action) : '',
        user_name: currentUserName,
        user_email: currentUserEmail,
      };

      if (editId) await issuesAPI.update(editId, formatted);
      else await issuesAPI.create(formatted);

      await load();
      clear();
      setOpen(false);
      setMsg('Saved');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error saving';
      setMsg(errorMsg);
      console.error('Save error:', error);
    }
  };

  const doResolve = async () => {
    if (!editId) return;
    if (!actionTaken.trim()) {
      setMsg('Action Taken is required');
      return;
    }

    try {
      await issuesAPI.resolve(editId, {
        action_taken: actionTaken,
        user_name: currentUserName,
        user_email: currentUserEmail,
      });
      await load();
      clear();
      setOpen(false);
      setMsg('Issue resolved');
      setTimeout(() => setMsg(''), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error resolving issue';
      setMsg(errorMsg);
      console.error('Resolve error:', error);
    }
  };

  const doDowngrade = async () => {
    if (!downgradingId) return;
    if (!downgradeReason.trim()) {
      setMsg('Reason is required');
      return;
    }

    try {
      await issuesAPI.downgrade(downgradingId, {
        new_severity: downgradeTo,
        reason: downgradeReason,
        user_name: currentUserName,
        user_email: currentUserEmail,
      });
      setMsg('Severity downgraded');
      setTimeout(() => setMsg(''), 2000);
      setDowngradingId(null);
      setDowngradeReason('');
      await load();
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error downgrading');
    }
  };

  const doUpgrade = async () => {
    if (!upgradingId) return;
    if (!upgradeReason.trim()) {
      setMsg('Reason is required');
      return;
    }

    try {
      await issuesAPI.upgrade(upgradingId, {
        new_severity: upgradeTo,
        reason: upgradeReason,
        user_name: currentUserName,
        user_email: currentUserEmail,
      });
      setMsg('Severity upgraded');
      setTimeout(() => setMsg(''), 2000);
      setUpgradingId(null);
      setUpgradeReason('');
      setUpgradeTo('Medium');
      await load();
    } catch (error) {
      setMsg(error.response?.data?.error || 'Error upgrading');
    }
  };

  const openAssignModal = (issueId) => {
    const issue = getIssueById(issueId);
    const availableUsers = getAssignableUsers(issue);
    setAssigningId(issueId);
    setAssignTo(availableUsers.length === 1 ? availableUsers[0].value : '');
    setAssignmentNote('');
  };

  const doAssign = async () => {
    if (!assigningId) return;
    if (!assignTo.trim()) {
      setMsg('Please select a user');
      return;
    }

    const issue = getIssueById(assigningId);
    if (!issue) {
      setMsg('Issue not found');
      return;
    }

    const currentAssignee = normalizeUserId(issue.assigned_to);
    const currentUser = normalizeUserId(currentUserEmail);
    const requestedUser = normalizeUserId(assignTo);

    if (!currentAssignee) {
      if (requestedUser !== currentUser) {
        setMsg('Unassigned issues can only be assigned to yourself first.');
        return;
      }
    } else if (currentAssignee === currentUser) {
      if (requestedUser === currentUser) {
        setMsg('Issue is already assigned to you.');
        return;
      }

      if (!assignmentNote.trim()) {
        setMsg('Note is required when assigning to someone else.');
        return;
      }
    } else if (requestedUser !== currentUser) {
      setMsg('Only the current assignee can assign. You can claim it by assigning to yourself.');
      return;
    }

    try {
      await issuesAPI.assign(assigningId, {
        assigned_to: assignTo,
        user_name: currentUserName,
        user_email: currentUserEmail,
        assignment_note: assignmentNote || '',
      });
      setMsg(`Issue assigned to ${assignTo} - notification email sent`);
      setTimeout(() => setMsg(''), 3000);
      setAssigningId(null);
      setAssignTo('');
      setAssignmentNote('');
      await load();
    } catch (error) {
      console.error('Assignment error:', error);
      setMsg(error.response?.data?.error || 'Error assigning issue');
    }
  };

  const loadHistory = async (issueId) => {
    try {
      const { data: historyItems } = await issuesAPI.getHistory(issueId);
      setHistory(Array.isArray(historyItems) ? historyItems : []);
      setShowHistory(true);
    } catch {}
  };

  const selectedIssue = getIssueById(editId);
  const selectedIssueNumber = getIssueNumber(selectedIssue);
  const selectedIssueInMyBucket = isIssueInMyBucket(selectedIssue);
  const assigningIssue = getIssueById(assigningId);
  const assigningIssueInMyBucket = isIssueInMyBucket(assigningIssue);
  const assignableUsers = getAssignableUsers(assigningIssue);
  const upgradeBaseSeverity = selectedIssue?.severity || form.severity;

  useEffect(() => {
    const linkedIssue = getIssueSearchParam().trim();
    if (!linkedIssue || !data.length || handledLinkedIssueRef.current === linkedIssue) {
      return;
    }

    const matchedIssue = data.find(
      (issue) =>
        normalizeUserId(issue.issue_unique_id) === normalizeUserId(linkedIssue) ||
        String(issue.id) === linkedIssue
    );

    if (!matchedIssue) {
      return;
    }

    handledLinkedIssueRef.current = linkedIssue;
    setSearch(matchedIssue.issue_unique_id || linkedIssue);
    openIssueEditor(matchedIssue);
  }, [data]);

  const filtered = data
    .filter((issue) => {
      const query = search.trim().toLowerCase();
      const matchesFilters = (!sevF || issue.severity === sevF) && (!statF || issue.status === statF);
      if (!query) return matchesFilters;

      const fields = [
        issue.pmno,
        issue.serial,
        issue.issue_unique_id,
        issue.title,
        issue.model,
        issue.loc,
        issue.desc,
        issue.category,
        issue.action,
        issue.reporter,
      ];

      return fields.some((field) => String(field || '').toLowerCase().includes(query)) && matchesFilters;
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
      const severityOrder = { High: 0, Medium: 1, Low: 2 };
      if (a.severity !== b.severity) return (severityOrder[a.severity] || 1) - (severityOrder[b.severity] || 1);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const openCount = data.filter((issue) => issue.status === 'open').length;
  const highCount = data.filter((issue) => issue.status === 'open' && issue.severity === 'High').length;
  const resolvedCount = data.filter((issue) => issue.status === 'resolved').length;
  const breachedCount = data.filter((issue) => {
    const created = new Date(issue.created_at);
    const severityDays = { High: 1, Medium: 3, Low: 7 };
    const deadline = new Date(created);
    deadline.setDate(deadline.getDate() + (severityDays[issue.severity] || 3));
    return deadline < Date.now() && issue.status === 'open';
  }).length;

  return (
    <div className="screen">
      <div className="notice n-warn">
        High severity issues are stored permanently for audit trail. Other issues are automatically deleted after 10 days of resolution.
      </div>

      <div className="issues-stat-row">
        <div className="kpi" style={{ borderColor: 'rgba(224,82,82,.3)' }}>
          <div className="kpi-lbl">Open Issues</div>
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{openCount}</div>
          <div className="kpi-sub">Active on printers</div>
        </div>
        <div className="kpi" style={{ borderColor: 'rgba(232,160,32,.3)' }}>
          <div className="kpi-lbl">High Severity</div>
          <div className="kpi-val" style={{ color: 'var(--amber)' }}>{highCount}</div>
          <div className="kpi-sub">Urgent action needed</div>
        </div>
        <div className="kpi">
          <div className="kpi-lbl">Resolved</div>
          <div className="kpi-val" style={{ color: 'var(--green)' }}>{resolvedCount}</div>
          <div className="kpi-sub">Closed total</div>
        </div>
        <div className="kpi" style={{ borderColor: 'rgba(239,68,68,.3)' }}>
          <div className="kpi-lbl">Breached Issues</div>
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{breachedCount}</div>
          <div className="kpi-sub">Deadline exceeded</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
        <div className="issues-filter-row" style={{ marginBottom: 0, flex: 1 }}>
          <input
            placeholder="Search by Issue ID, PM No, serial, model, description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={sevF} onChange={(event) => setSevF(event.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 11px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}>
            <option value="">All Severity</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select value={statF} onChange={(event) => setStatF(event.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '8px 11px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Inter,sans-serif', outline: 'none' }}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => { clear(); setOpen((previous) => !previous); }}>+ Log Issue</button>
      </div>

      <div ref={formRef} className={`collapse-form${open ? ' open' : ''}`}>
        <div className="cf-header">
          <div className="cf-title">{editId ? `Edit Issue - ${selectedIssueNumber || form.pmno}` : 'Log New Issue'}</div>
          {selectedIssueNumber && <div style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: 600 }}>Issue Number: {selectedIssueNumber}</div>}
          <button className="btn btn-ghost btn-sm" onClick={() => { setOpen(false); clear(); }}>Cancel</button>
        </div>
        <div className="fgrid fg4" style={{ marginBottom: '12px' }}>
          <div className="field"><label>PM No *</label><input disabled={editId && !isResolving} value={form.pmno} onChange={(event) => autoFill(event.target.value)} placeholder="e.g. 1256" /></div>
          <div className="field"><label>Serial No <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.serial} placeholder="-" /></div>
          <div className="field"><label>Printer Model <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.model} placeholder="-" /></div>
          <div className="field"><label>Location <span className="tag-a">Auto</span></label><input className="af" disabled={editId && !isResolving} readOnly value={form.loc} placeholder="-" /></div>
          <div className="field"><label>SAP Printer No <span className="tag-a">Auto</span></label><input disabled={editId && !isResolving} value={form.sapno} onChange={(event) => setField('sapno', event.target.value)} placeholder="-" /></div>
          <div className="field"><label>MES Printer No <span className="tag-a">Auto</span></label><input disabled={editId && !isResolving} value={form.mesno} onChange={(event) => setField('mesno', event.target.value)} placeholder="-" /></div>
          <div className="field">
            <label>Plant Location</label>
            <select disabled={editId && !isResolving} value={form.plant_location} onChange={(event) => setField('plant_location', event.target.value)}>
              {PLANT_LOCATIONS.map((plant) => <option key={plant} value={plant}>{plant}</option>)}
            </select>
          </div>
          <div className="field"><label>Issue Title *</label><input disabled={editId && !isResolving} value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Brief title of the issue" /></div>
          <div className="field">
            <label>Severity</label>
            <select disabled={editId && !isResolving} value={form.severity} onChange={(event) => setField('severity', event.target.value)}>
              <option value="High">High - Printer Down</option>
              <option value="Medium">Medium - Degraded</option>
              <option value="Low">Low - Minor</option>
            </select>
          </div>
          {!editId && (form.severity === 'Medium' || form.severity === 'Low') && (
            <div className="field">
              <label>Assign To * <span style={{ color: 'var(--red)', fontSize: '12px' }}>Required for {form.severity} severity</span></label>
              <select value={form.assigned_to} onChange={(event) => setField('assigned_to', event.target.value)} required>
                <option value="">-- Select User --</option>
                {users.length > 0 ? users.map((entry) => (
                  <option key={entry.value} value={entry.value}>{entry.label}{entry.label !== entry.value ? ` (${entry.value})` : ''}</option>
                )) : <option disabled>No users available</option>}
              </select>
            </div>
          )}
          <div className="field">
            <label>Category</label>
            <select disabled={editId && !isResolving} value={form.category} onChange={(event) => setField('category', event.target.value)}>
              <option>Print Head</option>
              <option>Media / Ribbon</option>
              <option>Connectivity</option>
              <option>Firmware</option>
              <option>Mechanical</option>
              <option>Label Quality</option>
              <option>Other</option>
            </select>
          </div>
          <div className="field"><label>Reported By</label><input disabled={editId && !isResolving} value={form.reporter} onChange={(event) => setField('reporter', event.target.value)} placeholder="Your name" /></div>
          <div className="field full"><label>Issue Description *</label><textarea disabled={editId && !isResolving} value={form.desc} onChange={(event) => setField('desc', event.target.value)} placeholder="Describe the issue in detail..." style={{ minHeight: '70px' }} /></div>
          {!editId || isResolving ? null : <div className="field full"><label>Action Taken</label><textarea value={form.action} onChange={(event) => setField('action', event.target.value)} placeholder="What was tried or done to resolve this..." style={{ minHeight: '50px' }} /></div>}
          {editId && isResolving && <div className="field full"><label>Action Taken *</label><textarea value={actionTaken} onChange={(event) => setActionTaken(event.target.value)} placeholder="Describe what action you took to resolve this issue..." style={{ minHeight: '70px', borderColor: 'var(--green)', backgroundColor: 'rgba(74,222,128,.05)' }} /></div>}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!editId ? (
            <>
              <button className="btn btn-success" onClick={save}>Save Issue</button>
              {msg && <span style={{ fontSize: '12px', color: 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
            </>
          ) : isResolving ? (
            <>
              <button className="btn btn-success" onClick={doResolve}>Resolve Issue</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsResolving(false)}>Cancel Resolve</button>
              {msg && <span style={{ fontSize: '12px', color: msg.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
            </>
          ) : form.status === 'resolved' ? (
            <>
              <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>Issue Resolved</span>
              <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(editId)} style={{ marginLeft: '12px' }}>History</button>
              {msg && <span style={{ fontSize: '12px', color: msg.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
            </>
          ) : (
            <>
              {selectedIssueInMyBucket && <button className="btn btn-success btn-sm" onClick={() => setIsResolving(true)}>Resolve</button>}
              {selectedIssueInMyBucket && form.severity !== 'Low' && <button className="btn btn-ghost btn-sm" onClick={() => { setDowngradingId(editId); setDowngradeTo(form.severity === 'High' ? 'Medium' : 'Low'); setDowngradeReason(''); }}>Downgrade</button>}
              {selectedIssueInMyBucket && form.severity !== 'High' && <button className="btn btn-ghost btn-sm" onClick={() => { setUpgradingId(editId); setUpgradeReason(''); setUpgradeTo(form.severity === 'Low' ? 'Medium' : 'High'); }}>Upgrade</button>}
              <button className="btn btn-info btn-sm" onClick={() => openAssignModal(editId)}>Assign</button>
              <button className="btn btn-ghost btn-sm" onClick={() => loadHistory(editId)}>History</button>
              {!selectedIssueInMyBucket && <span style={{ fontSize: '12px', color: 'var(--green)', marginLeft: '8px' }}>This issue is not in your bucket. You can only claim it by assigning it to yourself.</span>}
              {msg && <span style={{ fontSize: '12px', color: msg.startsWith('Error') ? 'var(--red)' : 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
            </>
          )}
        </div>
      </div>

      {downgradingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '20px', minWidth: '350px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text)' }}>Downgrade Severity</h3>
            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Downgrade to:</label>
              <select value={downgradeTo} onChange={(event) => setDowngradeTo(event.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {form.severity === 'High' && (<><option value="Medium">Medium</option><option value="Low">Low</option></>)}
                {form.severity === 'Medium' && <option value="Low">Low</option>}
              </select>
            </div>
            <div className="field" style={{ marginBottom: '15px' }}>
              <label>Reason *</label>
              <textarea value={downgradeReason} onChange={(event) => setDowngradeReason(event.target.value)} placeholder="Why are you downgrading this issue?" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '80px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setDowngradingId(null); setDowngradeReason(''); }}>Cancel</button>
              <button className="btn btn-warning" onClick={doDowngrade}>Confirm Downgrade</button>
            </div>
          </div>
        </div>
      )}

      {upgradingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '20px', minWidth: '350px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text)' }}>Upgrade Severity</h3>
            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Upgrade to:</label>
              <select value={upgradeTo} onChange={(event) => setUpgradeTo(event.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {upgradeBaseSeverity === 'Low' && (<><option value="Medium">Medium</option><option value="High">High</option></>)}
                {upgradeBaseSeverity === 'Medium' && <option value="High">High</option>}
              </select>
            </div>
            <div className="field" style={{ marginBottom: '15px' }}>
              <label>Reason *</label>
              <textarea value={upgradeReason} onChange={(event) => setUpgradeReason(event.target.value)} placeholder="Why are you upgrading this issue?" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '80px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setUpgradingId(null); setUpgradeReason(''); }}>Cancel</button>
              <button className="btn btn-warning" onClick={doUpgrade}>Confirm Upgrade</button>
            </div>
          </div>
        </div>
      )}

      {assigningId && assigningIssue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '20px', minWidth: '350px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text)' }}>Assign Issue {getIssueNumber(assigningIssue)}</h3>
            {!assigningIssueInMyBucket && <div style={{ fontSize: '12px', color: 'var(--amber)', marginBottom: '12px', padding: '8px', background: 'rgba(217,119,6,.1)', borderRadius: '4px' }}>This issue is not in your bucket. Once you assign it to yourself, you can reassign it to others.</div>}
            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Assign to</label>
              <select value={assignTo} onChange={(event) => setAssignTo(event.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="">-- Select User --</option>
                {assignableUsers.map((entry) => (
                  <option key={entry.value} value={entry.value}>{entry.label}{entry.label !== entry.value ? ` (${entry.value})` : ''}</option>
                ))}
              </select>
            </div>
            {assigningIssueInMyBucket && assignTo !== currentUserEmail && (
              <div className="field" style={{ marginBottom: '15px' }}>
                <label>Note (required when reassigning)</label>
                <textarea value={assignmentNote} onChange={(event) => setAssignmentNote(event.target.value)} placeholder="Why are you assigning this to them?" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', minHeight: '60px', boxSizing: 'border-box' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setAssigningId(null); setAssignTo(''); setAssignmentNote(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={doAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '20px', minWidth: '400px', maxHeight: '70vh', border: '1px solid var(--border)', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--text)' }}>Activity History</h3>
            <div>
              {history.map((entry, idx) => (
                <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{entry.activity_type}</div>
                  {entry.reason && <div style={{ color: 'var(--text3)', marginTop: '4px' }}>Reason: {entry.reason}</div>}
                  {entry.new_severity && <div style={{ color: 'var(--text3)', marginTop: '2px' }}>Severity: {entry.new_severity}</div>}
                  {entry.assigned_to && <div style={{ color: 'var(--text3)', marginTop: '2px' }}>Assigned to: {entry.assigned_to}</div>}
                  <div style={{ color: 'var(--text3)', marginTop: '4px', fontSize: '11px' }}>By {entry.user_name} | {new Date(entry.activity_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="issues-table-wrap">
        <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '96px' }}>Issue ID</th>
            <th style={{ width: '90px' }}>PM No</th>
            <th style={{ minWidth: '260px' }}>Title</th>
            <th style={{ width: '90px' }}>Plant</th>
            <th style={{ width: '100px' }}>Severity</th>
            <th style={{ width: '100px' }}>Status</th>
            <th style={{ minWidth: '190px' }}>Assigned To</th>
            <th style={{ width: '140px' }}>Breach Time</th>
            <th style={{ width: '120px' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="9" className="issues-empty-row">No issues found</td>
            </tr>
          ) : (
            filtered.map((issue) => {
              const timeline = getTimelineDisplay(issue);

              return (
                <tr
                  key={issue.id}
                  className="issue-table-row"
                  style={{ opacity: issue.status === 'resolved' ? 0.72 : 1 }}
                  onClick={() => openIssueEditor(issue)}
                >
                <td className="issue-id-cell">{getIssueNumber(issue)}</td>
                <td>{issue.pmno || '-'}</td>
                <td>
                  <div className="issue-title-main">{issue.title}</div>
                  <div className="issue-title-sub">
                    {[issue.category, issue.loc].filter(Boolean).join(' | ') || issue.desc || '-'}
                  </div>
                </td>
                <td>{issue.plant_location || '-'}</td>
                <td><span className={`tag ${issue.severity === 'High' ? 'tag-danger' : issue.severity === 'Medium' ? 'tag-warning' : 'tag-info'}`}>{issue.severity}</span></td>
                <td><span className={`tag ${issue.status === 'open' ? 'tag-warning' : 'tag-success'}`}>{issue.status === 'open' ? 'Open' : 'Resolved'}</span></td>
                <td className="issue-assignee-cell">{issue.assigned_to || '-'}</td>
                <td><span className={`issue-time-pill ${timeline.tone}`}>{timeline.label}</span></td>
                <td>{formatIssueDate(issue.created_at)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
