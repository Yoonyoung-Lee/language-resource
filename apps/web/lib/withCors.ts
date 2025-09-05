// CORS middleware for development API routes

import { NextRequest, NextResponse } from 'next/server'

/**
 * CORS configuration for local development
 * Allows requests from localhost and Figma plugin UI
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'https://www.figma.com',
  'https://figma.com'
]

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Allow all for dev (restrict in production)
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-secret',
  'Access-Control-Max-Age': '86400', // 24 hours
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsOptions(): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response)
}

/**
 * Wrapper function to add CORS support to API handlers
 */
export function withCors<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse | Promise<R>
) {
  return async (request: NextRequest, ...args: T) => {
    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return handleCorsOptions()
    }

    // Execute the handler
    const response = await handler(request, ...args)
    
    // Add CORS headers to the response
    if (response instanceof NextResponse) {
      return addCorsHeaders(response)
    }
    
    return response
  }
}
