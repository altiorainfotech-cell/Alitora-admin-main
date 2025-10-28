'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ArrowUpDown,
  Users,
  GripVertical,
  Move
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

interface Staff {
  _id: string
  name: string
  title: string
  avatar: string
  isVisible: boolean
  order: number
  bio?: string
  email?: string
  createdAt: string
  updatedAt: string
}

interface SortableStaffCardProps {
  member: Staff
  selectedStaff: string[]
  onSelectStaff: (id: string, checked: boolean) => void
  onToggleVisibility: (id: string, currentVisibility: boolean) => void
  onDeleteStaff: (id: string) => void
  isDragMode: boolean
}

function SortableStaffCard({ 
  member, 
  selectedStaff, 
  onSelectStaff, 
  onToggleVisibility, 
  onDeleteStaff,
  isDragMode 
}: SortableStaffCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: member._id,
    disabled: !isDragMode
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-slate-800/50 rounded-lg shadow-sm border overflow-hidden ${
        isDragMode 
          ? 'border-blue-500/50 cursor-grab active:cursor-grabbing hover:border-blue-400/70' 
          : 'border-slate-700/50'
      } ${isDragging ? 'z-50 shadow-2xl' : ''}`}
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={member.avatar}
          alt={member.name}
          fill
          className="object-cover"
        />
        
        {/* Drag Handle - Only show in drag mode */}
        {isDragMode && (
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-2 bg-black/70 rounded-full cursor-grab active:cursor-grabbing hover:bg-black/90 transition-colors z-10 touch-none"
            title="Drag to reorder"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={18} className="text-white" />
          </div>
        )}
        
        {/* Selection checkbox - Hide in drag mode */}
        {!isDragMode && (
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={selectedStaff.includes(member._id)}
              onChange={(e) => onSelectStaff(member._id, e.target.checked)}
              className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
            />
          </div>
        )}
        
        {/* Visibility toggle */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => onToggleVisibility(member._id, member.isVisible)}
            className={`p-1.5 rounded-full ${member.isVisible
              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
              }`}
            title={member.isVisible ? 'Hide from website' : 'Show on website'}
            disabled={isDragMode}
          >
            {member.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1">{member.name}</h3>
        <p className="text-sm text-gray-300 mb-3">{member.title}</p>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-full ${member.isVisible
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}>
            {member.isVisible ? 'Visible on website' : 'Hidden from website'}
          </span>
          
          {/* Action buttons - Hide in drag mode */}
          {!isDragMode && (
            <div className="flex gap-1">
              <Link
                href={`/admin/staff/${member._id}/edit`}
                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded"
                title="Edit"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDeleteStaff(member._id)}
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'order' | 'createdAt'>('order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [isDragMode, setIsDragMode] = useState(false)
  const [reorderLoading, setReorderLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      setError(null)
      const response = await fetch('/api/staff?all=true')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (data.success) {
        setStaff(data.data)
        setError(null)
      } else {
        const errorMsg = data.error || 'Failed to fetch staff members'
        setError(errorMsg)
        console.error('Failed to fetch staff:', errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error occurred'
      setError(`Failed to load staff: ${errorMsg}`)
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const formData = new FormData()
      formData.append('isVisible', (!currentVisibility).toString())

      const response = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setStaff(staff.map(member =>
          member._id === id
            ? { ...member, isVisible: !currentVisibility }
            : member
        ))
      } else {
        console.error('Failed to update visibility:', data.error)
      }
    } catch (error) {
      console.error('Error updating visibility:', error)
    }
  }

  const deleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return
    }

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setStaff(staff.filter(member => member._id !== id))
      } else {
        console.error('Failed to delete staff member:', data.error)
      }
    } catch (error) {
      console.error('Error deleting staff member:', error)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStaff(filteredAndSortedStaff.map(member => member._id))
    } else {
      setSelectedStaff([])
    }
  }

  const handleSelectStaff = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStaff(prev => [...prev, id])
    } else {
      setSelectedStaff(prev => prev.filter(staffId => staffId !== id))
    }
  }

  const bulkUpdateVisibility = async (isVisible: boolean) => {
    if (selectedStaff.length === 0) return

    setBulkLoading(true)
    try {
      const promises = selectedStaff.map(async (id) => {
        const formData = new FormData()
        formData.append('isVisible', isVisible.toString())

        const response = await fetch(`/api/staff/${id}`, {
          method: 'PUT',
          body: formData
        })

        return response.json()
      })

      await Promise.all(promises)

      // Update local state
      setStaff(staff.map(member =>
        selectedStaff.includes(member._id)
          ? { ...member, isVisible }
          : member
      ))

      setSelectedStaff([])
    } catch (error) {
      console.error('Error updating staff visibility:', error)
    } finally {
      setBulkLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isDragMode) {
      setDraggedItem(null)
      return
    }
    
    const { active, over } = event
    
    console.log('Drag end event:', { activeId: active.id, overId: over?.id })

    if (active.id !== over?.id && over?.id) {
      // Work with the filtered and sorted staff for drag operations
      const oldIndex = filteredAndSortedStaff.findIndex((item) => item._id === active.id)
      const newIndex = filteredAndSortedStaff.findIndex((item) => item._id === over.id)

      console.log('Drag indices:', { oldIndex, newIndex, totalItems: filteredAndSortedStaff.length })

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedStaff = arrayMove(filteredAndSortedStaff, oldIndex, newIndex)
        
        // Update the order values based on new positions
        const staffOrder = reorderedStaff.map((member, index) => ({
          id: member._id,
          order: index
        }))

        console.log('New staff order:', staffOrder)

        // Update the main staff array with new order values
        const updatedStaff = staff.map(member => {
          const orderUpdate = staffOrder.find(item => item.id === member._id)
          return orderUpdate ? { ...member, order: orderUpdate.order } : member
        })
        
        // Update local state immediately for better UX
        setStaff(updatedStaff)

        try {
          setReorderLoading(true)
          setError(null)
          
          const response = await fetch('/api/staff/reorder', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ staffOrder }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          if (data.success) {
            setSuccessMessage('Staff order updated successfully!')
            setTimeout(() => setSuccessMessage(null), 3000)
          } else {
            const errorMsg = data.error || 'Failed to update staff order'
            setError(errorMsg)
            console.error('Failed to update staff order:', errorMsg)
            // Revert local state on error
            fetchStaff()
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Network error occurred'
          setError(`Failed to update order: ${errorMsg}`)
          console.error('Error updating staff order:', error)
          // Revert local state on error
          fetchStaff()
        } finally {
          setReorderLoading(false)
        }
      }
    }
    
    setDraggedItem(null)
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!isDragMode) return
    console.log('Drag start:', event.active.id)
    setDraggedItem(event.active.id as string)
  }

  const toggleDragMode = () => {
    setIsDragMode(!isDragMode)
    // Clear selections when entering drag mode
    if (!isDragMode) {
      setSelectedStaff([])
    }
  }

  const filteredAndSortedStaff = staff
    .filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // In drag mode, always sort by order to maintain drag functionality
      if (isDragMode) {
        return a.order - b.order
      }

      let aValue: string | number = a[sortBy]
      let bValue: string | number = b[sortBy]

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading staff members...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an error and no staff data
  if (error && staff.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Staff Management</h1>
            <p className="text-white mt-1">Manage your team members</p>
          </div>
        </div>
        
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium text-red-300 mb-2">Failed to Load Staff</h3>
          <p className="text-red-200 mb-6">{error}</p>
          <button
            onClick={fetchStaff}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Staff Management</h1>
          <p className="text-white mt-1">
            {isDragMode ? 'Drag and drop to reorder staff members' : 'Manage your team members'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleDragMode}
            disabled={reorderLoading}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isDragMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            } ${reorderLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Move size={20} />
            {isDragMode ? 'Exit Reorder Mode' : 'Reorder Staff'}
          </button>
          <Link
            href="/admin/staff/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Staff Member
          </Link>
        </div>
      </div>

      {/* Search and Sort Controls */}
      {!isDragMode && (
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'order' | 'createdAt')}
                className="px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                <option value="order">Sort by Order</option>
                <option value="name">Sort by Name</option>
                <option value="createdAt">Sort by Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-600 rounded-lg hover:bg-gray-600 flex items-center gap-1 bg-gray-700 text-white transition-colors"
              >
                <ArrowUpDown size={16} />
                {sortOrder === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-red-400">⚠️</div>
              <div>
                <p className="text-red-300 font-medium">Error</p>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-green-400">✅</div>
              <div>
                <p className="text-green-300 font-medium">Success</p>
                <p className="text-green-200 text-sm">{successMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-300 hover:text-green-100 p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Drag Mode Instructions */}
      {isDragMode && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Move size={20} className="text-blue-300" />
            <div>
              <p className="text-blue-300 font-medium">
                Reorder Mode Active {reorderLoading && '(Saving...)'} {draggedItem && `(Dragging: ${draggedItem})`}
              </p>
              <p className="text-blue-200 text-sm">
                Drag staff cards by the grip handles (⋮⋮) to reorder them. Changes are saved automatically. Click &quot;Exit Reorder Mode&quot; when done.
              </p>
              <p className="text-blue-100 text-xs mt-1">
                Debug: {filteredAndSortedStaff.length} items available for dragging
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {!isDragMode && selectedStaff.length > 0 && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-300">
              {selectedStaff.length} employee{selectedStaff.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateVisibility(true)}
                disabled={bulkLoading}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <Eye size={14} />
                Show on Website
              </button>
              <button
                onClick={() => bulkUpdateVisibility(false)}
                disabled={bulkLoading}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white text-sm rounded-lg flex items-center gap-1"
              >
                <EyeOff size={14} />
                Hide from Website
              </button>
              <button
                onClick={() => setSelectedStaff([])}
                className="px-3 py-1.5 border border-slate-600 text-white text-sm rounded-lg hover:bg-slate-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select All Checkbox */}
      {!isDragMode && filteredAndSortedStaff.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg shadow-sm border border-slate-700/50 p-4 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedStaff.length === filteredAndSortedStaff.length && filteredAndSortedStaff.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700"
            />
            <span className="ml-2 text-sm font-medium text-white">
              Select all employees ({filteredAndSortedStaff.length})
            </span>
          </label>
        </div>
      )}

      {/* Staff Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredAndSortedStaff.map(member => member._id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedStaff.map((member) => (
              <SortableStaffCard
                key={member._id}
                member={member}
                selectedStaff={selectedStaff}
                onSelectStaff={handleSelectStaff}
                onToggleVisibility={toggleVisibility}
                onDeleteStaff={deleteStaff}
                isDragMode={isDragMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredAndSortedStaff.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No staff members found</h3>
          <p className="text-gray-300 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first staff member.'}
          </p>
          {!searchTerm && (
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Staff Member
            </Link>
          )}
        </div>
      )}
    </div>
  )
}