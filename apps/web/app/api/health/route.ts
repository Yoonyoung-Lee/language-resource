// GET /api/health - Health check endpoint to verify server and API connectivity
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'running',
      checks: {
        database: await checkDatabase(),
        ollama: await checkOllama(),
        environment: checkEnvironment()
      }
    }

    return NextResponse.json(healthStatus)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Check database connectivity (Supabase)
async function checkDatabase(): Promise<{ status: string; message?: string }> {
  try {
    // Import and use the repository if available
    const { repo } = await import('@/lib/repository')
    
    // Try a simple search to test database connection
    const testSearch = await repo.search({
      query: 'test',
      limit: 1
    })
    
    return { 
      status: 'connected',
      message: `Database operational, ${testSearch.data.length} records accessible`
    }
  } catch (error) {
    return { 
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

// Check Ollama AI service connectivity
async function checkOllama(): Promise<{ status: string; message?: string }> {
  try {
    const { env } = await import('@/lib/env')
    
    if (!env.ollamaUrl) {
      return { status: 'not_configured', message: 'Ollama URL not set' }
    }

    const response = await fetch(`${env.ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      return { 
        status: 'connected',
        message: `Ollama running, ${data.models?.length || 0} models available`
      }
    } else {
      return { 
        status: 'error',
        message: `Ollama responded with status ${response.status}`
      }
    }
  } catch (error) {
    return { 
      status: 'error',
      message: error instanceof Error ? error.message : 'Ollama connection failed'
    }
  }
}

// Check environment variables and configuration
function checkEnvironment() {
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  return {
    status: missing.length === 0 ? 'configured' : 'incomplete',
    missing: missing,
    message: missing.length === 0 
      ? 'All required environment variables are set'
      : `Missing environment variables: ${missing.join(', ')}`
  }
}
