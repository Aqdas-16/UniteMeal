// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error.message || '';
    const isMapError = msg.includes('Map') || msg.includes('Script error') || msg.includes('google is not defined') || msg.includes('keys');
    if (!isMapError) {
      console.error('Uncaught error:', error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const isMapError = this.state.errorMessage.includes('Map') || 
                         this.state.errorMessage.includes('Script error') || 
                         this.state.errorMessage.includes('google is not defined') ||
                         this.state.errorMessage.includes('keys'); // AdvancedMarker keys error
                         
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#111113] rounded-xl border border-slate-200 dark:border-slate-800 w-full h-full min-h-[300px]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isMapError ? 'Maps temporarily unavailable' : 'Something went wrong'}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            {isMapError 
              ? 'The Google Maps quota limit has been reached for this demo. The rest of the application will continue to function normally.'
              : 'An unexpected error occurred in this component.'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
