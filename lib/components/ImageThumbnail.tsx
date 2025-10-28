'use client'

import { OptimizedImage } from './OptimizedImage'
import { cn } from '../utils'

interface ImageThumbnailProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24', 
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
}

const sizeDimensions = {
  sm: { width: 64, height: 64 },
  md: { width: 96, height: 96 },
  lg: { width: 128, height: 128 },
  xl: { width: 192, height: 192 }
}

export function ImageThumbnail({
  src,
  alt,
  size = 'md',
  className,
  priority = false,
  onClick
}: ImageThumbnailProps) {
  const dimensions = sizeDimensions[size]
  
  return (
    <div 
      className={cn(
        'relative rounded-lg overflow-hidden bg-gray-800 border border-gray-700',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:border-gray-600 transition-colors',
        className
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        quality={80}
        objectFit="cover"
        className="w-full h-full"
        sizes={`${dimensions.width}px`}
      />
    </div>
  )
}