// POST /api/suggest-ai - Generate AI-powered suggestions using Ollama and Supabase
// This endpoint is temporarily disabled until Supabase is properly configured

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
// import { repo } from '@/lib/repository'
import { env } from '@/lib/env'

async function suggestHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, locale = 'ko-KR', product, context } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Text is required and must be a string' 
        },
        { status: 400 }
      )
    }

    console.log('Suggest request:', { text, locale, product, context })

    // Temporarily disabled - Supabase not configured
    return NextResponse.json({
      success: false,
      error: 'AI suggestion endpoint temporarily disabled',
      message: 'Please use the basic suggestion endpoint instead (/api/suggest)',
      redirect_to: '/api/suggest'
    }, { status: 501 })

  } catch (error) {
    console.error('Suggest API error:', error)
    
    // Fallback to basic suggestion without AI
    return NextResponse.json({
      success: false,
      error: 'Unable to generate AI suggestion. Please check Ollama service.',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(suggestHandler))