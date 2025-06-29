// Domain availability status types
export type DomainStatus = 'available' | 'taken' | 'error';

// Result of a single domain + TLD check
export interface DomainResult {
  domain: string;
  tld: string;
  status: DomainStatus;
  error?: string;
  checkedAt: Date;
}

// Configuration for domain checking
export interface DomainCheckConfig {
  timeout?: number; // DNS lookup timeout in ms
  retries?: number; // Number of retry attempts
}

// Batch checking results (for future extensibility)
export interface BatchDomainResult {
  domain: string;
  results: DomainResult[];
  totalChecked: number;
  completedAt: Date;
}

// Progress tracking for concurrent lookups
export interface DomainLookupProgress {
  total: number;
  completed: number;
  failed: number;
  remaining: number;
  percentage: number;
}

// Result for multi-TLD concurrent lookup of a single domain
export interface MultiTldResult {
  domain: string;
  results: DomainResult[];
  successful: DomainResult[];
  failed: DomainResult[];
  progress: DomainLookupProgress;
  startedAt: Date;
  completedAt: Date;
  totalDuration: number; // in milliseconds
}

// Configuration for concurrent multi-TLD lookup
export interface ConcurrentLookupConfig extends DomainCheckConfig {
  maxConcurrency?: number; // Max concurrent requests (default: 10)
  progressCallback?: (progress: DomainLookupProgress) => void;
}
