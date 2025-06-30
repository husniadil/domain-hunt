// Domain status constants for consistent usage across the application

export const DOMAIN_STATUS = {
  AVAILABLE: 'available',
  TAKEN: 'taken',
  ERROR: 'error',
} as const;

// Default fallback status for unknown/error states
export const DEFAULT_ERROR_STATUS = DOMAIN_STATUS.ERROR;
