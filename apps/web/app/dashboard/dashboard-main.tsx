'use client'

// Main dashboard component with 4 sections
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Button } from '@workspace/ui/components/button'

interface DashboardMainProps {
  children: React.ReactNode
}

export function DashboardMain({ children }: DashboardMainProps) {
  const [activeSection, setActiveSection] = useState<'search' | 'insert' | 'audit' | 'suggest'>('search')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Language Resource Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage language resources with Supabase backend and AI-powered suggestions
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'search', label: 'Search Resources', icon: '🔍' },
            { key: 'insert', label: 'Insert Resource', icon: '➕' },
            { key: 'audit', label: 'Audit Resources', icon: '📊' },
            { key: 'suggest', label: 'AI Suggestions', icon: '🤖' }
          ].map((section) => (
            <Button
              key={section.key}
              variant={activeSection === section.key ? 'default' : 'outline'}
              onClick={() => setActiveSection(section.key as any)}
              className="flex items-center gap-2"
            >
              <span>{section.icon}</span>
              {section.label}
            </Button>
          ))}
        </div>

        {/* Section Content */}
        <div className="grid gap-6">
          {children}
        </div>
      </div>
    </div>
  )
}
