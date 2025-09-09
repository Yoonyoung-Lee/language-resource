// Migration script to move data from resources.json to Supabase
// Run with: node scripts/migrate-to-supabase.js

const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

async function migrateData() {
  try {
    // Load JSON data
    const resourcesPath = path.join(__dirname, '../resources.json')
    const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'))
    
    console.log(`Found ${resourcesData.length} resources to migrate`)
    
    // Convert to Supabase format
    const supabaseData = resourcesData.map(resource => ({
      knox: resource.products.includes('knox'),
      brity: resource.products.includes('brity'),
      is_common: resource.category.common || false,
      feature_category: resource.category.section1,
      component: resource.category.component,
      artboard: resource.category.artboard,
      korean_text: resource.translations['ko-KR'],
      korean_text_norm: resource.translations['ko-KR']?.toLowerCase().replace(/[^\w\s]/g, ''),
      english_text: resource.translations['en-US'] || null,
      english_text_norm: resource.translations['en-US']?.toLowerCase().replace(/[^\w\s]/g, ''),
      status: resource.status,
      author: resource.metadata.author,
      notes: null
    }))
    
    console.log('Converted data format for Supabase')
    console.log('Sample record:', supabaseData[0])
    
    // Note: You'll need to manually insert this data into Supabase
    // or use the Supabase client to insert programmatically
    console.log('\nTo complete migration:')
    console.log('1. Copy the converted data above')
    console.log('2. Go to Supabase Dashboard → Table Editor → language_resources')
    console.log('3. Insert the data manually or use the Supabase client')
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

migrateData()
