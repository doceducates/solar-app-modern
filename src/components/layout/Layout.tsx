import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Layout({ children, activeSection, onSectionChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme class to document
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header
        onMenuClick={handleMenuClick}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
