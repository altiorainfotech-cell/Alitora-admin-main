'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Mail, 
  MailOpen, 
  Reply, 
  Trash2, 
  Filter,
  Search,
  User,
  User2,
  Eye,
  X,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface ContactMessage {
  _id: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  country?: string
  countryCode?: string
  phoneCode?: string
  phoneNumber?: string
  purpose?: string
  message: string
  status: 'unread' | 'read' | 'replied'
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async (page = 1, status = statusFilter) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (status !== 'all') {
        params.append('status', status)
      }

      console.log('🔄 Fetching messages with params:', params.toString())
      console.log('🌐 API URL:', `/api/contact?${params}`)
      
      const response = await fetch(`/api/contact?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`Failed to fetch messages: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Fetched data:', {
        messagesCount: data.messages?.length || 0,
        pagination: data.pagination,
        unreadCount: data.unreadCount,
        firstMessage: data.messages?.[0] || null
      })
      
      setMessages(data.messages || [])
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  const updateMessageStatus = async (id: string, status: 'read' | 'replied') => {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Failed to update message')
      
      // Refresh messages
      fetchMessages(pagination.page)
      
      // Update selected message if it's the one being updated
      if (selectedMessage?._id === id) {
        setSelectedMessage({ ...selectedMessage, status })
      }
    } catch (error) {
      console.error('Error updating message:', error)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete message')
      
      // Refresh messages
      fetchMessages(pagination.page)
      
      // Close modal if deleted message was selected
      if (selectedMessage?._id === id) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const filteredMessages = (messages || []).filter(message => {
    if (!message || !searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (message.name && message.name.toLowerCase().includes(searchLower)) ||
      (message.firstName && message.firstName.toLowerCase().includes(searchLower)) ||
      (message.lastName && message.lastName.toLowerCase().includes(searchLower)) ||
      (message.email && message.email.toLowerCase().includes(searchLower)) ||
      (message.country && message.country.toLowerCase().includes(searchLower)) ||
      (message.phoneNumber && message.phoneNumber.toLowerCase().includes(searchLower)) ||
      (message.countryCode && message.countryCode.toLowerCase().includes(searchLower)) ||
      (message.phoneCode && message.phoneCode.toLowerCase().includes(searchLower)) ||
      (message.purpose && message.purpose.toLowerCase().includes(searchLower)) ||
      (message.message && message.message.toLowerCase().includes(searchLower))
    );
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'read': return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      case 'replied': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread': return <Mail className="w-4 h-4" />
      case 'read': return <MailOpen className="w-4 h-4" />
      case 'replied': return <Reply className="w-4 h-4" />
      default: return <Mail className="w-4 h-4" />
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [statusFilter, fetchMessages])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(90rem_60rem_at_-10%_-10%,#0b1a36_10%,#010c22_40%,#000614_100%)] text-white/95">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10"
                >
                  <MessageSquare className="h-8 w-8" />
                </motion.span>
                {unreadCount > 0 && (
                  <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-[#44d1a1] flex items-center justify-center text-xs font-bold text-black">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contact Messages</h1>
                <p className="text-white/60 text-lg">Central inbox · Altiora Infotech</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-md">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#3490f3] animate-pulse" />
                  {unreadCount} unread
                </span>
              )}
              <button
                onClick={() => fetchMessages(pagination.page)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold backdrop-blur-md hover:bg-white/10 transition"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8 backdrop-blur-2xl"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-white/80 mb-3">Search Messages</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, country, phone, purpose, or message content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#44d1a1] focus:border-[#44d1a1]/50 backdrop-blur-md transition-all duration-200"
                />
              </div>
            </div>
            <div className="lg:w-64">
              <label className="block text-sm font-semibold text-white/80 mb-3">Filter by Status</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#44d1a1] focus:border-[#44d1a1]/50 backdrop-blur-md transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">All Messages</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                  <option value="replied">Replied Only</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>



        {/* Error State */}
        {error && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <h3 className="text-red-300 font-semibold">Error Loading Messages</h3>
                <p className="text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchMessages()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Messages List */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden"
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#44d1a1] border-t-transparent mx-auto"></div>
              <p className="text-white/70 mt-4 text-lg font-medium">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <MessageSquare className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white/80 mb-2">No messages found</h3>
              <p className="text-white/50">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredMessages.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-6 hover:bg-white/[0.02] cursor-pointer transition-all duration-200 group ${
                    (message.status || 'unread') === 'unread' 
                      ? 'bg-gradient-to-r from-[#3490f3]/10 to-[#44d1a1]/10 border-l-4 border-[#3490f3]' 
                      : ''
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-[#44d1a1] to-[#3490f3] rounded-full flex items-center justify-center">
                            <User2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-white text-lg">
                              {message.firstName && message.lastName 
                                ? `${message.firstName} ${message.lastName}` 
                                : (message.name || 'Unknown')}
                            </span>
                            <p className="text-white/60 text-sm">{message.email || 'No email'}</p>
                            {message.country && (
                              <p className="text-white/50 text-sm">📍 {message.country}</p>
                            )}
                            {(message.phoneCode || message.countryCode) && message.phoneNumber && (
                              <p className="text-white/50 text-sm">
                                📞 {message.phoneCode || message.countryCode} {message.phoneNumber}
                              </p>
                            )}
                            {message.purpose && (
                              <p className="text-white/50 text-sm">🎯 {message.purpose}</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                          (message.status || 'unread') === 'unread' 
                            ? 'border-[#3490f3]/30 bg-[#3490f3]/10 text-[#3490f3]' 
                            : (message.status || 'unread') === 'replied'
                            ? 'border-[#44d1a1]/30 bg-[#44d1a1]/10 text-[#44d1a1]'
                            : 'border-white/20 bg-white/5 text-white/70'
                        }`}>
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            (message.status || 'unread') === 'unread' ? 'bg-[#3490f3]' : 
                            (message.status || 'unread') === 'replied' ? 'bg-[#44d1a1]' : 'bg-white/50'
                          }`} />
                          {(message.status || 'unread').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/80 text-base leading-relaxed mb-4 line-clamp-2">
                        {message.message}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(message.createdAt)}
                        </div>
                        <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                        <span>Message #{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateMessageStatus(message._id, 'read')
                        }}
                        className="p-2 text-white/40 hover:text-[#3490f3] hover:bg-[#3490f3]/10 rounded-lg transition-all duration-200 border border-white/10 hover:border-[#3490f3]/30"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage(message._id)
                        }}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-white/10 hover:border-red-500/30"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/70 font-medium">
                Showing <span className="text-white font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="text-white font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-white font-semibold">{pagination.total}</span> messages
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchMessages(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md transition-all duration-200"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-gradient-to-r from-[#44d1a1] to-[#3490f3] text-white rounded-xl text-sm font-semibold">
                    {pagination.page}
                  </span>
                  <span className="text-white/50 text-sm">of</span>
                  <span className="px-3 py-2 text-white/70 text-sm font-medium">
                    {pagination.pages}
                  </span>
                </div>
                <button
                  onClick={() => fetchMessages(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-md transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[radial-gradient(90rem_60rem_at_-10%_-10%,#0b1a36_10%,#010c22_40%,#000614_100%)] border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10"
                      >
                        <Mail className="h-6 w-6" />
                      </motion.span>
                      <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#44d1a1]" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Message Details</h1>
                      <p className="text-white/60 text-sm">Central inbox · Altiora Infotech</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md ${
                      (selectedMessage.status || 'unread') === 'unread' 
                        ? 'border-[#3490f3]/30 bg-[#3490f3]/10 text-[#3490f3]' 
                        : (selectedMessage.status || 'unread') === 'replied'
                        ? 'border-[#44d1a1]/30 bg-[#44d1a1]/10 text-[#44d1a1]'
                        : 'border-white/20 bg-white/5 text-white/70'
                    }`}>
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        (selectedMessage.status || 'unread') === 'unread' ? 'bg-[#3490f3]' : 
                        (selectedMessage.status || 'unread') === 'replied' ? 'bg-[#44d1a1]' : 'bg-white/50'
                      }`} />
                      {(selectedMessage.status || 'unread').toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8 backdrop-blur-2xl">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Message Content */}
                    <motion.div
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6 md:p-7 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-white/60">Message Content</span>
                        {(selectedMessage.status || 'unread') === "unread" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] rounded-full bg-[#0f1f3a] border border-white/10 px-2 py-1">
                            <MailOpen className="h-3.5 w-3.5" /> unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-base leading-relaxed text-white/90 whitespace-pre-wrap">{selectedMessage.message || 'No message content'}</p>
                      
                      {/* Quick Meta */}
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-white/70">
                          <User2 className="h-4 w-4" /> 
                          <span className="truncate">
                            {selectedMessage.firstName && selectedMessage.lastName 
                              ? `${selectedMessage.firstName} ${selectedMessage.lastName}` 
                              : (selectedMessage.name || 'Unknown')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="h-4 w-4" /> 
                          <span>{formatDate(selectedMessage.createdAt)}</span>
                        </div>
                        {selectedMessage.country && (
                          <div className="flex items-center gap-2 text-white/70">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="truncate">{selectedMessage.country}</span>
                          </div>
                        )}
                        {selectedMessage.purpose && (
                          <div className="flex items-center gap-2 text-white/70">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate">{selectedMessage.purpose}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Contact Panel */}
                    <motion.aside
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.55, delay: 0.05 }}
                      className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                    >
                      <h3 className="text-sm font-semibold text-white/80">Contact Information</h3>
                      <div className="mt-4 space-y-4">
                        <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:bg-white/[0.05] transition">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                            <User2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase text-white/50">Full Name</p>
                            <p className="truncate text-sm">
                              {selectedMessage.firstName && selectedMessage.lastName 
                                ? `${selectedMessage.firstName} ${selectedMessage.lastName}` 
                                : (selectedMessage.name || 'Unknown')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase text-white/50">Email Address</p>
                            <p className="truncate text-sm">{selectedMessage.email || 'No email'}</p>
                          </div>
                        </div>
                        
                        {selectedMessage.country && (
                          <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase text-white/50">Country</p>
                              <p className="truncate text-sm">{selectedMessage.country}</p>
                            </div>
                          </div>
                        )}
                        
                        {(selectedMessage.phoneCode || selectedMessage.countryCode) && selectedMessage.phoneNumber && (
                          <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase text-white/50">Phone Number</p>
                              <p className="truncate text-sm">
                                {selectedMessage.phoneCode || selectedMessage.countryCode} {selectedMessage.phoneNumber}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedMessage.purpose && (
                          <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] uppercase text-white/50">Purpose</p>
                              <p className="truncate text-sm">{selectedMessage.purpose}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase text-white/50">Received Date</p>
                            <p className="truncate text-sm">{formatDate(selectedMessage.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </motion.aside>
                  </div>

                  {/* Actions */}
                  <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateMessageStatus(selectedMessage._id, 'read')}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold backdrop-blur-md hover:bg-white/10 transition"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#3490f3]" /> Mark as Read
                      </button>
                      <button
                        onClick={() => updateMessageStatus(selectedMessage._id, 'replied')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#44d1a1] to-[#3490f3] px-4 py-2.5 text-sm font-semibold text-white hover:from-[#3eb89a] hover:to-[#2d7dd2] transition"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark as Replied
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          const email = selectedMessage.email || '';
                          const name = selectedMessage.firstName && selectedMessage.lastName 
                            ? `${selectedMessage.firstName} ${selectedMessage.lastName}` 
                            : (selectedMessage.name || 'there');
                          const message = selectedMessage.message || '';
                          window.location.href = `mailto:${email}?subject=Re: Contact Form Message&body=Hi ${name},%0D%0A%0D%0AThank you for your message:%0D%0A"${message}"%0D%0A%0D%0A`
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:border-white/20 transition"
                      >
                        <Reply className="h-4 w-4" /> Reply via Email
                      </button>
                      <button
                        onClick={() => deleteMessage(selectedMessage._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500/20 transition"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Message
                      </button>
                    </div>
                  </div>
                </div>

                {/* Small helper text */}
                <p className="mt-6 text-center text-xs text-white/50">Designed in Altiora&apos;s Klypto style — rounded cards, soft teal/blue glow, glass surfaces.</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}