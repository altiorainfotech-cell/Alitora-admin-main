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

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await AdminUser.findOne({ email: 'admin@altiorainfotech.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      process.exit(1);
    }

    // Reset password to a known value
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('Admin password reset successfully!');
    console.log('Email: admin@altiorainfotech.com');
    console.log('Password: admin123');
    console.log('Please change the password after login.');

  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdminPassword();