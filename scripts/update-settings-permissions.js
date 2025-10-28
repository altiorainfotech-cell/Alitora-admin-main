#!/usr/bin/env node

/**
 * Migration script to update settings permissions for all users
 * This ensures all users have 'full' access to settings page
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Simple AdminUser schema for the script
const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seo', 'custom'], default: 'admin' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  permissions: {
    dashboard: { type: Boolean, default: true },
    blogs: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' },
    staff: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' },
    users: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' },
    messages: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' },
    settings: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' },
    activity: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'full' }
  }
}, { timestamps: true, collection: 'adminusers' });

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

async function updateSettingsPermissions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all users that don't have 'full' settings permission
    const usersToUpdate = await AdminUser.find({
      $or: [
        { 'permissions.settings': { $ne: 'full' } },
        { 'permissions.settings': { $exists: false } }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users that need settings permission updates`);

    if (usersToUpdate.length === 0) {
      console.log('✅ All users already have full settings access');
      return;
    }

    let updatedCount = 0;

    for (const user of usersToUpdate) {
      try {
        // Update the user's settings permission to 'full'
        await AdminUser.findByIdAndUpdate(user._id, {
          $set: {
            'permissions.settings': 'full'
          }
        });

        console.log(`✅ Updated settings permission for user: ${user.email} (${user.role})`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Migration completed! Updated ${updatedCount} users.`);
    console.log('All users now have full access to the settings page.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run migration
updateSettingsPermissions();