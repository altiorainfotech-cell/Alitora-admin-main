import mongoose from 'mongoose';

/**
 * SEO Database Connection Utilities
 * Provides separate read-only and read-write connections for the SEO system
 */

interface ConnectionConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

// Connection instances
let readOnlyConnection: mongoose.Connection | null = null;
let readWriteConnection: mongoose.Connection | null = null;

/**
 * Get read-only database connection for website
 * This connection should be used by the public website to fetch SEO data
 */
export async function getReadOnlyConnection(): Promise<mongoose.Connection> {
  if (readOnlyConnection && readOnlyConnection.readyState === 1) {
    return readOnlyConnection;
  }

  try {
    const config = getReadOnlyConfig();
    readOnlyConnection = mongoose.createConnection(config.uri, config.options);
    
    readOnlyConnection.on('connected', () => {
      console.log('SEO read-only database connected');
    });
    
    readOnlyConnection.on('error', (error) => {
      console.error('SEO read-only database connection error:', error);
    });
    
    readOnlyConnection.on('disconnected', () => {
      console.log('SEO read-only database disconnected');
    });

    await readOnlyConnection.asPromise();
    return readOnlyConnection;
  } catch (error) {
    console.error('Failed to connect to read-only database:', error);
    throw error;
  }
}

/**
 * Get read-write database connection for admin panel
 * This connection should be used by the admin panel for CRUD operations
 */
export async function getReadWriteConnection(): Promise<mongoose.Connection> {
  if (readWriteConnection && readWriteConnection.readyState === 1) {
    return readWriteConnection;
  }

  try {
    const config = getReadWriteConfig();
    readWriteConnection = mongoose.createConnection(config.uri, config.options);
    
    readWriteConnection.on('connected', () => {
      console.log('SEO read-write database connected');
    });
    
    readWriteConnection.on('error', (error) => {
      console.error('SEO read-write database connection error:', error);
    });
    
    readWriteConnection.on('disconnected', () => {
      console.log('SEO read-write database disconnected');
    });

    await readWriteConnection.asPromise();
    return readWriteConnection;
  } catch (error) {
    console.error('Failed to connect to read-write database:', error);
    throw error;
  }
}

/**
 * Get read-only database configuration
 */
function getReadOnlyConfig(): ConnectionConfig {
  const uri = process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MongoDB read-only URI not configured');
  }

  return {
    uri,
    options: {
      maxPoolSize: 5, // Smaller pool for read-only operations
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      readPreference: 'secondaryPreferred', // Prefer secondary for reads
      readConcern: { level: 'local' },
      retryWrites: false, // No writes on read-only connection
      retryReads: true,
      appName: 'SEO-ReadOnly'
    }
  };
}

/**
 * Get read-write database configuration
 */
function getReadWriteConfig(): ConnectionConfig {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MongoDB URI not configured');
  }

  return {
    uri,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      readPreference: 'primary',
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true },
      retryWrites: true,
      retryReads: true,
      appName: 'SEO-Admin'
    }
  };
}

/**
 * Close all SEO database connections
 */
export async function closeSEOConnections(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (readOnlyConnection) {
    promises.push(readOnlyConnection.close());
    readOnlyConnection = null;
  }

  if (readWriteConnection) {
    promises.push(readWriteConnection.close());
    readWriteConnection = null;
  }

  await Promise.all(promises);
  console.log('All SEO database connections closed');
}

/**
 * Health check for database connections
 */
export async function checkSEOConnectionHealth(): Promise<{
  readOnly: { connected: boolean; error?: string };
  readWrite: { connected: boolean; error?: string };
}> {
  const result = {
    readOnly: { connected: false, error: undefined as string | undefined },
    readWrite: { connected: false, error: undefined as string | undefined }
  };

  // Check read-only connection
  try {
    if (readOnlyConnection && readOnlyConnection.readyState === 1 && readOnlyConnection.db) {
      await readOnlyConnection.db.admin().ping();
      result.readOnly.connected = true;
    } else {
      result.readOnly.error = 'Connection not established';
    }
  } catch (error) {
    result.readOnly.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // Check read-write connection
  try {
    if (readWriteConnection && readWriteConnection.readyState === 1 && readWriteConnection.db) {
      await readWriteConnection.db.admin().ping();
      result.readWrite.connected = true;
    } else {
      result.readWrite.error = 'Connection not established';
    }
  } catch (error) {
    result.readWrite.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

/**
 * Get connection statistics
 */
export function getSEOConnectionStats(): {
  readOnly: { state: number; host?: string; name?: string } | null;
  readWrite: { state: number; host?: string; name?: string } | null;
} {
  return {
    readOnly: readOnlyConnection ? {
      state: readOnlyConnection.readyState,
      host: readOnlyConnection.host,
      name: readOnlyConnection.name
    } : null,
    readWrite: readWriteConnection ? {
      state: readWriteConnection.readyState,
      host: readWriteConnection.host,
      name: readWriteConnection.name
    } : null
  };
}

/**
 * Initialize SEO database connections
 * Should be called during application startup
 */
export async function initializeSEOConnections(): Promise<{
  readOnly: boolean;
  readWrite: boolean;
  errors: string[];
}> {
  const result = {
    readOnly: false,
    readWrite: false,
    errors: [] as string[]
  };

  // Initialize read-only connection
  try {
    await getReadOnlyConnection();
    result.readOnly = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Read-only connection failed: ${message}`);
  }

  // Initialize read-write connection
  try {
    await getReadWriteConnection();
    result.readWrite = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Read-write connection failed: ${message}`);
  }

  return result;
}

// Connection state constants
export const CONNECTION_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
} as const;

// Export connection instances for direct access if needed
export { readOnlyConnection, readWriteConnection };