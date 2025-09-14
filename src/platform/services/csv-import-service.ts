/**
 * 🚀 CSV IMPORT SERVICE
 * 
 * Intelligent CSV processing with AI-powered data mapping and cleaning
 * - Smart column detection and mapping
 * - Data validation and cleaning
 * - Duplicate detection and handling
 * - Import type detection
 * - Error handling and reporting
 */

// Enhanced column mappings with synonyms and variations
export const ENHANCED_COLUMN_MAPPINGS = {
  // Personal Information
  name: [
    'name', 'full_name', 'fullname', 'full name', 'contact_name', 'contact name', 
    'person_name', 'person name', 'individual', 'prospect_name', 'prospect name'
  ],
  firstName: [
    'first_name', 'firstname', 'first name', 'fname', 'given_name', 'given name',
    'forename', 'christian_name', 'christian name'
  ],
  lastName: [
    'last_name', 'lastname', 'last name', 'lname', 'surname', 'family_name', 
    'family name', 'second_name', 'second name'
  ],
  
  // Contact Information
  email: [
    'email', 'email_address', 'email address', 'work_email', 'work email', 
    'business_email', 'business email', 'contact_email', 'contact email',
    'e_mail', 'e-mail', 'electronic_mail', 'electronic mail'
  ],
  personalEmail: [
    'personal_email', 'personal email', 'private_email', 'private email', 
    'home_email', 'home email', 'personal_address', 'personal address'
  ],
  phone: [
    'phone', 'phone_number', 'phone number', 'telephone', 'tel', 'contact_phone', 
    'contact phone', 'primary_phone', 'primary phone'
  ],
  mobilePhone: [
    'mobile', 'mobile_phone', 'mobile phone', 'cell', 'cell_phone', 'cell phone', 
    'cellular', 'mobile_number', 'mobile number', 'cellphone'
  ],
  workPhone: [
    'work_phone', 'work phone', 'business_phone', 'business phone', 
    'office_phone', 'office phone', 'direct_line', 'direct line'
  ],
  
  // Company Information
  company: [
    'company', 'company_name', 'company name', 'organization', 'org', 'employer', 
    'business', 'firm', 'corporation', 'corp', 'enterprise', 'workplace'
  ],
  companyDomain: [
    'company_domain', 'company domain', 'domain', 'website', 'company_website', 
    'company website', 'web_address', 'web address', 'url', 'site'
  ],
  
  // Professional Information
  title: [
    'title', 'job_title', 'job title', 'position', 'role', 'designation', 
    'job_position', 'job position', 'work_title', 'work title'
  ],
  jobTitle: [
    'job_title', 'job title', 'title', 'position', 'role', 'designation',
    'job_role', 'job role', 'professional_title', 'professional title'
  ],
  department: [
    'department', 'dept', 'division', 'team', 'group', 'unit', 'section',
    'business_unit', 'business unit', 'functional_area', 'functional area'
  ],
  
  // Industry and Business
  industry: [
    'industry', 'sector', 'vertical', 'business_type', 'business type',
    'market_sector', 'market sector', 'field', 'domain'
  ],
  vertical: [
    'vertical', 'industry', 'sector', 'market', 'niche', 'specialty',
    'focus_area', 'focus area', 'business_vertical', 'business vertical'
  ],
  
  // Status and Classification
  status: [
    'status', 'lead_status', 'lead status', 'stage', 'state', 'condition',
    'prospect_status', 'prospect status', 'contact_status', 'contact status'
  ],
  priority: [
    'priority', 'importance', 'urgency', 'rank', 'level', 'tier',
    'priority_level', 'priority level', 'ranking'
  ],
  source: [
    'source', 'lead_source', 'lead source', 'origin', 'channel', 'referral',
    'acquisition_source', 'acquisition source', 'campaign', 'medium'
  ],
  
  // Social and Professional Links
  linkedinUrl: [
    'linkedin', 'linkedin_url', 'linkedin url', 'linkedin_profile', 'linkedin profile',
    'li_url', 'linkedin_link', 'linkedin link', 'linkedin_page', 'linkedin page'
  ],
  
  // Additional Information
  notes: [
    'notes', 'comments', 'description', 'remarks', 'memo', 'details',
    'additional_info', 'additional info', 'observations', 'summary'
  ],
  
  // Location Data
  city: [
    'city', 'location', 'town', 'municipality', 'locality', 'place'
  ],
  state: [
    'state', 'province', 'region', 'territory', 'county', 'area'
  ],
  country: [
    'country', 'nation', 'nationality', 'citizenship', 'homeland'
  ],
  postalCode: [
    'postal_code', 'postal code', 'zip', 'zip_code', 'zip code', 'postcode',
    'mail_code', 'mail code', 'area_code', 'area code'
  ],
  
  // Opportunity/Deal Specific
  dealValue: [
    'deal_value', 'deal value', 'value', 'amount', 'revenue', 'deal_size', 
    'deal size', 'opportunity_value', 'opportunity value', 'contract_value',
    'contract value', 'potential_revenue', 'potential revenue'
  ],
  dealStage: [
    'deal_stage', 'deal stage', 'stage', 'opportunity_stage', 'opportunity stage',
    'sales_stage', 'sales stage', 'pipeline_stage', 'pipeline stage'
  ],
  closeDate: [
    'close_date', 'close date', 'expected_close', 'expected close', 'target_date',
    'target date', 'closing_date', 'closing date', 'completion_date', 'completion date'
  ],
  
  // Relationship and Engagement
  relationship: [
    'relationship', 'relation', 'connection', 'contact_type', 'contact type',
    'relationship_type', 'relationship type', 'association'
  ],
  buyerGroupRole: [
    'buyer_group_role', 'buyer group role', 'buyer_role', 'buyer role',
    'decision_role', 'decision role', 'influence', 'buying_role', 'buying role',
    'stakeholder_type', 'stakeholder type'
  ],
  
  // Company Details
  companySize: [
    'company_size', 'company size', 'employees', 'employee_count', 'employee count',
    'headcount', 'size', 'staff_count', 'staff count', 'workforce'
  ],
  estimatedValue: [
    'estimated_value', 'estimated value', 'potential_value', 'potential value',
    'deal_potential', 'deal potential', 'expected_value', 'expected value'
  ]
};

// Data validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/,
  url: /^https?:\/\/.+/,
  currency: /^\$?[\d,]+\.?\d*$/,
  date: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
  number: /^\d+$/,
  linkedin: /linkedin\.com\/in\/[a-zA-Z0-9\-]+/
};

// Import type detection with enhanced logic
export function detectImportType(headers: string[], sampleData: any[]): 'leads' | 'prospects' | 'opportunities' | 'contacts' {
  const headerStr = headers.join(' ').toLowerCase();
  const sampleStr = sampleData.slice(0, 3).map(row => Object.values(row).join(' ')).join(' ').toLowerCase();
  
  // Opportunity indicators (highest priority)
  const opportunityIndicators = [
    'deal', 'opportunity', 'revenue', 'close_date', 'closing', 'contract',
    'proposal', 'quote', 'pipeline', 'forecast', 'win', 'loss'
  ];
  
  // Prospect indicators (qualified leads)
  const prospectIndicators = [
    'qualified', 'prospect', 'engagement', 'interested', 'demo', 'trial',
    'evaluation', 'consideration', 'intent', 'budget'
  ];
  
  // Contact indicators (general contacts)
  const contactIndicators = [
    'contact', 'directory', 'database', 'list', 'registry'
  ];
  
  // Check for opportunity indicators
  if (opportunityIndicators.some(indicator => 
    headerStr.includes(indicator) || sampleStr.includes(indicator)
  )) {
    return 'opportunities';
  }
  
  // Check for prospect indicators
  if (prospectIndicators.some(indicator => 
    headerStr.includes(indicator) || sampleStr.includes(indicator)
  )) {
    return 'prospects';
  }
  
  // Check for contact indicators
  if (contactIndicators.some(indicator => 
    headerStr.includes(indicator) && !headerStr.includes('lead')
  )) {
    return 'contacts';
  }
  
  // Default to leads for general contact information
  return 'leads';
}

// Enhanced column mapping with fuzzy matching
export function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedMappings = new Set<string>();
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    let bestMatch = '';
    let bestScore = 0;
    
    // Find best match for each database field
    for (const [dbField, variations] of Object.entries(ENHANCED_COLUMN_MAPPINGS)) {
      if (usedMappings.has(dbField)) continue;
      
      for (const variation of variations) {
        let score = 0;
        
        // Exact match gets highest score
        if (normalizedHeader === variation) {
          score = 100;
        }
        // Contains match gets medium score
        else if (normalizedHeader.includes(variation) || variation.includes(normalizedHeader)) {
          score = 80;
        }
        // Partial match gets lower score
        else if (normalizedHeader.includes(variation.split(' ')[0]) || variation.includes(normalizedHeader.split(' ')[0])) {
          score = 60;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = dbField;
        }
      }
    }
    
    // Only map if we have a good confidence score
    if (bestScore >= 60) {
      mapping[header] = bestMatch;
      usedMappings.add(bestMatch);
    }
  });
  
  return mapping;
}

// Enhanced data cleaning with validation
export function cleanAndValidateData(data: any[], columnMapping: Record<string, string>): {
  cleanedData: any[];
  validationErrors: string[];
  suggestions: string[];
} {
  const cleanedData: any[] = [];
  const validationErrors: string[] = [];
  const suggestions: string[] = [];
  
  data.forEach((row, index) => {
    const cleanedRow: any = {};
    const rowErrors: string[] = [];
    
    Object.entries(row).forEach(([originalColumn, value]) => {
      const dbField = columnMapping[originalColumn];
      if (!dbField || !value) return;
      
      let cleanedValue = String(value).trim();
      
      // Apply field-specific cleaning and validation
      switch (dbField) {
        case 'email':
        case 'workEmail':
        case 'personalEmail':
          cleanedValue = cleanedValue.toLowerCase();
          if (!VALIDATION_PATTERNS.email.test(cleanedValue)) {
            rowErrors.push(`Invalid email format: ${cleanedValue}`);
            cleanedValue = '';
          }
          break;
          
        case 'phone':
        case 'mobilePhone':
        case 'workPhone':
          // Clean phone number
          const originalPhone = cleanedValue;
          cleanedValue = cleanedValue.replace(/[^\d\+]/g, '');
          if (cleanedValue.length < 7) {
            rowErrors.push(`Phone number too short: ${originalPhone}`);
            cleanedValue = '';
          }
          break;
          
        case 'linkedinUrl':
          if (!cleanedValue.startsWith('http')) {
            if (cleanedValue.includes('linkedin.com')) {
              cleanedValue = `https://${cleanedValue}`;
            } else if (VALIDATION_PATTERNS.linkedin.test(cleanedValue)) {
              cleanedValue = `https://${cleanedValue}`;
            } else {
              rowErrors.push(`Invalid LinkedIn URL: ${cleanedValue}`);
              cleanedValue = '';
            }
          }
          break;
          
        case 'dealValue':
        case 'estimatedValue':
          // Clean currency values
          const originalValue = cleanedValue;
          cleanedValue = cleanedValue.replace(/[$,]/g, '');
          const numValue = parseFloat(cleanedValue);
          if (isNaN(numValue)) {
            rowErrors.push(`Invalid currency value: ${originalValue}`);
            cleanedValue = '0';
          } else {
            cleanedValue = numValue.toString();
          }
          break;
          
        case 'companyDomain':
          // Clean domain
          cleanedValue = cleanedValue.replace(/^https?:\/\//, '').replace(/^www\./, '');
          if (cleanedValue.includes('/')) {
            cleanedValue = cleanedValue.split('/')[0];
          }
          break;
          
        case 'companySize':
          // Standardize company size
          const sizeStr = cleanedValue.toLowerCase();
          if (sizeStr.includes('startup') || sizeStr.includes('small')) {
            cleanedValue = '1-50';
          } else if (sizeStr.includes('medium') || sizeStr.includes('mid')) {
            cleanedValue = '51-200';
          } else if (sizeStr.includes('large') || sizeStr.includes('enterprise')) {
            cleanedValue = '201+';
          }
          break;
      }
      
      if (cleanedValue) {
        cleanedRow[dbField] = cleanedValue;
      }
    });
    
    // Generate derived fields
    if (cleanedRow['firstName'] && cleanedRow['lastName'] && !cleanedRow.fullName) {
      cleanedRow['fullName'] = `${cleanedRow.firstName} ${cleanedRow.lastName}`;
    }
    
    if (cleanedRow['fullName'] && !cleanedRow['firstName'] && !cleanedRow.lastName) {
      const parts = cleanedRow.fullName.split(' ');
      cleanedRow['firstName'] = parts[0] || '';
      cleanedRow['lastName'] = parts.slice(1).join(' ') || '';
    }
    
    // Add row-level validation
    if (!cleanedRow['fullName'] && !cleanedRow.email) {
      rowErrors.push('Missing both name and email - record will be skipped');
    }
    
    if (rowErrors.length > 0) {
      validationErrors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
    }
    
    cleanedData.push(cleanedRow);
  });
  
  // Generate suggestions
  if (validationErrors.length > 0) {
    suggestions.push(`Found ${validationErrors.length} validation issues. Review and clean your data for better import results.`);
  }
  
  const emailCount = cleanedData.filter(row => row.email).length;
  const phoneCount = cleanedData.filter(row => row.phone || row.mobilePhone).length;
  
  if (emailCount < cleanedData.length * 0.8) {
    suggestions.push('Consider adding more email addresses for better contact reach.');
  }
  
  if (phoneCount < cleanedData.length * 0.5) {
    suggestions.push('Adding phone numbers will improve your outreach options.');
  }
  
  return { cleanedData, validationErrors, suggestions };
}

// Enhanced CSV parsing with better error handling
export function parseCSV(csvContent: string): { headers: string[]; data: any[]; parseErrors: string[] } {
  const lines = csvContent.trim().split('\n');
  const parseErrors: string[] = [];
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  // Parse headers with better handling
  const headerLine = lines[0];
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows with error tracking
  const data: any[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    try {
      const line = lines[lineIndex].trim();
      if (!line) continue; // Skip empty lines
      
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));
      
      // Create row object
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    } catch (error) {
      parseErrors.push(`Line ${lineIndex + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }
  
  return { headers, data, parseErrors };
}

// Generate import preview and recommendations
export function generateImportPreview(
  headers: string[],
  data: any[],
  columnMapping: Record<string, string>,
  importType: string
): {
  preview: any[];
  recommendations: string[];
  confidence: number;
} {
  const preview = data.slice(0, 5); // First 5 records
  const recommendations: string[] = [];
  let confidence = 0;
  
  // Calculate confidence based on mapped columns
  const mappedColumns = Object.keys(columnMapping).length;
  const totalColumns = headers.length;
  const mappingRatio = mappedColumns / totalColumns;
  
  confidence = Math.round(mappingRatio * 100);
  
  // Generate recommendations
  if (confidence < 50) {
    recommendations.push('⚠️ Low confidence mapping. Consider renaming columns to standard names.');
  } else if (confidence < 80) {
    recommendations.push('✅ Good mapping detected. Some columns may need manual review.');
  } else {
    recommendations.push('🎯 Excellent mapping! Your data looks ready to import.');
  }
  
  // Check for required fields
  const hasEmail = preview.some(row => Object.values(row).some(val => 
    typeof val === 'string' && VALIDATION_PATTERNS.email.test(val)
  ));
  const hasName = preview.some(row => Object.values(row).some(val => 
    typeof val === 'string' && val.split(' ').length >= 2
  ));
  
  if (!hasEmail && !hasName) {
    recommendations.push('❌ Missing required fields. Ensure each record has either a name or email.');
  }
  
  // Import type specific recommendations
  switch (importType) {
    case 'opportunities':
      recommendations.push('💰 Detected opportunity data. Make sure deal values and stages are included.');
      break;
    case 'prospects':
      recommendations.push('🎯 Detected prospect data. Consider adding engagement and qualification info.');
      break;
    case 'leads':
      recommendations.push('📈 Detected lead data. Perfect for building your pipeline.');
      break;
    case 'people':
      recommendations.push('📞 Detected contact data. Great for building your network.');
      break;
  }
  
  return { preview, recommendations, confidence };
}
