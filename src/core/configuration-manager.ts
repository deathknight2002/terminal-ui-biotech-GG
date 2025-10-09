/**
 * Declarative Configuration System
 * 
 * Enables modules to define and validate their configuration declaratively.
 * Supports environment variables, defaults, and runtime overrides.
 */

export interface ConfigSchema {
  [key: string]: ConfigField;
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: any;
  validate?: (value: any) => boolean | string;
  env?: string; // Environment variable name
  secret?: boolean; // Mark as sensitive
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

class ConfigurationManagerImpl {
  private schemas: Map<string, ConfigSchema> = new Map();
  private configs: Map<string, Record<string, any>> = new Map();
  private overrides: Map<string, Record<string, any>> = new Map();

  /**
   * Register a configuration schema for a module
   */
  registerSchema(moduleName: string, schema: ConfigSchema): void {
    this.schemas.set(moduleName, schema);
    console.log(`📝 Registered config schema for ${moduleName}`);
  }

  /**
   * Load configuration for a module
   */
  loadConfig(moduleName: string, provided: Record<string, any> = {}): Record<string, any> {
    const schema = this.schemas.get(moduleName);
    if (!schema) {
      throw new Error(`No schema registered for module: ${moduleName}`);
    }

    const config: Record<string, any> = {};
    const overrides = this.overrides.get(moduleName) || {};

    // Process each field in schema
    for (const [fieldName, field] of Object.entries(schema)) {
      let value: any;

      // Priority: override > provided > env > default
      if (overrides[fieldName] !== undefined) {
        value = overrides[fieldName];
      } else if (provided[fieldName] !== undefined) {
        value = provided[fieldName];
      } else if (field.env && process.env[field.env] !== undefined) {
        value = this.parseEnvValue(process.env[field.env]!, field.type);
      } else if (field.default !== undefined) {
        value = field.default;
      } else if (field.required) {
        throw new Error(`Required config field '${fieldName}' not provided for ${moduleName}`);
      }

      // Validate if validator provided
      if (value !== undefined && field.validate) {
        const result = field.validate(value);
        if (result !== true) {
          throw new Error(
            `Validation failed for ${moduleName}.${fieldName}: ${result || 'Invalid value'}`
          );
        }
      }

      if (value !== undefined) {
        config[fieldName] = value;
      }
    }

    // Store resolved config
    this.configs.set(moduleName, config);

    return config;
  }

  /**
   * Get configuration for a module
   */
  getConfig(moduleName: string): Record<string, any> | undefined {
    return this.configs.get(moduleName);
  }

  /**
   * Set runtime override for a config value
   */
  setOverride(moduleName: string, field: string, value: any): void {
    if (!this.overrides.has(moduleName)) {
      this.overrides.set(moduleName, {});
    }
    this.overrides.get(moduleName)![field] = value;
  }

  /**
   * Clear all overrides for a module
   */
  clearOverrides(moduleName: string): void {
    this.overrides.delete(moduleName);
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(moduleName: string, config: Record<string, any>): ValidationResult {
    const schema = this.schemas.get(moduleName);
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: '_schema', message: `No schema found for ${moduleName}` }],
        warnings: [],
      };
    }

    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Check required fields
    for (const [fieldName, field] of Object.entries(schema)) {
      if (field.required && config[fieldName] === undefined) {
        errors.push({
          field: fieldName,
          message: `Required field '${fieldName}' is missing`,
        });
      }

      // Validate if value provided
      if (config[fieldName] !== undefined) {
        // Type check
        const actualType = typeof config[fieldName];
        if (field.type === 'array' && !Array.isArray(config[fieldName])) {
          errors.push({
            field: fieldName,
            message: `Expected array, got ${actualType}`,
          });
        } else if (field.type !== 'array' && field.type !== actualType) {
          errors.push({
            field: fieldName,
            message: `Expected ${field.type}, got ${actualType}`,
          });
        }

        // Custom validation
        if (field.validate) {
          const result = field.validate(config[fieldName]);
          if (result !== true) {
            errors.push({
              field: fieldName,
              message: result || 'Validation failed',
            });
          }
        }
      }
    }

    // Check for unknown fields
    for (const fieldName of Object.keys(config)) {
      if (!schema[fieldName]) {
        warnings.push({
          field: fieldName,
          message: `Unknown config field '${fieldName}'`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate documentation for a module's configuration
   */
  generateDocs(moduleName: string): string {
    const schema = this.schemas.get(moduleName);
    if (!schema) {
      return `No configuration schema found for ${moduleName}`;
    }

    let docs = `# Configuration: ${moduleName}\n\n`;
    docs += '## Fields\n\n';

    for (const [fieldName, field] of Object.entries(schema)) {
      docs += `### \`${fieldName}\`\n`;
      docs += `- **Type**: \`${field.type}\`\n`;
      docs += `- **Description**: ${field.description}\n`;
      docs += `- **Required**: ${field.required ? 'Yes' : 'No'}\n`;

      if (field.default !== undefined) {
        docs += `- **Default**: \`${JSON.stringify(field.default)}\`\n`;
      }

      if (field.env) {
        docs += `- **Environment Variable**: \`${field.env}\`\n`;
      }

      if (field.secret) {
        docs += `- **⚠️ Sensitive**: This field contains sensitive data\n`;
      }

      docs += '\n';
    }

    // Add example
    docs += '## Example\n\n```typescript\n';
    docs += `const config = {\n`;
    for (const [fieldName, field] of Object.entries(schema)) {
      const example = field.default !== undefined
        ? JSON.stringify(field.default)
        : this.getExampleValue(field.type);
      docs += `  ${fieldName}: ${example},\n`;
    }
    docs += '};\n```\n';

    return docs;
  }

  /**
   * Export all configurations (with secrets masked)
   */
  exportConfigs(maskSecrets = true): Record<string, Record<string, any>> {
    const exported: Record<string, Record<string, any>> = {};

    this.configs.forEach((config, moduleName) => {
      const schema = this.schemas.get(moduleName);
      if (!schema) return;

      const exportedConfig: Record<string, any> = {};

      for (const [fieldName, value] of Object.entries(config)) {
        const field = schema[fieldName];
        if (field?.secret && maskSecrets) {
          exportedConfig[fieldName] = '***REDACTED***';
        } else {
          exportedConfig[fieldName] = value;
        }
      }

      exported[moduleName] = exportedConfig;
    });

    return exported;
  }

  /**
   * Get all registered schemas
   */
  getSchemas(): Map<string, ConfigSchema> {
    return new Map(this.schemas);
  }

  private parseEnvValue(value: string, type: ConfigField['type']): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'object':
      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private getExampleValue(type: ConfigField['type']): string {
    switch (type) {
      case 'string':
        return '"example"';
      case 'number':
        return '42';
      case 'boolean':
        return 'true';
      case 'array':
        return '[]';
      case 'object':
        return '{}';
    }
  }
}

// Singleton instance
export const ConfigurationManager = new ConfigurationManagerImpl();
