import { Bookmark } from '@/types/bookmark';
import { BookmarkItem } from '@/components/bookmark-item';

interface BookmarkListProps {
  filteredBookmarks: Bookmark[];
  totalBookmarks: number;
  onBookmarkToggle: (isBookmarked: boolean) => void;
}

export function BookmarkList({
  filteredBookmarks,
  totalBookmarks,
  onBookmarkToggle,
}: BookmarkListProps) {
  if (filteredBookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          {totalBookmarks === 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No bookmarks yet
              </h3>
              <p className="text-gray-500">
                Start bookmarking domains from the search results to see them
                here.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No matching bookmarks
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredBookmarks.map(bookmark => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onToggle={onBookmarkToggle}
        />
      ))}
    </div>
  );
}
