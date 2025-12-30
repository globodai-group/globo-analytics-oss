<p align="center">
  <img src="https://raw.githubusercontent.com/globodai-group/globo-analytics-oss/main/.github/assets/logo.svg" alt="GloboAnalytics" width="200"/>
</p>

<h1 align="center">GloboAnalytics</h1>

<p align="center">
  <strong>Privacy-focused, open-source web analytics.</strong><br/>
  A powerful Google Analytics alternative that respects user privacy.
</p>

<p align="center">
  <a href="https://github.com/globodai-group/globo-analytics-oss/actions/workflows/ci.yml">
    <img src="https://github.com/globodai-group/globo-analytics-oss/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <a href="https://codecov.io/gh/globodai-group/globo-analytics-oss">
    <img src="https://codecov.io/gh/globodai-group/globo-analytics-oss/branch/main/graph/badge.svg" alt="Coverage"/>
  </a>
  <a href="https://github.com/globodai-group/globo-analytics-oss/releases">
    <img src="https://img.shields.io/github/v/release/globodai-group/globo-analytics-oss?color=blue" alt="Release"/>
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License"/>
  </a>
  <a href="https://hub.docker.com/r/globoanalytics/oss">
    <img src="https://img.shields.io/docker/pulls/globoanalytics/oss" alt="Docker Pulls"/>
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Docs</a> •
  <a href="#-upgrading">Upgrade</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/globodai-group/globo-analytics-oss/main/.github/assets/dashboard-preview.png" alt="Dashboard Preview" width="800"/>
</p>

---

## Why GloboAnalytics?

- **100% Open Source** - No hidden code, no vendor lock-in
- **Privacy First** - GDPR, CCPA compliant out of the box
- **Self-Hosted** - Your data stays on your servers
- **Lightweight** - < 1KB tracker script, no impact on page speed
- **Real-Time** - See visitors as they happen
- **No Cookies** - Works without consent banners (optional)

---

## ✨ Features

### Free Forever (Community Edition)

| Feature | Description |
|---------|-------------|
| **Unlimited Pageviews** | No caps, no throttling |
| **Real-Time Dashboard** | Live visitor tracking |
| **Visitor Analytics** | Sessions, unique visitors, bounce rate |
| **Geographic Data** | Country, region, city breakdown |
| **Device & Browser** | OS, browser, screen resolution |
| **Traffic Sources** | Referrers, UTM campaigns, search engines |
| **Goals & Events** | Track conversions (3 goals, 1 funnel) |
| **CSV Export** | Export your data anytime |
| **API Access** | Full REST API |
| **Dark Mode** | Easy on the eyes |

### Pro License (€29/month)

Everything in Community, plus:

| Feature | Description |
|---------|-------------|
| **Heatmaps** | See where users click and scroll |
| **Session Recording** | Watch real user sessions |
| **Bot Detection** | ML-powered traffic classification |
| **Unlimited Goals** | No restrictions on tracking |
| **A/B Testing** | Built-in experimentation |
| **Retention Analysis** | Cohort tracking |
| **User Journeys** | Flow visualization |
| **PDF Reports** | Scheduled email reports |

### Enterprise License (€199/month)

Everything in Pro, plus:

| Feature | Description |
|---------|-------------|
| **AI Insights** | LLM-powered analytics intelligence |
| **Predictive Analytics** | Churn prediction, revenue forecasting |
| **White-Label** | Your branding, your domain |
| **SSO/SAML** | Enterprise authentication |
| **Role-Based Access** | Team permissions |
| **Audit Logs** | Compliance tracking |
| **Custom SLA** | 99.9% uptime guarantee |
| **Priority Support** | 24/7 dedicated channel |

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss

# Copy and configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Generate a secure secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 48)" >> .env

# Start the application
docker-compose up -d

# Access at http://localhost:3000
```

### Option 2: Manual Installation

**Prerequisites:** Node.js 20+, PostgreSQL 15+, pnpm

```bash
# Clone the repository
git clone https://github.com/globodai-group/globo-analytics-oss.git
cd globo-analytics-oss

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and settings

# Run database migrations
pnpm db:migrate

# Build for production
pnpm build

# Start the server
pnpm start
```

### Option 3: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/globo-analytics)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/globodai-group/globo-analytics-oss)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/globodai-group/globo-analytics-oss)

---

## 📊 Adding the Tracking Script

Add this snippet to your website, just before `</head>`:

```html
<script defer src="https://your-analytics-domain.com/tracker.js"
        data-project-id="YOUR_PROJECT_ID">
</script>
```

That's it! Events will start flowing to your dashboard.

### Advanced Options

```html
<script defer src="https://your-analytics-domain.com/tracker.js"
        data-project-id="YOUR_PROJECT_ID"
        data-track-outbound="true"
        data-track-downloads="true"
        data-honor-dnt="true">
</script>
```

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-project-id` | Your project identifier | Required |
| `data-track-outbound` | Track outbound link clicks | `false` |
| `data-track-downloads` | Track file downloads | `false` |
| `data-honor-dnt` | Respect Do Not Track | `false` |
| `data-hash-mode` | Track hash changes (SPA) | `false` |

---

## 🔄 Upgrading

### Docker

```bash
# Pull the latest image
docker-compose pull

# Restart with new version
docker-compose up -d

# Check logs for migration status
docker-compose logs -f app
```

### Manual Installation

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Rebuild
pnpm build

# Restart your process manager
pm2 restart globo-analytics
```

### Version Pinning

For production, we recommend pinning to a specific version:

```yaml
# docker-compose.yml
services:
  app:
    image: globoanalytics/oss:v1.2.0  # Pin to specific version
```

See [CHANGELOG.md](./CHANGELOG.md) for version history and migration guides.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  YOUR INFRASTRUCTURE                                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Dashboard   │  │  Tracker.js  │  │     PostgreSQL        │ │
│  │  (Next.js)   │  │  (< 1KB)     │  │    (Your Data)        │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│         │                                       │               │
│         │ Premium Features Only                 │               │
│         ▼                                       │               │
│  ┌────────────────────────────────────┐        │               │
│  │  Cloud API Client (Optional)       │        │               │
│  │  - Heatmaps, Recording, AI, ML     │        │               │
│  └────────────────────────────────────┘        │               │
└─────────────────────────────────────────────────│───────────────┘
                        │                         │
                        │ HTTPS (License Key)     │ Your Data
                        ▼                         │ Never Leaves
┌─────────────────────────────────────────────────│───────────────┐
│  GLOBO CLOUD (api.globoanalytics.com)           │               │
│                                                 │               │
│  Premium processing only:                       │               │
│  • Heatmap aggregation          ┌───────────────┘               │
│  • Session recording            │ Raw data stays                │
│  • ML bot detection             │ on YOUR servers               │
│  • AI insights                  └───────────────────────────────│
│                                                                 │
│  We process and return results. No data retention.              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Privacy & Data

### Your Data, Your Servers

- All analytics data is stored in **your** PostgreSQL database
- We have **zero access** to your data
- Premium features process data transiently (no retention)

### GDPR Compliance

- Cookie-free tracking option available
- Built-in consent management
- Data export and deletion APIs
- EU hosting supported

### Security

- TLS encryption everywhere
- OWASP Top 10 protected
- Rate limiting built-in
- Regular security audits

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Self-Hosting Guide](./docs/SELF_HOSTING.md) | Detailed deployment instructions |
| [Configuration](./docs/CONFIGURATION.md) | All environment variables |
| [API Reference](./docs/API.md) | REST API documentation |
| [Tracker Reference](./docs/TRACKER.md) | Tracking script options |
| [Upgrading](./docs/UPGRADING.md) | Version migration guides |
| [FAQ](./docs/FAQ.md) | Frequently asked questions |

---

## 🤝 Contributing

We love contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/globo-analytics-oss.git
cd globo-analytics-oss

# Install dependencies
pnpm install

# Start development database
docker-compose up -d postgres redis

# Run in development mode
pnpm dev

# Run tests
pnpm test
```

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests
- 🌍 Add translations
- ⭐ Star the project

---

## 💬 Community

- [GitHub Discussions](https://github.com/globodai-group/globo-analytics-oss/discussions) - Questions & ideas
- [Discord](https://discord.gg/globoanalytics) - Real-time chat
- [Twitter](https://twitter.com/globoanalytics) - Updates & news

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

Built with these amazing open-source projects:

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://radix-ui.com/) - Components
- [Recharts](https://recharts.org/) - Charts
- [Lucide](https://lucide.dev/) - Icons

---

<p align="center">
  <sub>Built with ❤️ for the open-source community</sub>
</p>
