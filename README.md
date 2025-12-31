<p align="center">
  <img src="public/logo.svg" alt="GloboAnalytics" width="200"/>
</p>

<h1 align="center">GloboAnalytics</h1>

<p align="center">
  <strong>Privacy-focused, open-source web analytics.</strong><br/>
  A powerful Google Analytics alternative that respects user privacy.
</p>

<p align="center">
  <a href="https://github.com/globodai-group/globo-analytics-oss/actions/workflows/ci.yml?query=branch%3Amain">
    <img src="https://github.com/globodai-group/globo-analytics-oss/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"/>
  </a>
  <a href="https://codecov.io/gh/globodai-group/globo-analytics-oss">
    <img src="https://codecov.io/gh/globodai-group/globo-analytics-oss/branch/main/graph/badge.svg?token=CODECOV_TOKEN" alt="Coverage"/>
  </a>
  <a href="https://github.com/globodai-group/globo-analytics-oss/releases/latest">
    <img src="https://img.shields.io/github/v/release/globodai-group/globo-analytics-oss?color=blue&cacheSeconds=3600" alt="Release"/>
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License"/>
  </a>
  <a href="https://hub.docker.com/r/artik0din/globo-analytics-oss">
    <img src="https://img.shields.io/docker/pulls/artik0din/globo-analytics-oss?cacheSeconds=3600" alt="Docker Pulls"/>
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Docs</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

---

## Why GloboAnalytics?

- **100% Open Source** - No hidden code, no vendor lock-in
- **Privacy First** - GDPR, CCPA compliant out of the box
- **Self-Hosted** - Your data stays on your servers
- **Lightweight** - < 2KB tracker script, minimal impact on page speed
- **Real-Time** - See visitors as they happen
- **No Cookies** - Works without consent banners (optional)

---

## ✨ Features

### Core Analytics (Free)

| Feature                 | Description                               |
| ----------------------- | ----------------------------------------- |
| **Pageview Tracking**   | Automatic page views with engagement time |
| **Real-Time Dashboard** | Live visitor tracking                     |
| **Visitor Analytics**   | Sessions, unique visitors, bounce rate    |
| **Geographic Data**     | Country, region, city (GeoIP)             |
| **Device & Browser**    | OS, browser, screen resolution            |
| **Traffic Sources**     | Referrers, UTM campaigns, search engines  |
| **Goals & Funnels**     | Conversion tracking with multi-step flows |
| **Segments**            | Advanced audience segmentation            |
| **E-Commerce**          | Orders, products, cart events             |
| **Video Analytics**     | Video start, progress, completion         |
| **User Flow**           | Journey visualization                     |
| **Site Search**         | Search query tracking                     |
| **Alerts**              | Threshold-based notifications             |
| **Scheduled Reports**   | Email reports via cron                    |
| **CSV Export**          | Export your data anytime                  |
| **REST API**            | Full v1 & v2 API access                   |
| **Dark Mode**           | Easy on the eyes                          |
| **Two-Factor Auth**     | TOTP, Passkeys, Email verification        |

### License Tiers

GloboAnalytics uses a license system to unlock additional features and limits:

| Tier           | Domains | Pageviews/month | Users |
| -------------- | ------- | --------------- | ----- |
| **Community**  | 3       | 10,000          | 1     |
| **Pro**        | 10      | 1,000,000       | 10    |
| **Enterprise** | ∞       | ∞               | ∞     |

> **Note:** Pro and Enterprise licenses unlock additional features like AI insights, advanced bot detection, and priority support. Contact us for licensing options.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull the pre-built image
docker pull artik0din/globo-analytics-oss:latest

# Or use docker-compose
curl -O https://raw.githubusercontent.com/globodai-group/globo-analytics-oss/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/globodai-group/globo-analytics-oss/main/.env.example

# Configure environment
cp .env.example .env
echo "NEXTAUTH_SECRET=$(openssl rand -base64 48)" >> .env

# Start the application
docker-compose -f docker-compose.prod.yml up -d

# Access at http://localhost:3000
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Start with docker-compose (builds locally)
docker-compose up -d
```

### Option 3: Manual Installation

**Prerequisites:** Node.js 20+, PostgreSQL 16+, [Bun](https://bun.sh)

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Clone the repository
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and settings

# Run database migrations
bun run db:migrate

# Build for production
bun run build

# Start the server
bun run start
```

### First Run: Setup Wizard

On first launch, you'll be guided through the setup wizard:

1. **License Key** (optional) - Enter your license key or continue with Community edition
2. **Admin Account** - Create your administrator account

---

## 📊 Adding the Tracking Script

Add this snippet to your website, just before `</head>`:

```html
<script
  defer
  src="https://your-analytics-domain.com/js/tracker.js"
  data-website-id="YOUR_WEBSITE_ID"
></script>
```

### Tracker Options

| Attribute              | Description                | Default  |
| ---------------------- | -------------------------- | -------- |
| `data-website-id`      | Your website identifier    | Required |
| `data-track-outbound`  | Track outbound link clicks | `false`  |
| `data-track-downloads` | Track file downloads       | `false`  |
| `data-honor-dnt`       | Respect Do Not Track       | `false`  |
| `data-hash-mode`       | Track hash changes (SPA)   | `false`  |

See [Tracker Documentation](./docs/TRACKER.md) for advanced options.

---

## 🔄 Upgrading

### Docker

```bash
# Pull the latest image
docker pull artik0din/globo-analytics-oss:latest

# Restart with new version
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose logs -f app
```

### Manual Installation

```bash
git pull origin main
pnpm install
pnpm db:migrate
pnpm build
pm2 restart globo-analytics  # or your process manager
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR INFRASTRUCTURE                                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  Dashboard   │  │  Tracker.js  │  │   PostgreSQL    │   │
│  │  (Next.js)   │  │  (< 2KB)     │  │  (Your Data)    │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│         │                                    │              │
│         └──────────────┬─────────────────────┘              │
│                        │                                    │
│  ┌─────────────────────▼─────────────────────────────────┐ │
│  │                    Redis (Optional)                    │ │
│  │              Event Queue & Caching                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**All data stays on your servers.** No external calls required for core analytics.

---

## 🔒 Privacy & Security

### Your Data, Your Servers

- All analytics data stored in **your** PostgreSQL database
- No external tracking or telemetry
- Cookie-free tracking option available

### GDPR Compliance

- Built-in consent management
- Data export and deletion APIs
- IP anonymization options
- EU hosting supported

### Security Features

- TLS encryption
- Rate limiting
- XSS/CSRF protection
- Two-factor authentication
- Passkey support (WebAuthn)

---

## 📚 Documentation

| Document                                     | Description                      |
| -------------------------------------------- | -------------------------------- |
| [Self-Hosting Guide](./docs/SELF_HOSTING.md) | Detailed deployment instructions |
| [Configuration](./docs/CONFIGURATION.md)     | Environment variables            |
| [API Reference](./docs/API.md)               | REST API documentation           |
| [Tracker Reference](./docs/TRACKER.md)       | Tracking script options          |
| [Upgrading](./docs/UPGRADING.md)             | Version migration guides         |
| [FAQ](./docs/FAQ.md)                         | Frequently asked questions       |

---

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 16+
- Redis (optional)

### Setup

```bash
# Clone and install
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss
pnpm install

# Start databases
docker-compose up -d postgres redis

# Setup environment
cp .env.example .env

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Quality Tools

This project uses:

- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks
- **commitlint** - Conventional commits
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm type-check   # TypeScript check
pnpm test         # Run tests
pnpm test:coverage # Run tests with coverage
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md).

### Quick Start

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/globo-analytics-oss.git

# Create a feature branch
git checkout -b feature/my-feature

# Make changes and commit (conventional commits enforced)
git commit -m "feat: add my feature"

# Push and create PR to dev branch
git push origin feature/my-feature
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

---

## 📄 License

GloboAnalytics OSS is licensed under [AGPL-3.0](./LICENSE).

**What this means:**

- ✅ Free to use for any purpose
- ✅ Free to modify and distribute
- ✅ Free to use commercially
- ⚠️ Modifications must be open-sourced under AGPL
- ⚠️ Network use counts as distribution

**Need a commercial license?** [Contact us](mailto:enterprise@globoanalytics.com) for options without AGPL obligations.

---

## 🙏 Acknowledgements

Built with:

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://radix-ui.com/) - Components
- [Recharts](https://recharts.org/) - Charts
- [Lucide](https://lucide.dev/) - Icons

---

<p align="center">
  <sub>Built with ❤️ by the GloboAnalytics team</sub>
</p>
