import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  GitBranch,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Sparkles,
  TrendingUp,
  Shield,
  Boxes,
  Layers,
  Bot,
  Filter,
  FileSearch,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GloboAnalytics vs Plausible | Full-Featured Privacy Analytics",
  description:
    "Compare GloboAnalytics with Plausible Analytics. Get the same privacy benefits plus funnels, goals, segments, and advanced features Plausible doesn't offer.",
  keywords: [
    "Plausible alternative",
    "Plausible vs",
    "privacy analytics comparison",
    "Plausible features",
    "analytics with funnels",
    "web analytics comparison",
    "advanced analytics",
  ],
  openGraph: {
    title: "GloboAnalytics vs Plausible | More Features, Same Privacy",
    description:
      "Love Plausible's simplicity? GloboAnalytics offers the same privacy focus with advanced features like funnels, goals, and segments.",
    type: "website",
  },
};

// Feature comparison
const comparisonFeatures = [
  {
    category: "Privacy & Compliance",
    features: [
      {
        name: "GDPR Compliance",
        globo: { value: true, note: "Built-in" },
        plausible: { value: true, note: "Built-in" },
      },
      {
        name: "Cookieless tracking",
        globo: { value: true, note: "Default" },
        plausible: { value: true, note: "Default" },
      },
      {
        name: "EU hosting available",
        globo: { value: true, note: "EU servers" },
        plausible: { value: true, note: "EU servers" },
      },
      {
        name: "Self-hosting option",
        globo: { value: true, note: "Docker" },
        plausible: { value: true, note: "Docker" },
      },
    ],
  },
  {
    category: "Advanced Analytics Features",
    features: [
      {
        name: "Funnel analysis",
        globo: { value: true, note: "Visual builder" },
        plausible: { value: false, note: "Not available" },
      },
      {
        name: "Goal tracking",
        globo: { value: true, note: "Advanced rules" },
        plausible: { value: "partial", note: "Basic only" },
      },
      {
        name: "Audience segments",
        globo: { value: true, note: "Real-time" },
        plausible: { value: false, note: "Not available" },
      },
      {
        name: "Custom dashboards",
        globo: { value: true, note: "Drag & drop" },
        plausible: { value: false, note: "Fixed layout" },
      },
      {
        name: "User flow analysis",
        globo: { value: true, note: "Visual paths" },
        plausible: { value: false, note: "Not available" },
      },
      {
        name: "Bot detection",
        globo: { value: true, note: "AI-powered" },
        plausible: { value: "partial", note: "Basic" },
      },
      {
        name: "Ecommerce tracking",
        globo: { value: true, note: "Revenue, products" },
        plausible: { value: "partial", note: "Revenue only" },
      },
    ],
  },
  {
    category: "Data & Reporting",
    features: [
      {
        name: "Real-time analytics",
        globo: { value: true, note: "Instant" },
        plausible: { value: true, note: "Instant" },
      },
      {
        name: "Custom events",
        globo: { value: true, note: "Unlimited" },
        plausible: { value: true, note: "Unlimited" },
      },
      {
        name: "UTM tracking",
        globo: { value: true, note: "Full support" },
        plausible: { value: true, note: "Full support" },
      },
      {
        name: "Data export",
        globo: { value: true, note: "CSV, API" },
        plausible: { value: true, note: "CSV, API" },
      },
      {
        name: "Scheduled reports",
        globo: { value: true, note: "Email, Slack" },
        plausible: { value: "partial", note: "Email only" },
      },
      {
        name: "Custom dimensions",
        globo: { value: true, note: "5 per event" },
        plausible: { value: "partial", note: "Props only" },
      },
    ],
  },
  {
    category: "Integrations & API",
    features: [
      {
        name: "REST API",
        globo: { value: true, note: "Full access" },
        plausible: { value: true, note: "Limited" },
      },
      {
        name: "Webhooks",
        globo: { value: true, note: "Real-time" },
        plausible: { value: false, note: "Not available" },
      },
      {
        name: "Slack integration",
        globo: { value: true, note: "Alerts, reports" },
        plausible: { value: false, note: "Not available" },
      },
      {
        name: "GTM support",
        globo: { value: true, note: "Native" },
        plausible: { value: true, note: "Manual" },
      },
    ],
  },
];

// What Plausible is missing
const missingFeatures = [
  {
    icon: GitBranch,
    title: "No Funnel Analysis",
    description:
      "Plausible can't show you where users drop off in your signup or checkout flow. You're flying blind on conversion optimization.",
  },
  {
    icon: Users,
    title: "No Audience Segments",
    description:
      "Can't create segments like 'Mobile users from France' or 'Returning visitors who viewed pricing'. Essential for targeted analysis.",
  },
  {
    icon: Layers,
    title: "No Custom Dashboards",
    description:
      "Stuck with Plausible's single dashboard layout. Can't create role-specific views for marketing, product, or executives.",
  },
  {
    icon: FileSearch,
    title: "No User Flow Visualization",
    description:
      "Can't see how visitors navigate through your site. Missing insights on content discovery and drop-off points.",
  },
  {
    icon: Bot,
    title: "Basic Bot Filtering",
    description:
      "Plausible uses basic bot lists. Our AI-powered detection catches sophisticated bots that inflate your numbers.",
  },
  {
    icon: Filter,
    title: "Limited Goal Features",
    description:
      "Basic pageview-based goals only. No support for complex goal rules, sequences, or revenue attribution.",
  },
];

// Why GloboAnalytics
const advantages = [
  {
    icon: Target,
    title: "Funnel Analysis",
    description:
      "Visual funnel builder shows exactly where users drop off. A/B test different flows and optimize conversions with real data.",
  },
  {
    icon: Users,
    title: "Audience Segments",
    description:
      "Create unlimited segments based on behavior, geography, device, or custom properties. Compare segment performance side by side.",
  },
  {
    icon: Boxes,
    title: "Custom Dashboards",
    description:
      "Build dashboards tailored to different teams. Drag and drop widgets, save views, and share with stakeholders.",
  },
  {
    icon: Bot,
    title: "AI Bot Detection",
    description:
      "Our machine learning models identify bots based on behavior patterns, not just user-agent strings. See real human traffic.",
  },
  {
    icon: TrendingUp,
    title: "Advanced Goals",
    description:
      "Create goals with complex rules, track goal sequences, and attribute revenue. Connect goals to funnels for full journey tracking.",
  },
  {
    icon: Shield,
    title: "Same Privacy Standards",
    description:
      "Cookieless by default, GDPR compliant, EU hosting available. All the privacy benefits you love from Plausible.",
  },
];

// Pricing comparison
const pricingComparison = [
  { pageviews: "10K", globo: "$9/mo", plausible: "$9/mo" },
  { pageviews: "100K", globo: "$29/mo", plausible: "$19/mo" },
  { pageviews: "1M", globo: "$79/mo", plausible: "$69/mo" },
  { pageviews: "10M", globo: "$199/mo", plausible: "$169/mo" },
];

function ComparisonValue({ value, note }: { value: boolean | string; note: string }) {
  if (value === true) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        <span className="text-sm text-muted-foreground">{note}</span>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
        <span className="text-sm text-muted-foreground">{note}</span>
      </div>
    );
  }
  if (value === "partial") {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
        <span className="text-sm text-muted-foreground">{note}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
      <span className="text-sm text-muted-foreground">{note}</span>
    </div>
  );
}

export default function PlausibleComparisonPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              More Features, Same Privacy
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              GloboAnalytics vs <span className="text-muted-foreground">Plausible</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Love Plausible&apos;s clean, privacy-first approach? GloboAnalytics offers the same
              simplicity with powerful features Plausible doesn&apos;t have.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differentiator */}
      <section className="py-12 border-y bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">The Bottom Line</h2>
            <p className="text-lg text-muted-foreground">
              Plausible is great for basic analytics. But if you need <strong>funnels</strong>,{" "}
              <strong>segments</strong>, <strong>custom dashboards</strong>, or{" "}
              <strong>advanced goals</strong>, you&apos;ll hit a wall. GloboAnalytics gives you
              these features without sacrificing privacy.
            </p>
          </div>
        </div>
      </section>

      {/* Missing Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Plausible Doesn&apos;t Have
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plausible keeps things simple - sometimes too simple. Here&apos;s what you&apos;re
              missing out on.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature-by-Feature Comparison</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Both respect privacy. Only one gives you the full analytics toolkit.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {comparisonFeatures.map((category) => (
              <div key={category.category} className="rounded-xl border bg-card overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                </div>

                <div className="divide-y">
                  <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-muted/30">
                    <div className="font-medium">Feature</div>
                    <div className="font-medium text-primary flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      GloboAnalytics
                    </div>
                    <div className="font-medium text-muted-foreground">Plausible</div>
                  </div>

                  {category.features.map((feature) => (
                    <div key={feature.name} className="grid grid-cols-3 gap-4 px-6 py-4">
                      <div className="font-medium">{feature.name}</div>
                      <ComparisonValue value={feature.globo.value} note={feature.globo.note} />
                      <ComparisonValue
                        value={feature.plausible.value}
                        note={feature.plausible.note}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose GloboAnalytics Over Plausible
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get the privacy-first approach you love with the features you actually need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage) => (
              <div key={advantage.title} className="p-6 rounded-xl border bg-card">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <advantage.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{advantage.title}</h3>
                <p className="text-muted-foreground">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pricing Comparison</h2>
              <p className="text-lg text-muted-foreground">
                GloboAnalytics costs slightly more because you get significantly more features.
              </p>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/50 border-b">
                <div className="font-medium">Monthly Pageviews</div>
                <div className="font-medium text-primary">GloboAnalytics</div>
                <div className="font-medium text-muted-foreground">Plausible</div>
              </div>
              {pricingComparison.map((tier) => (
                <div
                  key={tier.pageviews}
                  className="grid grid-cols-3 gap-4 px-6 py-4 border-b last:border-0"
                >
                  <div className="font-medium">{tier.pageviews}</div>
                  <div className="text-primary font-semibold">{tier.globo}</div>
                  <div className="text-muted-foreground">{tier.plausible}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm">
                <strong>Worth the difference?</strong> For ~$10/mo more, you get funnels, segments,
                custom dashboards, advanced goals, and AI bot detection. Features that would cost
                $100+/mo with other enterprise tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Is GloboAnalytics as privacy-friendly as Plausible?
                </h3>
                <p className="text-muted-foreground">
                  Yes! We use the same cookieless, privacy-first approach. No personal data stored,
                  no consent banner needed, fully GDPR/CCPA compliant. We just add more features on
                  top.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Is the dashboard still simple like Plausible?
                </h3>
                <p className="text-muted-foreground">
                  Our default dashboard is clean and simple. Advanced features like funnels and
                  segments are there when you need them, but they don&apos;t clutter the main view.
                  Power when you want it, simplicity by default.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Can I migrate from Plausible easily?</h3>
                <p className="text-muted-foreground">
                  Yes! Our tracking script is a simple swap. You can even run both during
                  transition. Historical data stays in Plausible, and you start fresh with
                  GloboAnalytics (with all the new features).
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Do you support public dashboards?</h3>
                <p className="text-muted-foreground">
                  Yes! Like Plausible, you can make your dashboard public with a shareable link.
                  Great for transparency and building trust with your audience.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">What about the script size?</h3>
                <p className="text-muted-foreground">
                  Our core script is under 3KB gzipped, comparable to Plausible. Advanced features
                  load on-demand. We&apos;re obsessed with performance too.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for Privacy Analytics That Does More?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Get funnels, segments, and advanced features without compromising on privacy. Start
              your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "GloboAnalytics vs Plausible Comparison",
            description:
              "Compare GloboAnalytics with Plausible. More features, same privacy commitment.",
            mainEntity: {
              "@type": "SoftwareApplication",
              name: "GloboAnalytics",
              applicationCategory: "Web Analytics",
              operatingSystem: "Web",
            },
          }),
        }}
      />
    </div>
  );
}
