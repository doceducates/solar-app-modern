'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  Calculator, 
  DollarSign, 
  BarChart3, 
  Settings,
  Sun,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calculator', href: '/calculator', icon: Calculator },
  { name: 'Cost Analysis', href: '/cost-analysis', icon: DollarSign },
  { name: 'Comparison', href: '/comparison', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Desktop doesn't use mobile overlay
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="min-h-screen bg-background">      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
        </div>
      )}{/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        sidebarCollapsed ? "lg:w-16" : "lg:w-64",
        "w-64 bg-card border-r border-border"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
          )}>
            <Sun className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Solar Calc</span>
          </div>
          
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden lg:flex"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  sidebarCollapsed ? "lg:justify-center lg:px-2" : ""
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "transition-opacity duration-200",
                  sidebarCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center justify-between",
            sidebarCollapsed ? "lg:justify-center" : ""
          )}>
            <ThemeToggle />
            {!sidebarCollapsed && (
              <span className="text-xs text-muted-foreground hidden lg:block">
                v1.0.0
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 lg:px-6 lg:py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Page title */}
            <h1 className="text-xl font-semibold">
              {navigation.find(item => item.href === pathname)?.name || 'Solar Calculator'}
            </h1>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Additional header actions can go here */}
          </div>
        </header>        {/* Page content */}
        <main className="flex-1 px-4 py-6 lg:px-6 lg:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
