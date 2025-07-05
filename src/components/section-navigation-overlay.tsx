'use client';

import { useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScrollNavigation } from '@/hooks/use-scroll-navigation';

interface SectionNavigationOverlayProps {
  className?: string;
}

// Re-export untuk backward compatibility
export { calculateScrollToResults } from '@/hooks/use-scroll-navigation';

export function SectionNavigationOverlay({
  className,
}: SectionNavigationOverlayProps) {
  const {
    currentSection,
    availableSections,
    navigateUp,
    navigateDown,
    canGoUp,
    canGoDown,
  } = useScrollNavigation();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return; // Don't interfere with input fields
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateUp();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateUp, navigateDown]);

  // Always show if there are more than one sections
  if (availableSections.length <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-2',
        className
      )}
    >
      {/* Up Arrow */}
      <Button
        variant="secondary"
        size="sm"
        onClick={navigateUp}
        disabled={!canGoUp}
        className={cn(
          'h-10 w-10 rounded-full shadow-lg backdrop-blur-sm',
          'hover:scale-110 transition-all duration-200',
          'bg-background/80 hover:bg-background/90',
          'border border-border/50',
          'sm:h-12 sm:w-12', // Larger on desktop
          !canGoUp && 'opacity-40 cursor-not-allowed'
        )}
        aria-label="Go to previous section"
      >
        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
      </Button>

      {/* Section Indicator */}
      <div className="flex flex-col items-center space-y-1 py-2">
        {availableSections.map(section => (
          <div
            key={section}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-200',
              'bg-muted-foreground/30',
              currentSection === section && 'bg-primary w-3 h-3'
            )}
          />
        ))}
      </div>

      {/* Down Arrow */}
      <Button
        variant="secondary"
        size="sm"
        onClick={navigateDown}
        disabled={!canGoDown}
        className={cn(
          'h-10 w-10 rounded-full shadow-lg backdrop-blur-sm',
          'hover:scale-110 transition-all duration-200',
          'bg-background/80 hover:bg-background/90',
          'border border-border/50',
          'sm:h-12 sm:w-12', // Larger on desktop
          !canGoDown && 'opacity-40 cursor-not-allowed'
        )}
        aria-label="Go to next section"
      >
        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
      </Button>
    </div>
  );
}
