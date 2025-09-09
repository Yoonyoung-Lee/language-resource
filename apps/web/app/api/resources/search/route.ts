// GET /api/resources/search - Search language resources using local JSON data
// This endpoint allows searching through language resources with various filters

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { Resource } from '@/lib/types'

async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() || undefined
    const locale = searchParams.get('locale') || 'ko-KR' // Default to Korean
    const product = searchParams.get('product') as 'knox' | 'brity' | undefined
    const category = searchParams.get('category') || undefined
    const limit = parseInt(searchParams.get('limit') || '100')

    console.log('Search request:', { query, locale, product, category, limit })

    // Load resources from local JSON file
    const allResources = loadResources()
    
    // Filter resources based on search criteria
    let filteredResources = allResources

    // Filter by product
    if (product) {
      filteredResources = filteredResources.filter(resource => 
        resource.products.includes(product)
      )
    }

    // Filter by category
    if (category) {
      filteredResources = filteredResources.filter(resource => 
        resource.category.section1?.includes(category) ||
        resource.category.component?.includes(category)
      )
    }

    // Search by query text
    if (query) {
      const searchQuery = query.toLowerCase()
      filteredResources = filteredResources.filter(resource => {
        // Search in key
        if (resource.key.toLowerCase().includes(searchQuery)) return true
        
        // Search in translations
        const translations = resource.translations
        if (translations['ko-KR']?.toLowerCase().includes(searchQuery)) return true
        if (translations['en-US']?.toLowerCase().includes(searchQuery)) return true
        if (translations['zh-CN']?.toLowerCase().includes(searchQuery)) return true
        if (translations['ja-JP']?.toLowerCase().includes(searchQuery)) return true
        if (translations['vi-VN']?.toLowerCase().includes(searchQuery)) return true
        
        // Search in category
        if (resource.category.section1?.toLowerCase().includes(searchQuery)) return true
        if (resource.category.component?.toLowerCase().includes(searchQuery)) return true
        
        return false
      })
    }

    // Apply limit
    const resources = filteredResources.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: resources,
      total: filteredResources.length,
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