import mongoose, { Schema, Document } from 'mongoose';

// Interface for the ContactMessage document
export interface IContactMessage extends Document {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  country?: string;
  countryCode?: string;
  phoneCode?: string;
  phoneNumber?: string;
  purpose?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const ContactMessageSchema: Schema<IContactMessage> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  firstName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  country: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  countryCode: {
    type: String,
    required: false,
    trim: true,
    maxlength: 10,
    validate: {
      validator: function(v: string) {
        return !v || /^\+\d{1,4}$/.test(v);
      },
      message: 'Please enter a valid country code (e.g., +1, +91)'
    }
  },
  phoneCode: {
    type: String,
    required: false,
    trim: true,
    maxlength: 10
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true,
    maxlength: 20,
    validate: {
      validator: function(v: string) {
        return !v || /^[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  purpose: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    required: true,
    enum: ['unread', 'read', 'replied'],
    default: 'unread'
  }
}, {
  timestamps: true,
  collection: 'contactmessages'
});

// Indexes for performance
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });

// Static method to get unread count
ContactMessageSchema.statics.getUnreadCount = function() {
  return this.countDocuments({ status: 'unread' });
};

// Static method to mark as read
ContactMessageSchema.statics.markAsRead = function(id: string) {
  return this.findByIdAndUpdate(id, { status: 'read' }, { new: true });
};

// Create and export the model
const ContactMessage = mongoose.models.ContactMessage || mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);

export default ContactMessage;