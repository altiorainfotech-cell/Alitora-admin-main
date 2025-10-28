/**
 * Accessibility utilities for the admin panel
 */

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  // Check if we're in the browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }
  
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement)
    }
  }, 1000)
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private static focusStack: HTMLElement[] = []
  
  /**
   * Save current focus and set new focus
   */
  static pushFocus(element: HTMLElement): void {
    if (typeof document === 'undefined') return
    
    const currentFocus = document.activeElement as HTMLElement
    if (currentFocus) {
      this.focusStack.push(currentFocus)
    }
    element.focus()
  }
  
  /**
   * Restore previous focus
   */
  static popFocus(): void {
    const previousFocus = this.focusStack.pop()
    if (previousFocus) {
      previousFocus.focus()
    }
  }
  
  /**
   * Trap focus within an element
   */
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    
    // Focus first element
    if (firstElement) {
      firstElement.focus()
    }
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
  ): number {
    let newIndex = currentIndex
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        newIndex = (currentIndex + 1) % items.length
        break
      case 'ArrowUp':
        event.preventDefault()
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = items.length - 1
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (onSelect) {
          onSelect(currentIndex)
        }
        return currentIndex
    }
    
    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus()
    }
    
    return newIndex
  }
  
  /**
   * Handle escape key to close modals/dropdowns
   */
  static handleEscape(event: KeyboardEvent, onEscape: () => void): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
    }
  }
}

/**
 * ARIA utilities
 */
export class AriaUtils {
  /**
   * Generate unique ID for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Set ARIA expanded state
   */
  static setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString())
  }
  
  /**
   * Set ARIA selected state
   */
  static setSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString())
  }
  
  /**
   * Set ARIA pressed state for toggle buttons
   */
  static setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString())
  }
  
  /**
   * Set ARIA disabled state
   */
  static setDisabled(element: HTMLElement, disabled: boolean): void {
    if (disabled) {
      element.setAttribute('aria-disabled', 'true')
      element.setAttribute('tabindex', '-1')
    } else {
      element.removeAttribute('aria-disabled')
      element.removeAttribute('tabindex')
    }
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  private static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 0
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b)
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b)
    
    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)
    
    return (brightest + 0.05) / (darkest + 0.05)
  }
  
  /**
   * Convert hex color to RGB
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
  
  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAGAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 4.5
  }
  
  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAGAAA(foreground: string, background: string): boolean {
    return this.getContrastRatio(foreground, background) >= 7
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Check if screen reader is likely active
   */
  static isScreenReaderActive(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false
    }
    
    // Check for common screen reader indicators
    return !!(
      window.navigator.userAgent.match(/NVDA|JAWS|VoiceOver|TalkBack|Dragon/i) ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]')
    )
  }
  
  /**
   * Create visually hidden text for screen readers
   */
  static createScreenReaderText(text: string): HTMLElement {
    const element = document.createElement('span')
    element.className = 'sr-only'
    element.textContent = text
    return element
  }
  
  /**
   * Update screen reader text
   */
  static updateScreenReaderText(element: HTMLElement, text: string): void {
    const srElement = element.querySelector('.sr-only')
    if (srElement) {
      srElement.textContent = text
    } else {
      element.appendChild(this.createScreenReaderText(text))
    }
  }
}

/**
 * Reduced motion utilities
 */
export class MotionUtils {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  /**
   * Apply animation only if motion is not reduced
   */
  static conditionalAnimation(element: HTMLElement, animation: string): void {
    if (!this.prefersReducedMotion()) {
      element.style.animation = animation
    }
  }
  
  /**
   * Apply transition only if motion is not reduced
   */
  static conditionalTransition(element: HTMLElement, transition: string): void {
    if (!this.prefersReducedMotion()) {
      element.style.transition = transition
    }
  }
}

/**
 * Form accessibility utilities
 */
export class FormAccessibility {
  /**
   * Associate label with form control
   */
  static associateLabel(label: HTMLLabelElement, control: HTMLElement): void {
    const id = control.id || AriaUtils.generateId('form-control')
    control.id = id
    label.setAttribute('for', id)
  }
  
  /**
   * Add error message to form control
   */
  static addErrorMessage(control: HTMLElement, message: string): void {
    const errorId = AriaUtils.generateId('error')
    const errorElement = document.createElement('div')
    errorElement.id = errorId
    errorElement.className = 'text-red-400 text-sm mt-1'
    errorElement.textContent = message
    errorElement.setAttribute('role', 'alert')
    
    control.setAttribute('aria-invalid', 'true')
    control.setAttribute('aria-describedby', errorId)
    
    control.parentNode?.insertBefore(errorElement, control.nextSibling)
  }
  
  /**
   * Remove error message from form control
   */
  static removeErrorMessage(control: HTMLElement): void {
    control.removeAttribute('aria-invalid')
    const describedBy = control.getAttribute('aria-describedby')
    if (describedBy) {
      const errorElement = document.getElementById(describedBy)
      if (errorElement) {
        errorElement.remove()
      }
      control.removeAttribute('aria-describedby')
    }
  }
}