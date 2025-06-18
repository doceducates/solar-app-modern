'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useDatabaseSeeding } from '@/hooks/useDatabase';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

export function DatabaseInitializer({ children }: DatabaseInitializerProps) {
  const { seeding, status, error, seedDatabase } = useDatabaseSeeding();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showInitializer, setShowInitializer] = useState(false);

  useEffect(() => {
    if (status) {
      if (status.needsSeeding) {
        setShowInitializer(true);
      } else {
        setIsInitialized(true);
      }
    }
  }, [status]);

  const handleSeedDatabase = async () => {
    try {
      await seedDatabase();
      setIsInitialized(true);
      setShowInitializer(false);
    } catch (err) {
      console.error('Failed to seed database:', err);
    }
  };

  if (showInitializer && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <Database className="w-6 h-6 text-blue-600" />
              Database Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {error ? (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  The solar calculator database needs to be initialized with panel presets and country data.
                </p>
                
                {status && (
                  <div className="text-sm text-muted-foreground">
                    <p>Countries: {status.countries}</p>
                    <p>Panel Presets: {status.presets}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleSeedDatabase} 
                  disabled={seeding}
                  className="w-full"
                >
                  {seeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up database...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Initialize Database
                    </>
                  )}
                </Button>
                
                {seeding && (
                  <p className="text-xs text-muted-foreground">
                    This may take a few moments...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInitialized && status && !status.needsSeeding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Database Ready!</h3>
            <p className="text-muted-foreground mb-4">
              Solar calculator database is properly initialized.
            </p>
            <Button onClick={() => setIsInitialized(true)} className="w-full">
              Continue to Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
