// Resource loading utilities with in-memory caching

import fs from 'fs'
import path from 'path'
import { Resource } from './types'

// Cache resources in memory to avoid repeated file reads
let resourcesCache: Resource[] | null = null

/**
 * Load resources from the JSON file at project root
 * Uses in-memory caching for better performance
 */
export function loadResources(): Resource[] {
  // Return cached resources if available
  if (resourcesCache !== null) {
    return resourcesCache
  }

  try {
    // Read resources.json from project root (2 levels up from apps/web)
    const resourcesPath = path.join(process.cwd(), '../../resources.json')
    const resourcesData = fs.readFileSync(resourcesPath, 'utf-8')
    
    // Parse and cache the resources
    const resources = JSON.parse(resourcesData) as Resource[]
    resourcesCache = resources
    
    console.log(`Loaded ${resources.length} resources from resources.json`)
    return resources
  } catch (error) {
    console.error('Failed to load resources:', error)
    
    // Return empty array as fallback
    resourcesCache = []
    return resourcesCache
  }
}

/**
 * Clear the resources cache (useful for development/testing)
 */
export function clearResourcesCache(): void {
  resourcesCache = null
}
