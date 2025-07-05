# Domain Hunt

> A modern domain availability checker built with Next.js 15, powered by Claude Code

Domain Hunt is a fast and intuitive web application for checking domain availability across multiple TLDs (Top Level Domains). Built with a two-tier approach combining DNS lookups and whois queries for comprehensive domain availability checking.

## ✨ Features

- **Multi-TLD Domain Checking** - Check availability across hundreds of TLDs simultaneously
- **Smart Two-Tier Approach** - Fast DNS lookup with whois fallback for comprehensive results
- **Real-time Progress Tracking** - Live updates as domains are checked
- **Bookmark System** - Save and manage your favorite available domains
- **Cross-Tab Synchronization** - Bookmarks sync across browser tabs
- **Advanced Filtering** - Filter results by availability, bookmarks, and status
- **Responsive Design** - Works perfectly on desktop and mobile
- **Dark/Light Mode** - Toggle between themes with system preference support
- **Offline Support** - Graceful degradation when network is unavailable

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Styling**: Tailwind CSS v4 with custom animations
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **State Management**: React hooks with localStorage persistence
- **Domain Checking**: Node.js DNS resolution + whoiser library
- **Package Manager**: pnpm with workspace support
- **Code Quality**: ESLint, Prettier, Husky, and TypeScript strict mode

## 🤖 Built with Claude Code

This project showcases an innovative development approach using **Claude Code** (claude.ai/code) with automated GitHub workflows:

### Development Methodology

- **AI-Driven Planning** - Claude analyzes requirements and creates detailed GitHub issues
- **Automated Implementation** - Features are developed through structured PR workflows
- **Quality Assurance** - Built-in linting, formatting, and type checking
- **Transparent Process** - Every change is documented and tracked through GitHub

### Workflow Commands

The development process uses specialized commands:

- `@plan` - Brainstorm and create GitHub issues with proper labeling
- `@createpr` - Implement features with comprehensive testing
- `@fixpr` - Address feedback and iterate on changes
- `@mergepr` - Integrate completed features and close issues

### Benefits

- **Systematic Development** - Every feature follows a planned approach
- **High Code Quality** - Consistent formatting and comprehensive testing
- **Full Transparency** - Complete visibility into development decisions
- **Rapid Iteration** - Quick adaptation based on requirements changes

## 🏗️ Architecture

### Core Design Patterns

#### Hook-Service Architecture

- **Hooks** (`src/hooks/`) - UI state management and effects
- **Services** (`src/services/`) - Business logic and data persistence
- Clean separation between presentation and business logic

#### Unified Result System

Domain results are organized using a `UnifiedDomainResult` structure:

```typescript
UnifiedDomainResult {
  resultsByDomain: Map<string, MultiTldResult>
  overallProgress: UnifiedLookupProgress
}
```

#### Cross-Tab Synchronization

- Bookmark changes sync across browser tabs using storage events
- Homepage state persists with 24-hour expiration
- Filter preferences maintain user choices

### Key Components

- **Domain Checker** - Concurrent checking with intelligent rate limiting
- **Bookmark System** - Complete CRUD operations with complex TLD parsing
- **Progress Tracking** - Real-time updates with cancellation support
- **Filter System** - Advanced result filtering with persistent preferences

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/husniadil/domain-hunt.git
   cd domain-hunt
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Code Quality

The project maintains high code quality through:

- **ESLint** - JavaScript/TypeScript linting with Next.js configuration
- **Prettier** - Consistent code formatting
- **Husky** - Git hooks for pre-commit quality checks
- **TypeScript** - Strict type checking enabled
- **Lint-staged** - Run quality checks only on staged files

## 🏭 Production

### Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

No environment variables are required for basic functionality. The application runs entirely client-side with server-side API routes for domain checking.

### Deployment

Deploy easily on platforms like:

- **Vercel** (recommended) - Zero-config deployment
- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **Docker** - Container-based deployment

## 🤝 Contributing

This project demonstrates Claude Code's development workflow. To contribute:

1. **Fork the repository**
2. **Create a feature branch**
3. **Use Claude Code workflow commands** for systematic development
4. **Submit pull requests** with comprehensive descriptions
5. **Follow conventional commits** for clear history

### Issue Labels

- `feature` - New functionality
- `bug` - Bug fixes
- `enhancement` - Improvements to existing features
- `documentation` - Documentation updates
- `hotfix` - Critical production fixes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) - The React framework for production
- Powered by [Claude Code](https://claude.ai/code) - AI-assisted development
- UI components from [Radix UI](https://radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Domain checking powered by [whoiser](https://github.com/LayeredStudio/whoiser)

---

**Built with ❤️ using Claude Code - demonstrating the future of AI-assisted development**
