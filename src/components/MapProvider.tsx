import React, { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function MapProvider({ children, ...props }: any) {
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // Catch global Google Maps auth failure
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps Authentication/Quota Failed");
      setAuthFailed(true);
      toast.error("Maps limit reached. Map features are temporarily disabled.");
    };

    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  if (authFailed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#111113] rounded-xl border border-slate-200 dark:border-slate-800 w-full h-full min-h-[300px]">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Maps Unavailable</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          The Maps quota limit has been reached for this demo.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <APIProvider {...props}>
        {children}
      </APIProvider>
    </ErrorBoundary>
  );
}
