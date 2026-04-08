// ============================================================================
// DATABASE SERVICE - SQL Server Connection and Query Management
// ============================================================================
// This service handles all database interactions including:
// - Connection pool management to SQL Server
// - Execution of stored procedures for label processing
// - Legacy query methods for historical compatibility
// ============================================================================

const sql = require('mssql');
const logger = require('../utils/logger');

/**
 * Service class for managing SQL Server database connections and operations
 * Uses connection pooling for efficient resource management
 */
class DatabaseService {
  constructor() {
    /**
     * SQL Server connection configuration loaded from namespaced environment variables
     * WLPS_ prefix prevents conflicts with system env vars and other projects
     * NO HARDCODED FALLBACK VALUES - All credentials must come from .env file
     */
    
    // Validate required environment variables are set
    const requiredVars = ['WLPS_DB_SERVER', 'WLPS_DB_DATABASE', 'WLPS_DB_USERNAME', 'WLPS_DB_PASSWORD'];
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please configure .env file.`);
    }
    
    // Database credentials from environment with WLPS_ namespace
    const dbServer = process.env.WLPS_DB_SERVER;
    const dbDatabase = process.env.WLPS_DB_DATABASE;
    const dbUsername = process.env.WLPS_DB_USERNAME;
    const dbPassword = process.env.WLPS_DB_PASSWORD;
    const dbEncrypt = process.env.WLPS_DB_ENCRYPT === 'true' ? true : false;
    const dbTrustCert = process.env.WLPS_DB_TRUST_CERT !== 'false' ? true : false;
    const dbTimeout = parseInt(process.env.WLPS_DB_CONNECT_TIMEOUT || '30000', 10);
    
    this.config = {
      server: dbServer,                           // SQL Server hostname from WLPS_DB_SERVER
      database: dbDatabase,                       // Database name from WLPS_DB_DATABASE
      user: dbUsername,                           // Username from WLPS_DB_USERNAME
      password: dbPassword,                       // Password from WLPS_DB_PASSWORD
      options: {
        encrypt: dbEncrypt,                       // From WLPS_DB_ENCRYPT (default: false for local)
        trustServerCertificate: dbTrustCert,      // From WLPS_DB_TRUST_CERT (default: true)
        connectTimeout: dbTimeout,                // From WLPS_DB_CONNECT_TIMEOUT (default: 30s)
        requestTimeout: 30000                     // Fixed: 30 second request timeout
      }
    };
    
    // Connection pool will be initialized when connect() is called
    this.pool = null;
  }

  /**
   * Establishes connection to SQL Server using configured credentials
   * Creates a connection pool for efficient resource management
   * @throws {Error} If connection fails
   */
  async connect() {
    try {
      // Initialize connection pool with configured SQL Server settings
      this.pool = new sql.ConnectionPool(this.config);
      // Establish actual connection to the database
      await this.pool.connect();
      logger.info('Connected to SQL Server database');
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  /**
   * Closes the database connection pool gracefully
   * Should be called during application shutdown
   */
  async disconnect() {
    try {
      if (this.pool) {
        // Close all connections in the pool
        await this.pool.close();
        logger.info('Disconnected from database');
      }
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
    }
  }

  /**
   * Executes the stored procedure USP_ProcessLabelPrint_2026 to process label queue
   * This stored procedure handles:
   * - Retrieval of pending label print jobs from LabelPrintQueue
   * - Data assembly with item details (barcode, size, color, template, etc.)
   * - Two-phase processing: validation phase followed by execution phase
   * - RunCount tracking to manage multi-phase processing within a single cycle
   * 
   * @returns {Array} Array of label objects ready for printing
   * @throws {Error} If stored procedure execution fails
   */
  async processLabelQueue() {
    try {
      // Execute the stored procedure (no parameters required)
      // The procedure internally handles querying LabelPrintQueue and joining related tables
      const result = await this.pool
        .request()
        .execute('USP_ProcessLabelPrint_2026');

      logger.info(`Processed ${result.recordset.length} label(s) from queue`);
      return result.recordset;
    } catch (error) {
      logger.error('Error processing label queue via stored procedure', { error: error.message });
      throw error;
    }
  }

  /**
   * Legacy method: Retrieves additional item information for a given ItemID
   * Kept for backward compatibility - functionality now handled by stored procedure
   * 
   * Joins multiple tables to assemble complete item details:
   * - Item: Contains barcode and template reference
   * - ItemTemplate: Contains size and color IDs
   * - ItemClass: Contains item classification
   * - ItemDepartment: Contains department information
   * 
   * @param {number} itemId - The ItemID to fetch information for
   * @returns {Object} Item object with barcode, size, color, template, class, and department info
   * @throws {Error} If query fails
   */
  async getAdditionalInfo(itemId) {
    try {
      // Query and join multiple tables to get complete item information
      const result = await this.pool
        .request()
        .input('itemId', sql.Int, itemId)
        .query(`
          SELECT 
            i.ItemBarcode,
            s.Name AS SizeName,
            c.Name AS ColorName,
            t.Name AS TemplateName,
            cl.Name AS ClassName,
            d.Name AS DepartmentName
          FROM [dbo].[Item] i
          INNER JOIN [dbo].[ItemTemplate] t ON i.ItemTemplateID = t.ItemTemplateID
          INNER JOIN [dbo].[ItemClass] cl ON t.ItemClassID = cl.ItemClassID
          INNER JOIN [dbo].[ItemDepartment] d ON cl.ItemDepartmentID = d.ItemDepartmentID
          INNER JOIN [dbo].[ItemSize] s ON t.ItemSizeID = s.ItemSizeID
          INNER JOIN [dbo].[ItemColor] c ON t.ItemColorID = c.ItemColorID
          WHERE i.ItemID = @itemId
        `);

      return result.recordset[0] || {};
    } catch (error) {
      logger.error(`Error fetching additional info for ItemID ${itemId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Legacy method: Marks a queue entry as processed
   * Kept for backward compatibility - functionality now handled by stored procedure
   * 
   * Updates the LabelPrintQueue entry by setting:
   * - PrintDate to current timestamp (marks as processed)
   * - Increments RunCount (tracks processing attempts)
   * 
   * @param {number} queueId - The LabelPrintQueueID to mark as processed
   * @throws {Error} If update fails
   */
  async markAsProcessed(queueId) {
    try {
      // Update the queue entry with current timestamp and increment run counter
      await this.pool
        .request()
        .input('queueId', sql.Int, queueId)
        .query(`
          UPDATE [dbo].[LabelPrintQueue]
          SET PrintDate = GETDATE(), RunCount = ISNULL(RunCount, 0) + 1
          WHERE LabelPrintQueueID = @queueId
        `);

      logger.debug(`Marked queue entry ${queueId} as printed`);
    } catch (error) {
      logger.error(`Error marking queue entry ${queueId} as processed`, { error: error.message });
      throw error;
    }
  }
}

module.exports = DatabaseService;
