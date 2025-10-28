'use client'

import { useState, useRef, useEffect } from 'react'
import './rich-text-editor.css'
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Type,
  Palette,
  Highlighter,
  Quote,
  Code,
  Strikethrough
} from 'lucide-react'
import { Button } from '@/lib/components/ui/Button'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  label?: string
  required?: boolean
  minHeight?: string
  onImageInsert?: (imageUrl: string, width?: number, height?: number, position?: string) => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  error,
  label,
  required,
  minHeight = "200px",
  onImageInsert
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState('16')
  const [textColor, setTextColor] = useState('#ffffff')
  const [highlightColor, setHighlightColor] = useState('#ffff00')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedSelection, setSavedSelection] = useState<Range | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleFontSizeChange = (size: string) => {
    setFontSize(size)
    execCommand('fontSize', '7') // Use size 7 and then override with CSS
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.style.fontSize = size + 'px'
        try {
          range.surroundContents(span)
        } catch (e) {
          // If can't surround, just apply to the whole editor
          editorRef.current.style.fontSize = size + 'px'
        }
      }
    }
    handleInput()
  }

  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font)
    execCommand('fontName', font)
  }

  const handleColorChange = (color: string) => {
    setTextColor(color)
    execCommand('foreColor', color)
    setShowColorPicker(false)
  }

  const handleHighlightChange = (color: string) => {
    setHighlightColor(color)
    execCommand('hiliteColor', color)
    setShowHighlightPicker(false)
  }

  const insertParagraph = () => {
    execCommand('formatBlock', 'p')
  }

  const insertBlockquote = () => {
    execCommand('formatBlock', 'blockquote')
  }

  const insertImage = () => {
    // Save current cursor position
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange())
    } else {
      setSavedSelection(null)
    }
    setShowImageUpload(true)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const data = await response.json()
      const imageUrl = data.data?.url
      
      if (imageUrl) {
        insertImageIntoEditor(imageUrl)
      }
    } catch (error) {
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
      setShowImageUpload(false)
      setSavedSelection(null) // Clear saved selection
    }
  }

  const insertImageIntoEditor = (imageUrl: string, width?: number, height?: number, position?: string) => {
    if (editorRef.current) {
      const img = document.createElement('img')
      img.src = imageUrl
      img.alt = 'Inserted image'
      img.setAttribute('alt', 'Inserted image')
      img.style.maxWidth = '100%'
      img.style.cursor = 'pointer'
      img.className = 'editor-image'
      img.style.margin = '8px 0'
      
      // Add delete functionality
      img.addEventListener('click', (e) => {
        e.preventDefault()
        if (confirm('Delete this image?')) {
          img.remove()
          handleInput()
        }
      })
      
      // Add resize handles
      img.addEventListener('mouseenter', () => {
        img.style.border = '2px dashed #3b82f6'
      })
      
      img.addEventListener('mouseleave', () => {
        img.style.border = 'none'
      })
      
      if (width) img.style.width = `${width}px`
      if (height) img.style.height = `${height}px`
      
      if (position) {
        switch (position) {
          case 'left':
            img.style.float = 'left'
            img.style.marginRight = '10px'
            img.style.marginBottom = '10px'
            break
          case 'right':
            img.style.float = 'right'
            img.style.marginLeft = '10px'
            img.style.marginBottom = '10px'
            break
          case 'center':
            img.style.display = 'block'
            img.style.margin = '10px auto'
            break
          case 'inline':
            img.style.display = 'inline'
            img.style.margin = '0 5px'
            break
        }
      }
      
      // Use saved selection if available, otherwise current selection, otherwise append to bottom
      if (savedSelection) {
        // Restore the saved selection and insert image there
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(savedSelection)
          savedSelection.insertNode(img)
          savedSelection.collapse(false)
        }
        setSavedSelection(null) // Clear saved selection after use
      } else {
        // Check for current selection
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.insertNode(img)
          range.collapse(false)
        } else {
          // No selection, append to bottom with some spacing
          const br = document.createElement('br')
          editorRef.current.appendChild(br)
          editorRef.current.appendChild(img)
          const br2 = document.createElement('br')
          editorRef.current.appendChild(br2)
        }
      }
      
      // Focus back on the editor
      editorRef.current.focus()
      handleInput()
    }
  }

  // Expose the insert function to parent component
  if (onImageInsert) {
    // This is a bit of a hack, but we need to expose the function
    (window as any).insertImageIntoEditor = insertImageIntoEditor
  }

  const insertLink = () => {
    const url = prompt('Enter link URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const formatHeading = (level: string) => {
    execCommand('formatBlock', `h${level}`)
  }

  const handleCloseImageUpload = () => {
    setShowImageUpload(false)
    setSavedSelection(null) // Clear saved selection when canceling
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      {/* Toolbar */}
      <div className="bg-gray-700 rounded-t-lg p-3 border-b border-gray-600">
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Formatting */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              className="p-1"
              title="Bold"
            >
              <Bold size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="p-1"
              title="Italic"
            >
              <Italic size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="p-1"
              title="Underline"
            >
              <Underline size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('strikeThrough')}
              className="p-1"
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </Button>
          </div>

          {/* Font Family */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <select
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Courier New">Courier New</option>
              <option value="Impact">Impact</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <Type size={16} className="text-gray-400" />
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
            >
              <option value="10">10px</option>
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
              <option value="64">64px</option>
            </select>
          </div>

          {/* Text Color */}
          <div className="relative border-r border-gray-600 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1"
              title="Text Color"
            >
              <Palette size={16} />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg p-3 shadow-lg z-10 border border-gray-600">
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {[
                    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                    '#ff00ff', '#00ffff', '#ffa500', '#800080', '#008000', '#800000',
                    '#808080', '#c0c0c0', '#808000', '#000080', '#008080', '#ff69b4'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-500 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-8 rounded border border-gray-500"
                />
              </div>
            )}
          </div>

          {/* Highlight Color */}
          <div className="relative border-r border-gray-600 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="p-1"
              title="Highlight Text"
            >
              <Highlighter size={16} />
            </Button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded-lg p-3 shadow-lg z-10 border border-gray-600">
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {[
                    '#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ffa500', '#ff0000',
                    '#0000ff', '#800080', '#008000', '#800000', '#808080', '#c0c0c0'
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-500 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleHighlightChange(color)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => handleHighlightChange(e.target.value)}
                  className="w-full h-8 rounded border border-gray-500"
                />
              </div>
            )}
          </div>

          {/* Headings & Paragraphs */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <select
              onChange={(e) => {
                if (e.target.value === 'p') {
                  insertParagraph()
                } else if (e.target.value === 'blockquote') {
                  insertBlockquote()
                } else {
                  formatHeading(e.target.value)
                }
                e.target.value = '' // Reset selection
              }}
              className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
              defaultValue=""
            >
              <option value="">Format</option>
              <option value="p">Paragraph</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="4">Heading 4</option>
              <option value="5">Heading 5</option>
              <option value="6">Heading 6</option>
              <option value="blockquote">Quote</option>
            </select>
          </div>

          {/* Alignment */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyLeft')}
              className="p-1"
              title="Align Left"
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyCenter')}
              className="p-1"
              title="Align Center"
            >
              <AlignCenter size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('justifyRight')}
              className="p-1"
              title="Align Right"
            >
              <AlignRight size={16} />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center space-x-1 border-r border-gray-600 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertUnorderedList')}
              className="p-1"
              title="Bullet List"
            >
              <List size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => execCommand('insertOrderedList')}
              className="p-1"
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex items-center space-x-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertLink}
              className="p-1"
              title="Insert Link"
            >
              <Link size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={insertImage}
              className="p-1"
              title="Insert Image"
            >
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={`
          rich-text-editor bg-gray-800 text-white p-4 rounded-b-lg border border-gray-600 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          overflow-y-auto max-h-96
          ${error ? 'border-red-500' : ''}
        `}
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Upload Image
              {savedSelection && (
                <span className="text-sm text-gray-400 ml-2">(will insert at cursor position)</span>
              )}
            </h3>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImageUpload(file)
                }
              }}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('image/')) {
                    handleImageUpload(file)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-300">Click to select an image or drag & drop</p>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                {!savedSelection && (
                  <p className="text-xs text-yellow-400 mt-2">Image will be added to the bottom of content</p>
                )}
              </div>
              
              {uploading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Uploading...</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseImageUpload}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}