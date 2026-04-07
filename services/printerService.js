const net = require('net');
const logger = require('../utils/logger');

class PrinterService {
  constructor() {
    this.printerIp = process.env.PRINTER_IP || '10.2.1.61';
    this.printerPort = process.env.PRINTER_PORT || 9100;
    this.connected = false;
  }

  async connect() {
    try {
      // Test TCP connection to printer
      return new Promise((resolve, reject) => {
        const testSocket = net.createConnection({
          host: this.printerIp,
          port: this.printerPort,
          timeout: 5000
        });

        testSocket.on('connect', () => {
          testSocket.destroy();
          this.connected = true;
          logger.info(`Connected to printer at ${this.printerIp}:${this.printerPort}`);
          resolve();
        });

        testSocket.on('error', (err) => {
          this.connected = false;
          logger.warn(`Printer not responding at ${this.printerIp}:${this.printerPort}`, { error: err.message });
          resolve(); // Don't reject - we'll retry on print attempt
        });

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

  async disconnect() {
    try {
      this.connected = false;
      logger.info('Disconnected from printer');
    } catch (error) {
      logger.error('Error disconnecting from printer', { error: error.message });
    }
  }

  async printLabel(labelData) {
    try {
      // Convert label data to printer-compatible format (ZPL - Zebra Programming Language)
      const zplCommand = this.generateZPL(labelData);

      // Send to printer via TCP socket (port 9100 is standard for Zebra printers)
      await this.sendToPrinter(zplCommand);

      logger.info(`Label sent to printer for barcode: ${labelData.barcode}`);
    } catch (error) {
      logger.error('Error sending label to printer', { error: error.message });
      throw error;
    }
  }

  async sendToPrinter(zplData) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.printerIp,
        port: this.printerPort,
        timeout: 10000
      });

      socket.on('connect', () => {
        socket.write(zplData, (err) => {
          if (err) {
            socket.destroy();
            reject(err);
          } else {
            socket.end();
            resolve();
          }
        });
      });

      socket.on('error', (err) => {
        reject(new Error(`Printer connection error: ${err.message}`));
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Printer connection timeout'));
      });

      socket.on('end', () => {
        resolve();
      });
    });
  }

  generateZPL(labelData) {
    // Generate Zebra Programming Language for GoDexRT700i thermal printer
    // Label: 4x2 inches (812x406 dots at 203 DPI)
    // Barcode centered horizontally and sized to fit within single label
    
    const topText = `${labelData.size} ${labelData.color} ${labelData.template}`.trim();
    const bottomText = `${labelData.department} ${labelData.className}`.trim();
    const barcodeNumeric = labelData.barcode.replace(/[^0-9]/g, '').slice(0, 10).padEnd(10, '0');

    const zpl = `^XA
^MMT
^PW812
^LL406
^FT0,42^A0N,26,31^FB812,1,0,C^FH\\^FD${topText}^FS
^BY6,2.5,75^FT150,145^BCN,90,N,N,N^FH\^FD>;${barcodeNumeric}^FS
^FT350,165^A0N,19,22^FH\\^FD${barcodeNumeric}^FS
^FT100,190^A0N,14,17^FH\\^FD${bottomText}^FS
^FT570,170^A0N,18,22^FH\\^FDPROPERTY OF^FS
^FT570,190^A0N,18,22^FH\\^FDMOREY'S PIERS^FS
^XZ`;

    return zpl;
  }
}

module.exports = PrinterService;
