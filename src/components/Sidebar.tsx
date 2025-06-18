'use client';

import React from 'react';
import { Settings, BarChart3, Calculator, Globe, DollarSign, Zap, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  className?: string;
}

const navigationItems = [
  {
    id: 'input',
    label: 'Panel Input',
    icon: Settings,
    description: 'Configure panel specifications'
  },
  {
    id: 'country',
    label: 'Location & Pricing',
    icon: Globe,
    description: 'Country-specific costs'
  },
  {
    id: 'cost',
    label: 'Cost Settings',
    icon: DollarSign,
    description: 'Customize pricing parameters'
  },
  {
    id: 'calculator',
    label: 'Configuration',
    icon: Calculator,
    description: 'Series, parallel & combined'
  },
  {
    id: 'results',
    label: 'Power Analysis',
    icon: Zap,
    description: 'Voltage, current & power output'
  },
  {
    id: 'cost-analysis',
    label: 'Cost Analysis',
    icon: Battery,
    description: 'ROI & payback period'
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: BarChart3,
    description: 'Visual charts & graphs'
  }
];

export function Sidebar({ isOpen, onClose, activeSection, onSectionChange, className }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:relative md:top-0 md:h-full md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">
                Calculator Sections
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-left",
                    isActive && "bg-secondary border border-border"
                  )}
                  onClick={() => {
                    onSectionChange(item.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <Icon className={cn(
                      "w-4 h-4 mt-0.5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          isActive ? "text-foreground" : "text-foreground/90"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium">Quick Tip</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Use Pakistani Bill Calculator for accurate electricity cost analysis with slab-based pricing.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
