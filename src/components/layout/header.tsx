import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <nav aria-label="Main navigation">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Domain Hunt</span>
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
