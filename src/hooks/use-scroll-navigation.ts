'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  loadHomepageState,
  saveHomepageState,
} from '@/services/homepage-state-service';

export type NavigationSection = 'header' | 'input' | 'results';

const SECTIONS: NavigationSection[] = ['header', 'input', 'results'];

// Constants for retry mechanism
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 100;

export interface ScrollNavigationState {
  currentSection: NavigationSection;
  availableSections: NavigationSection[];
  hasResults: boolean;
}

export interface ScrollNavigationActions {
  scrollToSection: (section: NavigationSection) => void;
  navigateUp: () => void;
  navigateDown: () => void;
  canGoUp: boolean;
  canGoDown: boolean;
}

export const useScrollNavigation = (): ScrollNavigationState &
  ScrollNavigationActions => {
  const [currentSection, setCurrentSection] =
    useState<NavigationSection>('header');
  const [hasResults, setHasResults] = useState(false);
  const [hasRestoredScroll, setHasRestoredScroll] = useState(false);

  // Use ref to hold latest scrollToSection to avoid dependency issues
  const scrollToSectionRef = useRef<(section: NavigationSection) => void>(
    () => {}
  );

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
  const availableSections: NavigationSection[] = useMemo(() => {
    return hasResults ? SECTIONS : ['header', 'input'];
  }, [hasResults]);

  // Shared utility for calculating scroll position
  const calculateScrollPosition = useCallback(
    (selector: string, offset: number) => {
      const element = document.querySelector(selector);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const targetScrollY = absoluteElementTop - offset;
        return {
          targetScrollY,
          absoluteElementTop,
          elementHeight: elementRect.height,
        };
      }
      return null;
    },
    []
  );

  // Calculate scroll position for results section
  const calculateScrollToResults = useCallback(() => {
    return calculateScrollPosition('[data-section="results"]', 60);
  }, [calculateScrollPosition]);

  // Main scroll to section function
  const scrollToSection = useCallback(
    (section: NavigationSection) => {
      if (section === 'header') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        return;
      }

      const element = document.querySelector(`[data-section="${section}"]`);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;

        // For input section, scroll to TLD search input
        if (section === 'input') {
          const tldSearchInput = element.querySelector(
            'input[placeholder*="Search TLDs by extension"]'
          );

          if (tldSearchInput) {
            const inputRect = tldSearchInput.getBoundingClientRect();
            const inputTop = inputRect.top + window.pageYOffset;
            const offset = 80;
            const targetScrollY = inputTop - offset;

            window.scrollTo({
              top: targetScrollY,
              behavior: 'smooth',
            });
          } else {
            // Fallback: look for TLD selector title
            const tldSelectorTitle = Array.from(
              element.querySelectorAll('*')
            ).find(el => el.textContent?.includes('Select TLD Extensions'));

            if (tldSelectorTitle) {
              const titleRect = tldSelectorTitle.getBoundingClientRect();
              const titleTop = titleRect.top + window.pageYOffset;
              const offset = 60;
              const targetScrollY = titleTop - offset;

              window.scrollTo({
                top: targetScrollY,
                behavior: 'smooth',
              });
            } else {
              // Final fallback: skip domain pills area
              const offset = 50;
              const targetScrollY = absoluteElementTop + 300 - offset;

              window.scrollTo({
                top: targetScrollY,
                behavior: 'smooth',
              });
            }
          }
        }
        // For results section, use consistent calculation with retry
        else if (section === 'results') {
          let retries = 0;
          const scrollToResults = () => {
            const calculation = calculateScrollToResults();
            if (calculation) {
              window.scrollTo({
                top: calculation.targetScrollY,
                behavior: 'smooth',
              });
            } else if (retries < MAX_RETRIES) {
              retries++;
              setTimeout(scrollToResults, RETRY_DELAY_MS);
            }
          };

          scrollToResults();
        } else {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      }
    },
    [calculateScrollToResults]
  );

  // Update ref with latest scrollToSection
  scrollToSectionRef.current = scrollToSection;

  // Restore scroll position on page load
  useEffect(() => {
    if (!hasRestoredScroll) {
      const savedState = loadHomepageState();
      const scrollPosition = savedState?.scrollPosition;

      if (scrollPosition && scrollPosition.currentSection) {
        // For results section, wait for DOM to be ready
        if (scrollPosition.currentSection === 'results') {
          const checkAndRestore = () => {
            const resultsSection = document.querySelector(
              '[data-section="results"]'
            );
            if (resultsSection) {
              // Wait longer for content to fully load and stabilize
              setTimeout(() => {
                scrollToSectionRef.current?.(scrollPosition.currentSection);
                setHasRestoredScroll(true);
              }, 500); // Increased delay to match content loading
            } else {
              setTimeout(checkAndRestore, 200);
            }
          };
          setTimeout(checkAndRestore, 300);
        } else {
          // For header/input sections, restore immediately
          setTimeout(() => {
            scrollToSectionRef.current?.(scrollPosition.currentSection);
            setHasRestoredScroll(true);
          }, 100);
        }
      } else {
        setHasRestoredScroll(true);
      }
    }
  }, [hasRestoredScroll]);

  // Save scroll position when section changes
  useEffect(() => {
    if (hasRestoredScroll) {
      const currentState = loadHomepageState();
      if (currentState) {
        saveHomepageState({
          domains: currentState.domains || [],
          selectedTlds: currentState.selectedTlds || [],
          unifiedResult: currentState.unifiedResult || null,
          collapsedCategories: currentState.collapsedCategories || [],
          showAllCategories: currentState.showAllCategories || false,
          searchQuery: currentState.searchQuery,
          scrollPosition: {
            currentSection,
          },
        });
      }
    }
  }, [currentSection, hasRestoredScroll]);

  // Track scroll position and update current section
  useEffect(() => {
    const handleScroll = () => {
      const headerSection = document.querySelector('[data-section="header"]');
      const inputSection = document.querySelector('[data-section="input"]');
      const resultsSection = document.querySelector('[data-section="results"]');

      if (!headerSection || !inputSection) return;

      const scrollY = window.scrollY;
      const inputTop = inputSection.getBoundingClientRect().top + scrollY;
      const resultsTop = resultsSection
        ? resultsSection.getBoundingClientRect().top + scrollY
        : null;

      let currentSectionState: NavigationSection = 'header';

      // Check results section
      if (
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
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation actions
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

  const canGoUp = availableSections.indexOf(currentSection) > 0;
  const canGoDown =
    availableSections.indexOf(currentSection) < availableSections.length - 1;

  return {
    currentSection,
    availableSections,
    hasResults,
    scrollToSection,
    navigateUp,
    navigateDown,
    canGoUp,
    canGoDown,
  };
};

// Shared utility for external usage
const calculateScrollPositionStatic = (selector: string, offset: number) => {
  const element = document.querySelector(selector);
  if (element) {
    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const targetScrollY = absoluteElementTop - offset;
    return {
      targetScrollY,
      absoluteElementTop,
      elementHeight: elementRect.height,
    };
  }
  return null;
};

// Export for external usage (e.g., homepage)
export const calculateScrollToResults = () => {
  return calculateScrollPositionStatic('[data-section="results"]', 60);
};
