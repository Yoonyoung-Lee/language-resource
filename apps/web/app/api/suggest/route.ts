// POST /api/suggest - Get text improvement suggestions (mock implementation)

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { SuggestRequest, SuggestResponse, FigmaSelectionSuggestRequest, FigmaSelectionSuggestResponse, FigmaSuggestion, FigmaNode } from '@/lib/types'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function suggestHandler(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a Figma selection request
    if ('selection' in body) {
      return handleFigmaSelectionSuggest(body as FigmaSelectionSuggestRequest)
    }

    // Handle traditional single text suggestion
    const singleTextBody = body as SuggestRequest
    
    // Validate required fields
    if (!singleTextBody.text || !singleTextBody.locale) {
      return NextResponse.json(
        { error: 'Text and locale are required' },
        { status: 400 }
      )
    }

    // Load resources to check for existing similar texts
    const allResources = loadResources()
    
    // Check if similar text exists in resources
    const similarResource = allResources.find(resource => {
      const targetText = resource.translations[singleTextBody.locale]
      return targetText && (
        targetText.toLowerCase().includes(singleTextBody.text.toLowerCase()) ||
        singleTextBody.text.toLowerCase().includes(targetText.toLowerCase())
      )
    })

    // Generate suggestions based on locale and product context
    let suggestion: string
    let rationale: string

    if (singleTextBody.locale === 'ko-KR') {
      // Korean text improvement
      if (similarResource) {
        suggestion = similarResource.translations[singleTextBody.locale] || singleTextBody.text
        rationale = `기존 리소스에서 유사한 표현을 찾았습니다: "${similarResource.key}"`
        
        // Add product-specific context if available
        if (singleTextBody.product && similarResource.productSpecific) {
          const productKey = singleTextBody.product === 'knox' ? 'knoxTeams' : 'brityMessenger'
          const productText = similarResource.productSpecific[productKey]?.[singleTextBody.locale]
          if (productText) {
            suggestion = productText
            rationale += ` ${singleTextBody.product === 'knox' ? 'Knox Teams' : 'Brity Messenger'} 전용 표현으로 개선했습니다.`
          }
        }
      } else {
        suggestion = singleTextBody.text.trim() + ' (개선 제안)'
        rationale = '더 명확하고 일관된 표현으로 개선했습니다.'
      }
      
      // Apply style guide if provided
      if (singleTextBody.styleGuide) {
        rationale += ` 스타일 가이드 "${singleTextBody.styleGuide}"를 적용했습니다.`
      }

      // Add product-specific guidance
      if (singleTextBody.product) {
        const productName = singleTextBody.product === 'knox' ? 'Knox' : 'Brity'
        rationale += ` ${productName} 제품의 톤앤매너를 고려했습니다.`
      }

    } else if (singleTextBody.locale === 'en-US') {
      // English text improvement
      if (similarResource) {
        suggestion = similarResource.translations[singleTextBody.locale] || singleTextBody.text
        rationale = `Found similar expression in existing resources: "${similarResource.key}"`
        
        // Add product-specific context if available
        if (singleTextBody.product && similarResource.productSpecific) {
          const productKey = singleTextBody.product === 'knox' ? 'knoxTeams' : 'brityMessenger'
          const productText = similarResource.productSpecific[productKey]?.[singleTextBody.locale]
          if (productText) {
            suggestion = productText
            rationale += ` Improved with ${singleTextBody.product === 'knox' ? 'Knox Teams' : 'Brity Messenger'} specific expression.`
          }
        }
      } else {
        suggestion = singleTextBody.text.trim() + ' (suggested)'
        rationale = 'Improved for clarity and consistency.'
      }
      
      // Apply style guide if provided
      if (singleTextBody.styleGuide) {
        rationale += ` Applied style guide: "${singleTextBody.styleGuide}".`
      }

      // Add product-specific guidance
      if (singleTextBody.product) {
        const productName = singleTextBody.product === 'knox' ? 'Knox' : 'Brity'
        rationale += ` Considered ${productName} product tone and manner.`
      }

    } else {
      // Other languages (Chinese, Japanese, Vietnamese)
      if (similarResource) {
        suggestion = similarResource.translations[singleTextBody.locale] || singleTextBody.text
        rationale = `Found similar expression in existing resources: "${similarResource.key}"`
      } else {
        suggestion = singleTextBody.text.trim() + ' (建议)' // Chinese for "suggestion"
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

// Handle Figma selection suggestion requests
async function handleFigmaSelectionSuggest(request: FigmaSelectionSuggestRequest): Promise<NextResponse> {
  try {
    const { selection, locale = 'ko-KR', product } = request
    
    if (!selection || !Array.isArray(selection)) {
      return NextResponse.json(
        { error: 'Selection array is required' },
        { status: 400 }
      )
    }

    // Load resources
    const allResources = loadResources()

    // Extract text nodes from selection and generate suggestions
    const suggestions: FigmaSuggestion[] = []

    function processNode(node: FigmaNode, path: string = '') {
      const currentPath = path ? `${path} > ${node.name}` : node.name

      // Process text nodes
      if (node.type === 'TEXT' && node.text && node.text.trim()) {
        const text = node.text.trim()
        
        // Find similar resources
        const similarResource = allResources.find(resource => {
          const targetText = resource.translations[locale]
          return targetText && (
            targetText.toLowerCase().includes(text.toLowerCase()) ||
            text.toLowerCase().includes(targetText.toLowerCase())
          )
        })

        let suggestion: FigmaSuggestion | null = null

        if (similarResource) {
          // Found matching resource
          let improvedText = similarResource.translations[locale] || text
          
          // Check for product-specific version
          if (product && similarResource.productSpecific) {
            const productKey = product === 'knox' ? 'knoxTeams' : 'brityMessenger'
            const productText = similarResource.productSpecific[productKey]?.[locale]
            if (productText) {
              improvedText = productText
            }
          }

          if (improvedText !== text) {
            suggestion = {
              id: `${node.id}-suggest`,
              nodeId: node.id,
              title: locale === 'ko-KR' ? '기존 리소스 활용' : 'Use Existing Resource',
              description: locale === 'ko-KR' 
                ? `기존 언어 리소스에서 더 적합한 표현을 찾았습니다.`
                : `Found more appropriate expression in existing language resources.`,
              priority: 'high' as const,
              before: text,
              after: improvedText
            }
          }
        } else if (text.length < 3) {
          // Very short text might need improvement
          suggestion = {
            id: `${node.id}-short`,
            nodeId: node.id,
            title: locale === 'ko-KR' ? '짧은 텍스트' : 'Short Text',
            description: locale === 'ko-KR' 
              ? `텍스트가 너무 짧아 사용자가 의미를 파악하기 어려울 수 있습니다.`
              : `Text might be too short for users to understand its meaning.`,
            priority: 'medium' as const,
            before: text,
            after: undefined
          }
        } else if (!/^[가-힣\u0020-\u007E\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(text)) {
          // Mixed character sets or special characters
          suggestion = {
            id: `${node.id}-mixed`,
            nodeId: node.id,
            title: locale === 'ko-KR' ? '문자 일관성' : 'Character Consistency',
            description: locale === 'ko-KR' 
              ? `혼재된 문자나 특수문자로 인해 일관성이 부족할 수 있습니다.`
              : `Mixed characters or special characters may affect consistency.`,
            priority: 'low' as const,
            before: text,
            after: undefined
          }
        }

        if (suggestion) {
          suggestions.push(suggestion)
        }
      }

      // Process child nodes recursively
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          processNode(child, currentPath)
        }
      }
    }

    // Process all nodes in selection
    for (const node of selection) {
      processNode(node)
    }

    const response: FigmaSelectionSuggestResponse = {
      suggestions
    }

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('Figma selection suggest error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions for selection' },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(suggestHandler))