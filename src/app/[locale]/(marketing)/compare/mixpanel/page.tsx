import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Sparkles,
  Cookie,
  Scale,
  HeartHandshake,
  Gauge,
  MousePointer,
  LineChart,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GloboAnalytics vs Mixpanel | Privacy-First Product Analytics",
  description:
    "Compare GloboAnalytics with Mixpanel. Get product analytics insights without the privacy concerns, complex pricing, and steep learning curve.",
  keywords: [
    "Mixpanel alternative",
    "Mixpanel vs",
    "product analytics",
    "privacy analytics",
    "event tracking",
    "user analytics",
    "behavioral analytics",
  ],
  openGraph: {
    title: "GloboAnalytics vs Mixpanel | Simpler, Privacy-First Alternative",
    description:
      "Mixpanel's power without the complexity. Get product analytics that respects privacy and doesn't break the bank.",
    type: "website",
  },
};

// Feature comparison
const comparisonFeatures = [
  {
    category: "Privacy & Compliance",
    features: [
      {
        name: "GDPR Compliant",
        globo: { value: true, note: "Built-in" },
        mixpanel: { value: "partial", note: "Requires setup" },
      },
      {
        name: "Cookieless option",
        globo: { value: true, note: "Default mode" },
        mixpanel: { value: false, note: "Uses cookies" },
      },
      {
        name: "No consent banner needed",
        globo: { value: true, note: "Privacy by design" },
        mixpanel: { value: false, note: "Required" },
      },
      {
        name: "User data collection",
        globo: { value: true, note: "Anonymous only" },
        mixpanel: { value: false, note: "PII by design" },
      },
      {
        name: "EU data residency",
        globo: { value: true, note: "EU servers" },
        mixpanel: { value: true, note: "EU option" },
      },
    ],
  },
  {
    category: "Core Features",
    features: [
      {
        name: "Event tracking",
        globo: { value: true, note: "Unlimited events" },
        mixpanel: { value: true, note: "Unlimited events" },
      },
      {
        name: "Funnel analysis",
        globo: { value: true, note: "Visual builder" },
        mixpanel: { value: true, note: "Advanced" },
      },
      {
        name: "User flows",
        globo: { value: true, note: "Path analysis" },
        mixpanel: { value: true, note: "Flows report" },
      },
      {
        name: "Cohort analysis",
        globo: { value: true, note: "Segments" },
        mixpanel: { value: true, note: "Cohorts" },
      },
      {
        name: "Retention reports",
        globo: { value: true, note: "Configurable" },
        mixpanel: { value: true, note: "Advanced" },
      },
      {
        name: "A/B testing",
        globo: { value: "partial", note: "Coming soon" },
        mixpanel: { value: false, note: "Removed feature" },
      },
    ],
  },
  {
    category: "Ease of Use",
    features: [
      {
        name: "Setup time",
        globo: { value: "easy", note: "5 minutes" },
        mixpanel: { value: "hard", note: "Days to weeks" },
      },
      {
        name: "Learning curve",
        globo: { value: "easy", note: "Intuitive UI" },
        mixpanel: { value: "hard", note: "Training needed" },
      },
      {
        name: "Data model",
        globo: { value: "easy", note: "Simple events" },
        mixpanel: { value: "hard", note: "Complex schema" },
      },
      {
        name: "Query builder",
        globo: { value: true, note: "Visual" },
        mixpanel: { value: true, note: "JQL required" },
      },
    ],
  },
  {
    category: "Pricing & Value",
    features: [
      {
        name: "Free tier",
        globo: { value: true, note: "1K pageviews" },
        mixpanel: { value: true, note: "20M events" },
      },
      {
        name: "Pricing model",
        globo: { value: "transparent", note: "Per pageviews" },
        mixpanel: { value: "complex", note: "MTU + events" },
      },
      {
        name: "Cost predictability",
        globo: { value: true, note: "Fixed pricing" },
        mixpanel: { value: false, note: "Can spike" },
      },
      {
        name: "Support included",
        globo: { value: true, note: "All plans" },
        mixpanel: { value: "partial", note: "Paid tiers only" },
      },
    ],
  },
];

// Mixpanel problems
const mixpanelProblems = [
  {
    icon: Cookie,
    title: "Privacy Concerns",
    description:
      "Mixpanel tracks individual users with cookies and device IDs. This requires consent banners and creates GDPR compliance burden.",
  },
  {
    icon: DollarSign,
    title: "Unpredictable Pricing",
    description:
      "Mixpanel charges per MTU (monthly tracked user) which can spike unexpectedly. A viral moment could cost you thousands.",
  },
  {
    icon: Clock,
    title: "Complex Implementation",
    description:
      "Proper Mixpanel setup requires engineering time to plan the data model, implement tracking, and validate events. Days or weeks, not minutes.",
  },
  {
    icon: Scale,
    title: "Overkill for Most Sites",
    description:
      "Mixpanel is built for complex SaaS products. If you're running a website, content site, or simple app, it's way more than you need.",
  },
  {
    icon: Gauge,
    title: "Steep Learning Curve",
    description:
      "Teams need training to use Mixpanel effectively. Features like JQL queries and complex segmentation require expertise.",
  },
  {
    icon: MousePointer,
    title: "No Web Analytics Basics",
    description:
      "Mixpanel focuses on events, not pages. Basic web metrics like pageviews, bounce rate, and traffic sources require workarounds.",
  },
];

// Why GloboAnalytics
const advantages = [
  {
    icon: Shield,
    title: "Privacy Without Compromise",
    description:
      "Track behavior without tracking individuals. Get the insights you need while respecting user privacy and skipping consent banners.",
  },
  {
    icon: Sparkles,
    title: "Simple Yet Powerful",
    description:
      "Clean interface that anyone can use. No training required. Advanced features when you need them, simplicity when you don't.",
  },
  {
    icon: DollarSign,
    title: "Predictable Costs",
    description:
      "Pay per pageviews, not per user. Know exactly what you'll pay each month. No surprise bills from traffic spikes.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description:
      "One script tag, 5 minutes, done. Auto-track pageviews immediately. Add custom events as needed without complex planning.",
  },
  {
    icon: LineChart,
    title: "Web + Product Analytics",
    description:
      "Get both traditional web analytics (pageviews, sources, bounce rate) AND product analytics (funnels, events, flows) in one tool.",
  },
  {
    icon: HeartHandshake,
    title: "Human Support",
    description:
      "Real humans answer your questions within 24 hours. No tiered support, no chatbots, no community forums as your only option.",
  },
];

// Use case comparison
const useCases = [
  {
    useCase: "Simple website analytics",
    globo: "perfect",
    mixpanel: "overkill",
  },
  {
    useCase: "Blog or content site",
    globo: "perfect",
    mixpanel: "overkill",
  },
  {
    useCase: "E-commerce tracking",
    globo: "great",
    mixpanel: "good",
  },
  {
    useCase: "SaaS product analytics",
    globo: "good",
    mixpanel: "great",
  },
  {
    useCase: "Mobile app analytics",
    globo: "partial",
    mixpanel: "great",
  },
  {
    useCase: "Privacy-first requirement",
    globo: "perfect",
    mixpanel: "poor",
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
  const isPositive = ["easy", "transparent"].includes(value);
  return (
    <div className="flex items-center gap-2">
      {isPositive ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
      )}
      <span className="text-sm text-muted-foreground">{note}</span>
    </div>
  );
}

function UseCaseCell({ value }: { value: string }) {
  const config = {
    perfect: {
      color: "text-green-600 dark:text-green-400",
      label: "Perfect fit",
    },
    great: { color: "text-green-600 dark:text-green-400", label: "Great" },
    good: { color: "text-blue-600 dark:text-blue-400", label: "Good" },
    partial: {
      color: "text-yellow-600 dark:text-yellow-400",
      label: "Partial",
    },
    overkill: {
      color: "text-orange-600 dark:text-orange-400",
      label: "Overkill",
    },
    poor: { color: "text-red-600 dark:text-red-400", label: "Poor fit" },
  };
  const { color, label } = config[value as keyof typeof config] || config.good;
  return <span className={`text-sm font-medium ${color}`}>{label}</span>;
}

export default function MixpanelComparisonPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Privacy-First Alternative
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              GloboAnalytics vs{" "}
              <span className="text-muted-foreground">Mixpanel</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get product analytics insights without the complexity, privacy
              concerns, and unpredictable pricing of Mixpanel.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
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

      {/* Key Message */}
      <section className="py-12 border-y bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Different Tools for Different Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              Mixpanel is a powerful product analytics platform built for
              complex SaaS apps with dedicated data teams.{" "}
              <strong>GloboAnalytics</strong> is a privacy-first analytics
              solution that combines web and product analytics in one simple
              package.
            </p>
          </div>
        </div>
      </section>

      {/* Use Case Fit */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Which Tool Fits Your Use Case?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Be honest about what you&apos;re building. The right tool depends
              on your needs.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/50 border-b">
                <div className="font-medium">Use Case</div>
                <div className="font-medium text-primary">GloboAnalytics</div>
                <div className="font-medium text-muted-foreground">
                  Mixpanel
                </div>
              </div>
              {useCases.map((row) => (
                <div
                  key={row.useCase}
                  className="grid grid-cols-3 gap-4 px-6 py-4 border-b last:border-0"
                >
                  <div className="font-medium">{row.useCase}</div>
                  <UseCaseCell value={row.globo} />
                  <UseCaseCell value={row.mixpanel} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mixpanel Problems */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Common Mixpanel Pain Points
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mixpanel is powerful, but power comes with complexity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mixpanelProblems.map((problem) => (
              <div
                key={problem.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Feature Comparison
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How the two platforms stack up feature by feature
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
                      Mixpanel
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
                        value={feature.mixpanel.value}
                        note={feature.mixpanel.note}
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose GloboAnalytics Over Mixpanel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              For most websites and apps, GloboAnalytics delivers better value
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

      {/* When to Choose Each */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Honest Recommendation
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl border-2 border-primary bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-bold">
                    Choose GloboAnalytics if...
                  </h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    You run a website, blog, or content platform
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    Privacy compliance is important to you
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    You want simple, predictable pricing
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    You need quick setup without engineering
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    You want web + product analytics together
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <h3 className="text-xl font-bold">Consider Mixpanel if...</h3>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    You have a complex SaaS with many user actions
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    You have a dedicated data/analytics team
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    You need advanced cohort/retention analysis
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    Individual user tracking is acceptable for you
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    Budget allows for enterprise pricing
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Can GloboAnalytics do everything Mixpanel does?
                </h3>
                <p className="text-muted-foreground">
                  No - and that&apos;s intentional. Mixpanel has features like
                  JQL queries, complex identity resolution, and deep product
                  analytics that we don&apos;t replicate. We&apos;re simpler by
                  design, which makes us better for 90% of use cases.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  How does privacy-first analytics work?
                </h3>
                <p className="text-muted-foreground">
                  We track events and pageviews without storing personal
                  identifiers. We use privacy-preserving techniques to show
                  behavior patterns without creating user profiles. You still
                  see funnels and segments, just not individual user histories.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Can I migrate from Mixpanel?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Our tracking script is easy to add alongside or replace
                  Mixpanel. Historical data stays in Mixpanel, and you start
                  fresh with GloboAnalytics. Many teams run both during
                  transition.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  What about mobile app tracking?
                </h3>
                <p className="text-muted-foreground">
                  We focus on web analytics. For mobile apps, Mixpanel has
                  stronger SDKs. However, if you have a web app or hybrid
                  solution, GloboAnalytics works great.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for Simpler Product Analytics?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Get the insights you need without the complexity. Start your free
              trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
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

      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "GloboAnalytics vs Mixpanel Comparison",
            description:
              "Compare GloboAnalytics with Mixpanel. Simpler product analytics with privacy-first approach.",
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
