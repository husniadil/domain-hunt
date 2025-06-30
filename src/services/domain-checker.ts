import {
  DomainResult,
  DomainCheckConfig,
  MultiTldResult,
  ConcurrentLookupConfig,
  DomainLookupProgress,
  UnifiedDomainResult,
  UnifiedLookupConfig,
  UnifiedLookupProgress,
} from '@/types/domain';
import {
  categorizeError,
  getRetryDelay,
  isOffline,
  createOfflineError,
} from '@/utils/error-handling';

// Default configuration for domain checking
const DEFAULT_CONFIG: Required<DomainCheckConfig> = {
  timeout: 5000, // 5 seconds timeout
  retries: 2, // Retry twice on failure
};

/**
 * Helper function to execute promises with concurrency limit
 * Processes promises in batches to avoid overwhelming the API
 */
async function executeBatchedPromises<T>(
  promiseFactories: (() => Promise<T>)[],
  maxConcurrency: number = 10
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < promiseFactories.length; i += maxConcurrency) {
    const batch = promiseFactories.slice(i, i + maxConcurrency);
    const batchPromises = batch.map(factory => factory());
    const batchResults = await Promise.allSettled(batchPromises);

    // Convert settled results to actual results (handle rejections)
    const processedResults = batchResults.map(settled => {
      if (settled.status === 'fulfilled') {
        return settled.value;
      } else {
        // This should not happen as our promises handle their own errors
        throw settled.reason;
      }
    });

    results.push(...processedResults);
  }

  return results;
}

/**
 * Performs DNS lookup for a single domain + TLD combination
 *
 * @param domain - Domain name without TLD (e.g., 'google')
 * @param tld - TLD extension (e.g., '.com')
 * @param config - Optional configuration for timeout and retries
 * @returns Promise<DomainResult> - Result with status: 'available' | 'taken' | 'error'
 */
export async function checkDomain(
  domain: string,
  tld: string,
  config: DomainCheckConfig = {}
): Promise<DomainResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Basic validation
  if (!domain || !tld) {
    return {
      domain,
      tld,
      status: 'error',
      error: 'Domain and TLD are required',
      checkedAt: new Date(),
    };
  }

  // Validate domain format
  if (!/^[a-zA-Z0-9-]+$/.test(domain)) {
    return {
      domain,
      tld,
      status: 'error',
      error: 'Invalid domain format',
      checkedAt: new Date(),
    };
  }

  // Check if offline
  if (isOffline()) {
    const offlineError = createOfflineError();
    return {
      domain,
      tld,
      status: 'error',
      error: offlineError.userMessage,
      checkedAt: new Date(),
    };
  }

  let lastError: Error | undefined;

  // Retry logic with intelligent delay
  for (let attempt = 1; attempt <= finalConfig.retries + 1; attempt++) {
    try {
      // Call API route for DNS lookup
      const response = await fetch('/api/domain-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, tld }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      const result = await response.json();
      return {
        ...result,
        checkedAt: new Date(result.checkedAt),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      lastError = err;

      // Check if we should retry
      const categorized = categorizeError(err);

      if (attempt <= finalConfig.retries && categorized.retryable) {
        // Calculate intelligent retry delay
        const delay = getRetryDelay(err, attempt);
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If not retryable or retries exhausted, break
      break;
    }
  }

  // All retries exhausted or non-retryable error, return error with categorized message
  const categorized = categorizeError(lastError || 'DNS lookup failed');
  return {
    domain,
    tld,
    status: 'error',
    error: categorized.userMessage,
    checkedAt: new Date(),
  };
}

/**
 * Retry a failed domain check
 */
export async function retryDomainCheck(
  domain: string,
  tld: string,
  config: DomainCheckConfig = {}
): Promise<DomainResult> {
  // Use standard checkDomain with enhanced error handling
  return checkDomain(domain, tld, config);
}

/**
 * Check multiple domains against multiple TLDs (legacy compatibility)
 *
 * NOTE: This function maintains the original flattened promise ordering for backward compatibility.
 * Index calculation follows the pattern: index = domainIndex * tlds.length + tldIndex
 * where domainIndex = Math.floor(index / tlds.length), tldIndex = index % tlds.length
 *
 * @deprecated Use checkDomainsUnified for better progress tracking and features
 * @param domains - Array of domain names
 * @param tlds - Array of TLD extensions
 * @param config - Optional configuration
 * @returns Promise<DomainResult[]> - Array of results for all combinations
 */
export async function checkMultipleDomains(
  domains: string[],
  tlds: string[],
  config: DomainCheckConfig = {}
): Promise<DomainResult[]> {
  // Use unified function and flatten results for backward compatibility
  const unifiedResult = await checkDomainsUnified(domains, tlds, config);
  return Array.from(unifiedResult.resultsByDomain.values()).flatMap(
    r => r.results
  );
}

/**
 * Performs concurrent DNS lookup for a single domain across multiple TLDs
 * Uses Promise.allSettled to handle partial failures gracefully
 *
 * @param domain - Domain name without TLD (e.g., 'google')
 * @param tlds - Array of TLD extensions (e.g., ['.com', '.net', '.org'])
 * @param config - Optional configuration with progress tracking
 * @returns Promise<MultiTldResult> - Structured result with successful/failed lookups
 */
export async function checkDomainMultipleTlds(
  domain: string,
  tlds: string[],
  config: ConcurrentLookupConfig & { abortSignal?: AbortSignal } = {}
): Promise<MultiTldResult> {
  const startedAt = new Date();
  const finalConfig = {
    ...DEFAULT_CONFIG,
    maxConcurrency: 10,
    ...config,
  };

  // Basic validation
  if (!domain || !tlds.length) {
    return {
      domain,
      results: [],
      successful: [],
      failed: [],
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
        remaining: 0,
        percentage: 0,
      },
      startedAt,
      completedAt: new Date(),
      totalDuration: 0,
    };
  }

  const total = tlds.length;
  let completed = 0;
  let failed = 0;

  // Progress tracking helper
  const updateProgress = () => {
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progress: DomainLookupProgress = {
      total,
      completed,
      failed,
      remaining,
      percentage,
    };

    // Call progress callback if provided
    if (finalConfig.progressCallback) {
      finalConfig.progressCallback(progress);
    }

    return progress;
  };

  // Create lookup promise factories (not promises yet)
  const lookupFactories = tlds.map(tld => () => {
    return new Promise<DomainResult>(async resolve => {
      try {
        // Check for cancellation before starting each lookup
        if (config.abortSignal?.aborted) {
          throw new Error('Operation cancelled');
        }

        const result = await checkDomain(domain, tld, finalConfig);
        completed++;
        if (result.status === 'error') failed++;
        updateProgress();
        resolve(result);
      } catch (error) {
        completed++;
        failed++;
        updateProgress();
        // Return error result if promise itself fails
        resolve({
          domain,
          tld,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error',
          checkedAt: new Date(),
        });
      }
    });
  });

  // Execute with concurrency limiting
  const results = await executeBatchedPromises(
    lookupFactories,
    finalConfig.maxConcurrency
  );
  const completedAt = new Date();
  const totalDuration = completedAt.getTime() - startedAt.getTime();

  // Process results - extract successful and failed lookups
  const successful: DomainResult[] = [];
  const failedResults: DomainResult[] = [];

  results.forEach(result => {
    if (result.status === 'error') {
      failedResults.push(result);
    } else {
      successful.push(result);
    }
  });

  const finalProgress = updateProgress();

  return {
    domain,
    results,
    successful,
    failed: failedResults,
    progress: finalProgress,
    startedAt,
    completedAt,
    totalDuration,
  };
}

/**
 * Unified domain checking function - handles single or multiple domains with progress tracking
 *
 * @param domains - Array of domain names to check
 * @param tlds - Array of TLD extensions to check against
 * @param config - Configuration with progress tracking and cancellation support
 * @returns Promise<UnifiedDomainResult> - Comprehensive results with progress tracking
 */
export async function checkDomainsUnified(
  domains: string[],
  tlds: string[],
  config: UnifiedLookupConfig = {}
): Promise<UnifiedDomainResult> {
  const startedAt = new Date();
  const finalConfig = {
    ...DEFAULT_CONFIG,
    maxConcurrency: 10,
    ...config,
  };

  // Validation
  if (!domains.length || !tlds.length) {
    return {
      domains,
      tlds,
      resultsByDomain: new Map(),
      overallProgress: {
        total: 0,
        completed: 0,
        failed: 0,
        remaining: 0,
        percentage: 0,
        currentDomain: undefined,
        domainsCompleted: 0,
        totalDomains: domains.length,
        overallPercentage: 0,
      },
      startedAt,
      completedAt: new Date(),
      totalDuration: 0,
      cancelled: false,
    };
  }

  const resultsByDomain = new Map<string, MultiTldResult>();
  const totalOperations = domains.length * tlds.length;
  let completedOperations = 0;
  let failedOperations = 0;
  let domainsCompleted = 0;
  let cancelled = false;

  // Progress tracking helper
  const updateOverallProgress = (
    currentDomain?: string
  ): UnifiedLookupProgress => {
    const remaining = totalOperations - completedOperations;
    const percentage =
      totalOperations > 0
        ? Math.round((completedOperations / totalOperations) * 100)
        : 0;
    const overallPercentage =
      domains.length > 0
        ? Math.round((domainsCompleted / domains.length) * 100)
        : 0;

    const progress: UnifiedLookupProgress = {
      total: totalOperations,
      completed: completedOperations,
      failed: failedOperations,
      remaining,
      percentage,
      currentDomain,
      domainsCompleted,
      totalDomains: domains.length,
      overallPercentage,
    };

    // Call progress callback if provided
    if (finalConfig.progressCallback) {
      finalConfig.progressCallback(progress);
    }

    return progress;
  };

  // Check cancellation helper
  const checkCancellation = () => {
    if (finalConfig.abortSignal?.aborted) {
      cancelled = true;
      throw new Error('Operation cancelled');
    }
  };

  try {
    // Initialize incremental counters for progress tracking
    let incrementalCompletedOperations = 0;
    let incrementalFailedOperations = 0;

    // Process each domain sequentially to provide clear progress tracking
    for (const domain of domains) {
      checkCancellation();

      // Create progress callback for individual domain
      const domainProgressCallback = (progress: DomainLookupProgress) => {
        // Use base count for finished domains plus current domain progress
        completedOperations =
          incrementalCompletedOperations + progress.completed;
        failedOperations = incrementalFailedOperations + progress.failed;

        updateOverallProgress(domain);
      };

      // Check the domain against all TLDs
      const domainResult = await checkDomainMultipleTlds(domain, tlds, {
        ...finalConfig,
        progressCallback: domainProgressCallback,
        abortSignal: finalConfig.abortSignal,
      });

      checkCancellation();

      resultsByDomain.set(domain, domainResult);
      domainsCompleted++;

      // Update incremental counters with completed domain's final counts
      incrementalCompletedOperations += domainResult.progress.completed;
      incrementalFailedOperations += domainResult.progress.failed;

      // Final update for this domain
      updateOverallProgress();
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Operation cancelled') {
      cancelled = true;
    } else {
      throw error;
    }
  }

  const completedAt = new Date();
  const totalDuration = completedAt.getTime() - startedAt.getTime();
  const finalProgress = updateOverallProgress();

  return {
    domains,
    tlds,
    resultsByDomain,
    overallProgress: finalProgress,
    startedAt,
    completedAt,
    totalDuration,
    cancelled,
  };
}
