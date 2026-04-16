# Printer Current State & Status Monitoring

## Overview
The Printer Asset Management System monitors the real-time status of connected printers and displays their current operational state in the dashboard and printer views.

## How It Works

### Backend - Printer Monitor Service
The `printerMonitor` service continuously monitors printer status:

1. **Printer Discovery** - Pings printers using serial number/domain lookups
2. **Web Page Fetch** - Retrieves printer's home page HTML (handles authentication)
3. **Status Parsing** - Extracts from HTML:
   - Printer Status: Ready, Paused, Error, Not Ready
   - Error Conditions: Paper Out, Head Open, Ribbon Out, etc.
   - Firmware Version (e.g., R17.09.01)
   - Label Count / Head KM (print count)

4. **Data Storage** - Updates `printer_live_state` table with:
   - `online_status`: online/offline (based on ping)
   - `condition_status`: ready/error/unknown
   - `error_reason`: specific error message
   - `firmware_version`: extracted from printer web page
   - `printer_km`: label count from printer

5. **Change Logging** - Records all status changes to `printer_status_logs`

### Monitor Schedule
- Default interval: **2 minutes** (120,000 ms)
- Configurable via `PRINTER_MONITOR_INTERVAL_MS` environment variable
- Concurrent requests: 6 printers at a time (configurable)

### Printer Status Codes

| Status | Meaning |
|--------|---------|
| **ready** | Printer is operational and ready |
| **error** | Printer has a fault condition |
| **paused** | Printer is paused |
| **unknown** | Status could not be determined |

### Error Conditions Detected

The system automatically detects:
- Paper Out / Media Out
- Ribbon Out
- Head Open
- Head Fault
- Paper Jam
- Not Ready
- Printer Paused
- HTTP errors (401, 403, 5xx)
- Web UI unreachable

## Frontend Display

### View Printers Page
Displays all printers with live status:
- **Online Column**: Shows ● Online or ● Offline status
- **Current State Column**: Shows Ready (green), Error (red), or Unknown (gray)
- **Firmware Column**: Extracted from printer web page
- **Head KM Column**: Label count from printer
- **Open UI Button**: Available only for online printers

### Printer Dashboard
Shows printer status overview with KPIs:
- **Total Printers**: Count of all printers
- **Online**: Count of online printers
- **Offline**: Count of offline printers  
- **Printers With Error**: Count of printers with error conditions

Detailed printer table showing:
- Online Status (● Online / ● Offline)
- Current State (Ready/Error/Unknown with color coding)
- Firmware Version
- Head KM
- IP Address
- Location

## Color Coding

- 🟢 **Green (Ready)**: Printer is operational
- 🔴 **Red (Error)**: Printer has a fault condition
- ⚫ **Gray (Unknown/Offline)**: Status unknown or offline

## Example Printer States

From Web Page Parsing:

```
Status: PAUSED
ERROR CONDITION: PAPER OUT
Firmware: R17.09.01
Print Count: 1,248,392 labels
```

Would display as:
- **Online Status**: ● Online
- **Current State**: Error - Paper Out
- **Firmware**: R17.09.01
- **Head KM**: 1,248,392 labels

## Authentication

The system automatically handles printer web authentication:
- **Zebra**: username: admin, password: 1234
- **Honeywell**: username: itadmin, password: pass

## Network Requirements

- Printers must be on network with valid IP addresses
- Printers must have functional web interface (HTTP/HTTPS)
- Network connectivity from backend server to printers required
- Firewall must allow HTTP/HTTPS to printer IPs

## Troubleshooting

### Printer Shows "Offline"
- Check network connectivity to printer
- Verify IP address is correct
- Check if printer is powered on
- Verify firewall allows connections

### Printer Shows "Unknown" Status
- Printer is online but web UI unreachable
- IP is local machine IP (security restriction)
- Printer web page format not recognized
- Check if printer requires different authentication

### Firmware/KM Shows "-"
- Printer web page format not matched by parser
- May need regex update for specific printer model
- Contact support with printer model and web page source

## API Endpoints

- `GET /api/printers/dashboard-live` - Get all printers with live status
- `POST /api/printers/dashboard-live/refresh` - Force immediate status refresh
- `GET /api/printers/status-logs/:pmno` - Get status history for a printer

## Status Refresh Intervals

- **Automatic**: Every 120 seconds (configurable)
- **Manual**: Click "Refresh Live" button in UI
- **Dashboard Auto-reload**: Every 15 seconds

---

**Last Updated**: April 14, 2026
**System**: Printer Asset Management System v1.0
