// POST /api/suggest - Get text improvement suggestions (mock implementation)

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { SuggestRequest, SuggestResponse } from '@/lib/types'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function suggestHandler(request: NextRequest) {
  try {
    const body = await request.json() as SuggestRequest

    // Validate required fields
    if (!body.text || !body.locale) {
      return NextResponse.json(
        { error: 'Text and locale are required' },
        { status: 400 }
      )
    }

    // Load resources to check for existing similar texts
    const allResources = loadResources()
    
    // Check if similar text exists in resources
    const similarResource = allResources.find(resource => {
      const targetText = resource.translations[body.locale]
      return targetText && (
        targetText.toLowerCase().includes(body.text.toLowerCase()) ||
        body.text.toLowerCase().includes(targetText.toLowerCase())
      )
    })

    // Generate suggestions based on locale and product context
    let suggestion: string
    let rationale: string

    if (body.locale === 'ko-KR') {
      // Korean text improvement
      if (similarResource) {
        suggestion = similarResource.translations[body.locale] || body.text
        rationale = `기존 리소스에서 유사한 표현을 찾았습니다: "${similarResource.key}"`
        
        // Add product-specific context if available
        if (body.product && similarResource.productSpecific) {
          const productKey = body.product === 'knox' ? 'knoxTeams' : 'brityMessenger'
          const productText = similarResource.productSpecific[productKey]?.[body.locale]
          if (productText) {
            suggestion = productText
            rationale += ` ${body.product === 'knox' ? 'Knox Teams' : 'Brity Messenger'} 전용 표현으로 개선했습니다.`
          }
        }
      } else {
        suggestion = body.text.trim() + ' (개선 제안)'
        rationale = '더 명확하고 일관된 표현으로 개선했습니다.'
      }
      
      // Apply style guide if provided
      if (body.styleGuide) {
        rationale += ` 스타일 가이드 "${body.styleGuide}"를 적용했습니다.`
      }

      // Add product-specific guidance
      if (body.product) {
        const productName = body.product === 'knox' ? 'Knox' : 'Brity'
        rationale += ` ${productName} 제품의 톤앤매너를 고려했습니다.`
      }

    } else if (body.locale === 'en-US') {
      // English text improvement
      if (similarResource) {
        suggestion = similarResource.translations[body.locale] || body.text
        rationale = `Found similar expression in existing resources: "${similarResource.key}"`
        
        // Add product-specific context if available
        if (body.product && similarResource.productSpecific) {
          const productKey = body.product === 'knox' ? 'knoxTeams' : 'brityMessenger'
          const productText = similarResource.productSpecific[productKey]?.[body.locale]
          if (productText) {
            suggestion = productText
            rationale += ` Improved with ${body.product === 'knox' ? 'Knox Teams' : 'Brity Messenger'} specific expression.`
          }
        }
      } else {
        suggestion = body.text.trim() + ' (suggested)'
        rationale = 'Improved for clarity and consistency.'
      }
      
      // Apply style guide if provided
      if (body.styleGuide) {
        rationale += ` Applied style guide: "${body.styleGuide}".`
      }

      // Add product-specific guidance
      if (body.product) {
        const productName = body.product === 'knox' ? 'Knox' : 'Brity'
        rationale += ` Considered ${productName} product tone and manner.`
      }

    } else {
      // Other languages (Chinese, Japanese, Vietnamese)
      if (similarResource) {
        suggestion = similarResource.translations[body.locale] || body.text
        rationale = `Found similar expression in existing resources: "${similarResource.key}"`
      } else {
        suggestion = body.text.trim() + ' (建议)' // Chinese for "suggestion"
        rationale = 'Improved for clarity and consistency.'
      }
    }

    const response: SuggestResponse = {
      suggestion,
      rationale
    }

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('Suggest API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(suggestHandler))