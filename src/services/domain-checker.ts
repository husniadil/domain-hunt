import { DomainResult, DomainCheckConfig } from '@/types/domain';

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
  const results: DomainResult[] = [];

  // Check all domain + TLD combinations
  for (const domain of domains) {
    for (const tld of tlds) {
      const result = await checkDomain(domain, tld, config);
      results.push(result);
    }
  }

  return results;
}
