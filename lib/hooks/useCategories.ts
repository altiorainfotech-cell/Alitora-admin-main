// Simple categories hook for blog forms
// Returns hardcoded categories since we don't have a categories management system

export function useAllCategories() {
  const categories = [
    { name: 'AI', id: 'ai' },
    { name: 'Mobile', id: 'mobile' },
    { name: 'Digital', id: 'digital' },
    { name: 'Automation', id: 'automation' },
    { name: 'Design', id: 'design' },
    { name: 'Company', id: 'company' },
    { name: 'Technology', id: 'technology' },
    { name: 'Development', id: 'development' }
  ]

  return {
    categories,
    isLoading: false,
    error: null
  }
}