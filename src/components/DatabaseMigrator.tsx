'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface MigrationStatus {
  status: string;
  current_data: { countries: number; presets: number };
  available_data: { countries: number; presets: number };
  message: string;
}

interface MigrationResult {
  success: boolean;
  message: string;
  seeded?: { countries: number; presets: number };
  final_counts?: { countries: number; presets: number };
  errors?: string[];
  timestamp: string;
}

export function DatabaseMigrator() {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/migrate');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to check migration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (options: { force?: boolean; clear?: boolean } = {}) => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/database/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      const data = await response.json();
      setResult(data);
      
      // Refresh status after migration
      if (data.success) {
        await checkStatus();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({
        success: false,
        message: 'Migration failed: Network error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all database data? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/database/migrate', {
        method: 'DELETE'
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        await checkStatus();
      }
    } catch (error) {
      console.error('Clear failed:', error);
      setResult({
        success: false,
        message: 'Clear failed: Network error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-check status on mount
  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Migration Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Current Status</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkStatus}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {status && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Countries:</span> {status.current_data.countries} / {status.available_data.countries}
                  </div>
                  <div>
                    <span className="font-medium">Presets:</span> {status.current_data.presets} / {status.available_data.presets}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{status.message}</p>
              </div>
            )}
          </div>

          {/* Migration Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => runMigration()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run Migration (Add Missing)
            </Button>
            
            <Button 
              onClick={() => runMigration({ clear: true })}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Fresh Migration (Clear & Seed)
            </Button>
            
            <Button 
              onClick={clearDatabase}
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Database
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">Processing...</span>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.message}
                </span>
              </div>
              
              {result.seeded && (
                <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Seeded: {result.seeded.countries} countries, {result.seeded.presets} presets
                </div>
              )}
              
              {result.final_counts && (
                <div className="text-sm text-green-700 dark:text-green-300 mb-2">
                  Total: {result.final_counts.countries} countries, {result.final_counts.presets} presets
                </div>
              )}
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">Errors:</span>
                  <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside mt-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
