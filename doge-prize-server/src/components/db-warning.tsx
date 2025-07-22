"use client";

import { useEffect, useState, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

interface DbStatus {
  status: string;
  isConfigured: boolean;
  hasUser: boolean;
  hasMigrations: boolean;
  error?: string;
}

export function DbWarning({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/db-status");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus({
          status: "error",
          isConfigured: false,
          hasUser: false,
          hasMigrations: false,
          error: "Failed to check database status",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (isLoading || !status) {
    return null;
  }

  if (status.isConfigured && status.hasUser && status.hasMigrations) {
    return <>{children}</>;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Database Configuration Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          The database needs to be configured before the application can function properly.
          Please run the following commands from the <code className="bg-muted px-1 rounded">doge-prize-server</code> directory:
        </p>
        <div className="space-y-1">
          {!status.hasMigrations && (
            <p>• Run database migrations: <code className="bg-muted px-1 rounded">npx prisma migrate dev</code></p>
          )}
          {!status.hasUser && (
            <p>• Initialize the database: <code className="bg-muted px-1 rounded">npm run init-db</code></p>
          )}
          {status.error && (
            <p>• Error: {status.error}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Check Again
        </Button>
      </AlertDescription>
    </Alert>
  );
} 