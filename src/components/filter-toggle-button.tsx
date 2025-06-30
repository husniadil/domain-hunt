interface FilterToggleButtonProps {
  type: 'available' | 'taken' | 'error';
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

const getColorClasses = (type: string, isActive: boolean) => {
  const colors = {
    available: {
      activeBackground: 'bg-green-100 border-2 border-green-300',
      activeLabel: 'text-green-800',
      activeCount: 'text-green-600 font-medium',
    },
    taken: {
      activeBackground: 'bg-red-100 border-2 border-red-300',
      activeLabel: 'text-red-800',
      activeCount: 'text-red-600 font-medium',
    },
    error: {
      activeBackground: 'bg-yellow-100 border-2 border-yellow-300',
      activeLabel: 'text-yellow-800',
      activeCount: 'text-yellow-600 font-medium',
    },
  };

  const inactiveBackground = 'bg-gray-100 border-2 border-gray-300 opacity-50';
  const inactiveLabel = 'text-gray-600';
  const inactiveCount = 'text-gray-500';

  return {
    background: isActive
      ? colors[type as keyof typeof colors]?.activeBackground
      : inactiveBackground,
    label: isActive
      ? colors[type as keyof typeof colors]?.activeLabel
      : inactiveLabel,
    count: isActive
      ? colors[type as keyof typeof colors]?.activeCount
      : inactiveCount,
  };
};

export function FilterToggleButton({
  type,
  label,
  count,
  isActive,
  onClick,
}: FilterToggleButtonProps) {
  const colorClasses = getColorClasses(type, isActive);

  return (
    <button
      onClick={onClick}
      className={`flex justify-between p-2 rounded transition-all hover:scale-105 ${colorClasses.background}`}
    >
      <span className={colorClasses.label}>{label}:</span>
      <span className={colorClasses.count}>{count}</span>
    </button>
  );
}
