// Bookmark-related types and interfaces

import { DomainResult } from './domain';

// Unique identifier for a bookmark (domain.tld format)
export type BookmarkId = string;

// Bookmark data structure
export interface Bookmark {
  id: BookmarkId; // domain.tld (e.g., "example.com")
  domain: string;
  tld: string;
  bookmarkedAt: Date;
  lastCheckedAt?: Date;
  lastKnownStatus?: DomainResult['status'];
  tags?: string[]; // For future organization features
  notes?: string; // User notes about the domain
}

// Bookmark storage interface
export interface BookmarkStorage {
  bookmarks: Bookmark[];
  lastSyncAt: Date;
}

// Bookmark operations result
export interface BookmarkOperationResult {
  success: boolean;
  bookmark?: Bookmark;
  error?: string;
}

// Bookmark filter options
export interface BookmarkFilter {
  status?: DomainResult['status'];
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'bookmarkedAt' | 'domain' | 'lastCheckedAt';
  sortOrder?: 'asc' | 'desc';
}

// Bookmark statistics
export interface BookmarkStats {
  total: number;
  available: number;
  taken: number;
  errors: number; // Never checked or error
}
