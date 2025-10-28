// Role and Status enums
export enum Role {
  ADMIN = 'admin',
  SEO = 'seo',
  CUSTOM = 'custom'
}

export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// Permission types
export type PermissionLevel = 'none' | 'read' | 'write' | 'full'

export interface Permissions {
  dashboard: boolean
  blogs: PermissionLevel
  staff: PermissionLevel
  users: PermissionLevel
  messages: PermissionLevel
  settings: PermissionLevel
  activity: PermissionLevel
}

// Other common types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface User {
  id: string
  email: string
  username?: string
  role: 'admin' | 'editor'
  status: 'active' | 'inactive'
  createdAt?: Date
  updatedAt?: Date
  lastLogin?: Date
}

export interface AdminUser {
  _id: string
  email: string
  name: string
  role: 'admin' | 'seo' | 'custom'
  status: 'active' | 'inactive'
  permissions?: Permissions
  createdAt?: Date
  updatedAt?: Date
  lastLogin?: Date
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}