# Upgrading Guide

This guide covers upgrading between GloboAnalytics versions.

## Upgrade Process

### Docker

```bash
# 1. Backup your database
docker exec -t postgres pg_dump -U globoanalytics globoanalytics > backup.sql

# 2. Pull new version
docker-compose pull

# 3. Stop current version
docker-compose down

# 4. Start new version (migrations run automatically)
docker-compose up -d

# 5. Verify
docker-compose logs -f app
```

### Manual Installation

```bash
# 1. Backup your database
pg_dump -U globoanalytics globoanalytics > backup.sql

# 2. Pull latest code
git fetch origin
git checkout v1.2.0  # or specific version

# 3. Install dependencies
pnpm install

# 4. Run migrations
pnpm db:migrate

# 5. Rebuild
pnpm build

# 6. Restart
pm2 restart globo-analytics
```

---

## Version Pinning

We strongly recommend pinning to specific versions in production.

### Docker

```yaml
# docker-compose.yml
services:
  app:
    image: globoanalytics/oss:v1.0.0  # Pin version
```

### Git

```bash
# Use specific tag
git checkout v1.0.0

# Or specific commit
git checkout abc123def
```

---

## Semantic Versioning

We follow [SemVer](https://semver.org/):

- **MAJOR** (1.x.x → 2.x.x): Breaking changes, may require migration
- **MINOR** (1.0.x → 1.1.x): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

---

## Migration Notes

### v1.0.0 (Initial Release)

This is the initial release. No migration needed.

---

## Future Versions

Migration guides will be added here as new versions are released.

### Template for Future Migrations

```markdown
### v1.1.0

**Release Date:** TBD

**New Features:**
- Feature 1
- Feature 2

**Breaking Changes:**
- None

**Migration Steps:**
1. Standard upgrade process

**Database Migrations:**
- Auto-applied on startup
```

---

## Rollback

If you need to rollback to a previous version:

### Docker

```bash
# 1. Stop current version
docker-compose down

# 2. Edit docker-compose.yml to previous version
# image: globoanalytics/oss:v1.0.0

# 3. Restore database backup
docker exec -i postgres psql -U globoanalytics globoanalytics < backup.sql

# 4. Start previous version
docker-compose up -d
```

### Manual

```bash
# 1. Stop application
pm2 stop globo-analytics

# 2. Checkout previous version
git checkout v1.0.0

# 3. Restore database
psql -U globoanalytics globoanalytics < backup.sql

# 4. Reinstall dependencies
pnpm install

# 5. Rebuild and start
pnpm build
pm2 start globo-analytics
```

---

## Database Backup Best Practices

### Automated Daily Backups

```bash
#!/bin/bash
# /scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups

# Create backup
pg_dump -U globoanalytics globoanalytics | gzip > $BACKUP_DIR/globo_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "globo_*.sql.gz" -mtime +30 -delete

# Optional: Upload to S3
# aws s3 cp $BACKUP_DIR/globo_$DATE.sql.gz s3://your-bucket/backups/
```

Add to crontab:
```bash
0 3 * * * /scripts/backup.sh
```

### Before Major Upgrades

Always create a manual backup before upgrading:

```bash
# With timestamp
pg_dump -U globoanalytics globoanalytics > backup_before_upgrade_$(date +%Y%m%d).sql
```

---

## Checking Current Version

### From UI

Version is displayed in the footer of the dashboard.

### From API

```bash
curl https://your-analytics.com/api/health
# {"status":"ok","version":"1.0.0"}
```

### From Container

```bash
docker exec globo-analytics cat package.json | grep version
```

---

## Release Notifications

Stay updated on new releases:

1. **GitHub Releases**: Watch the repo with "Releases only"
2. **Discord**: Join #announcements channel
3. **Twitter**: Follow [@globoanalytics](https://twitter.com/globoanalytics)

---

## Support

Having issues upgrading?

- [GitHub Discussions](https://github.com/globodai-group/globo-analytics-oss/discussions)
- [Discord](https://discord.gg/globoanalytics)
