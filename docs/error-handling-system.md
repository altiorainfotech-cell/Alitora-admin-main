# Error Handling and Validation System

This document describes the comprehensive error handling and validation system implemented for the admin panel.

## Overview

The error handling system provides:
- Client-side form validation with Zod schemas
- Error boundary components for graceful error handling
- API error handling with structured error responses
- Retry mechanisms for failed operations
- Toast notifications for user feedback

## Components

### 1. Error Boundary Components

#### `ErrorBoundary`
Main error boundary component that catches JavaScript errors anywhere in the component tree.

```tsx
import ErrorBoundary from '@/lib/components/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Features:
- Catches and displays errors gracefully
- Shows different UI in development vs production
- Provides "Try Again" functionality
- Logs errors for debugging

#### `FormErrorBoundary`
Specialized error boundary for form components.

```tsx
import { FormErrorBoundary } from '@/lib/components/ErrorBoundary'

<FormErrorBoundary onError={(error) => console.log(error)}>
  <YourForm />
</FormErrorBoundary>
```

#### `ApiErrorBoundary`
Specialized error boundary for API-related components.

```tsx
import { ApiErrorBoundary } from '@/lib/components/ErrorBoundary'

<ApiErrorBoundary>
  <DataFetchingComponent />
</ApiErrorBoundary>
```

### 2. Form Validation Components

#### `FormField`
Enhanced input component with built-in validation.

```tsx
import { FormField } from '@/lib/components/FormField'
import { z } from 'zod'

<FormField
  label="Email"
  type="email"
  schema={z.string().email('Invalid email')}
  validateOnBlur
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

Features:
- Real-time validation with Zod schemas
- Visual feedback (success/error states)
- Accessibility support with proper labels
- Customizable validation timing

#### `FormTextarea` and `FormSelect`
Similar components for textarea and select inputs with the same validation features.

### 3. Toast Notification System

#### `ToastProvider`
Context provider for toast notifications.

```tsx
import { ToastProvider } from '@/lib/components/Toast'

<ToastProvider>
  <App />
</ToastProvider>
```

#### Toast Hooks
Convenient hooks for different types of notifications.

```tsx
import { useSuccessToast, useErrorToast, useWarningToast, useInfoToast } from '@/lib/components/Toast'

function MyComponent() {
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const handleSuccess = () => {
    successToast('Success!', 'Operation completed successfully')
  }

  const handleError = () => {
    errorToast('Error!', 'Something went wrong')
  }
}
```

### 4. API Error Handling

#### `ApiError` Class
Custom error class for structured API errors.

```tsx
import { ApiError, ApiErrorCode } from '@/lib/api-error-handler'

throw new ApiError(
  'Resource not found',
  ApiErrorCode.NOT_FOUND,
  404
)
```

#### Error Handler Function
Centralized error handling for API routes.

```tsx
import { handleApiError, withErrorHandler } from '@/lib/api-error-handler'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Your API logic here
  // Errors are automatically caught and handled
})
```

#### Structured Error Responses
All API errors return consistent structure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### 5. Retry Mechanisms

#### `useRetry` Hook
Generic retry hook for any async operation.

```tsx
import { useRetry } from '@/lib/hooks/useRetry'

function MyComponent() {
  const { execute, state } = useRetry(
    async (data) => {
      // Your async operation
      return await apiCall(data)
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffFactor: 2
    }
  )

  const handleSubmit = async () => {
    try {
      const result = await execute(formData)
      // Handle success
    } catch (error) {
      // Handle final failure
    }
  }

  return (
    <div>
      <button onClick={handleSubmit} disabled={state.isRetrying}>
        {state.isRetrying ? 'Retrying...' : 'Submit'}
      </button>
      {state.canRetry && (
        <button onClick={() => execute(formData)}>
          Retry
        </button>
      )}
    </div>
  )
}
```

#### `useApiRetry` Hook
Specialized retry hook for API calls.

```tsx
import { useApiRetry } from '@/lib/hooks/useRetry'

const { execute, state } = useApiRetry(
  apiCall,
  {
    maxAttempts: 3,
    retryOn: 'network' // 'network' | 'server' | 'all'
  }
)
```

### 6. Enhanced Form Hook

#### `useEnhancedForm`
Comprehensive form hook with validation, error handling, and retry support.

```tsx
import { useEnhancedForm } from '@/lib/hooks/useEnhancedForm'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
})

function MyForm() {
  const form = useEnhancedForm({
    schema,
    initialValues: { name: '', email: '' },
    onSubmit: async (data) => {
      await api.createUser(data)
    },
    onSuccess: (data) => {
      successToast('User created', `${data.name} was created successfully`)
    },
    onError: (error) => {
      errorToast('Error', error)
    },
    retryOptions: {
      maxAttempts: 3,
      retryOn: 'network'
    }
  })

  return (
    <form onSubmit={form.handleSubmit}>
      <FormField
        label="Name"
        {...form.getFieldProps('name')}
        schema={z.string().min(1)}
      />
      <FormField
        label="Email"
        {...form.getFieldProps('email')}
        schema={z.string().email()}
      />
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

### 7. API Client with Error Handling

#### `ApiClient` Class
HTTP client with built-in retry and error handling.

```tsx
import { apiClient, api } from '@/lib/api-client'

// Direct client usage
const response = await apiClient.get('/api/users')

// Typed API methods
const users = await api.getUsers({ page: 1, limit: 20 })
const newUser = await api.createUser({ name: 'John', email: 'john@example.com' })
```

Features:
- Automatic retries for network/server errors
- Timeout handling
- Request/response interceptors
- File upload with progress tracking

## Usage Examples

### Complete Form with Error Handling

```tsx
import React from 'react'
import { z } from 'zod'
import { useEnhancedForm } from '@/lib/hooks/useEnhancedForm'
import { FormField } from '@/lib/components/FormField'
import { FormErrorBoundary } from '@/lib/components/ErrorBoundary'
import { ToastProvider, useSuccessToast, useErrorToast } from '@/lib/components/Toast'
import { api } from '@/lib/api-client'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional()
})

function CategoryForm() {
  const successToast = useSuccessToast()
  const errorToast = useErrorToast()

  const form = useEnhancedForm({
    schema: categorySchema,
    initialValues: { name: '', description: '' },
    validateOnBlur: true,
    retryOptions: { maxAttempts: 3, retryOn: 'network' },
    onSubmit: async (data) => {
      await api.createCategory(data)
    },
    onSuccess: (data) => {
      successToast('Category Created', `"${data.name}" was created successfully`)
    },
    onError: (error, details) => {
      if (details?.code === 'CONFLICT') {
        form.setFieldError('name', 'A category with this name already exists')
      } else {
        errorToast('Error', error)
      }
    }
  })

  return (
    <ToastProvider>
      <FormErrorBoundary>
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormField
            label="Category Name"
            required
            schema={z.string().min(1).max(50)}
            {...form.getFieldProps('name')}
          />
          
          <FormField
            label="Description"
            schema={z.string().max(200).optional()}
            {...form.getFieldProps('description')}
          />

          {form.hasErrors && form.submitCount > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
              <h4 className="text-red-400 font-medium">Please fix the errors:</h4>
              <ul className="text-red-300 text-sm mt-1">
                {Object.entries(form.errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {form.retryState.canRetry && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
              <p className="text-yellow-300">Submission failed. You can try again.</p>
              <button
                type="button"
                onClick={() => form.retryState.retry()}
                className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={form.isSubmitting || form.hasErrors}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
          >
            {form.isSubmitting ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </FormErrorBoundary>
    </ToastProvider>
  )
}
```

### API Route with Error Handling

```tsx
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  validateRequest,
  createAuthError,
  createConflictError
} from '@/lib/api-error-handler'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional()
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw createAuthError()
  }

  const body = await request.json()
  const data = validateRequest(createCategorySchema, body)

  // Check for existing category
  const existing = await prisma.category.findUnique({
    where: { name: data.name }
  })

  if (existing) {
    throw createConflictError('Category name already exists')
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description
    }
  })

  return createSuccessResponse(category, 'Category created successfully', 201)
})
```

## Error Codes

The system uses standardized error codes:

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_SERVER_ERROR` - Server error
- `BAD_REQUEST` - Invalid request
- `EXTERNAL_SERVICE_ERROR` - External service unavailable
- `DATABASE_ERROR` - Database operation failed

## Best Practices

1. **Always wrap forms in error boundaries**
2. **Use structured error responses in API routes**
3. **Implement retry logic for network operations**
4. **Provide clear, actionable error messages**
5. **Log errors appropriately (console in dev, service in prod)**
6. **Use toast notifications for user feedback**
7. **Validate on both client and server**
8. **Handle edge cases gracefully**

## Testing

The system includes comprehensive tests covering:
- Error boundary functionality
- Form validation
- Toast notifications
- Retry mechanisms
- API error handling

Run tests with:
```bash
npm run test:ci -- __tests__/lib/error-handling.test.tsx
```

## Integration

To integrate the error handling system into your components:

1. Wrap your app in `ToastProvider`
2. Use `ErrorBoundary` components around error-prone areas
3. Use `FormField` components for form inputs
4. Use `useEnhancedForm` for complex forms
5. Use `api` client for API calls
6. Implement `withErrorHandler` in API routes

This system provides a robust foundation for handling errors gracefully throughout the admin panel application.