import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/bookmark-button';
import { Bookmark } from '@/types/bookmark';
import { getStatusColor } from '@/lib/utils';
import { DEFAULT_ERROR_STATUS } from '@/constants/domain-status';
import { formatDate } from '@/utils/date-formatting';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onToggle: (isBookmarked: boolean) => void;
}

export function BookmarkItem({ bookmark, onToggle }: BookmarkItemProps) {
  return (
    <div className="border border-container-border rounded-lg p-4 bg-container-bg hover:bg-muted transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-lg font-medium">
              {bookmark.domain}
              {bookmark.tld}
            </span>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(bookmark.lastKnownStatus)}`}
              >
                {bookmark.lastKnownStatus || DEFAULT_ERROR_STATUS}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <span>Bookmarked: {formatDate(bookmark.bookmarkedAt)}</span>
            {bookmark.lastCheckedAt && (
              <span>Last checked: {formatDate(bookmark.lastCheckedAt)}</span>
            )}
          </div>

          {bookmark.notes && (
            <div className="mt-2 text-sm text-gray-600">{bookmark.notes}</div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <BookmarkButton
            domain={bookmark.domain}
            tld={bookmark.tld}
            status={bookmark.lastKnownStatus}
            onToggle={onToggle}
          />
        </div>
      </div>
    </div>
  );
}
