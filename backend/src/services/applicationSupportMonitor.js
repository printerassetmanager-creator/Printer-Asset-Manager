const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');
const {
  sendApplicationSupportTerminalLoadAlert,
  sendApplicationSupportTerminalRecoveryAlert,
  sendApplicationSupportMonitorAlert,
} = require('./emailService');

const DEFAULT_POLL_INTERVAL_MS = 60 * 1000;
const SERVER_USER_LIMIT = 30;
const TERMINAL_ALERT_THRESHOLD = 31;
const ALERT_HOURS = [6, 14, 18, 22];
const ALERT_TIME_ZONE = process.env.APP_SUPPORT_ALERT_TIME_ZONE || 'Asia/Kolkata';
const TERMINAL_MONITOR_CYCLE_MS = 5 * 60 * 1000;
const TERMINAL_MONITOR_RETRY_LIMIT = 2;
const TERMINAL_MONITOR_TOTAL_ATTEMPTS = TERMINAL_MONITOR_RETRY_LIMIT + 1;
const TERMINAL_MONITOR_TIMEOUT_MS = 130 * 1000;
const TERMINAL_MONITOR_SLOW_THRESHOLD_MS = 90 * 1000;
const SERVER_PERFORMANCE_CYCLE_MS = 10 * 60 * 1000;
const SERVER_PERFORMANCE_RETRY_LIMIT = 2;
const SERVER_PERFORMANCE_TOTAL_ATTEMPTS = SERVER_PERFORMANCE_RETRY_LIMIT + 1;
const SERVER_PERFORMANCE_TIMEOUT_MS = 130 * 1000;
const SERVER_PERFORMANCE_SLOW_THRESHOLD_MS = 90 * 1000;
const SERVER_CLEANUP_INTERVAL_MS = 5 * 60 * 60 * 1000; // every 5 hours
const SERVER_CLEANUP_RETRY_LIMIT = 1;
const CLEANUP_LOG_RETENTION_DAYS = 90;
const RDP_STORAGE_DIR = path.resolve(__dirname, '..', 'rdp_files');
const MONITOR_LOG_RETENTION_DAYS = 14;

const terminalDefaults = [
  { code: 'P01', name: 'P01', servers: [...rangeServers('INRJNM0RDSHP', 1, 20), ...rangeServers('INRJNM0RDSHP', 51, 54)] },
  { code: 'VAO01', name: 'VAO01', servers: rangeServers('INRJNM0RDSHVA', 11, 30) },
  { code: 'M01', name: 'M01', servers: rangeServers('INRJNM0RDSHM', 1, 6) },
  { code: 'D01', name: 'D01', servers: rangeServers('INRJNM0RDSHD', 1, 3) },
  { code: 'E01', name: 'E01', servers: rangeServers('INRJNM0RDSHE', 1, 6) },
];

let appSupportMonitorTimer = null;
let serverCleanupTimer = null;
let terminalMonitorTimer = null;
let serverPerformanceTimer = null;
let monitorRunning = false;
let cleanupState = {
  isRunning: false,
  lastRunAt: null,
  lastStatus: 'idle',
  lastError: null,
};
let alertTimer = null;
let lastTerminalLoadAlertKey = null;

const terminalMonitorState = {
  active: false,
  requiresCredentials: true,
  credentials: null,
  lastStartedAt: null,
  lastRunAt: null,
  lastCompletedAt: null,
  lastStatus: 'idle',
  lastError: null,
  lastRunLogs: [],
  lastRunResults: [],
  isRunning: false,
  currentTerminal: null,
  currentPhase: null,
  criticalAlert: null,
};

const serverPerformanceState = {
  active: false,
  requiresCredentials: true,
  credentials: null,
  lastStartedAt: null,
  lastRunAt: null,
  lastCompletedAt: null,
  lastStatus: 'idle',
  lastError: null,
  lastRunLogs: [],
  lastRunResults: [],
  isRunning: false,
  currentServer: null,
  currentPhase: null,
  criticalAlert: null,
};

function ensureRdpStorageDir() {
  if (!fs.existsSync(RDP_STORAGE_DIR)) {
    fs.mkdirSync(RDP_STORAGE_DIR, { recursive: true });
  }
}

function rangeServers(prefix, start, end) {
  const width = start >= 10 || end >= 10 ? 2 : 2;
  const servers = [];
  for (let value = start; value <= end; value += 1) {
    servers.push(`${prefix}${String(value).padStart(width, '0')}`);
  }
  return servers;
}

async function ensureApplicationSupportTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_terminals (
      id SERIAL PRIMARY KEY,
      code VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_servers (
      id SERIAL PRIMARY KEY,
      terminal_id INTEGER REFERENCES app_support_terminals(id) ON DELETE CASCADE,
      name VARCHAR(100) UNIQUE NOT NULL,
      active_users INTEGER DEFAULT 0,
      max_users INTEGER DEFAULT ${SERVER_USER_LIMIT},
      status VARCHAR(20) DEFAULT 'unknown',
      last_checked_at TIMESTAMP,
      last_error TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_terminal_alert_state (
      terminal_id INTEGER PRIMARY KEY,
      terminal_code VARCHAR(30) NOT NULL,
      is_overloaded BOOLEAN NOT NULL DEFAULT FALSE,
      last_changed_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_server_cleanup_logs (
      id SERIAL PRIMARY KEY,
      server_name VARCHAR(100) NOT NULL,
      deleted_profiles TEXT[] DEFAULT ARRAY[]::TEXT[],
      space_freed_bytes BIGINT DEFAULT 0,
      status VARCHAR(20) NOT NULL,
      triggered_by VARCHAR(255),
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function ensureMonitorTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_monitor_rdp_files (
      id SERIAL PRIMARY KEY,
      terminal_code VARCHAR(30) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by VARCHAR(255),
      uploaded_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_monitor_terminal_history (
      id SERIAL PRIMARY KEY,
      terminal_code VARCHAR(30) NOT NULL,
      terminal_label VARCHAR(255),
      status VARCHAR(30) NOT NULL,
      attempt_count INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      elapsed_ms INTEGER NOT NULL,
      cycle_id VARCHAR(60),
      sequence_group VARCHAR(60),
      sort_order INTEGER DEFAULT 0,
      source_file_name VARCHAR(255),
      details_json JSONB,
      error_text TEXT,
      run_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS terminal_label VARCHAR(255)`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS cycle_id VARCHAR(60)`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS sequence_group VARCHAR(60)`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS source_file_name VARCHAR(255)`);
  await pool.query(`ALTER TABLE app_support_monitor_terminal_history ADD COLUMN IF NOT EXISTS details_json JSONB`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_server_performance_history (
      id SERIAL PRIMARY KEY,
      server_name VARCHAR(100) NOT NULL,
      terminal_code VARCHAR(30),
      terminal_label VARCHAR(255),
      status VARCHAR(30) NOT NULL,
      attempt_count INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      elapsed_ms INTEGER NOT NULL,
      cycle_id VARCHAR(60),
      sort_order INTEGER DEFAULT 0,
      details_json JSONB,
      error_text TEXT,
      run_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS terminal_code VARCHAR(30)`);
  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS terminal_label VARCHAR(255)`);
  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS cycle_id VARCHAR(60)`);
  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE app_support_server_performance_history ADD COLUMN IF NOT EXISTS details_json JSONB`);

  await pool.query(
    `DELETE FROM app_support_monitor_terminal_history
     WHERE run_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [MONITOR_LOG_RETENTION_DAYS]
  );

  await pool.query(
    `DELETE FROM app_support_server_performance_history
     WHERE run_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [MONITOR_LOG_RETENTION_DAYS]
  );
}

function getMonitorFileHeading(fileName) {
  const base = path.basename(String(fileName || ''), path.extname(String(fileName || '')));
  return base || 'Terminal';
}

function inferTerminalCodeFromFileName(fileName) {
  const upper = getMonitorFileHeading(fileName).toUpperCase();
  const match = upper.match(/\b(VAO01|M01|P01|D01|E01)\b/);
  return match ? match[1] : null;
}

function createCycleId() {
  return `cycle_${Date.now()}`;
}

function getMonitorStatusColor(status, elapsedMs = 0) {
  if (status === 'launching' || status === 'running') return 'blue';
  if (status === 'success' || status === 'ready' || status === 'completed') {
    return elapsedMs >= TERMINAL_MONITOR_SLOW_THRESHOLD_MS ? 'yellow' : 'green';
  }
  if (status === 'timeout' || status === 'slow') return 'yellow';
  if (status === 'failed' || status === 'error' || status === 'invalid_credentials') return 'red';
  return 'blue';
}

function getServerPerformanceStatusColor(status, elapsedMs = 0) {
  if (status === 'launching' || status === 'running') return 'blue';
  if (status === 'success' || status === 'ready' || status === 'completed') {
    return elapsedMs >= SERVER_PERFORMANCE_SLOW_THRESHOLD_MS ? 'yellow' : 'green';
  }
  if (status === 'timeout' || status === 'slow') return 'yellow';
  if (status === 'failed' || status === 'error' || status === 'invalid_credentials') return 'red';
  return 'blue';
}

function normalizeMonitorLog(row) {
  return {
    ...row,
    attempt_count: Number(row.attempt_count || 0),
    retry_count: Number(row.retry_count || 0),
    elapsed_ms: Number(row.elapsed_ms || 0),
    details_json: row.details_json || null,
  };
}

function buildMonitorExecutionPlan(files) {
  return files
    .sort((a, b) => a.terminal_code.localeCompare(b.terminal_code) || a.file_name.localeCompare(b.file_name))
    .map((file) => ({
      key: file.terminal_code,
      sequenceGroup: 'parallel',
      terminals: [file],
    }));
}

async function getMonitorRdpFiles() {
  await ensureMonitorTables();
  ensureRdpStorageDir();

  const result = await pool.query(
    `SELECT id, terminal_code, file_name, file_path, uploaded_by, uploaded_at
     FROM app_support_monitor_rdp_files
     ORDER BY terminal_code, uploaded_at DESC`
  );
  return result.rows;
}

function parseRdpServerAddress(content) {
  const match = content.match(/^full address:s:(.+)$/im);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function validateRdpFileContent(content) {
  const serverAddress = parseRdpServerAddress(content);
  if (!serverAddress) {
    throw new Error('Invalid RDP file: missing "full address:s:<server>"');
  }
  if (/\s/.test(serverAddress)) {
    throw new Error(`Invalid RDP file: full address must be one server name, found "${serverAddress}"`);
  }
  return serverAddress;
}

function buildMonitorTerminalPowershellScript({ terminals, username, password, timeoutMs, totalAttempts }) {
  const payload = JSON.stringify({
    terminals: terminals.map((terminal, index) => ({
      terminal_code: terminal.terminal_code,
      terminal_label: terminal.terminal_label || getMonitorFileHeading(terminal.file_name),
      file_path: terminal.file_path,
      server_address: terminal.server_address,
      sort_order: index,
    })),
    username,
    password,
    timeoutMs,
    totalAttempts,
    securityPatterns: ['Windows Security', 'Remote Desktop Connection', 'Enter your credentials'],
    jabilPatterns: ['Jabil', 'BlueZone', 'Blue Zone', 'IBM i'],
    invalidPatterns: ['invalid credentials', 'credentials did not work', 'logon attempt failed', 'access denied', 'denied'],
    credentialAcceptWaitMs: 8000,
    desktopPatterns: ['MES', 'Desktop', 'BlueZone', 'Blue Zone'],
  }).replace(/'/g, "''");

  return `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$payload = ConvertFrom-Json @'
${payload}
'@
$shell = New-Object -ComObject WScript.Shell

function Get-WindowTitles {
  return Get-Process |
    Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Trim().Length -gt 0 } |
    Select-Object -ExpandProperty MainWindowTitle
}

function Matches-Pattern {
  param(
    [string[]]$Titles,
    [string[]]$Patterns
  )

  foreach ($title in $Titles) {
    foreach ($pattern in $Patterns) {
      if ($title -and $title.ToLower().Contains($pattern.ToLower())) {
        return $title
      }
    }
  }
  return $null
}

function Activate-WindowLike {
  param([string[]]$Patterns)

  $titles = Get-WindowTitles
  $title = Matches-Pattern -Titles $titles -Patterns $Patterns
  if ($title) {
    try {
      return $shell.AppActivate($title)
    } catch {
      return $false
    }
  }
  return $false
}

function Get-WindowText {
  param([string[]]$Patterns)

  $processes = Get-Process | Where-Object { $_.MainWindowHandle -and $_.MainWindowTitle }
  foreach ($proc in $processes) {
    $matched = $false
    foreach ($pattern in $Patterns) {
      if ($proc.MainWindowTitle.ToLower().Contains($pattern.ToLower())) {
        $matched = $true
        break
      }
    }
    if (-not $matched) { continue }

    try {
      $element = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
      $condition = New-Object System.Windows.Automation.PropertyCondition -ArgumentList (
        [System.Windows.Automation.AutomationElement]::IsControlElementProperty,
        $true
      )
      $children = $element.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
      $parts = @($proc.MainWindowTitle)
      foreach ($child in $children) {
        $name = $child.Current.Name
        if ($name -and $name.Trim().Length -gt 0) {
          $parts += $name.Trim()
        }
      }
      return ($parts | Select-Object -Unique) -join ' '
    } catch {
      return $proc.MainWindowTitle
    }
  }

  return $null
}

function Try-HandleRdpFatalPopup {
  $popupText = Get-WindowText -Patterns @('Remote Desktop Connection')
  if (-not $popupText) {
    return $null
  }

  $lower = $popupText.ToLower()
  $isFatal = (
    $lower.Contains('digital signature') -or
    $lower.Contains('cannot be verified') -or
    $lower.Contains('remote connection cannot be started') -or
    $lower.Contains('rdp file') -or
    $lower.Contains('an internal error has occurred') -or
    $lower.Contains('remote desktop can') -or
    $lower.Contains('because of a protocol error')
  )

  if (-not $isFatal) {
    return $null
  }

  Activate-WindowLike -Patterns @('Remote Desktop Connection') | Out-Null
  Start-Sleep -Milliseconds 200
  $shell.SendKeys('{ENTER}')
  $cleanText = ($popupText -replace '\\s+', ' ').Trim()
  $cleanText = ($cleanText -replace '^Remote Desktop Connection\\s*', '').Trim()
  $cleanText = ($cleanText -replace '\\s+OK$', '').Trim()
  return $cleanText
}

function Try-HandleCredentialPopup {
  param($Username, $Password)

  if (Activate-WindowLike -Patterns $payload.securityPatterns) {
    Start-Sleep -Milliseconds 350
    $shell.SendKeys('^a')
    Start-Sleep -Milliseconds 100
    $shell.SendKeys($Username)
    Start-Sleep -Milliseconds 100
    $shell.SendKeys('{TAB}')
    Start-Sleep -Milliseconds 100
    $shell.SendKeys($Password)
    Start-Sleep -Milliseconds 100
    $shell.SendKeys('{ENTER}')
    return $true
  }
  return $false
}

function Wait-CredentialAccepted {
  param($Terminal, $StartedAt)

  $deadline = (Get-Date).AddMilliseconds($payload.credentialAcceptWaitMs)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 350

    if (Test-InvalidCredentials) {
      return @{
        status = 'invalid_credentials'
        elapsed_ms = 0
        error = 'Invalid credentials popup detected'
      }
    }

    $titles = Get-WindowTitles
    if (-not (Matches-Pattern -Titles $titles -Patterns $payload.securityPatterns)) {
      return @{
        status = 'accepted'
        elapsed_ms = 0
        error = $null
      }
    }

    if ((Get-Date) -ge $StartedAt.AddMilliseconds($payload.timeoutMs)) {
      return @{
        status = 'failed'
        elapsed_ms = 0
        error = 'Credential dialog did not complete before timeout'
      }
    }
  }

  return @{
    status = 'failed'
    elapsed_ms = 0
    error = 'Credential dialog stayed open after password entry'
  }
}

function Try-HandleJabilPopup {
  if (Activate-WindowLike -Patterns $payload.jabilPatterns) {
    Start-Sleep -Milliseconds 250
    $shell.SendKeys('{ENTER}')
    return $true
  }
  return $false
}

function Test-InvalidCredentials {
  $titles = Get-WindowTitles
  return [bool](Matches-Pattern -Titles $titles -Patterns $payload.invalidPatterns)
}

function Test-DesktopReady {
  param($Terminal)

  $titles = Get-WindowTitles
  if (Matches-Pattern -Titles $titles -Patterns $payload.desktopPatterns) {
    return $true
  }

  foreach ($title in $titles) {
    if (
      $title -and (
        $title.ToLower().Contains($Terminal.server_address.ToLower()) -or
        $title.ToLower().Contains($Terminal.terminal_code.ToLower()) -or
        $title.ToLower().Contains($Terminal.terminal_label.ToLower())
      ) -and
      -not (Matches-Pattern -Titles @($title) -Patterns $payload.securityPatterns) -and
      -not (Matches-Pattern -Titles @($title) -Patterns $payload.invalidPatterns)
    ) {
      return $true
    }
  }

  return $false
}

function Close-SessionProcess {
  param($Process)

  try {
    if ($Process -and -not $Process.HasExited) {
      Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

function Logout-Session {
  param($Session)

  try {
    if ($Session.process -and -not $Session.process.HasExited) {
      if (Activate-WindowLike -Patterns @($Session.terminal.server_address, $Session.terminal.terminal_code, $Session.terminal.terminal_label)) {
        Start-Sleep -Milliseconds 300
        $shell.SendKeys('^({ESC})')
        Start-Sleep -Milliseconds 350
        $shell.SendKeys('logoff')
        Start-Sleep -Milliseconds 180
        $shell.SendKeys('{ENTER}')
        Start-Sleep -Seconds 2
      }
    }
  } catch {}

  Close-SessionProcess -Process $Session.process
}

function Launch-Terminal {
  param($Terminal)

  $lastError = $null
  $elapsedMs = 0

  for ($attempt = 1; $attempt -le $payload.totalAttempts; $attempt++) {
    $attemptError = $null
    try { cmdkey /generic:"TERMSRV/$($Terminal.server_address)" /user:$($payload.username) /pass:$($payload.password) 2>$null | Out-Null } catch {}

    if (-not $Terminal.file_path -or -not (Test-Path -LiteralPath $Terminal.file_path)) {
      return @{
        terminal_code = $Terminal.terminal_code
        terminal_label = $Terminal.terminal_label
        status = 'failed'
        attempt_count = $attempt
        retry_count = [math]::Max(0, $attempt - 1)
        elapsed_ms = 0
        error = "RDP file not found: $($Terminal.file_path)"
        sort_order = $Terminal.sort_order
      }
    }

    $rdpArgument = '"' + $Terminal.file_path + '"'
    try {
      $process = Start-Process -FilePath 'mstsc.exe' -ArgumentList @($rdpArgument) -PassThru -WindowStyle Normal
    } catch {
      $process = Start-Process -FilePath 'mstsc.exe' -ArgumentList @("/v:$($Terminal.server_address)") -PassThru -WindowStyle Normal
    }
    $start = Get-Date
    $countdownStart = $null
    $ready = $false
    $handledCredential = $false

    while ((Get-Date) -lt $start.AddMilliseconds($payload.timeoutMs)) {
      Start-Sleep -Milliseconds 600
      try { $process.Refresh() } catch {}

      $rdpFatalError = Try-HandleRdpFatalPopup
      if ($rdpFatalError) {
        $attemptError = $rdpFatalError
        Close-SessionProcess -Process $process
        break
      }

      if (Test-InvalidCredentials) {
        Close-SessionProcess -Process $process
        return @{
          terminal_code = $Terminal.terminal_code
          terminal_label = $Terminal.terminal_label
          status = 'invalid_credentials'
          attempt_count = $attempt
          retry_count = [math]::Max(0, $attempt - 1)
          elapsed_ms = 0
          error = 'Invalid credentials popup detected'
          sort_order = $Terminal.sort_order
        }
      }

      if (-not $handledCredential) {
        $handledCredential = Try-HandleCredentialPopup -Username $payload.username -Password $payload.password
        if ($handledCredential) {
          $credentialState = Wait-CredentialAccepted -Terminal $Terminal -StartedAt $start
          if ($credentialState.status -eq 'invalid_credentials') {
            Close-SessionProcess -Process $process
            return @{
              terminal_code = $Terminal.terminal_code
              terminal_label = $Terminal.terminal_label
              status = 'invalid_credentials'
              attempt_count = $attempt
              retry_count = [math]::Max(0, $attempt - 1)
              elapsed_ms = 0
              error = $credentialState.error
              sort_order = $Terminal.sort_order
            }
          }

          if ($credentialState.status -ne 'accepted') {
            $attemptError = $credentialState.error
            break
          }

          $countdownStart = Get-Date
        }
      } else {
        Try-HandleCredentialPopup -Username $payload.username -Password $payload.password | Out-Null
      }

      Try-HandleJabilPopup | Out-Null

      if (Test-DesktopReady -Terminal $Terminal) {
        $ready = $true
        break
      }
    }

    if (-not $handledCredential -and -not $ready -and -not $attemptError) {
      $attemptError = 'Credential screen was not detected before timeout'
    }

    $elapsedMs = if ($countdownStart) { [math]::Round(((Get-Date) - $countdownStart).TotalMilliseconds) } else { 0 }
    if ($ready) {
      return @{
        terminal_code = $Terminal.terminal_code
        terminal_label = $Terminal.terminal_label
        status = 'success'
        attempt_count = $attempt
        retry_count = [math]::Max(0, $attempt - 1)
        elapsed_ms = $elapsedMs
        error = $null
        sort_order = $Terminal.sort_order
        process_id = $process.Id
      }
    }

    if (-not $attemptError) {
      $attemptError = "Desktop not detected within $($payload.timeoutMs) ms after credentials were accepted"
    }
    $lastError = $attemptError
    Close-SessionProcess -Process $process
  }

  return @{
    terminal_code = $Terminal.terminal_code
    terminal_label = $Terminal.terminal_label
    status = 'failed'
    attempt_count = $payload.totalAttempts
    retry_count = [math]::Max(0, $payload.totalAttempts - 1)
    elapsed_ms = $elapsedMs
    error = $lastError
    sort_order = $Terminal.sort_order
  }
}

$results = @()
$sessions = @()

foreach ($terminal in $payload.terminals) {
  $result = Launch-Terminal -Terminal $terminal
  $results += $result

  if ($result.status -eq 'success' -and $payload.terminals.Count -gt 1) {
    $sessions += @{
      process = Get-Process -Id $result.process_id -ErrorAction SilentlyContinue
      terminal = $terminal
    }
  }

  if ($result.status -ne 'success') {
    break
  }
}

foreach ($session in $sessions) {
  Logout-Session -Session $session
}

foreach ($terminal in $payload.terminals) {
  try { cmdkey /delete:"TERMSRV/$($terminal.server_address)" 2>$null | Out-Null } catch {}
}

($results | ConvertTo-Json -Compress)
`;
}

function parseMonitorResultOutput(stdout) {
  const text = stdout.trim();
  try {
    return JSON.parse(text);
  } catch (error) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      if ((line.startsWith('{') && line.endsWith('}')) || (line.startsWith('[') && line.endsWith(']'))) {
        try {
          return JSON.parse(line);
        } catch (ignored) {
          // Keep looking for the final JSON payload.
        }
      }
    }

    const arrayStart = text.lastIndexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(text.slice(arrayStart, arrayEnd + 1));
      } catch (ignored) {
        // Fall back to object extraction below.
      }
    }

    const objectStart = text.lastIndexOf('{');
    const objectEnd = text.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      try {
        return JSON.parse(text.slice(objectStart, objectEnd + 1));
      } catch (ignored) {
        // Use a readable monitor error.
      }
    }

    return {
      status: 'error',
      attempt_count: 0,
      elapsed_ms: 0,
      error: text ? `Unable to parse monitor result output: ${text.slice(0, 500)}` : 'Unable to parse monitor result output',
    };
  }
}

async function recordMonitorTerminalHistory({ terminalCode, status, elapsedMs, errorText, attemptCount }) {
  const {
    terminalLabel = null,
    retryCount = Math.max(0, Number(attemptCount || 0) - 1),
    cycleId = null,
    sequenceGroup = null,
    sortOrder = 0,
    sourceFileName = null,
    details = null,
  } = arguments[0];

  await pool.query(
    `INSERT INTO app_support_monitor_terminal_history
      (terminal_code, terminal_label, status, attempt_count, retry_count, elapsed_ms, cycle_id, sequence_group, sort_order, source_file_name, details_json, error_text, run_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
    [terminalCode, terminalLabel, status, attemptCount, retryCount, elapsedMs, cycleId, sequenceGroup, sortOrder, sourceFileName, details, errorText]
  );
}

async function recordMonitorSystemError(errorText, cycleId = null) {
  await recordMonitorTerminalHistory({
    terminalCode: 'MONITOR',
    terminalLabel: 'Monitor',
    status: 'error',
    elapsedMs: 0,
    errorText,
    attemptCount: 0,
    retryCount: 0,
    cycleId,
    sequenceGroup: 'system',
    sortOrder: -1,
    sourceFileName: null,
    details: {
      color: getMonitorStatusColor('error', 0),
      timeoutMs: TERMINAL_MONITOR_TIMEOUT_MS,
    },
  });
}

async function clearMonitorTerminalCredentials(reason = null) {
  terminalMonitorState.active = false;
  terminalMonitorState.credentials = null;
  terminalMonitorState.requiresCredentials = true;
  terminalMonitorState.lastStatus = reason || 'credentials_required';
  terminalMonitorState.lastError = reason || null;
  terminalMonitorState.currentTerminal = null;
  terminalMonitorState.currentPhase = null;
  if (terminalMonitorTimer) {
    clearInterval(terminalMonitorTimer);
    terminalMonitorTimer = null;
  }
}

async function stopMonitorTerminal() {
  terminalMonitorState.active = false;
  terminalMonitorState.lastStatus = 'stopped';
  terminalMonitorState.currentTerminal = null;
  terminalMonitorState.currentPhase = null;
  if (terminalMonitorTimer) {
    clearInterval(terminalMonitorTimer);
    terminalMonitorTimer = null;
  }
}

async function startMonitorTerminal({ username, password }) {
  if (!username || !password) {
    throw new Error('Username and password are required to start the monitor');
  }

  terminalMonitorState.credentials = { username, password };
  terminalMonitorState.requiresCredentials = false;
  terminalMonitorState.active = true;
  terminalMonitorState.lastStartedAt = new Date();
  terminalMonitorState.lastStatus = 'running';
  terminalMonitorState.lastError = null;
  terminalMonitorState.criticalAlert = null;

  if (!terminalMonitorTimer) {
    terminalMonitorTimer = setInterval(runMonitorTerminalCycle, TERMINAL_MONITOR_CYCLE_MS);
  }

  await runMonitorTerminalCycle();
}

async function runMonitorTerminalTask(task, credentials) {
  const preparedTerminals = task.terminals.map((fileRecord, index) => {
    const encodedContent = fs.readFileSync(fileRecord.file_path, 'utf8');
    const serverAddress = validateRdpFileContent(encodedContent);
    return {
      ...fileRecord,
      terminal_label: getMonitorFileHeading(fileRecord.file_name),
      server_address: serverAddress,
      sort_order: index,
    };
  });

  const invalidTerminal = preparedTerminals.find((terminal) => !terminal.server_address || !fs.existsSync(terminal.file_path));
  if (invalidTerminal) {
    return [{
      terminalCode: invalidTerminal.terminal_code,
      terminalLabel: invalidTerminal.terminal_label,
      status: 'error',
      elapsedMs: 0,
      error: invalidTerminal.server_address ? 'RDP file not found on server' : 'Unable to read full address from RDP file',
      attemptCount: 0,
      retryCount: 0,
      sequenceGroup: task.sequenceGroup,
      sortOrder: invalidTerminal.sort_order,
      sourceFileName: invalidTerminal.file_name,
    }];
  }

  const script = buildMonitorTerminalPowershellScript({
    terminals: preparedTerminals,
    username: credentials.username,
    password: credentials.password,
    timeoutMs: TERMINAL_MONITOR_TIMEOUT_MS,
    totalAttempts: TERMINAL_MONITOR_TOTAL_ATTEMPTS,
  });

  const stdout = await new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true, timeout: (TERMINAL_MONITOR_TIMEOUT_MS * preparedTerminals.length) + 90 * 1000 },
      (error, stdoutResult, stderrResult) => {
        if (error) {
          return resolve(stdoutResult || stderrResult || error.message);
        }
        return resolve(stdoutResult);
      }
    );
  });

  const parsed = parseMonitorResultOutput(stdout);
  const results = Array.isArray(parsed) ? parsed : [parsed];
  const normalized = results.map((result, index) => ({
    terminalCode: result.terminal_code || preparedTerminals[index]?.terminal_code || task.key,
    terminalLabel: result.terminal_label || preparedTerminals[index]?.terminal_label || task.combinedLabel || task.key,
    status: result.status || 'error',
    elapsedMs: Number(result.elapsed_ms || 0),
    error: result.error || null,
    attemptCount: Number(result.attempt_count || 0),
    retryCount: Number(result.retry_count || Math.max(0, Number(result.attempt_count || 0) - 1)),
    sequenceGroup: task.sequenceGroup,
    sortOrder: Number(result.sort_order || index),
    sourceFileName: preparedTerminals[index]?.file_name || null,
  }));

  return normalized;
}

async function runMonitorTerminalCycle() {
  if (!terminalMonitorState.active || terminalMonitorState.requiresCredentials || terminalMonitorState.isRunning) {
    return;
  }

  terminalMonitorState.isRunning = true;
  terminalMonitorState.lastRunAt = new Date();
  terminalMonitorState.lastStatus = 'running';
  terminalMonitorState.currentPhase = 'cycle_start';
  terminalMonitorState.lastError = null;

  try {
    await ensureMonitorTables();
    ensureRdpStorageDir();

    const allRdpFiles = await getMonitorRdpFiles();
    if (!allRdpFiles.length) {
      terminalMonitorState.lastStatus = 'idle';
      terminalMonitorState.lastError = 'No RDP terminal files uploaded';
      await recordMonitorSystemError(terminalMonitorState.lastError, createCycleId());
      return;
    }

    const cycleId = createCycleId();
    const rdpFiles = allRdpFiles.map((file) => ({
      ...file,
      terminal_label: getMonitorFileHeading(file.file_name),
    }));
    const executionPlan = buildMonitorExecutionPlan(rdpFiles);
    const runResults = [];
    terminalMonitorState.currentTerminal = 'All terminals';
    terminalMonitorState.currentPhase = 'launching';

    const taskSettledResults = await Promise.all(
      executionPlan.map(async (task) => {
        try {
          return await runMonitorTerminalTask(task, terminalMonitorState.credentials);
        } catch (error) {
          return [{
            terminalCode: task.terminals[0]?.terminal_code || task.key || 'MONITOR',
            terminalLabel: task.terminals[0]?.terminal_label || task.key || 'Monitor',
            status: 'error',
            elapsedMs: 0,
            error: error.message || 'Terminal monitor task failed',
            attemptCount: 0,
            retryCount: 0,
            sequenceGroup: task.sequenceGroup,
            sortOrder: 0,
            sourceFileName: task.terminals[0]?.file_name || null,
          }];
        }
      })
    );

    for (const taskResults of taskSettledResults) {
      for (const result of taskResults) {
        runResults.push(result);
        await recordMonitorTerminalHistory({
          terminalCode: result.terminalCode,
          terminalLabel: result.terminalLabel,
          status: result.status,
          elapsedMs: result.elapsedMs,
          errorText: result.error,
          attemptCount: result.attemptCount,
          retryCount: result.retryCount,
          cycleId,
          sequenceGroup: result.sequenceGroup,
          sortOrder: result.sortOrder,
          sourceFileName: result.sourceFileName,
          details: {
            color: getMonitorStatusColor(result.status, result.elapsedMs),
            timeoutMs: TERMINAL_MONITOR_TIMEOUT_MS,
          },
        });

        if (result.status === 'invalid_credentials') {
          terminalMonitorState.criticalAlert = {
            type: 'invalid_credentials',
            message: 'Invalid credentials popup detected. Monitoring has been stopped.',
            terminal: result.terminalLabel,
            detectedAt: new Date(),
          };
          terminalMonitorState.lastStatus = 'credentials_invalid';
          terminalMonitorState.lastError = 'Invalid credentials provided for monitor terminal opening';
          const emails = await getApplicationSupportEmails();
          if (emails.length > 0) {
            await sendApplicationSupportMonitorAlert(emails, {
              alertTime: new Date().toLocaleString('en-IN', { timeZone: ALERT_TIME_ZONE }),
              status: result.status,
              attemptCount: result.attemptCount,
              elapsedMs: result.elapsedMs,
              message: 'Monitoring stopped because invalid credentials were detected.',
              critical: true,
              results: [result],
            });
          }
          await clearMonitorTerminalCredentials('Invalid credentials detected');
          break;
        }

        if (!['success', 'slow'].includes(result.status)) {
          terminalMonitorState.lastError = result.error || 'Terminal launch failed';
          const emails = await getApplicationSupportEmails();
          if (emails.length > 0) {
            await sendApplicationSupportMonitorAlert(emails, {
              alertTime: new Date().toLocaleString('en-IN', { timeZone: ALERT_TIME_ZONE }),
              status: result.status,
              attemptCount: result.attemptCount,
              elapsedMs: result.elapsedMs,
              message: `${result.terminalLabel}: ${result.error || 'Terminal launch failed'}`,
              results: [result],
            });
          }
        }
      }
    }

    terminalMonitorState.currentTerminal = null;
    terminalMonitorState.currentPhase = null;
    terminalMonitorState.lastRunLogs = runResults.slice(-10);
    terminalMonitorState.lastRunResults = runResults;
    terminalMonitorState.lastCompletedAt = new Date();
    if (terminalMonitorState.active) {
      terminalMonitorState.lastStatus = terminalMonitorState.lastError ? 'completed_with_issues' : 'idle';
    }
  } catch (error) {
    terminalMonitorState.lastStatus = 'error';
    terminalMonitorState.lastError = error.message;
    try {
      await recordMonitorSystemError(error.message, createCycleId());
    } catch (logError) {
      console.error('[APP SUPPORT MONITOR] Failed to write cycle error log:', logError.message);
    }
    console.error('[APP SUPPORT MONITOR] Terminal cycle failed:', error.message);
  } finally {
    terminalMonitorState.currentTerminal = null;
    terminalMonitorState.currentPhase = null;
    terminalMonitorState.isRunning = false;
  }
}

async function saveMonitorRdpFile({ terminalCode, fileName, contentBase64, uploadedBy }) {
  await ensureMonitorTables();
  ensureRdpStorageDir();

  const normalizedTerminalCode = String(terminalCode || inferTerminalCodeFromFileName(fileName) || '').trim().toUpperCase();
  if (!normalizedTerminalCode) {
    throw new Error('Terminal code is required');
  }
  const sanitizedFileName = String(fileName || 'terminal.rdp').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const existing = await pool.query(
    `SELECT id, file_path FROM app_support_monitor_rdp_files WHERE terminal_code = $1 ORDER BY uploaded_at DESC LIMIT 1`,
    [normalizedTerminalCode]
  );
  if (existing.rows.length > 0) {
    const previous = existing.rows[0];
    try {
      if (fs.existsSync(previous.file_path)) {
        fs.unlinkSync(previous.file_path);
      }
    } catch (ignored) {
      // ignore cleanup errors
    }
    await pool.query(`DELETE FROM app_support_monitor_rdp_files WHERE id = $1`, [previous.id]);
  }

  const decoded = Buffer.from(contentBase64, 'base64').toString('utf8');
  validateRdpFileContent(decoded);
  const newFileName = `${normalizedTerminalCode}_${Date.now()}_${sanitizedFileName}`;
  const filePath = path.join(RDP_STORAGE_DIR, newFileName);
  fs.writeFileSync(filePath, decoded, 'utf8');

  const insertResult = await pool.query(
    `INSERT INTO app_support_monitor_rdp_files (terminal_code, file_name, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, terminal_code, file_name, file_path, uploaded_by, uploaded_at`,
    [normalizedTerminalCode, sanitizedFileName, filePath, uploadedBy]
  );

  await clearMonitorTerminalCredentials('RDP file updated, enter credentials again');
  return insertResult.rows[0];
}

async function deleteMonitorRdpFile(id) {
  await ensureMonitorTables();
  const result = await pool.query(
    `SELECT file_path FROM app_support_monitor_rdp_files WHERE id = $1`,
    [id]
  );
  if (!result.rows.length) {
    throw new Error('RDP file not found');
  }
  const filePath = result.rows[0].file_path;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (ignored) {
    // ignore cleanup errors
  }
  await pool.query(`DELETE FROM app_support_monitor_rdp_files WHERE id = $1`, [id]);
  await clearMonitorTerminalCredentials('RDP file deleted, enter credentials again');
}

async function getMonitorTerminalLogs(limit = 50) {
  await ensureMonitorTables();
  const result = await pool.query(
    `SELECT id, terminal_code, terminal_label, status, attempt_count, retry_count, elapsed_ms, cycle_id, sequence_group, sort_order, source_file_name, details_json, error_text, run_at
     FROM app_support_monitor_terminal_history
     ORDER BY run_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map(normalizeMonitorLog);
}

function buildMonitorTerminalSummary(files, logs) {
  const summaryByCode = new Map();
  const orderedLogs = [...logs].sort((a, b) => new Date(b.run_at).getTime() - new Date(a.run_at).getTime());

  files.forEach((file) => {
      summaryByCode.set(file.terminal_code, {
        terminalCode: file.terminal_code,
        terminalLabel: getMonitorFileHeading(file.file_name),
        currentLaunchSeconds: 0,
        averageLaunchSeconds: 0,
        retryCount: 0,
        lastStatus: terminalMonitorState.currentTerminal === getMonitorFileHeading(file.file_name) ? 'launching' : 'idle',
        statusColor: 'blue',
        sourceFileName: file.file_name,
        lastRunAt: null,
      });
  });

  for (const log of orderedLogs) {
    if (!summaryByCode.has(log.terminal_code)) {
      summaryByCode.set(log.terminal_code, {
        terminalCode: log.terminal_code,
        terminalLabel: log.terminal_label || log.terminal_code,
        sourceFileName: log.source_file_name || log.terminal_label || log.terminal_code,
      });
    }
    const item = summaryByCode.get(log.terminal_code);
    const terminalLogs = logs.filter((entry) => entry.terminal_code === log.terminal_code && ['success', 'slow'].includes(entry.status));
    const latest = orderedLogs.find((entry) => entry.terminal_code === log.terminal_code);
    item.currentLaunchSeconds = latest ? Math.round((latest.elapsed_ms / 1000) * 10) / 10 : 0;
    item.averageLaunchSeconds = terminalLogs.length
      ? Math.round(((terminalLogs.reduce((sum, entry) => sum + entry.elapsed_ms, 0) / terminalLogs.length) / 1000) * 10) / 10
      : 0;
    item.retryCount = latest ? Number(latest.retry_count || 0) : 0;
    item.lastStatus = latest ? latest.status : item.lastStatus;
    item.statusColor = getMonitorStatusColor(item.lastStatus, latest?.elapsed_ms || 0);
    item.lastRunAt = latest?.run_at || null;
  }

  return Array.from(summaryByCode.values()).sort((a, b) => a.terminalLabel.localeCompare(b.terminalLabel));
}

async function getMonitorTerminalStatus() {
  await ensureMonitorTables();
  const files = await getMonitorRdpFiles();
  const logs = await getMonitorTerminalLogs(300);
  return {
    active: terminalMonitorState.active,
    requiresCredentials: terminalMonitorState.requiresCredentials,
    lastStartedAt: terminalMonitorState.lastStartedAt,
    lastRunAt: terminalMonitorState.lastRunAt,
    lastCompletedAt: terminalMonitorState.lastCompletedAt,
    lastStatus: terminalMonitorState.lastStatus,
    lastError: terminalMonitorState.lastError,
    currentTerminal: terminalMonitorState.currentTerminal,
    currentPhase: terminalMonitorState.currentPhase,
    criticalAlert: terminalMonitorState.criticalAlert,
    terminals: buildMonitorTerminalSummary(files, logs),
    files,
  };
}

async function getMonitorTerminalData() {
  return {
    status: await getMonitorTerminalStatus(),
    logs: await getMonitorTerminalLogs(50),
  };
}

function buildServerPerformancePowershellScript({ servers, username, password, timeoutMs, totalAttempts }) {
  const payload = JSON.stringify({
    servers: servers.map((server, index) => ({
      server_name: server.server_name,
      terminal_code: server.terminal_code,
      terminal_label: server.terminal_label,
      sort_order: index,
    })),
    username,
    password,
    timeoutMs,
    totalAttempts,
    credentialAcceptWaitMs: 8000,
    securityPatterns: ['Windows Security', 'Remote Desktop Connection', 'Enter your credentials'],
    invalidPatterns: ['invalid credentials', 'credentials did not work', 'logon attempt failed', 'access denied', 'denied'],
  }).replace(/'/g, "''");

  return `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$payload = ConvertFrom-Json @'
${payload}
'@
$shell = New-Object -ComObject WScript.Shell

function Get-WindowTitles {
  return Get-Process |
    Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Trim().Length -gt 0 } |
    Select-Object -ExpandProperty MainWindowTitle
}

function Matches-Pattern {
  param(
    [string[]]$Titles,
    [string[]]$Patterns
  )

  foreach ($title in $Titles) {
    foreach ($pattern in $Patterns) {
      if ($title -and $title.ToLower().Contains($pattern.ToLower())) {
        return $title
      }
    }
  }
  return $null
}

function Activate-WindowLike {
  param([string[]]$Patterns)

  $titles = Get-WindowTitles
  $title = Matches-Pattern -Titles $titles -Patterns $Patterns
  if ($title) {
    try {
      return $shell.AppActivate($title)
    } catch {
      return $false
    }
  }
  return $false
}

function Get-WindowText {
  param([string[]]$Patterns)

  $processes = Get-Process | Where-Object { $_.MainWindowHandle -and $_.MainWindowTitle }
  foreach ($proc in $processes) {
    $matched = $false
    foreach ($pattern in $Patterns) {
      if ($proc.MainWindowTitle.ToLower().Contains($pattern.ToLower())) {
        $matched = $true
        break
      }
    }
    if (-not $matched) { continue }

    try {
      $element = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
      $condition = New-Object System.Windows.Automation.PropertyCondition -ArgumentList (
        [System.Windows.Automation.AutomationElement]::IsControlElementProperty,
        $true
      )
      $children = $element.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
      $parts = @($proc.MainWindowTitle)
      foreach ($child in $children) {
        $name = $child.Current.Name
        if ($name -and $name.Trim().Length -gt 0) {
          $parts += $name.Trim()
        }
      }
      return ($parts | Select-Object -Unique) -join ' '
    } catch {
      return $proc.MainWindowTitle
    }
  }

  return $null
}

function Test-InvalidCredentials {
  $titles = Get-WindowTitles
  return [bool](Matches-Pattern -Titles $titles -Patterns $payload.invalidPatterns)
}

function Try-HandleCredentialPopup {
  param($Username, $Password)

  if (Activate-WindowLike -Patterns $payload.securityPatterns) {
    Start-Sleep -Milliseconds 350
    $shell.SendKeys('^a')
    Start-Sleep -Milliseconds 100
    $shell.SendKeys($Username)
    Start-Sleep -Milliseconds 100
    $shell.SendKeys('{TAB}')
    Start-Sleep -Milliseconds 100
    $shell.SendKeys($Password)
    Start-Sleep -Milliseconds 100
    $shell.SendKeys('{ENTER}')
    return $true
  }
  return $false
}

function Wait-CredentialAccepted {
  param($StartedAt)

  $deadline = (Get-Date).AddMilliseconds($payload.credentialAcceptWaitMs)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 350

    if (Test-InvalidCredentials) {
      return @{
        status = 'invalid_credentials'
        error = 'Invalid credentials popup detected'
      }
    }

    $titles = Get-WindowTitles
    if (-not (Matches-Pattern -Titles $titles -Patterns $payload.securityPatterns)) {
      return @{
        status = 'accepted'
        error = $null
      }
    }

    if ((Get-Date) -ge $StartedAt.AddMilliseconds($payload.timeoutMs)) {
      return @{
        status = 'failed'
        error = 'Credential dialog did not complete before timeout'
      }
    }
  }

  return @{
    status = 'failed'
    error = 'Credential dialog stayed open after password entry'
  }
}

function Handle-ServerPopup {
  $popupText = Get-WindowText -Patterns @('Remote Desktop Connection')
  if (-not $popupText) {
    return $null
  }

  $cleanText = ($popupText -replace '\\s+', ' ').Trim()
  $cleanText = ($cleanText -replace '^Remote Desktop Connection\\s*', '').Trim()
  $cleanText = ($cleanText -replace '\\s+OK$', '').Trim()
  $lower = $cleanText.ToLower()
  if (
    $lower.Contains('enter your credentials') -or
    $lower.Contains('windows security') -or
    $lower.Contains('password')
  ) {
    return $null
  }

  Activate-WindowLike -Patterns @('Remote Desktop Connection') | Out-Null
  Start-Sleep -Milliseconds 200
  $shell.SendKeys('{ENTER}')

  $isFatal = (
    $lower.Contains('digital signature') -or
    $lower.Contains('cannot be verified') -or
    $lower.Contains('remote connection cannot be started') -or
    $lower.Contains('an internal error has occurred') -or
    $lower.Contains('because of a protocol error') -or
    $lower.Contains('your computer could not connect') -or
    $lower.Contains('this computer can') -or
    $lower.Contains('failed to connect')
  )

  return @{
    fatal = $isFatal
    message = $cleanText
  }
}

function Test-ServerDesktopReady {
  param($Server)

  $titles = Get-WindowTitles
  foreach ($title in $titles) {
    if (
      $title -and
      $title.ToLower().Contains($Server.server_name.ToLower()) -and
      -not (Matches-Pattern -Titles @($title) -Patterns $payload.securityPatterns) -and
      -not $title.ToLower().Contains('remote desktop connection')
    ) {
      return $true
    }
  }

  return $false
}

function Close-SessionProcess {
  param($Process)

  try {
    if ($Process -and -not $Process.HasExited) {
      Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
  } catch {}
}

function Launch-Server {
  param($Server)

  $lastError = $null
  $elapsedMs = 0

  for ($attempt = 1; $attempt -le $payload.totalAttempts; $attempt++) {
    $attemptError = $null
    try { cmdkey /generic:"TERMSRV/$($Server.server_name)" /user:$($payload.username) /pass:$($payload.password) 2>$null | Out-Null } catch {}

    $process = Start-Process -FilePath 'mstsc.exe' -ArgumentList @("/v:$($Server.server_name)") -PassThru -WindowStyle Normal
    $start = Get-Date
    $countdownStart = $null
    $ready = $false
    $handledCredential = $false

    while ((Get-Date) -lt $start.AddMilliseconds($payload.timeoutMs)) {
      Start-Sleep -Milliseconds 600
      try { $process.Refresh() } catch {}

      if (Test-InvalidCredentials) {
        Close-SessionProcess -Process $process
        return @{
          server_name = $Server.server_name
          terminal_code = $Server.terminal_code
          terminal_label = $Server.terminal_label
          status = 'invalid_credentials'
          attempt_count = $attempt
          retry_count = [math]::Max(0, $attempt - 1)
          elapsed_ms = 0
          error = 'Invalid credentials popup detected'
          sort_order = $Server.sort_order
        }
      }

      if (-not $handledCredential) {
        $handledCredential = Try-HandleCredentialPopup -Username $payload.username -Password $payload.password
        if ($handledCredential) {
          $credentialState = Wait-CredentialAccepted -StartedAt $start
          if ($credentialState.status -eq 'invalid_credentials') {
            Close-SessionProcess -Process $process
            return @{
              server_name = $Server.server_name
              terminal_code = $Server.terminal_code
              terminal_label = $Server.terminal_label
              status = 'invalid_credentials'
              attempt_count = $attempt
              retry_count = [math]::Max(0, $attempt - 1)
              elapsed_ms = 0
              error = $credentialState.error
              sort_order = $Server.sort_order
            }
          }

          if ($credentialState.status -ne 'accepted') {
            $attemptError = $credentialState.error
            break
          }

          $countdownStart = Get-Date
        }
      }

      $popupState = Handle-ServerPopup
      if ($popupState) {
        if ($popupState.fatal) {
          $attemptError = $popupState.message
          Close-SessionProcess -Process $process
          break
        }
        Start-Sleep -Milliseconds 400
      }

      if (Test-ServerDesktopReady -Server $Server) {
        $ready = $true
        break
      }
    }

    if (-not $handledCredential -and -not $ready -and -not $attemptError) {
      $attemptError = 'Credential screen was not detected before timeout'
    }

    $elapsedMs = if ($countdownStart) { [math]::Round(((Get-Date) - $countdownStart).TotalMilliseconds) } else { 0 }
    if ($ready) {
      Close-SessionProcess -Process $process
      return @{
        server_name = $Server.server_name
        terminal_code = $Server.terminal_code
        terminal_label = $Server.terminal_label
        status = 'success'
        attempt_count = $attempt
        retry_count = [math]::Max(0, $attempt - 1)
        elapsed_ms = $elapsedMs
        error = $null
        sort_order = $Server.sort_order
      }
    }

    if (-not $attemptError) {
      $attemptError = "Desktop not detected within $($payload.timeoutMs) ms after credentials were accepted"
    }
    $lastError = $attemptError
    Close-SessionProcess -Process $process
  }

  return @{
    server_name = $Server.server_name
    terminal_code = $Server.terminal_code
    terminal_label = $Server.terminal_label
    status = 'failed'
    attempt_count = $payload.totalAttempts
    retry_count = [math]::Max(0, $payload.totalAttempts - 1)
    elapsed_ms = $elapsedMs
    error = $lastError
    sort_order = $Server.sort_order
  }
}

$results = @()
foreach ($server in $payload.servers) {
  $results += (Launch-Server -Server $server)
}
foreach ($server in $payload.servers) {
  try { cmdkey /delete:"TERMSRV/$($server.server_name)" 2>$null | Out-Null } catch {}
}
($results | ConvertTo-Json -Compress)
`;
}

async function getApplicationSupportServersForPerformance() {
  await ensureApplicationSupportTables();
  const result = await pool.query(
    `SELECT s.id,
            s.name AS server_name,
            t.code AS terminal_code,
            t.name AS terminal_label
     FROM app_support_servers s
     JOIN app_support_terminals t ON t.id = s.terminal_id
     WHERE s.is_active = TRUE
       AND t.is_active = TRUE
       AND UPPER(s.name) LIKE 'INRJNM0RDSH%'
     ORDER BY t.code, s.name`
  );
  return result.rows;
}

async function recordServerPerformanceHistory({
  serverName,
  terminalCode = null,
  terminalLabel = null,
  status,
  elapsedMs,
  errorText,
  attemptCount,
  retryCount = Math.max(0, Number(attemptCount || 0) - 1),
  cycleId = null,
  sortOrder = 0,
  details = null,
}) {
  await pool.query(
    `INSERT INTO app_support_server_performance_history
      (server_name, terminal_code, terminal_label, status, attempt_count, retry_count, elapsed_ms, cycle_id, sort_order, details_json, error_text, run_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
    [serverName, terminalCode, terminalLabel, status, attemptCount, retryCount, elapsedMs, cycleId, sortOrder, details, errorText]
  );
}

async function recordServerPerformanceSystemError(errorText, cycleId = null) {
  await recordServerPerformanceHistory({
    serverName: 'MONITOR',
    terminalLabel: 'Monitor',
    status: 'error',
    elapsedMs: 0,
    errorText,
    attemptCount: 0,
    retryCount: 0,
    cycleId,
    sortOrder: -1,
    details: {
      color: getServerPerformanceStatusColor('error', 0),
      timeoutMs: SERVER_PERFORMANCE_TIMEOUT_MS,
    },
  });
}

async function clearServerPerformanceCredentials(reason = null) {
  serverPerformanceState.active = false;
  serverPerformanceState.credentials = null;
  serverPerformanceState.requiresCredentials = true;
  serverPerformanceState.lastStatus = reason || 'credentials_required';
  serverPerformanceState.lastError = reason || null;
  serverPerformanceState.currentServer = null;
  serverPerformanceState.currentPhase = null;
  if (serverPerformanceTimer) {
    clearInterval(serverPerformanceTimer);
    serverPerformanceTimer = null;
  }
}

async function stopServerPerformanceMonitor() {
  serverPerformanceState.active = false;
  serverPerformanceState.lastStatus = 'stopped';
  serverPerformanceState.currentServer = null;
  serverPerformanceState.currentPhase = null;
  if (serverPerformanceTimer) {
    clearInterval(serverPerformanceTimer);
    serverPerformanceTimer = null;
  }
}

async function startServerPerformanceMonitor({ username, password }) {
  if (!username || !password) {
    throw new Error('Username and password are required to start server performance monitoring');
  }

  serverPerformanceState.credentials = { username, password };
  serverPerformanceState.requiresCredentials = false;
  serverPerformanceState.active = true;
  serverPerformanceState.lastStartedAt = new Date();
  serverPerformanceState.lastStatus = 'running';
  serverPerformanceState.lastError = null;
  serverPerformanceState.criticalAlert = null;

  if (!serverPerformanceTimer) {
    serverPerformanceTimer = setInterval(runServerPerformanceCycle, SERVER_PERFORMANCE_CYCLE_MS);
  }

  await runServerPerformanceCycle();
}

async function runServerPerformanceCycle() {
  if (!serverPerformanceState.active || serverPerformanceState.requiresCredentials || serverPerformanceState.isRunning) {
    return;
  }

  serverPerformanceState.isRunning = true;
  serverPerformanceState.lastRunAt = new Date();
  serverPerformanceState.lastStatus = 'running';
  serverPerformanceState.currentPhase = 'cycle_start';
  serverPerformanceState.lastError = null;

  try {
    await ensureMonitorTables();
    const servers = await getApplicationSupportServersForPerformance();
    if (!servers.length) {
      serverPerformanceState.lastStatus = 'idle';
      serverPerformanceState.lastError = 'No active servers configured';
      await recordServerPerformanceSystemError(serverPerformanceState.lastError, createCycleId());
      return;
    }

    const cycleId = createCycleId();
    serverPerformanceState.currentServer = 'All servers';
    serverPerformanceState.currentPhase = 'launching';

    const script = buildServerPerformancePowershellScript({
      servers: servers.map((server, index) => ({
        ...server,
        sort_order: index,
      })),
      username: serverPerformanceState.credentials.username,
      password: serverPerformanceState.credentials.password,
      timeoutMs: SERVER_PERFORMANCE_TIMEOUT_MS,
      totalAttempts: SERVER_PERFORMANCE_TOTAL_ATTEMPTS,
    });

    const stdout = await new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { windowsHide: true, timeout: (SERVER_PERFORMANCE_TIMEOUT_MS * servers.length) + (90 * 1000) },
        (error, stdoutResult, stderrResult) => {
          if (error) {
            return resolve(stdoutResult || stderrResult || error.message);
          }
          return resolve(stdoutResult);
        }
      );
    });

    const parsed = parseMonitorResultOutput(stdout);
    const results = Array.isArray(parsed) ? parsed : [parsed];
    const normalized = results.map((result, index) => ({
      serverName: result.server_name || servers[index]?.server_name || 'Unknown server',
      terminalCode: result.terminal_code || servers[index]?.terminal_code || null,
      terminalLabel: result.terminal_label || servers[index]?.terminal_label || servers[index]?.terminal_code || null,
      status: result.status || 'error',
      elapsedMs: Number(result.elapsed_ms || 0),
      error: result.error || null,
      attemptCount: Number(result.attempt_count || 0),
      retryCount: Number(result.retry_count || Math.max(0, Number(result.attempt_count || 0) - 1)),
      sortOrder: Number(result.sort_order || index),
    }));

    for (const result of normalized) {
      await recordServerPerformanceHistory({
        serverName: result.serverName,
        terminalCode: result.terminalCode,
        terminalLabel: result.terminalLabel,
        status: result.status,
        elapsedMs: result.elapsedMs,
        errorText: result.error,
        attemptCount: result.attemptCount,
        retryCount: result.retryCount,
        cycleId,
        sortOrder: result.sortOrder,
        details: {
          color: getServerPerformanceStatusColor(result.status, result.elapsedMs),
          timeoutMs: SERVER_PERFORMANCE_TIMEOUT_MS,
        },
      });

      if (result.status === 'invalid_credentials') {
        serverPerformanceState.criticalAlert = {
          type: 'invalid_credentials',
          message: 'Invalid credentials popup detected. Server performance monitoring has been stopped.',
          server: result.serverName,
          detectedAt: new Date(),
        };
        serverPerformanceState.lastStatus = 'credentials_invalid';
        serverPerformanceState.lastError = 'Invalid credentials provided for server performance monitoring';
        await clearServerPerformanceCredentials('Invalid credentials detected');
        break;
      }

      if (!['success', 'slow'].includes(result.status)) {
        serverPerformanceState.lastError = result.error || 'Server desktop launch failed';
      }
    }

    serverPerformanceState.lastRunLogs = normalized.slice(-10);
    serverPerformanceState.lastRunResults = normalized;
    serverPerformanceState.lastCompletedAt = new Date();
    if (serverPerformanceState.active) {
      serverPerformanceState.lastStatus = serverPerformanceState.lastError ? 'completed_with_issues' : 'idle';
    }
  } catch (error) {
    serverPerformanceState.lastStatus = 'error';
    serverPerformanceState.lastError = error.message;
    try {
      await recordServerPerformanceSystemError(error.message, createCycleId());
    } catch (logError) {
      console.error('[APP SUPPORT SERVER PERFORMANCE] Failed to write cycle error log:', logError.message);
    }
    console.error('[APP SUPPORT SERVER PERFORMANCE] Cycle failed:', error.message);
  } finally {
    serverPerformanceState.currentServer = null;
    serverPerformanceState.currentPhase = null;
    serverPerformanceState.isRunning = false;
  }
}

async function runServerPerformanceNow() {
  if (!serverPerformanceState.active || serverPerformanceState.requiresCredentials) {
    throw new Error('Enter credentials and start server performance monitoring first');
  }
  await runServerPerformanceCycle();
}

async function getServerPerformanceLogs(limit = 100) {
  await ensureMonitorTables();
  const result = await pool.query(
    `SELECT id, server_name, terminal_code, terminal_label, status, attempt_count, retry_count, elapsed_ms, cycle_id, sort_order, details_json, error_text, run_at
     FROM app_support_server_performance_history
     ORDER BY run_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows.map((row) => ({
    ...row,
    attempt_count: Number(row.attempt_count || 0),
    retry_count: Number(row.retry_count || 0),
    elapsed_ms: Number(row.elapsed_ms || 0),
    details_json: row.details_json || null,
  }));
}

function buildServerPerformanceSummary(servers, logs) {
  const summaryByName = new Map();
  const orderedLogs = [...logs].sort((a, b) => new Date(b.run_at).getTime() - new Date(a.run_at).getTime());

  servers.forEach((server) => {
    summaryByName.set(server.server_name, {
      serverName: server.server_name,
      terminalCode: server.terminal_code,
      terminalLabel: server.terminal_label || server.terminal_code || server.server_name,
      currentLaunchSeconds: 0,
      averageLaunchSeconds: 0,
      retryCount: 0,
      lastStatus: serverPerformanceState.currentServer === server.server_name ? 'launching' : 'idle',
      statusColor: 'blue',
      lastRunAt: null,
    });
  });

  for (const log of orderedLogs) {
    if (!summaryByName.has(log.server_name)) {
      summaryByName.set(log.server_name, {
        serverName: log.server_name,
        terminalCode: log.terminal_code,
        terminalLabel: log.terminal_label || log.terminal_code || log.server_name,
        currentLaunchSeconds: 0,
        averageLaunchSeconds: 0,
        retryCount: 0,
        lastStatus: 'idle',
        statusColor: 'blue',
        lastRunAt: null,
      });
    }

    const item = summaryByName.get(log.server_name);
    const serverLogs = logs.filter((entry) => entry.server_name === log.server_name && ['success', 'slow'].includes(entry.status));
    const latest = orderedLogs.find((entry) => entry.server_name === log.server_name);
    item.currentLaunchSeconds = latest ? Math.round((latest.elapsed_ms / 1000) * 10) / 10 : 0;
    item.averageLaunchSeconds = serverLogs.length
      ? Math.round(((serverLogs.reduce((sum, entry) => sum + entry.elapsed_ms, 0) / serverLogs.length) / 1000) * 10) / 10
      : 0;
    item.retryCount = latest ? Number(latest.retry_count || 0) : 0;
    item.lastStatus = latest ? latest.status : item.lastStatus;
    item.statusColor = getServerPerformanceStatusColor(item.lastStatus, latest?.elapsed_ms || 0);
    item.lastRunAt = latest?.run_at || null;
  }

  return Array.from(summaryByName.values()).sort((a, b) => a.serverName.localeCompare(b.serverName));
}

async function getServerPerformanceStatus() {
  await ensureMonitorTables();
  const servers = await getApplicationSupportServersForPerformance();
  const logs = await getServerPerformanceLogs(500);
  return {
    active: serverPerformanceState.active,
    requiresCredentials: serverPerformanceState.requiresCredentials,
    lastStartedAt: serverPerformanceState.lastStartedAt,
    lastRunAt: serverPerformanceState.lastRunAt,
    lastCompletedAt: serverPerformanceState.lastCompletedAt,
    lastStatus: serverPerformanceState.lastStatus,
    lastError: serverPerformanceState.lastError,
    currentServer: serverPerformanceState.currentServer,
    currentPhase: serverPerformanceState.currentPhase,
    criticalAlert: serverPerformanceState.criticalAlert,
    intervalMs: SERVER_PERFORMANCE_CYCLE_MS,
    servers: buildServerPerformanceSummary(servers, logs),
  };
}

async function seedApplicationSupportDefaults() {
  await ensureApplicationSupportTables();

  for (const terminal of terminalDefaults) {
    const terminalResult = await pool.query(
      `INSERT INTO app_support_terminals (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [terminal.code, terminal.name, `${terminal.name} terminal group`]
    );

    const terminalId = terminalResult.rows[0].id;
    for (const serverName of terminal.servers) {
      await pool.query(
        `INSERT INTO app_support_servers (terminal_id, name, max_users)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [terminalId, serverName, SERVER_USER_LIMIT]
      );
    }
  }
}

function parseActiveUsers(output) {
  if (!output) return 0;

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^USERNAME\s+/i.test(line))
    .filter((line) => /\bActive\b/i.test(line))
    .length;
}

function queryServerActiveUsers(serverName) {
  return new Promise((resolve) => {
    execFile('quser', [`/server:${serverName}`], { timeout: 15000, windowsHide: true }, (error, stdout, stderr) => {
      if (!error) {
        resolve({
          activeUsers: parseActiveUsers(stdout),
          status: 'online',
          error: null,
        });
        return;
      }

      execFile('query', ['user', `/server:${serverName}`], { timeout: 15000, windowsHide: true }, (fallbackError, fallbackStdout, fallbackStderr) => {
        if (!fallbackError) {
          resolve({
            activeUsers: parseActiveUsers(fallbackStdout),
            status: 'online',
            error: null,
          });
          return;
        }

        resolve({
          activeUsers: 0,
          status: 'unreachable',
          error: (fallbackStderr || stderr || fallbackError.message || error.message || 'Failed to query server').trim(),
        });
      });
    });
  });
}

async function pollApplicationSupportServers() {
  if (monitorRunning) return;
  monitorRunning = true;

  try {
    await ensureApplicationSupportTables();
    const result = await pool.query(
      `SELECT s.id, s.name, t.code as terminal_code
       FROM app_support_servers s
       JOIN app_support_terminals t ON s.terminal_id = t.id
       WHERE s.is_active = TRUE ORDER BY s.id`
    );

    for (const server of result.rows) {
      const status = await queryServerActiveUsers(server.name);
      await pool.query(
        `UPDATE app_support_servers
         SET active_users = $1,
             status = $2,
             last_error = $3,
             last_checked_at = NOW(),
             updated_at = NOW()
         WHERE id = $4`,
        [status.activeUsers, status.status, status.error, server.id]
      );

      // Insert historical data
      await pool.query(
        `INSERT INTO app_support_terminal_history (terminal_code, server_name, active_users, status, recorded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [server.terminal_code, server.name, status.activeUsers, status.status]
      );
    }

    // Clean up old history data (keep last 7 days)
    await pool.query(
      `DELETE FROM app_support_terminal_history WHERE recorded_at < NOW() - INTERVAL '7 days'`
    );
    await checkTerminalLoadNotifications();
  } catch (error) {
    console.error('[APP SUPPORT MONITOR] Poll failed:', error.message);
  } finally {
    monitorRunning = false;
  }
}

function formatAlertTime(date) {
  return date.toLocaleString('en-IN', {
    timeZone: ALERT_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

function getAlertDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ALERT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  return parts.reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = Number(part.value);
    }
    return acc;
  }, {});
}

function getAlertKey(parts) {
  const year = parts.year;
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

async function getApplicationSupportEmails() {
  const result = await pool.query(
    `SELECT email
     FROM users
     WHERE status = 'active'
       AND email IS NOT NULL
     ORDER BY email`
  );

  return result.rows.map((row) => row.email).filter(Boolean);
}

async function getTerminalAlertStates() {
  const result = await pool.query(
    `SELECT terminal_id, terminal_code, is_overloaded
     FROM app_support_terminal_alert_state`
  );

  const stateMap = new Map();
  result.rows.forEach((row) => {
    stateMap.set(Number(row.terminal_id), {
      terminal_code: row.terminal_code,
      is_overloaded: row.is_overloaded,
    });
  });

  return stateMap;
}

async function upsertTerminalAlertState(terminalId, terminalCode, isOverloaded) {
  await pool.query(
    `INSERT INTO app_support_terminal_alert_state (terminal_id, terminal_code, is_overloaded, last_changed_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (terminal_id) DO UPDATE
     SET is_overloaded = EXCLUDED.is_overloaded,
         last_changed_at = CASE WHEN app_support_terminal_alert_state.is_overloaded <> EXCLUDED.is_overloaded THEN NOW() ELSE app_support_terminal_alert_state.last_changed_at END,
         updated_at = NOW()`,
    [terminalId, terminalCode, isOverloaded]
  );
}

async function getAllTerminalTotals() {
  const result = await pool.query(
    `SELECT t.id AS terminal_id,
            t.code AS terminal_code,
            t.name AS terminal_name,
            COALESCE(SUM(s.active_users), 0)::int AS total_users
     FROM app_support_terminals t
     LEFT JOIN app_support_servers s ON s.terminal_id = t.id AND s.is_active = TRUE
     WHERE t.is_active = TRUE
     GROUP BY t.id, t.code, t.name
     ORDER BY t.code`
  );

  return result.rows;
}

async function checkTerminalLoadNotifications() {
  try {
    await ensureApplicationSupportTables();
    const emails = await getApplicationSupportEmails();
    if (emails.length === 0) {
      return;
    }

    const states = await getTerminalAlertStates();
    const totals = await getAllTerminalTotals();
    const hotTerminals = await getHotTerminalLoadDetails();
    const hotTerminalIds = new Set(hotTerminals.map((terminal) => terminal.terminal_id));

    const newlyOverloadedIds = new Set();
    const recoveredTerminals = [];

    for (const terminal of totals) {
      const currentOverloaded = hotTerminalIds.has(terminal.terminal_id);
      const state = states.get(Number(terminal.terminal_id));
      const previousOverloaded = state?.is_overloaded || false;

      if (currentOverloaded && !previousOverloaded) {
        newlyOverloadedIds.add(terminal.terminal_id);
      }

      if (!currentOverloaded && previousOverloaded) {
        recoveredTerminals.push({
          code: terminal.terminal_code,
          name: terminal.terminal_name,
          total_users: terminal.total_users,
        });
      }

      await upsertTerminalAlertState(terminal.terminal_id, terminal.terminal_code, currentOverloaded);
    }

    if (newlyOverloadedIds.size > 0) {
      const newlyOverloaded = hotTerminals.filter((t) => newlyOverloadedIds.has(t.terminal_id));
      if (newlyOverloaded.length > 0) {
        await sendApplicationSupportTerminalLoadAlert(emails, {
          alertTime: formatAlertTime(new Date()),
          terminals: newlyOverloaded,
          totalUsers: newlyOverloaded.reduce((sum, terminal) => sum + terminal.total_users, 0),
        });
      }
    }

    if (recoveredTerminals.length > 0) {
      await sendApplicationSupportTerminalRecoveryAlert(emails, {
        recoveryTime: formatAlertTime(new Date()),
        terminals: recoveredTerminals,
      });
    }
  } catch (error) {
    console.error('[APP SUPPORT ALERT] Terminal load notification failed:', error.message);
  }
}

async function getHotTerminalLoadDetails() {
  const result = await pool.query(
    `SELECT t.id AS terminal_id,
            t.code AS terminal_code,
            t.name AS terminal_name,
            s.name AS server_name,
            s.active_users,
            s.status
     FROM app_support_terminals t
     JOIN app_support_servers s ON s.terminal_id = t.id
     WHERE t.is_active = TRUE
       AND s.is_active = TRUE
     ORDER BY t.code, s.name`
  );

  const terminalsById = new Map();
  for (const row of result.rows) {
    if (!terminalsById.has(row.terminal_id)) {
      terminalsById.set(row.terminal_id, {
        code: row.terminal_code,
        name: row.terminal_name,
        total_users: 0,
        servers: [],
      });
    }

    const terminal = terminalsById.get(row.terminal_id);
    const activeUsers = Number(row.active_users || 0);
    terminal.total_users += activeUsers;
    terminal.servers.push({
      name: row.server_name,
      active_users: activeUsers,
      status: row.status || 'unknown',
    });
  }

  return Array.from(terminalsById.values())
    .filter((terminal) => terminal.servers.some((server) => Number(server.active_users || 0) >= TERMINAL_ALERT_THRESHOLD))
    .map((terminal) => ({
      ...terminal,
      servers: terminal.servers.sort((a, b) => b.active_users - a.active_users || a.name.localeCompare(b.name)),
    }));
}

async function sendScheduledTerminalLoadAlert() {
  try {
    await ensureApplicationSupportTables();

    const hotTerminals = await getHotTerminalLoadDetails();
    if (hotTerminals.length === 0) {
      return;
    }

    const emails = await getApplicationSupportEmails();
    if (emails.length === 0) {
      console.warn('[APP SUPPORT ALERT] No active application support users found for terminal load alert');
      return;
    }

    const now = new Date();
    await sendApplicationSupportTerminalLoadAlert(emails, {
      alertTime: formatAlertTime(now),
      terminals: hotTerminals,
      totalUsers: hotTerminals.reduce((sum, terminal) => sum + terminal.total_users, 0),
    });
  } catch (error) {
    console.error('[APP SUPPORT ALERT] Terminal load alert failed:', error.message);
  }
}

function checkScheduledTerminalLoadAlert() {
  const now = new Date();
  const dateParts = getAlertDateParts(now);
  const isScheduledHour = ALERT_HOURS.includes(dateParts.hour);
  if (!isScheduledHour || dateParts.minute !== 0) {
    return;
  }

  const alertKey = getAlertKey(dateParts);
  if (lastTerminalLoadAlertKey === alertKey) {
    return;
  }

  lastTerminalLoadAlertKey = alertKey;
  sendScheduledTerminalLoadAlert();
}

const runPowerShellCommand = (args, options = {}) => new Promise((resolve, reject) => {
  execFile('powershell.exe', args, { timeout: 15 * 60 * 1000, windowsHide: true, ...options }, (error, stdout, stderr) => {
    if (error) {
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
      return;
    }
    resolve({ stdout, stderr });
  });
});

const parseQueryUserOutput = (output) => {
  const lines = String(output || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }
  return lines.slice(1).map((line) => line.split(/\s+/)[0]).filter(Boolean);
};

const buildCleanupPowerShellScript = ({ excludedProfiles }) => {
  const quotedExcludes = (Array.isArray(excludedProfiles) ? excludedProfiles : []).map((profile) => profile.toString().replace(/"/g, '`"'));
  const filterActiveScript = quotedExcludes.length > 0
    ? `$excluded = @(${quotedExcludes.map((name) => `"${name}"`).join(',')})`
    : '$excluded = @()';

  return `
    $delProf2 = 'C:\\Tools\\DelProf2.exe'
    if (-not (Test-Path $delProf2)) {
      throw 'DelProf2.exe not found at ' + $delProf2;
    }

    ${filterActiveScript}
    $excluded += @('Administrator','Default','Public','Default User','All Users','WDAGUtilityAccount','DefaultAppPool','DefaultAccount')
    $excluded = $excluded | Sort-Object -Unique

    $profiles = Get-ChildItem 'C:\\Users' -Directory | Where-Object {
      $name = $_.Name
      -not ($excluded -contains $name)
    }

    $deletedProfiles = $profiles | Select-Object -ExpandProperty Name
    $spaceFreedBytes = 0
    foreach ($profile in $profiles) {
      $spaceFreedBytes += (Get-ChildItem $profile.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    }

    if ($deletedProfiles.Count -eq 0) {
      Write-Output 'DELETED_PROFILES:'
      Write-Output 'SPACE_FREED_BYTES:0'
      return
    }

    $excludeArgs = $excluded | ForEach-Object { "/ed:\"$_\"" }
    $command = "& \"$delProf2\" /u /q " + ($excludeArgs -join ' ')
    Invoke-Expression $command
    Write-Output ('DELETED_PROFILES:' + ($deletedProfiles -join ','))
    Write-Output ('SPACE_FREED_BYTES:' + $spaceFreedBytes)
  `;
};

async function getActiveServerUsers(serverName) {
  try {
    const { stdout } = await runPowerShellCommand(['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `query user /server:${serverName}`]);
    return parseQueryUserOutput(stdout);
  } catch (error) {
    const stderr = String(error.stderr || '').toLowerCase();
    if (stderr.includes('no user exists') || stderr.includes('no entries') || stderr.includes('no entries available')) {
      return [];
    }
    throw new Error(`Unable to query active users for ${serverName}: ${error.message || stderr}`);
  }
}

async function saveServerCleanupLog({ serverName, deletedProfiles, spaceFreedBytes, status, triggeredBy, details }) {
  await pool.query(
    `INSERT INTO app_support_server_cleanup_logs
       (server_name, deleted_profiles, space_freed_bytes, status, triggered_by, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [serverName, deletedProfiles || [], spaceFreedBytes || 0, status, triggeredBy || null, details || null]
  );
}

async function getServerCleanupStatus() {
  const result = await pool.query(
    `SELECT server_name, deleted_profiles, space_freed_bytes, status, triggered_by, details, created_at
     FROM app_support_server_cleanup_logs
     ORDER BY created_at DESC
     LIMIT 1`
  );
  return result.rows[0] || null;
}

async function getServerCleanupHistory(limit = 50) {
  const result = await pool.query(
    `SELECT server_name, deleted_profiles, space_freed_bytes, status, triggered_by, details, created_at
     FROM app_support_server_cleanup_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function getConfiguredCleanupServerNames() {
  const result = await pool.query(`SELECT name FROM app_support_servers WHERE is_active = TRUE ORDER BY name`);
  return result.rows.map((row) => row.name);
}

async function runServerCleanupOnServer(serverName, triggeredBy) {
  const activeUsers = await getActiveServerUsers(serverName);
  const cleanupScript = buildCleanupPowerShellScript({ excludedProfiles: activeUsers });
  const envOptions = { ...process.env };

  const command = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    `Invoke-Command -ComputerName ${serverName} -ScriptBlock { ${cleanupScript} } -ErrorAction Stop`,
  ];

  try {
    const { stdout } = await runPowerShellCommand(command, { env: envOptions });
    const deletedMatch = String(stdout).match(/DELETED_PROFILES:(.*)/);
    const spaceMatch = String(stdout).match(/SPACE_FREED_BYTES:(\d+)/);
    const deletedProfiles = deletedMatch && deletedMatch[1] ? deletedMatch[1].split(',').filter(Boolean) : [];
    const spaceFreedBytes = spaceMatch ? Number(spaceMatch[1]) : 0;
    const details = `Active users preserved: ${activeUsers.length}.`;

    await saveServerCleanupLog({
      serverName,
      deletedProfiles,
      spaceFreedBytes,
      status: 'success',
      triggeredBy,
      details,
    });

    return { serverName, deletedProfiles, spaceFreedBytes, status: 'success', details };
  } catch (error) {
    const details = String(error.stderr || error.stdout || error.message || '').trim();
    await saveServerCleanupLog({
      serverName,
      deletedProfiles: [],
      spaceFreedBytes: 0,
      status: 'failed',
      triggeredBy,
      details,
    });
    return { serverName, status: 'failed', details };
  }
}

async function runServerCleanupOnServers({ serverNames = [], triggeredBy = 'system' }) {
  const cleanedServers = Array.isArray(serverNames) && serverNames.length > 0
    ? serverNames.map((name) => String(name || '').trim()).filter(Boolean)
    : await getConfiguredCleanupServerNames();

  if (cleanedServers.length === 0) {
    return { message: 'No configured servers found for cleanup', cleanedServers: [] };
  }

  const results = await Promise.allSettled(
    cleanedServers.map((server) => runServerCleanupOnServer(server, triggeredBy))
  );

  const normalizedResults = results.map((result) => result.status === 'fulfilled'
    ? result.value
    : {
      serverName: null,
      status: 'failed',
      details: result.reason?.message || 'Unknown failure',
    }
  );

  const failedCount = normalizedResults.filter((item) => item.status !== 'success').length;
  return {
    message: failedCount === 0 ? 'Server cleanup completed' : `Server cleanup completed with ${failedCount} failures`,
    results: normalizedResults,
  };
}

async function runServerCleanupCycle() {
  if (cleanupState.isRunning) {
    return;
  }

  cleanupState.isRunning = true;
  cleanupState.lastRunAt = new Date();
  cleanupState.lastStatus = 'running';
  cleanupState.lastError = null;

  try {
    const serverNames = await getConfiguredCleanupServerNames();
    await runServerCleanupOnServers({ serverNames, triggeredBy: 'scheduler' });
    cleanupState.lastStatus = 'completed';
  } catch (error) {
    cleanupState.lastStatus = 'failed';
    cleanupState.lastError = error.message || 'Server cleanup cycle failure';
  } finally {
    cleanupState.isRunning = false;
  }
}

async function startServerCleanupManager() {
  if (serverCleanupTimer) return;
  await ensureApplicationSupportTables();
  await runServerCleanupCycle();
  serverCleanupTimer = setInterval(runServerCleanupCycle, SERVER_CLEANUP_INTERVAL_MS);
}

function startTerminalLoadAlertScheduler() {
  if (alertTimer) return;
  checkScheduledTerminalLoadAlert();
  alertTimer = setInterval(checkScheduledTerminalLoadAlert, 30 * 1000);
}

async function startApplicationSupportMonitor() {
  await seedApplicationSupportDefaults();
  await pollApplicationSupportServers();

  if (appSupportMonitorTimer) return;
  appSupportMonitorTimer = setInterval(pollApplicationSupportServers, DEFAULT_POLL_INTERVAL_MS);
  startTerminalLoadAlertScheduler();
}

module.exports = {
  SERVER_USER_LIMIT,
  TERMINAL_ALERT_THRESHOLD,
  ensureApplicationSupportTables,
  seedApplicationSupportDefaults,
  startApplicationSupportMonitor,
  pollApplicationSupportServers,
  sendScheduledTerminalLoadAlert,
  getMonitorTerminalData,
  getMonitorTerminalStatus,
  getMonitorTerminalLogs,
  getMonitorRdpFiles,
  saveMonitorRdpFile,
  deleteMonitorRdpFile,
  startMonitorTerminal,
  stopMonitorTerminal,
  clearMonitorTerminalCredentials,
  getServerPerformanceStatus,
  getServerPerformanceLogs,
  startServerPerformanceMonitor,
  stopServerPerformanceMonitor,
  runServerPerformanceNow,
  clearServerPerformanceCredentials,
  getServerCleanupStatus,
  getServerCleanupHistory,
  runServerCleanupOnServers,
  startServerCleanupManager,
};
