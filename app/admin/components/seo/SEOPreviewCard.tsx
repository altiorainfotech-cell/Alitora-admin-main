'use client'

import { Globe, ExternalLink, Smartphone, Monitor } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

interface SEOPreviewCardProps {
  title: string
  description: string
  url: string
  siteName?: string
  ogImage?: string
  className?: string
}

type PreviewType = 'google' | 'facebook' | 'twitter'

export default function SEOPreviewCard({
  title,
  description,
  url,
  siteName = 'Altiora Infotech',
  ogImage,
  className = ''
}: SEOPreviewCardProps) {
  const [previewType, setPreviewType] = useState<PreviewType>('google')

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const truncatedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title
  const truncatedDescription = description.length > 160 ? description.substring(0, 157) + '...' : description

  const renderGooglePreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4" />
        Google Search Result
      </div>
      
      <div className="space-y-2">
        {/* URL */}
        <div className="text-sm text-green-700 flex items-center gap-1">
          <span>{displayUrl}</span>
        </div>
        
        {/* Title */}
        <div className="text-xl text-blue-600 hover:underline cursor-pointer leading-tight">
          {truncatedTitle || 'Page title will appear here'}
        </div>
        
        {/* Description */}
        <div className="text-sm text-gray-600 leading-relaxed">
          {truncatedDescription || 'Page description will appear here'}
        </div>
      </div>
    </div>
  )

  const renderFacebookPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="text-sm text-gray-600 mb-3 p-4 pb-0 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Facebook Link Preview
      </div>
      
      {/* Image */}
      {ogImage ? (
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          <Image 
            src={ogImage} 
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
          <div className="hidden w-full h-full items-center justify-center text-gray-500 text-sm bg-gray-100">
            Image preview unavailable
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Monitor className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm">No image specified</div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <div className="text-xs text-gray-500 uppercase mb-1">
          {displayUrl}
        </div>
        <div className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {title || 'Page title will appear here'}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2">
          {description || 'Page description will appear here'}
        </div>
      </div>
    </div>
  )

  const renderTwitterPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="text-sm text-gray-600 mb-3 p-4 pb-0 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Twitter Card Preview
      </div>
      
      <div className="border-l-4 border-blue-500 bg-gray-50">
        {/* Image */}
        {ogImage ? (
          <div className="aspect-video bg-gray-200 relative overflow-hidden">
            <Image 
              src={ogImage} 
              alt="Twitter card preview"
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
            <div className="hidden w-full h-full items-center justify-center text-gray-500 text-sm bg-gray-100">
              Image preview unavailable
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Smartphone className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">No image specified</div>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          <div className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {title || 'Page title will appear here'}
          </div>
          <div className="text-sm text-gray-600 mb-2 line-clamp-2">
            {description || 'Page description will appear here'}
          </div>
          <div className="text-xs text-gray-500">
            {displayUrl}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      {/* Preview Type Selector */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setPreviewType('google')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            previewType === 'google'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Google
        </button>
        <button
          onClick={() => setPreviewType('facebook')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            previewType === 'facebook'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Facebook
        </button>
        <button
          onClick={() => setPreviewType('twitter')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            previewType === 'twitter'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Twitter
        </button>
      </div>

      {/* Preview Content */}
      <div className="bg-gray-50 p-4 rounded-lg">
        {previewType === 'google' && renderGooglePreview()}
        {previewType === 'facebook' && renderFacebookPreview()}
        {previewType === 'twitter' && renderTwitterPreview()}
      </div>

      {/* Preview Info */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Preview updates as you type</span>
          <span>
            {previewType === 'google' && 'Search result appearance'}
            {previewType === 'facebook' && 'Social media link preview'}
            {previewType === 'twitter' && 'Twitter card appearance'}
          </span>
        </div>
      </div>
    </div>
  )
}