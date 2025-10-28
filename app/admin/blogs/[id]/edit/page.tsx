'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, X, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormTextarea } from '@/lib/components/ui/FormTextarea'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { useToast } from '@/lib/components/ui/Toast'
import { BlogImageUpload } from '@/app/components/admin/BlogImageUpload'
import { BlogContentContext } from '@/app/components/admin/BlogContentContext'
import { RichTextEditor } from '@/app/components/admin/RichTextEditor'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAllCategories } from '@/lib/hooks/useCategories'
import { validateBlogPostUpdate } from '@/lib/blog-validation'
import Toast from '@/app/admin/components/Toast'
import DOMPurify from 'isomorphic-dompurify'





interface BlogFormData {
  title: string
  content: string
  excerpt: string
  image: string
  category: string
  status: 'draft' | 'published' | 'archived'
  author: string
  date: string
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
}

interface BlogPost extends BlogFormData {
  _id: string
  id: string
  href: string
  createdAt: string
  updatedAt: string
}

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { categories } = useAllCategories()

  const [originalPost, setOriginalPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    category: '',
    status: 'draft',
    author: '',
    date: '',
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch blog post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/admin/blogs/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch blog post')
        }

        const post = data.data
        setOriginalPost(post)
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || '',
          image: post.image,
          category: post.category,
          status: post.status,
          author: post.author,
          date: post.date.split('T')[0], // Convert to date input format
          seo: {
            metaTitle: post.seo?.metaTitle || '',
            metaDescription: post.seo?.metaDescription || '',
            keywords: post.seo?.keywords || []
          }
        })
      } catch (err) {
        setToast({
          message: err instanceof Error ? err.message : 'Failed to load blog post',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPost()
    }
  }, [params.id])

  // Check for changes
  useEffect(() => {
    if (originalPost) {
      const hasFormChanges =
        formData.title !== originalPost.title ||
        formData.content !== originalPost.content ||
        formData.excerpt !== (originalPost.excerpt || '') ||
        formData.image !== originalPost.image ||
        formData.category !== originalPost.category ||
        formData.status !== originalPost.status ||
        formData.author !== originalPost.author ||
        formData.date !== originalPost.date.split('T')[0] ||
        formData.seo.metaTitle !== (originalPost.seo?.metaTitle || '') ||
        formData.seo.metaDescription !== (originalPost.seo?.metaDescription || '') ||
        JSON.stringify(formData.seo.keywords) !== JSON.stringify(originalPost.seo?.keywords || [])

      setHasChanges(hasFormChanges)
    }
  }, [formData, originalPost])

  const handleInputChange = (field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSeoChange = (field: keyof BlogFormData['seo'], value: any) => {
    setFormData(prev => ({
      ...prev,
      seo: { ...prev.seo, [field]: value }
    }))
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
    if (errors.image) {
      setErrors(prev => ({ ...prev, image: '' }))
    }
  }

  const handleContentSelect = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }))
    }
  }





  const handleAddKeyword = () => {
    if (keywordInput.trim() && formData.seo.keywords.length < 10) {
      const newKeyword = keywordInput.trim()
      if (!formData.seo.keywords.includes(newKeyword)) {
        handleSeoChange('keywords', [...formData.seo.keywords, newKeyword])
      }
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (index: number) => {
    handleSeoChange('keywords', formData.seo.keywords.filter((_, i) => i !== index))
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const validateForm = () => {
    const validation = validateBlogPostUpdate(formData)

    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      if (validation.error?.details && Array.isArray(validation.error.details)) {
        validation.error.details.forEach((detail: any) => {
          newErrors[detail.field] = detail.message
        })
      }
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (status?: 'draft' | 'published' | 'archived') => {
    const submitData = status ? { ...formData, status } : formData

    if (!validateForm()) {
      setToast({ message: 'Please fix the errors before saving', type: 'error' })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/blogs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update blog post')
      }

      setToast({
        message: 'Blog post updated successfully',
        type: 'success'
      })

      // Update original post to reflect changes
      setOriginalPost(prev => prev ? { ...prev, ...submitData } : null)

    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update blog post',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/blogs/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error?.message || 'Failed to delete blog post')
      }

      setToast({ message: 'Blog post deleted successfully', type: 'success' })

      // Redirect to blog list after a short delay
      setTimeout(() => {
        router.push('/admin/blogs')
      }, 1500)

    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete blog post',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!originalPost) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <p className="text-red-300">Blog post not found</p>
        <Button
          variant="secondary"
          onClick={() => router.push('/admin/blogs')}
          className="mt-4"
        >
          Back to Blog Posts
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Blog Post</h1>
            <p className="text-gray-400 mt-1">
              Last updated: {new Date(originalPost.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={saving}
            icon={<Trash2 size={16} />}
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            onClick={handlePreview}
            icon={<Eye size={16} />}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit()}
            loading={saving}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
          {formData.status !== 'published' && (
            <Button
              onClick={() => handleSubmit('published')}
              loading={saving}
              disabled={!formData.title.trim() || !formData.content.trim() || !formData.image}
              icon={<Save size={16} />}
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            You have unsaved changes. Don&apos;t forget to save your work!
          </p>
        </div>
      )}

      {showPreview ? (
        /* Preview Mode */
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-4">{formData.title || 'Untitled Post'}</h1>

            {formData.image && (
              <Image
                src={formData.image}
                alt={formData.title}
                width={800}
                height={256}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
              <span>By {formData.author}</span>
              <span>•</span>
              <span>{new Date(formData.date).toLocaleDateString()}</span>
              <span>•</span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                {formData.category || 'Uncategorized'}
              </span>
              <span>•</span>
              <span className={`px-2 py-1 rounded text-xs ${formData.status === 'published' ? 'bg-green-600 text-white' :
                formData.status === 'draft' ? 'bg-yellow-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </span>
            </div>

            {formData.excerpt && (
              <p className="text-lg text-gray-300 mb-6 italic">{formData.excerpt}</p>
            )}

            <div
              className="text-gray-100 mb-6"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formData.content || '<p>No main content yet...</p>') }}
            />




          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <FormInput
                label="Main Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter blog post title..."
                error={errors.title}
                required
              />

              <RichTextEditor
                label="Main Content"
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="Write your main blog post content here..."
                error={errors.content}
                required
                minHeight="300px"

              />

              <FormTextarea
                label="Excerpt"
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder="Brief description of the post"
                rows={3}
                error={errors.excerpt}
                helperText="This will be shown in blog listings and search results"
              />
            </div>





            {/* SEO Section */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">SEO Settings</h3>

              <FormInput
                label="Meta Title"
                value={formData.seo.metaTitle}
                onChange={(e) => handleSeoChange('metaTitle', e.target.value)}
                placeholder="SEO title"
                error={errors['seo.metaTitle']}
                helperText={`${formData.seo.metaTitle.length}/60 characters`}
              />

              <FormTextarea
                label="Meta Description"
                value={formData.seo.metaDescription}
                onChange={(e) => handleSeoChange('metaDescription', e.target.value)}
                placeholder="Brief description for search engines"
                rows={3}
                error={errors['seo.metaDescription']}
                helperText={`${formData.seo.metaDescription.length}/160 characters`}
              />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Keywords
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.seo.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-1 hover:text-red-300"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <FormInput
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={handleKeywordKeyPress}
                    placeholder="Add keyword..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddKeyword}
                    disabled={!keywordInput.trim() || formData.seo.keywords.length >= 10}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.seo.keywords.length}/10 keywords
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Settings */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Post Settings</h3>

              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' }
                ]}
                required
              />

              <FormSelect
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={[
                  { value: '', label: 'Select category...' },
                  ...categories.map(cat => ({ value: cat.name, label: cat.name }))
                ]}
                error={errors.category}
                required
              />

              <FormInput
                label="Author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                error={errors.author}
                required
              />

              <FormInput
                label="Publish Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                required
              />
            </div>

            {/* Featured Image */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Featured Image</h3>
              <BlogImageUpload
                onImageUpload={handleImageUpload}
                currentImage={formData.image}
                error={errors.image}
              />
            </div>

            {/* Post Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Post Info</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>
                  <span className="font-medium">ID:</span> {originalPost.id}
                </div>
                <div>
                  <span className="font-medium">URL:</span> {originalPost.href}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(originalPost.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {new Date(originalPost.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Blog Content Context */}
            <BlogContentContext onContentSelect={handleContentSelect} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}