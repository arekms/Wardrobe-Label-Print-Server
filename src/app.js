// ============================================================================
// WARDROBE LABEL PRINT SERVER - Main Application Entry Point
// ============================================================================
// This application continuously polls a SQL Server database for label print
// requests, processes them through printing logic, and sends labels to a GoDex
// thermal printer via TCP socket connection.
// ============================================================================

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file explicitly from project root
// This is necessary to ensure consistent configuration across environments
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import core modules
const logger = require('../utils/logger');
const DatabaseService = require('../services/databaseService');
const PrinterService = require('../services/printerService');

/**
 * Main server class that orchestrates the label printing workflow
 * Handles server lifecycle (start/stop), database polling, and label printing
 */
class WardrobleLabelPrintServer {
  constructor() {
    // Initialize service instances for database and printer interaction
    this.databaseService = new DatabaseService();
    this.printerService = new PrinterService();
    
    // Track server state to prevent multiple simultaneous polling cycles
    this.isRunning = false;
    
    // Polling interval determines how frequently the database is checked
    // Defaults to 5000ms (5 seconds) if not specified in environment
    this.pollingInterval = parseInt(process.env.POLLING_INTERVAL || '5000', 10);
  }

  /**
   * Starts the server by establishing connections and initiating polling
   * - Connects to SQL Server database
   * - Connects to thermal printer
   * - Begins continuous polling cycle
   */
  async start() {
    // Prevent duplicate start attempts
    if (this.isRunning) {
      logger.warn('Server is already running');
      return;
    }

    try {
      logger.info('Starting Wardrobe Label Print Server...');
      
      // Establish connection to SQL Server database
      // Connection string and credentials are configured in DatabaseService
      await this.databaseService.connect();
      logger.info('Database connection established');

      // Establish connection to thermal printer via TCP socket
      // Printer IP and port configured in PrinterService
      await this.printerService.connect();
      logger.info('Printer connection established');

      // Mark server as running to allow polling loop to execute
      this.isRunning = true;
      logger.info(`Polling started. Interval: ${this.pollingInterval}ms`);

      // Begin the continuous polling loop that checks database for new work
      this.poll();
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Continuous polling loop that:
   * 1. Queries database for pending label print jobs
   * 2. Processes returned data and formats it for printing
   * 3. Sends labels to the printer
   * 4. Waits for polling interval before next cycle
   */
  async poll() {
    while (this.isRunning) {
      try {
        logger.debug('Polling database via stored procedure...');
        
        // The stored procedure USP_ProcessLabelPrint_2026 uses a two-phase approach:
        // Phase 1 (First run): Increments RunCount 0→1, performs data validation, returns empty result
        // Phase 2 (Second run): Increments RunCount 1→2, returns actual label data for printing
        // We call the procedure up to 2 times per cycle to handle both phases
        let labelDataArray = []
        let attempts = 0;
        const maxAttempts = 2; // Allow up to 2 consecutive calls per cycle

        // Retry logic: Keep calling procedure until we get data or reach max attempts
        while (labelDataArray.length === 0 && attempts < maxAttempts) {
          attempts++;
          
          // Execute stored procedure to fetch and process queued labels
          labelDataArray = await this.databaseService.processLabelQueue();
          
          // If no data returned and we haven't hit max attempts, retry after brief delay
          if (labelDataArray.length === 0 && attempts < maxAttempts) {
            logger.debug(`Stored procedure returned empty (attempt ${attempts}). Running again to process prepared data...`);
            // Small delay (100ms) allows the procedure to complete its preparation phase
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Process each label record returned from the database
        if (labelDataArray.length > 0) {
          logger.info(`Processing ${labelDataArray.length} label(s) from stored procedure`);

          // Iterate through each label returned for printing
          for (const row of labelDataArray) {
            try {
              // Parse FullItemName field which contains concatenated item attributes
              // Format example: "XL Coral T-Shirt" (Size Color Template)
              const fullItemNameParts = row.FullItemName ? row.FullItemName.split(' ').filter(p => p) : [];
              
              // Build label object with all necessary attributes for thermal printer
              // Maps database query results to printer-specific format
              const labelData = {
                queueId: row.LabelPrintQueueID,        // Queue ID for tracking
                itemId: row.ItemID,                     // Item identifier for inventory
                quantity: row.Quantity,                 // Number of labels to print
                barcode: row.ItemBarcode || '',         // Code128 barcode value
                size: fullItemNameParts[0] || '',       // Extract size (first word from FullItemName)
                color: row.ItemColor || '',             // Item color name
                template: row.ItemDescription || '',    // Template/product type
                department: row.ItemDepartment || '',   // Department designation
                className: row.ItemClass || ''          // Class information
              };
              
              // Send formatted label data to the thermal printer
              await this.printerService.printLabel(labelData);
              
              logger.info(`Label printed successfully for Barcode: ${row.ItemBarcode}, Quantity: ${row.Quantity}`);
            } catch (error) {
              logger.error(`Error printing label for queue entry ${row.LabelPrintQueueID}`, { error: error.message });
            }
          }
        } else {
          // No labels pending - this is normal operation during quiet periods
          logger.debug('No labels to process after procedure execution');
        }

        // Wait for configured polling interval before checking database again
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      } catch (error) {
        // Log any errors that occur during polling
        logger.error('Error during polling cycle', { error: error.message });
        // Continue polling despite errors - the server remains operational
        await new Promise(resolve => setTimeout(resolve, this.pollingInterval));
      }
    }
  }

  /**
   * Legacy method - label data is now directly passed from polling loop
   * Kept for backward compatibility reference only
   * TODO: Remove in future refactoring
   */
  async generateLabelData(entry, additionalInfo) {
    // This method is deprecated - label formatting now occurs in poll() method
    return entry;
  }

  /**
   * Gracefully shuts down the server
   * - Stops the polling loop
   * - Closes database connection
   * - Closes printer connection
   */
  async stop() {
    logger.info('Stopping server...');
    // Set flag to stop the polling loop on next iteration
    this.isRunning = false;
    
    try {
      // Close database connection pool
      await this.databaseService.disconnect();
      // Close printer TCP socket connection
      await this.printerService.disconnect();
      logger.info('Server stopped');
    } catch (error) {
      logger.error('Error stopping server', { error: error.message });
    }
  }
}

// ============================================================================
// SERVER INITIALIZATION AND PROCESS SIGNAL HANDLING
// ============================================================================

// Create server instance
const server = new WardrobleLabelPrintServer();

// Handle SIGINT signal (Ctrl+C) - gracefully shutdown the application
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Handle SIGTERM signal (termination from container/system) - gracefully shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Start the server and handle any initialization errors
server.start().catch(error => {
  logger.error('Fatal error', { error: error.message });
  process.exit(1);
});

// Export server class for testing and external use
module.exports = WardrobleLabelPrintServer;
