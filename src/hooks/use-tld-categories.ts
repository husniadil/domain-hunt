import { useCallback } from 'react';

interface UseTldCategoriesProps {
  collapsedCategories: string[];
  showAllCategories: boolean;
  onCollapsedCategoriesChange?: (categories: string[]) => void;
  onShowAllCategoriesChange?: (show: boolean) => void;
}

interface UseTldCategoriesReturn {
  handleCategoryToggle: (categoryId: string) => void;
  handleShowMoreToggle: () => void;
  handleCategoryKeyDown: (e: React.KeyboardEvent, categoryId: string) => void;
}

export function useTldCategories({
  collapsedCategories,
  showAllCategories,
  onCollapsedCategoriesChange,
  onShowAllCategoriesChange,
}: UseTldCategoriesProps): UseTldCategoriesReturn {
  // Category management functions
  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const isCollapsed = collapsedCategories.includes(categoryId);
      const newCollapsed = isCollapsed
        ? collapsedCategories.filter(id => id !== categoryId)
        : [...collapsedCategories, categoryId];

      onCollapsedCategoriesChange?.(newCollapsed);
    },
    [collapsedCategories, onCollapsedCategoriesChange]
  );

  const handleShowMoreToggle = useCallback(() => {
    // Store current scroll position to maintain it when content expands
    const currentScrollY = window.scrollY;

    onShowAllCategoriesChange?.(!showAllCategories);

    // Restore scroll position after state update to prevent auto-scroll down
    requestAnimationFrame(() => {
      window.scrollTo(0, currentScrollY);
    });
  }, [showAllCategories, onShowAllCategoriesChange]);

  // Enhanced keyboard handler for category toggle
  const handleCategoryKeyDown = useCallback(
    (e: React.KeyboardEvent, categoryId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCategoryToggle(categoryId);
      }
    },
    [handleCategoryToggle]
  );

  return {
    handleCategoryToggle,
    handleShowMoreToggle,
    handleCategoryKeyDown,
  };
}
