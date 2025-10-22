/**
 * Schema Parser for Streamlined Prisma Schema
 * 
 * Parses the schema-streamlined.prisma file to extract models, tables, and fields
 * for the database left panel.
 */

export interface ParsedModel {
  name: string;
  tableName: string;
  fields: ParsedField[];
  relationships: ParsedRelationship[];
}

export interface ParsedField {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  defaultValue?: string;
  attributes: string[];
}

export interface ParsedRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetModel: string;
  fieldName: string;
  relationName?: string;
}

export interface SchemaStats {
  totalModels: number;
  totalTables: number;
  totalFields: number;
  totalRelationships: number;
}

/**
 * Parse the streamlined Prisma schema file
 */
export function parseStreamlinedSchema(schemaContent: string): {
  models: ParsedModel[];
  stats: SchemaStats;
} {
  const models: ParsedModel[] = [];
  const lines = schemaContent.split('\n');
  
  let currentModel: ParsedModel | null = null;
  let inModel = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip comments and empty lines
    if (line.startsWith('//') || line.startsWith('///') || line === '') {
      continue;
    }
    
    // Model definition
    if (line.startsWith('model ')) {
      if (currentModel) {
        models.push(currentModel);
      }
      
      const modelName = line.replace('model ', '').replace(' {', '').trim();
      currentModel = {
        name: modelName,
        tableName: modelName.toLowerCase() + 's', // Default table name
        fields: [],
        relationships: []
      };
      inModel = true;
      continue;
    }
    
    // End of model
    if (line === '}' && inModel && currentModel) {
      models.push(currentModel);
      currentModel = null;
      inModel = false;
      continue;
    }
    
    // Field definition
    if (inModel && currentModel && line.includes(' ')) {
      const field = parseField(line);
      if (field) {
        currentModel.fields.push(field);
        
        // Check for relationships
        if (field.isForeignKey) {
          const relationship = parseRelationship(line, field.name);
          if (relationship) {
            currentModel.relationships.push(relationship);
          }
        }
      }
    }
  }
  
  // Add the last model if exists
  if (currentModel) {
    models.push(currentModel);
  }
  
  const stats: SchemaStats = {
    totalModels: models.length,
    totalTables: models.length, // In Prisma, each model is a table
    totalFields: models.reduce((sum, model) => sum + model.fields.length, 0),
    totalRelationships: models.reduce((sum, model) => sum + model.relationships.length, 0)
  };
  
  return { models, stats };
}

/**
 * Parse a field definition line
 */
function parseField(line: string): ParsedField | null {
  // Skip lines that don't look like field definitions
  if (!line.includes(' ') || line.includes('@@') || line.includes('model ')) {
    return null;
  }
  
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) return null;
  
  const fieldName = parts[0];
  const fieldType = parts[1].replace(/[?\[\]]/g, '');
  const isOptional = line.includes('?');
  const isArray = line.includes('[]');
  const isPrimaryKey = line.includes('@id');
  const isForeignKey = line.includes('@relation');
  const isUnique = line.includes('@unique');
  const hasDefault = line.includes('@default');
  
  // Extract attributes
  const attributes: string[] = [];
  if (line.includes('@id')) attributes.push('@id');
  if (line.includes('@unique')) attributes.push('@unique');
  if (line.includes('@default')) attributes.push('@default');
  if (line.includes('@relation')) attributes.push('@relation');
  if (line.includes('@updatedAt')) attributes.push('@updatedAt');
  if (line.includes('@map')) attributes.push('@map');
  
  // Extract default value
  let defaultValue: string | undefined;
  const defaultMatch = line.match(/@default\(([^)]+)\)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }
  
  return {
    name: fieldName,
    type: fieldType,
    isOptional,
    isArray,
    isPrimaryKey,
    isForeignKey,
    isUnique,
    hasDefault,
    defaultValue,
    attributes
  };
}

/**
 * Parse relationship information from a field line
 */
function parseRelationship(line: string, fieldName: string): ParsedRelationship | null {
  if (!line.includes('@relation')) return null;
  
  // Extract target model from relation
  const relationMatch = line.match(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/);
  if (relationMatch) {
    const sourceField = relationMatch[1].replace(/['"]/g, '');
    const targetField = relationMatch[2].replace(/['"]/g, '');
    
    // Determine relationship type based on field name and structure
    let type: 'one-to-one' | 'one-to-many' | 'many-to-many' = 'one-to-many';
    if (fieldName.endsWith('Id') || fieldName.endsWith('_id')) {
      type = 'many-to-one';
    }
    
    return {
      type,
      targetModel: fieldName.replace(/Id$|_id$/, ''), // Remove Id suffix to get model name
      fieldName,
      relationName: fieldName
    };
  }
  
  return null;
}

/**
 * Get models from the streamlined schema
 */
export async function getStreamlinedModels(): Promise<{
  models: ParsedModel[];
  stats: SchemaStats;
}> {
  try {
    // Read the actual streamlined schema file
    const response = await fetch('/api/database/schema-streamlined');
    if (response.ok) {
      const schemaContent = await response.text();
      return parseStreamlinedSchema(schemaContent);
    }
    
    // Fallback to hardcoded models from the actual schema
    const streamlinedModels: ParsedModel[] = [
      {
        name: 'roles',
        tableName: 'roles',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'name', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, hasDefault: false, attributes: ['@unique'] },
          { name: 'description', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'isActive', type: 'Boolean', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'true', attributes: ['@default'] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: []
      },
      {
        name: 'permissions',
        tableName: 'permissions',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'name', type: 'Permission', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, hasDefault: false, attributes: ['@unique'] },
          { name: 'description', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'resource', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'action', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'isActive', type: 'Boolean', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'true', attributes: ['@default'] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: []
      },
      {
        name: 'workspaces',
        tableName: 'workspaces',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'name', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'slug', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, hasDefault: false, attributes: ['@unique'] },
          { name: 'timezone', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: '"UTC"', attributes: ['@default'] },
          { name: 'description', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: []
      },
      {
        name: 'users',
        tableName: 'users',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'email', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: true, hasDefault: false, attributes: ['@unique'] },
          { name: 'name', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: []
      },
      {
        name: 'companies',
        tableName: 'companies',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'workspaceId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'name', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: [
          { type: 'many-to-one', targetModel: 'workspace', fieldName: 'workspaceId', relationName: 'workspace' }
        ]
      },
      {
        name: 'people',
        tableName: 'people',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'workspaceId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'companyId', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'firstName', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'lastName', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: [
          { type: 'many-to-one', targetModel: 'workspace', fieldName: 'workspaceId', relationName: 'workspace' },
          { type: 'many-to-one', targetModel: 'company', fieldName: 'companyId', relationName: 'company' }
        ]
      },
      {
        name: 'role_permissions',
        tableName: 'role_permissions',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'roleId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'permissionId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] }
        ],
        relationships: [
          { type: 'many-to-one', targetModel: 'role', fieldName: 'roleId', relationName: 'role' },
          { type: 'many-to-one', targetModel: 'permission', fieldName: 'permissionId', relationName: 'permission' }
        ]
      },
      {
        name: 'workspace_users',
        tableName: 'workspace_users',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'workspaceId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'userId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'role', type: 'UserRole', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'VIEWER', attributes: ['@default'] },
          { name: 'createdAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'updatedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: ['@updatedAt'] }
        ],
        relationships: [
          { type: 'many-to-one', targetModel: 'workspace', fieldName: 'workspaceId', relationName: 'workspace' },
          { type: 'many-to-one', targetModel: 'user', fieldName: 'userId', relationName: 'user' }
        ]
      },
      {
        name: 'user_roles',
        tableName: 'user_roles',
        fields: [
          { name: 'id', type: 'String', isOptional: false, isArray: false, isPrimaryKey: true, isForeignKey: false, isUnique: true, hasDefault: true, defaultValue: 'ulid()', attributes: ['@id', '@default'] },
          { name: 'userId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'roleId', type: 'String', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'workspaceId', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: true, isUnique: false, hasDefault: false, attributes: ['@relation'] },
          { name: 'isActive', type: 'Boolean', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'true', attributes: ['@default'] },
          { name: 'assignedAt', type: 'DateTime', isOptional: false, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: true, defaultValue: 'now()', attributes: ['@default'] },
          { name: 'assignedBy', type: 'String', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] },
          { name: 'expiresAt', type: 'DateTime', isOptional: true, isArray: false, isPrimaryKey: false, isForeignKey: false, isUnique: false, hasDefault: false, attributes: [] }
        ],
        relationships: [
          { type: 'many-to-one', targetModel: 'user', fieldName: 'userId', relationName: 'user' },
          { type: 'many-to-one', targetModel: 'role', fieldName: 'roleId', relationName: 'role' },
          { type: 'many-to-one', targetModel: 'workspace', fieldName: 'workspaceId', relationName: 'workspace' }
        ]
      }
    ];
    
    const stats: SchemaStats = {
      totalModels: streamlinedModels.length,
      totalTables: streamlinedModels.length,
      totalFields: streamlinedModels.reduce((sum, model) => sum + model.fields.length, 0),
      totalRelationships: streamlinedModels.reduce((sum, model) => sum + model.relationships.length, 0)
    };
    
    return { models: streamlinedModels, stats };
  } catch (error) {
    console.error('Error parsing streamlined schema:', error);
    return { models: [], stats: { totalModels: 0, totalTables: 0, totalFields: 0, totalRelationships: 0 } };
  }
}
