
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu'

// Resource data structure based on new simplified schema
interface Resource {
  id: number
  korean_text: string
  english_text: string
  knox: boolean
  brity: boolean
  is_common: boolean
  feature_category: string
  component: string
  artboard: string
  notes: string
  author: string
  created_date: string
  updated_date: string
}

// Mock data with proper structure
const mockResources: Resource[] = [
  {
    id: 1,
    korean_text: "로그인",
    english_text: "Log In",
    knox: true,
    brity: false,
    is_common: false,
    feature_category: "인증",
    component: "버튼",
    artboard: "1.3.0",
    notes: "메인 로그인 버튼 텍스트 (Frame: 1.3.0)",
    author: "김개발",
    created_date: "2024-01-15",
    updated_date: "2024-01-20"
  },
  {
    id: 2,
    korean_text: "비밀번호 찾기",
    english_text: "Find Password",
    knox: false,
    brity: true,
    is_common: false,
    feature_category: "인증",
    component: "링크",
    artboard: "2.1.5",
    notes: "비밀번호 복구 링크 (Frame: 2.1.5)",
    author: "이디자인",
    created_date: "2024-01-16",
    updated_date: "2024-01-21"
  },
  {
    id: 3,
    korean_text: "확인",
    english_text: "Confirm",
    knox: false,
    brity: false,
    is_common: true,
    feature_category: "공통",
    component: "버튼",
    artboard: "0.9.2",
    notes: "범용 확인 버튼 (Frame: 0.9.2)",
    author: "박기획",
    created_date: "2024-01-17",
    updated_date: "2024-01-22"
  }
]

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources)
  const [filteredResources, setFilteredResources] = useState<Resource[]>(mockResources)
  const [searchQuery, setSearchQuery] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [featureFilter, setFeatureFilter] = useState('')
  const [componentFilter, setComponentFilter] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null)

  const [newResource, setNewResource] = useState<Partial<Resource>>({
    korean_text: '',
    english_text: '',
    knox: false,
    brity: false,
    is_common: false,
    feature_category: '',
    component: '',
    artboard: '',
    notes: '',
    author: ''
  })

  const [editResource, setEditResource] = useState<Partial<Resource>>({
    korean_text: '',
    english_text: '',
    knox: false,
    brity: false,
    is_common: false,
    feature_category: '',
    component: '',
    artboard: '',
    notes: '',
    author: ''
  })

  // Filter resources based on search and filters
  useEffect(() => {
    let filtered = resources

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.korean_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.english_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.feature_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.notes.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Product filter
    if (productFilter) {
      filtered = filtered.filter(resource => {
        if (productFilter === 'Knox') return resource.knox
        if (productFilter === 'Brity') return resource.brity
        if (productFilter === '공통') return resource.is_common
        return false
      })
    }

    // Feature filter
    if (featureFilter) {
      filtered = filtered.filter(resource =>
        resource.feature_category === featureFilter
      )
    }

    // Component filter
    if (componentFilter) {
      filtered = filtered.filter(resource =>
        resource.component === componentFilter
      )
    }

    setFilteredResources(filtered)
  }, [resources, searchQuery, productFilter, featureFilter, componentFilter])

  // Get unique values for filters
  const getUniqueProducts = () => {
    const products = []
    if (resources.some(r => r.knox)) products.push('Knox')
    if (resources.some(r => r.brity)) products.push('Brity')
    if (resources.some(r => r.is_common)) products.push('공통')
    return products
  }

  const getUniqueFeatures = () => {
    return [...new Set(resources.map(r => r.feature_category).filter(Boolean))]
  }

  const getUniqueComponents = () => {
    return [...new Set(resources.map(r => r.component).filter(Boolean))]
  }

  const createResource = async () => {
    setIsCreating(true)
    try {
      const resourceToCreate = {
        ...newResource,
        id: Math.max(...resources.map(r => r.id), 0) + 1,
        created_date: new Date().toISOString().split('T')[0],
        updated_date: new Date().toISOString().split('T')[0],
        notes: newResource.artboard ? 
          `${newResource.notes} (Frame: ${newResource.artboard})`.trim() : 
          newResource.notes,
      } as Resource

      // Update local state immediately
      setResources(prev => [...prev, resourceToCreate])
      
      // Reset form
      setNewResource({
        korean_text: '',
        english_text: '',
        knox: false,
        brity: false,
        is_common: false,
        feature_category: '',
        component: '',
        artboard: '',
        notes: '',
        author: ''
      })
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create resource:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource)
    setEditResource(resource)
    setShowEditDialog(true)
  }

  const updateResource = async () => {
    if (!editingResource) return
    
    setIsEditing(true)
    try {
      const updatedResource = {
        ...editResource,
        id: editingResource.id,
        updated_date: new Date().toISOString().split('T')[0]
      } as Resource

      setResources(prev => prev.map(r => r.id === editingResource.id ? updatedResource : r))
      setShowEditDialog(false)
      setEditingResource(null)
    } catch (error) {
      console.error('Failed to update resource:', error)
    } finally {
      setIsEditing(false)
    }
  }

  const openDeleteDialog = (resource: Resource) => {
    setDeletingResource(resource)
    setShowDeleteDialog(true)
  }

  const deleteResource = async () => {
    if (!deletingResource) return
    
    setIsDeleting(true)
    try {
      setResources(prev => prev.filter(r => r.id !== deletingResource.id))
      setShowDeleteDialog(false)
      setDeletingResource(null)
    } catch (error) {
      console.error('Failed to delete resource:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Search and Filters Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1">
            {/* Search Box */}
            <div className="relative w-[500px]">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="텍스트, 기능, 컴포넌트 검색..."
                className="h-14 border-gray-300 focus:border-gray-900 focus:ring-gray-900 text-lg placeholder:text-xl"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-4">
              {/* Product Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-14 px-6 border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-lg font-semibold">
                    제품
                    {productFilter && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {productFilter}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {getUniqueProducts().map((product) => (
                    <DropdownMenuItem
                      key={product}
                      onClick={() => setProductFilter(productFilter === product ? '' : product)}
                    >
                      {product}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Feature Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-14 px-6 border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-lg font-semibold">
                    기능
                    {featureFilter && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {featureFilter}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {getUniqueFeatures().map((feature) => (
                    <DropdownMenuItem
                      key={feature}
                      onClick={() => setFeatureFilter(featureFilter === feature ? '' : feature)}
                    >
                      {feature}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Component Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-14 px-6 border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-lg font-semibold">
                    컴포넌트
                    {componentFilter && (
                      <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                        {componentFilter}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {getUniqueComponents().map((component) => (
                    <DropdownMenuItem
                      key={component}
                      onClick={() => setComponentFilter(componentFilter === component ? '' : component)}
                    >
                      {component}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All Filters */}
              {(productFilter || featureFilter || componentFilter) && (
                <Button 
                  variant="ghost" 
                  className="h-14 px-6 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-lg font-semibold"
                  onClick={() => {
                    setProductFilter('')
                    setFeatureFilter('')
                    setComponentFilter('')
                  }}
                >
                  ✕ 필터 초기화
                </Button>
              )}
            </div>
          </div>

          {/* Add Button - 사이드바 탭 크기로 조정 */}
          <div className="flex items-center gap-6">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="h-12 px-6 bg-black hover:bg-gray-800 text-white text-lg font-semibold">
                  + 새 리소스 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 언어 리소스 추가</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* 텍스트 입력 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="korean-text">한국어 텍스트 *</Label>
                      <Input
                        id="korean-text"
                        value={newResource.korean_text}
                        onChange={(e) => setNewResource({...newResource, korean_text: e.target.value})}
                        placeholder="한국어 텍스트를 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="english-text">영어 텍스트</Label>
                      <Input
                        id="english-text"
                        value={newResource.english_text}
                        onChange={(e) => setNewResource({...newResource, english_text: e.target.value})}
                        placeholder="영어 텍스트를 입력하세요"
                      />
                    </div>
                  </div>

                  {/* 제품 선택 */}
                  <div className="space-y-3">
                    <Label>제품 *</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="knox"
                          checked={newResource.knox}
                          onCheckedChange={(checked) => setNewResource({...newResource, knox: !!checked})}
                        />
                        <Label htmlFor="knox">Knox</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="brity"
                          checked={newResource.brity}
                          onCheckedChange={(checked) => setNewResource({...newResource, brity: !!checked})}
                        />
                        <Label htmlFor="brity">Brity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="common"
                          checked={newResource.is_common}
                          onCheckedChange={(checked) => setNewResource({...newResource, is_common: !!checked})}
                        />
                        <Label htmlFor="common">공통</Label>
                      </div>
                    </div>
                  </div>

                  {/* 카테고리 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="feature-category">기능 카테고리</Label>
                      <Input
                        id="feature-category"
                        value={newResource.feature_category}
                        onChange={(e) => setNewResource({...newResource, feature_category: e.target.value})}
                        placeholder="예: 인증, 설정"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="component">컴포넌트</Label>
                      <Input
                        id="component"
                        value={newResource.component}
                        onChange={(e) => setNewResource({...newResource, component: e.target.value})}
                        placeholder="예: 버튼, 모달"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artboard">아트보드</Label>
                      <Input
                        id="artboard"
                        value={newResource.artboard}
                        onChange={(e) => setNewResource({...newResource, artboard: e.target.value})}
                        placeholder="예: 1.3.0"
                      />
                    </div>
                  </div>

                  {/* 메모 */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">메모</Label>
                    <Textarea
                      id="notes"
                      value={newResource.notes}
                      onChange={(e) => setNewResource({...newResource, notes: e.target.value})}
                      placeholder="추가 정보나 참고사항을 입력하세요"
                      rows={3}
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      취소
                    </Button>
                    <Button 
                      onClick={createResource}
                      disabled={isCreating || !newResource.korean_text?.trim() || (!newResource.knox && !newResource.brity && !newResource.is_common)}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      {isCreating ? '추가 중...' : '추가'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {filteredResources.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-12 text-gray-900 font-semibold text-lg">Key</TableHead>
                  <TableHead className="min-w-[200px] text-gray-900 font-semibold text-lg">한국어 텍스트</TableHead>
                  <TableHead className="min-w-[200px] text-gray-900 font-semibold text-lg">영어 텍스트</TableHead>
                  <TableHead className="w-[120px] text-gray-900 font-semibold text-lg">제품</TableHead>
                  <TableHead className="w-[120px] text-gray-900 font-semibold text-lg">기능</TableHead>
                  <TableHead className="w-[120px] text-gray-900 font-semibold text-lg">컴포넌트</TableHead>
                  <TableHead className="w-[120px] text-gray-900 font-semibold text-lg">아트보드</TableHead>
                  <TableHead className="w-[100px] text-gray-900 font-semibold text-lg">생성일</TableHead>
                  <TableHead className="w-[100px] text-gray-900 font-semibold text-lg">수정일</TableHead>
                  <TableHead className="w-[80px] text-gray-900 font-semibold text-lg">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-lg text-muted-foreground">
                      {resource.id}
                    </TableCell>
                    
                    <TableCell className="font-medium max-w-[200px] text-lg">
                      <div className="truncate" title={resource.korean_text}>
                        {resource.korean_text}
                      </div>
                      {resource.notes && (
                        <div className="text-sm text-muted-foreground mt-1 truncate" title={resource.notes}>
                          💬 {resource.notes}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell className="max-w-[200px] text-lg">
                      {resource.english_text ? (
                        <div className="truncate" title={resource.english_text}>
                          {resource.english_text}
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-sm">
                          번역 필요
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {resource.knox && (
                          <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
                            Knox
                          </Badge>
                        )}
                        {resource.brity && (
                          <Badge variant="secondary" className="text-sm bg-green-50 text-green-700 hover:bg-green-100">
                            Brity
                          </Badge>
                        )}
                        {resource.is_common && (
                          <Badge variant="secondary" className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100">
                            공통
                          </Badge>
                        )}
                        {!resource.knox && !resource.brity && !resource.is_common && (
                          <Badge variant="outline" className="text-sm">
                            None
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {resource.feature_category ? (
                        <Badge variant="outline" className="text-sm w-fit">
                          {resource.feature_category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {resource.component ? (
                        <Badge variant="outline" className="text-sm w-fit">
                          🧩 {resource.component}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {resource.artboard ? (
                        <Badge variant="outline" className="text-sm w-fit font-mono">
                          📱 {resource.artboard}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="text-lg text-muted-foreground">
                      {resource.created_date}
                    </TableCell>
                    
                    <TableCell className="text-lg text-muted-foreground">
                      {resource.updated_date}
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-lg">
                            <span className="sr-only">액션 메뉴 열기</span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(resource)}>
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(resource)}
                            className="text-red-600"
                          >
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* 총 항목 수를 테이블 우측 하단으로 이동하고 텍스트 크기 줄임 */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <span className="text-base text-gray-600 font-medium">
                총 <span className="text-gray-900 font-semibold">{filteredResources.length}</span>개 항목
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              검색 결과가 없습니다.
            </div>
            <div className="text-gray-400 text-sm mt-2">
              다른 검색어나 필터를 시도해보세요.
            </div>
          </div>
        )}
      </div>

      {/* Edit Resource Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>리소스 수정</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 텍스트 입력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-korean-text">한국어 텍스트 *</Label>
                <Input
                  id="edit-korean-text"
                  value={editResource.korean_text || ''}
                  onChange={(e) => setEditResource({...editResource, korean_text: e.target.value})}
                  placeholder="한국어 텍스트를 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-english-text">영어 텍스트</Label>
                <Input
                  id="edit-english-text"
                  value={editResource.english_text || ''}
                  onChange={(e) => setEditResource({...editResource, english_text: e.target.value})}
                  placeholder="영어 텍스트를 입력하세요"
                />
              </div>
            </div>

            {/* 제품 선택 */}
            <div className="space-y-3">
              <Label>제품 *</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-knox"
                    checked={editResource.knox}
                    onCheckedChange={(checked) => setEditResource({...editResource, knox: !!checked})}
                  />
                  <Label htmlFor="edit-knox">Knox</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-brity"
                    checked={editResource.brity}
                    onCheckedChange={(checked) => setEditResource({...editResource, brity: !!checked})}
                  />
                  <Label htmlFor="edit-brity">Brity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-common"
                    checked={editResource.is_common}
                    onCheckedChange={(checked) => setEditResource({...editResource, is_common: !!checked})}
                  />
                  <Label htmlFor="edit-common">공통</Label>
                </div>
              </div>
            </div>

            {/* 카테고리 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-feature-category">기능 카테고리</Label>
                <Input
                  id="edit-feature-category"
                  value={editResource.feature_category || ''}
                  onChange={(e) => setEditResource({...editResource, feature_category: e.target.value})}
                  placeholder="예: 인증, 설정"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-component">컴포넌트</Label>
                <Input
                  id="edit-component"
                  value={editResource.component || ''}
                  onChange={(e) => setEditResource({...editResource, component: e.target.value})}
                  placeholder="예: 버튼, 모달"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-artboard">아트보드</Label>
                <Input
                  id="edit-artboard"
                  value={editResource.artboard || ''}
                  onChange={(e) => setEditResource({...editResource, artboard: e.target.value})}
                  placeholder="예: 1.3.0"
                />
              </div>
            </div>

            {/* 메모 */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">메모</Label>
              <Textarea
                id="edit-notes"
                value={editResource.notes || ''}
                onChange={(e) => setEditResource({...editResource, notes: e.target.value})}
                placeholder="추가 정보나 참고사항을 입력하세요"
                rows={3}
              />
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={updateResource}
                disabled={isEditing || !editResource.korean_text?.trim() || (!editResource.knox && !editResource.brity && !editResource.is_common)}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isEditing ? '수정 중...' : '수정 완료'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>리소스 삭제</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  다음 리소스를 정말 삭제하시겠습니까?
                </p>
                {deletingResource && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>"{deletingResource.korean_text}"</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={deleteResource}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}