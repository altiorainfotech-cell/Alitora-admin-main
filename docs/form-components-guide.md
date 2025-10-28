# Form Components Guide

This guide explains how to use the reusable form components and UI consistency features implemented for the admin panel.

## Overview

The form components provide a consistent dark-themed interface with built-in validation, error handling, loading states, and accessibility features. All components follow the established design patterns and integrate seamlessly with the existing admin panel.

## Components

### FormInput

A reusable input component with dark theme styling, validation, and error handling.

```tsx
import { FormInput } from '@/lib/components/ui'

<FormInput
  label="Email Address"
  placeholder="user@example.com"
  type="email"
  required
  error={errors.email?.message}
  helperText="We'll never share your email"
  loading={isSubmitting}
  {...register('email')}
/>
```

**Props:**
- `label?: string` - Field label
- `error?: string` - Error message to display
- `helperText?: string` - Helper text shown when no error
- `required?: boolean` - Shows required indicator (*)
- `loading?: boolean` - Disables input and shows loading state
- All standard HTML input props

### FormTextarea

A textarea component with the same styling and features as FormInput.

```tsx
import { FormTextarea } from '@/lib/components/ui'

<FormTextarea
  label="Description"
  placeholder="Enter description"
  rows={4}
  error={errors.description?.message}
  loading={isSubmitting}
  {...register('description')}
/>
```

### FormSelect

A select dropdown with dark theme styling and validation.

```tsx
import { FormSelect } from '@/lib/components/ui'

<FormSelect
  label="Category"
  placeholder="Choose a category"
  required
  error={errors.category?.message}
  loading={isSubmitting}
  {...register('category')}
>
  <option value="design">Design</option>
  <option value="development">Development</option>
  <option value="marketing">Marketing</option>
</FormSelect>
```

### MultiSelectCategories

A sophisticated multi-select component with checkboxes, search, and category management.

```tsx
import { MultiSelectCategories } from '@/lib/components/ui'

const [selectedCategories, setSelectedCategories] = useState<string[]>([])

<MultiSelectCategories
  categories={categories}
  selected={selectedCategories}
  onChange={setSelectedCategories}
  label="Select Categories"
  helperText="Choose one or more categories"
  searchable
  showImageCount
  maxSelections={5}
  loading={isSubmitting}
/>
```

**Props:**
- `categories: Category[]` - Array of category objects
- `selected: string[]` - Array of selected category IDs
- `onChange: (selected: string[]) => void` - Selection change handler
- `searchable?: boolean` - Enable search functionality
- `showImageCount?: boolean` - Show image counts next to categories
- `maxSelections?: number` - Limit number of selections
- `loading?: boolean` - Disable interactions during loading

### Button

A versatile button component with multiple variants and loading states.

```tsx
import { Button } from '@/lib/components/ui'

<Button
  variant="primary"
  size="md"
  loading={isSubmitting}
  loadingText="Saving..."
  icon={<Save className="h-4 w-4" />}
  onClick={handleSubmit}
>
  Save Changes
</Button>
```

**Variants:**
- `primary` - Blue background (default)
- `secondary` - Gray background
- `danger` - Red background
- `ghost` - Transparent background

**Sizes:**
- `sm` - Small padding
- `md` - Medium padding (default)
- `lg` - Large padding

### FormCard

A container component for forms with optional loading overlay.

```tsx
import { FormCard, FormSection } from '@/lib/components/ui'

<FormCard
  title="User Information"
  description="Update your profile details"
  loading={isSubmitting}
  loadingText="Saving changes..."
>
  <FormSection title="Basic Information">
    <FormInput label="Name" {...register('name')} />
    <FormInput label="Email" {...register('email')} />
  </FormSection>
  
  <FormSection title="Preferences">
    <FormSelect label="Theme" {...register('theme')}>
      <option value="dark">Dark</option>
      <option value="light">Light</option>
    </FormSelect>
  </FormSection>
</FormCard>
```

### Loading Components

Various loading indicators for different use cases.

```tsx
import { LoadingSpinner, LoadingOverlay, LoadingButton } from '@/lib/components/ui'

// Spinner
<LoadingSpinner size="lg" text="Loading..." />

// Overlay (automatically positioned)
<LoadingOverlay isLoading={true} text="Processing..." />

// Button with loading state
<LoadingButton loading={isSubmitting} loadingText="Saving...">
  Save
</LoadingButton>
```

## Toast Notification System

A comprehensive toast system for user feedback.

### Setup

Wrap your admin layout with the ToastProvider:

```tsx
import { ToastProvider } from '@/lib/components/ui'

export default function AdminLayout({ children }) {
  return (
    <ToastProvider>
      {/* Your admin content */}
      {children}
    </ToastProvider>
  )
}
```

### Usage

```tsx
import { useToast } from '@/lib/components/ui'

function MyComponent() {
  const { success, error, warning, info } = useToast()

  const handleSuccess = () => {
    success('Upload complete!', 'Your image has been uploaded successfully.')
  }

  const handleError = () => {
    error('Upload failed', 'Please check your file and try again.')
  }

  const handleWarning = () => {
    warning('Storage almost full', 'Consider deleting old files.')
  }

  const handleInfo = () => {
    info('New feature available', 'Check out the new bulk operations.')
  }

  return (
    <div>
      <Button onClick={handleSuccess}>Success</Button>
      <Button onClick={handleError}>Error</Button>
      <Button onClick={handleWarning}>Warning</Button>
      <Button onClick={handleInfo}>Info</Button>
    </div>
  )
}
```

**Toast Options:**
- `title: string` - Main message
- `message?: string` - Additional details
- `duration?: number` - Auto-dismiss time (default: 5000ms, 0 = no auto-dismiss)
- `action?: { label: string, onClick: () => void }` - Action button

## Form Validation

### useFormValidation Hook

A custom hook that integrates Zod validation with form handling.

```tsx
import { useFormValidation } from '@/lib/hooks/useFormValidation'
import { imageUploadSchema } from '@/lib/utils/formValidation'

function ImageUploadForm() {
  const { success, error } = useToast()

  const {
    errors,
    isSubmitting,
    handleSubmit,
    setFieldError,
    clearErrors
  } = useFormValidation({
    schema: imageUploadSchema,
    onSubmit: async (data) => {
      // Your submit logic
      const response = await uploadImage(data)
      return response
    },
    onSuccess: (data) => {
      success('Image uploaded!', 'Your image is now available.')
    },
    onError: (errorMessage) => {
      error('Upload failed', errorMessage)
    }
  })

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Title"
        error={errors.title}
        loading={isSubmitting}
        {...register('title')}
      />
      {/* More form fields */}
    </form>
  )
}
```

### Validation Schemas

Pre-built validation schemas for common use cases:

```tsx
import {
  imageUploadSchema,
  imageEditSchema,
  categorySchema,
  userSchema,
  profileSchema,
  settingsSchema
} from '@/lib/utils/formValidation'

// Use with react-hook-form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(imageUploadSchema)
})
```

## Best Practices

### 1. Consistent Error Handling

Always use the toast system for user feedback:

```tsx
const handleSubmit = async (data) => {
  try {
    await submitData(data)
    success('Success!', 'Data saved successfully.')
  } catch (error) {
    error('Error!', error.message)
  }
}
```

### 2. Loading States

Show loading states during async operations:

```tsx
<FormCard loading={isSubmitting} loadingText="Saving...">
  <FormInput loading={isSubmitting} {...props} />
  <Button loading={isSubmitting} loadingText="Saving...">
    Save
  </Button>
</FormCard>
```

### 3. Validation

Use the validation schemas and display errors consistently:

```tsx
<FormInput
  label="Email"
  error={errors.email?.message}
  required
  {...register('email')}
/>
```

### 4. Accessibility

All components include proper ARIA labels and keyboard navigation:

```tsx
<FormInput
  label="Password"
  type="password"
  required
  aria-describedby="password-help"
  helperText="Must be at least 8 characters"
/>
```

## Examples

### Complete Form Example

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormCard,
  FormSection,
  FormInput,
  FormTextarea,
  FormSelect,
  MultiSelectCategories,
  Button,
  useToast
} from '@/lib/components/ui'
import { imageUploadSchema } from '@/lib/utils/formValidation'

function ImageUploadForm({ categories, onSuccess }) {
  const { success, error } = useToast()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(imageUploadSchema)
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await uploadImage({ ...data, categories: selectedCategories })
      success('Upload complete!', 'Your image has been uploaded.')
      onSuccess?.()
    } catch (err) {
      error('Upload failed', err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormCard
      title="Upload Image"
      description="Add a new image to your collection"
      loading={isSubmitting}
      loadingText="Uploading..."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Image Details">
          <FormInput
            label="Title"
            placeholder="Enter image title"
            required
            error={errors.title?.message}
            loading={isSubmitting}
            {...register('title')}
          />

          <FormTextarea
            label="Description"
            placeholder="Enter description"
            rows={3}
            error={errors.description?.message}
            loading={isSubmitting}
            {...register('description')}
          />

          <FormSelect
            label="Primary Category"
            placeholder="Choose category"
            required
            error={errors.categoryId?.message}
            loading={isSubmitting}
            {...register('categoryId')}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </FormSelect>

          <MultiSelectCategories
            categories={categories}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            label="Additional Categories"
            searchable
            showImageCount
            maxSelections={3}
            loading={isSubmitting}
          />
        </FormSection>

        <div className="flex justify-end space-x-4">
          <Button variant="ghost" type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Uploading..."
          >
            Upload Image
          </Button>
        </div>
      </form>
    </FormCard>
  )
}
```

This comprehensive form component system provides:

- ✅ Consistent dark theme styling
- ✅ Built-in validation and error handling
- ✅ Loading states and user feedback
- ✅ Accessibility compliance
- ✅ Reusable and maintainable code
- ✅ Toast notification system
- ✅ Multi-select category interface
- ✅ Comprehensive form validation utilities

All components are fully tested and ready for production use in the admin panel.