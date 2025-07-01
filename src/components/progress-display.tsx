import { UnifiedLookupProgress } from '@/types/domain';

interface ProgressDisplayProps {
  progress: UnifiedLookupProgress | null;
}

export function ProgressDisplay({ progress }: ProgressDisplayProps) {
  if (!progress) return null;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="text-sm text-muted-foreground">
          {progress.currentDomain && (
            <div className="mb-1">
              Checking:{' '}
              <span className="font-medium">{progress.currentDomain}</span>
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
                Domains: {progress.domainsCompleted}/{progress.totalDomains}
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
  );
}
