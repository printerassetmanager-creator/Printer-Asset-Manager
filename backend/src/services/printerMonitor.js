const pool = require('../db/pool');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execAsync = promisify(exec);

const DEFAULT_INTERVAL_MS = Number(process.env.PRINTER_MONITOR_INTERVAL_MS || 60000);
const DEFAULT_CONCURRENCY = Number(process.env.PRINTER_MONITOR_CONCURRENCY || 6);

let monitorTimer = null;
let isCycleRunning = false;
let monitorCyclePromise = null;
let tablesReady = false;
let localIpv4Cache = null;

function extractIpFromText(text) {
  const matches = String(text || '').match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
  const usable = matches.find((ip) => !ip.startsWith('127.') && !ip.startsWith('0.'));
  return usable || matches[0] || null;
}

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase().replace(/[^A-Z0-9._-]/g, '');
}

function isHoneywellMake(make) {
  return String(make || '').toLowerCase().includes('honeywell');
}

function uniq(values) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}

function getLocalIpv4Addresses() {
  if (localIpv4Cache) return localIpv4Cache;

  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal && entry.address) {
        ips.push(entry.address);
      }
    }
  }

  localIpv4Cache = new Set(ips);
  return localIpv4Cache;
}

function isLocalMachineIp(ip) {
  return Boolean(ip) && getLocalIpv4Addresses().has(String(ip).trim());
}

function composeLocation(bay, stage, wc) {
  return [bay, stage, wc].filter(Boolean).join(' / ') || '-';
}

function parsePmDate(dateText) {
  const text = String(dateText || '').trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const enGbMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (enGbMatch) {
    const [, d, m, y] = enGbMatch;
    const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

function formatIsoDateUTC(dt) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsKeepDay(dt, months) {
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + months, dt.getUTCDate()));
}

async function maybeAdvancePmDate(printer, client) {
  const parsed = parsePmDate(printer.pmdate);
  if (!parsed) return printer.pmdate || null;

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterdayUtc = new Date(todayUtc);
  yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

  if (parsed.getTime() !== yesterdayUtc.getTime()) return formatIsoDateUTC(parsed);

  const nextPmDate = formatIsoDateUTC(addMonthsKeepDay(parsed, 3));
  await client.query('UPDATE printers SET pmdate=$1, updated_at=NOW() WHERE id=$2', [nextPmDate, printer.id]);
  return nextPmDate;
}

async function mapWithConcurrency(items, limit, mapper) {
  const out = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      out[current] = await mapper(items[current], current);
    }
  });
  await Promise.all(workers);
  return out;
}

function hostTargetsForPrinter(make, serial) {
  const normalizedSerial = normalizeSerial(serial);
  if (!normalizedSerial) return [];

  const domain = process.env.PRINTER_CORP_DOMAIN || 'corp.JABIL.ORG';
  const isHoneywell = isHoneywellMake(make);
  const prefixed = normalizedSerial.toUpperCase().startsWith('PX940V-')
    ? normalizedSerial
    : `PX940V-${normalizedSerial}`;

  if (isHoneywell) {
    return uniq([
      `${prefixed}.${domain}`,
      prefixed,
      `${normalizedSerial}.${domain}`,
      normalizedSerial,
    ]);
  }

  return uniq([
    `${normalizedSerial}.${domain}`,
    normalizedSerial,
    `${prefixed}.${domain}`,
    prefixed,
  ]);
}

async function pingPrinterForIp(make, serial) {
  const targets = hostTargetsForPrinter(make, serial);
  for (const target of targets) {
    try {
      if (process.platform === 'win32') {
        const escapedTarget = target.replace(/'/g, "''");
        const cmd = `powershell -NoProfile -Command "$result = Test-Connection -ComputerName '${escapedTarget}' -Count 1 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($result -and $result.IPv4Address) { $result.IPv4Address.IPAddressToString }"`;
        const { stdout } = await execAsync(cmd, {
          timeout: 5000,
          windowsHide: true,
          maxBuffer: 1024 * 1024,
        });
        const ip = extractIpFromText(stdout);
        if (ip) return ip;
        continue;
      }

      const { stdout, stderr } = await execAsync(`ping -c 1 ${target}`, {
        timeout: 4000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
      const ip = extractIpFromText(`${stdout}\n${stderr}`);
      if (ip) return ip;
    } catch (e) {
      const ip = extractIpFromText(`${e.stdout || ''}\n${e.stderr || ''}`);
      if (ip) return ip;
    }
  }

  return null;
}

function parseHtmlTitle(bodyText) {
  const match = String(bodyText || '').match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

function normalizeStatusText(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripStatusPrefix(value) {
  return normalizeStatusText(value).replace(/^(?:status|warning|error condition)\s*:?\s*/i, '').trim();
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function parseHoneywellPrinterState(bodyText) {
  const body = String(bodyText || '');
  const match = body.match(/<div[^>]*class="printer_status"[^>]*>.*?<span[^>]*>([^<]*)<\/span>/is);
  const status = match ? normalizeStatusText(match[1]) : null;

  if (!status) {
    return null;
  }

  if (status.toUpperCase() === 'READY') {
    return {
      condition_status: 'ready',
      error_reason: null,
      main_status: status,
    };
  }

  return {
    condition_status: 'error',
    error_reason: status,
    main_status: status,
  };
}

function parseHoneywellFirmwareVersion(bodyText) {
  const body = String(bodyText || '');
  const regexes = [
    /Firmware\s+Version\s*<\/[^>]+>\s*<[^>]*>\s*([A-Za-z0-9._-]+)\s*</i,
    /Firmware\s+Version[\s\S]{0,100}?([A-Za-z0-9._-]{5,})/i,
    /"Firmware Version"\s*:\s*"([^"]+)"/i,
  ];

  for (const rx of regexes) {
    const match = body.match(rx);
    if (match?.[1]) {
      const firmware = normalizeStatusText(match[1]);
      if (firmware) return firmware;
    }
  }

  return null;
}

function parseHoneywellMetersToKm(bodyText) {
  const body = String(bodyText || '');
  const regexes = [
    /Total\s+Distance\s+Printed\s*\(Printhead\)[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*m(?![a-z])/i,
    /Printhead\s+Distance[\s\S]{0,40}?(\d+(?:\.\d+)?)\s*m(?![a-z])/i,
    /(?:Printhead|Head).*?Distance[\s:]*(\d+(?:\.\d+)?)\s*m(?![a-z])/i,
    /(\d+(?:\.\d+)?)\s*m(?![a-z])/i,
  ];

  for (const rx of regexes) {
    const match = body.match(rx);
    const meters = Number(match?.[1]);
    if (!Number.isNaN(meters)) {
      return roundToTwo(meters / 1000);
    }
  }

  return null;
}

function parseExplicitPrinterState(bodyText) {
  const body = String(bodyText || '');
  const statusMatch = body.match(/Status\s*:\s*<font[^>]*>(.*?)<\/font>/is);
  const warningMatch = body.match(/<font[^>]*>\s*(?:WARNING|ERROR\s+CONDITION)\s*:?\s*([^<]*)<\/font>/is);

  const status = statusMatch ? stripStatusPrefix(statusMatch[1]) : null;
  const warning = warningMatch ? stripStatusPrefix(warningMatch[1]) : null;

  if (!status) {
    return null;
  }

  if (status.toUpperCase() === 'READY') {
    return {
      condition_status: 'ready',
      error_reason: null,
      main_status: status,
      warning,
    };
  }

  return {
    condition_status: 'error',
    error_reason: [status, warning].filter(Boolean).join(' - '),
    main_status: status,
    warning,
  };
}

function parseErrorReasonFromBody(bodyText) {
  const body = String(bodyText || '').toLowerCase();
  const signatures = [
    ['ribbon in', 'Ribbon In'],
    ['ribbon out', 'Ribbon Out'],
    ['head open', 'Head Open'],
    ['head fault', 'Head Fault'],
    ['paper jam', 'Paper Jam'],
    ['paper out', 'Paper Out'],
    ['media out', 'Media Out'],
    ['not ready', 'Not Ready'],
    ['printer paused', 'Printer Paused'],
    ['fault', 'Fault'],
    ['error', 'General Error'],
  ];
  const hit = signatures.find(([needle]) => body.includes(needle));
  return hit ? hit[1] : null;
}

function parseConditionFromBody(bodyText) {
  const body = String(bodyText || '');
  const lowerBody = body.toLowerCase();
  const title = parseHtmlTitle(body).toLowerCase();
  const honeywellState = parseHoneywellPrinterState(body);
  const explicitState = parseExplicitPrinterState(body);

  if (honeywellState) {
    return {
      condition_status: honeywellState.condition_status,
      error_reason: honeywellState.error_reason,
    };
  }

  if (explicitState) {
    return {
      condition_status: explicitState.condition_status,
      error_reason: explicitState.error_reason,
    };
  }

  const reason = parseErrorReasonFromBody(body);

  if (reason) {
    return {
      condition_status: 'error',
      error_reason: reason,
    };
  }

  const isPaused =
    title.includes('paused') ||
    lowerBody.includes('status: paused') ||
    lowerBody.includes('status paused') ||
    lowerBody.includes('printer paused');

  if (isPaused) {
    return {
      condition_status: 'error',
      error_reason: 'Paused',
    };
  }

  const isNotReady = title.includes('not ready') || lowerBody.includes('not ready');
  if (isNotReady) {
    return {
      condition_status: 'error',
      error_reason: 'Not Ready',
    };
  }

  const isReady =
    title.includes('ready') ||
    lowerBody.includes('>ready<') ||
    lowerBody.includes('status: ready') ||
    lowerBody.includes('status ready');

  if (isReady) {
    return {
      condition_status: 'ready',
      error_reason: null,
    };
  }

  return {
    condition_status: null,
    error_reason: null,
  };
}

function parseFirmwareFromBody(bodyText, make) {
  const body = String(bodyText || '');
  const isHoneywell = String(make || '').toLowerCase().includes('honeywell');
  const isZebra = String(make || '').toLowerCase().includes('zebra');

  if (isHoneywell) {
    const firmware = parseHoneywellFirmwareVersion(body);
    if (firmware) return firmware;
  }

  const regexes = [
    ...(isZebra ? [/([A-Z0-9.]+)\s+<-\s*.*?FIRMWARE/i] : []),
    /firmware(?:\s*version)?\s*[:=]\s*([A-Za-z0-9._-]{2,})/i,
    /fw(?:\s*version)?\s*[:=]\s*([A-Za-z0-9._-]{2,})/i,
    /"firmware"\s*:\s*"([^"]+)"/i,
  ];
  for (const rx of regexes) {
    const m = body.match(rx);
    if (m && m[1]) return normalizeStatusText(m[1]);
  }
  return null;
}

function parseKmFromBody(bodyText, make) {
  const body = String(bodyText || '');
  const makeText = String(make || '').toLowerCase();

  if (makeText.includes('zebra')) {
    const zebraRegexes = [
      /([\d,]+)\s*CM\s+NONRESET\s+CNTR/i,
      /NONRESET\s+CNTR[\s\S]{0,40}?([\d,]+)\s*CM/i,
      /(\d+(?:,\d{3})+|\d+)\s*cm(?![a-z])/i,
    ];

    for (const rx of zebraRegexes) {
      const match = body.match(rx);
      const raw = match?.[1];
      if (!raw) continue;
      const cm = Number(raw.replace(/,/g, ''));
      if (!Number.isNaN(cm)) return roundToTwo(cm / 100000);
    }
  }

  if (makeText.includes('honeywell')) {
    const km = parseHoneywellMetersToKm(body);
    if (km !== null) return km;
  }

  const regexes = [
    /(?:label\s*count|print\s*count|counter|km)\s*[:=]\s*([0-9,.\s]{1,30})/i,
    /"print_count"\s*:\s*"?(?<v>[0-9,.\s]{1,30})"?/i,
  ];
  for (const rx of regexes) {
    const m = body.match(rx);
    if (m) {
      const val = m.groups?.v || m[1];
      if (val) return normalizeStatusText(val);
    }
  }
  return null;
}

function getWebCredentialsByMake(make) {
  const m = String(make || '').toLowerCase();
  if (m.includes('zebra')) {
    return { username: 'admin', password: '1234' };
  }
  if (m.includes('honeywell')) {
    return { username: 'itadmin', password: 'pass' };
  }
  return null;
}

function needsAuthenticatedRetry(status, bodyText) {
  if (status === 401 || status === 403) return true;
  const body = String(bodyText || '').toLowerCase();
  return (
    body.includes('login') ||
    body.includes('sign in') ||
    body.includes('username') ||
    body.includes('password')
  );
}

async function fetchPrinterPage(ip, authHeader, path = '/') {
  const protocols = ['http', 'https'];
  let lastError = null;

  for (const protocol of protocols) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const headers = authHeader ? { Authorization: authHeader } : undefined;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const res = await fetch(`${protocol}://${ip}${normalizedPath}`, { signal: controller.signal, headers });
      const body = await res.text();
      return { res, body, protocol };
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('Unable to reach printer web page');
}

async function readPrinterWebDetails(ip, make) {
  if (!ip) {
    return {
      web_reachable: false,
      condition_status: null,
      error_reason: null,
      firmware_version: null,
      printer_km: null,
    };
  }

  if (isLocalMachineIp(ip)) {
    return {
      web_reachable: false,
      condition_status: 'unknown',
      error_reason: 'Resolved to local PC IP',
      firmware_version: null,
      printer_km: null,
    };
  }

  const creds = getWebCredentialsByMake(make);
  const isHoneywell = String(make || '').toLowerCase().includes('honeywell');
  const isZebra = String(make || '').toLowerCase().includes('zebra');
  try {
    let { res, body } = await fetchPrinterPage(ip, null, '/');

    if (creds && needsAuthenticatedRetry(res.status, body)) {
      const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
      const authResponse = await fetchPrinterPage(ip, authHeader, '/');
      res = authResponse.res;
      body = authResponse.body;
    }

    const condition = parseConditionFromBody(body, make);
    let firmware = parseFirmwareFromBody(body, make);
    let km = parseKmFromBody(body, make);

    if (isZebra) {
      try {
        let configResponse = await fetchPrinterPage(ip, null, '/config.html');
        if (creds && needsAuthenticatedRetry(configResponse.res.status, configResponse.body)) {
          const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
          configResponse = await fetchPrinterPage(ip, authHeader, '/config.html');
        }

        if (configResponse.res.ok) {
          firmware = parseFirmwareFromBody(configResponse.body, make) || firmware;
          km = parseKmFromBody(configResponse.body, make) ?? km;
        }
      } catch {
        // Keep root-page values if config fetch fails.
      }
    }

    if (isHoneywell) {
      try {
        let statsResponse = await fetchPrinterPage(ip, null, '/statistics/displaydata.lua');
        if (creds && needsAuthenticatedRetry(statsResponse.res.status, statsResponse.body)) {
          const authHeader = `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`;
          statsResponse = await fetchPrinterPage(ip, authHeader, '/statistics/displaydata.lua');
        }

        if (statsResponse.res.ok) {
          firmware = parseFirmwareFromBody(statsResponse.body, make) || firmware;
          km = parseKmFromBody(statsResponse.body, make) ?? km;
        }
      } catch {
        // Keep home-page values if Honeywell statistics fetch fails.
      }
    }

    if (!res.ok) {
      return {
        web_reachable: true,
        condition_status: 'error',
        error_reason: condition.error_reason || `HTTP ${res.status}`,
        firmware_version: firmware,
        printer_km: km,
        printer_type: isHoneywell ? 'Honeywell' : (isZebra ? 'Zebra' : null),
      };
    }

    return {
      web_reachable: true,
      condition_status: condition.condition_status || 'unknown',
      error_reason: condition.error_reason || (condition.condition_status ? null : 'Printer web page reachable but status not detected'),
      firmware_version: firmware,
      printer_km: km,
      printer_type: isHoneywell ? 'Honeywell' : (isZebra ? 'Zebra' : null),
    };
  } catch {
    return {
      web_reachable: false,
      condition_status: 'unknown',
      error_reason: 'Web UI unreachable',
      firmware_version: null,
      printer_km: null,
      printer_type: isHoneywell ? 'Honeywell' : (isZebra ? 'Zebra' : null),
    };
  }
}

async function ensurePrinterMonitorTables() {
  if (tablesReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS printer_live_state (
      pmno VARCHAR(20) PRIMARY KEY,
      serial VARCHAR(50),
      ip VARCHAR(20),
      online_status VARCHAR(20) DEFAULT 'offline',
      condition_status VARCHAR(20) DEFAULT 'ready',
      error_reason TEXT,
      firmware_version VARCHAR(100),
      printer_km VARCHAR(100),
      resolved_bay VARCHAR(30),
      resolved_stage VARCHAR(30),
      resolved_wc VARCHAR(30),
      location_display TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE printer_live_state ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(100)`);
  await pool.query(`ALTER TABLE printer_live_state ADD COLUMN IF NOT EXISTS printer_km VARCHAR(100)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS printer_status_logs (
      id SERIAL PRIMARY KEY,
      pmno VARCHAR(20) NOT NULL,
      serial VARCHAR(50),
      event_type VARCHAR(40) NOT NULL,
      reason TEXT,
      old_online_status VARCHAR(20),
      new_online_status VARCHAR(20),
      old_condition_status VARCHAR(20),
      new_condition_status VARCHAR(20),
      old_error_reason TEXT,
      new_error_reason TEXT,
      old_ip VARCHAR(20),
      new_ip VARCHAR(20),
      logged_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_printer_status_logs_pmno_time
    ON printer_status_logs (pmno, logged_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_printer_status_logs_logged_at
    ON printer_status_logs (logged_at DESC)
  `);

  tablesReady = true;
}

async function cleanupOldPrinterLogs(client = pool) {
  await client.query(`DELETE FROM printer_status_logs WHERE logged_at < NOW() - INTERVAL '1 month'`);
}

async function ensureFreshPrinterLiveState(maxAgeMs = Number(process.env.PRINTER_MONITOR_FRESHNESS_MS || DEFAULT_INTERVAL_MS)) {
  await ensurePrinterMonitorTables();

  const { rows } = await pool.query('SELECT MAX(updated_at) AS latest_updated_at FROM printer_live_state');
  const latestUpdatedAt = rows[0]?.latest_updated_at ? new Date(rows[0].latest_updated_at) : null;
  const isFresh = latestUpdatedAt && (Date.now() - latestUpdatedAt.getTime()) <= maxAgeMs;

  if (!isFresh) {
    await runPrinterMonitorCycle();
  }
}

function buildChangeLogs(prev, next) {
  const logs = [];

  if (prev.online_status !== next.online_status) {
    logs.push({
      event_type: 'ONLINE_STATUS_CHANGED',
      reason: next.online_status === 'online' ? 'Printer came online' : 'Printer went offline',
      old_online_status: prev.online_status,
      new_online_status: next.online_status,
      old_condition_status: prev.condition_status,
      new_condition_status: next.condition_status,
      old_error_reason: prev.error_reason,
      new_error_reason: next.error_reason,
      old_ip: prev.ip,
      new_ip: next.ip,
    });
  }

  if ((prev.ip || null) !== (next.ip || null)) {
    logs.push({
      event_type: 'IP_CHANGED',
      reason: 'IP address changed',
      old_online_status: prev.online_status,
      new_online_status: next.online_status,
      old_condition_status: prev.condition_status,
      new_condition_status: next.condition_status,
      old_error_reason: prev.error_reason,
      new_error_reason: next.error_reason,
      old_ip: prev.ip,
      new_ip: next.ip,
    });
  }

  const conditionChanged = prev.condition_status !== next.condition_status;
  const errorReasonChanged = (prev.error_reason || null) !== (next.error_reason || null);
  if (conditionChanged || errorReasonChanged) {
    logs.push({
      event_type: 'CONDITION_CHANGED',
      reason: next.condition_status === 'error'
        ? `Printer error detected${next.error_reason ? `: ${next.error_reason}` : ''}`
        : 'Printer returned to ready state',
      old_online_status: prev.online_status,
      new_online_status: next.online_status,
      old_condition_status: prev.condition_status,
      new_condition_status: next.condition_status,
      old_error_reason: prev.error_reason,
      new_error_reason: next.error_reason,
      old_ip: prev.ip,
      new_ip: next.ip,
    });
  }

  return logs;
}

async function runPrinterMonitorCycle() {
  if (monitorCyclePromise) return monitorCyclePromise;

  monitorCyclePromise = (async () => {
    isCycleRunning = true;

    let client;
    try {
      await ensurePrinterMonitorTables();

      const [{ rows: printers }, { rows: liveRows }, { rows: latestHealthRows }] = await Promise.all([
        pool.query('SELECT id, pmno, serial, make, model, dpi, pmdate, firmware, wc, loc, stage, bay, status FROM printers ORDER BY pmno'),
        pool.query('SELECT * FROM printer_live_state'),
        pool.query(`
          SELECT DISTINCT ON (pmno)
            pmno, firmware, km, loc, stage, bay, wc, checked_at
          FROM health_checkups
          WHERE pmno IS NOT NULL
          ORDER BY pmno, checked_at DESC
        `),
      ]);

      client = await pool.connect();
      await client.query('BEGIN');

      const normalizedPrinters = [];
      for (const p of printers) {
        const normalizedPmDate = await maybeAdvancePmDate(p, client);
        normalizedPrinters.push({ ...p, pmno: String(p.pmno || '').toUpperCase(), pmdate: normalizedPmDate });
      }

      const prevByPm = new Map(liveRows.map((s) => [String(s.pmno || '').toUpperCase(), s]));
      const healthByPm = new Map(latestHealthRows.map((h) => [String(h.pmno || '').toUpperCase(), h]));

      const nextStates = await mapWithConcurrency(normalizedPrinters, DEFAULT_CONCURRENCY, async (p) => {
        const prev = prevByPm.get(p.pmno);
        const pingIp = await pingPrinterForIp(p.make, p.serial);
        const online_status = pingIp ? 'online' : 'offline';

        const effectiveIp = pingIp || prev?.ip || null;
        const health = healthByPm.get(p.pmno);
        const baseCondition = String(p.status || '').toLowerCase() === 'error' ? 'error' : 'ready';
        const condition_status = prev?.condition_status || baseCondition;
        const error_reason = prev?.error_reason || null;
        const firmware_version = prev?.firmware_version || null;
        const printer_km = prev?.printer_km || null;

        const resolved_bay = health?.bay || p.bay || prev?.resolved_bay || null;
        const resolved_stage = health?.stage || p.stage || prev?.resolved_stage || null;
        const resolved_wc = health?.wc || p.wc || prev?.resolved_wc || null;
        const location_display = composeLocation(resolved_bay, resolved_stage, resolved_wc);

        return {
          pmno: p.pmno,
          serial: p.serial || null,
          ip: effectiveIp,
          online_status,
          condition_status,
          error_reason,
          firmware_version,
          printer_km,
          resolved_bay,
          resolved_stage,
          resolved_wc,
          location_display,
        };
      });

      for (const s of nextStates) {
        await client.query(
          `INSERT INTO printer_live_state
            (pmno, serial, ip, online_status, condition_status, error_reason, firmware_version, printer_km, resolved_bay, resolved_stage, resolved_wc, location_display, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
           ON CONFLICT (pmno) DO UPDATE SET
             serial = EXCLUDED.serial,
             ip = EXCLUDED.ip,
             online_status = EXCLUDED.online_status,
             condition_status = EXCLUDED.condition_status,
             error_reason = EXCLUDED.error_reason,
             firmware_version = EXCLUDED.firmware_version,
             printer_km = EXCLUDED.printer_km,
             resolved_bay = EXCLUDED.resolved_bay,
             resolved_stage = EXCLUDED.resolved_stage,
             resolved_wc = EXCLUDED.resolved_wc,
             location_display = EXCLUDED.location_display,
             updated_at = NOW()`,
          [
            s.pmno,
            s.serial,
            s.ip,
            s.online_status,
            s.condition_status,
            s.error_reason,
            s.firmware_version,
            s.printer_km,
            s.resolved_bay,
            s.resolved_stage,
            s.resolved_wc,
            s.location_display,
          ]
        );

        const prev = prevByPm.get(s.pmno);
        if (!prev) continue;
        const logs = buildChangeLogs(prev, s);
        for (const log of logs) {
          await client.query(
            `INSERT INTO printer_status_logs
              (pmno, serial, event_type, reason, old_online_status, new_online_status, old_condition_status, new_condition_status, old_error_reason, new_error_reason, old_ip, new_ip, logged_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,
            [
              s.pmno,
              s.serial,
              log.event_type,
              log.reason,
              log.old_online_status,
              log.new_online_status,
              log.old_condition_status,
              log.new_condition_status,
              log.old_error_reason,
              log.new_error_reason,
              log.old_ip,
              log.new_ip,
            ]
          );
        }
      }

      await cleanupOldPrinterLogs(client);
      await client.query('COMMIT');
    } catch (e) {
      if (client) await client.query('ROLLBACK');
      console.error('Printer monitor cycle failed:', e.message);
    } finally {
      if (client) client.release();
      isCycleRunning = false;
      monitorCyclePromise = null;
    }
  })();

  return monitorCyclePromise;
}

function startPrinterMonitor() {
  if (monitorTimer) return;
  runPrinterMonitorCycle();
  monitorTimer = setInterval(runPrinterMonitorCycle, DEFAULT_INTERVAL_MS);
  monitorTimer.unref();
}

module.exports = {
  ensurePrinterMonitorTables,
  ensureFreshPrinterLiveState,
  cleanupOldPrinterLogs,
  pingPrinterForIp,
  readPrinterWebDetails,
  runPrinterMonitorCycle,
  startPrinterMonitor,
};
