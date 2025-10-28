import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'seo' | 'custom';
  action: string;
  category: 'auth' | 'user' | 'blog' | 'image' | 'category' | 'settings' | 'system';
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}

const ActivityLogSchema: Schema<IActivityLog> = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['admin', 'seo', 'custom']
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['auth', 'user', 'blog', 'image', 'category', 'settings', 'system'],
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'activitylogs'
});

// Compound indexes for efficient querying
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ category: 1, timestamp: -1 });
ActivityLogSchema.index({ userRole: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log activity
ActivityLogSchema.statics.logActivity = async function(data: {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'admin' | 'seo' | 'custom';
  action: string;
  category: 'auth' | 'user' | 'blog' | 'image' | 'category' | 'settings' | 'system';
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const log = new this(data);
    return await log.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
};

// Static method to get user activities with pagination
ActivityLogSchema.statics.getUserActivities = async function(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    category,
    action,
    startDate,
    endDate
  } = options;

  const query: any = { userId };

  if (category) query.category = category;
  if (action) query.action = action;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get all activities (admin only)
ActivityLogSchema.statics.getAllActivities = async function(
  options: {
    page?: number;
    limit?: number;
    userId?: string;
    userRole?: string;
    category?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    userId,
    userRole,
    category,
    action,
    startDate,
    endDate
  } = options;

  const query: any = {};

  if (userId) query.userId = userId;
  if (userRole) query.userRole = userRole;
  if (category) query.category = category;
  if (action) query.action = action;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    this.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

interface IActivityLogModel extends Model<IActivityLog> {
  logActivity(data: any): Promise<IActivityLog>;
  getUserActivities(userId: string, options?: any): Promise<any>;
  getAllActivities(options?: any): Promise<any>;
}

const ActivityLog = (mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema)) as IActivityLogModel;

export default ActivityLog;