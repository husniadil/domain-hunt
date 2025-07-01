import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/bookmark-button';
import { getStatusColor } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { DomainResult } from '@/types/domain';

interface DomainResultCardProps {
  result: DomainResult;
  isRetrying: boolean;
  onRetry: (domain: string, tld: string) => void;
}

export function DomainResultCard({
  result,
  isRetrying,
  onRetry,
}: DomainResultCardProps) {
  return (
    <div className="flex items-center justify-between text-xs p-2 bg-container-bg border border-container-border rounded">
      <span className="font-mono">
        {result.domain}.{result.tld}
      </span>
      <div className="flex items-center space-x-2">
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
        {result.status === 'error' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRetry(result.domain, result.tld)}
            disabled={isRetrying}
            className="h-6 w-6 p-0"
          >
            {isRetrying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
