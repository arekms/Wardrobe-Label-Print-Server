const sql = require('mssql');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    // Configure for SQL Server authentication (username/password)
    // IMPORTANT: Credentials are hardcoded to prevent system env vars from interfering
    // (System may have DB_DATABASE=helpdesk from other projects, would cause failures)
    this.config = {
      server: 'av-sql2',
      database: 'Wardrobe01Prod',
      user: 'Wardrobe',
      password: 'FQq@Y67*Vaim',
      options: {
        encrypt: false, // Set to false for local network connections
        trustServerCertificate: true,
        connectTimeout: 30000,
        requestTimeout: 30000
      }
    };
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = new sql.ConnectionPool(this.config);
      await this.pool.connect();
      logger.info('Connected to SQL Server database');
    } catch (error) {
      logger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.close();
        logger.info('Disconnected from database');
      }
    } catch (error) {
      logger.error('Error disconnecting from database', { error: error.message });
    }
  }

  async processLabelQueue() {
    try {
      // Call the stored procedure USP_ProcessLabelPrint_2026
      // This procedure handles all label processing logic including
      // barcode generation, data assembly, and history tracking
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

  async getNewEntries() {
    try {
      const result = await this.pool
        .request()
        .query(`
          SELECT TOP 100 
            lpq.LabelPrintQueueID,
            lpq.ItemID,
            lpq.Quantity,
            lpq.CreateDate
          FROM [dbo].[LabelPrintQueue] lpq
          WHERE lpq.PrintDate IS NULL
          ORDER BY lpq.CreateDate ASC
        `);

      return result.recordset;
    } catch (error) {
      logger.error('Error fetching new entries', { error: error.message });
      throw error;
    }
  }

  async getAdditionalInfo(itemId) {
    try {
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

  async markAsProcessed(queueId) {
    try {
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
