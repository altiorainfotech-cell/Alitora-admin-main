'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Plus, Search, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { FormInput } from '@/lib/components/ui/FormInput'
import { FormSelect } from '@/lib/components/ui/FormSelect'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'

interface FAQ {
  _id: string
  question: string
  answer: string
  category: string
  product?: string
  tags: string[]
  priority: number
  isActive: boolean
  icon?: string
  order: number
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

const categories = [
  { value: 'services', label: 'Services' },
  { value: 'process', label: 'Process' },
  { value: 'technical', label: 'Technical' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'support', label: 'Support' },
  { value: 'general', label: 'General' }
]

const products = [
  { value: 'all', label: 'All Products' },
  { value: 'web2', label: 'Web2 Development' },
  { value: 'web3', label: 'Web3 & Blockchain' },
  { value: 'ai-ml', label: 'AI/ML Solutions' },
  { value: 'depin', label: 'DePIN' },
  { value: 'rwa', label: 'RWA' },
  { value: 'gamify', label: 'Gamification' }
]

const iconOptions = [
  'Code', 'Zap', 'Shield', 'Users', 'Clock', 'Headphones', 'Building', 'Cog', 'Lightbulb', 'Star', 'Heart', 'Globe'
]

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    product: 'all',
    tags: '',
    priority: 0,
    isActive: true,
    icon: '',
    order: 0
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set())

  const fetchFAQ = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (productFilter !== 'all') params.append('product', productFilter)
      if (statusFilter !== 'all') params.append('isActive', statusFilter)
      
      const response = await fetch(`/api/FAQ?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ: ${response.status}`)
      }
      
      const data = await response.json()
      setFaqs(data.faqs || [])
      setPagination(data.pagination || { page, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch FAQ')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, categoryFilter, productFilter, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editId ? `/api/FAQ/${editId}` : '/api/FAQ'
      const method = editId ? 'PUT' : 'POST'
      
      const submitData = {
        ...form,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      if (!response.ok) throw new Error('Failed to save FAQ')
      
      resetForm()
      fetchFAQ(pagination.page)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save FAQ')
    }
  }

  const resetForm = () => {
    setForm({
      question: '',
      answer: '',
      category: 'general',
      product: 'all',
      tags: '',
      priority: 0,
      isActive: true,
      icon: '',
      order: 0
    })
    setEditId(null)
    setShowForm(false)
  }

  const deleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const response = await fetch(`/api/FAQ/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete FAQ')
      
      fetchFAQ(pagination.page)
      
      if (selectedFAQ?._id === id) {
        setSelectedFAQ(null)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete FAQ')
    }
  }

  const handleEdit = (faq: FAQ) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      product: faq.product || 'all',
      tags: faq.tags.join(', '),
      priority: faq.priority,
      isActive: faq.isActive,
      icon: faq.icon || '',
      order: faq.order
    })
    setEditId(faq._id)
    setShowForm(true)
  }

  const toggleFAQExpansion = (id: string) => {
    const newExpanded = new Set(expandedFAQs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedFAQs(newExpanded)
  }

  const toggleFAQStatus = async (id: string, currentStatus: boolean) => {
    try {
      // First get the current FAQ data
      const getFaqResponse = await fetch(`/api/FAQ/${id}`)
      if (!getFaqResponse.ok) throw new Error('Failed to fetch FAQ data')
      
      const faqData = await getFaqResponse.json()
      
      // Update with all required fields plus the new status
      const updateData = {
        question: faqData.question,
        answer: faqData.answer,
        category: faqData.category,
        product: faqData.product || 'all',
        tags: faqData.tags || [],
        priority: faqData.priority || 0,
        isActive: !currentStatus,
        icon: faqData.icon || '',
        order: faqData.order || 0
      }
      
      const response = await fetch(`/api/FAQ/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) throw new Error('Failed to update FAQ status')
      
      fetchFAQ(pagination.page)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update FAQ status')
    }
  }

  useEffect(() => {
    fetchFAQ()
  }, [fetchFAQ])

  if (loading && faqs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">FAQ Management</h1>
          <p className="text-gray-400 mt-1">Manage frequently asked questions for your website</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          icon={showForm ? <X size={16} /> : <Plus size={16} />}
        >
          {showForm ? 'Cancel' : 'Add FAQ'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <FormInput
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
          <FormSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat.value, label: cat.label }))
            ]}
          />
          <FormSelect
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            options={products.map(prod => ({ value: prod.value, label: prod.label }))}
          />
          <FormSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]}
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6 text-white">
            {editId ? 'Edit FAQ' : 'Add New FAQ'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Question *</label>
              <FormInput
                placeholder="Enter the FAQ question"
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                required
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Answer *</label>
              <textarea
                placeholder="Enter the FAQ answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
              <FormSelect
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                options={categories.map(cat => ({ value: cat.value, label: cat.label }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product</label>
              <FormSelect
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                options={products.map(prod => ({ value: prod.value, label: prod.label }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
              <FormInput
                placeholder="e.g., development, pricing, support"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
              <FormSelect
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                options={[
                  { value: '', label: 'Select an icon' },
                  ...iconOptions.map(icon => ({ value: icon, label: icon }))
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <FormInput
                type="number"
                placeholder="0"
                value={form.priority.toString()}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
              <FormInput
                type="number"
                placeholder="0"
                value={form.order.toString()}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-300">
                Active (visible on website)
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button 
              type="submit" 
              icon={<Save size={16} />}
            >
              {editId ? 'Update' : 'Create'} FAQ
            </Button>
            <Button
              type="button"
              onClick={resetForm}
              variant="secondary"
              icon={<X size={16} />}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* FAQ Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No FAQs found</div>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {faqs.map((faq) => (
              <div key={faq._id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          faq.category === 'services' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                          faq.category === 'process' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                          faq.category === 'technical' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' :
                          faq.category === 'pricing' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' :
                          faq.category === 'support' ? 'bg-red-900/50 text-red-300 border border-red-500/30' :
                          'bg-gray-900/50 text-gray-300 border border-gray-500/30'
                        }`}>
                          {categories.find(c => c.value === faq.category)?.label || faq.category}
                        </span>
                        {faq.product && faq.product !== 'all' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/50 text-indigo-300 border border-indigo-500/30">
                            {products.find(p => p.value === faq.product)?.label || faq.product}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          faq.isActive ? 'bg-green-900/50 text-green-300 border border-green-500/30' : 'bg-red-900/50 text-red-300 border border-red-500/30'
                        }`}>
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {faq.priority > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-500/30">
                            Priority: {faq.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-white mb-2">{faq.question}</h3>
                    
                    <div className={`text-gray-300 ${expandedFAQs.has(faq._id) ? '' : 'line-clamp-2'}`}>
                      {faq.answer}
                    </div>
                    
                    {faq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {faq.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-600 text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleFAQExpansion(faq._id)}
                      className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                      title={expandedFAQs.has(faq._id) ? 'Collapse' : 'Expand'}
                    >
                      {expandedFAQs.has(faq._id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm text-gray-400">
                    Order: {faq.order} • Created: {new Date(faq.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleFAQStatus(faq._id, faq.isActive)}
                      variant={faq.isActive ? "danger" : "primary"}
                      size="sm"
                      icon={faq.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    >
                      {faq.isActive ? 'Hide' : 'Show'}
                    </Button>
                    
                    <Button
                      onClick={() => handleEdit(faq)}
                      variant="secondary"
                      size="sm"
                      icon={<Edit size={14} />}
                    >
                      Edit
                    </Button>
                    
                    <Button
                      onClick={() => deleteFAQ(faq._id)}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchFAQ(pagination.page - 1)}
              disabled={pagination.page === 1}
              variant="secondary"
              size="sm"
            >
              Previous
            </Button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => fetchFAQ(page)}
                variant={pagination.page === page ? "primary" : "secondary"}
                size="sm"
              >
                {page}
              </Button>
            ))}
            
            <Button
              onClick={() => fetchFAQ(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              variant="secondary"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-sm text-gray-400">
          Showing {faqs.length} of {pagination.total} FAQs
        </div>
      </div>
    </div>
  )
}