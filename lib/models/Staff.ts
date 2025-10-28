import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  name: string;
  title: string;
  avatar: string;
  cloudinaryPublicId?: string;
  isVisible: boolean;
  order: number;
  bio?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema<IStaff> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  avatar: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    trim: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  linkedin: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'staffs'
});

// Indexes for performance
StaffSchema.index({ isVisible: 1, order: 1 });
StaffSchema.index({ name: 1 });

// Static method to get visible staff ordered
StaffSchema.statics.getVisibleStaff = function() {
  return this.find({ isVisible: true }).sort({ order: 1, createdAt: 1 });
};

// Create and export the model
const Staff = mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);

export default Staff;