'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  saveHomepageState,
  loadHomepageState,
} from '@/services/homepage-state-service';

interface SectionNavigationOverlayProps {
  className?: string;
}

type Section = 'header' | 'input' | 'results' | 'bottom';

const SECTIONS: Section[] = ['header', 'input', 'results', 'bottom'];

export function SectionNavigationOverlay({
  className,
}: SectionNavigationOverlayProps) {
  const [currentSection, setCurrentSection] = useState<Section>('header');
  const [isVisible, setIsVisible] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);

  // Detect if results section exists
  useEffect(() => {
    const checkResults = () => {
      const resultsSection = document.querySelector('[data-section="results"]');
      setHasResults(!!resultsSection);
    };

    checkResults();
    const observer = new MutationObserver(checkResults);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Get available sections based on content
  const availableSections: Section[] = useMemo(() => {
    return hasResults ? SECTIONS : ['header', 'input', 'bottom'];
  }, [hasResults]);

  // Define scrollToSection function first (will be used in restore effect)
  const scrollToSection = useCallback((section: Section) => {
    if (section === 'header') {
      // First section - scroll all the way to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      return;
    }

    if (section === 'bottom') {
      // Last section - scroll all the way to bottom
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
      return;
    }

    const element = document.querySelector(`[data-section="${section}"]`);
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;

      // For input section, scroll to show the TLD search input clearly (below the domain pills)
      if (section === 'input') {
        // Look for the TLD search input with the specific placeholder text
        const tldSearchInput = element.querySelector(
          'input[placeholder*="Search TLDs by extension"]'
        );

        if (tldSearchInput) {
          const inputRect = tldSearchInput.getBoundingClientRect();
          const inputTop = inputRect.top + window.pageYOffset;
          const offset = 80; // Less offset to focus more on the input
          window.scrollTo({
            top: inputTop - offset,
            behavior: 'smooth',
          });
        } else {
          // Fallback: look for "Select TLD Extensions" text and scroll to it
          const tldSelectorTitle = Array.from(
            element.querySelectorAll('*')
          ).find(el => el.textContent?.includes('Select TLD Extensions'));

          if (tldSelectorTitle) {
            const titleRect = tldSelectorTitle.getBoundingClientRect();
            const titleTop = titleRect.top + window.pageYOffset;
            const offset = 60; // Show title with some context
            window.scrollTo({
              top: titleTop - offset,
              behavior: 'smooth',
            });
          } else {
            // Final fallback: scroll significantly down from the start of input section
            // to skip the domain pills entirely
            const offset = 50;
            window.scrollTo({
              top: absoluteElementTop + 300 - offset, // Skip domain pills area
              behavior: 'smooth',
            });
          }
        }
      }
      // For results section, add extra offset to show the title properly
      else if (section === 'results') {
        const offset = 60; // Add 60px offset to show title
        window.scrollTo({
          top: absoluteElementTop - offset,
          behavior: 'smooth',
        });
      } else {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }
    }
  }, []);

  // Restore scroll position on page load
  useEffect(() => {
    if (!hasRestoredScroll) {
      const savedState = loadHomepageState();
      const scrollPosition = savedState?.scrollPosition;

      if (scrollPosition && scrollPosition.overlayVisible) {
        // Only restore if overlay was visible when saved
        setTimeout(() => {
          scrollToSection(scrollPosition.currentSection);
          setHasRestoredScroll(true);
        }, 100); // Small delay to ensure DOM is ready
      } else {
        setHasRestoredScroll(true);
      }
    }
  }, [hasRestoredScroll, scrollToSection]);

  // Save scroll position when section or visibility changes
  useEffect(() => {
    if (hasRestoredScroll) {
      // Get current homepage state to preserve other data
      const currentState = loadHomepageState();
      if (currentState) {
        saveHomepageState({
          ...currentState,
          scrollPosition: {
            currentSection,
            overlayVisible: isVisible,
          },
        });
      }
    }
  }, [currentSection, isVisible, hasRestoredScroll]);

  // Track scroll position and update current section
  useEffect(() => {
    const handleScroll = () => {
      const headerSection = document.querySelector('[data-section="header"]');
      const inputSection = document.querySelector('[data-section="input"]');
      const resultsSection = document.querySelector('[data-section="results"]');

      if (!headerSection || !inputSection) return;

      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Determine current section first
      const inputTop = inputSection.getBoundingClientRect().top + scrollY;
      const resultsTop = resultsSection
        ? resultsSection.getBoundingClientRect().top + scrollY
        : null;

      let currentSectionState: Section = 'header';

      // Check if we're near the bottom (within 200px of bottom)
      if (scrollY + viewportHeight >= documentHeight - 200) {
        currentSectionState = 'bottom';
      }
      // Check results section
      else if (
        resultsSection &&
        resultsTop !== null &&
        scrollY >= resultsTop - 100
      ) {
        currentSectionState = 'results';
      }
      // Check input section
      else if (scrollY >= inputTop - 100) {
        currentSectionState = 'input';
      }
      // Default to header section
      else {
        currentSectionState = 'header';
      }

      setCurrentSection(currentSectionState);

      // Show/hide overlay - only show if we're not at the very top (header section)
      // and there's enough content to scroll through
      const shouldShow =
        currentSectionState !== 'header' &&
        documentHeight > viewportHeight * 1.5;
      setIsVisible(shouldShow);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateUp = useCallback(() => {
    const currentIndex = availableSections.indexOf(currentSection);
    if (currentIndex > 0) {
      const previousSection = availableSections[currentIndex - 1];
      scrollToSection(previousSection);
    }
  }, [currentSection, availableSections, scrollToSection]);

  const navigateDown = useCallback(() => {
    const currentIndex = availableSections.indexOf(currentSection);
    if (currentIndex < availableSections.length - 1) {
      const nextSection = availableSections[currentIndex + 1];
      scrollToSection(nextSection);
    }
  }, [currentSection, availableSections, scrollToSection]);

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

  const canGoUp = availableSections.indexOf(currentSection) > 0;
  const canGoDown =
    availableSections.indexOf(currentSection) < availableSections.length - 1;

  // Don't show if there's only one section or if not visible
  if (availableSections.length <= 1 || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col space-y-2',
        'transition-all duration-300 ease-in-out',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
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
