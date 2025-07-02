import { Filter } from 'lucide-react';
import { DomainResultCard } from '@/components/domain-result-card';
import { UnifiedDomainResult } from '@/types/domain';

interface DomainResultsProps {
  filteredResults: UnifiedDomainResult | null;
  isEmpty: boolean;
  retryingDomains: Set<string>;
  onRetryDomain: (domain: string, tld: string) => void;
}

export function DomainResults({
  filteredResults,
  isEmpty,
  retryingDomains,
  onRetryDomain,
}: DomainResultsProps) {
  if (isEmpty) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium mb-1">
          No results match the current filter
        </p>
        <p className="text-sm">
          Try selecting a different filter or clear all filters
        </p>
      </div>
    );
  }

  if (!filteredResults) {
    return null;
  }

  return (
    <div className="space-y-4">
      {Array.from(filteredResults.resultsByDomain.entries()).map(
        ([domain, domainResult]) => (
          <div key={domain} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">{domain}</h4>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{domainResult.totalDuration}ms</span>
                <span>
                  {domainResult.successful.length + domainResult.failed.length}{' '}
                  checked
                </span>
              </div>
            </div>

            <div className="grid gap-1">
              {domainResult.results.map(result => (
                <DomainResultCard
                  key={`${result.domain}${result.tld}`}
                  result={result}
                  isRetrying={retryingDomains.has(
                    `${result.domain}${result.tld}`
                  )}
                  onRetry={onRetryDomain}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
