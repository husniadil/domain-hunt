import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DomainStatus = 'available' | 'taken' | 'error';

export function getStatusColor(status: DomainStatus | undefined) {
  switch (status) {
    case 'available':
      return 'bg-status-available-bg text-status-available border-status-available-border border-2';
    case 'taken':
      return 'bg-status-taken-bg text-status-taken border-status-taken-border border-2';
    case 'error':
      return 'bg-status-error-bg text-status-error border-status-error-border border-2';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 border-2';
  }
}

export function getStatusFilterClasses(type: string, isActive: boolean) {
  if (!isActive) {
    return {
      activeBackground: 'bg-background border border-border hover:bg-accent',
      activeLabel: 'text-muted-foreground',
      activeCount: 'text-muted-foreground',
    };
  }

  const colorMap = {
    available: {
      activeBackground:
        'bg-status-available-bg border-2 border-status-available-border',
      activeLabel: 'text-status-available',
      activeCount: 'text-status-available font-medium',
    },
    taken: {
      activeBackground:
        'bg-status-taken-bg border-2 border-status-taken-border',
      activeLabel: 'text-status-taken',
      activeCount: 'text-status-taken font-medium',
    },
    error: {
      activeBackground:
        'bg-status-error-bg border-2 border-status-error-border',
      activeLabel: 'text-status-error',
      activeCount: 'text-status-error font-medium',
    },
  };

  return (
    colorMap[type as keyof typeof colorMap] || {
      activeBackground: 'bg-background border border-border',
      activeLabel: 'text-foreground',
      activeCount: 'text-foreground',
    }
  );
}
