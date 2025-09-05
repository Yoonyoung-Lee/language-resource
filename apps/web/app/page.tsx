'use client'

// Language Resource Search - Simple search interface with clickable header filters
// Search across all languages and highlight matching resources

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'

// Resource data structure
interface Resource {
  id: string
  key: string
  products: ('knox' | 'brity')[]
  category: {
    common?: boolean
    section1?: string
    section2?: string
    artboard?: string
    component?: string
  }
  translations: {
    'ko-KR': string
    'en-US': string
    'zh-CN'?: string
    'ja-JP'?: string
    'vi-VN'?: string
  }
  productSpecific?: {
    knoxTeams?: {
      'ko-KR'?: string
      'en-US'?: string
      'zh-CN'?: string
      'ja-JP'?: string
      'vi-VN'?: string
    }
    brityMessenger?: {
      'ko-KR'?: string
      'en-US'?: string
      'zh-CN'?: string
      'ja-JP'?: string
      'vi-VN'?: string
    }
  }
  status: 'approved' | 'draft' | 'review'
  metadata: {
    createdAt: string
    updatedAt: string
    author: string
  }
}

const PRODUCTS = {
  'knox': 'Knox',
  'brity': 'Brity'
} as const

// Get API secret for requests
const API_SECRET = process.env.NEXT_PUBLIC_SECRET || 'devpass'

export default function HomePage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Resource[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Filter states
  const [activeFilters, setActiveFilters] = useState<{
    service?: string
    category?: string  
    component?: string
    author?: string
  }>({})
  
  // Column dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  
  // Get unique values for each column
  const [columnOptions, setColumnOptions] = useState({
    services: [] as string[],
    categories: [] as string[],
    components: [] as string[],
    authors: [] as string[]
  })

  // Edit mode states
  const [editingCell, setEditingCell] = useState<{
    resourceId: string
    field: string
  } | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Add new resource states
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newResourceData, setNewResourceData] = useState({
    key: '',
    products: [] as ('knox' | 'brity')[],
    category: {
      section1: '',
      component: ''
    },
    translations: {
      'ko-KR': '',
      'en-US': '',
      'zh-CN': '',
      'ja-JP': '',
      'vi-VN': ''
    },
    metadata: {
      author: ''
    }
  })

  // Load initial data on page load
  useEffect(() => {
    handleSearch(true) // Load all resources initially
  }, [])

  // Search functionality - searches across all languages for matching resources
  const handleSearch = async (loadAll = false) => {
    if (!loadAll && !searchQuery.trim() && !hasActiveFilters()) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams({
        query: loadAll ? '' : searchQuery.trim(),
        locale: 'ko-KR' // Default locale for API compatibility
      })

      // Add filter parameters
      if (activeFilters.service) {
        // Convert display name to API value
        const productValue = activeFilters.service === 'Knox' ? 'knox' : activeFilters.service === 'Brity' ? 'brity' : activeFilters.service
        params.append('product', productValue)
      }
      if (activeFilters.category) params.append('category', activeFilters.category)

      const response = await fetch(`/api/resources/search?${params}`, {
        headers: {
          'x-secret': API_SECRET
        }
      })

      const result = await response.json()
      if (result.success) {
        let filteredData = result.data

        // Apply client-side filters
        filteredData = applyClientFilters(filteredData)
        
        setSearchResults(filteredData)
        
        // Update column options based on all data (not filtered)
        updateColumnOptions(result.data)
      } else {
        console.error('Search failed:', result.error)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(activeFilters).some(filter => filter)
  }

  // Apply client-side filters
  const applyClientFilters = (data: Resource[]) => {
    let filtered = data

    // Component filter
    if (activeFilters.component) {
      filtered = filtered.filter(resource => 
        resource.category.component?.toLowerCase() === activeFilters.component?.toLowerCase()
      )
    }

    // Author filter
    if (activeFilters.author) {
      filtered = filtered.filter(resource =>
        resource.metadata.author === activeFilters.author
      )
    }

    return filtered
  }

  // Update column options based on available data
  const updateColumnOptions = (data: Resource[]) => {
    const services = new Set<string>()
    const categories = new Set<string>()
    const components = new Set<string>()
    const authors = new Set<string>()

    data.forEach(resource => {
      // Services
      resource.products.forEach(product => services.add(PRODUCTS[product as keyof typeof PRODUCTS]))
      
      // Categories
      if (resource.category.section1) categories.add(resource.category.section1)
      
      // Components
      if (resource.category.component) components.add(resource.category.component)
      
      // Authors
      if (resource.metadata.author) authors.add(resource.metadata.author)
    })

    setColumnOptions({
      services: Array.from(services).sort(),
      categories: Array.from(categories).sort(),
      components: Array.from(components).sort(),
      authors: Array.from(authors).sort()
    })
  }

  // Apply column filter
  const applyColumnFilter = (column: string, value: string) => {
    const newFilters = { ...activeFilters }
    
    if (value === '' || newFilters[column as keyof typeof newFilters] === value) {
      // If clicking "전체" or the same filter, remove it
      delete newFilters[column as keyof typeof newFilters]
    } else {
      // Apply new filter
      newFilters[column as keyof typeof newFilters] = value
    }
    
    setActiveFilters(newFilters)
    setActiveDropdown(null)
    
    // Re-search with new filters
    setTimeout(() => handleSearch(), 100)
  }

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({})
    setActiveDropdown(null)
    handleSearch(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null)
    }
    
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  // Edit mode functions
  const startEditing = (resourceId: string, field: string, currentValue: any) => {
    setEditingCell({ resourceId, field })
    setEditValues({
      ...editValues,
      [`${resourceId}-${field}`]: currentValue || ''
    })
  }

  const cancelEditing = () => {
    setEditingCell(null)
    setEditValues({})
    setHasChanges(false)
  }

  const updateEditValue = (resourceId: string, field: string, value: any) => {
    const key = `${resourceId}-${field}`
    setEditValues({
      ...editValues,
      [key]: value
    })
    setHasChanges(true)
  }

  const saveChanges = async () => {
    if (!hasChanges || !editingCell) return

    setIsSaving(true)
    try {
      const { resourceId, field } = editingCell
      const key = `${resourceId}-${field}`
      const newValue = editValues[key]

      // Prepare update payload based on field
      let updatePayload: any = {}
      
      if (field === 'category') {
        updatePayload.category = { section1: newValue }
      } else if (field === 'component') {
        updatePayload.category = { component: newValue }
      } else if (field === 'author') {
        updatePayload.metadata = { author: newValue }
      } else if (field.startsWith('translation-')) {
        const locale = field.replace('translation-', '')
        updatePayload.translations = { [locale]: newValue }
      }

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': API_SECRET
        },
        body: JSON.stringify(updatePayload)
      })

      const result = await response.json()
      
      if (result.success) {
        // Update the local state with the new data
        const updatedResults = searchResults.map(resource => 
          resource.id === resourceId ? result.data : resource
        )
        setSearchResults(updatedResults)
        
        // Clear edit state
        cancelEditing()
        
        console.log('Resource updated successfully')
      } else {
        console.error('Failed to update resource:', result.error)
        alert('저장에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = (resourceId: string, field: string) => {
    return editingCell?.resourceId === resourceId && editingCell?.field === field
  }

  const getEditValue = (resourceId: string, field: string, currentValue: any) => {
    const key = `${resourceId}-${field}`
    return editValues[key] !== undefined ? editValues[key] : currentValue
  }

  // Add new resource functions
  const resetNewResourceForm = () => {
    setNewResourceData({
      key: '',
      products: [],
      category: {
        section1: '',
        component: ''
      },
      translations: {
        'ko-KR': '',
        'en-US': '',
        'zh-CN': '',
        'ja-JP': '',
        'vi-VN': ''
      },
      metadata: {
        author: ''
      }
    })
  }

  const updateNewResourceData = (field: string, value: any) => {
    setNewResourceData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNewResourceNestedData = (parent: string, field: string, value: any) => {
    setNewResourceData(prev => {
      const parentData = prev[parent as keyof typeof prev] as Record<string, any>
      return {
        ...prev,
        [parent]: {
          ...parentData,
          [field]: value
        }
      }
    })
  }

  const toggleProduct = (product: 'knox' | 'brity') => {
    setNewResourceData(prev => ({
      ...prev,
      products: prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }))
  }

  const validateNewResource = () => {
    if (!newResourceData.key.trim()) {
      alert('키(Key)를 입력해주세요.')
      return false
    }
    if (newResourceData.products.length === 0) {
      alert('최소 하나의 제품을 선택해주세요.')
      return false
    }
    if (!newResourceData.translations['ko-KR'].trim()) {
      alert('국문 번역을 입력해주세요.')
      return false
    }
    if (!newResourceData.translations['en-US'].trim()) {
      alert('영문 번역을 입력해주세요.')
      return false
    }
    if (!newResourceData.metadata.author.trim()) {
      alert('작성자를 입력해주세요.')
      return false
    }
    return true
  }

  const handleCreateResource = async () => {
    if (!validateNewResource()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': API_SECRET
        },
        body: JSON.stringify(newResourceData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Add the new resource to the current results
        setSearchResults(prev => [result.data, ...prev])
        
        // Reset form and close modal
        resetNewResourceForm()
        setShowAddModal(false)
        
        console.log('Resource created successfully')
      } else {
        console.error('Failed to create resource:', result.error)
        alert('리소스 생성에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('리소스 생성 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  // Helper functions
  const formatProducts = (products: string[]) => {
    return products.map(p => PRODUCTS[p as keyof typeof PRODUCTS]).join(', ')
  }

  // Get translation text - check both main translations and product-specific translations
  const getTranslationText = (resource: Resource, locale: 'ko-KR' | 'en-US' | 'zh-CN' | 'ja-JP' | 'vi-VN') => {
    // First check main translations
    if (resource.translations[locale]) {
      return resource.translations[locale]
    }

    // Then check product-specific translations
    if (resource.productSpecific) {
      for (const productKey of ['knoxTeams', 'brityMessenger'] as const) {
        const productTranslations = resource.productSpecific[productKey]
        if (productTranslations && productTranslations[locale]) {
          return productTranslations[locale]
        }
      }
    }

    return '-'
  }

  // Highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with centered search */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">언어 리소스 검색</h1>
            <p className="text-gray-600">Knox, Brity 제품의 다국어 리소스를 검색하고 매칭된 결과를 확인하세요</p>
          </div>
          
          {/* Centered search box */}
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="언어 리소스를 검색하세요... (키워드, 텍스트 내용 등)"
                className="flex-1 px-6 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={() => handleSearch()} 
                disabled={isSearching}
                size="lg"
                className="px-8"
              >
                {isSearching ? '검색 중...' : '검색'}
              </Button>
            </div>

            {/* Filter status and clear button */}
            {hasActiveFilters() && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-4 bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-blue-800">
                    {Object.keys(activeFilters).filter(key => activeFilters[key as keyof typeof activeFilters]).length}개 필터 적용됨
                  </span>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    필터 초기화
                  </Button>
                </div>
              </div>
            )}

            {/* Edit mode controls */}
            {editingCell && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-4 bg-orange-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-orange-800">
                    편집 모드 - 수정 후 저장하세요
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveChanges}
                      disabled={!hasChanges || isSaving}
                      size="sm"
                      className="text-xs"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      onClick={cancelEditing}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={isSaving}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {hasSearched && (
              <div className="text-center text-sm text-gray-600">
                {searchQuery.trim() && `"${searchQuery}" 검색 결과: `}
                <span className="font-medium">{searchResults.length}개</span> 리소스
                {hasActiveFilters() && (
                  <span className="text-blue-600 ml-2">
                    (필터 적용됨)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content - Search results table */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {hasSearched && (searchQuery.trim() || hasActiveFilters()) 
              ? `검색 및 필터 결과 (${searchResults.length}개)` 
              : `전체 언어 리소스 (${searchResults.length}개)`
            }
          </h2>
          
          {/* Add new resource button */}
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={editingCell !== null}
          >
            + 새 리소스 추가
          </Button>
        </div>
        
        {/* Add new resource modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">새 언어 리소스 추가</h2>
                  <button
                    onClick={() => {
                      resetNewResourceForm()
                      setShowAddModal(false)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isCreating}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid gap-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                        키 (Key) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="key"
                        type="text"
                        value={newResourceData.key}
                        onChange={(e) => updateNewResourceData('key', e.target.value)}
                        placeholder="homepage.title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        제품 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="knox"
                            checked={newResourceData.products.includes('knox')}
                            onChange={() => toggleProduct('knox')}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="knox" className="text-sm">Knox</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="brity"
                            checked={newResourceData.products.includes('brity')}
                            onChange={() => toggleProduct('brity')}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="brity" className="text-sm">Brity</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        카테고리
                      </label>
                      <input
                        id="category"
                        type="text"
                        value={newResourceData.category.section1}
                        onChange={(e) => updateNewResourceNestedData('category', 'section1', e.target.value)}
                        placeholder="음성/영상 채팅"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="component" className="block text-sm font-medium text-gray-700 mb-1">
                        컴포넌트
                      </label>
                      <input
                        id="component"
                        type="text"
                        value={newResourceData.category.component}
                        onChange={(e) => updateNewResourceNestedData('category', 'component', e.target.value)}
                        placeholder="Dialog"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Translations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">번역</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="ko-translation" className="block text-xs text-gray-600 mb-1">
                          국문 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="ko-translation"
                          value={newResourceData.translations['ko-KR']}
                          onChange={(e) => updateNewResourceNestedData('translations', 'ko-KR', e.target.value)}
                          placeholder="한국어 번역을 입력하세요"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="en-translation" className="block text-xs text-gray-600 mb-1">
                          영문 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="en-translation"
                          value={newResourceData.translations['en-US']}
                          onChange={(e) => updateNewResourceNestedData('translations', 'en-US', e.target.value)}
                          placeholder="English translation"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="zh-translation" className="block text-xs text-gray-600 mb-1">
                          중문
                        </label>
                        <textarea
                          id="zh-translation"
                          value={newResourceData.translations['zh-CN']}
                          onChange={(e) => updateNewResourceNestedData('translations', 'zh-CN', e.target.value)}
                          placeholder="中文翻译"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="ja-translation" className="block text-xs text-gray-600 mb-1">
                          일문
                        </label>
                        <textarea
                          id="ja-translation"
                          value={newResourceData.translations['ja-JP']}
                          onChange={(e) => updateNewResourceNestedData('translations', 'ja-JP', e.target.value)}
                          placeholder="日本語翻訳"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="vi-translation" className="block text-xs text-gray-600 mb-1">
                          베트남어
                        </label>
                        <textarea
                          id="vi-translation"
                          value={newResourceData.translations['vi-VN']}
                          onChange={(e) => updateNewResourceNestedData('translations', 'vi-VN', e.target.value)}
                          placeholder="Bản dịch tiếng Việt"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                      작성자 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="author"
                      type="text"
                      value={newResourceData.metadata.author}
                      onChange={(e) => updateNewResourceNestedData('metadata', 'author', e.target.value)}
                      placeholder="김개발"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      onClick={() => {
                        resetNewResourceForm()
                        setShowAddModal(false)
                      }}
                      disabled={isCreating}
                      variant="outline"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleCreateResource}
                      disabled={isCreating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isCreating ? '생성 중...' : '리소스 추가'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Service column with dropdown */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveDropdown(activeDropdown === 'service' ? null : 'service')
                    }}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    서비스
                    {activeFilters.service && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {activeDropdown === 'service' && (
                    <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
                      <div className="py-1">
                        <button
                          onClick={() => applyColumnFilter('service', '')}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          전체 서비스
                        </button>
                        {columnOptions.services.map(service => (
                          <button
                            key={service}
                            onClick={() => applyColumnFilter('service', service)}
                            className={`block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                              activeFilters.service === service ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            {service}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                
                {/* Category column with dropdown */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveDropdown(activeDropdown === 'category' ? null : 'category')
                    }}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    카테고리
                    {activeFilters.category && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {activeDropdown === 'category' && (
                    <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
                      <div className="py-1">
                        <button
                          onClick={() => applyColumnFilter('category', '')}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          전체 카테고리
                        </button>
                        {columnOptions.categories.map(category => (
                          <button
                            key={category}
                            onClick={() => applyColumnFilter('category', category)}
                            className={`block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                              activeFilters.category === category ? 'bg-green-50 text-green-700' : ''
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                
                {/* Component column with dropdown */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveDropdown(activeDropdown === 'component' ? null : 'component')
                    }}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    컴포넌트
                    {activeFilters.component && <span className="w-2 h-2 bg-purple-500 rounded-full"></span>}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {activeDropdown === 'component' && (
                    <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
                      <div className="py-1">
                        <button
                          onClick={() => applyColumnFilter('component', '')}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          전체 컴포넌트
                        </button>
                        {columnOptions.components.map(component => (
                          <button
                            key={component}
                            onClick={() => applyColumnFilter('component', component)}
                            className={`block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                              activeFilters.component === component ? 'bg-purple-50 text-purple-700' : ''
                            }`}
                          >
                            {component}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
                
                {/* Language columns - no filters */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">국문</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">영문</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중문</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일문</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">베트남어</th>
                
                {/* Date columns - no filters */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최초입력일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종수정일</th>
                
                {/* Author column with dropdown */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveDropdown(activeDropdown === 'author' ? null : 'author')
                    }}
                    className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    작성자
                    {activeFilters.author && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {activeDropdown === 'author' && (
                    <div className="absolute top-full right-0 z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
                      <div className="py-1">
                        <button
                          onClick={() => applyColumnFilter('author', '')}
                          className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50"
                        >
                          전체 작성자
                        </button>
                        {columnOptions.authors.map(author => (
                          <button
                            key={author}
                            onClick={() => applyColumnFilter('author', author)}
                            className={`block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                              activeFilters.author === author ? 'bg-orange-50 text-orange-700' : ''
                            }`}
                          >
                            {author}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {searchResults.length > 0 ? (
                searchResults.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatProducts(resource.products)}
                    </td>
                    
                    {/* Category - editable */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {isEditing(resource.id, 'category') ? (
                        <input
                          type="text"
                          value={getEditValue(resource.id, 'category', resource.category.section1 || '')}
                          onChange={(e) => updateEditValue(resource.id, 'category', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'category', resource.category.section1 || '')}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          disabled={editingCell !== null}
                        >
                          {resource.category.section1 || '-'}
                        </button>
                      )}
                    </td>
                    
                    {/* Component - editable */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {isEditing(resource.id, 'component') ? (
                        <input
                          type="text"
                          value={getEditValue(resource.id, 'component', resource.category.component || '')}
                          onChange={(e) => updateEditValue(resource.id, 'component', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'component', resource.category.component || '')}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          disabled={editingCell !== null}
                        >
                          {resource.category.component || '-'}
                        </button>
                      )}
                    </td>
                    {/* Korean translation - editable */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {isEditing(resource.id, 'translation-ko-KR') ? (
                        <textarea
                          value={getEditValue(resource.id, 'translation-ko-KR', getTranslationText(resource, 'ko-KR'))}
                          onChange={(e) => updateEditValue(resource.id, 'translation-ko-KR', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'translation-ko-KR', getTranslationText(resource, 'ko-KR'))}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors break-words"
                          disabled={editingCell !== null}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(resource, 'ko-KR'), searchQuery) 
                          }} />
                        </button>
                      )}
                    </td>
                    
                    {/* English translation - editable */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {isEditing(resource.id, 'translation-en-US') ? (
                        <textarea
                          value={getEditValue(resource.id, 'translation-en-US', getTranslationText(resource, 'en-US'))}
                          onChange={(e) => updateEditValue(resource.id, 'translation-en-US', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'translation-en-US', getTranslationText(resource, 'en-US'))}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors break-words"
                          disabled={editingCell !== null}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(resource, 'en-US'), searchQuery) 
                          }} />
                        </button>
                      )}
                    </td>
                    
                    {/* Chinese translation - editable */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {isEditing(resource.id, 'translation-zh-CN') ? (
                        <textarea
                          value={getEditValue(resource.id, 'translation-zh-CN', getTranslationText(resource, 'zh-CN'))}
                          onChange={(e) => updateEditValue(resource.id, 'translation-zh-CN', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'translation-zh-CN', getTranslationText(resource, 'zh-CN'))}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors break-words"
                          disabled={editingCell !== null}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(resource, 'zh-CN'), searchQuery) 
                          }} />
                        </button>
                      )}
                    </td>
                    
                    {/* Japanese translation - editable */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {isEditing(resource.id, 'translation-ja-JP') ? (
                        <textarea
                          value={getEditValue(resource.id, 'translation-ja-JP', getTranslationText(resource, 'ja-JP'))}
                          onChange={(e) => updateEditValue(resource.id, 'translation-ja-JP', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'translation-ja-JP', getTranslationText(resource, 'ja-JP'))}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors break-words"
                          disabled={editingCell !== null}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(resource, 'ja-JP'), searchQuery) 
                          }} />
                        </button>
                      )}
                    </td>
                    
                    {/* Vietnamese translation - editable */}
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      {isEditing(resource.id, 'translation-vi-VN') ? (
                        <textarea
                          value={getEditValue(resource.id, 'translation-vi-VN', getTranslationText(resource, 'vi-VN'))}
                          onChange={(e) => updateEditValue(resource.id, 'translation-vi-VN', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'translation-vi-VN', getTranslationText(resource, 'vi-VN'))}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors break-words"
                          disabled={editingCell !== null}
                        >
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(resource, 'vi-VN'), searchQuery) 
                          }} />
                        </button>
                      )}
                    </td>
                    {/* Creation date - not editable */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {resource.metadata.createdAt}
                    </td>
                    
                    {/* Update date - not editable */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {resource.metadata.updatedAt}
                    </td>
                    
                    {/* Author - editable */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {isEditing(resource.id, 'author') ? (
                        <input
                          type="text"
                          value={getEditValue(resource.id, 'author', resource.metadata.author)}
                          onChange={(e) => updateEditValue(resource.id, 'author', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(resource.id, 'author', resource.metadata.author)}
                          className="text-left w-full hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          disabled={editingCell !== null}
                        >
                          {resource.metadata.author}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {isSearching ? '검색 중...' : hasSearched ? '검색 결과가 없습니다' : '리소스를 불러오는 중...'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}