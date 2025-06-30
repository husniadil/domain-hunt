'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isBookmarked, toggleBookmark } from '@/services/bookmark-service';
import { DomainResult } from '@/types/domain';

interface BookmarkButtonProps {
  domain: string;
  tld: string;
  status?: DomainResult['status'];
  size?: 'sm' | 'default';
  className?: string;
  onToggle?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({
  domain,
  tld,
  status,
  size = 'sm',
  className = '',
  onToggle,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check bookmark status on mount and when domain/tld changes
  useEffect(() => {
    setBookmarked(isBookmarked(domain, tld));
  }, [domain, tld]);

  // Listen for bookmark changes from other components/pages
  useEffect(() => {
    const handleBookmarkChange = () => {
      setBookmarked(isBookmarked(domain, tld));
    };

    window.addEventListener('bookmarkStatsChanged', handleBookmarkChange);
    return () => {
      window.removeEventListener('bookmarkStatsChanged', handleBookmarkChange);
    };
  }, [domain, tld]);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const result = toggleBookmark(domain, tld, status);

      if (result.success) {
        const newBookmarkedState = !bookmarked;
        setBookmarked(newBookmarkedState);
        onToggle?.(newBookmarkedState);
      } else {
        console.error('Failed to toggle bookmark:', result.error);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-1 h-auto hover:bg-transparent ${className}`}
      title={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          bookmarked
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 hover:text-red-400'
        } ${isLoading ? 'opacity-50' : ''}`}
      />
    </Button>
  );
}
