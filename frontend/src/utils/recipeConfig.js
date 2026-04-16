export const BRAND_MODELS = {
  Honeywell: [
    { value: 'PC42T', label: 'PC42T', dpiRange: '203-300' },
    { value: 'PM43', label: 'PM43', dpiRange: '203-300' },
    { value: 'PM45', label: 'PM45', dpiRange: '203-300' },
    { value: 'PX45', label: 'PX45', dpiRange: '300-406' },
    { value: 'PX940', label: 'PX940', dpiRange: '300-600' },
  ],
  Zebra: [
    { value: 'ZD421', label: 'ZD421', dpiRange: '203-300' },
    { value: 'ZT231', label: 'ZT231', dpiRange: '203-300' },
    { value: 'ZT411', label: 'ZT411', dpiRange: '300-600' },
    { value: 'ZT421', label: 'ZT421', dpiRange: '203-300' },
    { value: 'ZT510', label: 'ZT510', dpiRange: '300-406' },
    { value: 'ZT610', label: 'ZT610', dpiRange: '300-600' },
  ],
};

export const HONEYWELL_DEFAULTS = {
  printMethod: 'Direct Thermal',
  mediaType: 'Media With Gaps',
  mediaWidth: '',
  mediaLength: '',
  mediaMarginX: '0',
  labelTopAdjust: '0',
  labelRestAdjust: '0',
  calibrationMode: 'Smart (Auto Calibration)',
  printMode: 'Tear Off',
  mediaSensitivity: 'Medium',
  printSpeed: '',
  darkness: '',
};

export const ZEBRA_DEFAULTS = {
  printMethod: 'Direct Thermal',
  mediaType: 'Gap (Web)',
  printWidth: '',
  labelLength: '',
  labelTop: '0',
  tearOffAdjust: '0',
  sensorMethod: 'Transmissive',
  mediaCalibration: 'Auto',
  printMode: 'Tear Off',
  printSpeed: '',
  darkness: '',
};

const FIELD_LABELS = {
  printMethod: 'Print Method',
  mediaType: 'Media Type',
  mediaWidth: 'Media Width',
  mediaLength: 'Media Length',
  mediaMarginX: 'Media Margin (X)',
  labelTopAdjust: 'Label Top Adjust',
  labelRestAdjust: 'Label Rest Adjust',
  calibrationMode: 'Calibration Mode',
  printMode: 'Print Mode',
  mediaSensitivity: 'Media Sensitivity',
  printSpeed: 'Print Speed',
  darkness: 'Darkness',
  printWidth: 'Print Width',
  labelLength: 'Label Length',
  labelTop: 'Label Top',
  tearOffAdjust: 'Tear Off Adjust',
  sensorMethod: 'Sensor Method',
  mediaCalibration: 'Media Calibration',
};

export function getBrandDefaults(brand) {
  return brand === 'Zebra' ? { ...ZEBRA_DEFAULTS } : { ...HONEYWELL_DEFAULTS };
}

export function getModelOptions(brand) {
  return BRAND_MODELS[brand] || [];
}

export function getDpiRange(brand, model) {
  return getModelOptions(brand).find((option) => option.value === model)?.dpiRange || '';
}

export function createEmptyDraft(brand = 'Honeywell') {
  const model = getModelOptions(brand)[0]?.value || '';
  return {
    id: null,
    name: '',
    brand,
    model,
    dpi: getDpiRange(brand, model),
    notes: '',
    config: getBrandDefaults(brand),
  };
}

export function normalizeRecipeForForm(recipe) {
  const brand = recipe?.brand || 'Honeywell';
  const model = recipe?.model || getModelOptions(brand)[0]?.value || '';
  return {
    id: recipe?.id || null,
    name: recipe?.name || '',
    brand,
    model,
    dpi: recipe?.dpi || getDpiRange(brand, model),
    notes: recipe?.notes || '',
    config: {
      ...getBrandDefaults(brand),
      ...(recipe?.config || {}),
    },
  };
}

function requireValue(value, label, errors) {
  if (value === undefined || value === null || String(value).trim() === '') {
    errors.push(`${label} is required.`);
  }
}

function requireRange(value, min, max, label, errors) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} must be a number.`);
    return;
  }
  if (parsed < min || parsed > max) {
    errors.push(`${label} must be between ${min} and ${max}.`);
  }
}

function requireNumber(value, label, errors) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} must be a number.`);
  }
}

export function validateRecipeDraft(draft) {
  const errors = [];
  requireValue(draft.name, 'Recipe Name', errors);
  requireValue(draft.brand, 'Brand', errors);
  requireValue(draft.model, 'Model', errors);
  requireValue(draft.dpi, 'DPI', errors);

  Object.entries(draft.config || {}).forEach(([field, value]) => {
    requireValue(value, FIELD_LABELS[field] || field, errors);
  });

  if (draft.brand === 'Honeywell') {
    ['mediaWidth', 'mediaLength', 'mediaMarginX', 'labelTopAdjust', 'labelRestAdjust', 'printSpeed', 'darkness']
      .forEach((field) => requireNumber(draft.config[field], FIELD_LABELS[field], errors));
    requireRange(draft.config.darkness, 0, 100, 'Darkness', errors);
  }

  if (draft.brand === 'Zebra') {
    ['printWidth', 'labelLength', 'labelTop', 'tearOffAdjust', 'printSpeed', 'darkness']
      .forEach((field) => requireNumber(draft.config[field], FIELD_LABELS[field], errors));
    requireRange(draft.config.printSpeed, 2, 14, 'Print Speed', errors);
    requireRange(draft.config.darkness, 0, 30, 'Darkness', errors);
    requireRange(draft.config.tearOffAdjust, -120, 120, 'Tear Off Adjust', errors);
  }

  return errors;
}

export function buildRecipeSummary(recipe) {
  const config = recipe.config || {};
  const width = recipe.brand === 'Honeywell' ? config.mediaWidth : config.printWidth;
  const length = recipe.brand === 'Honeywell' ? config.mediaLength : config.labelLength;
  const top = recipe.brand === 'Honeywell' ? config.labelTopAdjust : config.labelTop;
  const side = recipe.brand === 'Honeywell' ? config.mediaMarginX : config.tearOffAdjust;
  return {
    size: width && length ? `${width} x ${length} dots` : 'Incomplete size',
    top,
    side,
    speed: config.printSpeed,
    darkness: config.darkness,
    media: config.mediaType,
  };
}

export function filterRecipes(recipes, search, brand) {
  const query = String(search || '').trim().toLowerCase();
  return recipes.filter((recipe) => {
    const matchesBrand = !brand || recipe.brand === brand;
    if (!matchesBrand) return false;
    if (!query) return true;

    const haystack = [
      recipe.name,
      recipe.brand,
      recipe.model,
      recipe.dpi,
      recipe.notes,
      recipe.config?.mediaType,
      recipe.config?.printMethod,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}
