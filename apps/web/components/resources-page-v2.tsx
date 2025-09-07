'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Card, CardContent } from '@workspace/ui/components/card'
import { Badge } from '@workspace/ui/components/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'

const API_SECRET = 'devpass' // Use environment variable in production

interface Resource {
  id: number
  korean_text: string
  english_text: string
  is_common: boolean
  knox: boolean
  brity: boolean
  feature_category?: string
  component?: string
  artboard?: string
  notes?: string
  author?: string
  status?: 'approved' | 'draft' | 'review'
  created_date?: string
  updated_date?: string
}

interface NewResourceForm {
  korean_text: string
  english_text: string
  is_common: boolean
  knox: boolean
  brity: boolean
  feature_category: string
  component: string
  artboard: string
  notes: string
  author: string
}

export function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newResource, setNewResource] = useState<NewResourceForm>({
    korean_text: '',
    english_text: '',
    is_common: false,
    knox: false,
    brity: false,
    feature_category: '',
    component: '',
    artboard: '',
    notes: '',
    author: ''
  })

  // Load resources on component mount
  useEffect(() => {
    const initializeResources = () => {
      const savedResources = localStorage.getItem('language-resources')
      if (savedResources) {
        try {
          const parsedResources = JSON.parse(savedResources)
          if (parsedResources.length > 0) {
            setResources(parsedResources)
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Failed to parse saved resources:', error)
        }
      }
      fetchResources()
    }
    initializeResources()
  }, [])

  // Save to localStorage whenever resources change
  useEffect(() => {
    if (resources.length > 0) {
      localStorage.setItem('language-resources', JSON.stringify(resources))
    }
  }, [resources])

  // Filter resources based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResources(resources)
    } else {
      const filtered = resources.filter(resource =>
        resource.korean_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.english_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.feature_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.component?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredResources(filtered)
    }
  }, [searchQuery, resources])

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources/search?limit=1000', {
        headers: {
          'x-secret': API_SECRET
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setResources(result.data)
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }

    // Fallback to mock data
    setResources(getMockResources())
    setLoading(false)
  }

  const getMockResources = (): Resource[] => {
    return [
      {
        id: 1,
        korean_text: "로그인",
        english_text: "Login",
        is_common: true,
        knox: true,
        brity: true,
        feature_category: "Authentication",
        component: "LoginForm",
        artboard: "Login Screen",
        notes: "기본 로그인 버튼",
        author: "개발자",
        status: 'approved',
        created_date: new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0]
      },
      {
        id: 2,
        korean_text: "비밀번호",
        english_text: "Password",
        is_common: true,
        knox: false,
        brity: true,
        feature_category: "Authentication",
        component: "PasswordInput",
        artboard: "Login Screen",
        notes: "비밀번호 입력 필드 라벨",
        author: "디자이너",
        status: 'draft',
        created_date: new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0]
      }
    ]
  }

  const createResource = async () => {
    if (!newResource.korean_text.trim()) {
      alert('한국어 텍스트는 필수입니다.')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': API_SECRET
        },
        body: JSON.stringify({
          korean_text: newResource.korean_text,
          english_text: newResource.english_text || '',
          is_common: newResource.is_common,
          knox: newResource.knox,
          brity: newResource.brity,
          feature_category: newResource.feature_category || '',
          component: newResource.component || '',
          artboard: newResource.artboard || '',
          notes: newResource.notes || '',
          author: newResource.author || '사용자'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setResources(prev => [result.data, ...prev])
        } else {
          throw new Error('API 응답 오류')
        }
      } else {
        throw new Error('API 호출 실패')
      }
    } catch (error) {
      console.error('Failed to create resource:', error)
      
      // 로컬 폴백
      const mockNewResource: Resource = {
        id: Date.now(),
        korean_text: newResource.korean_text,
        english_text: newResource.english_text || '',
        is_common: newResource.is_common,
        knox: newResource.knox,
        brity: newResource.brity,
        feature_category: newResource.feature_category || '',
        component: newResource.component || '',
        artboard: newResource.artboard || '',
        notes: newResource.notes || '',
        author: newResource.author || '사용자',
        status: 'draft',
        created_date: new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0]
      }
      
      setResources(prev => [mockNewResource, ...prev])
    }

    // Reset form
    setNewResource({
      korean_text: '',
      english_text: '',
      is_common: false,
      knox: false,
      brity: false,
      feature_category: '',
      component: '',
      artboard: '',
      notes: '',
      author: ''
    })

    setShowCreateDialog(false)
    setIsCreating(false)
  }

  const formatProducts = (resource: Resource): string => {
    const products = []
    if (resource.knox) products.push('Knox')
    if (resource.brity) products.push('Brity')
    if (resource.is_common) products.push('공통')
    return products.length > 0 ? products.join(', ') : 'None'
  }

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'draft': return 'secondary'
      case 'review': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return '승인됨'
      case 'draft': return '초안'
      case 'review': return '검토중'
      default: return status || '초안'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-background p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">언어리소스</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchResources} variant="outline" size="sm">
                새로고침
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    + 새 리소스 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새 언어 리소스 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="korean_text">한국어 텍스트 *</Label>
                      <Input
                        id="korean_text"
                        value={newResource.korean_text}
                        onChange={(e) => setNewResource({ ...newResource, korean_text: e.target.value })}
                        placeholder="한국어 텍스트를 입력하세요"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="english_text">영어 텍스트</Label>
                      <Input
                        id="english_text"
                        value={newResource.english_text}
                        onChange={(e) => setNewResource({ ...newResource, english_text: e.target.value })}
                        placeholder="영어 텍스트를 입력하세요"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>제품</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="knox"
                            checked={newResource.knox}
                            onCheckedChange={(checked) => setNewResource({ ...newResource, knox: !!checked })}
                          />
                          <Label htmlFor="knox">Knox</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="brity"
                            checked={newResource.brity}
                            onCheckedChange={(checked) => setNewResource({ ...newResource, brity: !!checked })}
                          />
                          <Label htmlFor="brity">Brity</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_common"
                            checked={newResource.is_common}
                            onCheckedChange={(checked) => setNewResource({ ...newResource, is_common: !!checked })}
                          />
                          <Label htmlFor="is_common">공통</Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="feature_category">기능 카테고리</Label>
                        <Input
                          id="feature_category"
                          value={newResource.feature_category}
                          onChange={(e) => setNewResource({ ...newResource, feature_category: e.target.value })}
                          placeholder="예: Authentication"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="component">컴포넌트</Label>
                        <Input
                          id="component"
                          value={newResource.component}
                          onChange={(e) => setNewResource({ ...newResource, component: e.target.value })}
                          placeholder="예: LoginForm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artboard">아트보드</Label>
                      <Input
                        id="artboard"
                        value={newResource.artboard}
                        onChange={(e) => setNewResource({ ...newResource, artboard: e.target.value })}
                        placeholder="예: Login Screen"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">메모</Label>
                      <Textarea
                        id="notes"
                        value={newResource.notes}
                        onChange={(e) => setNewResource({ ...newResource, notes: e.target.value })}
                        placeholder="추가 정보나 메모를 입력하세요"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="author">작성자</Label>
                      <Input
                        id="author"
                        value={newResource.author}
                        onChange={(e) => setNewResource({ ...newResource, author: e.target.value })}
                        placeholder="작성자 이름"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={createResource}
                        disabled={isCreating}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isCreating ? '추가 중...' : '리소스 추가'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-80">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="리소스 검색..."
                  className="pl-3"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                총 {filteredResources.length}개 항목
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="flex-1 p-6">
        {filteredResources.length > 0 ? (
          <div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="min-w-[200px]">한국어 텍스트</TableHead>
                    <TableHead className="min-w-[200px]">영어 텍스트</TableHead>
                    <TableHead className="w-[120px]">제품</TableHead>
                    <TableHead className="w-[150px]">카테고리</TableHead>
                    <TableHead className="w-[100px]">작성자</TableHead>
                    <TableHead className="w-[100px]">상태</TableHead>
                    <TableHead className="w-[100px]">생성일</TableHead>
                    <TableHead className="w-[80px]">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {resource.id}
                      </TableCell>
                      
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate" title={resource.korean_text}>
                          {resource.korean_text}
                        </div>
                        {resource.notes && (
                          <div className="text-xs text-muted-foreground mt-1 truncate" title={resource.notes}>
                            💬 {resource.notes}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="max-w-[200px]">
                        {resource.english_text ? (
                          <div className="truncate" title={resource.english_text}>
                            {resource.english_text}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            번역 필요
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          {formatProducts(resource)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {resource.feature_category && (
                            <Badge variant="outline" className="text-xs w-fit">
                              {resource.feature_category}
                            </Badge>
                          )}
                          {resource.component && (
                            <Badge variant="outline" className="text-xs w-fit">
                              🧩 {resource.component}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-sm">
                        {resource.author}
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(resource.status)}
                          className="text-xs"
                        >
                          {getStatusText(resource.status)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-sm text-muted-foreground">
                        {resource.created_date}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">액션 메뉴 열기</span>
                              ⋮
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>수정</DropdownMenuItem>
                            <DropdownMenuItem>복제</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '리소스가 없습니다'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? '다른 검색어를 시도해보세요' : '새로운 리소스를 추가해보세요'}
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  검색 초기화
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}