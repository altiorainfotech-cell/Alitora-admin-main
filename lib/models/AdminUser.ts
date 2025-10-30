import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for the AdminUser document
// Permission interface for granular access control
export interface IPermissions {
  // Page access permissions
  dashboard: boolean;
  blogs: 'none' | 'read' | 'write' | 'full';
  staff: 'none' | 'read' | 'write' | 'full';
  users: 'none' | 'read' | 'write' | 'full';
  messages: 'none' | 'read' | 'write' | 'full';
  settings: 'none' | 'read' | 'write' | 'full';
  activity: 'none' | 'read' | 'write' | 'full';
  seo: 'none' | 'read' | 'write' | 'full';
}

export interface IAdminUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'seo' | 'custom';
  status: 'active' | 'inactive';
  permissions?: IPermissions;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IAdminUser>;
  hasPermission(page: keyof IPermissions, action: 'read' | 'write' | 'delete'): boolean;
}

// Default permissions for different roles
const getDefaultPermissions = (role: 'admin' | 'seo' | 'custom'): IPermissions => {
  switch (role) {
    case 'admin':
      return {
        dashboard: true,
        blogs: 'full',
        staff: 'full',
        users: 'full',
        messages: 'full',
        settings: 'full',
        activity: 'full',
        seo: 'full'
      };
    case 'seo':
      return {
        dashboard: true,
        blogs: 'full',
        staff: 'read',
        users: 'none',
        messages: 'read',
        settings: 'none',
        activity: 'read',
        seo: 'full'
      };
    case 'custom':
      return {
        dashboard: true,
        blogs: 'none',
        staff: 'none',
        users: 'none',
        messages: 'none',
        settings: 'none',
        activity: 'none',
        seo: 'none'
      };
    default:
      return getDefaultPermissions('custom');
  }
};

// Schema definition
const AdminUserSchema: Schema<IAdminUser> = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        // Basic email validation
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'seo', 'custom'],
    default: 'custom'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  permissions: {
    dashboard: { type: Boolean, default: true },
    blogs: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    staff: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    users: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    messages: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    settings: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    activity: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' },
    seo: { type: String, enum: ['none', 'read', 'write', 'full'], default: 'none' }
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'adminusers'
});

// Indexes for performance optimization
AdminUserSchema.index({ role: 1, status: 1 }); // For role-based queries
AdminUserSchema.index({ lastLogin: -1 }); // For activity tracking

// Instance method to compare password
AdminUserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last login
AdminUserSchema.methods.updateLastLogin = async function(): Promise<IAdminUser> {
  this.lastLogin = new Date();
  return await this.save();
};

// Instance method to check permissions
AdminUserSchema.methods.hasPermission = function(page: keyof IPermissions, action: 'read' | 'write' | 'delete'): boolean {
  if (this.role === 'admin') return true;
  
  const permission = this.permissions?.[page];
  if (!permission || permission === 'none') return false;
  
  switch (action) {
    case 'read':
      return ['read', 'write', 'full'].includes(permission);
    case 'write':
      return ['write', 'full'].includes(permission);
    case 'delete':
      return permission === 'full';
    default:
      return false;
  }
};

// Static method to find active users
AdminUserSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).select('-password');
};

// Static method to find by role
AdminUserSchema.statics.findByRole = function(role: 'admin' | 'seo' | 'custom') {
  return this.find({ role, status: 'active' }).select('-password');
};

// Static method to authenticate user
AdminUserSchema.statics.authenticate = async function(email: string, password: string) {
  try {
    const user = await this.findOne({ 
      email,
      status: 'active' 
    });
    
    if (!user) {
      return null;
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return null;
    }
    
    // Update last login
    await user.updateLastLogin();
    
    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

// Pre-save middleware to set default permissions based on role
AdminUserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    this.permissions = { ...getDefaultPermissions(this.role), ...this.permissions };
  }
  next();
});

// Add static method types to the interface
interface IAdminUserModel extends mongoose.Model<IAdminUser> {
  authenticate(username: string, password: string): Promise<any>;
  findActive(): Promise<IAdminUser[]>;
  findByRole(role: 'admin' | 'seo' | 'custom'): Promise<IAdminUser[]>;
}

// Transform output to remove sensitive data
AdminUserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Create and export the model
const AdminUser = (mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema)) as IAdminUserModel;

export default AdminUser;