import React from 'react';
import { Menu, Sun, Moon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

export function Header({ onMenuClick, isDarkMode = false, onThemeToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Sun className="w-5 h-5 text-yellow-800" />
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Solar Panel Calculator
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Optimize your solar energy system
              </p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Solar Calc
              </h1>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {onThemeToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="hidden sm:flex"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Calculator Ready
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
