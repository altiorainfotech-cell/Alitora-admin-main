import mongoose, { Schema, Document } from 'mongoose';

export interface ISEOAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  siteId: string;
  action: 'create' | 'update' | 'delete' | 'reset' | 'bulk_update' | 'bulk_delete' | 'bulk_reset' | 'slug_change' | 'redirect_create';
  entityType: 'seo_page' | 'redirect';
  entityId?: string;
  path?: string;
  oldSlug?: string;
  newSlug?: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    bulkOperation?: boolean;
    affectedPaths?: string[];
    redirectCreated?: boolean;
  };
  performedBy: mongoose.Types.ObjectId;
  performedAt: Date;
}

const SEOAuditLogSchema = new Schema<ISEOAuditLog>({
  siteId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'reset', 'bulk_update', 'bulk_delete', 'bulk_reset', 'slug_change', 'redirect_create'],
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['seo_page', 'redirect'],
    required: true,
    index: true
  },
  entityId: {
    type: String,
    index: true
  },
  path: {
    type: String,
    index: true
  },
  oldSlug: String,
  newSlug: String,
  changes: [{
    field: {
      type: String,
      required: true
    },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    bulkOperation: {
      type: Boolean,
      default: false
    },
    affectedPaths: [String],
    redirectCreated: {
      type: Boolean,
      default: false
    }
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
    index: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We use performedAt instead
});

// Compound indexes for efficient querying
SEOAuditLogSchema.index({ siteId: 1, performedAt: -1 });
SEOAuditLogSchema.index({ siteId: 1, path: 1, performedAt: -1 });
SEOAuditLogSchema.index({ siteId: 1, performedBy: 1, performedAt: -1 });
SEOAuditLogSchema.index({ siteId: 1, action: 1, performedAt: -1 });

// TTL index to automatically delete old audit logs after 2 years
SEOAuditLogSchema.index({ performedAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

const SEOAuditLog = mongoose.models.SEOAuditLog || mongoose.model<ISEOAuditLog>('SEOAuditLog', SEOAuditLogSchema);

export default SEOAuditLog;