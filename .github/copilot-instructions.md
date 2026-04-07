<!-- Custom instructions for Wardrobe Label Print Server project -->

## Project Overview
Wardrobe Label Print Server is a Node.js application that continuously polls a Microsoft SQL Server database, detects new entries in LabelPrintQueue, queries additional information using ItemID, generates barcode labels, and sends them to a GoDexRT700i printer on the local network.

## Project Setup Checklist

- [x] Create copilot-instructions.md file
- [x] Scaffold the Project
- [x] Customize the Project (Database credentials and table structure configured)
- [x] Install Required Extensions (No extensions needed for Node.js)
- [x] Compile the Project (Dependencies installed successfully)
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## Configuration Notes
The application is now fully deployed and operational:
1. ✅ SQL Server connectivity verified at av-sql2
2. ✅ Database credentials configured for user 'Wardrobe' in Wardrobe01Prod
3. ✅ Printer connectivity established on network (10.2.1.61:9100)
4. ✅ Application actively polling LabelPrintQueue table
5. ✅ Polling interval set to 5000ms (5 seconds)

### Important Note on Environment Variables
The application hardcodes production database credentials to prevent interference from system environment variables. The Wardrobe user account has access to Wardrobe01Prod database from the Node.js application running on the local network, just as the Apache/PHP application does.

## Key Technologies
- Node.js runtime
- mssql package for SQL Server connectivity
- Thermal label printing via TCP socket to Zebra printer
- Polling mechanism for database monitoring
- Winston for comprehensive logging

## Database Schema
The application polls the following joined tables:
- LabelPrintQueue (main queue table)
- Item (barcode information)
- ItemTemplate (size/color/template names)
- ItemClass (classification)
- ItemDepartment (department information)
- ItemSize (size information)
- ItemColor (color information)

## Label Format
Generated labels include:
- Line 1: Size Color Template Name (e.g., "XL Coral T-Shirt")
- Line 2: Code128 barcode graphic
- Line 3: Numeric barcode value
- Line 4: Left (ItemDepartment ItemClass) | Right (PROPERTY OF MOREY'S PIERS)

## Development Notes
- Polling interval should be configurable via environment variables
- Database connection string should be stored in .env file
- Printer IP: 10.2.1.61, Port: 9100
- ZPL (Zebra Programming Language) is used for label generation
- All operations are logged to logs/combined.log and logs/error.log

