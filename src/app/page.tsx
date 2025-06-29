'use client';

import { useState } from 'react';
import { DomainInput } from '@/components/domain-input';
import { TldSelector } from '@/components/tld-selector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  checkMultipleDomains,
  checkDomainMultipleTlds,
} from '@/services/domain-checker';
import {
  DomainResult,
  MultiTldResult,
  DomainLookupProgress,
} from '@/types/domain';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function Home() {
  const [domains, setDomains] = useState<string[]>([]);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([]);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Multi-TLD concurrent lookup test
  const [multiTldResult, setMultiTldResult] = useState<MultiTldResult | null>(
    null
  );
  const [multiTldProgress, setMultiTldProgress] =
    useState<DomainLookupProgress | null>(null);
  const [isMultiTldChecking, setIsMultiTldChecking] = useState(false);

  const handleCheckDomains = async () => {
    if (domains.length === 0 || selectedTlds.length === 0) {
      return;
    }

    setIsChecking(true);
    setResults([]);

    try {
      const checkResults = await checkMultipleDomains(domains, selectedTlds);
      setResults(checkResults);
    } catch (error) {
      console.error('Error checking domains:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Test single domain + multiple TLDs with progress tracking
  const handleMultiTldTest = async () => {
    if (domains.length === 0 || selectedTlds.length === 0) {
      return;
    }

    const testDomain = domains[0]; // Use first domain for test
    setIsMultiTldChecking(true);
    setMultiTldResult(null);
    setMultiTldProgress(null);

    try {
      const result = await checkDomainMultipleTlds(testDomain, selectedTlds, {
        progressCallback: progress => {
          setMultiTldProgress(progress);
        },
      });
      setMultiTldResult(result);
    } catch (error) {
      console.error('Error in multi-TLD lookup:', error);
    } finally {
      setIsMultiTldChecking(false);
    }
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
          <DomainInput onDomainsChange={setDomains} className="text-center" />

          <TldSelector onTldsChange={setSelectedTlds} />

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

          {/* Multi-TLD Concurrent Lookup Test */}
          {domains.length > 0 && selectedTlds.length > 0 && (
            <div className="border-t pt-6 space-y-4">
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Concurrent Multi-TLD Test
                </h3>
                <Button
                  onClick={handleMultiTldTest}
                  disabled={isMultiTldChecking}
                  variant="outline"
                  className="w-full"
                >
                  {isMultiTldChecking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing {domains[0]} across {selectedTlds.length} TLD
                      {selectedTlds.length !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    `Test "${domains[0]}" × ${selectedTlds.length} TLD${selectedTlds.length !== 1 ? 's' : ''} (with progress)`
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              {multiTldProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Progress: {multiTldProgress.completed}/
                      {multiTldProgress.total}
                    </span>
                    <span>{multiTldProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${multiTldProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Multi-TLD Results */}
              {multiTldResult && (
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">
                      Results for &quot;{multiTldResult.domain}&quot;
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {multiTldResult.totalDuration}ms
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{multiTldResult.results.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success:</span>
                      <span className="text-green-600">
                        {multiTldResult.successful.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-600">
                        {multiTldResult.failed.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span>{multiTldResult.progress.percentage}%</span>
                    </div>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {multiTldResult.results.slice(0, 8).map(result => (
                      <div
                        key={`${result.domain}${result.tld}`}
                        className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                      >
                        <span>
                          {result.domain}
                          {result.tld}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(result.status)}`}
                        >
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                    {multiTldResult.results.length > 8 && (
                      <div className="text-xs text-muted-foreground text-center">
                        ... and {multiTldResult.results.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {results.length > 0 && (
            <div className="w-full space-y-4">
              <h3 className="text-lg font-semibold">Domain Check Results</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.map(result => (
                  <div
                    key={`${result.domain}${result.tld}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">
                        {result.domain}
                        {result.tld}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(result.status)}
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="text-sm text-muted-foreground border-t pt-3">
                Available:{' '}
                {results.filter(r => r.status === 'available').length} | Taken:{' '}
                {results.filter(r => r.status === 'taken').length} | Errors:{' '}
                {results.filter(r => r.status === 'error').length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
