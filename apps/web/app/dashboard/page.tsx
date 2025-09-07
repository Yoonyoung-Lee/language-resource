'use client'

// Dashboard page - simple version with basic functionality
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Language Resource Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage language resources with Supabase backend and AI-powered suggestions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchCard />
          <InsertCard />
          <AuditCard />
          <SuggestCard />
        </div>
      </div>
    </div>
  )
}

// Search functionality card
function SearchCard() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ query, locale: 'ko-KR' })
      const response = await fetch(`/api/resources/search?${params}`, {
        headers: { 'x-secret': 'devpass' }
      })
      const result = await response.json()
      setResult(result)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Search Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search language resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? 'Searching...' : 'Search'}
          </Button>
          {result && result.success && (
            <div>
              <Badge>Found {result.total} resources</Badge>
              <div className="mt-2 max-h-40 overflow-y-auto">
                {result.data.slice(0, 3).map((resource: any) => (
                  <div key={resource.id} className="p-2 border rounded mb-2">
                    <div className="font-medium">{resource.key}</div>
                    <div className="text-sm text-muted-foreground">
                      {resource.translations?.['ko-KR'] || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Insert functionality card - updated for new schema
function InsertCard() {
  const [koText, setKoText] = useState('')
  const [enText, setEnText] = useState('')
  const [author, setAuthor] = useState('')
  const [knox, setKnox] = useState(false)
  const [brity, setBrity] = useState(false)
  const [isCommon, setIsCommon] = useState(false)
  const [featureCategory, setFeatureCategory] = useState('')
  const [component, setComponent] = useState('')
  const [artboard, setArtboard] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleInsert = async () => {
    if (!koText || !author) {
      alert('Korean text and author are required')
      return
    }
    
    if (!knox && !brity && !isCommon) {
      alert('At least one product (Knox, Brity, or 공통사용) must be selected')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/resources/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-secret': 'devpass' },
        body: JSON.stringify({
          korean_text: koText,
          english_text: enText || null,
          author,
          knox,
          brity,
          is_common: isCommon,
          feature_category: featureCategory || null,
          component: component || null,
          artboard: artboard || null,
          notes: notes || null,
          status: 'draft'
        })
      })
      const result = await response.json()
      setResult(result)
      if (result.success) {
        // Reset form
        setKoText('')
        setEnText('')
        setAuthor('')
        setKnox(false)
        setBrity(false)
        setIsCommon(false)
        setFeatureCategory('')
        setComponent('')
        setArtboard('')
        setNotes('')
      }
    } catch (error) {
      console.error('Insert error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>➕ Insert Resource</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">국문 (필수)</label>
            <Input placeholder="한국어 텍스트" value={koText} onChange={(e) => setKoText(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm font-medium">영문</label>
            <Input placeholder="English text" value={enText} onChange={(e) => setEnText(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm font-medium">제품 (필수)</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input type="checkbox" checked={knox} onChange={(e) => setKnox(e.target.checked)} className="mr-2" />
                Knox
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={brity} onChange={(e) => setBrity(e.target.checked)} className="mr-2" />
                Brity
              </label>
              <label className="flex items-center">
                <input type="checkbox" checked={isCommon} onChange={(e) => setIsCommon(e.target.checked)} className="mr-2" />
                공통사용
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">기능 카테고리</label>
              <Input placeholder="인증, 채팅..." value={featureCategory} onChange={(e) => setFeatureCategory(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">컴포넌트</label>
              <Input placeholder="Button, Input..." value={component} onChange={(e) => setComponent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">아트보드</label>
              <Input placeholder="Login Screen..." value={artboard} onChange={(e) => setArtboard(e.target.value)} />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">작성자 (필수)</label>
            <Input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          
          <div>
            <label className="text-sm font-medium">메모</label>
            <Input placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          
          <Button onClick={handleInsert} disabled={loading} className="w-full">
            {loading ? 'Inserting...' : 'Insert'}
          </Button>
          
          {result && (
            <div className={`p-2 rounded ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.success ? 'Success!' : result.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Audit functionality card
function AuditCard() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAudit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/audit-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-secret': 'devpass' },
        body: JSON.stringify({ locale: 'ko-KR' })
      })
      const result = await response.json()
      setResult(result)
    } catch (error) {
      console.error('Audit error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Audit Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleAudit} disabled={loading} className="w-full">
            {loading ? 'Auditing...' : 'Run Audit'}
          </Button>
          {result && result.success && (
            <div className="space-y-2">
              <Badge className="text-lg px-4 py-2">
                Health Score: {result.health_score}/100
              </Badge>
              {result.stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: {result.stats.total_resources}</div>
                  <div>Approved: {result.stats.approved}</div>
                  <div>Draft: {result.stats.draft}</div>
                  <div>Review: {result.stats.review}</div>
                  <div>Knox: {result.stats.knox_resources}</div>
                  <div>Brity: {result.stats.brity_resources}</div>
                  <div>공통: {result.stats.common_resources}</div>
                  <div>영어: {result.stats.english_translations}</div>
                </div>
              )}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">권장사항:</div>
                  <ul className="text-xs space-y-1">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-muted-foreground">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// AI Suggest functionality card
function SuggestCard() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSuggest = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const response = await fetch('/api/suggest-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-secret': 'devpass' },
        body: JSON.stringify({ text, locale: 'ko-KR' })
      })
      const result = await response.json()
      setResult(result)
    } catch (error) {
      console.error('Suggest error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 AI Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Enter text for AI suggestion..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSuggest()}
          />
          <Button onClick={handleSuggest} disabled={loading} className="w-full">
            {loading ? 'Getting Suggestion...' : 'Get AI Suggestion'}
          </Button>
          {result && result.success && (
            <div className="p-4 bg-blue-50 rounded">
              <div className="font-medium">"{result.suggestion}"</div>
              <div className="text-sm text-muted-foreground mt-1">{result.rationale}</div>
              <Badge variant="outline" className="mt-2">
                {Math.round((result.confidence || 0) * 100)}% confidence
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}