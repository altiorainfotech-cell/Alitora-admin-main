'use client'

import { useState } from 'react'
import { Plus, X, Move, Type, FileText } from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'
import { RichTextEditor } from './RichTextEditor'
import DOMPurify from 'isomorphic-dompurify'

export interface ContentSection {
  id: string
  type: 'title' | 'content'
  value: string
  fontSize?: string
  fontWeight?: 'normal' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
}

interface DynamicContentSectionsProps {
  sections: ContentSection[]
  onSectionsChange: (sections: ContentSection[]) => void
  error?: string
}

export function DynamicContentSections({
  sections,
  onSectionsChange,
  error
}: DynamicContentSectionsProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const addSection = (type: 'title' | 'content') => {
    const newSection: ContentSection = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      value: '',
      fontSize: type === 'title' ? '24' : '16',
      fontWeight: type === 'title' ? 'bold' : 'normal',
      textAlign: 'left',
      color: '#ffffff'
    }
    onSectionsChange([...sections, newSection])
  }

  const removeSection = (id: string) => {
    onSectionsChange(sections.filter(section => section.id !== id))
  }

  const updateSection = (id: string, updates: Partial<ContentSection>) => {
    onSectionsChange(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ))
  }

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [movedSection] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, movedSection)
    onSectionsChange(newSections)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSection(draggedIndex, index)
      setDraggedIndex(index)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Content Sections</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addSection('title')}
            icon={<Type size={16} />}
          >
            Add Title
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => addSection('content')}
            icon={<FileText size={16} />}
          >
            Add Content
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {sections.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>No content sections yet. Add a title or content section to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            className={`
              bg-gray-800 rounded-lg border border-gray-600 p-4
              hover:border-gray-500 transition-colors
              ${draggedIndex === index ? 'opacity-50' : ''}
            `}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Move size={16} className="text-gray-400 cursor-move" />
                <span className="text-sm font-medium text-gray-300">
                  {section.type === 'title' ? 'Title Section' : 'Content Section'}
                </span>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => removeSection(section.id)}
                icon={<X size={14} />}
              />
            </div>

            {/* Section Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Font Size</label>
                <select
                  value={section.fontSize || '16'}
                  onChange={(e) => updateSection(section.id, { fontSize: e.target.value })}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                  <option value="24">24px</option>
                  <option value="28">28px</option>
                  <option value="32">32px</option>
                  <option value="36">36px</option>
                  <option value="48">48px</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Font Weight</label>
                <select
                  value={section.fontWeight || 'normal'}
                  onChange={(e) => updateSection(section.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Text Align</label>
                <select
                  value={section.textAlign || 'left'}
                  onChange={(e) => updateSection(section.id, { textAlign: e.target.value as 'left' | 'center' | 'right' })}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Text Color</label>
                <input
                  type="color"
                  value={section.color || '#ffffff'}
                  onChange={(e) => updateSection(section.id, { color: e.target.value })}
                  className="w-full h-8 bg-gray-700 rounded border border-gray-600"
                />
              </div>
            </div>

            {/* Section Content */}
            {section.type === 'title' ? (
              <input
                type="text"
                placeholder="Enter title..."
                value={section.value}
                onChange={(e) => updateSection(section.id, { value: e.target.value })}
                className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                style={{
                  fontSize: `${section.fontSize || 24}px`,
                  fontWeight: section.fontWeight || 'bold',
                  textAlign: section.textAlign || 'left',
                  color: section.color || '#ffffff'
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: `${section.fontSize || 16}px`,
                  fontWeight: section.fontWeight || 'normal',
                  textAlign: section.textAlign || 'left',
                  color: section.color || '#ffffff'
                }}
              >
                <RichTextEditor
                  value={section.value}
                  onChange={(value) => updateSection(section.id, { value })}
                  placeholder="Enter content..."
                  minHeight="150px"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview */}
      {sections.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-4">Preview</h4>
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                style={{
                  fontSize: `${section.fontSize || (section.type === 'title' ? 24 : 16)}px`,
                  fontWeight: section.fontWeight || (section.type === 'title' ? 'bold' : 'normal'),
                  textAlign: section.textAlign || 'left',
                  color: section.color || '#ffffff'
                }}
              >
                {section.type === 'title' ? (
                  <div>{section.value || 'Untitled'}</div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.value || '<p>No content</p>') }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}