interface BookmarkStatsProps {
  stats: {
    total: number;
    available: number;
    taken: number;
    errors: number;
  };
}

export function BookmarkStats({ stats }: BookmarkStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-container-bg border border-container-border rounded-lg p-4">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-sm text-muted-foreground">Total</div>
      </div>
      <div className="bg-status-available-bg border border-status-available-border rounded-lg p-4">
        <div className="text-2xl font-bold text-status-available">
          {stats.available}
        </div>
        <div className="text-sm text-status-available">Available</div>
      </div>
      <div className="bg-status-taken-bg border border-status-taken-border rounded-lg p-4">
        <div className="text-2xl font-bold text-status-taken">
          {stats.taken}
        </div>
        <div className="text-sm text-status-taken">Taken</div>
      </div>
      <div className="bg-status-error-bg border border-status-error-border rounded-lg p-4">
        <div className="text-2xl font-bold text-status-error">
          {stats.errors}
        </div>
        <div className="text-sm text-status-error">Errors</div>
      </div>
    </div>
  );
}
