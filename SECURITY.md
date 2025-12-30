# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at GloboAnalytics. If you discover a security vulnerability, please follow these steps:

### 1. Do NOT Create a Public Issue

Please do not report security vulnerabilities through public GitHub issues. This could put users at risk.

### 2. Report Privately

Send an email to [security@globoanalytics.com](mailto:security@globoanalytics.com) with:

- **Subject**: `[SECURITY] Brief description`
- **Description**: Detailed description of the vulnerability
- **Steps to Reproduce**: How to trigger the vulnerability
- **Impact**: What an attacker could achieve
- **Suggested Fix**: If you have ideas on how to fix it

### 3. What to Expect

- **Acknowledgment**: We will acknowledge your email within 48 hours
- **Assessment**: We will assess the vulnerability and determine its severity
- **Timeline**: We will provide an estimated timeline for a fix
- **Credit**: We will credit you in the security advisory (if desired)

### 4. Disclosure Timeline

- **0 days**: Initial report received
- **2 days**: Acknowledgment sent
- **7 days**: Initial assessment completed
- **30 days**: Target for fix release
- **90 days**: Public disclosure (coordinated)

## Security Measures

GloboAnalytics implements the following security measures:

### Authentication & Authorization
- Secure password hashing (bcrypt)
- Session-based authentication
- Two-factor authentication (TOTP)
- OAuth 2.0 support
- JWT with short expiration

### Input Validation
- Server-side validation on all inputs
- SQL injection prevention via Prisma ORM
- XSS prevention with DOMPurify
- CSRF tokens on all forms

### Network Security
- HTTPS enforced in production
- Secure headers (HSTS, CSP, X-Frame-Options)
- Rate limiting on authentication endpoints
- IP-based blocking for repeated failures

### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS 1.3)
- Privacy-preserving visitor identification
- No third-party data sharing

### Infrastructure
- Regular dependency updates
- Automated security scanning
- Docker container security
- Minimal attack surface

## Best Practices for Self-Hosters

If you're self-hosting GloboAnalytics, please follow these guidelines:

### Required
- [ ] Use HTTPS with a valid certificate
- [ ] Set a strong `NEXTAUTH_SECRET` (64+ characters)
- [ ] Keep your instance updated
- [ ] Use strong database passwords
- [ ] Enable firewall rules

### Recommended
- [ ] Use a reverse proxy (nginx, Caddy)
- [ ] Enable fail2ban or similar
- [ ] Regular backups
- [ ] Monitor logs for anomalies
- [ ] Use private network for database

### Environment Variables

Never commit `.env` files. Ensure these are set securely:

```bash
# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 48)

# Use environment-specific URLs
NEXTAUTH_URL=https://your-domain.com

# Secure database credentials
DATABASE_URL=postgresql://user:STRONG_PASSWORD@host:5432/db
```

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1, 1.0.2).

Subscribe to security notifications:
- Watch the repository with "Releases only"
- Follow [@globoanalytics](https://twitter.com/globoanalytics)
- Join our [Discord](https://discord.gg/globoanalytics) #security channel

## Bug Bounty

We currently do not offer a paid bug bounty program. However, we deeply appreciate security researchers who help us improve.

Contributors who report valid security issues will be:
- Credited in our security advisories
- Listed in our Hall of Fame
- Given early access to new features

## Hall of Fame

We thank the following researchers for responsibly disclosing vulnerabilities:

*No reports yet - be the first!*

---

Thank you for helping keep GloboAnalytics secure!
