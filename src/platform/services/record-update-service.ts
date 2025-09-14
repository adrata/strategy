/**
 * Real-time Record Update Service
 * 
 * Handles parsing AI commands and updating records in real-time
 */

interface UpdateCommand {
  field: string;
  value: string;
  recordId: string;
  recordType: string;
}

interface ParsedCommand {
  action: 'update' | 'unknown';
  updates: UpdateCommand[];
  originalText: string;
}

export class RecordUpdateService {
  /**
   * Parse AI command text to extract update instructions
   */
  static parseUpdateCommand(text: string, currentRecord: any, recordType: string): ParsedCommand {
    const result: ParsedCommand = {
      action: 'unknown',
      updates: [],
      originalText: text
    };

    if (!currentRecord || !recordType) {
      return result;
    }

    const lowerText = text.toLowerCase();
    
    // Check if this is an update command
    const updateKeywords = ['update', 'change', 'set', 'modify', 'edit'];
    const isUpdateCommand = updateKeywords.some(keyword => lowerText.includes(keyword));
    
    if (!isUpdateCommand) {
      return result;
    }

    result['action'] = 'update';

    // Parse phone number updates
    const phoneRegex = /(?:phone|number|mobile|cell).*?(?:to|is|=)\s*([0-9\-\(\)\s\+\.]{10,})/gi;
    const phoneMatch = phoneRegex.exec(text);
    if (phoneMatch) {
      result.updates.push({
        field: 'phone',
        value: phoneMatch[1].trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    // Parse email updates
    const emailRegex = /(?:email).*?(?:to|is|=)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const emailMatch = emailRegex.exec(text);
    if (emailMatch) {
      result.updates.push({
        field: 'email',
        value: emailMatch[1].trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    // Parse title/job title updates
    const titleRegex = /(?:title|job title|position).*?(?:to|is|=)\s*"([^"]+)"|(?:title|job title|position).*?(?:to|is|=)\s*([A-Za-z\s]+?)(?:\.|$|,)/gi;
    const titleMatch = titleRegex.exec(text);
    if (titleMatch) {
      result.updates.push({
        field: 'jobTitle',
        value: (titleMatch[1] || titleMatch[2]).trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    // Parse company updates
    const companyRegex = /(?:company).*?(?:to|is|=)\s*"([^"]+)"|(?:company).*?(?:to|is|=)\s*([A-Za-z\s]+?)(?:\.|$|,)/gi;
    const companyMatch = companyRegex.exec(text);
    if (companyMatch) {
      result.updates.push({
        field: 'company',
        value: (companyMatch[1] || companyMatch[2]).trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    // Parse status updates
    const statusRegex = /(?:status).*?(?:to|is|=)\s*"([^"]+)"|(?:status).*?(?:to|is|=)\s*([A-Za-z\s]+?)(?:\.|$|,)/gi;
    const statusMatch = statusRegex.exec(text);
    if (statusMatch) {
      result.updates.push({
        field: 'status',
        value: (statusMatch[1] || statusMatch[2]).trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    // Parse notes updates
    const notesRegex = /(?:notes?|note).*?(?:to|is|=)\s*"([^"]+)"/gi;
    const notesMatch = notesRegex.exec(text);
    if (notesMatch) {
      result.updates.push({
        field: 'notes',
        value: notesMatch[1].trim(),
        recordId: currentRecord.id,
        recordType
      });
    }

    return result;
  }

  /**
   * Execute record updates via API
   */
  static async executeUpdates(updates: UpdateCommand[]): Promise<{ success: boolean; message: string; updatedFields: string[] }> {
    if (updates['length'] === 0) {
      return { success: false, message: 'No updates to execute', updatedFields: [] };
    }

    try {
      const updatedFields: string[] = [];
      
      // Group updates by record
      const updatesByRecord = updates.reduce((acc, update) => {
        const key = `${update.recordType}-${update.recordId}`;
        if (!acc[key]) {
          acc[key] = { recordId: update.recordId, recordType: update.recordType, fields: {} };
        }
        acc[key].fields[update.field] = update.value;
        updatedFields.push(update.field);
        return acc;
      }, {} as Record<string, { recordId: string; recordType: string; fields: Record<string, string> }>);

      // Execute updates for each record
      for (const [key, recordUpdate] of Object.entries(updatesByRecord)) {
        const apiEndpoint = `/api/data/${recordUpdate.recordType}/${recordUpdate.recordId}`;
        
        const response = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recordUpdate.fields),
        });

        if (!response.ok) {
          throw new Error(`Failed to update ${recordUpdate.recordType} ${recordUpdate.recordId}`);
        }
      }

      return {
        success: true,
        message: `Successfully updated ${updatedFields.join(', ')}`,
        updatedFields
      };
    } catch (error) {
      console.error('Failed to execute record updates:', error);
      return {
        success: false,
        message: `Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`,
        updatedFields: []
      };
    }
  }

  /**
   * Generate a typewriter response for successful updates
   */
  static generateUpdateResponse(updates: UpdateCommand[], success: boolean): string {
    if (!success) {
      return "I encountered an error while trying to update the record. Please try again or update manually.";
    }

    if (updates['length'] === 0) {
      return "I didn't detect any specific field updates in your message. Try something like 'Update the phone number to 302-757-4107'.";
    }

    const fieldNames = updates.map(u => {
      switch (u.field) {
        case 'jobTitle': return 'job title';
        case 'phone': return 'phone number';
        case 'email': return 'email address';
        case 'company': return 'company';
        case 'status': return 'status';
        case 'notes': return 'notes';
        default: return u.field;
      }
    });

    if (updates['length'] === 1) {
      return `✅ Updated ${fieldNames[0]} to "${updates[0].value}"`;
    } else {
      return `✅ Updated ${fieldNames.slice(0, -1).join(', ')} and ${fieldNames[fieldNames.length - 1]}`;
    }
  }
}
