// ============================================================================
// TEST: SQL Server Connection Diagnostics
// ============================================================================
// This test script attempts multiple connection configurations to diagnose
// SQL Server connectivity issues. Tests different encryption and authentication
// settings to identify which configuration works for the environment.
// ============================================================================

const path = require('path');
const sql = require('mssql');

// Load environment variables from .env file FIRST
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
const requiredVars = ['WLPS_DB_SERVER', 'WLPS_DB_DATABASE', 'WLPS_DB_USERNAME', 'WLPS_DB_PASSWORD'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:', missingVars.join(', '));
  console.error('Please ensure .env file is properly configured.');
  process.exit(1);
}

/**
 * Array of different connection configurations to test
 * Uses environment variables - do NOT hardcode credentials
 * Tests various combinations of encryption and timeout settings
 */
const configs = [
  {
    name: 'Standard MSSQL (no encrypt)',
    config: {
      server: process.env.WLPS_DB_SERVER,
      database: process.env.WLPS_DB_DATABASE,
      user: process.env.WLPS_DB_USERNAME,
      password: process.env.WLPS_DB_PASSWORD,
      options: {
        encrypt: false,                             // Typical for local network
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'With encryption enabled',
    config: {
      server: process.env.WLPS_DB_SERVER,
      database: process.env.WLPS_DB_DATABASE,
      user: process.env.WLPS_DB_USERNAME,
      password: process.env.WLPS_DB_PASSWORD,
      options: {
        encrypt: true,                              // For secure connections
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'With domain format',
    config: {
      server: process.env.WLPS_DB_SERVER,
      database: process.env.WLPS_DB_DATABASE,
      user: process.env.WLPS_DB_USERNAME,
      password: process.env.WLPS_DB_PASSWORD,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000,
        instanceName: 'MSSQLSERVER'                 // Named instance specification
      }
    }
  }
];

/**
 * Test a single connection configuration
 * Attempts connection and executes a test query
 * 
 * @param {Object} testConfig - Configuration to test with name and config properties
 * @returns {boolean} true if connection successful, false otherwise
 */
async function testConnection(testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testConfig.name}`);
  console.log(`${'='.repeat(60)}`);
  // Display connection configuration (masking password)
  console.log('Config:', JSON.stringify({
    server: testConfig.config.server,
    database: testConfig.config.database,
    user: testConfig.config.user,
    password: '***',
    options: testConfig.config.options
  }, null, 2));

  try {
    // Create connection pool with test configuration
    const pool = new sql.ConnectionPool(testConfig.config);
    // Attempt to establish connection
    await pool.connect();
    console.log('✅ SUCCESS: Connected to database');
    
    // Execute simple query to verify functionality
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('Query result:', result.recordset[0]);
    
    // Close connection
    await pool.close();
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    if (error.code) console.log('Error code:', error.code);
    return false;
  }
}

/**
 * Execute all connection tests sequentially
 * Reports success rate and displays summary
 */
async function runAllTests() {
  console.log('SQL Server Connection Diagnostic Tests');
  console.log('Testing connectivity to: av-sql2');
  
  let successCount = 0;
  // Test each configuration
  for (const testConfig of configs) {
    const success = await testConnection(testConfig);
    if (success) successCount++;
  }

  // Display final summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${successCount}/${configs.length} tests passed`);
  console.log(`${'='.repeat(60)}`);
  // Exit with appropriate status code
  process.exit(successCount > 0 ? 0 : 1);
}

// Execute diagnostic tests
runAllTests();
