# Tracking Script Reference

Complete guide to implementing the GloboAnalytics tracker on your website.

## Quick Start

Add this script to your website, just before `</head>`:

```html
<script defer src="https://your-analytics-domain.com/tracker.js"
        data-project-id="YOUR_PROJECT_ID">
</script>
```

That's it! Pageviews will be tracked automatically.

---

## Script Attributes

| Attribute | Required | Description | Default |
|-----------|----------|-------------|---------|
| `data-project-id` | Yes | Your project identifier | - |
| `data-track-outbound` | No | Track outbound link clicks | `false` |
| `data-track-downloads` | No | Track file downloads | `false` |
| `data-honor-dnt` | No | Respect Do Not Track | `false` |
| `data-hash-mode` | No | Track hash changes (SPA) | `false` |
| `data-domain` | No | Override tracked domain | Current domain |
| `data-api` | No | Custom API endpoint | `/api/event` |

### Example with All Options

```html
<script defer src="https://analytics.example.com/tracker.js"
        data-project-id="proj_abc123"
        data-track-outbound="true"
        data-track-downloads="true"
        data-honor-dnt="true"
        data-hash-mode="true">
</script>
```

---

## JavaScript API

The tracker exposes a global `gr` function for custom tracking.

### Pageview Tracking

Pageviews are tracked automatically on page load. For SPAs, you can manually trigger:

```javascript
// Track a pageview
gr('pageview');

// Track with custom URL
gr('pageview', { url: '/custom/path' });

// Track with custom title
gr('pageview', { url: '/page', title: 'Custom Title' });
```

### Event Tracking

Track custom events for user interactions:

```javascript
// Basic event
gr('event', 'Button Click');

// Event with category
gr('event', 'signup', { category: 'conversion' });

// Event with properties
gr('event', 'purchase', {
  category: 'ecommerce',
  value: 99.99,
  currency: 'EUR'
});

// Event with custom dimensions (Pro)
gr('event', 'video_play', {
  cd1: 'homepage',      // Custom dimension 1
  cd2: 'hero_video',    // Custom dimension 2
  duration: 120
});
```

### Goal Tracking

Track goal completions:

```javascript
// Simple goal
gr('goal', 'newsletter_signup');

// Goal with value
gr('goal', 'purchase', { value: 149.99 });
```

### User Identification

For logged-in users (anonymized):

```javascript
// Set user ID (hashed internally)
gr('set', 'userId', 'user_12345');

// Clear on logout
gr('set', 'userId', null);
```

---

## Single Page Applications (SPA)

### React / Next.js

```jsx
// components/Analytics.jsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track pageview on route change
    if (typeof gr !== 'undefined') {
      gr('pageview');
    }
  }, [pathname, searchParams]);

  return null;
}

// app/layout.jsx
import Script from 'next/script';
import { Analytics } from '@/components/Analytics';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          defer
          src="https://analytics.example.com/tracker.js"
          data-project-id="YOUR_PROJECT_ID"
          data-hash-mode="true"
        />
      </head>
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
```

### Vue.js / Nuxt

```javascript
// plugins/analytics.client.js
export default defineNuxtPlugin(() => {
  const router = useRouter();

  router.afterEach(() => {
    if (typeof gr !== 'undefined') {
      gr('pageview');
    }
  });
});
```

### React Router

```jsx
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof gr !== 'undefined') {
      gr('pageview');
    }
  }, [location]);
}
```

---

## E-commerce Tracking

### Product View

```javascript
gr('event', 'view_product', {
  category: 'ecommerce',
  product_id: 'SKU123',
  product_name: 'Blue T-Shirt',
  price: 29.99,
  currency: 'EUR'
});
```

### Add to Cart

```javascript
gr('event', 'add_to_cart', {
  category: 'ecommerce',
  product_id: 'SKU123',
  quantity: 2,
  value: 59.98
});
```

### Purchase

```javascript
gr('event', 'purchase', {
  category: 'ecommerce',
  transaction_id: 'TXN123456',
  value: 149.99,
  currency: 'EUR',
  items: 3
});

// Also track as goal
gr('goal', 'purchase', { value: 149.99 });
```

---

## UTM Campaign Tracking

UTM parameters are automatically captured from URLs:

```
https://yoursite.com/?utm_source=google&utm_medium=cpc&utm_campaign=summer_sale
```

Captured parameters:
- `utm_source` - Traffic source
- `utm_medium` - Marketing medium
- `utm_campaign` - Campaign name
- `utm_term` - Paid search keywords
- `utm_content` - Ad variation

---

## Privacy Features

### Cookie-Free Mode

The tracker works without cookies by default, using a privacy-preserving visitor hash.

### Do Not Track

Enable DNT respect:

```html
<script defer src="/tracker.js"
        data-project-id="YOUR_ID"
        data-honor-dnt="true">
</script>
```

### Exclude Tracking

Exclude yourself from tracking:

```javascript
// In browser console
localStorage.setItem('globo_exclude', 'true');
```

### Consent Integration

Wait for user consent before tracking:

```javascript
// Don't track by default
gr('set', 'consent', false);

// After user gives consent
function onConsentGranted() {
  gr('set', 'consent', true);
  gr('pageview'); // Track initial pageview
}
```

---

## Debugging

### Enable Debug Mode

```javascript
// In browser console
localStorage.setItem('globo_debug', 'true');
```

Debug mode logs all events to the console.

### Verify Tracking

Check the Network tab for requests to `/api/event`:

```
POST /api/event
{
  "type": "pageview",
  "url": "https://example.com/page",
  "referrer": "https://google.com",
  "projectId": "proj_abc123"
}
```

### Common Issues

**Events not appearing?**
1. Check project ID is correct
2. Verify no ad blocker is active
3. Check browser console for errors

**Pageviews counted twice?**
1. Ensure script is only included once
2. For SPAs, disable automatic tracking if manually calling `gr('pageview')`

---

## Script Size

| Version | Size |
|---------|------|
| Minified | ~800 bytes |
| Gzipped | ~450 bytes |

The tracker has zero impact on your site's performance score.

---

## Content Security Policy

If using CSP, add these directives:

```
script-src 'self' https://analytics.example.com;
connect-src 'self' https://analytics.example.com;
```

---

## Framework-Specific Packages

Coming soon:
- `@globoanalytics/react`
- `@globoanalytics/vue`
- `@globoanalytics/angular`
- `@globoanalytics/svelte`

---

## API Reference

### gr(command, [name], [options])

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | `pageview`, `event`, `goal`, `set` |
| `name` | string | Event/goal name (required for event/goal) |
| `options` | object | Additional data |

### Options Object

| Property | Type | Description |
|----------|------|-------------|
| `url` | string | Override URL |
| `title` | string | Override page title |
| `referrer` | string | Override referrer |
| `category` | string | Event category |
| `value` | number | Numeric value |
| `cd1`-`cd5` | string | Custom dimensions (Pro) |
