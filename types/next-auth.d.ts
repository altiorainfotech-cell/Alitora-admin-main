import { IPermissions } from '@/lib/models/AdminUser'

// Define types locally to match our RBAC system
export type Role = 'admin' | 'seo' | 'custom'
export type Status = 'active' | 'inactive'

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: Role
      status: Status
      permissions?: IPermissions
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: Role
    status: Status
    permissions?: IPermissions
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role: Role
    status: Status
    permissions?: IPermissions
    name?: string
  }
}