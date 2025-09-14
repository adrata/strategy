/**
 * 🚀 CSV EXPORT UTILITY
 * 
 * Utilities for exporting data to CSV, Excel, and Google Sheets
 * Handles proper escaping, formatting, and file generation
 */

import * as fs from 'fs';
import * as path from 'path';

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  includeTimestamp?: boolean;
  outputDir?: string;
}

export interface ExcelExportOptions extends CSVExportOptions {
  sheetName?: string;
  includeFormatting?: boolean;
}

export interface GoogleSheetsOptions {
  spreadsheetName?: string;
  sheetName?: string;
  shareWithEmails?: string[];
  makePublic?: boolean;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: any[], 
  options: CSVExportOptions = {}
): { content: string; filename: string; path?: string } {
  
  if (!data || data['length'] === 0) {
    throw new Error('No data provided for CSV export');
  }

  // Generate filename
  const timestamp = options.includeTimestamp !== false 
    ? new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    : '';
  const filename = options.filename 
    ? `${options.filename}${timestamp ? `-${timestamp}` : ''}.csv`
    : `export-${timestamp}.csv`;

  // Determine headers
  const headers = options.headers || Object.keys(data[0]);
  
  // Generate CSV content
  const csvContent = generateCSVContent(data, headers);
  
  // Save to file if output directory specified
  let filePath: string | undefined;
  if (options.outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }
    
    filePath = path.join(options.outputDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf-8');
  }

  return {
    content: csvContent,
    filename,
    path: filePath
  };
}

/**
 * Export data to Excel format (requires xlsx library)
 */
export async function exportToExcel(
  data: any[], 
  options: ExcelExportOptions = {}
): Promise<{ filename: string; path?: string }> {
  
  // Note: This would require the 'xlsx' library to be installed
  // For now, we'll export as CSV with .xlsx extension as a placeholder
  
  const csvResult = exportToCSV(data, {
    ...options,
    filename: options.filename?.replace('.xlsx', '') || 'export'
  });
  
  const excelFilename = csvResult.filename.replace('.csv', '.xlsx');
  
  // In a real implementation, you would use:
  // const XLSX = require('xlsx');
  // const workbook = XLSX.utils.book_new();
  // const worksheet = XLSX.utils.json_to_sheet(data);
  // XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
  // XLSX.writeFile(workbook, excelFilename);
  
  console.log('📊 Excel export placeholder - would generate:', excelFilename);
  
  return {
    filename: excelFilename,
    path: options.outputDir ? path.join(options.outputDir, excelFilename) : undefined
  };
}

/**
 * Export data to Google Sheets (requires Google Sheets API)
 */
export async function exportToGoogleSheets(
  data: any[], 
  options: GoogleSheetsOptions = {}
): Promise<{ spreadsheetId: string; url: string }> {
  
  // Note: This would require Google Sheets API integration
  // For now, we'll return a placeholder
  
  const spreadsheetName = options.spreadsheetName || `Export ${new Date().toISOString().split('T')[0]}`;
  const sheetName = options.sheetName || 'Sheet1';
  
  // In a real implementation, you would use:
  // const { google } = require('googleapis');
  // const sheets = google.sheets({ version: 'v4', auth });
  // 
  // const resource = {
  //   properties: { title: spreadsheetName },
  //   sheets: [{ properties: { title: sheetName } }]
  // };
  // 
  // const spreadsheet = await sheets.spreadsheets.create({ resource });
  // const spreadsheetId = spreadsheet.data.spreadsheetId;
  // 
  // // Add data
  // const values = [Object.keys(data[0]), ...data.map(row => Object.values(row))];
  // await sheets.spreadsheets.values.update({
  //   spreadsheetId,
  //   range: `${sheetName}!A1`,
  //   valueInputOption: 'RAW',
  //   resource: { values }
  // });
  
  console.log('📊 Google Sheets export placeholder - would create:', spreadsheetName);
  
  const mockSpreadsheetId = process.env.GOOGLE_SHEETS_MOCK_ID || 'PLACEHOLDER_SPREADSHEET_ID';
  const mockUrl = `https://docs.google.com/spreadsheets/d/${mockSpreadsheetId}/edit`;
  
  return {
    spreadsheetId: mockSpreadsheetId,
    url: mockUrl
  };
}

/**
 * Generate CSV content from data array
 */
function generateCSVContent(data: any[], headers: string[]): string {
  // Escape CSV values
  const escapeCSVValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // If value contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  // Generate header row
  const headerRow = headers.map(escapeCSVValue).join(',');
  
  // Generate data rows
  const dataRows = data.map(row => 
    headers.map(header => escapeCSVValue(row[header])).join(',')
  );
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Utility to create export directory
 */
export function ensureExportDirectory(baseDir: string = './exports'): string {
  const exportDir = path.resolve(baseDir);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log(`📁 Created export directory: ${exportDir}`);
  }
  
  return exportDir;
}

/**
 * Clean old export files (older than specified days)
 */
export function cleanOldExports(exportDir: string, olderThanDays: number = 7): number {
  if (!fs.existsSync(exportDir)) {
    return 0;
  }
  
  const files = fs.readdirSync(exportDir);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  let deletedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(exportDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtime < cutoffDate) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned ${deletedCount} old export files from ${exportDir}`);
  }
  
  return deletedCount;
}

/**
 * Format data for better CSV presentation
 */
export function formatDataForExport(data: any[], formatOptions: {
  dateFormat?: 'iso' | 'us' | 'eu';
  numberFormat?: 'us' | 'eu';
  booleanFormat?: 'yes-no' | 'true-false' | '1-0';
  nullFormat?: 'empty' | 'null' | 'n/a';
} = {}): any[] {
  
  const {
    dateFormat = 'iso',
    numberFormat = 'us',
    booleanFormat = 'yes-no',
    nullFormat = 'empty'
  } = formatOptions;
  
  return data.map(row => {
    const formattedRow: any = {};
    
    for (const [key, value] of Object.entries(row)) {
      if (value === null || value === undefined) {
        formattedRow[key] = nullFormat === 'empty' ? '' : 
                           nullFormat === 'null' ? 'null' : 'N/A';
      } else if (typeof value === 'boolean') {
        formattedRow[key] = booleanFormat === 'yes-no' ? (value ? 'Yes' : 'No') :
                           booleanFormat === 'true-false' ? (value ? 'True' : 'False') :
                           value ? '1' : '0';
      } else if (typeof value === 'number') {
        formattedRow[key] = numberFormat === 'eu' ? 
          value.toString().replace('.', ',') : 
          value.toString();
      } else if (value instanceof Date) {
        formattedRow[key] = dateFormat === 'us' ? value.toLocaleDateString('en-US') :
                           dateFormat === 'eu' ? value.toLocaleDateString('en-GB') :
                           value.toISOString().split('T')[0];
      } else {
        formattedRow[key] = value;
      }
    }
    
    return formattedRow;
  });
}

/**
 * Generate export summary
 */
export function generateExportSummary(data: any[], exportType: string): {
  recordCount: number;
  columnCount: number;
  exportType: string;
  timestamp: string;
  estimatedFileSize: string;
} {
  const recordCount = data.length;
  const columnCount = data.length > 0 ? Object.keys(data[0]).length : 0;
  
  // Rough estimate of file size
  const avgRowSize = data.length > 0 ? 
    JSON.stringify(data[0]).length * 1.2 : // CSV is roughly 20% larger than JSON
    50; // Default estimate
  const estimatedBytes = recordCount * avgRowSize;
  const estimatedFileSize = estimatedBytes < 1024 ? `${estimatedBytes} bytes` :
                           estimatedBytes < 1024 * 1024 ? `${(estimatedBytes / 1024).toFixed(1)} KB` :
                           `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  
  return {
    recordCount,
    columnCount,
    exportType,
    timestamp: new Date().toISOString(),
    estimatedFileSize
  };
}
