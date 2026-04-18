import React, { useEffect, useState } from 'react';
import { IS_ADMIN } from '../context/AppContext';
import { printerPushAPI, recipesAPI } from '../utils/api';
import {
  buildRecipeSummary,
  createEmptyDraft,
  filterRecipes,
  getBrandDefaults,
  getDpiRange,
  getModelOptions,
  normalizeRecipeForForm,
  validateRecipeDraft,
} from '../utils/recipeConfig';

const brandBadgeClass = {
  Honeywell: 'b-online',
  Zebra: 'b-upcoming',
};

function Field({ label, hint, children, full = false }) {
  return (
    <div className={`field${full ? ' full' : ''}`}>
      <label>{label}</label>
      {children}
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

function HoneywellFields({ config, onChange }) {
  return (
    <>
      <Field label="Print Method">
        <select value={config.printMethod} onChange={(e) => onChange('printMethod', e.target.value)}>
          <option>Direct Thermal</option>
          <option>Thermal Transfer</option>
        </select>
      </Field>
      <Field label="Media Type">
        <select value={config.mediaType} onChange={(e) => onChange('mediaType', e.target.value)}>
          <option>Media With Gaps</option>
          <option>Continuous</option>
          <option>Black Mark</option>
        </select>
      </Field>
      <Field label="Media Width" hint="Dots">
        <input value={config.mediaWidth} onChange={(e) => onChange('mediaWidth', e.target.value)} placeholder="e.g. 812" />
      </Field>
      <Field label="Media Length" hint="Dots">
        <input value={config.mediaLength} onChange={(e) => onChange('mediaLength', e.target.value)} placeholder="e.g. 1218" />
      </Field>
      <Field label="Media Margin (X)">
        <input value={config.mediaMarginX} onChange={(e) => onChange('mediaMarginX', e.target.value)} placeholder="e.g. 0" />
      </Field>
      <Field label="Label Top Adjust">
        <input value={config.labelTopAdjust} onChange={(e) => onChange('labelTopAdjust', e.target.value)} placeholder="e.g. -8" />
      </Field>
      <Field label="Label Rest Adjust">
        <input value={config.labelRestAdjust} onChange={(e) => onChange('labelRestAdjust', e.target.value)} placeholder="e.g. 0" />
      </Field>
      <Field label="Calibration Mode">
        <select value={config.calibrationMode} onChange={(e) => onChange('calibrationMode', e.target.value)}>
          <option>Off</option>
          <option>Fast</option>
          <option>Slow</option>
          <option>Slow With Retraction</option>
          <option>Smart (Auto Calibration)</option>
        </select>
      </Field>
      <Field label="Print Mode">
        <select value={config.printMode} onChange={(e) => onChange('printMode', e.target.value)}>
          <option>Tear Off</option>
          <option>Peel Off</option>
          <option>Cutter</option>
        </select>
      </Field>
      <Field label="Media Sensitivity">
        <select value={config.mediaSensitivity} onChange={(e) => onChange('mediaSensitivity', e.target.value)}>
          <option>Very Low</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </Field>
      <Field label="Print Speed" hint="mm/sec">
        <input value={config.printSpeed} onChange={(e) => onChange('printSpeed', e.target.value)} placeholder="e.g. 100" />
      </Field>
      <Field label="Darkness" hint="0-100">
        <input value={config.darkness} onChange={(e) => onChange('darkness', e.target.value)} placeholder="e.g. 24" />
      </Field>
    </>
  );
}

function ZebraFields({ config, onChange }) {
  return (
    <>
      <Field label="Print Method">
        <select value={config.printMethod} onChange={(e) => onChange('printMethod', e.target.value)}>
          <option>Direct Thermal</option>
          <option>Thermal Transfer</option>
        </select>
      </Field>
      <Field label="Media Type">
        <select value={config.mediaType} onChange={(e) => onChange('mediaType', e.target.value)}>
          <option>Continuous</option>
          <option>Gap (Web)</option>
          <option>Black Mark</option>
        </select>
      </Field>
      <Field label="Print Width" hint="Dots">
        <input value={config.printWidth} onChange={(e) => onChange('printWidth', e.target.value)} placeholder="e.g. 832" />
      </Field>
      <Field label="Label Length" hint="Dots">
        <input value={config.labelLength} onChange={(e) => onChange('labelLength', e.target.value)} placeholder="e.g. 1200" />
      </Field>
      <Field label="Label Top">
        <input value={config.labelTop} onChange={(e) => onChange('labelTop', e.target.value)} placeholder="e.g. -8" />
      </Field>
      <Field label="Tear Off Adjust" hint="-120 to +120">
        <input value={config.tearOffAdjust} onChange={(e) => onChange('tearOffAdjust', e.target.value)} placeholder="e.g. 0" />
      </Field>
      <Field label="Sensor Method">
        <select value={config.sensorMethod} onChange={(e) => onChange('sensorMethod', e.target.value)}>
          <option>Transmissive</option>
          <option>Reflective</option>
        </select>
      </Field>
      <Field label="Media Calibration">
        <select value={config.mediaCalibration} onChange={(e) => onChange('mediaCalibration', e.target.value)}>
          <option>Auto</option>
          <option>Manual</option>
        </select>
      </Field>
      <Field label="Print Mode">
        <select value={config.printMode} onChange={(e) => onChange('printMode', e.target.value)}>
          <option>Tear Off</option>
          <option>Peel Off</option>
          <option>Cutter</option>
        </select>
      </Field>
      <Field label="Print Speed" hint="2-14 IPS">
        <input value={config.printSpeed} onChange={(e) => onChange('printSpeed', e.target.value)} placeholder="e.g. 6" />
      </Field>
      <Field label="Darkness" hint="0-30">
        <input value={config.darkness} onChange={(e) => onChange('darkness', e.target.value)} placeholder="e.g. 18" />
      </Field>
    </>
  );
}

export default function LabelRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [draft, setDraft] = useState(() => createEmptyDraft());
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('');
  const [errorState, setErrorState] = useState('');
  const [pushModal, setPushModal] = useState({
    open: false,
    recipe: null,
    printerIp: '',
    message: '',
    type: '',
    status: '',
    busy: false,
  });
  const [scriptModal, setScriptModal] = useState({
    open: false,
    recipe: null,
  });

  async function loadRecipes() {
    setLoading(true);
    try {
      const response = await recipesAPI.getAll();
      setRecipes(Array.isArray(response.data) ? response.data : []);
      setErrorState('');
    } catch (error) {
      setErrorState(error.response?.data?.error || 'Could not load recipes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  const filteredRecipes = filterRecipes(recipes, search, brandFilter);
  const modelOptions = getModelOptions(draft.brand);

  const setDraftField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const setConfigField = (field, value) => {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        [field]: value,
      },
    }));
  };

  const setBrand = (brand) => {
    const nextModel = getModelOptions(brand)[0]?.value || '';
    setDraft((current) => ({
      ...current,
      brand,
      model: nextModel,
      dpi: getDpiRange(brand, nextModel),
      config: getBrandDefaults(brand),
    }));
  };

  const setModel = (model) => {
    setDraft((current) => ({
      ...current,
      model,
      dpi: getDpiRange(current.brand, model),
    }));
  };

  const resetDraft = () => {
    setDraft(createEmptyDraft());
    setSaveState('');
    setErrorState('');
  };

  const openNewRecipe = () => {
    resetDraft();
    setEditorOpen(true);
  };

  const closeEditor = () => {
    resetDraft();
    setEditorOpen(false);
  };

  const editRecipe = (recipe) => {
    setDraft(normalizeRecipeForForm(recipe));
    setSaveState('');
    setErrorState('');
    setEditorOpen(true);
  };

  const saveRecipe = async () => {
    const errors = validateRecipeDraft(draft);
    if (errors.length > 0) {
      setErrorState(errors[0]);
      setSaveState('');
      return;
    }

    setErrorState('');
    setSaveState('Saving recipe...');
    const payload = {
      name: draft.name.trim(),
      brand: draft.brand,
      model: draft.model,
      dpi: draft.dpi,
      notes: draft.notes.trim(),
      config: draft.config,
    };

    try {
      if (draft.id) await recipesAPI.update(draft.id, payload);
      else await recipesAPI.create(payload);

      await loadRecipes();
      if (!draft.id) {
        setDraft(createEmptyDraft());
        setErrorState('');
      }
      setSaveState('Recipe saved successfully.');
    } catch (error) {
      setErrorState(error.response?.data?.error || 'Could not save recipe.');
      setSaveState('');
    }
  };

  const deleteRecipe = async () => {
    if (!draft.id) return;
    if (!window.confirm('Delete this recipe?')) return;

    try {
      await recipesAPI.delete(draft.id);
      await loadRecipes();
      resetDraft();
      setSaveState('Recipe deleted.');
    } catch (error) {
      setErrorState(error.response?.data?.error || 'Could not delete recipe.');
    }
  };

  const openPushModal = (recipe) => {
    setPushModal({
      open: true,
      recipe,
      printerIp: '',
      message: '',
      type: '',
      status: '',
      busy: false,
    });
  };

  const closePushModal = () => {
    setPushModal({
      open: false,
      recipe: null,
      printerIp: '',
      message: '',
      type: '',
      status: '',
      busy: false,
    });
  };

  const openScriptModal = (recipe) => {
    setScriptModal({
      open: true,
      recipe,
    });
  };

  const closeScriptModal = () => {
    setScriptModal({
      open: false,
      recipe: null,
    });
  };

  const generateZPL = (recipe) => {
    const config = recipe.config || {};
    let zpl = '^XA\n'; // Start format
    
    if (recipe.brand === 'Zebra') {
      // Zebra ZPL commands
      if (config.labelLength) {
        zpl += `^LL${config.labelLength}\n`; // Label length in dots
      }
      if (config.printWidth) {
        zpl += `^PW${config.printWidth}\n`; // Print width
      }
      
      // Sensor method
      if (config.sensorMethod === 'Reflective') {
        zpl += '^MFR\n'; // Reflective sensor
      } else {
        zpl += '^MFT\n'; // Transmissive sensor
      }
      
      // Media calibration
      if (config.mediaCalibration === 'Auto') {
        zpl += '^MC\n'; // Media calibration
      }
      
      // Print mode
      if (config.printMode === 'Peel Off') {
        zpl += '^MPE\n'; // Peel mode
      } else if (config.printMode === 'Cutter') {
        zpl += '^MCC\n'; // Cutter mode
      } else {
        zpl += '^MPN\n'; // Tear off
      }
      
      // Print speed (in inches per second, range 2-14)
      if (config.printSpeed) {
        zpl += `^PR${config.printSpeed}\n`;
      }
      
      // Darkness (0-30 for Zebra)
      if (config.darkness) {
        zpl += `^MD${config.darkness}\n`;
      }
      
      // Media type
      if (config.mediaType === 'Black Mark') {
        zpl += '^MIB\n'; // Black mark detection
      } else if (config.mediaType === 'Continuous') {
        zpl += '^MIC\n'; // Continuous media
      }
      
    } else if (recipe.brand === 'Honeywell') {
      // Honeywell ESim language commands
      if (config.printWidth) {
        zpl += `. Set media width\nT ${config.printWidth}\n`;
      }
      if (config.labelTop) {
        zpl += `. Label top position\nV ${config.labelTop}\n`;
      }
      
      // Print speed (mm/sec)
      if (config.printSpeed) {
        zpl += `S${config.printSpeed}\n`;
      }
      
      // Darkness (0-100 for Honeywell)
      if (config.darkness) {
        zpl += `D${config.darkness}\n`;
      }
      
      // Calibration mode
      if (config.calibrationMode !== 'Off') {
        zpl += `. Auto calibration enabled\nFXA\n`;
      }
    }
    
    zpl += '^XZ'; // End format
    return zpl;
  };

  const runPrinterAction = async (action) => {
    if (!pushModal.printerIp.trim()) {
      setPushModal((current) => ({
        ...current,
        message: 'Printer IP is required.',
        type: 'error',
      }));
      return;
    }

    setPushModal((current) => ({
      ...current,
      busy: true,
      message: action === 'status' ? 'Checking printer status...' : 'Sending command...',
      type: 'info',
    }));

    try {
      const response = await printerPushAPI.push({
        recipeId: pushModal.recipe?.id,
        printerIp: pushModal.printerIp.trim(),
        action,
      });

      setPushModal((current) => ({
        ...current,
        busy: false,
        message: response.data.message,
        type: response.data.success ? 'success' : 'error',
        status: action === 'status' ? (response.data.online ? 'Online' : 'Offline') : current.status,
      }));
    } catch (error) {
      setPushModal((current) => ({
        ...current,
        busy: false,
        message: error.response?.data?.error || 'Printer not reachable.',
        type: 'error',
      }));
    }
  };

  return (
    <div className="screen">
      <div className="recipe-header-row">
        <div>
          <div className="card-title">Recipe Builder</div>
          <div className="tb-meta">Create brand-specific printer recipes, save them as JSON, and push them over TCP port 9100.</div>
        </div>
        <div className="recipe-header-actions">
          <button className="btn btn-ghost" onClick={openNewRecipe}>New Recipe</button>
        </div>
      </div>

      {errorState ? <div className="notice n-err">{errorState}</div> : null}
      {saveState ? <div className="notice n-ok">{saveState}</div> : null}
      {!IS_ADMIN ? <div className="notice n-info">View and push saved recipes are available. Save and delete remain admin-only.</div> : null}

      <div className={`recipe-layout${editorOpen ? '' : ' recipe-layout-single'}`}>
        <div className="card recipe-list-card">
          <div className="cf-header">
            <div className="cf-title">Saved Recipes</div>
            <span className="badge b-user">{filteredRecipes.length} shown</span>
          </div>

          <div className="recipe-filter-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipe, brand, model, media..."
            />
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="">All Brands</option>
              <option>Honeywell</option>
              <option>Zebra</option>
            </select>
          </div>

          {loading ? (
            <div className="recipe-empty">Loading recipes...</div>
          ) : filteredRecipes.length === 0 ? (
            <div className="recipe-empty">No recipes found.</div>
          ) : (
            <div className="recipe-grid recipe-grid-scroll">
              {filteredRecipes.map((recipe) => {
                const summary = buildRecipeSummary(recipe);
                return (
                  <div key={recipe.id} className="recipe-card recipe-card-tight" onClick={() => editRecipe(recipe)}>
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="recipe-meta">
                      <span className={`recipe-tag badge ${brandBadgeClass[recipe.brand] || 'b-user'}`}>{recipe.brand}</span>
                      <span className="recipe-tag badge b-offline">{recipe.model}</span>
                      <span className="recipe-tag badge b-hp">{recipe.dpi}</span>
                    </div>
                    <div className="recipe-desc">{recipe.notes || 'No notes added.'}</div>
                    <div className="recipe-stat-row">
                      <span>{summary.size}</span>
                      <span>{summary.media}</span>
                      <span>Top: {summary.top || '0'}</span>
                      <span>Side: {summary.side || '0'}</span>
                      <span>Speed: {summary.speed || '-'}</span>
                      <span>Darkness: {summary.darkness || '-'}</span>
                    </div>
                    <div className="recipe-card-actions">
                      <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); editRecipe(recipe); }}>Edit</button>
                      <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openPushModal(recipe); }}>Push</button>
                      <button className="btn btn-info btn-sm" onClick={(e) => { e.stopPropagation(); openScriptModal(recipe); }}>View Script</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {editorOpen ? (
          <div className="card recipe-builder-card">
            <div className="cf-header">
              <div className="cf-title">{draft.id ? `Edit Recipe - ${draft.name}` : 'New Recipe'}</div>
              <button className="btn btn-ghost btn-sm" onClick={closeEditor}>{draft.id ? 'Clear' : 'Close'}</button>
            </div>

            <div className="fgrid fg4">
              <Field label="Recipe Name">
                <input value={draft.name} onChange={(e) => setDraftField('name', e.target.value)} placeholder="e.g. Zebra carton 4x6" />
              </Field>
              <Field label="Brand">
                <select value={draft.brand} onChange={(e) => setBrand(e.target.value)}>
                  <option>Honeywell</option>
                  <option>Zebra</option>
                </select>
              </Field>
              <Field label="Model">
                <select value={draft.model} onChange={(e) => setModel(e.target.value)}>
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="DPI">
                <input className="af" value={draft.dpi} readOnly />
              </Field>
            </div>

            <div className="sec" style={{ marginTop: '18px' }}>Configuration</div>
            <div className="fgrid fg4">
              {draft.brand === 'Honeywell' ? (
                <HoneywellFields config={draft.config} onChange={setConfigField} />
              ) : (
                <ZebraFields config={draft.config} onChange={setConfigField} />
              )}
              <Field label="Notes" full>
                <textarea value={draft.notes} onChange={(e) => setDraftField('notes', e.target.value)} placeholder="Optional notes for technicians..." />
              </Field>
            </div>

            <div className="recipe-builder-actions">
              {IS_ADMIN ? <button className="btn btn-success" onClick={saveRecipe}>Save Recipe</button> : null}
              {draft.id ? <button className="btn btn-primary" onClick={() => openPushModal(draft)}>Push To Printer</button> : null}
              {IS_ADMIN && draft.id ? <button className="btn btn-danger" onClick={deleteRecipe}>Delete Recipe</button> : null}
            </div>
          </div>
        ) : null}
      </div>

      {pushModal.open ? (
        <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) closePushModal(); }}>
          <div className="modal">
            <div className="modal-title">Push Recipe To Printer</div>
            <button className="modal-close" onClick={closePushModal}>X</button>

            <div className="notice n-info" style={{ marginBottom: '16px' }}>
              {pushModal.recipe?.brand} {pushModal.recipe?.model} - {pushModal.recipe?.name}
            </div>

            <div className="fgrid fg2">
              <Field label="Printer IP">
                <input
                  value={pushModal.printerIp}
                  onChange={(e) => setPushModal((current) => ({ ...current, printerIp: e.target.value }))}
                  placeholder="e.g. 192.168.10.21"
                />
              </Field>
              <Field label="Current Status">
                <input className="af" readOnly value={pushModal.status || 'Unknown'} />
              </Field>
            </div>

            {pushModal.message ? (
              <div className={`notice ${pushModal.type === 'success' ? 'n-ok' : pushModal.type === 'error' ? 'n-err' : 'n-info'}`}>
                {pushModal.message}
              </div>
            ) : null}

            <div className="recipe-builder-actions">
              <button className="btn btn-ghost" onClick={() => runPrinterAction('status')} disabled={pushModal.busy}>Check Status</button>
              <button className="btn btn-primary" onClick={() => runPrinterAction('push')} disabled={pushModal.busy}>Push</button>
              <button className="btn btn-success" onClick={() => runPrinterAction('test-print')} disabled={pushModal.busy}>Test Print</button>
              <button className="btn btn-amber" onClick={() => runPrinterAction('calibrate')} disabled={pushModal.busy}>Auto Calibration</button>
            </div>
          </div>
        </div>
      ) : null}

      {scriptModal.open ? (
        <div className="modal-bg show" onClick={(e) => { if (e.target === e.currentTarget) closeScriptModal(); }}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="modal-title">{scriptModal.recipe?.brand} Script - {scriptModal.recipe?.model}</div>
            <button className="modal-close" onClick={closeScriptModal}>X</button>

            <div className="notice n-info" style={{ marginBottom: '16px' }}>
              {scriptModal.recipe?.notes || 'No description available'}
            </div>

            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '6px', 
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              border: '1px solid #ddd',
              maxHeight: '500px',
              overflowY: 'auto',
              color: '#333'
            }}>
              {generateZPL(scriptModal.recipe)}
            </div>

            <div className="recipe-builder-actions" style={{ marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => {
                const scriptText = generateZPL(scriptModal.recipe);
                navigator.clipboard.writeText(scriptText);
                alert('Script copied to clipboard!');
              }}>📋 Copy to Clipboard</button>
              <button className="btn btn-success" onClick={closeScriptModal}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
