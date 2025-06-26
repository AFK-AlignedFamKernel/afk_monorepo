// Export database core
export { db, initializeDatabase, useLiveQuery } from './db';

// Export database API
export * from './dbApi';

// Export migration utility
export { migrateFromLegacyStorage } from './migrateStorage';

// Export a single initialization function to use in App.tsx
import { initializeDatabase } from './db';
import { migrateFromLegacyStorage } from './migrateStorage';

/**
 * Initialize database and migrate existing data
 */
export async function setupDatabase(): Promise<boolean> {
  try {
    // First initialize the database
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database');
      return false;
    }
    
    // Then migrate data from legacy storage
    const migrated = await migrateFromLegacyStorage();
    if (!migrated) {
      console.warn('Failed to migrate from legacy storage, but database is initialized');
      // Continue anyway as the database is initialized
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  }
} 