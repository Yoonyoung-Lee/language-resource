// Text normalization utility for better search performance
// This helper normalizes text for consistent searching and indexing

/**
 * Normalizes text for search indexing by:
 * - Converting to lowercase
 * - Removing extra whitespace
 * - Normalizing Unicode characters
 * - Removing common punctuation that doesn't affect meaning
 */
export function norm(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    // Normalize Unicode characters (decompose then recompose)
    .normalize('NFD')
    .normalize('NFC')
    // Convert to lowercase for case-insensitive search
    .toLowerCase()
    // Remove extra whitespace and normalize spaces
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Remove common punctuation that doesn't affect search meaning
    .replace(/[.,!?;:()[\]{}"'`~]/g, '')
    // Normalize multiple spaces that might remain
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalizes search query for consistent matching
 * Similar to norm() but preserves some search-relevant characters
 */
export function normalizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  return query
    .normalize('NFD')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

