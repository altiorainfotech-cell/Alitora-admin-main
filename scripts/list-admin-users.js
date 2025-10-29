const mongoose = require('mongoose');

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

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function listAdminUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // List all admin users
    const users = await AdminUser.find({}).select('-password');
    
    console.log('\n=== Admin Users ===');
    users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error listing admin users:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listAdminUsers();