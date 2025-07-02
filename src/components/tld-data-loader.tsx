'use client';

import { ReactNode } from 'react';
import { useTldData } from '@/hooks/use-tld-data';
import { TLDConfig } from '@/types/tld';

interface TldDataLoaderProps {
  children: (data: TLDConfig) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode | ((error: string) => ReactNode);
}

// Default loading skeleton
const DefaultLoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-10 bg-muted rounded-md"></div>
    <div className="space-y-3">
      <div className="h-6 bg-muted rounded w-1/3"></div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded"></div>
        ))}
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-6 bg-muted rounded w-1/4"></div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

// Default error component
const DefaultErrorComponent = (error: string) => (
  <div className="text-center py-8 space-y-4">
    <div className="text-muted-foreground">
      <p>Failed to load TLD data</p>
      <p className="text-sm">{error}</p>
    </div>
    <button
      onClick={() => window.location.reload()}
      className="text-sm text-primary hover:underline"
    >
      Reload page to try again
    </button>
  </div>
);

/**
 * TLD Data Loader component that handles dynamic loading of TLD data
 * Provides loading states and error handling for the TLD selector
 */
export function TldDataLoader({
  children,
  loadingComponent = <DefaultLoadingSkeleton />,
  errorComponent = DefaultErrorComponent,
}: TldDataLoaderProps) {
  const { data, loading, error } = useTldData();

  if (loading) {
    return <>{loadingComponent}</>;
  }

  if (error) {
    return (
      <>
        {typeof errorComponent === 'function'
          ? errorComponent(error)
          : errorComponent}
      </>
    );
  }

  if (!data) {
    return <>{DefaultErrorComponent('No TLD data available')}</>;
  }

  return <>{children(data)}</>;
}
