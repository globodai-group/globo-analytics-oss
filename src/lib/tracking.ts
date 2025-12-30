// Generate tracking code for a website
export function generateTrackingCode(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com";

  return `<!-- GloboAnalytics Analytics -->
<script defer src="${appUrl}/js/tracker.js" id="gr-tracker" data-host="${appUrl}"></script>
<!-- End GloboAnalytics Analytics -->`;
}
