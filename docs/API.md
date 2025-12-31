# API Reference

GloboAnalytics provides a REST API for programmatic access to your analytics data.

## Base URL

```
https://your-analytics-domain.com/api
```

## Authentication

All API requests require authentication via API key.

### Getting an API Key

1. Go to Settings > API Keys
2. Click "Create API Key"
3. Copy the key (it won't be shown again)

### Using the API Key

Include the key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://analytics.example.com/api/v1/projects
```

---

## Rate Limits

| Plan       | Requests/Hour |
| ---------- | ------------- |
| Community  | 1,000         |
| Pro        | 10,000        |
| Enterprise | Unlimited     |

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Projects

### List Projects

```http
GET /api/v1/projects
```

**Response:**

```json
{
  "data": [
    {
      "id": "proj_abc123",
      "name": "My Website",
      "domain": "example.com",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "perPage": 20
  }
}
```

### Get Project

```http
GET /api/v1/projects/:id
```

### Create Project

```http
POST /api/v1/projects
Content-Type: application/json

{
  "name": "New Website",
  "domain": "newsite.com"
}
```

### Update Project

```http
PATCH /api/v1/projects/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Project

```http
DELETE /api/v1/projects/:id
```

---

## Statistics

### Overview Stats

```http
GET /api/v1/projects/:id/stats
```

**Query Parameters:**

| Parameter  | Type   | Description             | Default    |
| ---------- | ------ | ----------------------- | ---------- |
| `start`    | date   | Start date (YYYY-MM-DD) | 7 days ago |
| `end`      | date   | End date (YYYY-MM-DD)   | Today      |
| `interval` | string | `hour`, `day`, `month`  | `day`      |

**Response:**

```json
{
  "data": {
    "visitors": 1234,
    "pageviews": 5678,
    "sessions": 2345,
    "bounceRate": 45.2,
    "avgSessionDuration": 180,
    "comparison": {
      "visitors": 12.5,
      "pageviews": 8.3
    }
  }
}
```

### Time Series

```http
GET /api/v1/projects/:id/stats/timeseries
```

**Response:**

```json
{
  "data": [
    {
      "date": "2024-01-01",
      "visitors": 100,
      "pageviews": 450,
      "sessions": 120
    },
    {
      "date": "2024-01-02",
      "visitors": 120,
      "pageviews": 520,
      "sessions": 140
    }
  ]
}
```

### Pages

```http
GET /api/v1/projects/:id/stats/pages
```

**Response:**

```json
{
  "data": [
    {
      "path": "/",
      "pageviews": 1200,
      "visitors": 800,
      "avgTime": 45,
      "bounceRate": 35.2
    },
    {
      "path": "/pricing",
      "pageviews": 450,
      "visitors": 400,
      "avgTime": 120,
      "bounceRate": 25.0
    }
  ]
}
```

### Sources

```http
GET /api/v1/projects/:id/stats/sources
```

**Response:**

```json
{
  "data": [
    {
      "source": "google",
      "visitors": 500,
      "percentage": 40.5
    },
    {
      "source": "direct",
      "visitors": 300,
      "percentage": 24.3
    }
  ]
}
```

### Geographic

```http
GET /api/v1/projects/:id/stats/geo
```

**Response:**

```json
{
  "data": [
    {
      "country": "FR",
      "countryName": "France",
      "visitors": 450,
      "percentage": 36.5
    },
    {
      "country": "US",
      "countryName": "United States",
      "visitors": 320,
      "percentage": 26.0
    }
  ]
}
```

### Devices

```http
GET /api/v1/projects/:id/stats/devices
```

**Response:**

```json
{
  "data": {
    "browsers": [
      { "name": "Chrome", "visitors": 600, "percentage": 48.6 },
      { "name": "Safari", "visitors": 350, "percentage": 28.3 }
    ],
    "os": [
      { "name": "Windows", "visitors": 500, "percentage": 40.5 },
      { "name": "macOS", "visitors": 400, "percentage": 32.4 }
    ],
    "deviceTypes": [
      { "name": "Desktop", "visitors": 700, "percentage": 56.7 },
      { "name": "Mobile", "visitors": 450, "percentage": 36.4 }
    ]
  }
}
```

---

## Real-Time

### Current Visitors

```http
GET /api/v1/projects/:id/realtime
```

**Response:**

```json
{
  "data": {
    "visitors": 23,
    "pageviews": 45,
    "topPages": [
      { "path": "/", "visitors": 10 },
      { "path": "/pricing", "visitors": 5 }
    ],
    "topCountries": [
      { "country": "FR", "visitors": 12 },
      { "country": "US", "visitors": 8 }
    ]
  }
}
```

---

## Events

### List Events

```http
GET /api/v1/projects/:id/events
```

**Response:**

```json
{
  "data": [
    {
      "name": "signup",
      "count": 150,
      "visitors": 145,
      "conversionRate": 3.2
    },
    {
      "name": "purchase",
      "count": 45,
      "visitors": 43,
      "totalValue": 4500.0
    }
  ]
}
```

### Event Details

```http
GET /api/v1/projects/:id/events/:name
```

---

## Goals

### List Goals

```http
GET /api/v1/projects/:id/goals
```

### Create Goal

```http
POST /api/v1/projects/:id/goals
Content-Type: application/json

{
  "name": "Newsletter Signup",
  "type": "event",
  "eventName": "newsletter_subscribe"
}
```

### Goal Conversions

```http
GET /api/v1/projects/:id/goals/:id/conversions
```

---

## Export

### Export Data

```http
GET /api/v1/projects/:id/export
```

**Query Parameters:**

| Parameter | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| `start`   | date   | Start date                        |
| `end`     | date   | End date                          |
| `format`  | string | `csv` or `json`                   |
| `type`    | string | `pageviews`, `events`, `sessions` |

**Response (CSV):**

```
date,path,pageviews,visitors
2024-01-01,/,450,300
2024-01-01,/pricing,120,100
```

---

## Errors

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_PROJECT",
    "message": "Project not found",
    "status": 404
  }
}
```

### Error Codes

| Code              | Status | Description                |
| ----------------- | ------ | -------------------------- |
| `UNAUTHORIZED`    | 401    | Invalid or missing API key |
| `FORBIDDEN`       | 403    | Access denied to resource  |
| `NOT_FOUND`       | 404    | Resource not found         |
| `RATE_LIMITED`    | 429    | Too many requests          |
| `INVALID_REQUEST` | 400    | Malformed request          |
| `SERVER_ERROR`    | 500    | Internal server error      |

---

## SDKs

Official SDKs coming soon:

- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Go

---

## Webhooks

Configure webhooks to receive real-time notifications.

### Available Events

- `goal.completed` - Goal conversion
- `alert.triggered` - Alert threshold reached
- `daily.summary` - Daily stats summary

### Webhook Payload

```json
{
  "event": "goal.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "project": {
    "id": "proj_abc123",
    "name": "My Website"
  },
  "data": {
    "goalId": "goal_xyz",
    "goalName": "Purchase",
    "value": 99.99
  }
}
```

### Webhook Security

Verify webhook signatures using the `X-Signature` header:

```javascript
const crypto = require("crypto");

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```
