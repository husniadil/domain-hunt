'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { getBookmarkStats } from '@/services/bookmark-service';

export function Header() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    taken: 0,
    unknown: 0,
  });

  useEffect(() => {
    // Load bookmark stats on mount and set up periodic refresh
    const loadStats = () => {
      setStats(getBookmarkStats());
    };

    // Load stats initially
    loadStats();

    // Listen for bookmark changes to update stats immediately
    const handleBookmarkChange = () => {
      loadStats();
    };

    window.addEventListener('bookmarkStatsChanged', handleBookmarkChange);

    // Set up periodic refresh only on bookmarks page
    let interval: NodeJS.Timeout | null = null;
    if (pathname === '/bookmarks') {
      // Update stats every 5 seconds when on bookmarks page
      // This helps keep the count fresh when bookmarks are added/removed
      interval = setInterval(loadStats, 5000);
    }

    return () => {
      window.removeEventListener('bookmarkStatsChanged', handleBookmarkChange);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pathname]);

  const isBookmarksPage = pathname === '/bookmarks';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Main navigation"
          className="flex items-center space-x-6"
        >
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">Domain Hunt</span>
          </Link>

          <Link
            href="/bookmarks"
            className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground/80 ${
              isBookmarksPage ? 'text-foreground' : 'text-foreground/60'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${stats.total > 0 ? 'fill-red-500 text-red-500' : ''}`}
            />
            <span>Bookmarks</span>
            {stats.total > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.total}
              </Badge>
            )}
          </Link>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
