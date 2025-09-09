// Environment variables configuration
// This file centralizes all environment variable access

export const env = {
  // Supabase configuration - get these from your Supabase project dashboard
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  },
  
  // API security - used to protect development endpoints
  secretPassword: process.env.SECRET_PASSWORD || 'devpass',
  
  // Ollama configuration - AI model endpoint for suggestions
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
} as const

// Validation helper - checks if required environment variables are set
export function validateEnv() {
  const missing = []
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '))
    console.warn('Please create .env.local file with the required variables')
  }
  
  return missing.length === 0
}
