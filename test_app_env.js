// Test that mimics exactly what the app does
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Expected .env path:', path.join(__dirname, '.env'));

const result = require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('dotenv result:', result);
console.log('');

const sql = require('mssql');

console.log('Environment variables loaded:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('');

const config = {
  server: process.env.DB_SERVER || 'av-sql2',
  database: process.env.DB_DATABASE || 'Wardrobe01Prod',
  user: process.env.DB_USERNAME || 'Wardrobe',
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10),
    requestTimeout: 30000
  }
};

console.log('Connection config:', {
  server: config.server,
  database: config.database,
  user: config.user,
  password: config.password ? '***' : 'NOT SET',
  options: config.options
});
console.log('');

async function test() {
  try {
    console.log('Attempting to connect...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Successfully connected!');
    
    const result = await pool.request().query('SELECT TOP 5 LabelPrintQueueID, ItemID, Quantity, CreateDate FROM LabelPrintQueue');
    console.log('✅ Query successful - Found', result.recordset.length, 'records in LabelPrintQueue');
    console.log('Sample data:', result.recordset);
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('Error code:', error.code);
    if (error.originalError) {
      console.log('Original error:', error.originalError.message);
    }
    process.exit(1);
  }
}

test();
