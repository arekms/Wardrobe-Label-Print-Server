// ============================================================================
// LOGGER UTILITY - Winston-based Logging Configuration
// ============================================================================
// This module configures Winston logger for structured, multi-transport logging
// Logs are written to both files (for persistence) and console (for development)
// ============================================================================

const winston = require('winston');
const path = require('path');

// Define logs directory path relative to project root
const logDir = path.join(__dirname, '../logs');

/**
 * Configure and create Winston logger instance
 * Sets up both file-based and console-based logging with appropriate formatting
 */
const logger = winston.createLogger({
  // Default logging level can be overridden via LOG_LEVEL environment variable
  // Available levels: error, warn, info, http, debug, verbose, silly
  level: process.env.LOG_LEVEL || 'info',
  
  // Configure log output format with multiple formatters applied in sequence
  format: winston.format.combine(
    // Add timestamp to each log entry in format: YYYY-MM-DD HH:mm:ss
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Include full error stack traces for error logs
    winston.format.errors({ stack: true }),
    // Process string interpolation in log messages (e.g., %s, %d)
    winston.format.splat(),
    // Output logs in JSON format for structured logging/parsing
    winston.format.json()
  ),
  
  // Default metadata added to every log entry (identifies this service)
  defaultMeta: { service: 'wardrobe-label-print-server' },
  
  /**
   * Configure log output destinations (transports)
   * Each transport can have different configuration (level, format, etc.)
   */
  transports: [
    /**
     * ERROR LOG TRANSPORT
     * Writes only error-level logs to a dedicated error log file
     * Helps with troubleshooting by isolating error messages
     */
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),    // Path: logs/error.log
      level: 'error',                               // Only write errors
      maxsize: 5242880,                             // Max file size: 5MB
      maxFiles: 5                                   // Keep max 5 rotated files
    }),
    
    /**
     * COMBINED LOG TRANSPORT
     * Writes all log levels (debug through error) to a combined log file
     * Provides complete application activity history
     */
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),  // Path: logs/combined.log
      maxsize: 5242880,                             // Max file size: 5MB
      maxFiles: 5                                   // Keep max 5 rotated files
    })
  ]
});

/**
 * DEVELOPMENT ENVIRONMENT CONSOLE LOGGING
 * In development, also output logs to console with color formatting
 * This is disabled in production to avoid redundant output to terminals
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      // Colorize log level names for better readability (red for error, yellow for warn, etc.)
      winston.format.colorize(),
      // Custom format: timestamp [LEVEL]: message {metadata}
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        // Convert metadata object to formatted JSON string if present
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      })
    )
  }));
}

// Export configured logger instance for use throughout application
module.exports = logger;
