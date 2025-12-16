/**
 * Auth0 Settings Service
 *
 * Manages Auth0 M2M credentials storage, validation, and tenant configuration.
 * Stores credentials in PostgreSQL with database override of environment variables.
 */

import type { Pool } from 'pg';

/**
 * Auth0 M2M Configuration record
 * Note: Date fields are returned as ISO strings from PostgreSQL
 */
export interface Auth0M2MConfig {
  id: number;
  name: string | null;
  domain: string;
  client_id: string;
  client_secret: string;
  audience: string | null;
  scope: string | null;
  is_active: boolean;
  last_validated: string | null;
  validation_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Auth0 credential test result
 */
export interface Auth0TestResult {
  valid: boolean;
  domain?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  response_time_ms?: number;
}

/**
 * Auth0 social connection info
 */
export interface SocialConnection {
  id: string;
  name: string;
  strategy: string;
  enabled_clients: string[];
}

/**
 * Configuration status summary
 */
export interface Auth0SettingsStatus {
  configured: boolean;
  domain: string | null;
  name: string | null;
  m2m_configured: boolean;
  last_validated: string | null;
  validation_error: string | null;
  source: 'database' | 'environment';
}

/**
 * Input for saving M2M configuration
 */
export interface SaveM2MConfigInput {
  name?: string;
  domain: string;
  client_id: string;
  client_secret: string;
  audience?: string;
  scope?: string;
}

/**
 * Environment configuration fallback
 */
export interface EnvConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
  audience?: string;
}

/**
 * Auth0 Settings Service
 *
 * Manages Auth0 M2M credentials and tenant configuration.
 * Supports database storage with environment variable fallback.
 */
export class Auth0SettingsService {
  private pool: Pool | (() => Pool);
  private envConfig: EnvConfig;
  private tableName: string;

  constructor(options: {
    pool: Pool | (() => Pool);
    envConfig: EnvConfig;
    tableName?: string;
  }) {
    this.pool = options.pool;
    this.envConfig = options.envConfig;

    // Validate table name to prevent SQL injection
    const tableName = options.tableName || 'auth0_m2m_config';
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error(`Invalid table name: ${tableName}. Only alphanumeric characters and underscores are allowed.`);
    }
    this.tableName = tableName;
  }

  private getPool(): Pool {
    return typeof this.pool === 'function' ? this.pool() : this.pool;
  }

  /**
   * Ensure the settings table exists
   */
  async ensureTable(): Promise<void> {
    const pool = this.getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        domain VARCHAR(255) NOT NULL,
        client_id VARCHAR(255) NOT NULL,
        client_secret TEXT NOT NULL,
        audience TEXT,
        scope TEXT,
        is_active BOOLEAN DEFAULT false,
        last_validated TIMESTAMPTZ,
        validation_error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  /**
   * Get the effective Auth0 configuration (database override or env fallback)
   */
  async getConfig(): Promise<{
    domain: string;
    client_id: string;
    client_secret: string;
    audience: string;
    name: string | null;
    source: 'database' | 'environment';
  }> {
    // Check for active database config
    const dbConfig = await this.getActiveConfig();

    if (dbConfig) {
      return {
        domain: dbConfig.domain,
        client_id: dbConfig.client_id,
        client_secret: dbConfig.client_secret,
        audience: dbConfig.audience || `https://${dbConfig.domain}/api/v2/`,
        name: dbConfig.name,
        source: 'database',
      };
    }

    // Fall back to environment config
    return {
      domain: this.envConfig.domain,
      client_id: this.envConfig.clientId,
      client_secret: this.envConfig.clientSecret,
      audience: this.envConfig.audience || `https://${this.envConfig.domain}/api/v2/`,
      name: null,
      source: 'environment',
    };
  }

  /**
   * Get the active database configuration
   */
  async getActiveConfig(): Promise<Auth0M2MConfig | null> {
    const pool = this.getPool();
    const result = await pool.query<Auth0M2MConfig>(
      `SELECT * FROM ${this.tableName} WHERE is_active = true ORDER BY id DESC LIMIT 1`
    );
    return result.rows[0] || null;
  }

  /**
   * Get all stored M2M configurations
   */
  async getM2MConfigs(): Promise<Auth0M2MConfig[]> {
    const pool = this.getPool();
    const result = await pool.query<Auth0M2MConfig>(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    return result.rows;
  }

  /**
   * Save a new M2M configuration
   * Uses a database transaction to ensure atomic operation
   */
  async saveM2MConfig(config: SaveM2MConfigInput): Promise<{ success: boolean; id?: number; error?: string }> {
    const pool = this.getPool();
    const client = await pool.connect();

    try {
      // Test the credentials first (outside transaction)
      const testResult = await this.testCredentials(
        config.domain,
        config.client_id,
        config.client_secret,
        config.audience
      );

      // Start transaction
      await client.query('BEGIN');

      // Deactivate existing configs
      await client.query(`UPDATE ${this.tableName} SET is_active = false, updated_at = NOW()`);

      // Insert new config
      const result = await client.query(
        `INSERT INTO ${this.tableName}
         (name, domain, client_id, client_secret, audience, scope, is_active, last_validated, validation_error)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
         RETURNING id`,
        [
          config.name || null,
          config.domain,
          config.client_id,
          config.client_secret,
          config.audience || null,
          config.scope || null,
          testResult.valid ? new Date() : null,
          testResult.valid ? null : testResult.error,
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      return {
        success: true,
        id: result.rows[0].id,
      };
    } catch (err) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Failed to save Auth0 M2M config:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    } finally {
      client.release();
    }
  }

  /**
   * Delete an M2M configuration
   */
  async deleteM2MConfig(id: number): Promise<{ success: boolean; error?: string }> {
    const pool = this.getPool();

    try {
      const result = await pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (result.rowCount === 0) {
        return { success: false, error: 'Configuration not found' };
      }

      return { success: true };
    } catch (err) {
      console.error('Failed to delete Auth0 M2M config:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Sanitize error message to remove any potential secrets
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove any potential client_secret values from error messages
    // Auth0 may reflect the request body in error responses
    let sanitized = message;

    // Remove client_secret values (various formats)
    sanitized = sanitized.replace(/"client_secret"\s*:\s*"[^"]*"/gi, '"client_secret":"[REDACTED]"');
    sanitized = sanitized.replace(/client_secret=[^&\s]*/gi, 'client_secret=[REDACTED]');

    // Remove any bearer tokens that might appear
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/gi, 'Bearer [REDACTED]');

    // Limit error message length to prevent large payloads
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...';
    }

    return sanitized;
  }

  /**
   * Test M2M credentials by requesting a token
   */
  async testCredentials(
    domain: string,
    clientId: string,
    clientSecret: string,
    audience?: string
  ): Promise<Auth0TestResult> {
    const startTime = Date.now();

    try {
      const tokenUrl = `https://${domain}/oauth/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          audience: audience || `https://${domain}/api/v2/`,
          grant_type: 'client_credentials',
        }),
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const body = await response.text();
        // Sanitize error response to prevent secret leakage
        const sanitizedError = this.sanitizeErrorMessage(body);
        return {
          valid: false,
          error: `HTTP ${response.status}: ${sanitizedError}`,
          response_time_ms: responseTime,
        };
      }

      const data = await response.json() as {
        access_token?: string;
        token_type?: string;
        expires_in?: number;
      };

      if (!data.access_token) {
        return {
          valid: false,
          error: 'No access token in response',
          response_time_ms: responseTime,
        };
      }

      return {
        valid: true,
        domain,
        token_type: data.token_type,
        expires_in: data.expires_in,
        response_time_ms: responseTime,
      };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? this.sanitizeErrorMessage(err.message) : 'Unknown error',
        response_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Test the current effective configuration
   */
  async testCurrentConfig(): Promise<Auth0TestResult> {
    const config = await this.getConfig();

    if (!config.domain || !config.client_id || !config.client_secret) {
      return {
        valid: false,
        error: 'Auth0 M2M credentials not configured',
      };
    }

    return this.testCredentials(
      config.domain,
      config.client_id,
      config.client_secret,
      config.audience
    );
  }

  /**
   * Get M2M access token for the current configuration
   */
  async getAccessToken(): Promise<{ token: string; expires_in: number } | null> {
    const config = await this.getConfig();

    if (!config.domain || !config.client_id || !config.client_secret) {
      return null;
    }

    try {
      const tokenUrl = `https://${config.domain}/oauth/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.client_id,
          client_secret: config.client_secret,
          audience: config.audience,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        console.error('Failed to get Auth0 access token:', response.status);
        return null;
      }

      const data = await response.json() as {
        access_token: string;
        expires_in: number;
      };

      return {
        token: data.access_token,
        expires_in: data.expires_in,
      };
    } catch (err) {
      console.error('Error getting Auth0 access token:', err);
      return null;
    }
  }

  /**
   * Get social connections from Auth0 Management API
   */
  async getSocialConnections(): Promise<SocialConnection[]> {
    const tokenResult = await this.getAccessToken();
    if (!tokenResult) {
      console.error('Cannot get social connections: no access token');
      return [];
    }

    const config = await this.getConfig();

    try {
      const strategies = 'google-oauth2,apple,facebook,linkedin,microsoft,github,twitter';
      const response = await fetch(
        `https://${config.domain}/api/v2/connections?strategy=${strategies}`,
        {
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to get social connections:', response.status);
        return [];
      }

      const connections = await response.json() as Array<{
        id: string;
        name: string;
        strategy: string;
        enabled_clients: string[];
      }>;

      return connections.map(c => ({
        id: c.id,
        name: c.name,
        strategy: c.strategy,
        enabled_clients: c.enabled_clients,
      }));
    } catch (err) {
      console.error('Error getting social connections:', err);
      return [];
    }
  }

  /**
   * Get configuration status summary
   */
  async getStatus(): Promise<Auth0SettingsStatus> {
    const config = await this.getConfig();
    const dbConfig = await this.getActiveConfig();

    return {
      configured: !!config.domain && !!config.client_id,
      domain: config.domain || null,
      name: config.name,
      m2m_configured: !!config.client_id && !!config.client_secret,
      last_validated: dbConfig?.last_validated || null,
      validation_error: dbConfig?.validation_error || null,
      source: config.source,
    };
  }

  /**
   * Update validation status for active config
   */
  async updateValidationStatus(valid: boolean, error?: string): Promise<void> {
    const pool = this.getPool();
    await pool.query(
      `UPDATE ${this.tableName}
       SET last_validated = $1, validation_error = $2, updated_at = NOW()
       WHERE is_active = true`,
      [valid ? new Date() : null, valid ? null : error]
    );
  }
}
