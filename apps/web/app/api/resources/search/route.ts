// GET /api/resources/search - Search language resources using Supabase
// This endpoint allows searching through language resources with various filters

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { LanguageResource } from '@/lib/supabase'

async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() || undefined
    const locale = searchParams.get('locale') || 'ko-KR' // Default to Korean
    const product = searchParams.get('product') as 'knox' | 'brity' | undefined
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('Search request:', { query, locale, product, category, limit })

    // Build Supabase query
    let supabaseQuery = supabaseAdmin
      .from('language_resources')
      .select('*')

    // Filter by product
    if (product === 'knox') {
      supabaseQuery = supabaseQuery.eq('knox', true)
    } else if (product === 'brity') {
      supabaseQuery = supabaseQuery.eq('brity', true)
    }

    // Filter by category
    if (category) {
      supabaseQuery = supabaseQuery.or(`feature_category.ilike.%${category}%,component.ilike.%${category}%`)
    }

    // Search by query text using trigram similarity
    if (query) {
      if (locale === 'ko-KR') {
        // Search in Korean text
        supabaseQuery = supabaseQuery.or(
          `korean_text.ilike.%${query}%,korean_text_norm.ilike.%${query}%,feature_category.ilike.%${query}%,component.ilike.%${query}%`
        )
      } else if (locale === 'en-US') {
        // Search in English text
        supabaseQuery = supabaseQuery.or(
          `english_text.ilike.%${query}%,english_text_norm.ilike.%${query}%,feature_category.ilike.%${query}%,component.ilike.%${query}%`
        )
      } else {
        // Search in both languages
        supabaseQuery = supabaseQuery.or(
          `korean_text.ilike.%${query}%,english_text.ilike.%${query}%,feature_category.ilike.%${query}%,component.ilike.%${query}%`
        )
      }
    }

    // Apply limit and order
    supabaseQuery = supabaseQuery
      .order('updated_at', { ascending: false })
      .limit(limit)

    // Execute query
    const { data, error, count } = await supabaseQuery

    if (error) {
      console.error('Supabase query error:', error)
      throw new Error(`Database query failed: ${error.message}`)
    }

    // Convert to Resource format for compatibility
    const resources = (data || []).map((item: LanguageResource) => ({
      id: item.id.toString(),
      key: `${item.feature_category || 'general'}.${item.component || 'default'}`,
      products: [
        ...(item.knox ? ['knox'] : []),
        ...(item.brity ? ['brity'] : [])
      ],
      category: {
        common: item.is_common,
        section1: item.feature_category,
        component: item.component,
        artboard: item.artboard
      },
      translations: {
        'ko-KR': item.korean_text,
        'en-US': item.english_text || '',
        'zh-CN': undefined,
        'ja-JP': undefined,
        'vi-VN': undefined
      },
      status: item.status,
      metadata: {
        createdAt: item.created_at.split('T')[0],
        updatedAt: item.updated_at.split('T')[0],
        author: item.author
      }
    }))

    return NextResponse.json({
      success: true,
      data: resources,
      total: count || resources.length,
      query: { query: query || '', locale, product, category, limit }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-secret',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // Check secret authentication
  const secretPassword = process.env.SECRET_PASSWORD
  if (secretPassword) {
    const requestSecret = request.headers.get('x-secret')
    if (!requestSecret || requestSecret !== secretPassword) {
      const errorResponse = NextResponse.json(
        { error: 'Unauthorized: Missing or invalid x-secret header' },
        { status: 401 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }
  }

  const response = await searchHandler(request)
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-secret')
  
  return response
}