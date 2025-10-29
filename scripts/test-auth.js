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

// Add the authenticate method
AdminUserSchema.statics.authenticate = async function(email, password) {
  try {
    const user = await this.findOne({ 
      email,
      status: 'active' 
    });
    
    if (!user) {
      return null;
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }
    
    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

const AdminUser = mongoose.model('AdminUser', AdminUserSchema);

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testAuth() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Test authentication
    console.log('Testing authentication...');
    const user = await AdminUser.authenticate('admin@altiorainfotech.com', 'admin123');
    
    if (user) {
      console.log('✅ Authentication successful!');
      console.log('User:', {
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status
      });
    } else {
      console.log('❌ Authentication failed!');
    }

  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAuth();