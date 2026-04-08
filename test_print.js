// ============================================================================
// TEST: Thermal Printer Label Generation and Printing
// ============================================================================
// This test script validates printer connectivity and label generation
// without requiring database queries. Uses sample label data based on
// actual requirements documented in IMG_3103.JPG
// Usage: node test_print.js
// ============================================================================

const path = require('path');
// Load environment configuration
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import printer service and logger
const PrinterService = require('./services/printerService');
const logger = require('./utils/logger');

/**
 * Test the printer connection and label generation/printing workflow
 * Creates a test label and sends it to the printer
 */
async function testPrint() {
  try {
    logger.info('Starting test print...');
    
    // Initialize printer service
    const printerService = new PrinterService();
    
    // Establish connection to thermal printer via TCP socket
    await printerService.connect();
    logger.info('Printer connected');
    
    /**
     * Create test label data matching actual warehouse requirements
     * Data structure corresponds to fields from IMG_3103.JPG sample label
     */
    const testLabelData = {
      itemId: 5037000042,                                // Sample barcode number
      queueId: 0,                                         // Test data (not from queue)
      quantity: 1,                                        // Print 1 label
      barcode: '5037000042',                              // Code128 barcode value
      size: 'XL',                                         // Garment size
      color: 'Coral',                                     // Item color
      template: 'T-Shirt',                                // Product template/type
      department: 'Food, Beverage, and Games',            // Department name
      className: 'Food - Wackers Grill'                   // Class/category
    };

    logger.info('Test label data:', testLabelData);
    
    /**
     * Generate ZPL (Zebra Programming Language) command
     * ZPL is the thermal printer command language
     */
    const zpl = printerService.generateZPL(testLabelData);
    logger.info('Generated ZPL command:');
    console.log(zpl);
    logger.info('\n');
    
    // Send formatted label to printer for output
    logger.info('Sending label to printer...');
    await printerService.printLabel(testLabelData);
    
    logger.info('✅ Test print sent successfully!');
    // Close printer connection
    await printerService.disconnect();
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Test print failed', { error: error.message });
    console.error(error);
    process.exit(1);
  }
}

// Execute test
testPrint();
