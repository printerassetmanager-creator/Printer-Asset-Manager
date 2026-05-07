const express = require('express');
const { execFile } = require('child_process');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const {
  SERVER_USER_LIMIT,
  ensureApplicationSupportTables,
  seedApplicationSupportDefaults,
  pollApplicationSupportServers,
  getMonitorTerminalStatus,
  getMonitorTerminalLogs,
  getMonitorRdpFiles,
  saveMonitorRdpFile,
  deleteMonitorRdpFile,
  startMonitorTerminal,
  stopMonitorTerminal,
  getServerPerformanceStatus,
  getServerPerformanceLogs,
  startServerPerformanceMonitor,
  stopServerPerformanceMonitor,
  runServerPerformanceNow,
  getServerCleanupStatus,
  getServerCleanupHistory,
  runServerCleanupOnServers,
} = require('../services/applicationSupportMonitor');

const router = express.Router();

const isSuperAdmin = (user) => user?.role === 'super_admin';
const isApplicationSupport = (user) => {
  const supportType = (user?.supportType || user?.support_type);
  return supportType === 'application' || supportType === 'both';
};
const canViewApplicationSupport = (user) => isSuperAdmin(user) || isApplicationSupport(user);
const canManageApplicationSupport = (user) => isSuperAdmin(user) || (user?.role === 'admin' && isApplicationSupport(user));
const canUseTerminalManagement = (user) => isSuperAdmin(user) || isApplicationSupport(user);
const terminalManagementChoices = ['M01', 'P01', 'VAO01', 'D01', 'E01'];
const TERMINAL_DEPLOY_CONCURRENCY = Number(process.env.APP_SUPPORT_DEPLOY_CONCURRENCY || 5);
const TERMINAL_HISTORY_RETENTION_DAYS = 7;

const runPowerShell = (args) => new Promise((resolve, reject) => {
  execFile('powershell.exe', args, { timeout: 10 * 60 * 1000, windowsHide: true }, (error, stdout, stderr) => {
    if (error) {
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
      return;
    }
    resolve({ stdout, stderr });
  });
});

const escapePowerShellString = (value) => String(value || '').replace(/'/g, "''");

const normalizeTerminals = (terminals) => {
  const uniqueTerminals = Array.from(new Set(terminals));
  if (uniqueTerminals.includes('M01') && !uniqueTerminals.includes('VAO01')) {
    uniqueTerminals.push('VAO01');
  }
  return uniqueTerminals;
};

const parsePreviousTerminals = (output) => {
  const match = String(output || '').match(/PREVIOUS_TERMINALS:([A-Z0-9,]*)/);
  if (!match || !match[1]) return [];
  return match[1].split(',').map((terminal) => terminal.trim()).filter(Boolean);
};

const buildProgressLines = (output) => String(output || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.startsWith('STATUS:['));

async function ensureTerminalManagementTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_terminal_deploy_history (
      id SERIAL PRIMARY KEY,
      pc_name VARCHAR(100) NOT NULL,
      previous_terminals TEXT[] DEFAULT ARRAY[]::TEXT[],
      deployed_terminals TEXT[] DEFAULT ARRAY[]::TEXT[],
      deployed_by VARCHAR(100),
      deploy_output TEXT,
      rollback_output TEXT,
      deployed_at TIMESTAMP DEFAULT NOW(),
      rolled_back_at TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_app_support_terminal_deploy_history_pc
    ON app_support_terminal_deploy_history (pc_name, deployed_at DESC)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_support_terminal_failed_devices (
      id SERIAL PRIMARY KEY,
      pc_name VARCHAR(100) NOT NULL,
      action VARCHAR(30) NOT NULL,
      terminals TEXT[] DEFAULT ARRAY[]::TEXT[],
      error TEXT,
      failed_by VARCHAR(100),
      failed_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_app_support_terminal_failed_devices_failed_at
    ON app_support_terminal_failed_devices (failed_at DESC)
  `);

  await pool.query(
    `DELETE FROM app_support_terminal_deploy_history
     WHERE deployed_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [TERMINAL_HISTORY_RETENTION_DAYS]
  );

  await pool.query(
    `DELETE FROM app_support_terminal_failed_devices
     WHERE failed_at < NOW() - ($1::int * INTERVAL '1 day')`,
    [TERMINAL_HISTORY_RETENTION_DAYS]
  );
}

async function saveFailedTerminalDevices(failures, action, terminals, userEmail) {
  for (const failure of failures) {
    await pool.query(
      `INSERT INTO app_support_terminal_failed_devices
         (pc_name, action, terminals, error, failed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [failure.pcName, action, terminals || [], failure.error || 'Unknown error', userEmail || null]
    );
  }
}

const runWithConcurrency = async (items, limit, worker) => {
  const results = [];
  let nextIndex = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      try {
        results[currentIndex] = { status: 'fulfilled', value: await worker(items[currentIndex]) };
      } catch (error) {
        results[currentIndex] = { status: 'rejected', reason: error };
      }
    }
  });

  await Promise.all(runners);
  return results;
};

const buildTerminalDeployScript = ({ pcName, terminals, removeTerminals = [], targetUsername, targetPassword, fastMode, mode = 'deploy' }) => {
  const terminalList = terminals.map((terminal) => `'${escapePowerShellString(terminal)}'`).join(',');
  const removeTerminalList = removeTerminals.map((terminal) => `'${escapePowerShellString(terminal)}'`).join(',');

  return `
$ErrorActionPreference = 'Stop'
$pcName = '${escapePowerShellString(pcName)}'
$terminals = @(${terminalList})
$removeTerminals = @(${removeTerminalList})
$fastMode = ${fastMode ? '$true' : '$false'}
$mode = '${escapePowerShellString(mode)}'
$targetUsername = '${escapePowerShellString(targetUsername)}'
$targetPassword = '${escapePowerShellString(targetPassword)}'

$securePassword = ConvertTo-SecureString $targetPassword -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($targetUsername, $securePassword)
$shareUsername = $cred.UserName
$sharePassword = $cred.GetNetworkCredential().Password

Write-Host "STATUS:[$pcName] Starting $mode"

Invoke-Command -ComputerName $pcName -Credential $cred -ArgumentList (,$terminals), (,$removeTerminals), $shareUsername, $sharePassword, $fastMode, $mode, $pcName -ScriptBlock {
  param($terminals, $removeTerminals, $shareUsername, $sharePassword, $fastMode, $mode, $pcName)

  $share = "\\\\inrjnm0it012\\C$\\IT SOFTWARE\\New Farms\\All Farms"
  $desktop = "C:\\Users\\Public\\Desktop"
  $sourceDrive = "Z:"
  $selectedTerminals = @($terminals | ForEach-Object { [string]$_ })
  $requiredTerminals = @($selectedTerminals | Select-Object -Unique)
  $removeTargets = @($removeTerminals | ForEach-Object { [string]$_ } | Select-Object -Unique)
  $terminalChoices = @("M01", "P01", "VAO01", "D01", "E01")

  Write-Host "STATUS:[$pcName] Target terminals:" ($requiredTerminals -join ", ")
  net use $sourceDrive $share /user:$shareUsername $sharePassword /persistent:no | Out-Null

  try {
    if (!(Test-Path "$sourceDrive\\")) {
      throw "Z drive mapping failed"
    }

    $source = $sourceDrive
    $sourceFiles = Get-ChildItem $source
    $filesByTerminal = @{}
    foreach ($terminal in $requiredTerminals) {
      $file = $sourceFiles | Where-Object { $_.Name -match $terminal } | Select-Object -First 1
      if ($null -eq $file) {
        throw "$terminal not found in source"
      }
      $filesByTerminal[$terminal] = $file
    }

    $userDesktopRoots = Get-ChildItem 'C:\Users' -Directory | Where-Object { $_.Name -notin @('Public', 'Default', 'Default User', 'All Users') }
    $userDesktopPaths = $userDesktopRoots | ForEach-Object { Join-Path $_.FullName 'Desktop' } | Where-Object { Test-Path $_ }

    foreach ($userDesktop in $userDesktopPaths) {
      Write-Host "STATUS:[$pcName] Cleaning old terminal shortcuts from user desktop:" $userDesktop
      Get-ChildItem $userDesktop -Filter "RJNMES*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "STATUS:[$pcName] Removing from user desktop:" $_.FullName
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
      }
    }

    $desktopFiles = Get-ChildItem $desktop -Filter "RJNMES*" -ErrorAction SilentlyContinue
    $previousTerminals = @()
    foreach ($terminal in $terminalChoices) {
      if ($desktopFiles | Where-Object { $_.Name -match $terminal } | Select-Object -First 1) {
        $previousTerminals += $terminal
      }
    }
    Write-Host ("PREVIOUS_TERMINALS:" + ($previousTerminals -join ","))

    $desktopFiles | ForEach-Object {
      $keep = $false
      foreach ($terminal in $requiredTerminals) {
        if ($_.Name -match $terminal) {
          $keep = $true
          break
        }
      }

      if (-not $keep) {
        Write-Host "STATUS:[$pcName] Removing:" $_.Name
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
      }
    }

    foreach ($terminal in $removeTargets) {
      $desktopFiles | Where-Object { $_.Name -match $terminal } | ForEach-Object {
        Write-Host "STATUS:[$pcName] Removing deployed $terminal :" $_.Name
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
      }
    }

    foreach ($terminal in $requiredTerminals) {
      $desktopFiles | Where-Object { $_.Name -match $terminal } | ForEach-Object {
        Write-Host "STATUS:[$pcName] Removing old $terminal :" $_.Name
        Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue
      }

      Write-Host "STATUS:[$pcName] Deploying $terminal :" $filesByTerminal[$terminal].Name
      Copy-Item $filesByTerminal[$terminal].FullName $desktop -Force
    }

    if ($fastMode) {
      Write-Host "STATUS:[$pcName] Fast mode enabled: skipping full TEMP cleanup"
    } else {
      Write-Host "STATUS:[$pcName] Cleaning TEMP files..."
      Remove-Item "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Host "STATUS:[$pcName] Removing saved credentials..."
    cmdkey /list | ForEach-Object {
      if ($_ -match "TERMSRV" -or $_ -match "INRJNM") {
        $target = ($_ -split ":")[1].Trim()
        cmdkey /delete:$target | Out-Null
      }
    }

    Write-Host "STATUS:[$pcName] DONE: Deployment + Cleanup Completed"
  } finally {
    net use $sourceDrive /delete | Out-Null
  }
}
`;
};

router.use(authMiddleware);

router.use((req, res, next) => {
  if (!canViewApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }
  next();
});

router.get('/dashboard', async (req, res) => {
  try {
    await seedApplicationSupportDefaults();

    const terminalResult = await pool.query(`
      SELECT t.id,
             t.code,
             t.name,
             COALESCE(SUM(s.active_users), 0)::int AS active_users,
             COUNT(s.id)::int AS server_count,
             COALESCE(SUM(s.max_users), 0)::int AS capacity,
             MAX(s.last_checked_at) AS last_checked_at
      FROM app_support_terminals t
      LEFT JOIN app_support_servers s ON s.terminal_id = t.id AND s.is_active = TRUE
      WHERE t.is_active = TRUE
      GROUP BY t.id, t.code, t.name
      ORDER BY CASE t.code
        WHEN 'P01' THEN 1
        WHEN 'VAO01' THEN 2
        WHEN 'M01' THEN 3
        WHEN 'D01' THEN 4
        WHEN 'E01' THEN 5
        ELSE 99
      END, t.code
    `);

    const serverResult = await pool.query(`
      SELECT s.id, s.name, s.active_users, s.max_users, s.status, s.last_checked_at, s.last_error,
             t.code AS terminal_code, t.name AS terminal_name
      FROM app_support_servers s
      JOIN app_support_terminals t ON t.id = s.terminal_id
      WHERE s.is_active = TRUE AND t.is_active = TRUE
      ORDER BY t.code, s.name
    `);

    const totals = terminalResult.rows.reduce((acc, terminal) => {
      acc.active_users += Number(terminal.active_users || 0);
      acc.servers += Number(terminal.server_count || 0);
      acc.capacity += Number(terminal.capacity || 0);
      return acc;
    }, { active_users: 0, servers: 0, capacity: 0 });

    res.json({
      userLimitPerServer: SERVER_USER_LIMIT,
      totals,
      terminals: terminalResult.rows,
      servers: serverResult.rows,
    });
  } catch (error) {
    console.error('Application support dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch application support dashboard' });
  }
});

router.get('/dashboard/history', async (req, res) => {
  try {
    if (!canViewApplicationSupport(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const rangeHours = Math.min(Number(req.query.hours) || 1, 168); // Max 7 days
    const cutoffDate = new Date(Date.now() - (rangeHours * 60 * 60 * 1000));

    const result = await pool.query(
      `SELECT terminal_code, server_name, active_users, recorded_at
       FROM app_support_terminal_history
       WHERE recorded_at >= $1
       ORDER BY recorded_at ASC`,
      [cutoffDate]
    );

    // Group by terminal and aggregate data points
    const dataByTerminal = {};
    result.rows.forEach(row => {
      if (!dataByTerminal[row.terminal_code]) {
        dataByTerminal[row.terminal_code] = [];
      }
      dataByTerminal[row.terminal_code].push({
        timestamp: row.recorded_at.getTime(),
        server: row.server_name,
        users: row.active_users
      });
    });

    // Aggregate per terminal per timestamp (sum users across servers)
    const aggregatedData = {};
    Object.keys(dataByTerminal).forEach(terminalCode => {
      const points = dataByTerminal[terminalCode];
      const groupedByTime = {};

      points.forEach(point => {
        const timeKey = Math.floor(point.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000); // 5-minute buckets
        if (!groupedByTime[timeKey]) {
          groupedByTime[timeKey] = { timestamp: timeKey, users: 0, count: 0 };
        }
        groupedByTime[timeKey].users += point.users;
        groupedByTime[timeKey].count += 1;
      });

      aggregatedData[terminalCode] = Object.values(groupedByTime)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(point => ({
          timestamp: point.timestamp,
          value: Math.round(point.users / point.count) // Average users per server
        }));
    });

    res.json(aggregatedData);
  } catch (error) {
    console.error('Application support dashboard history error:', error);
    res.status(500).json({ error: 'Failed to fetch application support dashboard history' });
  }
});

router.get('/inventory', async (req, res) => {
  try {
    await seedApplicationSupportDefaults();
    const result = await pool.query(`
      SELECT t.id,
             t.code,
             t.name,
             t.description,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', s.id,
                   'name', s.name,
                   'active_users', s.active_users,
                   'max_users', s.max_users,
                   'status', s.status,
                   'last_checked_at', s.last_checked_at,
                   'last_error', s.last_error
                 )
                 ORDER BY s.name
               ) FILTER (WHERE s.id IS NOT NULL),
               '[]'
             ) AS servers
      FROM app_support_terminals t
      LEFT JOIN app_support_servers s ON s.terminal_id = t.id AND s.is_active = TRUE
      WHERE t.is_active = TRUE
      GROUP BY t.id, t.code, t.name, t.description
      ORDER BY t.code
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Application support inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch application support inventory' });
  }
});

router.post('/terminals', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support admin access required' });
  }

  const { code, name, description } = req.body;
  const cleanCode = String(code || '').trim().toUpperCase();
  const cleanName = String(name || '').trim();

  try {
    if (!cleanCode || !cleanName) {
      return res.status(400).json({ error: 'Terminal code and name are required' });
    }

    await ensureApplicationSupportTables();
    const result = await pool.query(
      `INSERT INTO app_support_terminals (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cleanCode, cleanName, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create application support terminal error:', error);
    res.status(error.code === '23505' ? 409 : 500).json({
      error: error.code === '23505' ? 'Terminal code already exists' : 'Failed to create terminal',
    });
  }
});

router.post('/servers', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support admin access required' });
  }

  const { terminalId, terminalCode, name, maxUsers = SERVER_USER_LIMIT } = req.body;
  const cleanName = String(name || '').trim().toUpperCase();

  try {
    if (!cleanName) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    await ensureApplicationSupportTables();

    const terminalResult = terminalId
      ? await pool.query('SELECT id FROM app_support_terminals WHERE id = $1 AND is_active = TRUE', [terminalId])
      : await pool.query('SELECT id FROM app_support_terminals WHERE code = $1 AND is_active = TRUE', [String(terminalCode || '').trim().toUpperCase()]);

    if (terminalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Terminal not found' });
    }

    const safeMaxUsers = Number.isFinite(Number(maxUsers)) && Number(maxUsers) > 0
      ? Math.min(Number(maxUsers), SERVER_USER_LIMIT)
      : SERVER_USER_LIMIT;

    const result = await pool.query(
      `INSERT INTO app_support_servers (terminal_id, name, max_users)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [terminalResult.rows[0].id, cleanName, safeMaxUsers]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create application support server error:', error);
    res.status(error.code === '23505' ? 409 : 500).json({
      error: error.code === '23505' ? 'Server name already exists' : 'Failed to create server',
    });
  }
});

router.post('/refresh', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support admin access required' });
  }

  pollApplicationSupportServers().catch((error) => {
    console.error('Manual application support refresh failed:', error);
  });

  res.json({ message: 'Application support refresh started' });
});

router.get('/monitor-terminal/status', async (req, res) => {
  try {
    const status = await getMonitorTerminalStatus();
    res.json(status);
  } catch (error) {
    console.error('Monitor terminal status error:', error);
    res.status(500).json({ error: 'Failed to fetch monitor terminal status' });
  }
});

router.get('/monitor-terminal/logs', async (req, res) => {
  try {
    const logs = await getMonitorTerminalLogs(100);
    res.json(logs);
  } catch (error) {
    console.error('Monitor terminal logs error:', error);
    res.status(500).json({ error: 'Failed to fetch monitor terminal logs' });
  }
});

router.get('/monitor-terminal/rdp-files', async (req, res) => {
  try {
    const files = await getMonitorRdpFiles();
    res.json(files);
  } catch (error) {
    console.error('Monitor terminal RDP file list error:', error);
    res.status(500).json({ error: 'Failed to fetch RDP files' });
  }
});

router.post('/monitor-terminal/rdp-files', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support admin access required' });
  }

  const { terminalCode, fileName, contentBase64 } = req.body;
  if (!fileName || !contentBase64) {
    return res.status(400).json({ error: 'fileName and contentBase64 are required' });
  }

  try {
    const file = await saveMonitorRdpFile({
      terminalCode,
      fileName,
      contentBase64,
      uploadedBy: req.user?.email || null,
    });
    res.status(201).json(file);
  } catch (error) {
    console.error('Save monitor RDP file error:', error);
    res.status(500).json({ error: 'Failed to save RDP file', details: error.message });
  }
});

router.delete('/monitor-terminal/rdp-files/:id', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support admin access required' });
  }

  try {
    await deleteMonitorRdpFile(Number(req.params.id));
    res.json({ message: 'RDP file removed' });
  } catch (error) {
    console.error('Delete monitor RDP file error:', error);
    res.status(500).json({ error: 'Failed to delete RDP file', details: error.message });
  }
});

router.post('/monitor-terminal/start', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password } = req.body;
  try {
    await startMonitorTerminal({ username, password });
    res.json({ message: 'Monitor terminal process started' });
  } catch (error) {
    console.error('Start monitor terminal error:', error);
    res.status(500).json({ error: 'Failed to start monitor terminal', details: error.message });
  }
});

router.post('/monitor-terminal/stop', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    await stopMonitorTerminal();
    res.json({ message: 'Monitor terminal process stopped' });
  } catch (error) {
    console.error('Stop monitor terminal error:', error);
    res.status(500).json({ error: 'Failed to stop monitor terminal', details: error.message });
  }
});

router.get('/server-performance/status', async (req, res) => {
  try {
    const status = await getServerPerformanceStatus();
    res.json(status);
  } catch (error) {
    console.error('Server performance status error:', error);
    res.status(500).json({ error: 'Failed to fetch server performance status' });
  }
});

router.get('/server-performance/logs', async (req, res) => {
  try {
    const logs = await getServerPerformanceLogs(200);
    res.json(logs);
  } catch (error) {
    console.error('Server performance logs error:', error);
    res.status(500).json({ error: 'Failed to fetch server performance logs' });
  }
});

router.post('/server-performance/start', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { username, password } = req.body;
  try {
    await startServerPerformanceMonitor({ username, password });
    res.json({ message: 'Server performance monitoring started' });
  } catch (error) {
    console.error('Start server performance error:', error);
    res.status(500).json({ error: 'Failed to start server performance monitoring', details: error.message });
  }
});

router.post('/server-performance/stop', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    await stopServerPerformanceMonitor();
    res.json({ message: 'Server performance monitoring stopped' });
  } catch (error) {
    console.error('Stop server performance error:', error);
    res.status(500).json({ error: 'Failed to stop server performance monitoring', details: error.message });
  }
});

router.post('/server-performance/run', async (req, res) => {
  if (!canManageApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    await runServerPerformanceNow();
    res.json({ message: 'Server performance cycle completed' });
  } catch (error) {
    console.error('Run server performance cycle error:', error);
    res.status(500).json({ error: 'Failed to run server performance cycle', details: error.message });
  }
});

router.get('/server-cleanup/status', async (req, res) => {
  if (!canViewApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  try {
    const status = await getServerCleanupStatus();
    res.json(status || {
      server_name: null,
      deleted_profiles: [],
      space_freed_bytes: 0,
      status: 'idle',
      triggered_by: null,
      details: null,
      created_at: null,
    });
  } catch (error) {
    console.error('Server cleanup status error:', error);
    res.status(500).json({ error: 'Failed to fetch server cleanup status' });
  }
});

router.get('/server-cleanup/history', async (req, res) => {
  if (!canViewApplicationSupport(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  try {
    const history = await getServerCleanupHistory(50);
    res.json(history);
  } catch (error) {
    console.error('Server cleanup history error:', error);
    res.status(500).json({ error: 'Failed to fetch server cleanup history' });
  }
});

router.post('/server-cleanup', async (req, res) => {
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: 'Super admin access required to run cleanup' });
  }

  const requestedServers = Array.isArray(req.body.serverNames) ? req.body.serverNames : [req.body.serverName].filter(Boolean);
  const serverNames = Array.from(new Set(requestedServers.map((name) => String(name || '').trim()).filter(Boolean)));

  try {
    await ensureApplicationSupportTables();
    const cleanupResult = await runServerCleanupOnServers({ serverNames, triggeredBy: req.user?.email || 'super_admin' });
    res.json(cleanupResult);
  } catch (error) {
    console.error('Server cleanup error:', error);
    res.status(500).json({ error: 'Failed to run server cleanup', details: error.message });
  }
});

router.post('/terminal-management/deploy', async (req, res) => {
  if (!canUseTerminalManagement(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  const requestedPcNames = Array.isArray(req.body.pcNames) && req.body.pcNames.length > 0
    ? req.body.pcNames
    : [req.body.pcName];
  const pcNames = Array.from(new Set(
    requestedPcNames
      .map((pcName) => String(pcName || '').trim().toUpperCase())
      .filter(Boolean)
  ));
  const terminals = Array.isArray(req.body.terminals)
    ? req.body.terminals.map((terminal) => String(terminal || '').trim().toUpperCase())
    : [];
  const fastMode = req.body.fastMode !== false;
  const targetUsername = String(req.body.targetUsername || '').trim();
  const targetPassword = String(req.body.targetPassword || '');

  const invalidTerminals = terminals.filter((terminal) => !terminalManagementChoices.includes(terminal));
  const uniqueTerminals = normalizeTerminals(terminals);

  try {
    await ensureTerminalManagementTables();

    if (pcNames.length === 0) {
      return res.status(400).json({ error: 'Enter at least one PC name' });
    }
    const invalidPcNames = pcNames.filter((pcName) => !/^INRJNM[A-Z0-9-]+$/.test(pcName));
    if (invalidPcNames.length > 0) {
      return res.status(400).json({ error: `Invalid PC name(s): ${invalidPcNames.join(', ')}` });
    }
    if (uniqueTerminals.length === 0) {
      return res.status(400).json({ error: 'Select at least one terminal' });
    }
    if (invalidTerminals.length > 0) {
      return res.status(400).json({ error: `Invalid terminal selection: ${invalidTerminals.join(', ')}` });
    }
    if (!targetUsername || !targetPassword) {
      return res.status(400).json({ error: 'Target PC username and password are required' });
    }

    const deployResults = await runWithConcurrency(
      pcNames,
      Math.max(1, TERMINAL_DEPLOY_CONCURRENCY),
      async (pcName) => {
        const startedAt = new Date();
        const script = buildTerminalDeployScript({
          pcName,
          terminals: uniqueTerminals,
          targetUsername,
          targetPassword,
          fastMode,
        });
        const result = await runPowerShell(['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
        return {
          pcName,
          previousTerminals: parsePreviousTerminals(result.stdout),
          output: result.stdout,
          progressLines: buildProgressLines(result.stdout),
          startedAt,
          completedAt: new Date(),
          warning: result.stderr || null,
        };
      }
    );

    const summary = deployResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { status: 'success', ...result.value };
      }
      return {
        status: 'failed',
        pcName: pcNames[index],
        error: result.reason.stderr || result.reason.stdout || result.reason.message,
      };
    });
    const failedCount = summary.filter((item) => item.status === 'failed').length;
    const failures = summary.filter((item) => item.status === 'failed');

    for (const item of summary) {
      if (item.status === 'success') {
        await pool.query(
          `INSERT INTO app_support_terminal_deploy_history
             (pc_name, previous_terminals, deployed_terminals, deployed_by, deploy_output)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.pcName, item.previousTerminals, uniqueTerminals, req.user?.email || null, item.output || '']
        );
      }
    }
    await saveFailedTerminalDevices(failures, 'deploy', uniqueTerminals, req.user?.email);

    res.status(failedCount === pcNames.length ? 500 : 200).json({
      message: failedCount
        ? `Terminal deployment completed with ${failedCount} failed PC(s)`
        : 'Terminal deployment completed',
      pcNames,
      terminals: uniqueTerminals,
      fastMode,
      results: summary,
    });
  } catch (error) {
    console.error('Terminal management deployment error:', error.message);
    res.status(500).json({
      error: 'Terminal deployment failed',
      details: error.stderr || error.stdout || error.message,
    });
  }
});

router.get('/terminal-management/history', async (req, res) => {
  if (!canUseTerminalManagement(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  try {
    await ensureTerminalManagementTables();
    const result = await pool.query(`
      SELECT DISTINCT ON (pc_name)
             id,
             pc_name,
             previous_terminals,
             deployed_terminals,
             deployed_by,
             deployed_at
      FROM app_support_terminal_deploy_history
      WHERE rolled_back_at IS NULL
      ORDER BY pc_name, deployed_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Terminal management history error:', error);
    res.status(500).json({ error: 'Failed to fetch terminal deployment history' });
  }
});

router.get('/terminal-management/failed-devices', async (req, res) => {
  if (!canUseTerminalManagement(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  try {
    await ensureTerminalManagementTables();
    const result = await pool.query(`
      SELECT id,
             pc_name,
             action,
             terminals,
             error,
             failed_by,
             failed_at
      FROM app_support_terminal_failed_devices
      ORDER BY failed_at DESC
      LIMIT 200
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Terminal failed devices error:', error);
    res.status(500).json({ error: 'Failed to fetch failed device list' });
  }
});

router.post('/terminal-management/rollback', async (req, res) => {
  if (!canUseTerminalManagement(req.user)) {
    return res.status(403).json({ error: 'Application support access required' });
  }

  const requestedPcNames = Array.isArray(req.body.pcNames) && req.body.pcNames.length > 0
    ? req.body.pcNames
    : [req.body.pcName];
  const pcNames = Array.from(new Set(
    requestedPcNames
      .map((pcName) => String(pcName || '').trim().toUpperCase())
      .filter(Boolean)
  ));
  const fastMode = req.body.fastMode !== false;
  const targetUsername = String(req.body.targetUsername || '').trim();
  const targetPassword = String(req.body.targetPassword || '');

  try {
    await ensureTerminalManagementTables();

    if (pcNames.length === 0) {
      return res.status(400).json({ error: 'Enter at least one PC name' });
    }
    const invalidPcNames = pcNames.filter((pcName) => !/^INRJNM[A-Z0-9-]+$/.test(pcName));
    if (invalidPcNames.length > 0) {
      return res.status(400).json({ error: `Invalid PC name(s): ${invalidPcNames.join(', ')}` });
    }
    if (!targetUsername || !targetPassword) {
      return res.status(400).json({ error: 'Admin ID and password are required' });
    }

    const rollbackResults = await runWithConcurrency(
      pcNames,
      Math.max(1, TERMINAL_DEPLOY_CONCURRENCY),
      async (pcName) => {
        const startedAt = new Date();
        const historyResult = await pool.query(
          `SELECT *
           FROM app_support_terminal_deploy_history
           WHERE pc_name = $1
             AND rolled_back_at IS NULL
           ORDER BY deployed_at DESC
           LIMIT 1`,
          [pcName]
        );

        if (historyResult.rows.length === 0) {
          throw new Error('No rollback history found for this PC');
        }

        const history = historyResult.rows[0];
        const previousTerminals = normalizeTerminals(history.previous_terminals || []);
        const deployedTerminals = history.deployed_terminals || [];
        const script = buildTerminalDeployScript({
          pcName,
          terminals: previousTerminals,
          removeTerminals: deployedTerminals,
          targetUsername,
          targetPassword,
          fastMode,
          mode: 'rollback',
        });

        const result = await runPowerShell(['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
        await pool.query(
          `UPDATE app_support_terminal_deploy_history
           SET rolled_back_at = NOW(),
               rollback_output = $1
           WHERE id = $2`,
          [result.stdout || '', history.id]
        );

        return {
          pcName,
          previousTerminals,
          removedTerminals: deployedTerminals,
          output: result.stdout,
          progressLines: buildProgressLines(result.stdout),
          startedAt,
          completedAt: new Date(),
          warning: result.stderr || null,
        };
      }
    );

    const summary = rollbackResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { status: 'success', ...result.value };
      }
      return {
        status: 'failed',
        pcName: pcNames[index],
        error: result.reason.stderr || result.reason.stdout || result.reason.message,
      };
    });
    const failedCount = summary.filter((item) => item.status === 'failed').length;
    const failures = summary.filter((item) => item.status === 'failed');
    await saveFailedTerminalDevices(failures, 'rollback', [], req.user?.email);

    res.status(failedCount === pcNames.length ? 500 : 200).json({
      message: failedCount
        ? `Rollback completed with ${failedCount} failed PC(s)`
        : 'Rollback completed',
      pcNames,
      fastMode,
      results: summary,
    });
  } catch (error) {
    console.error('Terminal management rollback error:', error.message);
    res.status(500).json({
      error: 'Terminal rollback failed',
      details: error.stderr || error.stdout || error.message,
    });
  }
});

module.exports = router;
