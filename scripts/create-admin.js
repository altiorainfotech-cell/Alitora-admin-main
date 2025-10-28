const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new AdminUser({
      email: 'admin@example.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      permissions: {
        dashboard: true,
        blogs: 'full',
        staff: 'full',
        users: 'full',
        messages: 'full',
        settings: 'full',
        activity: 'full'
      }
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser();