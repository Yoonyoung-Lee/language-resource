'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Separator } from '@workspace/ui/components/separator'

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

interface SearchResultsPageProps {
  searchQuery: string
  onBackToHome: () => void
}

export function SearchResultsPage({ searchQuery, onBackToHome }: SearchResultsPageProps) {
  const [searchResults, setSearchResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  useEffect(() => {
    performSearch()
  }, [searchQuery])

  const performSearch = async () => {
    setLoading(true)
    
    // First try to search in localStorage
    const hasLocalData = localStorage.getItem('language-resources') !== null
    const localResults = searchLocalStorage()
    
    // If we have local data, use local results (even if empty - means no match found)
    if (hasLocalData) {
      setSearchResults(localResults)
      if (localResults.length > 0) {
        setSelectedResource(localResults[0])
      } else {
        setSelectedResource(null)
      }
      setLoading(false)
      return
    }
    
    // If no local data, try API
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        locale: 'ko-KR'
      })

      const response = await fetch(`/api/resources/search?${params}`, {
        headers: {
          'x-secret': API_SECRET
        }
      })

      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data)
        if (result.data.length > 0) {
          setSelectedResource(result.data[0])
        } else {
          setSelectedResource(null)
        }
      } else {
        console.error('Search failed:', result.error)
        setSearchResults([])
        setSelectedResource(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setSelectedResource(null)
    } finally {
      setLoading(false)
    }
  }

  // Search in localStorage data
  const searchLocalStorage = (): Resource[] => {
    try {
      const savedResources = localStorage.getItem('language-resources')
      if (!savedResources) return []
      
      const localResources = JSON.parse(savedResources)
      const query = searchQuery.toLowerCase()
      
      // Convert localStorage format to search results format
      const convertedResources = localResources
        .filter((resource: any) => 
          resource.korean_text?.toLowerCase().includes(query) ||
          resource.english_text?.toLowerCase().includes(query) ||
          resource.feature_category?.toLowerCase().includes(query) ||
          resource.component?.toLowerCase().includes(query) ||
          resource.artboard?.toLowerCase().includes(query) ||
          resource.notes?.toLowerCase().includes(query) ||
          resource.author?.toLowerCase().includes(query)
        )
        .map((resource: any): Resource => ({
          id: resource.id.toString(),
          key: `resource_${resource.id}`,
          products: [
            ...(resource.knox ? ['knox'] : []),
            ...(resource.brity ? ['brity'] : [])
          ] as ('knox' | 'brity')[],
          category: {
            common: resource.is_common,
            section1: resource.feature_category,
            component: resource.component,
            artboard: resource.artboard
          },
          translations: {
            'ko-KR': resource.korean_text || '',
            'en-US': resource.english_text || ''
          },
          status: resource.status as 'approved' | 'draft' | 'review',
          metadata: {
            createdAt: resource.created_date || resource.created_at,
            updatedAt: resource.updated_date || resource.updated_at,
            author: resource.author || '사용자'
          }
        }))
        
      return convertedResources
    } catch (error) {
      console.error('Error searching localStorage:', error)
      return []
    }
  }

  const formatProducts = (products: string[]) => {
    return products.map(p => PRODUCTS[p as keyof typeof PRODUCTS]).join(', ')
  }

  const getTranslationText = (resource: Resource, locale: 'ko-KR' | 'en-US' | 'zh-CN' | 'ja-JP' | 'vi-VN') => {
    if (resource.translations[locale]) {
      return resource.translations[locale]
    }

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

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  if (loading) {
    return (
      <div className="flex-1 bg-background flex">
        <Card className="w-80 rounded-none border-r flex flex-col">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 border rounded">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background flex">
      {/* Left Sidebar - Search Results List */}
      <Card className="w-80 rounded-none border-r flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToHome}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              홈으로
            </Button>
          </div>
          <CardTitle className="text-lg">
            "{searchQuery}" 검색 결과
          </CardTitle>
          <Badge variant="secondary" className="w-fit">
            {searchResults.length}개의 리소스
          </Badge>
        </CardHeader>

        {/* Results List */}
        <ScrollArea className="flex-1">
          <CardContent className="p-2">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((resource) => (
                  <Card
                    key={resource.id}
                    className={`cursor-pointer transition-colors duration-200 ${
                      selectedResource?.id === resource.id
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedResource(resource)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-foreground text-sm mb-1">
                        {resource.key}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {formatProducts(resource.products)}
                        </Badge>
                        {resource.category.section1 && (
                          <Badge variant="outline" className="text-xs">
                            {resource.category.section1}
                          </Badge>
                        )}
                        {resource.category.component && (
                          <Badge variant="outline" className="text-xs">
                            {resource.category.component}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        <div dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(getTranslationText(resource, 'ko-KR'), searchQuery) 
                        }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-8 w-8 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      {/* Right Content Area - Selected Resource Details */}
      <div className="flex-1 flex flex-col">
        {selectedResource ? (
          <>
            {/* Resource Header */}
            <Card className="rounded-none border-0 border-b">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      {selectedResource.key}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {formatProducts(selectedResource.products)}
                      </Badge>
                      {selectedResource.category.section1 && (
                        <Badge variant="outline">
                          {selectedResource.category.section1}
                        </Badge>
                      )}
                      {selectedResource.category.component && (
                        <Badge variant="outline">
                          {selectedResource.category.component}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={
                      selectedResource.status === 'approved' ? 'default' :
                      selectedResource.status === 'draft' ? 'secondary' : 'destructive'
                    }
                  >
                    {selectedResource.status === 'approved' ? '승인됨' : selectedResource.status === 'draft' ? '초안' : '검토중'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Resource Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-4xl">
                {/* Translations Section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">번역</h2>
                  <div className="space-y-4">
                    {/* Korean */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">한국어</Badge>
                          <Badge variant="secondary" className="text-xs">ko-KR</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-foreground">
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(selectedResource, 'ko-KR'), searchQuery) 
                          }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* English */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">영어</Badge>
                          <Badge variant="secondary" className="text-xs">en-US</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-foreground">
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(selectedResource, 'en-US'), searchQuery) 
                          }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chinese */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">중국어</Badge>
                          <Badge variant="secondary" className="text-xs">zh-CN</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-foreground">
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(selectedResource, 'zh-CN'), searchQuery) 
                          }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Japanese */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">일본어</Badge>
                          <Badge variant="secondary" className="text-xs">ja-JP</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-foreground">
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(selectedResource, 'ja-JP'), searchQuery) 
                          }} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Vietnamese */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">베트남어</Badge>
                          <Badge variant="secondary" className="text-xs">vi-VN</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-foreground">
                          <div dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(getTranslationText(selectedResource, 'vi-VN'), searchQuery) 
                          }} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Metadata Section */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">메타데이터</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">작성자:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedResource.metadata.author}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">생성일:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedResource.metadata.createdAt}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">수정일:</span>
                        <span className="ml-2 text-foreground font-medium">{selectedResource.metadata.updatedAt}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">상태:</span>
                        <Badge 
                          variant={
                            selectedResource.status === 'approved' ? 'default' :
                            selectedResource.status === 'draft' ? 'secondary' : 'destructive'
                          }
                          className="ml-2"
                        >
                          {selectedResource.status === 'approved' ? '승인됨' : selectedResource.status === 'draft' ? '초안' : '검토중'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="text-center p-8">
              <CardContent>
                <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">리소스를 선택하세요</h3>
                <p className="text-muted-foreground">왼쪽에서 리소스를 선택하면 상세 정보를 볼 수 있습니다</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
