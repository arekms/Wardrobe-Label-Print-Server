const sql = require('mssql');

// Test different connection configurations
const configs = [
  {
    name: 'Standard MSSQL (no encrypt)',
    config: {
      server: 'av-sql2',
      database: 'Wardrobe01Prod',
      user: 'Wardrobe',
      password: 'FQq@Y67*Vaim',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'With encryption enabled',
    config: {
      server: 'av-sql2',
      database: 'Wardrobe01Prod',
      user: 'Wardrobe',
      password: 'FQq@Y67*Vaim',
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000
      }
    }
  },
  {
    name: 'With domain format',
    config: {
      server: 'av-sql2',
      database: 'Wardrobe01Prod',
      user: 'Wardrobe',
      password: 'FQq@Y67*Vaim',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        connectTimeout: 15000,
        requestTimeout: 15000,
        instanceName: 'MSSQLSERVER'
      }
    }
  }
];

async function testConnection(testConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testConfig.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Config:', JSON.stringify({
    server: testConfig.config.server,
    database: testConfig.config.database,
    user: testConfig.config.user,
    password: '***',
    options: testConfig.config.options
  }, null, 2));

  try {
    const pool = new sql.ConnectionPool(testConfig.config);
    await pool.connect();
    console.log('✅ SUCCESS: Connected to database');
    
    // Try a simple query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('Query result:', result.recordset[0]);
    
    await pool.close();
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    if (error.code) console.log('Error code:', error.code);
    return false;
  }
}

async function runAllTests() {
  console.log('SQL Server Connection Diagnostic Tests');
  console.log('Testing connectivity to: av-sql2');
  
  let successCount = 0;
  for (const testConfig of configs) {
    const success = await testConnection(testConfig);
    if (success) successCount++;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary: ${successCount}/${configs.length} tests passed`);
  console.log(`${'='.repeat(60)}`);
  process.exit(successCount > 0 ? 0 : 1);
}

runAllTests();
