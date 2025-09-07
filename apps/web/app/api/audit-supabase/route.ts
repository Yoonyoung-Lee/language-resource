// POST /api/audit-supabase - Audit language resources for completeness using Supabase
// This endpoint analyzes all resources to find missing translations and inconsistencies

import { NextRequest, NextResponse } from 'next/server'
import { withCors } from '@/lib/withCors'
import { withSecret } from '@/lib/withSecret'
import { repo } from '@/lib/repository'

async function auditHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { locale = 'ko-KR', product } = body

    console.log('Audit request:', { locale, product })

    // Use repository to perform comprehensive audit
    const auditResult = await repo.audit({
      locale,
      product: product as 'knox' | 'brity' | undefined
    })

    // Calculate overall health score
    const healthScore = calculateHealthScore(auditResult)

    // Generate recommendations based on audit results
    const recommendations = generateRecommendations(auditResult)

    const auditReport = {
      success: true,
      timestamp: new Date().toISOString(),
      health_score: healthScore,
      summary: {
        total_resources: auditResult.total,
        missing_translations_count: auditResult.missing_translations.length,
        inconsistent_products_count: auditResult.inconsistent_products.length,
      },
      stats: auditResult.stats,
      issues: {
        missing_translations: auditResult.missing_translations,
        inconsistent_products: auditResult.inconsistent_products,
      },
      recommendations
    }

    return NextResponse.json(auditReport)

  } catch (error) {
    console.error('Audit API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to audit resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate overall health score based on audit results (0-100)
function calculateHealthScore(auditResult: any): number {
  if (auditResult.total === 0) return 100

  const missingTranslationPenalty = (auditResult.missing_translations.length / auditResult.total) * 50
  const inconsistentProductPenalty = (auditResult.inconsistent_products.length / auditResult.total) * 30
  const draftPenalty = (auditResult.stats.draft / auditResult.total) * 10
  const reviewPenalty = (auditResult.stats.review / auditResult.total) * 10

  const score = Math.max(0, 100 - missingTranslationPenalty - inconsistentProductPenalty - draftPenalty - reviewPenalty)
  return Math.round(score)
}

// Generate recommendations based on audit findings
function generateRecommendations(auditResult: any): string[] {
  const recommendations: string[] = []

  if (auditResult.missing_translations.length > 0) {
    recommendations.push(`Complete missing translations for ${auditResult.missing_translations.length} resources`)
  }

  if (auditResult.inconsistent_products.length > 0) {
    recommendations.push(`Fix product assignments for ${auditResult.inconsistent_products.length} resources`)
  }

  if (auditResult.stats.draft > 0) {
    recommendations.push(`Review and approve ${auditResult.stats.draft} draft resources`)
  }

  if (auditResult.stats.review > 0) {
    recommendations.push(`Complete review process for ${auditResult.stats.review} resources`)
  }

  if (recommendations.length === 0) {
    recommendations.push('All resources are in good shape! 🎉')
  }

  return recommendations
}

// Apply CORS and secret authentication middleware
export const POST = withCors(withSecret(auditHandler))
