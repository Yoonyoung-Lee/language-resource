// POST /api/resources/insert - Insert new language resource into Supabase
// This endpoint creates a new language resource with all required fields

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
import { repo } from '@/lib/repository'
import type { LanguageResourceInsert } from '@/lib/supabase'

async function insertHandler(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.korean_text || typeof body.korean_text !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Korean text (korean_text) is required' 
        },
        { status: 400 }
      )
    }

    if (!body.author || typeof body.author !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Author is required' 
        },
        { status: 400 }
      )
    }

    // At least one product should be selected
    if (!body.knox && !body.brity && !body.is_common) {
      return NextResponse.json(
        { 
          success: false,
          error: 'At least one product (Knox, Brity, or 공통사용) must be selected' 
        },
        { status: 400 }
      )
    }

    // Prepare the resource data
    const resourceData: LanguageResourceInsert = {
      knox: body.knox || false,
      brity: body.brity || false,
      is_common: body.is_common || false,
      feature_category: body.feature_category || null,
      component: body.component || null,
      artboard: body.artboard || null,
      korean_text: body.korean_text,
      english_text: body.english_text || null,
      status: body.status || 'draft',
      author: body.author,
      notes: body.notes || null
    }

    console.log('Inserting resource:', { korean_text: resourceData.korean_text, author: resourceData.author })

    // Use repository to insert the resource
    const result = await repo.insert(resourceData)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Resource created successfully'
    })

  } catch (error) {
    console.error('Insert API error:', error)
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'A resource with this key already exists',
          details: error.message
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to insert resource',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(insertHandler))
