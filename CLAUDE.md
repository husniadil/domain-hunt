# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

## Project Architecture

### Core Concept

Domain Hunt is a Next.js application for checking domain availability across multiple TLDs. It uses a two-tier approach:

1. **DNS lookup** (primary) - Fast resolution for most domains
2. **Whois lookup** (fallback) - Comprehensive availability checking when DNS fails

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: React hooks with localStorage persistence
- **Domain Checking**: Node.js DNS + whoiser library
- **Package Manager**: pnpm

### Key Architecture Patterns

#### 1. Hook-Service Architecture

- **Hooks** (`src/hooks/`) - UI state management and effects
- **Services** (`src/services/`) - Business logic and persistence
- Clean separation between presentation and data layers

#### 2. Unified Result System

The application uses a `UnifiedDomainResult` structure that groups results by domain:

```typescript
UnifiedDomainResult {
  resultsByDomain: Map<string, MultiTldResult>
  overallProgress: UnifiedLookupProgress
}
```

#### 3. Cross-Tab Synchronization

- Bookmark changes sync across browser tabs using storage events
- Homepage state persists with 24-hour expiration
- Filter states maintain user preferences

### Core Hooks

#### `useHomepageState`

- Manages domains, selected TLDs, and unified results
- Auto-saves to localStorage with expiration
- Handles Map serialization for storage compatibility

#### `useBookmarkSync`

- Synchronizes bookmarks with domain results
- Prevents infinite loops with sync tracking
- Listens for cross-tab bookmark changes

#### `useResultFilters`

- Filters domain results by status (available/taken/error/bookmarked)
- Persists filter states across sessions
- Provides real-time counts and toggle functionality

### Core Services

#### `domain-checker`

- Implements concurrent domain checking with rate limiting
- Supports progress tracking and cancellation via AbortSignal
- Intelligent retry logic with exponential backoff
- Handles offline detection and graceful degradation

#### `bookmark-service`

- Complete CRUD operations for domain bookmarks
- Handles complex TLD parsing (.co.uk, .com.au, etc.)
- Provides filtering, sorting, and statistics
- Implements cross-tab event synchronization

#### `homepage-state-service` & `filter-state-service`

- Handle localStorage persistence with SSR safety
- Implement expiration logic for homepage state
- Provide clear APIs for state management

### API Architecture

#### `/api/domain-check`

- Primary DNS lookup with 5-second timeout
- Whois fallback for network/DNS failures
- Debug mode with detailed logging
- Structured error responses with categorization

### Component Structure

#### Page Components

- `src/app/page.tsx` - Main homepage with domain checking
- `src/app/bookmarks/page.tsx` - Bookmark management interface

#### UI Components

- **Interactive**: Domain input, TLD selector, action buttons
- **Display**: Progress display, domain results, filter stats
- **Layout**: Header, theme toggle, error boundary

### Data Flow

1. User enters domains and selects TLDs
2. `checkDomainsUnified` processes requests with concurrency limiting
3. Results stored in `UnifiedDomainResult` with progress tracking
4. UI filters results based on user preferences
5. Bookmark actions sync across tabs and update storage

### State Management

#### Persistence Strategy

- **Homepage State**: Domains, TLDs, results (24h expiration)
- **Bookmark State**: Simple storage without versioning
- **Filter State**: User preferences for result filtering
- **Theme State**: Dark/light mode via next-themes

#### Cross-Tab Sync

- Storage events for bookmark changes
- Custom events for statistics updates
- Prevents infinite loops with sync tracking

### Error Handling

#### Categorized Errors

- Network errors (timeout, connection issues)
- DNS resolution failures (NXDOMAIN, NOTFOUND)
- Whois service errors (rate limiting, access denied)
- Validation errors (invalid domain format)

#### User Experience

- Graceful degradation with fallback mechanisms
- User-friendly error messages
- Retry functionality for failed checks
- Offline detection and handling

### Testing & Quality

#### Linting & Formatting

- ESLint with Next.js TypeScript config
- Prettier for code formatting
- Husky + lint-staged for pre-commit hooks
- TypeScript strict mode enabled

#### Path Aliases

- `@/*` maps to `src/*` for clean imports
- Consistent import patterns across codebase

### Development Notes

#### Local Storage Keys

- `domain-hunt-homepage-state` - Homepage state
- `domain-hunt-bookmarks` - Bookmark data
- `domain-hunt-filter-states` - Filter preferences

#### Performance Optimizations

- Concurrency limiting (default 10 simultaneous requests)
- Batched promise execution
- Intelligent retry delays
- Progress tracking with minimal re-renders

#### Debugging

- Debug mode via `x-debug: true` header
- Structured console logging
- Error categorization for troubleshooting
- Performance timing in API responses

## Claude Code Workflow

This project is developed using Claude Code (claude.ai/code) with an automated GitHub workflow that enables systematic planning, issue creation, and pull request management.

### Workflow Commands

The development process uses specialized workflow commands:

#### Planning & Issue Creation

- **@plan** - Brainstorm features, analyze requirements, and create GitHub issues with proper labels
- Supports all work types: hotfixes, features, bugs, enhancements, documentation, and tasks

#### Development Workflow

- **@createpr** - Analyze GitHub issues and create pull requests with implementation
- **@fixpr** - Address PR feedback and re-submit changes
- **@mergepr** - Merge PRs and handle post-merge tasks

#### Development Guidelines

- **Quality First**: Always run formatting (`pnpm format`), linting (`pnpm lint`), and build (`pnpm build`) before committing
- **Conventional Commits**: All commits follow conventional commit format (feat, fix, docs, refactor, test, chore, hotfix)
- **Issue-Driven**: Each feature/bug fix starts with a GitHub issue for proper tracking

### Automated Development Process

1. **Planning Phase** - Use @plan to analyze requirements and create detailed GitHub issues
2. **Implementation Phase** - Use @createpr to develop features with proper testing and quality checks
3. **Review Phase** - Use @fixpr if changes are needed based on feedback
4. **Deployment Phase** - Use @mergepr to integrate changes and close issues

### Benefits

- **Systematic Approach**: Every change is planned, documented, and tracked
- **Quality Assurance**: Built-in quality checks and testing requirements
- **Transparency**: Full visibility into development process through GitHub issues and PRs
- **Collaboration**: Clear communication through structured issue descriptions and PR documentation
