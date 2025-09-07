// SupabaseRepo - handles all database operations for language resources
// This class provides a clean interface to interact with the Supabase database

import { supabaseAdmin } from './supabase'
import type { LanguageResource, LanguageResourceInsert, LanguageResourceUpdate } from './supabase'
import { norm, normalizeSearchQuery } from './normalize'

export class SupabaseRepo {
  // Search for language resources using RPC function with fallback to ILIKE
  async search(params: {
    query?: string
    locale?: string
    product?: 'knox' | 'brity'
    category?: string
    limit?: number
  }): Promise<{ data: LanguageResource[]; total: number }> {
    try {
      const limit = params.limit || 100

      // If no query, return all resources with basic filtering
      if (!params.query || !params.query.trim()) {
        return this.searchWithoutQuery(params)
      }

      // Try using the RPC function first (with trigram search)
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('lr_search_trgm', {
          search_query: params.query.trim(),
          product_filter: params.product || null,
          category_filter: params.category || null,
          search_limit: limit
        })

        if (!rpcError && rpcData) {
          // RPC function succeeded, return results with similarity scores
          const enrichedData = rpcData.map((item: any) => ({
            ...item,
            created_at: item.created_at,
            updated_at: item.updated_at,
            // Add helper properties for compatibility
            products_display: this.formatProductsDisplay(item),
            has_english_translation: Boolean(item.english_text && item.english_text.trim()),
            created_date: new Date(item.created_at).toISOString().split('T')[0],
            updated_date: new Date(item.updated_at).toISOString().split('T')[0]
          }))

          return {
            data: enrichedData,
            total: enrichedData.length
          }
        }
      } catch (rpcError) {
        console.warn('RPC search failed, falling back to ILIKE search:', rpcError)
      }

      // Fallback to ILIKE search on normalized text
      return this.searchWithILike(params)
    } catch (error) {
      console.error('Repository search error:', error)
      throw error
    }
  }

  // Fallback search using ILIKE on text_norm fields
  private async searchWithILike(params: {
    query?: string
    product?: 'knox' | 'brity'
    category?: string
    limit?: number
  }): Promise<{ data: LanguageResource[]; total: number }> {
    const normalizedQuery = normalizeSearchQuery(params.query || '')
    const searchTerm = `%${normalizedQuery}%`
    
    let queryBuilder = supabaseAdmin
      .from('language_resources_view')
      .select('*', { count: 'exact' })

    // Filter by product
    if (params.product) {
      if (params.product === 'knox') {
        queryBuilder = queryBuilder.eq('knox', true)
      } else if (params.product === 'brity') {
        queryBuilder = queryBuilder.eq('brity', true)
      }
    }

    // Filter by category
    if (params.category) {
      queryBuilder = queryBuilder.or(
        `feature_category.ilike.%${params.category}%,component.ilike.%${params.category}%,artboard.ilike.%${params.category}%`
      )
    }

    // Search in normalized text fields and other fields
    if (normalizedQuery) {
      queryBuilder = queryBuilder.or(
        `korean_text_norm.ilike.${searchTerm},english_text_norm.ilike.${searchTerm},feature_category.ilike.${searchTerm},component.ilike.${searchTerm},artboard.ilike.${searchTerm},notes.ilike.${searchTerm}`
      )
    }

    // Apply limit and execute
    const limit = params.limit || 100
    queryBuilder = queryBuilder.limit(limit).order('id', { ascending: true })

    const { data, error, count } = await queryBuilder

    if (error) {
      throw new Error(`Failed to search resources with ILIKE: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0
    }
  }

  // Search without query (list all with filters)
  private async searchWithoutQuery(params: {
    product?: 'knox' | 'brity'
    category?: string
    limit?: number
  }): Promise<{ data: LanguageResource[]; total: number }> {
    let queryBuilder = supabaseAdmin
      .from('language_resources_view')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true })

    // Filter by product
    if (params.product) {
      if (params.product === 'knox') {
        queryBuilder = queryBuilder.eq('knox', true)
      } else if (params.product === 'brity') {
        queryBuilder = queryBuilder.eq('brity', true)
      }
    }

    // Filter by category
    if (params.category) {
      queryBuilder = queryBuilder.or(
        `feature_category.ilike.%${params.category}%,component.ilike.%${params.category}%,artboard.ilike.%${params.category}%`
      )
    }

    // Apply limit
    const limit = params.limit || 100
    queryBuilder = queryBuilder.limit(limit)

    const { data, error, count } = await queryBuilder

    if (error) {
      throw new Error(`Failed to list resources: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0
    }
  }

  // Helper method to format products display
  private formatProductsDisplay(resource: { knox: boolean; brity: boolean; is_common: boolean }): string {
    const products = []
    if (resource.knox) products.push('Knox')
    if (resource.brity) products.push('Brity')
    if (resource.is_common) products.push('공통')
    return products.length > 0 ? products.join(', ') : 'None'
  }

  // Insert a new language resource (with automatic normalization)
  async insert(resource: LanguageResourceInsert): Promise<LanguageResource> {
    try {
      // Prepare the data (timestamps and normalization handled by database triggers)
      const insertData = {
        ...resource,
        status: resource.status || 'draft',
        knox: resource.knox || false,
        brity: resource.brity || false,
        is_common: resource.is_common || false,
      }

      const { data, error } = await supabaseAdmin
        .from('language_resources')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        throw new Error(`Failed to insert resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Repository insert error:', error)
      throw error
    }
  }

  // Insert one resource with explicit text normalization (alternative method)
  async insertOne(params: {
    text: string
    locale?: string
    status?: 'approved' | 'draft' | 'review'
    author: string
    knox?: boolean
    brity?: boolean
    is_common?: boolean
    feature_category?: string
    component?: string
    artboard?: string
    notes?: string
  }): Promise<LanguageResource> {
    try {
      // Determine which text field to populate based on locale
      const insertData: LanguageResourceInsert = {
        status: params.status || 'approved',
        author: params.author,
        knox: params.knox || false,
        brity: params.brity || false,
        is_common: params.is_common || false,
        feature_category: params.feature_category,
        component: params.component,
        artboard: params.artboard,
        notes: params.notes
      }

      // Set text based on locale (Korean is always required)
      if (params.locale === 'en-US') {
        insertData.english_text = params.text
        // Korean text is required, so we need to handle this case
        insertData.korean_text = params.text // Fallback - in real use, Korean should be provided
      } else {
        // Default to Korean for all other locales or no locale specified
        insertData.korean_text = params.text
      }

      // Insert using the main insert method (which handles normalization via DB triggers)
      const result = await this.insert(insertData)

      console.log('Inserted resource with normalization:', {
        id: result.id,
        korean_text: result.korean_text,
        korean_text_norm: result.korean_text_norm,
        english_text: result.english_text,
        english_text_norm: result.english_text_norm
      })

      return result
    } catch (error) {
      console.error('Repository insertOne error:', error)
      throw error
    }
  }

  // Audit resources - find missing translations or inconsistencies
  async audit(params: {
    locale?: string
    product?: 'knox' | 'brity'
  }): Promise<{
    total: number
    missing_translations: Array<{
      id: number
      korean_text: string
      missing_locales: string[]
    }>
    inconsistent_products: Array<{
      id: number
      korean_text: string
      issue: string
    }>
    stats: {
      total_resources: number
      approved: number
      draft: number
      review: number
      knox_resources: number
      brity_resources: number
      common_resources: number
      english_translations: number
    }
  }> {
    try {
      // Get all resources for audit
      let queryBuilder = supabaseAdmin
        .from('language_resources')
        .select('*')

      // Filter by product if specified
      if (params.product) {
        if (params.product === 'knox') {
          queryBuilder = queryBuilder.eq('knox', true)
        } else if (params.product === 'brity') {
          queryBuilder = queryBuilder.eq('brity', true)
        }
      }

      const { data: resources, error } = await queryBuilder

      if (error) {
        throw new Error(`Failed to fetch resources for audit: ${error.message}`)
      }

      const allResources = resources || []
      
      // Analyze missing translations (simplified - only check English)
      const missingTranslations: Array<{
        id: number
        korean_text: string
        missing_locales: string[]
      }> = []

      // Analyze inconsistent products
      const inconsistentProducts: Array<{
        id: number
        korean_text: string
        issue: string
      }> = []

      allResources.forEach(resource => {
        // Check for missing English translation
        if (!resource.english_text || resource.english_text.trim() === '') {
          missingTranslations.push({
            id: resource.id,
            korean_text: resource.korean_text,
            missing_locales: ['en-US']
          })
        }

        // Check for product inconsistencies
        if (!resource.knox && !resource.brity && !resource.is_common) {
          inconsistentProducts.push({
            id: resource.id,
            korean_text: resource.korean_text,
            issue: 'No products assigned (Knox, Brity, or 공통사용)'
          })
        }

        // Check for empty Korean text (main content)
        if (!resource.korean_text || resource.korean_text.trim() === '') {
          inconsistentProducts.push({
            id: resource.id,
            korean_text: resource.korean_text || '',
            issue: 'Missing Korean text (main content)'
          })
        }

        // Check for missing author
        if (!resource.author || resource.author.trim() === '') {
          inconsistentProducts.push({
            id: resource.id,
            korean_text: resource.korean_text,
            issue: 'Missing author information'
          })
        }
      })

      // Calculate statistics
      const stats = {
        total_resources: allResources.length,
        approved: allResources.filter(r => r.status === 'approved').length,
        draft: allResources.filter(r => r.status === 'draft').length,
        review: allResources.filter(r => r.status === 'review').length,
        knox_resources: allResources.filter(r => r.knox).length,
        brity_resources: allResources.filter(r => r.brity).length,
        common_resources: allResources.filter(r => r.is_common).length,
        english_translations: allResources.filter(r => r.english_text && r.english_text.trim() !== '').length,
      }

      return {
        total: allResources.length,
        missing_translations: missingTranslations,
        inconsistent_products: inconsistentProducts,
        stats
      }
    } catch (error) {
      console.error('Repository audit error:', error)
      throw error
    }
  }

  // Get a single resource by ID
  async getById(id: number): Promise<LanguageResource | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('language_resources_view')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Resource not found
        }
        throw new Error(`Failed to get resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Repository getById error:', error)
      throw error
    }
  }

  // Update a resource
  async update(id: number, updates: LanguageResourceUpdate): Promise<LanguageResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('language_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Repository update error:', error)
      throw error
    }
  }

  // Delete a resource
  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('language_resources')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete resource: ${error.message}`)
      }
    } catch (error) {
      console.error('Repository delete error:', error)
      throw error
    }
  }
}

// Export a singleton instance for use across the app
export const repo = new SupabaseRepo()
