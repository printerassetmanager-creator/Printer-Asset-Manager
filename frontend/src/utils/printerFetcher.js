/**
 * Printer Data Fetcher & Parser
 * Fetches and parses data from Honeywell and Zebra printer web interfaces
 */

// Credentials for printer authentication
const PRINTER_CREDENTIALS = {
  Honeywell: {
    username: 'Itadmin',
    password: 'Pass',
  },
  Zebra: {
    username: 'Admin',
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
    const fwMatch = htmlContent.match(/<div[^>]*class="home_concent_title"[^>]*>\s*Firmware Version\s*<\/div>\s*<div[^>]*class="home_concent"[^>]*>([^<]*)<\/div>/i);
    if (fwMatch) {
      let firmware = fwMatch[1].trim();
      if (firmware) {
        result.firmwareVersion = firmware;
      }
    }

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

    // Look for patterns: "Printhead Distance: 12345 m" or similar
    const meterMatch = htmlContent.match(/(?:Printhead|Head).*?Distance[\s:]*(\d+(?:\.\d+)?)\s*m(?![a-z])/i);
    if (meterMatch) {
      const meters = parseFloat(meterMatch[1]);
      if (!isNaN(meters)) {
        return Math.round((meters / 1000) * 100) / 100; // Convert to KM, 2 decimals
      }
    }

    // Fallback: generic meter value search
    const genericMeterMatch = htmlContent.match(/(\d+(?:\.\d+)?)\s*m(?![a-z])/i);
    if (genericMeterMatch) {
      const meters = parseFloat(genericMeterMatch[1]);
      if (!isNaN(meters)) {
        return Math.round((meters / 1000) * 100) / 100;
      }
    }

    return null;
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
      firmwareVersion: null,
    };

    if (!htmlContent) return result;

    // Extract Printer Condition from Status: <font>VALUE</font>
    // Matches: <h3>Status: <font color="GREEN">READY</font></h3>
    const statusMatch = htmlContent.match(/Status\s*:\s*<font[^>]*>([^<]*)<\/font>/i);
    if (statusMatch) {
      let condition = statusMatch[1].trim();
      result.printerCondition = condition || null;
    }

    // Firmware might be in HTML or in config
    // Looks for: "Firmware Version: V75.20.14Z" or "ZPL Version: ..."
    const fwMatch = htmlContent.match(/(?:Firmware\s+Version|ZPL\s+Version)\s*:\s*([^\n<]*)/i);
    if (fwMatch) {
      let firmware = fwMatch[1].trim();
      result.firmwareVersion = firmware || null;
    }

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

    // Look for patterns: "Head Distance: 123456 cm" or "Printhead Distance: 123456 cm"
    const cmMatch = htmlContent.match(/(?:Head|Printhead)\s+Distance[\s:]*(\d+(?:\.\d+)?)\s*cm(?![a-z])/i);
    if (cmMatch) {
      const cm = parseFloat(cmMatch[1]);
      if (!isNaN(cm)) {
        return Math.round((cm / 100000) * 100) / 100; // Convert to KM, 2 decimals
      }
    }

    // Fallback: generic cm value search
    const genericCmMatch = htmlContent.match(/(\d+(?:\.\d+)?)\s*cm(?![a-z])/i);
    if (genericCmMatch) {
      const cm = parseFloat(genericCmMatch[1]);
      if (!isNaN(cm)) {
        return Math.round((cm / 100000) * 100) / 100;
      }
    }

    return null;
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

      // Fetch head run from tphInfo.lua
      try {
        const headResponse = await fetch(`${baseUrl}/statistics/tphInfo.lua`, {
          method: 'GET',
          mode: 'cors',
          headers: headers,
          timeout: 5000,
        });

        if (headResponse.ok) {
          const headContent = await headResponse.text();
          result.headRunKm = parseHoneywellHeadRun(headContent);
        }
      } catch (e) {
        console.warn('Could not fetch Honeywell head run:', e.message);
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
