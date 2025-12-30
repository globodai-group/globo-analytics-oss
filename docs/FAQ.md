# Frequently Asked Questions

## General

### What is GloboAnalytics?

GloboAnalytics is an open-source, privacy-focused web analytics platform. It's a self-hosted alternative to Google Analytics that gives you full control over your data.

### Is it really free?

Yes! The Community Edition is free forever with no limits on pageviews or visitors. Premium features (heatmaps, session recording, AI insights) require a license.

### How does it compare to Google Analytics?

| Feature           | GloboAnalytics              | Google Analytics       |
| ----------------- | --------------------------- | ---------------------- |
| Privacy           | Your data, your servers     | Google's servers       |
| GDPR Compliance   | Built-in                    | Requires configuration |
| Cookie Consent    | Optional (cookie-free mode) | Required               |
| Real-time         | Yes                         | Yes                    |
| Heatmaps          | Pro license                 | No                     |
| Session Recording | Pro license                 | No                     |
| Price             | Free (OSS) / €29-199/mo     | Free / Paid            |

### How does it compare to Plausible/Umami?

GloboAnalytics offers similar privacy-focused analytics with additional features like heatmaps, session recording, and AI insights available through premium licenses.

---

## Installation

### What are the system requirements?

- 1 CPU core, 1GB RAM minimum
- PostgreSQL 15+
- Node.js 20+ (for manual install)
- Docker (recommended)

### Can I run it on shared hosting?

No, GloboAnalytics requires server-side execution. You need a VPS, dedicated server, or container platform (Railway, Render, Heroku, etc.).

### Does it work with MySQL?

No, only PostgreSQL is supported. PostgreSQL is required for specific features like JSONB and advanced queries.

### Can I run multiple instances?

Yes, for high availability you can run multiple app instances behind a load balancer. Use Redis for shared sessions and rate limiting.

---

## Tracking

### Does the tracker slow down my website?

No. The tracker is < 1KB gzipped and loads asynchronously. It has zero impact on your Core Web Vitals.

### Does it use cookies?

By default, no. GloboAnalytics uses a privacy-preserving fingerprint hash. You can optionally enable cookies for more accurate returning visitor tracking.

### How does it count unique visitors?

We use a daily-rotating hash of: IP + User-Agent + Salt. This provides accurate unique visitor counts without storing personal data.

### Does it track logged-in users?

You can optionally pass a hashed user ID for more accurate cross-device tracking:

```javascript
gr("set", "userId", "hashed_user_id");
```

### Can I track events?

Yes:

```javascript
gr("event", "button_click", { category: "ui" });
```

### Does it work with SPAs?

Yes. Use `data-hash-mode="true"` or manually call `gr('pageview')` on route changes.

---

## Privacy & Compliance

### Is it GDPR compliant?

Yes, GloboAnalytics is designed for GDPR compliance:

- No personal data stored
- Cookie-free mode available
- Data stays on your servers
- Built-in consent management

### Do I need a cookie banner?

If using cookie-free mode, no. If you enable cookies for enhanced tracking, yes.

### Where is data stored?

All data is stored in YOUR PostgreSQL database. We have zero access to your data.

### What about premium features?

Premium features (heatmaps, AI) send data to our API for processing, but:

- Data is processed transiently
- We don't store your data
- Results are returned immediately

---

## Premium Features

### What's included in the free version?

- Unlimited pageviews and events
- Real-time dashboard
- Visitor, session, geographic analytics
- Device and browser stats
- Traffic sources and referrers
- 3 goals, 1 funnel
- CSV export
- Full API access

### What requires a Pro license?

- Heatmaps (click, scroll, move)
- Session recording
- ML bot detection
- Unlimited goals and funnels
- A/B testing
- Retention analysis
- PDF reports

### What requires an Enterprise license?

- AI-powered insights
- Predictive analytics
- White-label branding
- SSO/SAML
- Role-based access control
- Audit logs

### How do I activate a license?

Add your license key to `.env`:

```bash
LICENSE_KEY=GLOB-PRO-xxxxx
```

Then restart the application.

### Can I try premium features?

Contact us for a trial license: [sales@globoanalytics.com](mailto:sales@globoanalytics.com)

---

## Troubleshooting

### Events aren't being tracked

1. Check project ID is correct
2. Verify no ad blocker is active
3. Check browser console for errors
4. Verify CORS headers are correct

### Dashboard shows no data

1. Wait a few minutes for data to process
2. Check date range selector
3. Verify database connection
4. Check application logs

### Getting 500 errors

Check logs for details:

```bash
docker-compose logs app
# or
pm2 logs globo-analytics
```

Common causes:

- Database connection issues
- Missing environment variables
- Memory limits exceeded

### Migration failed

1. Check database connectivity
2. Ensure database user has CREATE TABLE permissions
3. Try running manually: `pnpm db:migrate`

### Redis connection errors

Redis is optional. If not using Redis, remove `REDIS_URL` from your `.env`. The app will use in-memory caching.

---

## Upgrading

### How do I upgrade?

Docker:

```bash
docker-compose pull && docker-compose up -d
```

Manual:

```bash
git pull origin main
pnpm install
pnpm db:migrate
pnpm build
```

### Are upgrades automatic?

No, you control when to upgrade. We recommend pinning to specific versions in production.

### Will I lose data when upgrading?

No, your data is preserved. Always backup before major upgrades.

---

## Contributing

### How can I contribute?

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Add translations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

### Can I use this for commercial projects?

Yes, under AGPL-3.0 terms. If you modify the code and distribute or run it as a service, you must share your modifications.

For commercial use without AGPL obligations, contact us for a commercial license.

---

## Support

### Where can I get help?

- [GitHub Discussions](https://github.com/globodai-group/globo-analytics-oss/discussions) - Questions
- [GitHub Issues](https://github.com/globodai-group/globo-analytics-oss/issues) - Bugs
- [Discord](https://discord.gg/globoanalytics) - Community chat

### Is there paid support?

- **Pro license**: Priority email support
- **Enterprise license**: Dedicated support channel, 24/7

---

## Still have questions?

Join our [Discord community](https://discord.gg/globoanalytics) or start a [GitHub Discussion](https://github.com/globodai-group/globo-analytics-oss/discussions).
