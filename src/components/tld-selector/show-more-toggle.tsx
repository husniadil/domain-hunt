import { Button } from '@/components/ui/button';
import { TLDCategory } from '@/types/tld';

interface ShowMoreToggleProps {
  categories: TLDCategory[];
  showAllCategories: boolean;
  onToggle: () => void;
}

export function ShowMoreToggle({
  categories,
  showAllCategories,
  onToggle,
}: ShowMoreToggleProps) {
  const hiddenCategories = categories.filter(cat => cat.id !== 'popular');
  const hiddenCategoriesCount = hiddenCategories.length;
  const hiddenTldsCount = hiddenCategories.reduce(
    (sum, cat) => sum + cat.tlds.length,
    0
  );

  if (categories.length <= 1) return null;

  return (
    <div className="flex justify-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="text-xs hover:bg-muted transition-colors duration-200 group"
      >
        <span className="flex items-center gap-2">
          {showAllCategories ? (
            <>
              Show Less
              <span className="text-xs opacity-75">
                (Hide {hiddenCategoriesCount} categories)
              </span>
            </>
          ) : (
            <>
              Show More Categories
              <span className="text-xs opacity-75">
                ({hiddenCategoriesCount} more with {hiddenTldsCount} TLDs)
              </span>
            </>
          )}
          <span className="ml-1 transition-transform duration-200 group-hover:scale-110">
            {showAllCategories ? '▲' : '▼'}
          </span>
        </span>
      </Button>
    </div>
  );
}
