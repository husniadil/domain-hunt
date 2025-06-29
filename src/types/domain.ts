// Domain availability status types
export type DomainStatus = 'available' | 'taken' | 'error' | 'checking';

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
