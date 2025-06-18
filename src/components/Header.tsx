'use client';

import React from 'react';
import { Sun, Calculator, Menu, X, BarChart3, DollarSign, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  className?: string;
}

export function Header({ isSidebarOpen, onToggleSidebar, activeSection, onSectionChange, className }: HeaderProps) {
  const navigationItems = [
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'cost-analysis', label: 'Cost Analysis', icon: DollarSign },
    { id: 'comparison', label: 'Comparison', icon: Settings },
    { id: 'system-design', label: 'System Design', icon: Globe }
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-20 items-center justify-between px-4">
        {/* Left side - Logo and toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-md">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                Solar Calculator
              </h1>
              <p className="text-xs text-muted-foreground hidden lg:block">
                Advanced power analysis & cost estimation
              </p>
            </div>
          </div>
        </div>

        {/* Center - Navigation (hidden on mobile) */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSectionChange?.(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 h-9",
                  isActive && "bg-secondary/80"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Right side - Actions and Theme Toggle */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Calculator className="w-4 h-4 mr-2" />
            Export Results
          </Button>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
