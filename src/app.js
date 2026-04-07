const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const logger = require('../utils/logger');
const DatabaseService = require('../services/databaseService');
const PrinterService = require('../services/printerService');

class WardrobleLabelPrintServer {
  constructor() {
    this.databaseService = new DatabaseService();
    this.printerService = new PrinterService();
    this.isRunning = false;
    this.pollingInterval = parseInt(process.env.POLLING_INTERVAL || '5000', 10);
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Server is already running');
      return;
    }

    try {
      logger.info('Starting Wardrobe Label Print Server...');
      
      // Initialize database connection
      await this.databaseService.connect();
      logger.info('Database connection established');

      // Initialize printer connection
      await this.printerService.connect();
      logger.info('Printer connection established');

      this.isRunning = true;
      logger.info(`Polling started. Interval: ${this.pollingInterval}ms`);

      // Start polling loop
      this.poll();
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  async poll() {
    while (this.isRunning) {
      try {
        logger.debug('Polling database via stored procedure...');
        
        // USP_ProcessLabelPrint_2026 has a two-run behavior:
        // - First run: Increments RunCount 0→1, validates, returns empty (preparation phase)
        // - Second run: Increments RunCount 1→2, processes data, returns labels (execution phase)
        // To handle this, call the procedure until we get actual data
        let labelDataArray = []
        let attempts = 0;
        const maxAttempts = 2; // Allow up to 2 consecutive calls per cycle

        while (labelDataArray.length === 0 && attempts < maxAttempts) {
          attempts++;
          
          // Call stored procedure to process label queue
          labelDataArray = await this.databaseService.processLabelQueue();
          
          if (labelDataArray.length === 0 && attempts < maxAttempts) {
            logger.debug(`Stored procedure returned empty (attempt ${attempts}). Running again to process prepared data...`);
            // Small delay before retry to allow procedure to complete previous iteration
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        if (labelDataArray.length > 0) {
          logger.info(`Processing ${labelDataArray.length} label(s) from stored procedure`);

          for (const row of labelDataArray) {
            try {
              // Map stored procedure output to label data structure
              // FullItemName format: "Size Color Template"
              const fullItemNameParts = row.FullItemName ? row.FullItemName.split(' ').filter(p => p) : [];
              
              const labelData = {
                queueId: row.LabelPrintQueueID,
                itemId: row.ItemID,
                quantity: row.Quantity,
                barcode: row.ItemBarcode || '',
                size: fullItemNameParts[0] || '', // Extract size (first word from FullItemName)
                color: row.ItemColor || '',
                template: row.ItemDescription || '',
                department: row.ItemDepartment || '',
                className: row.ItemClass || ''
              };
              
              // Send to printer
              await this.printerService.printLabel(labelData);
              
              logger.info(`Label printed successfully for Barcode: ${row.ItemBarcode}, Quantity: ${row.Quantity}`);
            } catch (error) {
              logger.error(`Error printing label for queue entry ${row.LabelPrintQueueID}`, { error: error.message });
            }
          }
        } else {
          logger.debug('No labels to process after procedure execution');
        }

        // Wait before next poll cycle
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      } catch (error) {
        logger.error('Error during polling cycle', { error: error.message });
        // Continue polling despite errors
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      }
    }
  }

  async generateLabelData(entry, additionalInfo) {
    // Label data is now passed directly from polling loop
    // This method is no longer needed but kept for reference
    return entry;
  }

  async stop() {
    logger.info('Stopping server...');
    this.isRunning = false;
    
    try {
      await this.databaseService.disconnect();
      await this.printerService.disconnect();
      logger.info('Server stopped');
    } catch (error) {
      logger.error('Error stopping server', { error: error.message });
    }
  }
}

// Initialize and start the server
const server = new WardrobleLabelPrintServer();

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

server.start().catch(error => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});

module.exports = WardrobleLabelPrintServer;
