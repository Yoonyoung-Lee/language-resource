// GET /api/resources/search - Search language resources using Supabase
// This endpoint allows searching through language resources with various filters

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
import { repo } from '@/lib/repository'

async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() || undefined
    const locale = searchParams.get('locale') || 'ko-KR' // Default to Korean
    const product = searchParams.get('product') as 'knox' | 'brity' | undefined
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('Search request:', { query, locale, product, category, limit })

    // Use repository to search resources in Supabase
    const result = await repo.search({
      query,
      locale,
      product,
      category,
      limit
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
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

// Apply CORS and secret authentication middleware
export const GET = withCors(withSecret(searchHandler))