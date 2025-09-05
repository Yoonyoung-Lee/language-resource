// POST /api/audit - Audit texts against existing language resources

import { NextRequest, NextResponse } from 'next/server'
import { loadResources } from '@/lib/loadResources'
import { AuditRequest, AuditResponse, AuditMatch } from '@/lib/types'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'

async function auditHandler(request: NextRequest) {
  try {
    const body = await request.json() as AuditRequest

    // Validate required fields
    if (!body.texts || !Array.isArray(body.texts) || !body.locale) {
      return NextResponse.json(
        { error: 'Texts array and locale are required' },
        { status: 400 }
      )
    }

    // Load all resources
    const allResources = loadResources()
    
    // Filter by product if specified
    let filteredResources = allResources
    if (body.product) {
      filteredResources = allResources.filter(resource =>
        resource.products.includes(body.product as 'knox' | 'brity')
      )
    }

    const matched: AuditMatch[] = []
    const missing: string[] = []

    // Check each input text against resources
    for (const inputText of body.texts) {
      const trimmedInput = inputText.trim()
      
      if (!trimmedInput) {
        continue // Skip empty inputs
      }

      let foundMatch = false

      // Check each resource for matches
      for (const resource of filteredResources) {
        const targetText = resource.translations[body.locale]
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
            const productText = productTranslations?.[body.locale]
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
          const targetText = resource.translations[body.locale]
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
              const productText = productTranslations?.[body.locale]
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
      total: body.texts.filter(text => text.trim()).length, // Only count non-empty texts
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

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(auditHandler))