// POST /api/audit-supabase - Audit language resources for completeness using Supabase
// This endpoint is temporarily disabled until Supabase is properly configured

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function auditHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale = 'ko-KR', product } = body

    console.log('Audit request:', { locale, product })

    // Temporarily disabled - Supabase not configured
    return NextResponse.json({
      success: false,
      error: 'Supabase audit endpoint temporarily disabled',
      message: 'Please use the local audit endpoint instead (/api/audit)',
      redirect_to: '/api/audit'
    }, { status: 501 })

  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { error: 'Failed to perform audit' },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(auditHandler))