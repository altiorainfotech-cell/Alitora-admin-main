'use client'

import { User } from '@/types'

interface UserDeleteModalProps {
  user: User
  onConfirm: () => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function UserDeleteModal({ user, onConfirm, onCancel, isLoading = false }: UserDeleteModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-100">Delete User</h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Are you sure you want to delete the user <strong>{user.email}</strong>?
          </p>
          
          <div className="bg-gray-700 rounded-md p-3 mb-4">
            <p className="text-sm text-gray-300 mb-2">This action will:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Permanently delete the user account</li>
              <li>• Remove all associated activity logs</li>
              <li>• Transfer ownership of uploaded images to the system</li>
              <li>• Cannot be undone</li>
            </ul>
          </div>

          <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> This action is permanent and cannot be reversed.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Delete User
          </button>
        </div>
      </div>
    </div>
  )
}