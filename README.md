# Wardrobe Label Print Server

A Node.js application that continuously polls a Microsoft SQL Server database for new entries, generates barcode labels, and sends them to a GoDexRT700i thermal printer over the local network.

## Features

- **Database Polling**: Continuously monitors LabelPrintQueue table for entries with null PrintDate
- **Intelligent Querying**: Uses ItemID to fetch related information from joined tables (ItemTemplate, ItemClass, ItemDepartment, ItemSize, ItemColor)
- **Label Generation**: Creates professional thermal barcode labels with Morey's Piers branding
- **Network Printing**: Sends ZPL-formatted labels to GoDexRT700i printer via TCP socket (10.2.1.61:9100)
- **Quantity Support**: Prints multiple labels based on Quantity field in queue
- **Error Handling**: Robust error handling with detailed logging
- **Logging**: Comprehensive logging with Winston (combined.log and error.log)

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server
- GoDexRT700i printer accessible on local network 
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
cd c:\Apps\WLPS
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example file and update with your settings
copy .env.example .env
# Edit .env with your database and printer configuration
```

## Configuration

Edit the `.env` file with your specific settings:

### Database Configuration
- `DB_SERVER`: SQL Server address (av-sql2)
- `DB_DATABASE`: Database name (Wardrobe01Prod)
- `DB_USERNAME`: SQL Server username (Wardrobe)
- `DB_PASSWORD`: SQL Server password
- `DB_AUTH_TYPE`: Authentication type (default or azureActiveDirectory)
- `DB_ENCRYPT`: Enable encryption (true/false)
- `DB_TRUST_CERT`: Trust self-signed certificates (true/false)

### Printer Configuration
- `PRINTER_IP`: Printer IP address (10.2.1.61)
- `PRINTER_PORT`: Printer TCP port (9100)

### Label Queue Table Schema
The application monitors the `LabelPrintQueue` table:
```
LabelPrintQueueID [int] - Primary key
ItemTemplateID [int] - Template reference
ItemID [int] - Item ID for label content lookup
Quantity [int] - Number of labels to print
UserID [int] - User who initiated print request
CreateDate [datetime] - Queue entry creation time
PrintDate [datetime] - Print completion time (null = pending)
RunCount [int] - Number of print attempts
```

When `PrintDate` is NULL, the application:
1. Uses `ItemID` to query joined tables:
   - Item (for ItemBarcode)
   - ItemTemplate (for Name/Size/Color)
   - ItemClass (for classification)
   - ItemDepartment (for department)
   - ItemSize, ItemColor (for detailed info)
2. Generates label with format:
   - Line 1: {Size} {Color} {TemplateName}
   - Line 2: Code128 barcode graphic
   - Line 3: Numeric barcode
   - Line 4: {Department} {Class} | PROPERTY OF MOREY'S PIERS
3. Prints requested quantity
4. Updates PrintDate and RunCount

### Application Configuration
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `POLLING_INTERVAL`: Database poll interval in milliseconds (default: 5000)
with polling logic
├── services/
│   ├── databaseService.js     # LabelPrintQueue monitoring & SQL queries
│   └── printerService.js      # ZPL generation & printer TCP communication
├── utils/
│   └── logger.js              # Winston logger configuration
├── config/                    # Configuration files (future use)
├── models/                    # Data models (future use)
├── logs/                      # Log files (generated at runtime)
│   ├── error.log             # Error log
│   └── combined.log          # All log entries
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (created from .env.example)
├── .env.example              # Environment template
├── .gitignore
├── IMG_3103.JPG              # Sample label image
└── README.md
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Project Structure

```
c:\Apps\WLPS\
├── src/
│   └── app.js                 # Main application entry point
├── services/
│   ├── databaseService.js     # SQL Server polling logic
│   ├── printerService.js      # Printer communication
│   └── labelService.js        # Label generation (future)
├── utils/
│   └── logger.js              # Winston logger configuration
├── config/
├── models/
├── logs/                       # Log files (generated)
├── package.json               # Dependencies and scripts
├── .env.example               # Environment template
├── .gitignore
└── README.md                  # This file
```

## Development
table joins and select columns in `services/databaseService.js`
2. **Label layout**: Modify ZPL commands in `services/printerService.js` generateZPL() method
3. **Printer communication**: Extend TCP socket handling in `services/printerService.js`

### Key Classes & Methods

**DatabaseService:**
- `connect()` - Connect to SQL Server
- `processLabelQueue()` - Execute USP_ProcessLabelPrint_2026 stored procedure for continuous polling
- `getAdditionalInfo(itemId)` - Fetch label data via joined query (legacy, not actively used)
- `markAsProcessed(queueId)` - Update PrintDate after printing (legacy, not actively used)

**PrinterService:**
- `connect()` - Test connection t av-sql2
- Test connectivity: `ping av-sql2`
- Confirm database: `Wardrobe01Prod` exists
- Verify user `Wardrobe` has appropriate permissions
- Check credentials in .env file
- Ensure firewall allows SQL Server (port 1433)

### Printer Connection Issues
- Ping printer: `ping 10.2.1.61`
- Verify printer is powered on and networked
- Check that port 9100 is accessible
- Test with Telnet: `telnet 10.2.1.61 9100`
- Verify PRINTER_IP and PRINTER_PORT in .env
- Check printer web interface at `http://10.2.1.61`

### General Debugging
- Set `LOG_LEVEL=debug` in .env for more detailed output
- Check `logs/error.log` for error messages
- Check `logs/combined.log` for all operations
- Monitor database for processed vs pending items
- Review queue entry data in LabelPrintQueue table
### Database Connection Issues
- Verify SQL Server is running and accessible
- Check DB_SERVER format (use `server,port` for TCP/IP connections)
- Ensure DB_USERNAME and DB_PASSWORD are correct
- Check firewall settings

### Printer Connection Issues
- Ping the printer IP address to verify network connectivity
- Check that PRINTER_IP is correct (10.2.1.61)
- Verify printer is powered on and connected to network
- Check log files in `logs/` directory for details

### General Debugging
- Set `LOG_LEVEL=debug` in .env for more detailed logging
- Check `logs/error.log` and `logs/combined.log` for error messages
- Ensure .env file is in the project root

## Notes

- The application uses polling to check for new entries at regular intervals
- Failed print jobs are logged but don't stop the polling process
- The server can be stopped gracefully with Ctrl+C
- Log files are automatically rotated when they exceed 5MB

## License

ISC

## Support

For issues or questions, check the logs directory for detailed error information.
