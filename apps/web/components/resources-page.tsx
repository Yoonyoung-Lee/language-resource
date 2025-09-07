'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { ScrollArea } from '@workspace/ui/components/scroll-area'

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

export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])

  // Load all resources on component mount
  useEffect(() => {
    loadResources()
  }, [])

  // Filter resources when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredResources(resources)
    } else {
      const filtered = resources.filter(resource => {
        const queryLower = searchQuery.toLowerCase()
        
        // Check key match
        const keyMatch = resource.key.toLowerCase().includes(queryLower)
        
        // Check all language translations
        const translationMatch = Object.values(resource.translations).some(text => 
          text && text.toLowerCase().includes(queryLower)
        )
        
        // Check product-specific translations
        let productSpecificMatch = false
        if (resource.productSpecific) {
          Object.values(resource.productSpecific).forEach(productTranslations => {
            if (productTranslations) {
              Object.values(productTranslations).forEach(text => {
                if (text && text.toLowerCase().includes(queryLower)) {
                  productSpecificMatch = true
                }
              })
            }
          })
        }

        return keyMatch || translationMatch || productSpecificMatch
      })
      setFilteredResources(filtered)
    }
  }, [searchQuery, resources])

  const loadResources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/resources/search', {
        headers: {
          'x-secret': API_SECRET
        }
      })

      const result = await response.json()
      if (result.success) {
        setResources(result.data)
        setFilteredResources(result.data)
      } else {
        console.error('Failed to load resources:', result.error)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatProducts = (products: string[]) => {
    return products.map(p => PRODUCTS[p as keyof typeof PRODUCTS]).join(', ')
  }

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

  if (loading) {
    return (
      <div className="flex-1 bg-background">
        <div className="border-b p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">언어리소스 모음</h1>
          <Badge variant="secondary">
            총 {filteredResources.length}개의 리소스
          </Badge>
        </div>
        
        {/* Search Box */}
        <div className="max-w-md relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="리소스 검색..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Resources List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredResources.length > 0 ? (
            <div className="space-y-4">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{resource.key}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default" className="text-xs">
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
                      </div>
                      <Badge 
                        variant={
                          resource.status === 'approved' ? 'default' :
                          resource.status === 'draft' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {resource.status === 'approved' ? '승인됨' : resource.status === 'draft' ? '초안' : '검토중'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Translations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">한국어</div>
                        <div className="text-sm text-foreground">{getTranslationText(resource, 'ko-KR')}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">영어</div>
                        <div className="text-sm text-foreground">{getTranslationText(resource, 'en-US')}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">중국어</div>
                        <div className="text-sm text-foreground">{getTranslationText(resource, 'zh-CN')}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">일본어</div>
                        <div className="text-sm text-foreground">{getTranslationText(resource, 'ja-JP')}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">베트남어</div>
                        <div className="text-sm text-foreground">{getTranslationText(resource, 'vi-VN')}</div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex justify-between items-center pt-3 border-t">
                      <div className="text-xs text-muted-foreground">
                        작성자: {resource.metadata.author} | 
                        생성: {resource.metadata.createdAt} | 
                        수정: {resource.metadata.updatedAt}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchQuery ? '검색 결과가 없습니다' : '리소스가 없습니다'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? '다른 검색어를 시도해보세요' : '새로운 리소스를 추가해보세요'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
