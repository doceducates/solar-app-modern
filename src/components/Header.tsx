'use client';

import React from 'react';
import { Sun, Calculator, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  className?: string;
}

export function Header({ isSidebarOpen, onToggleSidebar, className }: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
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
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
              <Sun className="w-5 h-5 text-white" />
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
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a 
            href="#calculator" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Calculator
          </a>
          <a 
            href="#analysis" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Analysis
          </a>
          <a 
            href="#comparison" 
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Comparison
          </a>
        </nav>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Calculator className="w-4 h-4 mr-2" />
            Export Results
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
