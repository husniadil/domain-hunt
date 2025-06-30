'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error?: Error;
    retry: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      return (
        <DefaultErrorFallback error={this.state.error} retry={this.retry} />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 border border-red-200 bg-red-50 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600 text-sm mb-4">
          An unexpected error occurred. Please try again.
        </p>
        {isDevelopment && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-red-700 hover:text-red-800">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-40 text-red-800">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      <Button onClick={retry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}

// Domain-specific error fallback for domain checking operations
interface DomainErrorFallbackProps {
  retry: () => void;
}

function DomainErrorFallback({ retry }: DomainErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 border border-yellow-200 bg-yellow-50 rounded-lg">
      <AlertTriangle className="w-8 h-8 text-yellow-600" />
      <div>
        <h4 className="text-md font-medium text-yellow-800 mb-1">
          Domain Check Failed
        </h4>
        <p className="text-yellow-700 text-sm">
          Unable to complete domain lookup. Please check your connection and try
          again.
        </p>
      </div>
      <Button onClick={retry} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry Check
      </Button>
    </div>
  );
}

export { ErrorBoundary, DefaultErrorFallback, DomainErrorFallback };
