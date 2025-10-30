import mongoose from 'mongoose';
import SEOPage from '../models/SEOPage';
import Redirect from '../models/Redirect';

/**
 * Database index setup for SEO Management System
 * This file contains all index definitions and constraints for optimal query performance
 */

export interface IndexCreationResult {
  collection: string;
  indexName: string;
  success: boolean;
  error?: string;
}

/**
 * Create all SEO-related database indexes
 */
export async function createSEOIndexes(): Promise<IndexCreationResult[]> {
  const results: IndexCreationResult[] = [];

  try {
    // SEO Pages Collection Indexes
    const seoPageIndexes = [
      {
        name: 'siteId_path_unique',
        spec: { siteId: 1 as const, path: 1 as const },
        options: { unique: true, background: true }
      },
      {
        name: 'siteId_slug_unique',
        spec: { siteId: 1 as const, slug: 1 as const },
        options: { unique: true, background: true }
      },
      {
        name: 'updatedAt_desc',
        spec: { updatedAt: -1 as const },
        options: { background: true }
      },
      {
        name: 'pageCategory_isCustom',
        spec: { pageCategory: 1 as const, isCustom: 1 as const },
        options: { background: true }
      },
      {
        name: 'siteId_isCustom_updatedAt',
        spec: { siteId: 1 as const, isCustom: 1 as const, updatedAt: -1 as const },
        options: { background: true }
      },
      {
        name: 'createdBy_updatedAt',
        spec: { createdBy: 1 as const, updatedAt: -1 as const },
        options: { background: true }
      },
      {
        name: 'text_search',
        spec: { 
          metaTitle: 'text' as const, 
          metaDescription: 'text' as const, 
          path: 'text' as const
        },
        options: { 
          background: true,
          weights: {
            metaTitle: 10,
            metaDescription: 5,
            path: 3
          }
        }
      }
    ];

    // Create SEO Pages indexes
    for (const index of seoPageIndexes) {
      try {
        await SEOPage.collection.createIndex(index.spec as any, {
          ...index.options,
          name: index.name
        });
        results.push({
          collection: 'seo_pages',
          indexName: index.name,
          success: true
        });
      } catch (error) {
        results.push({
          collection: 'seo_pages',
          indexName: index.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Redirects Collection Indexes
    const redirectIndexes = [
      {
        name: 'siteId_from_unique',
        spec: { siteId: 1 as const, from: 1 as const },
        options: { unique: true, background: true }
      },
      {
        name: 'createdAt_desc',
        spec: { createdAt: -1 as const },
        options: { background: true }
      },
      {
        name: 'siteId_statusCode',
        spec: { siteId: 1 as const, statusCode: 1 as const },
        options: { background: true }
      },
      {
        name: 'siteId_to',
        spec: { siteId: 1 as const, to: 1 as const },
        options: { background: true }
      },
      {
        name: 'createdBy_createdAt',
        spec: { createdBy: 1 as const, createdAt: -1 as const },
        options: { background: true }
      }
    ];

    // Create Redirects indexes
    for (const index of redirectIndexes) {
      try {
        await Redirect.collection.createIndex(index.spec as any, {
          ...index.options,
          name: index.name
        });
        results.push({
          collection: 'redirects',
          indexName: index.name,
          success: true
        });
      } catch (error) {
        results.push({
          collection: 'redirects',
          indexName: index.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

  } catch (error) {
    console.error('Error creating SEO indexes:', error);
    throw error;
  }

  return results;
}

/**
 * Drop all SEO-related indexes (useful for development/testing)
 */
export async function dropSEOIndexes(): Promise<IndexCreationResult[]> {
  const results: IndexCreationResult[] = [];

  try {
    // Get all indexes for SEO Pages collection
    const seoPageIndexes = await SEOPage.collection.listIndexes().toArray();
    for (const index of seoPageIndexes) {
      if (index.name !== '_id_') { // Don't drop the default _id index
        try {
          await SEOPage.collection.dropIndex(index.name);
          results.push({
            collection: 'seo_pages',
            indexName: index.name,
            success: true
          });
        } catch (error) {
          results.push({
            collection: 'seo_pages',
            indexName: index.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Get all indexes for Redirects collection
    const redirectIndexes = await Redirect.collection.listIndexes().toArray();
    for (const index of redirectIndexes) {
      if (index.name !== '_id_') { // Don't drop the default _id index
        try {
          await Redirect.collection.dropIndex(index.name);
          results.push({
            collection: 'redirects',
            indexName: index.name,
            success: true
          });
        } catch (error) {
          results.push({
            collection: 'redirects',
            indexName: index.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

  } catch (error) {
    console.error('Error dropping SEO indexes:', error);
    throw error;
  }

  return results;
}

/**
 * Verify that all required indexes exist
 */
export async function verifySEOIndexes(): Promise<{
  seoPages: { exists: boolean; indexes: string[] };
  redirects: { exists: boolean; indexes: string[] };
}> {
  try {
    const seoPageIndexes = await SEOPage.collection.listIndexes().toArray();
    const redirectIndexes = await Redirect.collection.listIndexes().toArray();

    return {
      seoPages: {
        exists: seoPageIndexes.length > 1, // More than just _id index
        indexes: seoPageIndexes.map((idx: any) => idx.name)
      },
      redirects: {
        exists: redirectIndexes.length > 1, // More than just _id index
        indexes: redirectIndexes.map((idx: any) => idx.name)
      }
    };
  } catch (error) {
    console.error('Error verifying SEO indexes:', error);
    throw error;
  }
}

/**
 * Get index statistics for performance monitoring
 */
export async function getSEOIndexStats(): Promise<{
  seoPages: any[];
  redirects: any[];
}> {
  try {
    const seoPageStats = await SEOPage.collection.aggregate([
      { $indexStats: {} }
    ]).toArray();

    const redirectStats = await Redirect.collection.aggregate([
      { $indexStats: {} }
    ]).toArray();

    return {
      seoPages: seoPageStats,
      redirects: redirectStats
    };
  } catch (error) {
    console.error('Error getting SEO index stats:', error);
    throw error;
  }
}

/**
 * Initialize SEO database with indexes and constraints
 * This should be called during application startup or deployment
 */
export async function initializeSEODatabase(): Promise<{
  success: boolean;
  results: IndexCreationResult[];
  error?: string;
}> {
  try {
    console.log('Initializing SEO database indexes...');
    
    const results = await createSEOIndexes();
    const failedIndexes = results.filter(r => !r.success);
    
    if (failedIndexes.length > 0) {
      console.warn('Some indexes failed to create:', failedIndexes);
      return {
        success: false,
        results,
        error: `Failed to create ${failedIndexes.length} indexes`
      };
    }
    
    console.log('SEO database indexes created successfully');
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('Failed to initialize SEO database:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}