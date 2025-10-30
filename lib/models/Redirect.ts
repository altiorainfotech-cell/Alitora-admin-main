import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the Redirect document
export interface IRedirect extends Document {
  siteId: string;
  from: string;
  to: string;
  statusCode: number;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

// Schema definition
const RedirectSchema: Schema<IRedirect> = new Schema({
  siteId: {
    type: String,
    required: true,
    trim: true,
    default: 'altiorainfotech',
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_-]+$/.test(v);
      },
      message: 'Site ID must contain only letters, numbers, underscores, and hyphens'
    }
  },
  from: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Allow both full paths and slugs
        return v.length > 0 && v.length <= 500;
      },
      message: 'From path must be between 1 and 500 characters'
    }
  },
  to: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Allow both full paths and slugs
        return v.length > 0 && v.length <= 500;
      },
      message: 'To path must be between 1 and 500 characters'
    }
  },
  statusCode: {
    type: Number,
    required: true,
    default: 301,
    validate: {
      validator: function(v: number) {
        // Valid redirect status codes
        return [301, 302, 303, 307, 308].includes(v);
      },
      message: 'Status code must be a valid redirect code (301, 302, 303, 307, 308)'
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
  collection: 'redirects'
});

// Compound index for uniqueness and performance
RedirectSchema.index({ siteId: 1, from: 1 }, { unique: true });
RedirectSchema.index({ createdAt: -1 });
RedirectSchema.index({ siteId: 1, statusCode: 1 });

// Validation to prevent redirect loops
RedirectSchema.pre('save', function(next) {
  if (this.from === this.to) {
    return next(new Error('Redirect cannot point to itself'));
  }
  next();
});

// Static method to find redirect by source path
RedirectSchema.statics.findByFrom = function(siteId: string, from: string) {
  return this.findOne({ siteId, from });
};

// Static method to find all redirects for a site
RedirectSchema.statics.findBySite = function(siteId: string) {
  return this.find({ siteId }).sort({ createdAt: -1 });
};

// Static method to find redirects by status code
RedirectSchema.statics.findByStatusCode = function(siteId: string, statusCode: number) {
  return this.find({ siteId, statusCode }).sort({ createdAt: -1 });
};

// Static method to check for redirect chains
RedirectSchema.statics.checkRedirectChain = async function(siteId: string, from: string, to: string, maxDepth: number = 5) {
  let currentPath = to;
  let depth = 0;
  const visited = new Set([from]);

  while (depth < maxDepth) {
    const redirect = await this.findOne({ siteId, from: currentPath });
    if (!redirect) {
      return { hasChain: false, depth };
    }

    if (visited.has(redirect.to)) {
      return { hasChain: true, depth, isLoop: true };
    }

    visited.add(redirect.to);
    currentPath = redirect.to;
    depth++;
  }

  return { hasChain: true, depth, isLoop: false };
};

// Instance method to validate redirect doesn't create a loop
RedirectSchema.methods.validateNoLoop = async function() {
  const Model = this.constructor as IRedirectModel;
  const result = await Model.checkRedirectChain(this.siteId, this.from, this.to);
  
  if (result.isLoop) {
    throw new Error('Redirect would create an infinite loop');
  }
  
  if (result.hasChain && result.depth >= 5) {
    throw new Error('Redirect chain too long (maximum 5 redirects)');
  }
  
  return true;
};

// Add static method types to the interface
interface IRedirectModel extends mongoose.Model<IRedirect> {
  findByFrom(siteId: string, from: string): Promise<IRedirect | null>;
  findBySite(siteId: string): Promise<IRedirect[]>;
  findByStatusCode(siteId: string, statusCode: number): Promise<IRedirect[]>;
  checkRedirectChain(siteId: string, from: string, to: string, maxDepth?: number): Promise<{
    hasChain: boolean;
    depth: number;
    isLoop?: boolean;
  }>;
}

// Create and export the model with safe model creation
const Redirect = (() => {
  // Check if mongoose.models exists (it might be undefined in Edge Runtime)
  if (mongoose.models && mongoose.models.Redirect) {
    return mongoose.models.Redirect as IRedirectModel;
  }
  
  // Create new model if it doesn't exist
  try {
    return mongoose.model<IRedirect>('Redirect', RedirectSchema) as IRedirectModel;
  } catch (error) {
    // If model creation fails, return a placeholder that will be handled by the connection logic
    return null as any;
  }
})();

export default Redirect;