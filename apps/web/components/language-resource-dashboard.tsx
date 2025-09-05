'use client'

import { useState } from 'react'
import { Button } from "@workspace/ui/components/button"

interface LanguageResource {
  id: number
  text: string
  language: string
  category: string
  usage: string
}

interface SearchResults {
  success: boolean
  data: LanguageResource[]
  total: number
  query: {
    q: string | null
    language: string | null
    category: string | null
  }
}

export function LanguageResourceDashboard() {
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  // State for API testing
  const [testResults, setTestResults] = useState<any>(null)
  const [isTestingAPI, setIsTestingAPI] = useState(false)

  // Search language resources
  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim())
      }
      
      const response = await fetch(`/api/resources/search?${params}`)
      const results = await response.json()
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults({
        success: false,
        data: [],
        total: 0,
        query: { q: searchQuery, language: null, category: null }
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Test the suggest API with mock data
  const testSuggestAPI = async () => {
    setIsTestingAPI(true)
    try {
      const mockSelection = [
        {
          id: 'text-1',
          name: 'Button Text',
          type: 'TEXT',
          text: 'click here',
          fontSize: 12
        },
        {
          id: 'text-2',
          name: 'Heading',
          type: 'TEXT',
          text: 'Welcome to our app',
          fontSize: 24
        }
      ]

      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: mockSelection })
      })
      
      const results = await response.json()
      setTestResults({ type: 'suggest', data: results })
    } catch (error) {
      console.error('Suggest API test failed:', error)
      setTestResults({ type: 'suggest', error: 'Test failed' })
    } finally {
      setIsTestingAPI(false)
    }
  }

  // Test the audit API with mock data
  const testAuditAPI = async () => {
    setIsTestingAPI(true)
    try {
      const mockDocument = {
        name: 'Test Design Document',
        pages: [
          {
            id: 'page-1',
            name: 'Home Page',
            children: [
              {
                id: 'text-1',
                name: 'Title',
                type: 'TEXT',
                text: 'Lorem ipsum dolor sit amet',
                fontSize: 10
              },
              {
                id: 'text-2',
                name: 'CTA Button',
                type: 'TEXT',
                text: 'Click here for more',
                fontSize: 14
              },
              {
                id: 'text-3',
                name: 'Description',
                type: 'TEXT',
                text: 'This is a great product that everyone should try',
                fontSize: 16
              }
            ]
          }
        ]
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: mockDocument })
      })
      
      const results = await response.json()
      setTestResults({ type: 'audit', data: results })
    } catch (error) {
      console.error('Audit API test failed:', error)
      setTestResults({ type: 'audit', error: 'Test failed' })
    } finally {
      setIsTestingAPI(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Search Language Resources</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for text, categories, or languages..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching}
            className="px-6"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">
              Search Results ({searchResults.total} found)
            </h3>
            
            {searchResults.success && searchResults.data.length > 0 ? (
              <div className="space-y-2">
                {searchResults.data.map((resource) => (
                  <div key={resource.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{resource.text}</span>
                        <div className="text-sm text-gray-600 mt-1">
                          Language: {resource.language} | Category: {resource.category} | Usage: {resource.usage}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No results found</p>
            )}
          </div>
        )}
      </div>

      {/* API Testing Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">API Testing</h2>
        <p className="text-gray-600 mb-4">
          Test the Figma plugin API endpoints with sample data
        </p>
        
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={testSuggestAPI} 
            disabled={isTestingAPI}
            variant="outline"
          >
            {isTestingAPI ? 'Testing...' : 'Test Suggest API'}
          </Button>
          <Button 
            onClick={testAuditAPI} 
            disabled={isTestingAPI}
            variant="outline"
          >
            {isTestingAPI ? 'Testing...' : 'Test Audit API'}
          </Button>
        </div>

        {/* API Test Results */}
        {testResults && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">
              {testResults.type === 'suggest' ? 'Suggest API' : 'Audit API'} Results:
            </h3>
            
            {testResults.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">Error: {testResults.error}</p>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-md">
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(testResults.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">10</div>
            <div className="text-sm text-blue-700">Total Resources</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">3</div>
            <div className="text-sm text-green-700">Languages</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">4</div>
            <div className="text-sm text-purple-700">Categories</div>
          </div>
        </div>
      </div>
    </div>
  )
}
