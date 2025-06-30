'use client';

import { useState, useEffect } from 'react';
import { DomainInput } from '@/components/domain-input';
import { TldSelector } from '@/components/tld-selector';
import { BookmarkButton } from '@/components/bookmark-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkDomainsUnified } from '@/services/domain-checker';
import {
  DomainResult,
  UnifiedDomainResult,
  UnifiedLookupProgress,
} from '@/types/domain';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// Constants for localStorage keys
const HOMEPAGE_STATE_KEY = 'domain-hunt-homepage-state';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

// Types for persisted state
interface HomepageState {
  domains: string[];
  selectedTlds: string[];
  unifiedResult: UnifiedDomainResult | null;
  savedAt: number;
}

// Helper functions for state persistence
const saveHomepageState = (state: Omit<HomepageState, 'savedAt'>) => {
  if (typeof window !== 'undefined') {
    // Convert Map to serializable format
    const serializableState = {
      ...state,
      unifiedResult: state.unifiedResult
        ? {
            ...state.unifiedResult,
            // Convert Map to array of [key, value] pairs for serialization
            resultsByDomain: Array.from(
              state.unifiedResult.resultsByDomain.entries()
            ),
          }
        : null,
      savedAt: Date.now(),
    };
    localStorage.setItem(HOMEPAGE_STATE_KEY, JSON.stringify(serializableState));
  }
};

const loadHomepageState = (): Partial<HomepageState> | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(HOMEPAGE_STATE_KEY);
    if (!saved) return null;

    const rawState = JSON.parse(saved);

    // Check if state is expired
    const hoursElapsed = (Date.now() - rawState.savedAt) / (1000 * 60 * 60);
    if (hoursElapsed > STATE_EXPIRY_HOURS) {
      localStorage.removeItem(HOMEPAGE_STATE_KEY);
      return null;
    }

    // Convert serialized state back to proper format
    const state: Partial<HomepageState> = {
      domains: rawState.domains,
      selectedTlds: rawState.selectedTlds,
      unifiedResult: rawState.unifiedResult
        ? {
            ...rawState.unifiedResult,
            // Convert array back to Map
            resultsByDomain: new Map(rawState.unifiedResult.resultsByDomain),
          }
        : null,
      savedAt: rawState.savedAt,
    };

    return state;
  } catch (error) {
    console.error('Failed to load homepage state:', error);
    localStorage.removeItem(HOMEPAGE_STATE_KEY);
    return null;
  }
};

const clearHomepageState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HOMEPAGE_STATE_KEY);
  }
};

export default function Home() {
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [unifiedResult, setUnifiedResult] =
    useState<UnifiedDomainResult | null>(null);
  const [progress, setProgress] = useState<UnifiedLookupProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Load saved state on component mount
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

  const handleCheckDomains = async () => {
    if (domains.length === 0 || selectedTlds.length === 0) {
      return;
    }

    // Create new abort controller for cancellation support
    const controller = new AbortController();
    setAbortController(controller);
    setIsChecking(true);
    setUnifiedResult(null);
    setProgress(null);

    try {
      const result = await checkDomainsUnified(domains, selectedTlds, {
        progressCallback: progressUpdate => {
          setProgress(progressUpdate);
        },
        abortSignal: controller.signal,
      });

      setUnifiedResult(result);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Operation cancelled') {
        console.error('Error checking domains:', error);
      }
    } finally {
      setIsChecking(false);
      setAbortController(null);
    }
  };

  const handleCancelCheck = () => {
    if (abortController) {
      abortController.abort();
      setIsChecking(false);
      setAbortController(null);
    }
  };

  const handleClearResults = () => {
    setDomains([]);
    setSelectedTlds([]);
    setUnifiedResult(null);
    setProgress(null);
    clearHomepageState();
  };

  const getStatusIcon = (status: DomainResult['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'taken':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: DomainResult['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'taken':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canCheck = domains.length > 0 && selectedTlds.length > 0 && !isChecking;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center space-y-8 text-center min-h-[calc(100vh-8rem)]">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Domain Hunt
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find and hunt for the perfect domain names for your next project
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <DomainInput
            onDomainsChange={setDomains}
            className="text-center"
            initialDomains={domains}
          />

          <TldSelector
            onTldsChange={setSelectedTlds}
            initialTlds={selectedTlds}
          />

          <div className="space-y-2">
            <Button
              onClick={handleCheckDomains}
              disabled={!canCheck}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Domains...
                </>
              ) : (
                `Check ${domains.length} Domain${domains.length !== 1 ? 's' : ''} × ${selectedTlds.length} TLD${selectedTlds.length !== 1 ? 's' : ''}`
              )}
            </Button>

            {isChecking && (
              <Button
                onClick={handleCancelCheck}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Cancel Check
              </Button>
            )}

            {/* Clear Results Button - show when we have results or saved state */}
            {(unifiedResult || domains.length > 0 || selectedTlds.length > 0) &&
              !isChecking && (
                <Button
                  onClick={handleClearResults}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Clear Results
                </Button>
              )}
          </div>

          {/* Progress Display */}
          {progress && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {progress.currentDomain && (
                    <div className="mb-1">
                      Checking:{' '}
                      <span className="font-medium">
                        {progress.currentDomain}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>
                      Overall Progress: {progress.completed}/{progress.total}
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>
                  {progress.totalDomains && progress.totalDomains > 1 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span>
                        Domains: {progress.domainsCompleted}/
                        {progress.totalDomains}
                      </span>
                      <span>{progress.overallPercentage}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              {progress.totalDomains && progress.totalDomains > 1 && (
                <div className="w-full bg-gray-100 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all"
                    style={{ width: `${progress.overallPercentage}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Unified Results Section */}
          {unifiedResult && (
            <div className="w-full space-y-4 text-left">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Domain Check Results</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {unifiedResult.totalDuration}ms
                  </Badge>
                  {unifiedResult.cancelled && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-100 text-yellow-800"
                    >
                      Cancelled
                    </Badge>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Total:</span>
                  <span>{unifiedResult.overallProgress.total}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Available:</span>
                  <span className="text-green-600">
                    {
                      Array.from(unifiedResult.resultsByDomain.values())
                        .flatMap(r => r.successful)
                        .filter(r => r.status === 'available').length
                    }
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>Taken:</span>
                  <span className="text-red-600">
                    {
                      Array.from(unifiedResult.resultsByDomain.values())
                        .flatMap(r => r.successful)
                        .filter(r => r.status === 'taken').length
                    }
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-yellow-50 rounded">
                  <span>Errors:</span>
                  <span className="text-yellow-600">
                    {
                      Array.from(
                        unifiedResult.resultsByDomain.values()
                      ).flatMap(r => r.failed).length
                    }
                  </span>
                </div>
              </div>

              {/* Results by Domain */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Array.from(unifiedResult.resultsByDomain.entries()).map(
                  ([domain, domainResult]) => (
                    <div
                      key={domain}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{domain}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{domainResult.totalDuration}ms</span>
                          <span>
                            {domainResult.successful.length +
                              domainResult.failed.length}{' '}
                            checked
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-1 max-h-32 overflow-y-auto">
                        {domainResult.results.slice(0, 12).map(result => (
                          <div
                            key={`${result.domain}${result.tld}`}
                            className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                          >
                            <span className="font-mono">
                              {result.domain}
                              {result.tld}
                            </span>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(result.status)}
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(result.status)}`}
                              >
                                {result.status}
                              </Badge>
                              <BookmarkButton
                                domain={result.domain}
                                tld={result.tld}
                                status={result.status}
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                        {domainResult.results.length > 12 && (
                          <div className="text-xs text-muted-foreground text-center p-1">
                            ... and {domainResult.results.length - 12} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
