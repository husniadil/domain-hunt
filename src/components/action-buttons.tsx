import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { UnifiedDomainResult } from '@/types/domain';

interface ActionButtonsProps {
  domains: string[];
  selectedTlds: string[];
  unifiedResult: UnifiedDomainResult | null;
  isChecking: boolean;
  onCheckDomains: () => void;
  onCancelCheck: () => void;
  onClearResults: () => void;
}

export function ActionButtons({
  domains,
  selectedTlds,
  unifiedResult,
  isChecking,
  onCheckDomains,
  onCancelCheck,
  onClearResults,
}: ActionButtonsProps) {
  const canCheck = domains.length > 0 && selectedTlds.length > 0 && !isChecking;

  return (
    <div className="space-y-2">
      <Button onClick={onCheckDomains} disabled={!canCheck} className="w-full">
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
          onClick={onCancelCheck}
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
            onClick={onClearResults}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Clear Results
          </Button>
        )}
    </div>
  );
}
