'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormTextarea } from '@/lib/components/ui/FormTextarea'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { useToast } from '@/lib/components/ui/Toast'
import Toast from '../../components/Toast'
import { BlogImageUpload } from '@/app/components/admin/BlogImageUpload'
import { BlogContentContext } from '@/app/components/admin/BlogContentContext'
import { RichTextEditor } from '@/app/components/admin/RichTextEditor'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAllCategories } from '@/lib/hooks/useCategories'
import { validateBlogPostCreation, generateSlug } from '@/lib/blog-validation'
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

export default function NewBlogPostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { categories } = useAllCategories()
  
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: '',
    excerpt: '',
    image: '',
    category: '',
    status: 'draft',
    author: user?.name || user?.email || '',
    date: new Date().toISOString().split('T')[0],
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')

  // Update author when user changes
  useEffect(() => {
    if (user?.name || user?.email) {
      setFormData(prev => ({ ...prev, author: user.name || user.email || '' }))
    }
  }, [user])

  // Auto-generate SEO title from main title
  useEffect(() => {
    if (formData.title && !formData.seo.metaTitle) {
      setFormData(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          metaTitle: formData.title.slice(0, 60)
        }
      }))
    }
  }, [formData.title, formData.seo.metaTitle])

  // Auto-generate excerpt from content
  useEffect(() => {
    if (formData.content && !formData.excerpt) {
      const textContent = formData.content.replace(/<[^>]*>/g, '').trim()
      const autoExcerpt = textContent.slice(0, 150) + (textContent.length > 150 ? '...' : '')
      setFormData(prev => ({ ...prev, excerpt: autoExcerpt }))
    }
  }, [formData.content, formData.excerpt])

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

    
    const validation = validateBlogPostCreation(formData)
    
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

  const handleSubmit = async (status: 'draft' | 'published' | 'archived' = formData.status) => {
    const submitData = { ...formData, status }
    

    

    
    if (!validateForm()) {
      setToast({ message: 'Please fix the errors before saving', type: 'error' })
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create blog post')
      }
      
      setToast({ 
        message: `Blog post ${status === 'published' ? 'published' : 'saved as draft'} successfully`, 
        type: 'success' 
      })
      
      // Redirect to blog list after a short delay
      setTimeout(() => {
        router.push('/admin/blogs')
      }, 1500)
      
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to save blog post', 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
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
            <h1 className="text-2xl font-bold text-white">Create New Blog Post</h1>
            <p className="text-gray-400 mt-1">Write and publish your blog content</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={handlePreview}
            icon={<Eye size={16} />}
          >
            {showPreview ? 'Edit' : 'Preview'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            loading={loading}
            disabled={!formData.title.trim()}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSubmit('published')}
            loading={loading}
            disabled={!formData.title.trim() || !formData.content.trim() || !formData.image}
            icon={<Save size={16} />}
          >
            Publish
          </Button>
        </div>
      </div>

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
                placeholder="Brief description of the post (auto-generated if left empty)"
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
                placeholder="SEO title (auto-generated from main title)"
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