const net = require('net');

const PORT_9100 = 9100;

const BRAND_MODELS = {
  Honeywell: [
    { value: 'PC42T', dpiRange: '203-300' },
    { value: 'PM43', dpiRange: '203-300' },
    { value: 'PM45', dpiRange: '203-300' },
    { value: 'PX45', dpiRange: '300-406' },
    { value: 'PX940', dpiRange: '300-600' },
  ],
  Zebra: [
    { value: 'ZD421', dpiRange: '203-300' },
    { value: 'ZT231', dpiRange: '203-300' },
    { value: 'ZT411', dpiRange: '300-600' },
    { value: 'ZT421', dpiRange: '203-300' },
    { value: 'ZT510', dpiRange: '300-406' },
    { value: 'ZT610', dpiRange: '300-600' },
  ],
};

const BRAND_DEFAULTS = {
  Honeywell: {
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
  },
  Zebra: {
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
  },
};

const BRAND_FIELDS = {
  Honeywell: [
    'printMethod',
    'mediaType',
    'mediaWidth',
    'mediaLength',
    'mediaMarginX',
    'labelTopAdjust',
    'labelRestAdjust',
    'calibrationMode',
    'printMode',
    'mediaSensitivity',
    'printSpeed',
    'darkness',
  ],
  Zebra: [
    'printMethod',
    'mediaType',
    'printWidth',
    'labelLength',
    'labelTop',
    'tearOffAdjust',
    'sensorMethod',
    'mediaCalibration',
    'printMode',
    'printSpeed',
    'darkness',
  ],
};

let ensureRecipeSchemaPromise;

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function getModelMeta(brand, model) {
  return (BRAND_MODELS[brand] || []).find((entry) => entry.value === model) || null;
}

function buildRecipeName(body) {
  const explicitName = String(body.name || '').trim();
  if (explicitName) return explicitName;
  return [body.brand, body.model].filter(Boolean).join(' ');
}

function normalizeConfig(brand, config = {}) {
  const defaults = BRAND_DEFAULTS[brand] || {};
  const allowedFields = BRAND_FIELDS[brand] || [];
  return allowedFields.reduce((acc, field) => {
    const rawValue = config[field];
    acc[field] = rawValue === undefined || rawValue === null ? defaults[field] : String(rawValue).trim();
    return acc;
  }, {});
}

function legacyConfigFromRow(row) {
  const brand = row.make || 'Honeywell';
  if (brand === 'Zebra') {
    return normalizeConfig('Zebra', {
      printMethod: row.media || 'Direct Thermal',
      mediaType: 'Gap (Web)',
      printWidth: row.width,
      labelLength: row.length,
      labelTop: row.top,
      tearOffAdjust: row.left_margin,
      sensorMethod: 'Transmissive',
      mediaCalibration: row.calibration || 'Auto',
      printMode: 'Tear Off',
      printSpeed: row.speed,
      darkness: row.darkness,
    });
  }

  return normalizeConfig('Honeywell', {
    printMethod: row.media || 'Direct Thermal',
    mediaType: 'Media With Gaps',
    mediaWidth: row.width,
    mediaLength: row.length,
    mediaMarginX: row.left_margin,
    labelTopAdjust: row.top,
    labelRestAdjust: '0',
    calibrationMode: row.calibration || 'Smart (Auto Calibration)',
    printMode: 'Tear Off',
    mediaSensitivity: 'Medium',
    printSpeed: row.speed,
    darkness: row.darkness,
  });
}

function normalizeRecipeRow(row) {
  const brand = row.make || 'Honeywell';
  const configFromDb =
    row.config_json &&
    typeof row.config_json === 'object' &&
    Object.keys(row.config_json).length > 0
      ? row.config_json
      : legacyConfigFromRow(row);

  const config = normalizeConfig(brand, configFromDb);
  const meta = getModelMeta(brand, row.model);
  const dpi = String(row.dpi || meta?.dpiRange || '').trim();

  return {
    id: row.id,
    name: row.name,
    brand,
    model: row.model || '',
    dpi,
    notes: row.desc || '',
    config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateRange(value, min, max, label, errors) {
  const numeric = toNumber(value);
  if (numeric === null) {
    errors.push(`${label} must be a number.`);
    return;
  }
  if (numeric < min || numeric > max) {
    errors.push(`${label} must be between ${min} and ${max}.`);
  }
}

function validateNumber(value, label, errors) {
  if (toNumber(value) === null) {
    errors.push(`${label} must be a number.`);
  }
}

function validateRequired(value, label, errors) {
  if (value === undefined || value === null || String(value).trim() === '') {
    errors.push(`${label} is required.`);
  }
}

function validateRecipePayload(body = {}) {
  const brand = String(body.brand || '').trim();
  const model = String(body.model || '').trim();
  const name = buildRecipeName(body);
  const notes = String(body.notes || '').trim();
  const errors = [];

  if (!BRAND_DEFAULTS[brand]) errors.push('Brand must be Honeywell or Zebra.');
  validateRequired(model, 'Model', errors);

  const meta = getModelMeta(brand, model);
  const dpi = String(body.dpi || meta?.dpiRange || '').trim();
  validateRequired(dpi, 'DPI', errors);

  const config = normalizeConfig(brand, body.config);
  Object.entries(config).forEach(([field, value]) => validateRequired(value, field, errors));

  if (brand === 'Honeywell') {
    ['mediaWidth', 'mediaLength', 'mediaMarginX', 'labelTopAdjust', 'labelRestAdjust', 'printSpeed', 'darkness']
      .forEach((field) => validateRequired(config[field], field, errors));
    ['mediaWidth', 'mediaLength', 'mediaMarginX', 'labelTopAdjust', 'labelRestAdjust', 'printSpeed', 'darkness']
      .forEach((field) => validateNumber(config[field], field, errors));
    validateRange(config.darkness, 0, 100, 'Darkness', errors);
    validateRange(config.printSpeed, 1, 999, 'Print Speed', errors);
  }

  if (brand === 'Zebra') {
    ['printWidth', 'labelLength', 'labelTop', 'tearOffAdjust', 'printSpeed', 'darkness']
      .forEach((field) => validateRequired(config[field], field, errors));
    ['printWidth', 'labelLength', 'labelTop', 'tearOffAdjust', 'printSpeed', 'darkness']
      .forEach((field) => validateNumber(config[field], field, errors));
    validateRange(config.darkness, 0, 30, 'Darkness', errors);
    validateRange(config.printSpeed, 2, 14, 'Print Speed', errors);
    validateRange(config.tearOffAdjust, -120, 120, 'Tear Off Adjust', errors);
  }

  return {
    errors,
    recipe: {
      name,
      brand,
      model,
      dpi,
      notes,
      config,
    },
  };
}

function buildSummaryFields(recipe) {
  const { brand, config } = recipe;
  const width = brand === 'Honeywell' ? config.mediaWidth : config.printWidth;
  const length = brand === 'Honeywell' ? config.mediaLength : config.labelLength;
  const top = brand === 'Honeywell' ? config.labelTopAdjust : config.labelTop;
  const leftMargin = brand === 'Honeywell' ? config.mediaMarginX : config.tearOffAdjust;
  const calibration = brand === 'Honeywell' ? config.calibrationMode : config.mediaCalibration;
  const size = width && length ? `${width} x ${length} dots` : '';

  return {
    media: config.mediaType,
    width,
    length,
    top,
    leftMargin,
    darkness: config.darkness,
    speed: config.printSpeed,
    calibration,
    size,
  };
}

function buildZebraResetScript() {
  return '^XA\n^JUN\n^XZ\n';
}

function zebraMediaTracking(mediaType) {
  if (mediaType === 'Continuous') return 'N';
  if (mediaType === 'Black Mark') return 'M';
  return 'Y';
}

function printMethodCommand(printMethod) {
  return printMethod === 'Thermal Transfer' ? 'T' : 'D';
}

function printModeCommand(printMode) {
  if (printMode === 'Peel Off') return 'P';
  if (printMode === 'Cutter') return 'C';
  return 'T';
}

function buildZebraConfigScript(recipe) {
  const { config } = recipe;
  return [
    '^XA',
    '^FX Zebra recipe configuration',
    `^FX Sensor Method: ${config.sensorMethod}`,
    `^FX Media Calibration: ${config.mediaCalibration}`,
    `^FX Tear Off Adjust: ${config.tearOffAdjust}`,
    `^PW${config.printWidth}`,
    `^LL${config.labelLength}`,
    `^MT${printMethodCommand(config.printMethod)}`,
    `^MN${zebraMediaTracking(config.mediaType)}`,
    `^PR${config.printSpeed}`,
    `^MD${config.darkness}`,
    `^LT${config.labelTop}`,
    `^MM${printModeCommand(config.printMode)}`,
    '^XZ',
    '',
  ].join('\n');
}

function honeywellMediaTracking(mediaType) {
  if (mediaType === 'Continuous') return 'N';
  if (mediaType === 'Black Mark') return 'M';
  return 'Y';
}

function buildHoneywellConfigScript(recipe) {
  const { config } = recipe;
  return [
    '^XA',
    '^FX Honeywell recipe configuration (ZSim)',
    `^FX Calibration Mode: ${config.calibrationMode}`,
    `^FX Media Sensitivity: ${config.mediaSensitivity}`,
    `^FX Label Rest Adjust: ${config.labelRestAdjust}`,
    `^PW${config.mediaWidth}`,
    `^LL${config.mediaLength}`,
    `^MT${printMethodCommand(config.printMethod)}`,
    `^MN${honeywellMediaTracking(config.mediaType)}`,
    `^PR${config.printSpeed}`,
    `^MD${config.darkness}`,
    `^LS${config.mediaMarginX}`,
    `^LT${config.labelTopAdjust}`,
    `^MM${printModeCommand(config.printMode)}`,
    '^XZ',
    '',
  ].join('\n');
}

function buildTestPrintScript(recipe) {
  const width = recipe.brand === 'Honeywell' ? recipe.config.mediaWidth : recipe.config.printWidth;
  const length = recipe.brand === 'Honeywell' ? recipe.config.mediaLength : recipe.config.labelLength;

  return [
    '^XA',
    width ? `^PW${width}` : null,
    length ? `^LL${length}` : null,
    '^FO40,40^A0N,36,36^FDTEST PRINT^FS',
    '^FO40,100^A0N,28,28^FDPrinter recipe push OK^FS',
    '^XZ',
    '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildCalibrationScript(recipe) {
  if (recipe.brand === 'Zebra') return '~JC\n';
  return [
    '^XA',
    '^FX Honeywell calibration request (ZSim)',
    '^JUS',
    '^XZ',
    '',
  ].join('\n');
}

function buildScript(recipe, action = 'push') {
  if (action === 'test-print') return buildTestPrintScript(recipe);
  if (action === 'calibrate') return buildCalibrationScript(recipe);
  if (recipe.brand === 'Zebra') return `${buildZebraResetScript()}${buildZebraConfigScript(recipe)}`;
  return buildHoneywellConfigScript(recipe);
}

function sendTcpScript({ ip, script, timeoutMs = 5000 }) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(value);
    };

    socket.setTimeout(timeoutMs);
    socket.connect(PORT_9100, ip, () => {
      socket.end(script, (error) => {
        if (error) {
          finish(reject, error);
          return;
        }
        finish(resolve, true);
      });
    });

    socket.on('timeout', () => finish(reject, new Error('Connection timed out.')));
    socket.on('error', (error) => finish(reject, error));
  });
}

function checkPrinterStatus(ip, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (online) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(online);
    };

    socket.setTimeout(timeoutMs);
    socket.connect(PORT_9100, ip, () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
  });
}

async function ensureRecipeSchema(pool) {
  if (!ensureRecipeSchemaPromise) {
    ensureRecipeSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          make VARCHAR(50),
          model VARCHAR(50),
          dpi VARCHAR(20),
          media VARCHAR(50),
          width VARCHAR(20),
          length VARCHAR(20),
          top VARCHAR(20),
          left_margin VARCHAR(20),
          darkness VARCHAR(20),
          speed VARCHAR(30),
          loft VARCHAR(100),
          verifier VARCHAR(30),
          calibration VARCHAR(50),
          contrast VARCHAR(20),
          size VARCHAR(50),
          "desc" TEXT,
          config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS config_json JSONB NOT NULL DEFAULT '{}'::jsonb
      `);
    })().catch((error) => {
      ensureRecipeSchemaPromise = null;
      throw error;
    });
  }

  return ensureRecipeSchemaPromise;
}

module.exports = {
  BRAND_MODELS,
  buildScript,
  buildSummaryFields,
  checkPrinterStatus,
  ensureRecipeSchema,
  isValidIp,
  normalizeRecipeRow,
  sendTcpScript,
  validateRecipePayload,
};
