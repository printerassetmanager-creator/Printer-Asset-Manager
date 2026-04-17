import React, { useEffect, useState } from 'react';
import { iLearnAPI } from '../utils/api';
import { useApp, CURRENT_USER, displayName, IS_ADMIN } from '../context/AppContext';
import { toSentenceCase } from '../utils/textFormat';

const emptyIssue = { title: '', category: 'General' };
const emptyStep = { title: '', description: '', image_url: '', step_number: 1 };

export default function ILearn() {
  const { user } = useApp();
  const loggedInUser = displayName(CURRENT_USER);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [view, setView] = useState('list'); // list, detail, add
  const [issues, setIssues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [form, setForm] = useState(emptyIssue);
  const [stepsBeingSaved, setStepsBeingSaved] = useState([]);
  const [stepForm, setStepForm] = useState(emptyStep);
  const [editStepId, setEditStepId] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showStepModal, setShowStepModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const load = async () => {
    try {
      const data = await iLearnAPI.getAll(categoryFilter !== 'All' ? categoryFilter : '', search);
      setIssues(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await iLearnAPI.getCategories();
      setCategories(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    load();
  }, [categoryFilter, search]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setStepForm((f) => ({ ...f, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addStepToForm = () => {
    if (!stepForm.title) {
      setMsg('Step title is required');
      return;
    }
    const newStep = { ...stepForm, step_number: stepsBeingSaved.length + 1 };
    setStepsBeingSaved([...stepsBeingSaved, newStep]);
    setStepForm(emptyStep);
    setImagePreview(null);
    setMsg('Step added');
    setTimeout(() => setMsg(''), 1500);
  };

  const removeStepFromForm = (index) => {
    setStepsBeingSaved(stepsBeingSaved.filter((_, i) => i !== index));
  };

  const editStepInForm = (index) => {
    setStepForm(stepsBeingSaved[index]);
    setImagePreview(stepsBeingSaved[index].image_url);
    setEditStepId(index);
  };

  const updateStepInForm = () => {
    if (!stepForm.title) {
      setMsg('Step title is required');
      return;
    }
    const updated = [...stepsBeingSaved];
    updated[editStepId] = { ...stepForm, step_number: editStepId + 1 };
    setStepsBeingSaved(updated);
    setStepForm(emptyStep);
    setImagePreview(null);
    setEditStepId(null);
    setMsg('Step updated');
    setTimeout(() => setMsg(''), 1500);
  };

  const clearStepForm = () => {
    setStepForm(emptyStep);
    setEditStepId(null);
    setImagePreview(null);
  };

  // Missing functions added
  const viewIssueDetail = async (issueId) => {
    try {
      const data = await iLearnAPI.getById(issueId);
      setSelectedIssue(data.data);
      setView('detail');
    } catch (e) {
      console.error('Error loading issue:', e);
      setMsg('Error loading issue');
    }
  };

  const saveIssue = async () => {
    try {
      if (!form.title) {
        setMsg('Issue title is required');
        return;
      }
      if (stepsBeingSaved.length === 0) {
        setMsg('Add at least one step before saving');
        return;
      }
      const payload = {
        title: form.title,
        category: form.category,
        created_by: loggedInUser,
        steps: stepsBeingSaved,
      };
      await iLearnAPI.create(payload);
      setMsg('Issue saved successfully');
      setForm(emptyIssue);
      setStepsBeingSaved([]);
      setView('list');
      load();
      setTimeout(() => setMsg(''), 1500);
    } catch (e) {
      console.error('Error saving issue:', e);
      setMsg(`Error: ${e.message || 'Failed to save issue'}`);
    }
  };

  const deleteIssue = async () => {
    if (!window.confirm('Are you sure you want to delete this issue and all its steps?')) return;
    try {
      await iLearnAPI.delete(selectedIssue.id);
      setMsg('Issue deleted');
      setView('list');
      load();
    } catch (e) {
      console.error('Error deleting issue:', e);
      setMsg('Error deleting issue');
    }
  };

  const editStep = (step) => {
    setStepForm(step);
    setImagePreview(step.image_url);
    setEditStepId(step.id);
    setShowStepModal(true);
  };

  const saveStep = async () => {
    try {
      if (!stepForm.title) {
        setMsg('Step title is required');
        return;
      }
      if (editStepId && typeof editStepId === 'number' && editStepId < stepsBeingSaved.length) {
        // Updating in local form
        updateStepInForm();
      } else {
        // Saving to API
        const payload = {
          step_number: stepForm.step_number,
          title: stepForm.title,
          description: stepForm.description,
          image_url: stepForm.image_url,
        };
        if (editStepId && typeof editStepId === 'string') {
          // Edit existing step
          await iLearnAPI.updateStep(selectedIssue.id, editStepId, payload);
        } else {
          // Create new step
          await iLearnAPI.addStep(selectedIssue.id, payload);
        }
        setMsg('Step saved successfully');
        clearStepForm();
        setShowStepModal(false);
        viewIssueDetail(selectedIssue.id);
      }
    } catch (e) {
      console.error('Error saving step:', e);
      setMsg(`Error: ${e.message || 'Failed to save step'}`);
    }
  };

  const deleteStep = async (stepId) => {
    if (!window.confirm('Delete this step?')) return;
    try {
      await iLearnAPI.deleteStep(selectedIssue.id, stepId);
      setMsg('Step deleted');
      viewIssueDetail(selectedIssue.id);
    } catch (e) {
      console.error('Error deleting step:', e);
      setMsg('Error deleting step');
    }
  };

  return (
    <div className="screen">
      {view === 'list' && (
        <>
          <div className="card-hd" style={{ padding: 0, marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Search issues and view step-by-step resolution guides
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => { setForm(emptyIssue); setStepsBeingSaved([]); setView('add'); }}>
                + Add Issue
              </button>
            )}
          </div>

          <div className="search-row">
            <input
              type="text"
              placeholder="Search issues by title (fuzzy match)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option>All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {issues.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
              No issues found. {isAdmin && 'Create your first learning issue to help team members!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="card"
                  style={{ padding: '14px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => viewIssueDetail(issue.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, flex: 1 }}>
                      {issue.title}
                    </div>
                    <span className="badge" style={{ fontSize: '9px', background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                      {issue.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    Resolved Steps:
                  </div>

                  <div style={{ backgroundColor: 'rgba(74, 127, 212, 0.08)', border: '1px solid rgba(74, 127, 212, 0.15)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                    {(issue.steps && issue.steps.length > 0) ? (
                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: 'var(--text2)', lineHeight: '1.6' }}>
                        {issue.steps.slice(0, 3).map((step) => (
                          <li key={step.id} style={{ marginBottom: step === issue.steps[2] ? 0 : '4px' }}>
                            {step.title}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontStyle: 'italic' }}>
                        No steps added yet
                      </div>
                    )}
                    {(issue.steps && issue.steps.length > 3) && (
                      <div style={{ fontSize: '10px', color: 'var(--blue)', marginTop: '4px', fontWeight: 500 }}>
                        +{issue.steps.length - 3} more steps
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text3)', display: 'flex', gap: '12px' }}>
                    <span>By: {issue.created_by}</span>
                    <span>Steps: {issue.steps?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'detail' && selectedIssue && (
        <>
          <div className="card-hd" style={{ padding: 0, marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>
                {selectedIssue.title}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                Category: {selectedIssue.category} • Created by: {selectedIssue.created_by}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isAdmin && (
                <>
                  <button className="btn btn-primary" onClick={() => setShowStepModal(true)}>
                    + Add Step
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={deleteIssue}>
                    Delete Issue
                  </button>
                </>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>Back</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {(selectedIssue.steps || []).map((step) => (
              <div key={step.id} className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: 600, marginBottom: '2px' }}>
                      Step {step.step_number}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>
                      {step.title}
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => editStep(step)}>Edit</button>
                      <button className="btn btn-danger btn-xs" onClick={() => deleteStep(step.id)}>Del</button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '10px' }}>
                  {step.description}
                </div>

                {step.image_url && (
                  <div style={{ marginTop: 'auto', marginBottom: '12px' }}>
                    <img
                      src={step.image_url}
                      alt={`Step ${step.step_number}`}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '240px',
                        borderRadius: 'var(--r)',
                        border: '1px solid var(--border)',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {(!selectedIssue.steps || selectedIssue.steps.length === 0) && (
            <div className="card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text3)' }}>
              No steps added yet. {isAdmin && 'Click "+ Add Step" to create resolution steps.'}
            </div>
          )}
        </>
      )}

      {view === 'add' && (
        <>
          <div className="card-hd" style={{ padding: 0, marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 600 }}>
                Add New Issue
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setView('list'); setForm(emptyIssue); setStepsBeingSaved([]); }}>
              Cancel
            </button>
          </div>

          <div className="card" style={{ padding: '18px', marginBottom: '14px' }}>
            <div className="fgrid fg2" style={{ marginBottom: '12px' }}>
              <div className="field">
                <label>Issue Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Print head not printing properly"
                />
              </div>
              <div className="field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categories.length === 0 ? (
                    <>
                      <option>General</option>
                      <option>Maintenance</option>
                      <option>Troubleshoot</option>
                      <option>Setup</option>
                      <option>Error Codes</option>
                      <option>Performance</option>
                      <option>MES Application Support</option>
                    </>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <button className="btn btn-success" onClick={saveIssue} disabled={stepsBeingSaved.length === 0}>
                Save Issue
              </button>
              {msg && <span style={{ fontSize: '12px', color: msg.includes('Error') ? 'var(--red)' : 'var(--green)', marginLeft: '8px' }}>{msg}</span>}
            </div>
          </div>

          <div className="card" style={{ padding: '18px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, marginBottom: '12px' }}>
              + Add Resolution Steps
            </div>

            <div className="fgrid fg2" style={{ gap: '12px', marginBottom: '12px' }}>
              <div className="field">
                <label>Step Number</label>
                <input
                  type="number"
                  value={stepForm.step_number}
                  onChange={(e) => setStepForm((f) => ({ ...f, step_number: parseInt(e.target.value) || 1 }))}
                  min="1"
                  disabled={editStepId !== null}
                />
              </div>
              <div className="field">
                <label>Step Title *</label>
                <input
                  value={stepForm.title}
                  onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Clean the print head"
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Step Description</label>
              <textarea
                value={stepForm.description}
                onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detailed step-by-step instructions..."
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Upload Step Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '6px' }} />
              {imagePreview && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {editStepId !== null ? (
                <>
                  <button className="btn btn-info" onClick={updateStepInForm}>
                    Update Step
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setStepForm(emptyStep); setImagePreview(null); setEditStepId(null); }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={addStepToForm}>
                  + Add Step
                </button>
              )}
            </div>
          </div>

          {stepsBeingSaved.length > 0 && (
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600, marginBottom: '12px' }}>
                Steps to be saved ({stepsBeingSaved.length}):
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {stepsBeingSaved.map((step, idx) => (
                  <div key={idx} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>
                        Step {idx + 1}: {step.title}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => editStepInForm(idx)}>Edit</button>
                        <button className="btn btn-danger btn-xs" onClick={() => removeStepFromForm(idx)}>Remove</button>
                      </div>
                    </div>
                    {step.image_url && (
                      <div style={{ marginTop: '6px' }}>
                        <img
                          src={step.image_url}
                          alt={`Step ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '120px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showStepModal && selectedIssue && (
        <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) setShowStepModal(false); }}>
          <div className="modal">
            <div className="modal-title">{editStepId ? 'Edit Step' : 'Add Resolution Step'}</div>
            <button className="modal-close" onClick={() => { setShowStepModal(false); clearStepForm(); }}>X</button>

            <div className="fgrid fg2" style={{ gap: '12px', marginBottom: '12px' }}>
              <div className="field">
                <label>Step Number</label>
                <input
                  type="number"
                  value={stepForm.step_number}
                  onChange={(e) => setStepForm((f) => ({ ...f, step_number: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
              <div className="field">
                <label>Step Title *</label>
                <input
                  value={stepForm.title}
                  onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Clean the print head"
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Step Description</label>
              <textarea
                value={stepForm.description}
                onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Detailed step-by-step instructions..."
                style={{ minHeight: '80px' }}
              />
            </div>

            <div className="field" style={{ marginBottom: '12px' }}>
              <label>Upload Step Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '6px' }} />
              {imagePreview && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: 'var(--r)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => { setShowStepModal(false); clearStepForm(); }}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={saveStep}>
                Save Step
              </button>
            </div>
            {msg && <div style={{ fontSize: '12px', color: 'var(--amber)', marginTop: '8px' }}>{msg}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
