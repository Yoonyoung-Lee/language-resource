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
        <Sidebar className="border-r border-white/50 bg-white/50 backdrop-blur-lg rounded-r-[2rem]">
          <SidebarHeader className="p-6 border-b border-white/40">
            <div className="flex flex-col space-y-3">
              <div>
                <h1 className="text-3xl font-bold text-black">Text Match</h1>
                <p className="text-base text-black/80">언어 리소스 검색 및 관리</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex-1 p-4">
            <nav className="space-y-3">
              <Button
                variant={currentTab === 'home' ? 'default' : 'ghost'}
                className={`w-full justify-start text-lg py-4 h-12 font-semibold ${
                  currentTab === 'home' 
                    ? 'bg-black text-white hover:bg-black' 
                    : 'text-black hover:bg-white/20'
                }`}
                onClick={() => onTabChange('home')}
              >
                홈
              </Button>
              
              <Button
                variant={currentTab === 'resources' ? 'default' : 'ghost'}
                className={`w-full justify-start text-lg py-4 h-12 font-semibold ${
                  currentTab === 'resources' 
                    ? 'bg-black text-white hover:bg-black' 
                    : 'text-black hover:bg-white/20'
                }`}
                onClick={() => onTabChange('resources')}
              >
                언어리소스 DB
              </Button>
            </nav>
          </SidebarContent>

          <Separator className="border-white/40" />
          
          <SidebarFooter className="p-4">
            <p className="text-sm text-black/60">AI-Powered Language Manager</p>
            <div className="flex items-center mt-2 space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-black/60">AI 연결됨</span>
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
