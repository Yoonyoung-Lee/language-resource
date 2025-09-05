// GET /api/resources/search - Search language resources by query and locale

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function searchHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim()
    const locale = searchParams.get('locale') || 'ko-KR' // Default to Korean
    const product = searchParams.get('product') // Optional product filter
    const category = searchParams.get('category') // Optional category filter

    // Load resources from JSON file
    const allResources = loadResources()

    // If no query or just whitespace, return all resources (for initial load)
    if (!query || query.trim().length === 0) {
      // Filter by product if specified
      let filteredResources = allResources
      if (product) {
        filteredResources = filteredResources.filter(resource =>
          resource.products.includes(product as 'knox' | 'brity')
        )
      }

      return NextResponse.json({
        success: true,
        data: filteredResources,
        total: filteredResources.length,
        query: { query: query || '', locale, product, category }
      })
    }
    
    let filteredResources = allResources

    // Filter by product if specified
    if (product) {
      filteredResources = filteredResources.filter(resource =>
        resource.products.includes(product as 'knox' | 'brity')
      )
    }

    // Filter by category if specified
    if (category) {
      filteredResources = filteredResources.filter(resource =>
        resource.category.section1?.toLowerCase().includes(category.toLowerCase()) ||
        resource.category.section2?.toLowerCase().includes(category.toLowerCase()) ||
        resource.category.artboard?.toLowerCase().includes(category.toLowerCase()) ||
        resource.category.component?.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Filter by text content across all languages and product-specific translations
    const searchResults = filteredResources.filter(resource => {
      const queryLower = query.toLowerCase()
      
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

    return NextResponse.json({
      success: true,
      data: searchResults,
      total: searchResults.length,
      query: { query, locale, product, category }
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search resources' },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const GET = withCors(withSecret(searchHandler))