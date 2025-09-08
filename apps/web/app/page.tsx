'use client'

// Language Resource Search - New Perplexity-style interface
// Home page with search functionality and resource management

import { useState } from 'react'
import { MainLayout } from '@/components/main-layout'
import { HomePage } from '@/components/home-page'
import ResourcesPage from '@/components/resources-page-v2'
import { SearchResultsPage } from '@/components/search-results-page'

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'resources'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowSearchResults(true)
  }

  const handleBackToHome = () => {
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleTabChange = (tab: 'home' | 'resources') => {
    setCurrentTab(tab)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  return (
    <MainLayout currentTab={currentTab} onTabChange={handleTabChange}>
      {showSearchResults ? (
        <SearchResultsPage 
          searchQuery={searchQuery} 
          onBackToHome={handleBackToHome} 
        />
      ) : currentTab === 'home' ? (
        <HomePage onSearch={handleSearch} />
      ) : (
        <ResourcesPage />
      )}
    </MainLayout>
  )
}
