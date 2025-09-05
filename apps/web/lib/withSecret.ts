// Simple authentication middleware for development API routes

import { NextRequest, NextResponse } from 'next/server'

/**
 * Check if request has valid secret header for API access
 * In development: allows all requests if SECRET_PASSWORD not set
 * In production: requires x-secret header to match SECRET_PASSWORD
 */
export function checkSecret(request: NextRequest): boolean {
  const secretPassword = process.env.SECRET_PASSWORD
  
  // If no secret is configured, allow all requests (development mode)
  if (!secretPassword) {
    console.log('No SECRET_PASSWORD configured, allowing request')
    return true
  }
  
  // Check x-secret header
  const requestSecret = request.headers.get('x-secret')
  
  if (!requestSecret) {
    console.log('Missing x-secret header')
    return false
  }
  
  if (requestSecret !== secretPassword) {
    console.log('Invalid x-secret header')
    return false
  }
  
  return true
}

/**
 * Middleware wrapper that validates secret before calling handler
 */
export function withSecret<T extends any[], R>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse | Promise<R>
) {
  return async (request: NextRequest, ...args: T) => {
    // Skip secret check for OPTIONS requests
    if (request.method === 'OPTIONS') {
      return handler(request, ...args)
    }
    
    // Validate secret
    if (!checkSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid x-secret header' },
        { status: 401 }
      )
    }
    
    // Execute the handler
    return handler(request, ...args)
  }
}
