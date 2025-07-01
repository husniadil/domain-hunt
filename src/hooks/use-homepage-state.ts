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
    }
  }, []);

  // Save state whenever relevant data changes
  useEffect(() => {
    // Only save if we have meaningful data
    if (domains.length > 0 || selectedTlds.length > 0 || unifiedResult) {
      saveHomepageState({
        domains,
        selectedTlds,
        unifiedResult,
      });
    }
  }, [domains, selectedTlds, unifiedResult]);

  const clearState = () => {
    setDomains([]);
    setSelectedTlds([]);
    setUnifiedResult(null);
    clearHomepageState();
  };

  return useMemo(
    () => ({
      domains,
      selectedTlds,
      unifiedResult,
      setDomains,
      setSelectedTlds,
      setUnifiedResult,
      clearState,
    }),
    [domains, selectedTlds, unifiedResult]
  );
}
