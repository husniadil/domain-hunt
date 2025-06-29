import {
  DomainResult,
  DomainCheckConfig,
  MultiTldResult,
  ConcurrentLookupConfig,
  DomainLookupProgress,
} from '@/types/domain';

// Default configuration for domain checking
const DEFAULT_CONFIG: Required<DomainCheckConfig> = {
  timeout: 5000, // 5 seconds timeout
  retries: 2, // Retry twice on failure
};

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

  let lastError: string | undefined;

  // Retry logic
  for (let attempt = 0; attempt <= finalConfig.retries; attempt++) {
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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      lastError = errorMessage;

      // For network errors, retry if we have attempts left
      if (attempt < finalConfig.retries) {
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  // All retries exhausted, return error
  return {
    domain,
    tld,
    status: 'error',
    error: lastError || 'DNS lookup failed',
    checkedAt: new Date(),
  };
}

/**
 * Check multiple domains against multiple TLDs
 *
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
  // Create all domain + TLD combinations and run lookups with Promise.allSettled
  const promises = domains.flatMap(domain =>
    tlds.map(tld => checkDomain(domain, tld, config))
  );

  const results = await Promise.allSettled(promises);

  // Extract successful results and handle failed ones gracefully
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Create error result for failed promise
      // Index mapping: promises are ordered as [domain0+tld0, domain0+tld1, ..., domain1+tld0, ...]
      // So domainIndex = floor(index / tlds.length), tldIndex = index % tlds.length
      const domainIndex = Math.floor(index / tlds.length);
      const tldIndex = index % tlds.length;
      return {
        domain: domains[domainIndex],
        tld: tlds[tldIndex],
        status: 'error' as const,
        error: result.reason?.message || 'Unknown error',
        checkedAt: new Date(),
      };
    }
  });
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
  config: ConcurrentLookupConfig = {}
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

  // Create lookup promises for all TLDs
  const lookupPromises = tlds.map(async tld => {
    try {
      const result = await checkDomain(domain, tld, finalConfig);
      completed++;
      if (result.status === 'error') failed++;
      updateProgress();
      return result;
    } catch (error) {
      completed++;
      failed++;
      updateProgress();
      // Return error result if promise itself fails
      return {
        domain,
        tld,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date(),
      };
    }
  });

  // Use Promise.allSettled to handle partial failures
  const settledResults = await Promise.allSettled(lookupPromises);
  const completedAt = new Date();
  const totalDuration = completedAt.getTime() - startedAt.getTime();

  // Process results - extract successful and failed lookups
  const results: DomainResult[] = [];
  const successful: DomainResult[] = [];
  const failedResults: DomainResult[] = [];

  settledResults.forEach((settledResult, index) => {
    let result: DomainResult;

    if (settledResult.status === 'fulfilled') {
      result = settledResult.value;
    } else {
      // Fallback error result if the promise itself was rejected
      result = {
        domain,
        tld: tlds[index],
        status: 'error',
        error: settledResult.reason?.message || 'Lookup promise rejected',
        checkedAt: new Date(),
      };
    }

    results.push(result);

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
