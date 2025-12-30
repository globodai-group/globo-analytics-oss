# Changelog

All notable changes to GloboAnalytics will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open-source release

---

## [1.0.0] - 2024-12-30

### Added
- **Core Analytics**
  - Real-time visitor tracking
  - Pageview and event collection
  - Session tracking with engagement time
  - Unique visitor identification (privacy-preserving)

- **Dashboard**
  - Real-time analytics widget
  - Date range picker with presets
  - Traffic overview charts
  - Geographic breakdown with world map
  - Device and browser statistics
  - Traffic sources and referrers

- **Tracking**
  - Lightweight tracker.js (< 1KB gzipped)
  - Automatic pageview tracking
  - Custom event tracking API
  - UTM parameter parsing
  - Referrer detection
  - Cookie-free mode option

- **Goals & Funnels**
  - Goal creation and tracking
  - Conversion rate monitoring
  - Funnel visualization (Community: 1 funnel)
  - Event-based goal triggers

- **Export**
  - CSV export for all data
  - API access for integrations

- **Authentication**
  - Email/password authentication
  - OAuth providers (Google, GitHub)
  - Two-factor authentication
  - Password reset flow

- **Multi-tenancy**
  - Multiple projects support
  - Team collaboration
  - Project-level permissions

- **Privacy**
  - GDPR compliance tools
  - Cookie consent management
  - Data export API
  - Data deletion API

- **Infrastructure**
  - Docker deployment
  - PostgreSQL database
  - Redis caching (optional)
  - Prisma ORM

### Premium Features (License Required)

- **Pro License**
  - Heatmaps (click, scroll, move)
  - Session recording
  - ML-powered bot detection
  - Unlimited goals and funnels
  - A/B testing
  - Retention analysis
  - PDF export

- **Enterprise License**
  - AI-powered insights
  - Predictive analytics
  - White-label branding
  - SSO/SAML authentication
  - Role-based access control
  - Audit logs
  - Priority support

### Security
- Rate limiting on all endpoints
- CSRF protection
- XSS prevention with DOMPurify
- SQL injection protection via Prisma
- Secure session management
- HTTPS enforcement

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2024-12-30 | Initial release |

---

## Upgrade Notes

### Upgrading to 1.0.0

This is the initial release. No migration needed.

For future upgrades:
1. Always backup your database before upgrading
2. Read the migration notes for your version
3. Run `pnpm db:migrate` after updating

---

## Links

- [Full Documentation](./docs/)
- [Migration Guides](./docs/UPGRADING.md)
- [GitHub Releases](https://github.com/globodai-group/globo-analytics-oss/releases)
