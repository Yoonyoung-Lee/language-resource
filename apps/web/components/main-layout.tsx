'use client'

import { Button } from '@workspace/ui/components/button'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Badge } from '@workspace/ui/components/badge'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarTrigger } from '@workspace/ui/components/sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  currentTab: 'home' | 'resources'
  onTabChange: (tab: 'home' | 'resources') => void
}

export function MainLayout({ children, currentTab, onTabChange }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar using shadcn/ui */}
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-card-foreground">Language AI</h1>
                <p className="text-xs text-muted-foreground">언어 리소스 관리</p>
              </div>
            </div>
            <Badge className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground">
              v2.0 AI
            </Badge>
          </SidebarHeader>

          <SidebarContent className="flex-1 p-4">
            <nav className="space-y-2">
              <Button
                variant={currentTab === 'home' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onTabChange('home')}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                </svg>
                홈화면
              </Button>
              
              <Button
                variant={currentTab === 'resources' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onTabChange('resources')}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                언어리소스 DB
              </Button>
            </nav>
          </SidebarContent>

          <Separator />
          
          <SidebarFooter className="p-4">
            <p className="text-xs text-muted-foreground">AI-Powered Language Manager</p>
            <div className="flex items-center mt-2 space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">AI 연결됨</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
