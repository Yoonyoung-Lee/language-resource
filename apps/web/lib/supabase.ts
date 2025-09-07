// Supabase client configuration
// This file creates both browser and admin clients for different use cases

import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Browser client - safe for client-side use, has row-level security
export const supabaseBrowser = createClient(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      persistSession: true, // Keep user logged in across browser sessions
      autoRefreshToken: true, // Automatically refresh expired tokens
    },
  }
)

// Admin client - server-side only, bypasses row-level security
// NEVER use this on the client side!
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false, // Admin doesn't need token refresh
      persistSession: false, // Admin doesn't need session persistence
    },
  }
)

// Database types - simplified structure based on user requirements
export interface LanguageResource {
  // Primary key (고유 식별자)
  id: number
  
  // Product assignment (체크박스)
  knox: boolean
  brity: boolean
  is_common: boolean // 공통사용
  
  // Classification fields
  feature_category?: string // 기능 카테고리: 서비스 기능 분류
  component?: string // 컴포넌트: UI 요소 분류
  artboard?: string // 아트보드: 피그마 프레임 명
  
  // Main content (핵심 텍스트)
  korean_text: string // 국문: 한국어 (메인 텍스트)
  korean_text_norm?: string // 정규화된 한국어 텍스트 (검색용)
  english_text?: string // 영문: 영어 번역
  english_text_norm?: string // 정규화된 영어 텍스트 (검색용)
  
  // Metadata
  status: 'approved' | 'draft' | 'review'
  author: string // 작성자: 리소스 작성자
  created_at: string // 최초 입력일: 최초 입력 날짜
  updated_at: string // 최종 수정일: 마지막 수정 날짜
  notes?: string // 메모나 추가 설명
  
  // Helper properties (from view)
  products_display?: string
  has_english_translation?: boolean
  created_date?: string
  updated_date?: string
}

// Insert type - for creating new resources (without id and timestamps)
export interface LanguageResourceInsert {
  knox?: boolean
  brity?: boolean
  is_common?: boolean
  feature_category?: string
  component?: string
  artboard?: string
  korean_text: string
  english_text?: string
  status?: 'approved' | 'draft' | 'review'
  author: string
  notes?: string
}

// Update type - for updating existing resources
export interface LanguageResourceUpdate {
  knox?: boolean
  brity?: boolean
  is_common?: boolean
  feature_category?: string
  component?: string
  artboard?: string
  korean_text?: string
  english_text?: string
  status?: 'approved' | 'draft' | 'review'
  author?: string
  notes?: string
}
