// POST /api/suggest-ai - Generate AI-powered suggestions using Ollama and Supabase
// This endpoint uses llama3.2:1b model to provide intelligent text improvement suggestions

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
import { repo } from '@/lib/repository'
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

    // First, check if the text already exists in our resources
    const searchResult = await repo.search({
      query: text.trim(),
      locale,
      product: product as 'knox' | 'brity' | undefined,
      limit: 5
    })

    // If we find exact matches, suggest using existing resources
    const exactMatches = searchResult.data.filter(resource => {
      if (locale === 'ko-KR') return resource.korean_text?.toLowerCase() === text.toLowerCase()
      if (locale === 'en-US') return resource.english_text?.toLowerCase() === text.toLowerCase()
      return resource.korean_text?.toLowerCase() === text.toLowerCase()
    })

    if (exactMatches.length > 0) {
      return NextResponse.json({
        success: true,
        suggestion: text,
        rationale: 'This text already exists in the language resources and is properly registered.',
        confidence: 0.95,
        existing_resource: exactMatches[0],
        alternatives: []
      })
    }

    // If we find similar matches, suggest using those instead
    const similarMatches = searchResult.data.slice(0, 3)
    
    // Prepare context for AI suggestion
    const aiContext = {
      original_text: text,
      locale,
      product,
      context: context || 'UI text',
      similar_resources: similarMatches.map(resource => ({
        id: resource.id,
        korean_text: resource.korean_text,
        english_text: resource.english_text,
        translation: getTranslationByLocale(resource, locale),
        category: {
          feature_category: resource.feature_category,
          component: resource.component,
          artboard: resource.artboard
        }
      }))
    }

    // Get AI-powered suggestion from Ollama
    const aiSuggestion = await getOllamaSuggestion(aiContext)

    // Combine AI suggestion with existing resource recommendations
    const alternatives = similarMatches.map(resource => ({
      text: getTranslationByLocale(resource, locale) || resource.korean_text,
      rationale: `Existing resource: ID ${resource.id} (${resource.feature_category || 'No category'})`,
      confidence: 0.7
    }))

    return NextResponse.json({
      success: true,
      suggestion: aiSuggestion.suggestion || text,
      rationale: aiSuggestion.rationale || 'AI-generated improvement suggestion',
      confidence: aiSuggestion.confidence || 0.6,
      alternatives,
      ai_powered: true
    })

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

// Get suggestion from Ollama AI model
async function getOllamaSuggestion(context: any): Promise<{
  suggestion: string
  rationale: string
  confidence: number
}> {
  try {
    const prompt = `You are a UX writing expert for ${context.product || 'software'} applications. 

Original text: "${context.original_text}"
Language: ${context.locale}
Context: ${context.context}

${context.similar_resources.length > 0 ? `
Similar existing resources:
${context.similar_resources.map((r: any, i: number) => `${i + 1}. ${r.key}: "${r.translation}"`).join('\n')}
` : ''}

Please provide:
1. An improved version of the text that is clear, concise, and user-friendly
2. A brief rationale for your suggestion
3. Consider consistency with existing resources if provided

Respond in JSON format:
{
  "suggestion": "improved text here",
  "rationale": "explanation of improvements",
  "confidence": 0.8
}`

    const response = await fetch(`${env.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:1b',
        prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent suggestions
          top_p: 0.9,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Try to parse JSON from the response
    try {
      const aiResponse = JSON.parse(data.response)
      return {
        suggestion: aiResponse.suggestion || context.original_text,
        rationale: aiResponse.rationale || 'AI-generated suggestion',
        confidence: aiResponse.confidence || 0.6
      }
    } catch (parseError) {
      // If JSON parsing fails, use the raw response
      return {
        suggestion: data.response || context.original_text,
        rationale: 'AI suggestion (raw response)',
        confidence: 0.5
      }
    }

  } catch (error) {
    console.error('Ollama API error:', error)
    
    // Return fallback suggestion
    return {
      suggestion: context.original_text,
      rationale: 'Unable to connect to AI service. Original text returned.',
      confidence: 0.3
    }
  }
}

// Helper function to get translation by locale (simplified)
function getTranslationByLocale(resource: any, locale: string): string | null {
  switch (locale) {
    case 'ko-KR': return resource.korean_text
    case 'en-US': return resource.english_text
    default: return resource.korean_text
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(suggestHandler))
