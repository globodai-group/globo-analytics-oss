# Contributing to GloboAnalytics

First off, thank you for considering contributing to GloboAnalytics! It's people like you that make GloboAnalytics such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@globoanalytics.com](mailto:conduct@globoanalytics.com).

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 9 or higher
- PostgreSQL 15 or higher
- Docker (optional, for containerized development)

### Development Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/globo-analytics-oss.git
   cd globo-analytics-oss
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/globodai-group/globo-analytics-oss.git
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local database settings
   ```

6. **Start the database**

   ```bash
   # Using Docker
   docker-compose up -d postgres redis

   # Or use your local PostgreSQL instance
   ```

7. **Run migrations**

   ```bash
   pnpm db:migrate:dev
   ```

8. **Start development server**

   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

## Making Changes

### Branch Naming

Create a branch for your changes:

```bash
git checkout -b type/short-description
```

Types:
- `feat/` - New feature
- `fix/` - Bug fix
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

Examples:
- `feat/add-session-recording`
- `fix/chart-rendering-issue`
- `docs/improve-api-reference`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(dashboard): add real-time visitor counter
fix(tracker): resolve cookie consent detection
docs(readme): update installation instructions
```

### Before Submitting

1. **Run tests**
   ```bash
   pnpm test
   ```

2. **Run linting**
   ```bash
   pnpm lint
   ```

3. **Run type checking**
   ```bash
   pnpm type-check
   ```

4. **Format code**
   ```bash
   pnpm format
   ```

## Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

2. **Push your changes**
   ```bash
   git push origin your-branch-name
   ```

3. **Create a Pull Request**
   - Target the `dev` branch (not `main`)
   - Fill out the PR template completely
   - Link any related issues

4. **Review Process**
   - A maintainer will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention
- [ ] No merge conflicts with `dev`

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface UserData {
  id: string;
  email: string;
  createdAt: Date;
}

function getUser(id: string): Promise<UserData | null> {
  // ...
}

// Avoid
function getUser(id): any {
  // ...
}
```

### React

- Use functional components with hooks
- Prefer named exports
- Use TypeScript interfaces for props

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={styles[variant]} onClick={onClick}>
      {label}
    </button>
  );
}
```

### CSS / Tailwind

- Use Tailwind CSS classes
- Prefer composition over complex selectors
- Use CSS variables for theming

### File Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
│   ├── ui/          # Base UI components
│   └── features/    # Feature-specific components
├── lib/             # Utilities and helpers
│   ├── actions/     # Server actions
│   └── utils/       # Helper functions
└── types/           # TypeScript type definitions
```

## Reporting Bugs

### Before Reporting

1. Check existing issues to avoid duplicates
2. Try to reproduce on the latest version
3. Collect relevant information

### Bug Report Template

When creating an issue, include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps to trigger the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable

## Suggesting Features

We love feature suggestions! Before suggesting:

1. Check if it's already been suggested
2. Consider if it fits the project scope
3. Think about implementation complexity

### Feature Request Template

- **Problem**: What problem does this solve?
- **Solution**: Your proposed solution
- **Alternatives**: Other approaches you considered
- **Additional Context**: Mockups, examples, etc.

## Questions?

- Open a [GitHub Discussion](https://github.com/globodai-group/globo-analytics-oss/discussions)
- Join our [Discord](https://discord.gg/globoanalytics)

---

Thank you for contributing! 🎉
