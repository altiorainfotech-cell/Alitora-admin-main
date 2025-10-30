import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for OpenGraph metadata
export interface IOpenGraph {
  title?: string;
  description?: string;
  image?: string;
}

// Interface for the SEOPage document
export interface ISEOPage extends Document {
  siteId: string;
  path: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  robots: string;
  isCustom: boolean;
  pageCategory: string;
  openGraph?: IOpenGraph;
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

// Schema definition
const SEOPageSchema: Schema<ISEOPage> = new Schema({
  siteId: {
    type: String,
    required: true,
    trim: true,
    default: 'altiorainfotech'
  },
  path: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return v.startsWith('/') || v === 'home';
      },
      message: 'Path must start with / or be "home" for root page'
    }
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        // URL-friendly slug validation
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
      },
      message: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)'
    }
  },
  metaTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  robots: {
    type: String,
    required: true,
    trim: true,
    default: 'index,follow',
    validate: {
      validator: function(v: string) {
        // Basic robots.txt directive validation
        const validDirectives = ['index', 'noindex', 'follow', 'nofollow', 'archive', 'noarchive', 'snippet', 'nosnippet'];
        const directives = v.split(',').map(d => d.trim().toLowerCase());
        return directives.every(directive => validDirectives.includes(directive));
      },
      message: 'Invalid robots directive'
    }
  },
  isCustom: {
    type: Boolean,
    required: true,
    default: false
  },
  pageCategory: {
    type: String,
    required: true,
    trim: true,
    enum: ['main', 'services', 'blog', 'about', 'contact', 'other'],
    default: 'other'
  },
  openGraph: {
    title: {
      type: String,
      trim: true,
      maxlength: [60, 'OpenGraph title cannot exceed 60 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [160, 'OpenGraph description cannot exceed 160 characters']
    },
    image: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: 'OpenGraph image must be a valid URL'
      }
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, {
  timestamps: true,
  collection: 'seo_pages'
});

// Compound indexes for uniqueness and performance
SEOPageSchema.index({ siteId: 1, path: 1 }, { unique: true });
SEOPageSchema.index({ siteId: 1, slug: 1 }, { unique: true });
SEOPageSchema.index({ updatedAt: -1 });
SEOPageSchema.index({ pageCategory: 1, isCustom: 1 });

// Static method to find by path
SEOPageSchema.statics.findByPath = function(siteId: string, path: string) {
  return this.findOne({ siteId, path });
};

// Static method to find by slug
SEOPageSchema.statics.findBySlug = function(siteId: string, slug: string) {
  return this.findOne({ siteId, slug });
};

// Static method to find custom pages
SEOPageSchema.statics.findCustomPages = function(siteId: string) {
  return this.find({ siteId, isCustom: true }).sort({ updatedAt: -1 });
};

// Static method to find by category
SEOPageSchema.statics.findByCategory = function(siteId: string, category: string) {
  return this.find({ siteId, pageCategory: category }).sort({ path: 1 });
};

// Instance method to mark as custom
SEOPageSchema.methods.markAsCustom = function() {
  this.isCustom = true;
  return this.save();
};

// Pre-save middleware to ensure updatedBy is set
SEOPageSchema.pre('save', function(next) {
  if (this.isNew && !this.createdBy) {
    return next(new Error('createdBy is required for new SEO pages'));
  }
  if (!this.updatedBy) {
    return next(new Error('updatedBy is required'));
  }
  
  // Mark as custom if any SEO fields are modified
  if (this.isModified('metaTitle') || this.isModified('metaDescription') || this.isModified('slug')) {
    this.isCustom = true;
  }
  
  next();
});

// Add static method types to the interface
interface ISEOPageModel extends mongoose.Model<ISEOPage> {
  findByPath(siteId: string, path: string): Promise<ISEOPage | null>;
  findBySlug(siteId: string, slug: string): Promise<ISEOPage | null>;
  findCustomPages(siteId: string): Promise<ISEOPage[]>;
  findByCategory(siteId: string, category: string): Promise<ISEOPage[]>;
}

// Create and export the model with safe model creation
const SEOPage = (() => {
  // Check if mongoose.models exists (it might be undefined in Edge Runtime)
  if (mongoose.models && mongoose.models.SEOPage) {
    return mongoose.models.SEOPage as ISEOPageModel;
  }
  
  // Create new model if it doesn't exist
  try {
    return mongoose.model<ISEOPage>('SEOPage', SEOPageSchema) as ISEOPageModel;
  } catch (error) {
    // If model creation fails, return a placeholder that will be handled by the connection logic
    return null as any;
  }
})();

export default SEOPage;