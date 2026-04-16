-- Printer Asset Management System - PostgreSQL Schema
-- Run this file to create all required tables

-- ═══ PRINTERS (Master) ═══
CREATE TABLE IF NOT EXISTS printers (
  id SERIAL PRIMARY KEY,
  pmno VARCHAR(20) UNIQUE NOT NULL,
  serial VARCHAR(50),
  make VARCHAR(50),
  model VARCHAR(50),
  dpi VARCHAR(10),
  ip VARCHAR(20),
  wc VARCHAR(30),
  loc TEXT,
  stage VARCHAR(30),
  bay VARCHAR(30),
  status VARCHAR(20) DEFAULT 'ready',
  pmdate VARCHAR(30),
  sapno VARCHAR(50),
  mesno VARCHAR(50),
  firmware VARCHAR(50),
  loftware VARCHAR(50),
  buyoff VARCHAR(100),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ VLAN ═══
CREATE TABLE IF NOT EXISTS vlan (
  id SERIAL PRIMARY KEY,
  port VARCHAR(30) NOT NULL,
  ip VARCHAR(20) NOT NULL,
  mac VARCHAR(30),
  sw VARCHAR(50),
  loc TEXT,
  stage VARCHAR(30),
  bay VARCHAR(30),
  wc VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ SPARE PARTS ═══
CREATE TABLE IF NOT EXISTS spare_parts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  compat VARCHAR(50),
  avail INTEGER DEFAULT 0,
  min INTEGER DEFAULT 2,
  loc VARCHAR(100),
  serial VARCHAR(50),
  condition VARCHAR(20) DEFAULT 'New',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ SPARE PARTS USAGE LOG ═══
CREATE TABLE IF NOT EXISTS parts_usage_log (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50),
  name VARCHAR(100),
  qty INTEGER DEFAULT 1,
  pmno VARCHAR(20),
  serial VARCHAR(50),
  wc VARCHAR(30),
  used_by VARCHAR(100),
  used_at TIMESTAMP DEFAULT NOW()
);

-- ═══ HP PRINTERS ═══
CREATE TABLE IF NOT EXISTS hp_printers (
  id SERIAL PRIMARY KEY,
  tag VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(100) NOT NULL,
  ip VARCHAR(20) NOT NULL,
  loc TEXT,
  stage VARCHAR(30),
  bay VARCHAR(30),
  wc VARCHAR(30),
  cartmodel VARCHAR(100),
  black_pct INTEGER DEFAULT 85,
  color_pct INTEGER,
  online BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══ CARTRIDGES ═══
CREATE TABLE IF NOT EXISTS cartridges (
  id SERIAL PRIMARY KEY,
  model VARCHAR(100) UNIQUE NOT NULL,
  dn VARCHAR(50),
  type VARCHAR(20),
  compat TEXT,
  stock INTEGER DEFAULT 0,
  min INTEGER DEFAULT 2,
  yield VARCHAR(50),
  loc VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ CARTRIDGE USAGE LOG ═══
CREATE TABLE IF NOT EXISTS cartridge_usage_log (
  id SERIAL PRIMARY KEY,
  dn VARCHAR(50),
  model VARCHAR(100),
  qty INTEGER DEFAULT 1,
  wc VARCHAR(30),
  ip VARCHAR(20),
  used_by VARCHAR(100),
  used_at TIMESTAMP DEFAULT NOW()
);

-- ═══ LABEL RECIPES ═══
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  make VARCHAR(50),
  model VARCHAR(50),
  dpi VARCHAR(10),
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══ ISSUES TRACKER ═══
CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
  pmno VARCHAR(20),
  serial VARCHAR(50),
  model VARCHAR(50),
  loc TEXT,
  title VARCHAR(200) NOT NULL,
  "desc" TEXT NOT NULL,
  action TEXT,
  severity VARCHAR(20) DEFAULT 'Medium',
  category VARCHAR(50) DEFAULT 'Other',
  status VARCHAR(20) DEFAULT 'open',
  reporter VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 days'),
  resolved_at TIMESTAMP
);

-- ═══ HEALTH CHECKUPS ═══
CREATE TABLE IF NOT EXISTS health_checkups (
  id SERIAL PRIMARY KEY,
  pmno VARCHAR(20),
  serial VARCHAR(50),
  model VARCHAR(50),
  make VARCHAR(50),
  sapno VARCHAR(50),
  mesno VARCHAR(50),
  dpi VARCHAR(10),
  firmware VARCHAR(50),
  km VARCHAR(50),
  loftware VARCHAR(50),
  ip VARCHAR(20),
  mac VARCHAR(50),
  loc TEXT,
  stage VARCHAR(30),
  bay VARCHAR(30),
  wc VARCHAR(30),
  health VARCHAR(10) DEFAULT 'ok',
  issue_desc TEXT,
  req_parts TEXT,
  is_repeat BOOLEAN DEFAULT FALSE,
  engineer VARCHAR(100),
  checked_at TIMESTAMP DEFAULT NOW()
);

-- ═══ PM PASTED LOG ═══
CREATE TABLE IF NOT EXISTS pm_pasted_log (
  id SERIAL PRIMARY KEY,
  pmno VARCHAR(20),
  serial VARCHAR(50),
  model VARCHAR(50),
  make VARCHAR(50),
  dpi VARCHAR(10),
  ip VARCHAR(20),
  firmware VARCHAR(50),
  sapno VARCHAR(50),
  mesno VARCHAR(50),
  loftware VARCHAR(50),
  pmdate VARCHAR(30),
  pasted_at VARCHAR(50),
  stage VARCHAR(30),
  bay VARCHAR(30),
  wc VARCHAR(30),
  loc TEXT,
  engineer VARCHAR(100),
  shift VARCHAR(30),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HEALTH CHECKUP ACTIVITY LOG (1 month retention by API cleanup)
CREATE TABLE IF NOT EXISTS health_checkup_activity_log (
  id SERIAL PRIMARY KEY,
  pmno VARCHAR(20) NOT NULL,
  engineer VARCHAR(100),
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_checkup_activity_checked_at
  ON health_checkup_activity_log (checked_at DESC);

-- PRINTER LIVE STATE (continuous monitor snapshot)
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
);

ALTER TABLE printer_live_state ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(100);
ALTER TABLE printer_live_state ADD COLUMN IF NOT EXISTS printer_km VARCHAR(100);

-- PRINTER STATUS LOGS (1 month retention by backend cleanup)
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
);

CREATE INDEX IF NOT EXISTS idx_printer_status_logs_pmno_time
  ON printer_status_logs (pmno, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_printer_status_logs_logged_at
  ON printer_status_logs (logged_at DESC);
