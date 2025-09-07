// Example usage of the enhanced repository with text normalization
// This file demonstrates how to use insertOne() and search() methods

import { repo } from './repository'

// Example: Insert a resource with automatic normalization
export async function insertExampleResource() {
  try {
    const result = await repo.insertOne({
      text: '로그인 해주세요!',  // Text with punctuation and spacing
      locale: 'ko-KR',
      status: 'approved',
      author: 'developer1',
      knox: true,
      brity: false,
      is_common: false,
      feature_category: '인증',
      component: 'Button',
      artboard: 'Login Screen',
      notes: '로그인 버튼 텍스트'
    })

    console.log('Inserted resource:', {
      id: result.id,
      original: result.korean_text,
      normalized: result.korean_text_norm
    })

    return result
  } catch (error) {
    console.error('Failed to insert resource:', error)
    throw error
  }
}

// Example: Search with trigram similarity
export async function searchExample() {
  try {
    // This will try RPC function first, then fallback to ILIKE
    const results = await repo.search({
      query: '로그인',  // Search query
      product: 'knox',
      limit: 10
    })

    console.log('Search results:', {
      total: results.total,
      count: results.data.length,
      first_result: results.data[0] ? {
        id: results.data[0].id,
        text: results.data[0].korean_text,
        normalized: results.data[0].korean_text_norm
      } : null
    })

    return results
  } catch (error) {
    console.error('Failed to search resources:', error)
    throw error
  }
}

// Example: Insert English text
export async function insertEnglishResource() {
  try {
    const result = await repo.insertOne({
      text: 'Please log in',
      locale: 'en-US',
      status: 'approved',
      author: 'designer1',
      knox: true,
      feature_category: 'Authentication',
      component: 'Button'
    })

    console.log('Inserted English resource:', {
      id: result.id,
      korean: result.korean_text,
      english: result.english_text,
      english_normalized: result.english_text_norm
    })

    return result
  } catch (error) {
    console.error('Failed to insert English resource:', error)
    throw error
  }
}

// Example usage in API route or component:
// 
// import { insertExampleResource, searchExample } from './lib/repository-example'
// 
// // In an API route:
// const newResource = await insertExampleResource()
// const searchResults = await searchExample()

