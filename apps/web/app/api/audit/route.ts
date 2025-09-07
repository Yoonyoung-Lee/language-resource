// POST /api/audit - Audit texts against existing language resources

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { AuditRequest, AuditResponse, AuditMatch, FigmaDocumentAuditRequest, FigmaDocumentAuditResponse, FigmaAuditIssue, FigmaNode } from '@/lib/types'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function auditHandler(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a Figma document audit request
    if ('document' in body) {
      return handleFigmaDocumentAudit(body as FigmaDocumentAuditRequest)
    }

    // Handle traditional text array audit
    const textArrayBody = body as AuditRequest

    // Validate required fields
    if (!textArrayBody.texts || !Array.isArray(textArrayBody.texts) || !textArrayBody.locale) {
      return NextResponse.json(
        { error: 'Texts array and locale are required' },
        { status: 400 }
      )
    }

    // Load all resources
    const allResources = loadResources()
    
    // Filter by product if specified
    let filteredResources = allResources
    if (textArrayBody.product) {
      filteredResources = allResources.filter(resource =>
        resource.products.includes(textArrayBody.product as 'knox' | 'brity')
      )
    }

    const matched: AuditMatch[] = []
    const missing: string[] = []

    // Check each input text against resources
    for (const inputText of textArrayBody.texts) {
      const trimmedInput = inputText.trim()
      
      if (!trimmedInput) {
        continue // Skip empty inputs
      }

      let foundMatch = false

      // Check each resource for matches
      for (const resource of filteredResources) {
        const targetText = resource.translations[textArrayBody.locale]
        if (!targetText) continue

        // Check for exact match in main translations
        if (targetText.trim() === trimmedInput) {
          matched.push({
            input: trimmedInput,
            resource,
            matchedText: targetText,
            match: 'exact'
          })
          foundMatch = true
          break
        }

        // Check for exact match in product-specific translations
        if (resource.productSpecific) {
          for (const [productKey, productTranslations] of Object.entries(resource.productSpecific)) {
            const productText = productTranslations?.[textArrayBody.locale]
            if (productText && productText.trim() === trimmedInput) {
              matched.push({
                input: trimmedInput,
                resource,
                matchedText: productText,
                match: 'productSpecific'
              })
              foundMatch = true
              break
            }
          }
          if (foundMatch) break
        }
      }

      // If no exact match, try fuzzy matching
      if (!foundMatch) {
        for (const resource of filteredResources) {
          const targetText = resource.translations[textArrayBody.locale]
          if (!targetText) continue

          // Fuzzy match in main translations
          if (targetText.toLowerCase().includes(trimmedInput.toLowerCase()) ||
              trimmedInput.toLowerCase().includes(targetText.toLowerCase())) {
            matched.push({
              input: trimmedInput,
              resource,
              matchedText: targetText,
              match: 'fuzzy'
            })
            foundMatch = true
            break
          }

          // Fuzzy match in product-specific translations
          if (resource.productSpecific) {
            for (const [productKey, productTranslations] of Object.entries(resource.productSpecific)) {
              const productText = productTranslations?.[textArrayBody.locale]
              if (productText && (
                productText.toLowerCase().includes(trimmedInput.toLowerCase()) ||
                trimmedInput.toLowerCase().includes(productText.toLowerCase())
              )) {
                matched.push({
                  input: trimmedInput,
                  resource,
                  matchedText: productText,
                  match: 'fuzzy'
                })
                foundMatch = true
                break
              }
            }
            if (foundMatch) break
          }
        }
      }

      // If still no match found, add to missing
      if (!foundMatch) {
        missing.push(trimmedInput)
      }
    }

    // Calculate stats
    const stats = {
      total: textArrayBody.texts.filter(text => text.trim()).length, // Only count non-empty texts
      matched: matched.length,
      missing: missing.length
    }

    const response: AuditResponse = {
      matched,
      missing,
      stats
    }

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { error: 'Failed to audit texts' },
      { status: 500 }
    )
  }
}

// Handle Figma document audit requests
async function handleFigmaDocumentAudit(request: FigmaDocumentAuditRequest): Promise<NextResponse> {
  try {
    const { document, locale = 'ko-KR', product } = request
    
    if (!document || !document.pages) {
      return NextResponse.json(
        { error: 'Document with pages is required' },
        { status: 400 }
      )
    }

    // Load resources
    const allResources = loadResources()
    
    // Filter by product if specified
    let filteredResources = allResources
    if (product) {
      filteredResources = allResources.filter(resource =>
        resource.products.includes(product as 'knox' | 'brity')
      )
    }

    const issues: FigmaAuditIssue[] = []
    const allTexts: string[] = []
    let matchedCount = 0

    // Extract all text from document
    function extractTextFromNode(node: FigmaNode, pageName: string, path: string = ''): void {
      const currentPath = path ? `${path} > ${node.name}` : node.name
      const location = `${pageName} > ${currentPath}`

      if (node.type === 'TEXT' && node.text && node.text.trim()) {
        const text = node.text.trim()
        allTexts.push(text)

        // Check against resources
        let foundMatch = false
        let bestMatch: { resource: any; matchedText: string; matchType: string } | null = null

        // Exact match check
        for (const resource of filteredResources) {
          const targetText = resource.translations[locale]
          if (targetText && targetText.trim() === text) {
            foundMatch = true
            bestMatch = { resource, matchedText: targetText, matchType: 'exact' }
            matchedCount++
            break
          }

          // Product-specific exact match
          if (resource.productSpecific) {
            for (const [productKey, productTranslations] of Object.entries(resource.productSpecific)) {
              const productText = productTranslations?.[locale]
              if (productText && productText.trim() === text) {
                foundMatch = true
                bestMatch = { resource, matchedText: productText, matchType: 'productSpecific' }
                matchedCount++
                break
              }
            }
            if (foundMatch) break
          }
        }

        // If no exact match, check fuzzy matches for potential improvements
        if (!foundMatch) {
          for (const resource of filteredResources) {
            const targetText = resource.translations[locale]
            if (targetText && (
              targetText.toLowerCase().includes(text.toLowerCase()) ||
              text.toLowerCase().includes(targetText.toLowerCase())
            )) {
              bestMatch = { resource, matchedText: targetText, matchType: 'fuzzy' }
              break
            }

            // Product-specific fuzzy match
            if (resource.productSpecific) {
              for (const [productKey, productTranslations] of Object.entries(resource.productSpecific)) {
                const productText = productTranslations?.[locale]
                if (productText && (
                  productText.toLowerCase().includes(text.toLowerCase()) ||
                  text.toLowerCase().includes(productText.toLowerCase())
                )) {
                  bestMatch = { resource, matchedText: productText, matchType: 'productSpecific' }
                  break
                }
              }
              if (bestMatch && bestMatch.matchType === 'productSpecific') break
            }
          }
        }

        // Generate issues based on audit results
        if (!foundMatch) {
          if (bestMatch) {
            // Found similar but not exact match
            issues.push({
              title: locale === 'ko-KR' ? '유사한 리소스 발견' : 'Similar Resource Found',
              description: locale === 'ko-KR' 
                ? `"${text}"와 유사한 기존 리소스가 있습니다. 일관성을 위해 기존 표현 사용을 고려해보세요.`
                : `Found existing resource similar to "${text}". Consider using existing expression for consistency.`,
              priority: 'medium' as const,
              location,
              recommendation: locale === 'ko-KR' 
                ? `"${bestMatch.matchedText}" 사용을 권장합니다.`
                : `Recommend using "${bestMatch.matchedText}".`,
              nodeId: node.id
            })
          } else {
            // No matching resource found
            issues.push({
              title: locale === 'ko-KR' ? '리소스에 없는 텍스트' : 'Text Not in Resources',
              description: locale === 'ko-KR' 
                ? `"${text}"가 언어 리소스에 등록되어 있지 않습니다.`
                : `"${text}" is not registered in language resources.`,
              priority: 'high' as const,
              location,
              recommendation: locale === 'ko-KR' 
                ? '언어 리소스에 등록하거나 기존 표현으로 수정하세요.'
                : 'Register in language resources or use existing expression.',
              nodeId: node.id
            })
          }
        }

        // Additional quality checks
        if (text.length < 2) {
          issues.push({
            title: locale === 'ko-KR' ? '너무 짧은 텍스트' : 'Text Too Short',
            description: locale === 'ko-KR' 
              ? '텍스트가 너무 짧아 사용자 이해에 어려울 수 있습니다.'
              : 'Text might be too short for user comprehension.',
            priority: 'low' as const,
            location,
            recommendation: locale === 'ko-KR' 
              ? '더 명확한 텍스트로 수정을 고려해보세요.'
              : 'Consider using more descriptive text.',
            nodeId: node.id
          })
        }
      }

      // Process children recursively
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          extractTextFromNode(child, pageName, currentPath)
        }
      }
    }

    // Process all pages
    for (const page of document.pages) {
      for (const child of page.children) {
        extractTextFromNode(child, page.name)
      }
    }

    // Calculate stats
    const totalTexts = allTexts.length
    const coverage = totalTexts > 0 ? Math.round((matchedCount / totalTexts) * 100) : 100
    const overallScore = Math.max(0, 100 - issues.length * 5) // Each issue reduces score by 5

    const response: FigmaDocumentAuditResponse = {
      issues,
      stats: {
        issuesFound: issues.length,
        totalTexts,
        coverage
      },
      summary: {
        overallScore,
        recommendations: [
          locale === 'ko-KR' ? '언어 리소스 활용도를 높여보세요.' : 'Increase language resource utilization.',
          locale === 'ko-KR' ? '일관된 표현을 사용해보세요.' : 'Use consistent expressions.',
          locale === 'ko-KR' ? '미등록 텍스트를 리소스에 추가해보세요.' : 'Add unregistered texts to resources.'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      ...response
    })

  } catch (error) {
    console.error('Figma document audit error:', error)
    return NextResponse.json(
      { error: 'Failed to audit document' },
      { status: 500 }
    )
  }
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(auditHandler))