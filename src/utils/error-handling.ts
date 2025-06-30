// Error types and categorization for better user feedback

export enum ErrorCategory {
  NETWORK = 'network',
  DNS = 'dns',
  WHOIS = 'whois',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

export interface CategorizedError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  retryable: boolean;
  suggestedAction?: string;
}

/**
 * Categorizes an error and provides user-friendly messaging
 */
export function categorizeError(error: Error | string): CategorizedError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerError = errorMessage.toLowerCase();

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return {
      category: ErrorCategory.NETWORK,
      message: errorMessage,
      userMessage:
        'Network connection failed. Please check your internet connection.',
      retryable: true,
      suggestedAction: 'Check your internet connection and try again.',
    };
  }

  // DNS errors
  if (
    lowerError.includes('nxdomain') ||
    lowerError.includes('notfound') ||
    lowerError.includes('dns')
  ) {
    return {
      category: ErrorCategory.DNS,
      message: errorMessage,
      userMessage:
        'DNS lookup failed. This might indicate the domain is available.',
      retryable: true,
      suggestedAction:
        'This is normal for available domains. If unexpected, try again.',
    };
  }

  // Whois errors
  if (lowerError.includes('whois')) {
    return {
      category: ErrorCategory.WHOIS,
      message: errorMessage,
      userMessage: 'Whois lookup failed. The domain availability is uncertain.',
      retryable: true,
      suggestedAction: 'Try again or check the domain manually.',
    };
  }

  // Timeout errors
  if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      category: ErrorCategory.TIMEOUT,
      message: errorMessage,
      userMessage:
        'Request timed out. The service might be slow or unavailable.',
      retryable: true,
      suggestedAction: 'Wait a moment and try again.',
    };
  }

  // Rate limiting
  if (
    lowerError.includes('rate limit') ||
    lowerError.includes('too many requests') ||
    lowerError.includes('429')
  ) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      message: errorMessage,
      userMessage:
        'Too many requests. Please wait before checking more domains.',
      retryable: true,
      suggestedAction: 'Wait a minute before trying again.',
    };
  }

  // Validation errors
  if (
    lowerError.includes('invalid') ||
    lowerError.includes('validation') ||
    lowerError.includes('required')
  ) {
    return {
      category: ErrorCategory.VALIDATION,
      message: errorMessage,
      userMessage: 'Invalid input. Please check your domain name format.',
      retryable: false,
      suggestedAction: 'Check the domain name format and try again.',
    };
  }

  // Server errors
  if (
    lowerError.includes('server') ||
    lowerError.includes('500') ||
    lowerError.includes('503')
  ) {
    return {
      category: ErrorCategory.SERVER,
      message: errorMessage,
      userMessage: 'Server error. Our service is temporarily unavailable.',
      retryable: true,
      suggestedAction: 'Try again in a few minutes.',
    };
  }

  // Default unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    message: errorMessage,
    userMessage: 'An unexpected error occurred.',
    retryable: true,
    suggestedAction: 'Try again or contact support if the problem persists.',
  };
}

/**
 * Checks if an error is retryable based on its category
 */
export function isRetryableError(error: Error | string): boolean {
  const categorized = categorizeError(error);
  return categorized.retryable;
}

/**
 * Gets a user-friendly error message
 */
export function getUserErrorMessage(error: Error | string): string {
  const categorized = categorizeError(error);
  return categorized.userMessage;
}

/**
 * Gets suggested action for an error
 */
export function getErrorSuggestedAction(
  error: Error | string
): string | undefined {
  const categorized = categorizeError(error);
  return categorized.suggestedAction;
}

/**
 * Formats error for toast notification
 */
export function formatErrorForToast(error: Error | string): {
  title: string;
  description: string;
} {
  const categorized = categorizeError(error);

  const titles: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: 'Network Error',
    [ErrorCategory.DNS]: 'DNS Lookup Failed',
    [ErrorCategory.WHOIS]: 'Whois Lookup Failed',
    [ErrorCategory.TIMEOUT]: 'Request Timeout',
    [ErrorCategory.RATE_LIMIT]: 'Rate Limited',
    [ErrorCategory.VALIDATION]: 'Invalid Input',
    [ErrorCategory.SERVER]: 'Server Error',
    [ErrorCategory.UNKNOWN]: 'Error',
  };

  return {
    title: titles[categorized.category],
    description:
      categorized.userMessage +
      (categorized.suggestedAction ? ` ${categorized.suggestedAction}` : ''),
  };
}

/**
 * Determines retry delay based on error type
 */
export function getRetryDelay(error: Error | string, attempt: number): number {
  const categorized = categorizeError(error);

  // Base delays in milliseconds
  const baseDelays: Record<ErrorCategory, number> = {
    [ErrorCategory.NETWORK]: 1000, // 1 second
    [ErrorCategory.DNS]: 500, // 0.5 seconds
    [ErrorCategory.WHOIS]: 2000, // 2 seconds
    [ErrorCategory.TIMEOUT]: 3000, // 3 seconds
    [ErrorCategory.RATE_LIMIT]: 10000, // 10 seconds
    [ErrorCategory.VALIDATION]: 0, // No retry for validation errors
    [ErrorCategory.SERVER]: 5000, // 5 seconds
    [ErrorCategory.UNKNOWN]: 2000, // 2 seconds
  };

  const baseDelay = baseDelays[categorized.category];

  // No retry for validation errors
  if (categorized.category === ErrorCategory.VALIDATION) {
    return 0;
  }

  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Random 0-1 second jitter

  return exponentialDelay + jitter;
}

/**
 * Checks if the user is offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Creates an offline error
 */
export function createOfflineError(): CategorizedError {
  return {
    category: ErrorCategory.NETWORK,
    message: 'No internet connection',
    userMessage: 'You appear to be offline. Check your internet connection.',
    retryable: true,
    suggestedAction: 'Connect to the internet and try again.',
  };
}
