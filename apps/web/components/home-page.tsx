'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'

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
    <div className="min-h-screen relative overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-1 {
            0%, 100% { 
              background-position: 20% 30%;
              transform: scale(1) rotate(0deg);
            }
            50% { 
              background-position: 80% 60%;
              transform: scale(1.1) rotate(2deg);
            }
          }
          
          @keyframes float-2 {
            0%, 100% { 
              background-position: 80% 70%;
              transform: scale(1) rotate(0deg);
            }
            50% { 
              background-position: 30% 40%;
              transform: scale(1.2) rotate(-3deg);
            }
          }
          
          @keyframes float-3 {
            0%, 100% { 
              background-position: 50% 20%;
              transform: scale(1) rotate(0deg);
            }
            50% { 
              background-position: 70% 80%;
              transform: scale(0.9) rotate(1deg);
            }
          }
          
          .animate-float-1 {
            animation: float-1 20s ease-in-out infinite alternate;
          }
          
          .animate-float-2 {
            animation: float-2 25s ease-in-out infinite alternate;
            animation-delay: 5s;
          }
          
          .animate-float-3 {
            animation: float-3 30s ease-in-out infinite alternate;
            animation-delay: 10s;
          }
        `
      }} />
      
      {/* Animated Background */}
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, #dbeafe 0%, #e7f8f9 50%, #bfdbfe 100%)'
           }}>
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0 animate-float-1" 
               style={{
                 background: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, rgba(165, 243, 252, 0.3) 40%, transparent 70%)',
                 backgroundSize: '800px 600px',
                 backgroundRepeat: 'no-repeat'
               }}>
          </div>
          <div className="absolute inset-0 animate-float-2"
               style={{
                 background: 'radial-gradient(ellipse, rgba(165, 243, 252, 0.5) 0%, rgba(147, 197, 253, 0.4) 40%, transparent 70%)',
                 backgroundSize: '600px 800px',
                 backgroundRepeat: 'no-repeat'
               }}>
          </div>
          <div className="absolute inset-0 animate-float-3"
               style={{
                 background: 'radial-gradient(ellipse, rgba(147, 197, 253, 0.6) 0%, rgba(165, 243, 252, 0.3) 50%, transparent 80%)',
                 backgroundSize: '1000px 400px',
                 backgroundRepeat: 'no-repeat'
               }}>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-4xl">
          {/* Main Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-black mb-8 sm:text-5xl">
              찾고 싶은 언어 리소스를 입력하세요
            </h1>
          </div>

          {/* Main Search */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-2xl focus-within:border-black focus-within:border-2 transition-all duration-200">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="텍스트 혹은 화면명을 입력하세요"
                className="h-12 border-0 bg-transparent text-lg focus-visible:ring-0 px-0 text-gray-700 placeholder:text-gray-500 placeholder:text-xl flex-1"
                autoFocus
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                size="lg"
                className="h-12 px-8 text-base bg-black hover:bg-black text-white border-0 font-semibold"
              >
                검색
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
