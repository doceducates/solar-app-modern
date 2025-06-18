import React from 'react';
import { X, Sun, Calculator, Settings, BarChart3, DollarSign, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sidebarItems = [
  {
    id: 'calculator',
    label: 'Solar Calculator',
    icon: Calculator,
    description: 'Calculate power outputs'
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings,
    description: 'Panel & system settings'
  },
  {
    id: 'costs',
    label: 'Cost Analysis',
    icon: DollarSign,
    description: 'Pricing & ROI analysis'
  },
  {
    id: 'comparison',
    label: 'Comparison',
    icon: BarChart3,
    description: 'Compare configurations'
  },
  {
    id: 'location',
    label: 'Location Settings',
    icon: Globe,
    description: 'Country & currency'
  }
];

export function Sidebar({ isOpen, onClose, activeSection, onSectionChange }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <Sun className="w-5 h-5 text-yellow-800" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Solar Calc</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Power Calculator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSectionChange(item.id);
                      onClose(); // Close mobile sidebar after selection
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>© 2025 Solar Calculator</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
