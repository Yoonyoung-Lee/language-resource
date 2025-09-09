// POST /api/resources - Create a new resource
import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { Resource } from '@/lib/types'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
import fs from 'fs'
import path from 'path'

interface CreateResourceRequest {
  key: string
  products: ('knox' | 'brity')[]
  category?: {
    section1?: string
    section2?: string
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
  metadata: {
    author: string
  }
}

async function createHandler(request: NextRequest) {
  try {
    const body = await request.json() as CreateResourceRequest

    // Validate required fields
    if (!body.key?.trim()) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    if (!body.products?.length) {
      return NextResponse.json(
        { error: 'At least one product must be selected' },
        { status: 400 }
      )
    }

    if (!body.translations?.['ko-KR']?.trim()) {
      return NextResponse.json(
        { error: 'Korean translation is required' },
        { status: 400 }
      )
    }

    if (!body.translations?.['en-US']?.trim()) {
      return NextResponse.json(
        { error: 'English translation is required' },
        { status: 400 }
      )
    }

    if (!body.metadata?.author?.trim()) {
      return NextResponse.json(
        { error: 'Author is required' },
        { status: 400 }
      )
    }

    // Load current resources
    const resources = loadResources()

    // Check if key already exists
    const existingResource = resources.find(r => r.key === body.key.trim())
    if (existingResource) {
      return NextResponse.json(
        { error: 'Resource with this key already exists' },
        { status: 409 }
      )
    }

    // Generate new ID (simple increment based on existing IDs)
    const maxId = resources.reduce((max, resource) => {
      const numId = parseInt(resource.id)
      return isNaN(numId) ? max : Math.max(max, numId)
    }, 0)
    const newId = (maxId + 1).toString()

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]! // YYYY-MM-DD format

    // Create new resource
    const newResource: Resource = {
      id: newId,
      key: body.key.trim(),
      products: body.products,
      category: {
        common: false,
        section1: body.category?.section1?.trim() || undefined,
        section2: body.category?.section2?.trim() || undefined,
        artboard: undefined,
        component: body.category?.component?.trim() || undefined
      },
      translations: {
        'ko-KR': body.translations['ko-KR'].trim(),
        'en-US': body.translations['en-US'].trim(),
        'zh-CN': body.translations['zh-CN']?.trim() || undefined,
        'ja-JP': body.translations['ja-JP']?.trim() || undefined,
        'vi-VN': body.translations['vi-VN']?.trim() || undefined
      },
      productSpecific: body.productSpecific || undefined,
      status: 'draft', // Default status for new resources
      metadata: {
        createdAt: currentDate,
        updatedAt: currentDate,
        author: body.metadata.author.trim()
      }
    }

    // Add to resources array
    resources.push(newResource)

    // Write back to file
    const resourcesPath = path.join(process.cwd(), '../../resources.json')
    fs.writeFileSync(resourcesPath, JSON.stringify(resources, null, 2), 'utf-8')

    // Clear cache so next load gets the updated data
    const { clearResourcesCache } = require('@/lib/loadResources')
    clearResourcesCache()

    return NextResponse.json({
      success: true,
      data: newResource,
      message: 'Resource created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create API error:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}

export const POST = withCors(withSecret(createHandler))
