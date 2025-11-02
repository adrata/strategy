/**
 * Configuration Storage Module
 * 
 * Handles saving and loading buyer group discovery configurations
 * Supports both database storage and JSON file export
 */

const fs = require('fs');
const path = require('path');

class ConfigStorage {
  /**
   * Check if workspace has saved configuration
   * @param {string} workspaceId - Workspace ID
   * @param {object} prisma - Prisma client instance
   * @returns {Promise<boolean>} True if config exists
   */
  async hasSavedConfig(workspaceId, prisma) {
    if (!workspaceId || !prisma) return false;

    try {
      // Try to load from database
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { customFields: true }
      });

      if (workspace?.customFields && typeof workspace.customFields === 'object') {
        return workspace.customFields.buyerGroupConfig !== undefined;
      }

      return false;
    } catch (error) {
      console.warn('⚠️  Could not check for saved config:', error.message);
      return false;
    }
  }

  /**
   * Load configuration from database
   * @param {string} workspaceId - Workspace ID
   * @param {object} prisma - Prisma client instance
   * @returns {Promise<object|null>} Configuration object or null
   */
  async loadConfigFromDatabase(workspaceId, prisma) {
    if (!workspaceId || !prisma) {
      throw new Error('workspaceId and prisma are required');
    }

    try {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { customFields: true }
      });

      if (!workspace || !workspace.customFields) {
        return null;
      }

      const customFields = typeof workspace.customFields === 'object' 
        ? workspace.customFields 
        : JSON.parse(workspace.customFields || '{}');

      if (customFields.buyerGroupConfig) {
        console.log('✅ Loaded saved buyer group configuration from database');
        return customFields.buyerGroupConfig;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to load config from database:', error.message);
      return null;
    }
  }

  /**
   * Save configuration to database
   * @param {string} workspaceId - Workspace ID
   * @param {object} config - Configuration object
   * @param {object} prisma - Prisma client instance
   * @returns {Promise<boolean>} True if saved successfully
   */
  async saveConfigToDatabase(workspaceId, config, prisma) {
    if (!workspaceId || !prisma || !config) {
      throw new Error('workspaceId, prisma, and config are required');
    }

    try {
      // Get existing customFields
      const workspace = await prisma.workspaces.findUnique({
        where: { id: workspaceId },
        select: { customFields: true }
      });

      let customFields = {};
      if (workspace?.customFields) {
        customFields = typeof workspace.customFields === 'object'
          ? workspace.customFields
          : JSON.parse(workspace.customFields || '{}');
      }

      // Add buyer group config with metadata
      customFields.buyerGroupConfig = {
        ...config,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Update workspace
      await prisma.workspaces.update({
        where: { id: workspaceId },
        data: {
          customFields: customFields
        }
      });

      console.log('✅ Saved buyer group configuration to database');
      return true;
    } catch (error) {
      console.error('❌ Failed to save config to database:', error.message);
      throw error;
    }
  }

  /**
   * Export configuration to JSON file
   * @param {string} workspaceId - Workspace ID (for filename)
   * @param {object} config - Configuration object
   * @param {string} outputPath - Output file path (optional)
   * @returns {Promise<string>} Path to saved file
   */
  async exportConfigToJSON(workspaceId, config, outputPath = null) {
    if (!config) {
      throw new Error('Configuration is required');
    }

    try {
      // Determine output path
      let filePath = outputPath;
      if (!filePath) {
        const workspaceName = workspaceId || 'default';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `buyer-group-config-${workspaceName}-${timestamp}.json`;
        filePath = path.join(process.cwd(), filename);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Prepare export data
      const exportData = {
        workspaceId: workspaceId,
        savedAt: new Date().toISOString(),
        version: '1.0',
        config: config
      };

      // Write to file
      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), 'utf8');

      console.log(`✅ Exported configuration to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('❌ Failed to export config to JSON:', error.message);
      throw error;
    }
  }

  /**
   * Load configuration from JSON file
   * @param {string} filePath - Path to JSON file
   * @returns {Promise<object>} Configuration object
   */
  async loadConfigFromJSON(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      // Extract config from export format or use directly
      const config = data.config || data;
      
      console.log(`✅ Loaded configuration from: ${filePath}`);
      return config;
    } catch (error) {
      console.error('❌ Failed to load config from JSON:', error.message);
      throw error;
    }
  }
}

module.exports = { ConfigStorage };


