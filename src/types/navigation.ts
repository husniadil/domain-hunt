// Shared navigation types and constants
export type NavigationSection = 'header' | 'input' | 'results';

// Available sections for navigation
export const NAVIGATION_SECTIONS: readonly NavigationSection[] = [
  'header',
  'input',
  'results',
] as const;

// Type guard for navigation sections
export const isNavigationSection = (
  value: string
): value is NavigationSection => {
  return NAVIGATION_SECTIONS.includes(value as NavigationSection);
};
