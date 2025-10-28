#!/usr/bin/env node

/**
 * Database optimization script for blog performance
 * Run this script to ensure proper indexes are created
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'blog-admin-panel';

async function optimizeDatabase() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DB_NAME);
    const blogPostsCollection = db.collection('blogposts');

    console.log('📊 Creating optimized indexes...');

    // Create compound indexes for better query performance
    const indexes = [
      // For admin blog listing with pagination
      { status: 1, createdAt: -1 },
      
      // For category filtering
      { category: 1, status: 1, date: -1 },
      
      // For search functionality
      { title: 'text', content: 'text', excerpt: 'text' },
      
      // For author filtering
      { author: 1, status: 1 },
      
      // For href lookups (single post)
      { href: 1, status: 1 }
    ];

    for (const index of indexes) {
      try {
        await blogPostsCollection.createIndex(index);
        console.log(`✅ Created index:`, index);
      } catch (error) {
        if (error.code === 85) {
          console.log(`ℹ️  Index already exists:`, index);
        } else {
          console.error(`❌ Failed to create index:`, index, error.message);
        }
      }
    }

    // Get collection stats
    const stats = await blogPostsCollection.stats();
    console.log('\n📈 Collection Statistics:');
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Average document size: ${Math.round(stats.avgObjSize)} bytes`);
    console.log(`   Total size: ${Math.round(stats.size / 1024)} KB`);
    console.log(`   Indexes: ${stats.nindexes}`);

    // List all indexes
    const indexInfo = await blogPostsCollection.listIndexes().toArray();
    console.log('\n🗂️  Current Indexes:');
    indexInfo.forEach(index => {
      console.log(`   ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the optimization
optimizeDatabase().catch(console.error);