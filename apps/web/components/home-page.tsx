'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Card, CardContent } from '@workspace/ui/components/card'

interface HomePageProps {
  onSearch: (query: string) => void
}

export function HomePage({ onSearch }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
      <div className="w-full max-w-3xl px-6">
        {/* Simple Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-6">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Language Resource Search
          </h1>
          <p className="text-lg text-muted-foreground">
            Knox, Brity 제품의 언어 리소스를 검색하고 관리하세요
          </p>
        </div>

        {/* Main Search Box - 더 큰 사이즈 */}
        <div className="mb-8">
          <Card className="border shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-center">
                <div className="flex-1 p-8">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="언어 리소스를 검색하세요... 🔍"
                    className="text-2xl h-14 border-none shadow-none focus-visible:ring-2 focus-visible:ring-primary bg-transparent placeholder:text-muted-foreground text-foreground"
                    autoFocus
                  />
                </div>
                <div className="px-8">
                  <Button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim()}
                    size="lg"
                    className="px-10 py-4 text-base"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    검색
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Search Suggestions - 단순화 */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">빠른 검색</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              '로그인',
              'Dialog', 
              'Button',
              'Knox',
              'Brity'
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  setSearchQuery(suggestion)
                  onSearch(suggestion)
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
