// PUT /api/resources/[id] - Update a specific resource
import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import fs from 'fs'
import path from 'path'

interface UpdateResourceRequest {
  category?: {
    section1?: string
    component?: string
  }
  translations?: {
    'ko-KR'?: string
    'en-US'?: string
    'zh-CN'?: string
    'ja-JP'?: string
    'vi-VN'?: string
  }
  metadata?: {
    author?: string
  }
}

export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid x-secret header' },
        { status: 401 }
      )
    }
  }

  try {
    const { id } = params
    
    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      const errorResponse = NextResponse.json(
        { error: 'Invalid resource ID' },
        { status: 400 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    // Parse and validate request body
    let body: UpdateResourceRequest
    try {
      body = await request.json() as UpdateResourceRequest
    } catch (parseError) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    // Load current resources
    const resources = loadResources()
    const resourceIndex = resources.findIndex(r => r.id === id)

    if (resourceIndex === -1) {
      const errorResponse = NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    // Update the resource
    const updatedResource = { ...resources[resourceIndex] }
    
    // Update category fields
    if (body.category) {
      if (body.category.section1 !== undefined) {
        updatedResource.category.section1 = body.category.section1
      }
      if (body.category.component !== undefined) {
        updatedResource.category.component = body.category.component
      }
    }

    // Update translations
    if (body.translations) {
      Object.keys(body.translations).forEach(locale => {
        const localeKey = locale as keyof typeof body.translations
        if (body.translations && body.translations[localeKey] !== undefined) {
          updatedResource.translations[localeKey] = body.translations[localeKey] as string
        }
      })
    }

    // Update metadata
    if (body.metadata) {
      if (body.metadata.author !== undefined) {
        updatedResource.metadata.author = body.metadata.author
      }
      // Update the updatedAt timestamp
      updatedResource.metadata.updatedAt = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }

    // Update the resource in the array
    resources[resourceIndex] = updatedResource

    // Write back to file
    try {
      const resourcesPath = path.join(process.cwd(), '../../resources.json')
      fs.writeFileSync(resourcesPath, JSON.stringify(resources, null, 2), 'utf-8')
    } catch (writeError) {
      console.error('Failed to write resources file:', writeError)
      const errorResponse = NextResponse.json(
        { error: 'Failed to save changes' },
        { status: 500 }
      )
      errorResponse.headers.set('Access-Control-Allow-Origin', '*')
      return errorResponse
    }

    // Clear cache so next load gets the updated data
    try {
      const { clearResourcesCache } = require('@/lib/loadResources')
      clearResourcesCache()
    } catch (cacheError) {
      console.warn('Failed to clear cache:', cacheError)
      // Don't fail the request for cache clearing errors
    }

    const response = NextResponse.json({
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully'
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-secret')
    
    return response

  } catch (error) {
    console.error('Update API error:', error)
    const errorResponse = NextResponse.json(
      { error: 'Failed to update resource' },
      { status: 500 }
    )
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-secret')
    
    return errorResponse
  }
}
