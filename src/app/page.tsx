'use client';

import { useState } from 'react';
import { DomainInput } from '@/components/domain-input';
import { TldSelector } from '@/components/tld-selector';
import { BookmarkButton } from '@/components/bookmark-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkDomainsUnified } from '@/services/domain-checker';
import { DomainResult, UnifiedLookupProgress } from '@/types/domain';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useHomepageState } from '@/hooks/useHomepageState';
import { useResultFilters } from '@/hooks/use-result-filters';
import { FilterToggleButton } from '@/components/filter-toggle-button';

export default function Home() {
  const {
    domains,
    selectedTlds,
    unifiedResult,
    setDomains,
    setSelectedTlds,
    setUnifiedResult,
    clearState,
  } = useHomepageState();
  const [progress, setProgress] = useState<UnifiedLookupProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const { filteredResults, toggleStates, counts, isEmpty, onToggle } =
    useResultFilters(unifiedResult);

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
    clearState();
    setProgress(null);
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

              {/* Toggleable Filter Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Showing:</span>
                  <span>{counts.showing}</span>
                </div>
                <FilterToggleButton
                  type="available"
                  label="Available"
                  count={counts.available}
                  isActive={toggleStates.available}
                  onClick={() => onToggle('available')}
                />
                <FilterToggleButton
                  type="taken"
                  label="Taken"
                  count={counts.taken}
                  isActive={toggleStates.taken}
                  onClick={() => onToggle('taken')}
                />
                <FilterToggleButton
                  type="error"
                  label="Errors"
                  count={counts.error}
                  isActive={toggleStates.error}
                  onClick={() => onToggle('error')}
                />
              </div>

              {/* Results by Domain */}
              {isEmpty ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">
                    No results match the current filter
                  </p>
                  <p className="text-sm">
                    Try selecting a different filter or clear all filters
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredResults &&
                    Array.from(filteredResults.resultsByDomain.entries()).map(
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
