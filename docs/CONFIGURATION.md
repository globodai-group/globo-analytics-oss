# Configuration Reference

Complete reference for all GloboAnalytics environment variables.

## Required Variables

These must be set for the application to function.

| Variable          | Description                        | Example                               |
| ----------------- | ---------------------------------- | ------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string       | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Session encryption key (64+ chars) | `openssl rand -base64 48`             |
| `NEXTAUTH_URL`    | Your application URL               | `https://analytics.example.com`       |

## Application Settings

| Variable               | Description              | Default              |
| ---------------------- | ------------------------ | -------------------- |
| `NEXT_PUBLIC_APP_NAME` | Display name in UI       | `GloboAnalytics`     |
| `NEXT_PUBLIC_APP_URL`  | Public URL (for tracker) | Same as NEXTAUTH_URL |
| `NODE_ENV`             | Environment mode         | `production`         |
| `LOG_LEVEL`            | Logging verbosity        | `info`               |

## Database

| Variable             | Description           | Default  |
| -------------------- | --------------------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection | Required |
| `DATABASE_POOL_SIZE` | Connection pool size  | `10`     |

### Connection String Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### SSL Connections

For hosted PostgreSQL (Railway, Supabase, etc.):

```
postgresql://user:pass@host:5432/db?sslmode=require
```

## Cache (Redis)

| Variable    | Description             | Default  |
| ----------- | ----------------------- | -------- |
| `REDIS_URL` | Redis connection string | Optional |

Redis is optional but recommended for:

- Session storage in multi-instance deployments
- Rate limiting
- Caching

### Connection String Format

```
redis://[[username:]password@]host[:port][/database]
redis://localhost:6379
redis://:password@redis.example.com:6379/0
```

## Authentication

### Session

| Variable          | Description            | Default  |
| ----------------- | ---------------------- | -------- |
| `NEXTAUTH_SECRET` | Session encryption key | Required |
| `NEXTAUTH_URL`    | Callback URL base      | Required |

### OAuth: Google

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Setup: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### OAuth: GitHub

| Variable               | Description             |
| ---------------------- | ----------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app ID     |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |

Setup: [GitHub Developer Settings](https://github.com/settings/developers)

## Email (SMTP)

Required for password reset and email notifications.

| Variable     | Description          | Example               |
| ------------ | -------------------- | --------------------- |
| `SMTP_HOST`  | SMTP server hostname | `smtp.sendgrid.net`   |
| `SMTP_PORT`  | SMTP port            | `587`                 |
| `SMTP_USER`  | SMTP username        | `apikey`              |
| `SMTP_PASS`  | SMTP password        | `SG.xxxxx`            |
| `EMAIL_FROM` | Sender email address | `noreply@example.com` |

### Provider Examples

**SendGrid:**

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key
```

**AWS SES:**

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Resend:**

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxx
```

## License (Premium Features)

| Variable      | Description                     |
| ------------- | ------------------------------- |
| `LICENSE_KEY` | Your GloboAnalytics license key |

License formats:

- `GLOB-PRO-xxxxx` - Pro features
- `GLOB-ENT-xxxxx` - Enterprise features

Get a license: [globoanalytics.com/pricing](https://globoanalytics.com/pricing)

## Cloud API

For premium features (heatmaps, recording, AI).

| Variable          | Description        | Default                          |
| ----------------- | ------------------ | -------------------------------- |
| `GLOBO_CLOUD_URL` | Cloud API endpoint | `https://api.globoanalytics.com` |

## Security

| Variable            | Description             | Default |
| ------------------- | ----------------------- | ------- |
| `RATE_LIMIT_MAX`    | Max requests per window | `100`   |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms)  | `60000` |

## Tracking

| Variable           | Description               | Default      |
| ------------------ | ------------------------- | ------------ |
| `TRACKER_ENDPOINT` | Event collection endpoint | `/api/event` |
| `SESSION_TIMEOUT`  | Session timeout (seconds) | `1800`       |

## Complete .env Example

```bash
# =============================================================================
# REQUIRED
# =============================================================================
DATABASE_URL="postgresql://globoanalytics:password@localhost:5432/globoanalytics"
NEXTAUTH_SECRET="your-64-character-secret-key-generated-with-openssl-rand-base64-48"
NEXTAUTH_URL="https://analytics.yourdomain.com"

# =============================================================================
# APPLICATION
# =============================================================================
NEXT_PUBLIC_APP_NAME="My Analytics"
NEXT_PUBLIC_APP_URL="https://analytics.yourdomain.com"
NODE_ENV="production"
LOG_LEVEL="info"

# =============================================================================
# CACHE (Optional but recommended)
# =============================================================================
REDIS_URL="redis://localhost:6379"

# =============================================================================
# EMAIL (Optional - for auth emails)
# =============================================================================
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxx"
EMAIL_FROM="analytics@yourdomain.com"

# =============================================================================
# OAUTH (Optional)
# =============================================================================
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# =============================================================================
# LICENSE (Optional - for premium features)
# =============================================================================
LICENSE_KEY=""

# =============================================================================
# ADVANCED
# =============================================================================
# GLOBO_CLOUD_URL="https://api.globoanalytics.com"
# RATE_LIMIT_MAX="100"
# RATE_LIMIT_WINDOW="60000"
```

## Environment-Specific Files

For different environments, create:

- `.env.local` - Local development
- `.env.production` - Production overrides
- `.env.test` - Test environment

Priority: `.env.local` > `.env.production` > `.env`

## Docker Environment

When using Docker Compose, you can:

1. Use a `.env` file (loaded automatically)
2. Pass variables directly in `docker-compose.yml`
3. Use Docker secrets for sensitive data

```yaml
services:
  app:
    env_file:
      - .env
    environment:
      - NODE_ENV=production
```

## Validation

On startup, the application validates:

- `DATABASE_URL` is a valid PostgreSQL URL
- `NEXTAUTH_SECRET` is at least 64 characters
- `NEXTAUTH_URL` is a valid URL

Missing or invalid required variables will prevent startup.
