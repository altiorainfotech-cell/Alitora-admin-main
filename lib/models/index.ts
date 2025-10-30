// Export all models
export { default as BlogPost, type IBlogPost } from './BlogPost';
export { default as AdminUser, type IAdminUser } from './AdminUser';
export { default as FAQ, type IFAQ } from './FAQ';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';