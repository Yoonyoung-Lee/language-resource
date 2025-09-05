// Type definitions for language resource management

export interface Resource {
  id: string
  key: string
  products: ('knox' | 'brity')[] // Which products use this resource
  category: {
    common?: boolean // 공통 리소스인지
    section1?: string // 구분1
    section2?: string // 구분2  
    artboard?: string // 아트보드
    component?: string // 컴포넌트
  }
  translations: {
    'ko-KR': string // 국문
    'en-US': string // 영문
    'zh-CN'?: string // 중문
    'ja-JP'?: string // 일문
    'vi-VN'?: string // 베트남어
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

// Language codes mapping
export const LANGUAGES = {
  'ko-KR': '국문',
  'en-US': '영문', 
  'zh-CN': '중문',
  'ja-JP': '일문',
  'vi-VN': '베트남어'
} as const

export const PRODUCTS = {
  'knox': 'Knox',
  'brity': 'Brity'
} as const

// API request/response types
export interface SearchResourcesRequest {
  query?: string
  locale?: keyof typeof LANGUAGES
  product?: keyof typeof PRODUCTS
  category?: string
}

export interface SuggestRequest {
  text: string
  locale: keyof typeof LANGUAGES
  product?: keyof typeof PRODUCTS
  styleGuide?: string
}

export interface SuggestResponse {
  suggestion: string
  rationale: string
}

export interface AuditRequest {
  texts: string[]
  locale: keyof typeof LANGUAGES
  product?: keyof typeof PRODUCTS
}

export interface AuditMatch {
  input: string
  resource: Resource
  matchedText: string
  match: 'exact' | 'fuzzy' | 'productSpecific'
}

export interface AuditResponse {
  matched: AuditMatch[]
  missing: string[]
  stats: {
    total: number
    matched: number
    missing: number
  }
}
