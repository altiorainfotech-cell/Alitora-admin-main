'use client'

import { ReactNode, createContext, useContext } from 'react'
import { cn } from '../utils'

// Context to track if we're in mobile or desktop mode
const TableModeContext = createContext<'desktop' | 'mobile'>('desktop')

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

interface ResponsiveTableHeaderProps {
  children: ReactNode
  className?: string
}

interface ResponsiveTableBodyProps {
  children: ReactNode
  className?: string
}

interface ResponsiveTableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface ResponsiveTableCellProps {
  children: ReactNode
  className?: string
  label?: string // For mobile view
  hideOnMobile?: boolean
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      {/* Desktop view */}
      <div className="hidden sm:block">
        <TableModeContext.Provider value="desktop">
          <table className="min-w-full divide-y divide-gray-700">
            {children}
          </table>
        </TableModeContext.Provider>
      </div>
      
      {/* Mobile view */}
      <div className="sm:hidden space-y-3">
        <TableModeContext.Provider value="mobile">
          {children}
        </TableModeContext.Provider>
      </div>
    </div>
  )
}

export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  const mode = useContext(TableModeContext)
  
  if (mode === 'mobile') {
    return null // Headers are not shown in mobile view
  }
  
  return (
    <thead className={cn('bg-gray-800', className)}>
      {children}
    </thead>
  )
}

export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  const mode = useContext(TableModeContext)
  
  if (mode === 'mobile') {
    return <>{children}</>
  }
  
  return (
    <tbody className={cn('bg-gray-900 divide-y divide-gray-700', className)}>
      {children}
    </tbody>
  )
}

export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  const mode = useContext(TableModeContext)
  
  if (mode === 'mobile') {
    return (
      <div 
        className={cn(
          'bg-gray-800 rounded-lg p-4 border border-gray-700',
          onClick && 'cursor-pointer touch-manipulation hover:bg-gray-750 active:bg-gray-700',
          className
        )}
        onClick={onClick}
      >
        {children}
      </div>
    )
  }
  
  return (
    <tr 
      className={cn(
        'hover:bg-gray-800 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function ResponsiveTableCell({ 
  children, 
  className, 
  label, 
  hideOnMobile = false 
}: ResponsiveTableCellProps) {
  const mode = useContext(TableModeContext)
  
  if (mode === 'mobile') {
    if (hideOnMobile) return null
    
    return (
      <div className="flex justify-between items-center py-1">
        {label && (
          <span className="text-sm font-medium text-gray-400 flex-shrink-0 mr-3">
            {label}:
          </span>
        )}
        <div className={cn('text-sm text-gray-300 text-right flex-1', className)}>
          {children}
        </div>
      </div>
    )
  }
  
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-sm text-gray-300', className)}>
      {children}
    </td>
  )
}

// Header cell component
export function ResponsiveTableHeaderCell({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <th className={cn('px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider', className)}>
      {children}
    </th>
  )
}