'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from './components/admin/ToastNotification'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  )
}