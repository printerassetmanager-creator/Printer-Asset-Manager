/**
 * Printer Data Fetcher & Parser
 * Fetches and parses data from Honeywell and Zebra printer web interfaces
 */

// Credentials for printer authentication
const PRINTER_CREDENTIALS = {
  Honeywell: {
    username: 'itadmin',
    password: 'pass',
  },
  Zebra: {
    username: 'admin',
    password: '1234',
  },
};

/**
 * Create Basic Auth header
 */
function createBasicAuthHeader(username, password) {
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}

/**
 * Create fetch headers with Basic Auth
 */
function createFetchHeaders(printerType) {
  const creds = PRINTER_CREDENTIALS[printerType];
  if (!creds) return {};
  
  return {
    'Authorization': createBasicAuthHeader(creds.username, creds.password),
    'Content-Type': 'text/html',
  };
}

/**
 * Detect printer type from serial number or HTML content
 */
function detectPrinterType(serial, htmlContent) {
  // Check HTML content first for definitive indicators (preferred)
  if (htmlContent) {
    const html = htmlContent.toLowerCase();
    // Honeywell indicator: printer_status div class
    if (html.includes('printer_status')) {
      return 'Honeywell';
    }
    // Zebra indicator: Zebra Technologies or ZPL indicators
    if (html.includes('zebra technologies') || html.includes('zebra')) {
      return 'Zebra';
    }
  }

  // Fallback: Check serial number
  if (serial) {
    const serialStr = String(serial).toUpperCase();
    if (serialStr.includes('PX940') || serialStr.includes('PM43') || serialStr.includes('PM')) {
      return 'Honeywell';
    }
    if (serialStr.includes('ZEBRA') || serialStr.includes('GK') || serialStr.includes('ZM')) {
      return 'Zebra';
    }
  }

  return null;
}

function normalizePrinterText(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripStatusPrefix(value) {
  return normalizePrinterText(value).replace(/^(?:status|warning|error condition)\s*:?\s*/i, '').trim();
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function parseZebraFirmwareVersion(htmlContent) {
  const body = String(htmlContent || '');
  const regexes = [
    /([A-Z0-9.]+)\s+<-\s*.*?FIRMWARE/i,
    /(?:Firmware\s+Version|ZPL\s+Version)\s*:\s*([^\n<]*)/i,
  ];

  for (const rx of regexes) {
    const match = body.match(rx);
    if (match?.[1]) {
      const firmware = normalizePrinterText(match[1]);
      if (firmware) return firmware;
    }
  }

  return null;
}

function parseZebraCmToKm(htmlContent) {
  const body = String(htmlContent || '');
  const regexes = [
    /([\d,]+)\s*CM\s+NONRESET\s+CNTR/i,
    /NONRESET\s+CNTR[\s\S]{0,40}?([\d,]+)\s*CM/i,
    /(\d+(?:,\d{3})+|\d+)\s*cm(?![a-z])/i,
  ];

  for (const rx of regexes) {
    const match = body.match(rx);
    const raw = match?.[1];
    if (!raw) continue;

    const cm = Number(raw.replace(/,/g, ''));
    if (!Number.isNaN(cm)) {
      return roundToTwo(cm / 100000);
    }
  }

  return null;
}

function parseHoneywellFirmwareVersion(htmlContent) {
  const body = String(htmlContent || '');
  const regexes = [
    /Firmware\s+Version\s*<\/[^>]+>\s*<[^>]*>\s*([A-Za-z0-9._-]+)\s*</i,
    /Firmware\s+Version[\s\S]{0,100}?([A-Za-z0-9._-]{5,})/i,
  ];

  for (const rx of regexes) {
    const match = body.match(rx);
    if (match?.[1]) {
      const firmware = normalizePrinterText(match[1]);
      if (firmware) return firmware;
    }
  }

  return null;
}

function parseHoneywellMetersToKm(htmlContent) {
  const body = String(htmlContent || '');
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

/**
 * Parse Honeywell printer data from home page
 * Looks for: <div class="printer_status"><span>Printhead lifted</span></div>
 * And: <div class="home_concent_title">Firmware Version</div><div class="home_concent">H10.22.040778</div>
 */
function parseHoneywellData(htmlContent) {
  try {
    const result = {
      printerCondition: null,
      firmwareVersion: null,
    };

    if (!htmlContent) return result;

    // Extract Printer Condition from <div class="printer_status"><span>TEXT</span></div>
    const statusMatch = htmlContent.match(/<div[^>]*class="printer_status"[^>]*>.*?<span[^>]*>([^<]*)<\/span>/is);
    if (statusMatch) {
      let condition = statusMatch[1]
        .replace(/&nbsp;/g, ' ')
        .replace(/&#160;/g, ' ')
        .trim();
      if (condition) {
        result.printerCondition = condition;
      }
    }

    // Extract Firmware Version
    // Pattern: <div class="home_concent_title">Firmware Version</div><div class="home_concent">H10.22.040778</div>
    result.firmwareVersion = parseHoneywellFirmwareVersion(htmlContent);

    return result;
  } catch (e) {
    console.error('Error parsing Honeywell data:', e.message);
    return { printerCondition: null, firmwareVersion: null };
  }
}

/**
 * Parse Honeywell head run from tphInfo.lua
 * Looks for patterns like: "Printhead Distance: 12345 m"
 */
function parseHoneywellHeadRun(htmlContent) {
  try {
    if (!htmlContent) return null;

    return parseHoneywellMetersToKm(htmlContent);
  } catch (e) {
    console.error('Error parsing Honeywell head run:', e.message);
    return null;
  }
}

/**
 * Parse Zebra printer data from home page
 * Looks for Status: <font>READY</font> and Firmware Version in HTML
 */
function parseZebraData(htmlContent) {
  try {
    const result = {
      printerCondition: null,
      mainStatus: null,
      warning: null,
      firmwareVersion: null,
    };

    if (!htmlContent) return result;

    // Extract main status from: <h3>Status: <font color="GREEN">READY</font></h3>
    const statusMatch = htmlContent.match(/Status\s*:\s*<font[^>]*>(.*?)<\/font>/is);
    if (statusMatch) {
      const status = stripStatusPrefix(statusMatch[1]);
      result.mainStatus = status || null;
    }

    // Extract warnings like:
    // <font color="RED">WARNING RIBBON IN</font>
    // <font color="RED">ERROR CONDITION: PAPER OUT</font>
    const warningMatch = htmlContent.match(
      /<font[^>]*>\s*(?:WARNING|ERROR\s+CONDITION)\s*:?\s*([^<]*)<\/font>/is
    );
    if (warningMatch) {
      const warning = stripStatusPrefix(warningMatch[1]);
      result.warning = warning || null;
    }

    if (result.mainStatus) {
      result.printerCondition = result.mainStatus.toUpperCase() === 'READY'
        ? result.mainStatus
        : [result.mainStatus, result.warning].filter(Boolean).join(' - ');
    }

    // Firmware might be in HTML or in config
    // Looks for: "Firmware Version: V75.20.14Z" or "ZPL Version: ..."
    result.firmwareVersion = parseZebraFirmwareVersion(htmlContent);

    return result;
  } catch (e) {
    console.error('Error parsing Zebra data:', e.message);
    return { printerCondition: null, firmwareVersion: null };
  }
}

/**
 * Parse Zebra head run from config/stats page
 * Looks for patterns like: "Head Distance: 123456 cm" or "Printhead Distance: 123456 cm"
 */
function parseZebraHeadRun(htmlContent) {
  try {
    if (!htmlContent) return null;

    return parseZebraCmToKm(htmlContent);
  } catch (e) {
    console.error('Error parsing Zebra head run:', e.message);
    return null;
  }
}

/**
 * Fetch printer data from web interface
 * @param {string} ip - Printer IP address
 * @param {string} serial - Serial number (for type detection)
 * @returns {Promise<Object>} Printer data object
 */
export async function fetchPrinterData(ip, serial) {
  if (!ip) {
    return { error: 'No IP address provided' };
  }

  try {
    const baseUrl = `http://${ip}`;

    // Detect printer type first by checking serial
    let printerType = detectPrinterType(serial, '');
    
    // Fetch home page to detect printer type and get initial data
    let homeContent;
    let headers = {};
    
    try {
      // If we know it's Honeywell, use auth from start
      if (printerType === 'Honeywell') {
        headers = createFetchHeaders('Honeywell');
      }
      
      const homeResponse = await fetch(`${baseUrl}/index.html`, {
        method: 'GET',
        mode: 'cors',
        headers: headers,
        timeout: 5000,
      });

      if (!homeResponse.ok) {
        return { error: 'Web services are off' };
      }

      homeContent = await homeResponse.text();
    } catch (e) {
      return { error: 'Web services are off' };
    }

    // Detect printer type from content if not already detected
    if (!printerType) {
      printerType = detectPrinterType(serial, homeContent);
    }
    
    if (!printerType) {
      return { error: 'Unable to detect printer type' };
    }

    // Get proper headers for detected printer type
    headers = createFetchHeaders(printerType);

    let result = {
      ip,
      printerType,
      printerCondition: null,
      firmwareVersion: null,
      headRunKm: null,
    };

    if (printerType === 'Honeywell') {
      // Parse home page for condition and firmware
      const homeData = parseHoneywellData(homeContent);
      result.printerCondition = homeData.printerCondition;
      result.firmwareVersion = homeData.firmwareVersion;

      // Fetch Honeywell statistics page for firmware and head run
      try {
        const statsResponse = await fetch(`${baseUrl}/statistics/displaydata.lua`, {
          method: 'GET',
          mode: 'cors',
          headers: headers,
          timeout: 5000,
        });

        if (statsResponse.ok) {
          const statsContent = await statsResponse.text();
          result.firmwareVersion = parseHoneywellFirmwareVersion(statsContent) || result.firmwareVersion;
          result.headRunKm = parseHoneywellHeadRun(statsContent);
        }
      } catch (e) {
        console.warn('Could not fetch Honeywell statistics:', e.message);
      }
    } else if (printerType === 'Zebra') {
      // Parse home page for condition
      const homeData = parseZebraData(homeContent);
      result.printerCondition = homeData.printerCondition;
      result.firmwareVersion = homeData.firmwareVersion;

      // Fetch config page for firmware and head run
      try {
        const configResponse = await fetch(`${baseUrl}/config.html`, {
          method: 'GET',
          mode: 'cors',
          headers: headers,
          timeout: 5000,
        });

        if (configResponse.ok) {
          const configContent = await configResponse.text();

          // Try to get firmware from config if not found in home
          if (!result.firmwareVersion) {
            const configData = parseZebraData(configContent);
            result.firmwareVersion = configData.firmwareVersion;
          }

          // Get head run from config
          result.headRunKm = parseZebraHeadRun(configContent);
        }
      } catch (e) {
        console.warn('Could not fetch Zebra config:', e.message);
      }
    }

    if (!result.printerCondition && !result.firmwareVersion && result.headRunKm === null) {
      return { ...result, error: 'DATA NOT AVAILABLE' };
    }

    return result;
  } catch (e) {
    console.error('Error fetching printer data:', e.message);
    return { error: e.message };
  }
}

/**
 * Format serial number for Honeywell printers
 */
export function formatHoneywellSerial(serial) {
  if (!serial) return serial;
  const serialStr = String(serial).toUpperCase();
  if (!serialStr.startsWith('PX940V-')) {
    return `PX940V-${serialStr}`;
  }
  return serialStr;
}

/**
 * Get printer state display string
 */
export function getPrinterStateDisplay(data) {
  if (!data) return 'Unknown';
  if (data.error) return data.error;
  if (data.printerCondition) return data.printerCondition;
  return 'Unknown';
}
