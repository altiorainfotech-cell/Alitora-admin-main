'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { 
  Search, 
  Save, 
  RotateCcw, 
  Eye,
  Globe,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { FormTextarea } from '@/lib/components/ui/FormTextarea'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { useToast } from '@/lib/components/ui/Toast'
import { PREDEFINED_PAGES, PredefinedPage, getPredefinedPageByPath } from '@/lib/data/predefined-pages'

interface SEOFormData {
  path: string
  slug: string
  metaTitle: string
  metaDescription: string
  robots: string
  openGraph: {
    title: string
    description: string
    image: string
  }
}

interface SEOPageData {
  _id?: string
  path: string
  slug: string
  metaTitle: string
  metaDescription: string
  robots?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string
  }
  isCustom: boolean
  updatedAt?: string
  updatedBy?: string
}

const PAGE_OPTIONS = PREDEFINED_PAGES.map(page => ({
  value: page.path,
  label: `${page.path} (${page.category})`
}))

const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'Index, Follow (Default)' },
  { value: 'noindex,follow', label: 'No Index, Follow' },
  { value: 'index,nofollow', label: 'Index, No Follow' },
  { value: 'noindex,nofollow', label: 'No Index, No Follow' }
]

export default function MetaManagementPage() {
  const { data: session } = useSession()
  const [selectedPath, setSelectedPath] = useState('')
  const [currentSEO, setCurrentSEO] = useState<SEOPageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  
  const [formData, setFormData] = useState<SEOFormData>({
    path: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    robots: 'index,follow',
    openGraph: {
      title: '',
      description: '',
      image: ''
    }
  })

  const resetForm = () => {
    setFormData({
      path: '',
      slug: '',
      metaTitle: '',
      metaDescription: '',
      robots: 'index,follow',
      openGraph: {
        title: '',
        description: '',
        image: ''
      }
    })
    setCurrentSEO(null)
  }

  const loadSEOData = useCallback(async (path: string) => {
    try {
      setLoading(true)
      const predefinedPage = getPredefinedPageByPath(path)
      if (!predefinedPage) return

      // Try to load existing SEO data
      const response = await fetch(`/api/admin/seo-pages/${encodeURIComponent(path)}`)
      let existingSEO: SEOPageData | null = null
      
      if (response.ok) {
        existingSEO = await response.json()
      }

      // Set form data with existing or default values
      const seoData: SEOFormData = {
        path,
        slug: existingSEO?.slug || predefinedPage.defaultSlug,
        metaTitle: existingSEO?.metaTitle || predefinedPage.defaultTitle,
        metaDescription: existingSEO?.metaDescription || predefinedPage.defaultDescription,
        robots: existingSEO?.robots || 'index,follow',
        openGraph: {
          title: existingSEO?.openGraph?.title || predefinedPage.defaultTitle,
          description: existingSEO?.openGraph?.description || predefinedPage.defaultDescription,
          image: existingSEO?.openGraph?.image || ''
        }
      }

      setFormData(seoData)
      setCurrentSEO(existingSEO ? { ...existingSEO, isCustom: true } : { 
        ...seoData, 
        isCustom: false 
      })
    } catch (error) {
      console.error('Error loading SEO data:', error)
      toast.error('Failed to load SEO data')
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load SEO data when path changes
  useEffect(() => {
    if (selectedPath) {
      loadSEOData(selectedPath)
    } else {
      resetForm()
    }
  }, [selectedPath, loadSEOData])

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('openGraph.')) {
      const ogField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        openGraph: {
          ...prev.openGraph,
          [ogField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const saveSEOData = async () => {
    if (!selectedPath) {
      toast.error('Please select a page first')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/admin/seo-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save SEO data')

      const savedData = await response.json()
      setCurrentSEO({ ...savedData, isCustom: true })
      toast.success('SEO data saved successfully')
    } catch (error) {
      console.error('Error saving SEO data:', error)
      toast.error('Failed to save SEO data')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = async () => {
    if (!selectedPath || !currentSEO?.isCustom) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/seo-pages/${encodeURIComponent(selectedPath)}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to reset SEO data')

      // Reload the page data
      await loadSEOData(selectedPath)
      toast.success('SEO data reset to default values')
    } catch (error) {
      console.error('Error resetting SEO data:', error)
      toast.error('Failed to reset SEO data')
    } finally {
      setSaving(false)
    }
  }

  const getCharacterCountColor = (current: number, max: number, warning: number) => {
    if (current > max) return 'text-red-600'
    if (current > warning) return 'text-orange-600'
    return 'text-gray-500'
  }

  const predefinedPage = selectedPath ? getPredefinedPageByPath(selectedPath) : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <Search className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Meta Management</h1>
            <p className="text-slate-400 mt-1">
              Edit SEO metadata for individual pages with live preview of search results appearance
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{PREDEFINED_PAGES.length}</div>
                <div className="text-sm text-slate-400">Total Pages Available</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{currentSEO?.isCustom ? 'Custom' : 'Default'}</div>
                <div className="text-sm text-slate-400">Current Page Status</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{selectedPath ? 'Selected' : 'None'}</div>
                <div className="text-sm text-slate-400">Page Selected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Page Selection */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Page Selection</h3>
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Page to Edit</label>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Choose a page...</option>
            {PAGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {selectedPath && predefinedPage && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-300 mb-2">Page Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Path:</span>
                    <div className="font-medium text-slate-200">{predefinedPage.path}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <div className="font-medium text-slate-200 capitalize">{predefinedPage.category}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className={`font-medium flex items-center gap-2 ${currentSEO?.isCustom ? 'text-green-400' : 'text-orange-400'}`}>
                      {currentSEO?.isCustom ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Custom SEO
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Default SEO
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPath && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced SEO Form */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">SEO Metadata</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Enhanced Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Meta Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={formData.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      placeholder="Enter meta title..."
                      maxLength={60}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className={`text-sm ${getCharacterCountColor(formData.metaTitle.length, 60, 50)}`}>
                        {formData.metaTitle.length}/60 characters
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {formData.metaTitle.length > 50 && formData.metaTitle.length <= 60 && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Approaching limit
                          </span>
                        )}
                        {formData.metaTitle.length > 60 && (
                          <span className="text-red-400 flex items-center gap-1">
                            <X className="w-3 h-3" />
                            Too long
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <FormTextarea
                      label="Meta Description"
                      value={formData.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      placeholder="Enter meta description..."
                      rows={4}
                      maxLength={160}
                      required
                    />
                    <div className={`text-sm mt-1 ${getCharacterCountColor(formData.metaDescription.length, 160, 140)}`}>
                      {formData.metaDescription.length}/160 characters
                      {formData.metaDescription.length > 140 && formData.metaDescription.length <= 160 && (
                        <span className="ml-2">⚠️ Approaching limit</span>
                      )}
                      {formData.metaDescription.length > 160 && (
                        <span className="ml-2">❌ Too long</span>
                      )}
                    </div>
                  </div>

                  {/* Page Slug */}
                  <div>
                    <FormInput
                      label="Page Slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="page-slug"
                      required
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      URL: https://altiorainfotech.com{selectedPath === '/' ? '' : selectedPath}
                    </div>
                  </div>

                  {/* Robots */}
                  <FormSelect
                    label="Robots Meta Tag"
                    value={formData.robots}
                    onChange={(e) => handleInputChange('robots', e.target.value)}
                    options={ROBOTS_OPTIONS}
                  />

                  {/* OpenGraph Title */}
                  <FormInput
                    label="OpenGraph Title (Optional)"
                    value={formData.openGraph.title}
                    onChange={(e) => handleInputChange('openGraph.title', e.target.value)}
                    placeholder="Leave empty to use meta title"
                  />

                  {/* OpenGraph Description */}
                  <FormTextarea
                    label="OpenGraph Description (Optional)"
                    value={formData.openGraph.description}
                    onChange={(e) => handleInputChange('openGraph.description', e.target.value)}
                    placeholder="Leave empty to use meta description"
                    rows={3}
                  />

                  {/* OpenGraph Image */}
                  <FormInput
                    label="OpenGraph Image URL (Optional)"
                    value={formData.openGraph.image}
                    onChange={(e) => handleInputChange('openGraph.image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-700/50">
                  <button
                    onClick={saveSEOData}
                    disabled={saving || !formData.metaTitle || !formData.metaDescription}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save SEO Data
                      </>
                    )}
                  </button>
                  
                  {currentSEO?.isCustom && (
                    <button
                      onClick={resetToDefault}
                      disabled={saving}
                      className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-orange-400 hover:text-orange-300 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>

              {/* Enhanced Live Preview */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Live Preview</h2>
                </div>
                
                {/* Enhanced Google Search Preview */}
                <div className="border border-slate-600/50 rounded-xl p-4 bg-slate-700/30 mb-6">
                  <div className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Google Search Result Preview
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    {/* URL */}
                    <div className="text-sm text-green-700 mb-1 font-medium">
                      https://altiorainfotech.com{selectedPath === '/' ? '' : selectedPath}
                    </div>
                    
                    {/* Title */}
                    <div className="text-xl text-blue-600 hover:underline cursor-pointer mb-2 line-clamp-2 font-medium">
                      {formData.metaTitle || 'Meta title will appear here'}
                    </div>
                    
                    {/* Description */}
                    <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {formData.metaDescription || 'Meta description will appear here'}
                    </div>
                  </div>
                </div>

                {/* Social Media Preview */}
                {(formData.openGraph.title || formData.openGraph.description || formData.openGraph.image) && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-4">
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Social Media Preview
                    </div>
                    
                    <div className="bg-white border rounded overflow-hidden">
                      {formData.openGraph.image && (
                        <div className="h-32 bg-gray-200 flex items-center justify-center relative">
                          <Image 
                            src={formData.openGraph.image} 
                            alt="OpenGraph preview"
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                              if (nextElement) {
                                nextElement.style.display = 'flex'
                              }
                            }}
                          />
                          <div className="hidden items-center justify-center text-gray-500 text-sm">
                            Image preview unavailable
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3">
                        <div className="text-sm text-gray-500 mb-1">
                          altiorainfotech.com
                        </div>
                        <div className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {formData.openGraph.title || formData.metaTitle}
                        </div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {formData.openGraph.description || formData.metaDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced SEO Tips */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Info className="w-3 h-3 text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-blue-300">SEO Best Practices</h3>
                  </div>
                  <ul className="text-sm text-blue-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      Keep meta titles under 60 characters for optimal display
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      Keep meta descriptions under 160 characters
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      Include target keywords naturally in content
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      Make titles and descriptions compelling and actionable
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      Ensure each page has unique, relevant metadata
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast Notification */}

    </div>
  )
}