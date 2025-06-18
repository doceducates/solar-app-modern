'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Palette, Globe, Download, Info } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { DatabaseMigrator } from '@/components/DatabaseMigrator';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure application preferences and settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose between light, dark, or system theme
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Default Country</p>
              <p className="text-sm text-muted-foreground mb-3">
                Your default country selection affects pricing and regulations
              </p>
              <Button variant="outline" size="sm">
                Change Default Country
              </Button>
            </div>
            <div>
              <p className="font-medium mb-2">Units</p>
              <p className="text-sm text-muted-foreground mb-3">
                Choose between metric and imperial units
              </p>
              <Button variant="outline" size="sm">
                Metric (Recommended)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data & Export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Export Configuration</p>
              <p className="text-sm text-muted-foreground mb-3">
                Download your current system configuration
              </p>
              <Button variant="outline" size="sm">
                Export as JSON
              </Button>
            </div>
            <div>
              <p className="font-medium mb-2">Clear Data</p>
              <p className="text-sm text-muted-foreground mb-3">
                Reset all configurations to default values
              </p>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                Reset All Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Solar Panel Calculator</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
            <div>
              <p className="font-medium mb-2">Features</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-country support with local pricing</li>
                <li>• Series, parallel, and combined configurations</li>
                <li>• Cost analysis and ROI calculations</li>
                <li>• Safety compliance checks</li>
                <li>• Responsive design with dark mode</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Technology Stack</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Next.js 15 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Tailwind CSS for styling</li>
                <li>• shadcn/ui component library</li>
                <li>• Recharts for data visualization</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Management */}
      <div className="lg:col-span-2">
        <DatabaseMigrator />
      </div>

      {/* Help & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">User Guide</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Learn how to use all features of the solar calculator
              </p>
              <Button variant="outline" size="sm">
                View Guide
              </Button>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">FAQ</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Find answers to frequently asked questions
              </p>
              <Button variant="outline" size="sm">
                Browse FAQ
              </Button>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get help with technical issues or feedback
              </p>
              <Button variant="outline" size="sm">
                Contact Us
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
