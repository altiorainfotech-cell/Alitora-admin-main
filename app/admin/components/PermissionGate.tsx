'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { hasPermission, canAccessPage } from '@/lib/permissions'
import { IPermissions } from '@/lib/models/AdminUser'

interface PermissionGateProps {
  children: ReactNode
  page: keyof IPermissions
  action?: 'read' | 'write' | 'delete'
  fallback?: ReactNode
  requireAccess?: boolean // If true, checks page access instead of specific action
}

export default function PermissionGate({ 
  children, 
  page, 
  action = 'read', 
  fallback = null,
  requireAccess = false
}: PermissionGateProps) {
  const { data: session } = useSession()
  
  if (!session?.user) {
    return <>{fallback}</>
  }
  
  const user = session.user as any
  const userRole = user.role as 'admin' | 'seo' | 'custom'
  const userPermissions = user.permissions as IPermissions | undefined
  
  // Check if user has permission
  const hasAccess = requireAccess 
    ? canAccessPage(userPermissions, userRole, page)
    : hasPermission(userPermissions, userRole, page, action)
  
  if (!hasAccess) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { data: session } = useSession()
  const user = session?.user as any
  
  if (user?.role !== 'admin') {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

export function RoleGate({ 
  children, 
  allowedRoles, 
  fallback = null 
}: { 
  children: ReactNode
  allowedRoles: ('admin' | 'seo' | 'custom')[]
  fallback?: ReactNode 
}) {
  const { data: session } = useSession()
  const user = session?.user as any
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}