import { useState, useEffect, useMemo } from 'react';
import { UnifiedDomainResult } from '@/types/domain';
import {
  loadHomepageState,
  saveHomepageState,
  clearHomepageState,
} from '@/services/homepage-state-service';

/**
 * Custom hook for managing homepage state with persistence
 * Loads saved state on mount and automatically saves changes
 * @returns Object containing state variables, setters, and clearState function
 */
export function useHomepageState() {
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [unifiedResult, setUnifiedResult] =
    useState<UnifiedDomainResult | null>(null);

  // New category UI state
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadHomepageState();
    if (savedState) {
      if (savedState.domains && savedState.domains.length > 0) {
        setDomains(savedState.domains);
      }
      if (savedState.selectedTlds && savedState.selectedTlds.length > 0) {
        setSelectedTlds(savedState.selectedTlds);
      }
      if (savedState.unifiedResult) {
        setUnifiedResult(savedState.unifiedResult);
      }
      // Load category UI state with defaults
      if (savedState.collapsedCategories) {
        setCollapsedCategories(savedState.collapsedCategories);
      }
      if (savedState.showAllCategories !== undefined) {
        setShowAllCategories(savedState.showAllCategories);
      }
    }
  }, []);

  // Save state whenever relevant data changes
  useEffect(() => {
    // Save state if we have meaningful data OR if UI state has changed
    // This ensures UI preferences persist even when main data is empty
    if (
      domains.length > 0 ||
      selectedTlds.length > 0 ||
      unifiedResult ||
      collapsedCategories.length > 0 ||
      showAllCategories
    ) {
      saveHomepageState({
        domains,
        selectedTlds,
        unifiedResult,
        collapsedCategories,
        showAllCategories,
      });
    }
  }, [
    domains,
    selectedTlds,
    unifiedResult,
    collapsedCategories,
    showAllCategories,
  ]);

  const clearState = () => {
    setDomains([]);
    setSelectedTlds([]);
    setUnifiedResult(null);
    setCollapsedCategories([]);
    setShowAllCategories(false);
    clearHomepageState();
  };

  return useMemo(
    () => ({
      domains,
      selectedTlds,
      unifiedResult,
      collapsedCategories,
      showAllCategories,
      setDomains,
      setSelectedTlds,
      setUnifiedResult,
      setCollapsedCategories,
      setShowAllCategories,
      clearState,
    }),
    [
      domains,
      selectedTlds,
      unifiedResult,
      collapsedCategories,
      showAllCategories,
    ]
  );
}
