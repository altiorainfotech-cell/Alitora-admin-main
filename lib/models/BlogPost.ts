import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for image items
export interface IImageItem {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

// Interface for content sections
export interface IContentSection {
  id: string;
  type: 'title' | 'content';
  value: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

// Interface for the BlogPost document
export interface IBlogPost extends Document {
  id: string; // Custom ID following pattern: "slug-year-number"
  title: string;
  href: string; // URL path: "/blog/slug"
  image: string; // Featured image URL or path
  images?: IImageItem[]; // Additional images
  contentSections?: IContentSection[]; // Dynamic content sections
  category: string;
  date: string; // ISO date format
  content?: string; // Rich text content (optional for imported data)
  excerpt?: string; // Auto-generated or manual
  status: 'draft' | 'published' | 'archived';
  author?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const BlogPostSchema: Schema<IBlogPost> = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  href: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return v.startsWith('/blog/');
      },
      message: 'href must start with /blog/'
    }
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      required: true,
      trim: true
    },
    caption: {
      type: String,
      trim: true
    }
  }],
  contentSections: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['title', 'content']
    },
    value: {
      type: String,
      required: true
    },
    fontSize: {
      type: String,
      trim: true
    },
    fontWeight: {
      type: String,
      enum: ['normal', 'bold'],
      default: 'normal'
    },
    textAlign: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'left'
    },
    color: {
      type: String,
      trim: true,
      default: '#ffffff'
    }
  }],
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return !isNaN(Date.parse(v));
      },
      message: 'Date must be a valid ISO date string'
    }
  },
  content: {
    type: String,
    default: ''
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  author: {
    type: String,
    trim: true,
    default: 'Admin'
  },
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    keywords: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'blogposts'
});

// Indexes for performance optimization
// Note: id field already has unique: true in schema, so no need for separate index
BlogPostSchema.index({ status: 1, date: -1 }); // For published posts sorted by date
BlogPostSchema.index({ category: 1, status: 1 }); // For category filtering
BlogPostSchema.index({ author: 1 }); // For author filtering
BlogPostSchema.index({ 'seo.keywords': 1 }); // For keyword search

// Pre-save middleware to auto-generate excerpt if not provided
BlogPostSchema.pre('save', function(next) {
  if (!this.excerpt && this.content) {
    // Generate excerpt from content (first 150 characters, strip HTML)
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 150).trim() + (plainText.length > 150 ? '...' : '');
  }
  next();
});

// Static method to find published posts
BlogPostSchema.statics.findPublished = function() {
  return this.find({ status: 'published' }).sort({ date: -1 });
};

// Static method to find by category
BlogPostSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, status: 'published' }).sort({ date: -1 });
};

// Instance method to publish a post
BlogPostSchema.methods.publish = function() {
  this.status = 'published';
  if (!this.date) {
    this.date = new Date().toISOString();
  }
  return this.save();
};

// Create and export the model
const BlogPost: Model<IBlogPost> = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPost;