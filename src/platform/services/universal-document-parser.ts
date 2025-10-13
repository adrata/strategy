/**
 * 📄 UNIVERSAL DOCUMENT PARSER
 * 
 * Comprehensive document parsing service that handles all major file types:
 * - Spreadsheets: CSV, XLSX, XLS, ODS, Numbers
 * - Documents: PDF, DOC, DOCX, TXT, MD, RTF, ODT, Pages
 * - Presentations: PPT, PPTX, ODP, KEY
 * - Images: PNG, JPG, JPEG, GIF, BMP, SVG, WebP, TIFF (OCR)
 * - Data formats: JSON, XML, YAML
 * - Archives: ZIP, RAR, 7Z, TAR, GZ
 */

export interface ParsedDocument {
  fileName: string;
  fileType: string;
  fileSize: number;
  content: {
    text?: string;
    tables?: any[][];
    images?: string[];
    metadata?: Record<string, any>;
  };
  structure: {
    pages?: number;
    sheets?: string[];
    slides?: number;
    sections?: string[];
  };
  extractedData: {
    companies?: string[];
    contacts?: any[];
    emails?: string[];
    phones?: string[];
    urls?: string[];
  };
  confidence: number;
  parseTime: number;
  errors: string[];
}

export interface ParsingOptions {
  extractTables?: boolean;
  extractImages?: boolean;
  extractContacts?: boolean;
  ocrImages?: boolean;
  maxFileSize?: number; // in MB
  timeout?: number; // in seconds
}

export class UniversalDocumentParser {
  private static readonly DEFAULT_OPTIONS: ParsingOptions = {
    extractTables: true,
    extractImages: false,
    extractContacts: true,
    ocrImages: false,
    maxFileSize: 50, // 50MB default limit
    timeout: 30 // 30 seconds
  };

  /**
   * Main parsing method - detects file type and routes to appropriate parser
   */
  static async parseDocument(
    file: File,
    options: ParsingOptions = {}
  ): Promise<ParsedDocument> {
    const startTime = Date.now();
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    console.log(`📄 [PARSER] Starting parse: ${file.name} (${this.formatFileSize(file.size)})`);
    
    // Validate file size
    if (file.size > opts.maxFileSize! * 1024 * 1024) {
      throw new Error(`File too large. Maximum size is ${opts.maxFileSize}MB`);
    }
    
    const fileExtension = this.getFileExtension(file.name);
    const mimeType = file.type;
    
    let result: ParsedDocument;
    
    try {
      // Route to appropriate parser based on file type
      switch (fileExtension) {
        // Spreadsheets
        case 'csv':
          result = await this.parseCSV(file, opts);
          break;
        case 'xlsx':
        case 'xls':
        case 'ods':
        case 'gsheet': // Google Sheets export
          result = await this.parseSpreadsheet(file, opts);
          break;
        
        // Documents
        case 'pdf':
          result = await this.parsePDF(file, opts);
          break;
        case 'doc':
        case 'docx':
        case 'odt':
        case 'rtf':
        case 'gdoc': // Google Docs export
          result = await this.parseWordDocument(file, opts);
          break;
        case 'txt':
        case 'md':
          result = await this.parseTextDocument(file, opts);
          break;
        
        // Presentations
        case 'ppt':
        case 'pptx':
        case 'odp':
        case 'gslides': // Google Slides export
          result = await this.parsePresentation(file, opts);
          break;
        
        // Images
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'bmp':
        case 'webp':
        case 'tiff':
          result = await this.parseImage(file, opts);
          break;
        
        // Data formats
        case 'json':
          result = await this.parseJSON(file, opts);
          break;
        case 'xml':
          result = await this.parseXML(file, opts);
          break;
        
        // Archives
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
          result = await this.parseArchive(file, opts);
          break;
        
        default:
          result = await this.parseGenericFile(file, opts);
      }
      
      result['parseTime'] = Date.now() - startTime;
      console.log(`✅ [PARSER] Completed: ${file.name} in ${result.parseTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ [PARSER] Error parsing ${file.name}:`, error);
      
      return {
        fileName: file.name,
        fileType: fileExtension,
        fileSize: file.size,
        content: {},
        structure: {},
        extractedData: {},
        confidence: 0,
        parseTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown parsing error']
      };
    }
  }

  /**
   * Parse CSV files
   */
  private static async parseCSV(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines['length'] === 0) {
      throw new Error('CSV file is empty');
    }
    
    const headers = this.parseCSVLine(lines[0]);
    const data: any[][] = [];
    const errors: string[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCSVLine(lines[i]);
        if (row.length > 0) {
          data.push(row);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }
    
    // Extract structured data
    const extractedData = options.extractContacts ? 
      this.extractContactsFromTable([headers, ...data]) : {};
    
    return {
      fileName: file.name,
      fileType: 'csv',
      fileSize: file.size,
      content: {
        text,
        tables: [headers, ...data],
      },
      structure: {
        sheets: ['Sheet1']
      },
      extractedData,
      confidence: errors['length'] === 0 ? 1.0 : Math.max(0.5, 1 - (errors.length / lines.length)),
      parseTime: 0,
      errors
    };
  }

  /**
   * Parse Excel/Spreadsheet files
   */
  private static async parseSpreadsheet(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    try {
      // Dynamic import to avoid bundle bloat
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      const tables: any[][] = [];
      let allText = '';
      
      // Process all sheets
      sheetNames.forEach(sheetName => {
        const worksheet = workbook['Sheets'][sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          tables.push(jsonData as any[][]);
          
          // Convert to text for search
          const sheetText = jsonData.map((row: any[]) => 
            row.map(cell => String(cell || '')).join('\t')
          ).join('\n');
          allText += `Sheet: ${sheetName}\n${sheetText}\n\n`;
        }
      });
      
      // Extract structured data
      const extractedData = options['extractContacts'] && tables.length > 0 ? 
        this.extractContactsFromTable(tables[0]) : {};
      
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: {
          text: allText,
          tables
        },
        structure: {
          sheets: sheetNames
        },
        extractedData,
        confidence: 1.0,
        parseTime: 0,
        errors: []
      };
      
    } catch (error) {
      console.error('Excel parsing error:', error);
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: {
          text: `Excel file: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nError parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        structure: {
          sheets: ['Error']
        },
        extractedData: {},
        confidence: 0.1,
        parseTime: 0,
        errors: [error instanceof Error ? error.message : 'Excel parsing failed']
      };
    }
  }

  /**
   * Parse Excel data specifically for import processing
   */
  public static async parseExcelData(file: File): Promise<{ tables: any[][], sheets: string[] }> {
    try {
      // Dynamic import to avoid bundle bloat
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      const tables: any[][] = [];
      
      // Process all sheets
      sheetNames.forEach(sheetName => {
        const worksheet = workbook['Sheets'][sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          tables.push(jsonData as any[][]);
        }
      });
      
      return {
        tables,
        sheets: sheetNames
      };
      
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse PDF files - Server-side only
   */
  private static async parsePDF(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // Browser environment - send to server for processing
        const formData = new FormData();
        formData.append('file', file);
        formData.append('options', JSON.stringify(options));
        
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        
        return await response.json();
      }
      
      // Server environment - use pdf-parse directly
      const pdfParse = await import('pdf-parse');
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = await pdfParse.default(Buffer.from(arrayBuffer));
      
      const extractedData = options.extractContacts ? 
        this.extractContactsFromText(pdfData.text) : {};
      
      return {
        fileName: file.name,
        fileType: 'pdf',
        fileSize: file.size,
        content: {
          text: pdfData.text
        },
        structure: {
          pages: pdfData.numpages
        },
        extractedData,
        confidence: 1.0,
        parseTime: 0,
        errors: []
      };
      
    } catch (error) {
      console.error('PDF parsing error:', error);
      return {
        fileName: file.name,
        fileType: 'pdf',
        fileSize: file.size,
        content: {
          text: `PDF Document: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nError parsing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        structure: {
          pages: 1
        },
        extractedData: {},
        confidence: 0.1,
        parseTime: 0,
        errors: [error instanceof Error ? error.message : 'PDF parsing failed']
      };
    }
  }

  /**
   * Parse Word documents
   */
  private static async parseWordDocument(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    try {
      // Dynamic import to avoid bundle bloat
      const mammoth = await import('mammoth');
      
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const extractedData = options.extractContacts ? 
        this.extractContactsFromText(result.value) : {};
      
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: {
          text: result.value
        },
        structure: {
          sections: result.value.split('\n\n').length > 1 ? ['Multiple Sections'] : ['Single Section']
        },
        extractedData,
        confidence: 1.0,
        parseTime: 0,
        errors: result.messages.map(msg => msg.message)
      };
      
    } catch (error) {
      console.error('Word document parsing error:', error);
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: {
          text: `Word Document: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nError parsing Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        structure: {
          sections: ['Error']
        },
        extractedData: {},
        confidence: 0.1,
        parseTime: 0,
        errors: [error instanceof Error ? error.message : 'Word document parsing failed']
      };
    }
  }

  /**
   * Parse text documents (TXT, MD)
   */
  private static async parseTextDocument(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    const text = await file.text();
    const extractedData = options.extractContacts ? this.extractContactsFromText(text) : {};
    
    return {
      fileName: file.name,
      fileType: this.getFileExtension(file.name),
      fileSize: file.size,
      content: { text },
      structure: {
        sections: text.split('\n\n').length > 1 ? ['Multiple Sections'] : ['Single Section']
      },
      extractedData,
      confidence: 1.0,
      parseTime: 0,
      errors: []
    };
  }

  /**
   * Parse presentations (PPT, PPTX)
   */
  private static async parsePresentation(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    try {
      // Basic text extraction for presentations
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = `Presentation: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\n`;
      
      // Try to extract readable text from the presentation file
      try {
        const uint8Array = new Uint8Array(arrayBuffer);
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(uint8Array);
        
        // Extract readable text segments
        const textMatches = rawText.match(/[a-zA-Z0-9\s.,!?;:'"()-]{10,}/g);
        if (textMatches && textMatches.length > 0) {
          extractedText += 'Extracted slide content:\n' + textMatches.slice(0, 15).join('\n');
        } else {
          extractedText += 'Binary presentation file - full parsing requires specialized libraries.';
        }
      } catch (textError) {
        extractedText += 'Binary presentation file - text extraction limited.';
      }
      
      const extractedData = options.extractContacts ? 
        this.extractContactsFromText(extractedText) : {};
      
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: { text: extractedText },
        structure: {
          slides: 1 // Would need proper parsing to count slides
        },
        extractedData,
        confidence: 0.6,
        parseTime: 0,
        errors: ['Full presentation parsing requires specialized libraries - basic text extraction used']
      };
      
    } catch (error) {
      console.error('Presentation parsing error:', error);
      return {
        fileName: file.name,
        fileType: this.getFileExtension(file.name),
        fileSize: file.size,
        content: {
          text: `Presentation: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nError parsing presentation: ${error instanceof Error ? error.message : 'Unknown error'}`
        },
        structure: {
          slides: 1
        },
        extractedData: {},
        confidence: 0.1,
        parseTime: 0,
        errors: [error instanceof Error ? error.message : 'Presentation parsing failed']
      };
    }
  }

  /**
   * Parse images (with optional OCR)
   */
  private static async parseImage(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return {
      fileName: file.name,
      fileType: this.getFileExtension(file.name),
      fileSize: file.size,
      content: {
        text: options.ocrImages ? 
          'OCR text extraction would go here with proper OCR library' : 
          `Image file: ${file.name}`,
        images: [`data:${file.type};base64,${base64}`]
      },
      structure: {},
      extractedData: {},
      confidence: options.ocrImages ? 0.3 : 1.0,
      parseTime: 0,
      errors: options.ocrImages ? ['OCR requires additional libraries'] : []
    };
  }

  /**
   * Parse JSON files
   */
  private static async parseJSON(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    const text = await file.text();
    let parsedData: any;
    let errors: string[] = [];
    
    try {
      parsedData = JSON.parse(text);
    } catch (error) {
      errors.push('Invalid JSON format');
      parsedData = {};
    }
    
    const extractedData = options.extractContacts ? 
      this.extractContactsFromJSON(parsedData) : {};
    
    return {
      fileName: file.name,
      fileType: 'json',
      fileSize: file.size,
      content: {
        text: JSON.stringify(parsedData, null, 2)
      },
      structure: {
        sections: Object.keys(parsedData)
      },
      extractedData,
      confidence: errors['length'] === 0 ? 1.0 : 0.5,
      parseTime: 0,
      errors
    };
  }

  /**
   * Parse XML files
   */
  private static async parseXML(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    const text = await file.text();
    
    return {
      fileName: file.name,
      fileType: 'xml',
      fileSize: file.size,
      content: { text },
      structure: {},
      extractedData: {},
      confidence: 0.8,
      parseTime: 0,
      errors: []
    };
  }

  /**
   * Parse archive files
   */
  private static async parseArchive(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    return {
      fileName: file.name,
      fileType: this.getFileExtension(file.name),
      fileSize: file.size,
      content: {
        text: `Archive: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nNote: Archive extraction requires additional libraries.`
      },
      structure: {},
      extractedData: {},
      confidence: 0.3,
      parseTime: 0,
      errors: ['Archive parsing requires additional libraries']
    };
  }

  /**
   * Parse generic/unknown files
   */
  private static async parseGenericFile(file: File, options: ParsingOptions): Promise<ParsedDocument> {
    let text: string;
    let errors: string[] = [];
    
    try {
      text = await file.text();
    } catch (error) {
      text = `Binary file: ${file.name}\nSize: ${this.formatFileSize(file.size)}\nType: ${file.type}`;
      errors.push('Unable to extract text from binary file');
    }
    
    return {
      fileName: file.name,
      fileType: this.getFileExtension(file.name) || 'unknown',
      fileSize: file.size,
      content: { text },
      structure: {},
      extractedData: {},
      confidence: errors['length'] === 0 ? 0.7 : 0.3,
      parseTime: 0,
      errors
    };
  }

  /**
   * Extract contacts from table data
   */
  private static extractContactsFromTable(tableData: any[][]): any {
    if (tableData.length < 2) return {};
    
    const headers = tableData[0];
    const rows = tableData.slice(1);
    
    const companies: string[] = [];
    const contacts: any[] = [];
    const emails: string[] = [];
    const phones: string[] = [];
    
    // Find relevant columns
    const companyCol = this.findColumnIndex(headers, ['company', 'organization', 'org', 'business']);
    const nameCol = this.findColumnIndex(headers, ['name', 'full_name', 'fullname', 'contact']);
    const emailCol = this.findColumnIndex(headers, ['email', 'e-mail', 'mail']);
    const phoneCol = this.findColumnIndex(headers, ['phone', 'telephone', 'mobile', 'cell']);
    
    rows.forEach(row => {
      if (companyCol >= 0 && row[companyCol]) {
        companies.push(row[companyCol]);
      }
      if (emailCol >= 0 && row[emailCol]) {
        emails.push(row[emailCol]);
      }
      if (phoneCol >= 0 && row[phoneCol]) {
        phones.push(row[phoneCol]);
      }
      if (nameCol >= 0 && row[nameCol]) {
        contacts.push({
          name: row[nameCol],
          company: companyCol >= 0 ? row[companyCol] : null,
          email: emailCol >= 0 ? row[emailCol] : null,
          phone: phoneCol >= 0 ? row[phoneCol] : null
        });
      }
    });
    
    return {
      companies: [...new Set(companies)],
      contacts,
      emails: [...new Set(emails)],
      phones: [...new Set(phones)]
    };
  }

  /**
   * Extract contacts from text
   */
  private static extractContactsFromText(text: string): any {
    const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
    const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || [];
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];
    
    return {
      emails: [...new Set(emails)],
      phones: [...new Set(phones)],
      urls: [...new Set(urls)]
    };
  }

  /**
   * Extract contacts from JSON data
   */
  private static extractContactsFromJSON(data: any): any {
    const result: any = {
      companies: [],
      contacts: [],
      emails: [],
      phones: []
    };
    
    const extractFromObject = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.entries(obj).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();
        
        if (lowerKey.includes('company') && typeof value === 'string') {
          result.companies.push(value);
        } else if (lowerKey.includes('email') && typeof value === 'string') {
          result.emails.push(value);
        } else if (lowerKey.includes('phone') && typeof value === 'string') {
          result.phones.push(value);
        } else if (Array.isArray(value)) {
          value.forEach(extractFromObject);
        } else if (typeof value === 'object') {
          extractFromObject(value);
        }
      });
    };
    
    extractFromObject(data);
    
    // Remove duplicates
    result['companies'] = [...new Set(result.companies)];
    result['emails'] = [...new Set(result.emails)];
    result['phones'] = [...new Set(result.phones)];
    
    return result;
  }

  /**
   * Utility methods
   */
  private static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  }

  private static findColumnIndex(headers: string[], searchTerms: string[]): number {
    return headers.findIndex(header => 
      searchTerms.some(term => 
        header.toLowerCase().includes(term)
      )
    );
  }
}
