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
  Shield,
  Layers,
  Bot,
  DollarSign,
  Gauge,
  Server,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GloboAnalytics vs Fathom | Feature-Rich Privacy Analytics",
  description:
    "Compare GloboAnalytics with Fathom Analytics. Get advanced features like funnels, segments, and bot detection that Fathom doesn't offer.",
  keywords: [
    "Fathom alternative",
    "Fathom vs",
    "privacy analytics comparison",
    "simple analytics",
    "privacy-first analytics",
    "Fathom features",
  ],
  openGraph: {
    title: "GloboAnalytics vs Fathom | More Power, Same Simplicity",
    description:
      "Fathom is great for basics. GloboAnalytics gives you funnels, segments, and advanced analytics while staying privacy-first.",
    type: "website",
  },
};

// Feature comparison
const comparisonFeatures = [
  {
    category: "Privacy & Compliance",
    features: [
      {
        name: "GDPR/CCPA Compliant",
        globo: { value: true, note: "Built-in" },
        fathom: { value: true, note: "Built-in" },
      },
      {
        name: "Cookieless tracking",
        globo: { value: true, note: "Default" },
        fathom: { value: true, note: "Default" },
      },
      {
        name: "EU data hosting",
        globo: { value: true, note: "EU servers" },
        fathom: { value: true, note: "EU option" },
      },
      {
        name: "Self-hosting",
        globo: { value: true, note: "Docker" },
        fathom: { value: false, note: "SaaS only" },
      },
    ],
  },
  {
    category: "Analytics Features",
    features: [
      {
        name: "Funnel analysis",
        globo: { value: true, note: "Visual builder" },
        fathom: { value: false, note: "Not available" },
      },
      {
        name: "Audience segments",
        globo: { value: true, note: "Real-time" },
        fathom: { value: false, note: "Not available" },
      },
      {
        name: "Goal tracking",
        globo: { value: true, note: "Advanced rules" },
        fathom: { value: true, note: "Event goals" },
      },
      {
        name: "Custom events",
        globo: { value: true, note: "Unlimited" },
        fathom: { value: true, note: "Unlimited" },
      },
      {
        name: "User flow analysis",
        globo: { value: true, note: "Visual paths" },
        fathom: { value: false, note: "Not available" },
      },
      {
        name: "AI bot detection",
        globo: { value: true, note: "ML-powered" },
        fathom: { value: "partial", note: "Basic" },
      },
      {
        name: "Ecommerce tracking",
        globo: { value: true, note: "Full support" },
        fathom: { value: "partial", note: "Basic events" },
      },
    ],
  },
  {
    category: "Dashboard & Reporting",
    features: [
      {
        name: "Real-time analytics",
        globo: { value: true, note: "Instant" },
        fathom: { value: true, note: "Instant" },
      },
      {
        name: "Custom dashboards",
        globo: { value: true, note: "Configurable" },
        fathom: { value: false, note: "Fixed layout" },
      },
      {
        name: "Comparison periods",
        globo: { value: true, note: "Flexible" },
        fathom: { value: true, note: "Limited" },
      },
      {
        name: "Scheduled reports",
        globo: { value: true, note: "Email, Slack" },
        fathom: { value: true, note: "Email only" },
      },
      {
        name: "White-label reports",
        globo: { value: true, note: "Custom branding" },
        fathom: { value: false, note: "Not available" },
      },
    ],
  },
  {
    category: "Pricing & Support",
    features: [
      {
        name: "Free tier",
        globo: { value: true, note: "1K pageviews" },
        fathom: { value: false, note: "Trial only" },
      },
      {
        name: "Pricing model",
        globo: { value: "transparent", note: "Per pageviews" },
        fathom: { value: "transparent", note: "Per pageviews" },
      },
      {
        name: "Support",
        globo: { value: true, note: "Email, chat" },
        fathom: { value: true, note: "Email" },
      },
    ],
  },
];

// Key differences
const keyDifferences = [
  {
    icon: GitBranch,
    title: "Funnel Analysis",
    globo:
      "Visual funnel builder with drop-off analysis and A/B testing integration",
    fathom: "Not available - you can't track multi-step conversion paths",
  },
  {
    icon: Users,
    title: "Audience Segments",
    globo:
      "Create and save unlimited segments based on any combination of attributes",
    fathom: "Not available - can only filter in real-time, can't save segments",
  },
  {
    icon: Bot,
    title: "Bot Detection",
    globo:
      "AI-powered detection using behavioral analysis, not just user-agent strings",
    fathom: "Basic bot filtering using standard bot lists",
  },
  {
    icon: Server,
    title: "Self-Hosting",
    globo: "Full Docker support for complete data control",
    fathom: "SaaS only - no self-hosting option",
  },
  {
    icon: Layers,
    title: "Custom Dashboards",
    globo: "Build role-specific dashboards with drag-and-drop widgets",
    fathom: "Single fixed dashboard layout for all users",
  },
  {
    icon: DollarSign,
    title: "Free Tier",
    globo: "Permanent free tier for small sites (1K pageviews/month)",
    fathom: "7-day trial only, then paid plans start at $14/mo",
  },
];

// Advantages
const advantages = [
  {
    icon: Target,
    title: "Conversion Optimization",
    description:
      "With funnels and goals, see exactly where visitors convert or drop off. Fathom only shows you the end result.",
  },
  {
    icon: Users,
    title: "Deeper Audience Insights",
    description:
      "Segments let you compare behavior across user groups. Understanding your audience means better product decisions.",
  },
  {
    icon: Gauge,
    title: "Performance Monitoring",
    description:
      "Track Core Web Vitals and page load times. Slow pages hurt conversions - we help you find them.",
  },
  {
    icon: Bot,
    title: "Accurate Traffic Data",
    description:
      "Our AI filters out bots more accurately, so you see real human traffic. Important for conversion rate calculations.",
  },
  {
    icon: Shield,
    title: "Same Privacy Standards",
    description:
      "Everything Fathom does for privacy, we do too. Cookieless, GDPR compliant, no personal data.",
  },
  {
    icon: Clock,
    title: "Free Forever Option",
    description:
      "Start free and upgrade when you need to. No credit card required, no time-limited trial.",
  },
];

function ComparisonValue({
  value,
  note,
}: {
  value: boolean | string;
  note: string;
}) {
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

export default function FathomComparisonPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Feature-Rich Alternative
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              GloboAnalytics vs{" "}
              <span className="text-muted-foreground">Fathom</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Fathom nails the basics. GloboAnalytics gives you funnels,
              segments, and advanced analytics without compromising on privacy
              or simplicity.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free (No Card Required)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
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
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">
                Fathom is great when...
              </h3>
              <p className="text-muted-foreground">
                You just need pageviews, referrers, and basic event tracking.
                Simple dashboard, quick setup.
              </p>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-2 text-primary">
                GloboAnalytics is better when...
              </h3>
              <p className="text-muted-foreground">
                You need to understand <em>why</em> visitors convert or leave.
                Funnels, segments, and user flows reveal the full story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Differences Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Key Differences
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Side-by-side comparison of what matters most
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {keyDifferences.map((diff) => (
              <div
                key={diff.title}
                className="grid md:grid-cols-[200px_1fr_1fr] gap-4 p-6 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <diff.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{diff.title}</span>
                </div>
                <div className="md:border-l md:pl-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-primary text-sm mb-1">
                        GloboAnalytics
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {diff.globo}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:border-l md:pl-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-muted-foreground text-sm mb-1">
                        Fathom
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {diff.fathom}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Full Feature Comparison
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature, compared side by side
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {comparisonFeatures.map((category) => (
              <div
                key={category.category}
                className="rounded-xl border bg-card overflow-hidden"
              >
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
                    <div className="font-medium text-muted-foreground">
                      Fathom
                    </div>
                  </div>

                  {category.features.map((feature) => (
                    <div
                      key={feature.name}
                      className="grid grid-cols-3 gap-4 px-6 py-4"
                    >
                      <div className="font-medium">{feature.name}</div>
                      <ComparisonValue
                        value={feature.globo.value}
                        note={feature.globo.note}
                      />
                      <ComparisonValue
                        value={feature.fathom.value}
                        note={feature.fathom.note}
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
              Why Choose GloboAnalytics Over Fathom
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All the privacy benefits, plus the features growing businesses
              need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage) => (
              <div
                key={advantage.title}
                className="p-6 rounded-xl border bg-card"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <advantage.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {advantage.title}
                </h3>
                <p className="text-muted-foreground">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Is GloboAnalytics harder to use than Fathom?
                </h3>
                <p className="text-muted-foreground">
                  No! Our default dashboard is just as clean and simple.
                  Advanced features like funnels and segments are optional -
                  they&apos;re there when you need them but don&apos;t clutter
                  your daily view.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Why should I pay more for GloboAnalytics?
                </h3>
                <p className="text-muted-foreground">
                  Fathom starts at $14/mo for 100K pageviews. GloboAnalytics
                  starts at $29/mo for the same tier BUT includes funnels,
                  segments, bot detection, and self-hosting option. Features
                  that would cost $100+/mo elsewhere.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Can I try before buying?</h3>
                <p className="text-muted-foreground">
                  Yes! Unlike Fathom&apos;s 7-day trial, we offer a free tier
                  (1K pageviews/mo) that never expires. Test everything before
                  you upgrade.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Do you support Fathom&apos;s UTM bypass?
                </h3>
                <p className="text-muted-foreground">
                  Yes, we support both standard UTM tracking and our own bypass
                  parameter for cases where UTMs get stripped. Full campaign
                  attribution either way.
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
              Ready for Analytics That Does More?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Start free and get funnels, segments, and advanced features from
              day one. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Start Free Forever
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
            name: "GloboAnalytics vs Fathom Comparison",
            description:
              "Compare GloboAnalytics with Fathom Analytics. More features, same privacy focus.",
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
