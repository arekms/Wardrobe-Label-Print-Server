// Test print script - uses data from IMG_3103.JPG sample label
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PrinterService = require('./services/printerService');
const logger = require('./utils/logger');

async function testPrint() {
  try {
    logger.info('Starting test print...');
    
    const printerService = new PrinterService();
    
    // Connect to printer
    await printerService.connect();
    logger.info('Printer connected');
    
    // Create test label data from IMG_3103.JPG sample
    const testLabelData = {
      itemId: 5037000042,
      queueId: 0, // Test data
      quantity: 1,
      barcode: '5037000042',
      size: 'XL',
      color: 'Coral',
      template: 'T-Shirt',
      department: 'Food, Beverage, and Games',
      className: 'Food - Wackers Grill'
    };

    logger.info('Test label data:', testLabelData);
    
    // Generate ZPL
    const zpl = printerService.generateZPL(testLabelData);
    logger.info('Generated ZPL command:');
    console.log(zpl);
    logger.info('\n');
    
    // Send to printer
    logger.info('Sending label to printer...');
    await printerService.printLabel(testLabelData);
    
    logger.info('✅ Test print sent successfully!');
    await printerService.disconnect();
    
    process.exit(0);
  } catch (error) {
    logger.error('❌ Test print failed', { error: error.message });
    console.error(error);
    process.exit(1);
  }
}

testPrint();
