const net = require('net');

/**
 * Send DPL/ZPL script to printer via TCP socket on port 9100
 * @param {string} printerIp - Printer IP address
 * @param {string} script - DPL or ZPL script
 * @param {number} timeout - Connection timeout in ms (default 5000)
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendScriptToPrinter(printerIp, script, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let isResolved = false;

    // Check IP format
    if (!printerIp || typeof printerIp !== 'string') {
      return reject(new Error('Invalid printer IP address'));
    }

    // Set connection timeout
    const timeoutHandle = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        client.destroy();
        reject(new Error(`Connection timeout (${timeout}ms) to ${printerIp}`));
      }
    }, timeout);

    // Handle connection
    client.connect(9100, printerIp, () => {
      // Connection successful
      if (isResolved) return;

      // Send script
      client.write(script, 'utf8', (err) => {
        if (err) {
          isResolved = true;
          clearTimeout(timeoutHandle);
          client.destroy();
          reject(new Error(`Failed to send script: ${err.message}`));
          return;
        }

        // Wait a bit for printer to process, then close
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeoutHandle);
            client.end();
            resolve({
              success: true,
              message: `Script sent to ${printerIp} successfully`,
            });
          }
        }, 200);
      });
    });

    // Handle errors
    client.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        console.error(`Printer socket error for ${printerIp}:`, err.message);
        reject(new Error(err.message || 'Connection error'));
      }
    });

    // Handle unexpected close
    client.on('close', () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        resolve({
          success: true,
          message: `Script sent to ${printerIp}`,
        });
      }
    });
  });
}

/**
 * Check if printer is online via TCP connection
 * @param {string} printerIp - Printer IP address
 * @param {number} timeout - Connection timeout in ms (default 2000)
 * @returns {Promise<boolean>}
 */
async function isPrinterOnline(printerIp, timeout = 2000) {
  return new Promise((resolve) => {
    const client = new net.Socket();
    let isResolved = false;

    const timeoutHandle = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        client.destroy();
        resolve(false);
      }
    }, timeout);

    client.connect(9100, printerIp, () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        client.destroy();
        resolve(true);
      }
    });

    client.on('error', () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        resolve(false);
      }
    });
  });
}

module.exports = {
  sendScriptToPrinter,
  isPrinterOnline,
};
