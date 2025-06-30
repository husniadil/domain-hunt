import { getStatusFilterClasses } from '@/lib/utils';

interface FilterToggleButtonProps {
  type: 'available' | 'taken' | 'error';
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export function FilterToggleButton({
  type,
  label,
  count,
  isActive,
  onClick,
}: FilterToggleButtonProps) {
  const colorClasses = getStatusFilterClasses(type, isActive);

  return (
    <button
      onClick={onClick}
      className={`flex justify-between p-2 rounded transition-all hover:scale-105 ${colorClasses.activeBackground}`}
    >
      <span className={colorClasses.activeLabel}>{label}:</span>
      <span className={colorClasses.activeCount}>{count}</span>
    </button>
  );
}
