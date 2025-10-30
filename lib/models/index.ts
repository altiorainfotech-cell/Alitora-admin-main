// Export all models
export { default as BlogPost, type IBlogPost } from './BlogPost';
export { default as AdminUser, type IAdminUser } from './AdminUser';
export { default as FAQ, type IFAQ } from './FAQ';
export { default as SEOPage, type ISEOPage } from './SEOPage';
export { default as Redirect, type IRedirect } from './Redirect';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';