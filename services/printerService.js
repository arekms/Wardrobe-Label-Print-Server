// ============================================================================
// PRINTER SERVICE - Thermal Printer TCP Communication and ZPL Generation
// ============================================================================
// This service handles all interactions with the GoDexRT700i thermal printer:
// - TCP socket connection management (port 9100)
// - Zebra Programming Language (ZPL) command generation
// - Label formatting and sending to printer
// ============================================================================

const net = require('net');
const logger = require('../utils/logger');

/**
 * Service class for managing thermal printer communication
 * Uses TCP sockets to communicate with GoDexRT700i printer
 */
class PrinterService {
  constructor() {
    // Printer network IP address (GoDexRT700i on local network)
    // Can be overridden via PRINTER_IP environment variable
    this.printerIp = process.env.PRINTER_IP || '10.2.1.61';
    
    // Printer TCP port (9100 is standard for Zebra thermal printers)
    // Can be overridden via PRINTER_PORT environment variable
    this.printerPort = process.env.PRINTER_PORT || 9100;
    
    // Connection state flag (true if printer is responsive)
    this.connected = false;
  }

  /**
   * Tests connectivity to the thermal printer
   * Attempts to create a TCP connection and immediately closes it
   * Does NOT reject on failure - allows app to continue (printer may be offline temporarily)
   * @returns {Promise} Resolves regardless of success (for graceful degradation)
   */
  async connect() {
    try {
      // Test TCP connection to printer using Promise wrapper for async handling
      return new Promise((resolve, reject) => {
        // Create test socket connection to printer IP and port
        const testSocket = net.createConnection({
          host: this.printerIp,
          port: this.printerPort,
          timeout: 5000  // 5 second timeout for connection attempt
        });

        // Connection successful - close socket and mark as connected
        testSocket.on('connect', () => {
          testSocket.destroy();  // Close test connection
          this.connected = true;
          logger.info(`Connected to printer at ${this.printerIp}:${this.printerPort}`);
          resolve();
        });

        // Connection failed - log warning but don't reject
        // This allows application to continue; print may retry later
        testSocket.on('error', (err) => {
          this.connected = false;
          logger.warn(`Printer not responding at ${this.printerIp}:${this.printerPort}`, { error: err.message });
          resolve(); // Don't reject - we'll retry on print attempt
        });

        // Connection timeout - log warning and continue
        testSocket.on('timeout', () => {
          testSocket.destroy();
          this.connected = false;
          logger.warn(`Printer connection timeout at ${this.printerIp}:${this.printerPort}`);
          resolve();
        });
      });
    } catch (error) {
      logger.warn(`Error testing printer connection`, { error: error.message });
    }
  }

  /**
   * Marks printer service as disconnected
   * Since we use stateless TCP connections per print job,
   * this mainly updates internal state for logging and monitoring
   */
  async disconnect() {
    try {
      // Set connection flag to false
      this.connected = false;
      logger.info('Disconnected from printer');
    } catch (error) {
      logger.error('Error disconnecting from printer', { error: error.message });
    }
  }

  /**
   * Main method to send a label to printer
   * Workflow: labelData → ZPL generation → TCP transmission → printer
   * 
   * @param {Object} labelData - Label information object containing:
   *   - barcode: Code128 barcode value
   *   - size: Item size (e.g., 'XL')
   *   - color: Item color (e.g., 'Coral')
   *   - template: Product type (e.g., 'T-Shirt')
   *   - department: Department designation
   *   - className: Item class/category
   * @throws {Error} If printing fails
   */
  async printLabel(labelData) {
    try {
      // Convert label data object to ZPL (Zebra Programming Language) command string
      // ZPL is the command language understood by GoDexRT700i printer
      const zplCommand = this.generateZPL(labelData);

      // Send ZPL command to printer via TCP socket connection (port 9100)
      // This is the standard communication method for thermal printers
      await this.sendToPrinter(zplCommand);

      logger.info(`Label sent to printer for barcode: ${labelData.barcode}`);
    } catch (error) {
      logger.error('Error sending label to printer', { error: error.message });
      throw error;
    }
  }

  /**
   * Low-level TCP socket communication with printer
   * Creates connection, sends ZPL data, handles response and cleanup
   * 
   * @param {String} zplData - ZPL (Zebra Programming Language) command string
   * @returns {Promise} Resolves when data sent successfully, rejects on error
   * @private Used internally by printLabel()
   */
  async sendToPrinter(zplData) {
    return new Promise((resolve, reject) => {
      // Create TCP socket connection to printer
      const socket = net.createConnection({
        host: this.printerIp,
        port: this.printerPort,
        timeout: 10000  // 10 second timeout for socket communication
      });

      // Connection established - send ZPL data to printer
      socket.on('connect', () => {
        // Write ZPL command to socket with callback for error handling
        socket.write(zplData, (err) => {
          if (err) {
            // Write failed - cleanup and reject
            socket.destroy();
            reject(err);
          } else {
            // Write successful - close socket gracefully and resolve
            socket.end();
            resolve();
          }
        });
      });

      // Connection error occurred
      socket.on('error', (err) => {
        reject(new Error(`Printer connection error: ${err.message}`));
      });

      // Socket communication timeout
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Printer connection timeout'));
      });

      // Socket closed by printer or after successful transmission
      socket.on('end', () => {
        resolve();
      });
    });
  }

  /**
   * Generate Zebra Programming Language (ZPL) command for thermal printer
   * ZPL is the command language used by GoDexRT700i and compatible Zebra printers
   * 
   * Label format specifications:
   * - Physical size: 4" x 2" (standard Morey's label format)
   * - Resolution: 203 DPI (Dots Per Inch)
   * - Dimensions: 812 x 406 dots
   * - Layout: Multi-line with barcode centered and branded footer
   * 
   * @param {Object} labelData - Formatted label data object
   * @returns {String} ZPL command string ready for printer transmission
   */
  generateZPL(labelData) {
    // First line combines size, color, and product template name
    // Example: "XL Coral T-Shirt"
    const topText = `${labelData.size} ${labelData.color} ${labelData.template}`.trim();
    
    // Second line footer shows department and classification
    // Example: "Food, Beverage, and Games Food - Wackers Grill"
    const bottomText = `${labelData.department} ${labelData.className}`.trim();
    
    // Extract numeric barcode, remove any non-digits, limit to 10 digits, pad with zeros if needed
    // Code128 can handle variable length but standardizing to 10 for consistency
    const barcodeNumeric = labelData.barcode.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '0');

    /**
     * ZPL Command Breakdown:
     * ^XA - Start of label
     * ^MMT - Monochrome mode with thermal transfer
     * ^PW812 - Print width in dots (812 = 4" at 203 DPI)
     * ^LL406 - Label length in dots (406 = 2" at 203 DPI)
     * ^FT - Field position (x,y coordinates)
     * ^A0N - Font selection (0 = built-in, N = normal)
     * ^FB - Field block (width, lines, spaces, justification)
     * ^FH - Field hex for special characters
     * ^FD - Field data (the actual text)
     * ^FS - Field separator (end of field)
     * ^BY - Barcode orientation and density settings
     * ^BCN - Code128 barcode type
     * ^XZ - End of label
     */
const zpl = `^XA
^MMT
^PW812
^LL406
^FT0,50^A0N,26,31^FB812,1,0,C^FH\\^FD${topText}^FS
^BY6,2.5,75^FT150,153^BCN,90,N,N,N^FH\^FD>;${barcodeNumeric}^FS
^FT350,173^A0N,19,22^FH\\^FD${barcodeNumeric}^FS
^FT100,198^A0N,14,17^FH\\^FD${bottomText}^FS
^FT570,176^A0N,18,22^FH\\^FDPROPERTY OF^FS
^FT570,196^A0N,18,22^FH\\^FDMOREY'S PIERS^FS
^XZ`;

    return zpl;
  }
}

// Export PrinterService for use in other modules
module.exports = PrinterService;
