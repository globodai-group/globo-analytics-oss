import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Zap,
  Eye,
  Cookie,
  Scale,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Lock,
  Sparkles,
  TrendingUp,
  HeartHandshake,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GloboAnalytics vs Google Analytics | Privacy-First Alternative",
  description:
    "Compare GloboAnalytics with Google Analytics. Discover why privacy-conscious businesses choose our GDPR-compliant, cookieless analytics solution over Google Analytics.",
  keywords: [
    "Google Analytics alternative",
    "GA4 alternative",
    "privacy-first analytics",
    "GDPR compliant analytics",
    "cookieless analytics",
    "Google Analytics vs",
    "analytics without cookies",
    "ethical analytics",
  ],
  openGraph: {
    title: "GloboAnalytics vs Google Analytics | The Privacy-First Alternative",
    description:
      "See why thousands of businesses are switching from Google Analytics to GloboAnalytics for privacy-compliant, accurate web analytics.",
    type: "website",
  },
};

// Feature comparison data
const comparisonFeatures = [
  {
    category: "Privacy & Compliance",
    features: [
      {
        name: "GDPR Compliance",
        globo: { value: true, note: "Built-in" },
        google: { value: "partial", note: "Requires configuration" },
      },
      {
        name: "Cookie Consent Required",
        globo: { value: false, note: "Cookieless by default" },
        google: { value: true, note: "Always required" },
      },
      {
        name: "Data stays in EU",
        globo: { value: true, note: "EU servers available" },
        google: { value: false, note: "US data transfer" },
      },
      {
        name: "No personal data collection",
        globo: { value: true, note: "Privacy by design" },
        google: { value: false, note: "Collects PII" },
      },
      {
        name: "User consent banner needed",
        globo: { value: false, note: "Not required" },
        google: { value: true, note: "Legally required" },
      },
    ],
  },
  {
    category: "Features & Functionality",
    features: [
      {
        name: "Real-time analytics",
        globo: { value: true, note: "Instant updates" },
        google: { value: true, note: "24-48h delay for some" },
      },
      {
        name: "Custom events tracking",
        globo: { value: true, note: "Unlimited" },
        google: { value: true, note: "Limited to 500" },
      },
      {
        name: "Funnel analysis",
        globo: { value: true, note: "Visual builder" },
        google: { value: true, note: "Complex setup" },
      },
      {
        name: "Goal tracking",
        globo: { value: true, note: "Flexible rules" },
        google: { value: true, note: "Conversions" },
      },
      {
        name: "Audience segmentation",
        globo: { value: true, note: "Real-time" },
        google: { value: true, note: "Delayed" },
      },
      {
        name: "Bot detection",
        globo: { value: true, note: "AI-powered" },
        google: { value: "partial", note: "Basic filtering" },
      },
    ],
  },
  {
    category: "User Experience",
    features: [
      {
        name: "Learning curve",
        globo: { value: "easy", note: "Minutes to learn" },
        google: { value: "hard", note: "Weeks to master" },
      },
      {
        name: "Dashboard simplicity",
        globo: { value: true, note: "Clean, focused" },
        google: { value: false, note: "Overwhelming" },
      },
      {
        name: "Setup time",
        globo: { value: "easy", note: "< 5 minutes" },
        google: { value: "hard", note: "Hours to days" },
      },
      {
        name: "API access",
        globo: { value: true, note: "Full REST API" },
        google: { value: true, note: "Complex quotas" },
      },
    ],
  },
  {
    category: "Business & Support",
    features: [
      {
        name: "Pricing model",
        globo: { value: "transparent", note: "Simple tiers" },
        google: { value: "complex", note: "Free + paid" },
      },
      {
        name: "Data ownership",
        globo: { value: true, note: "100% yours" },
        google: { value: false, note: "Google uses it" },
      },
      {
        name: "Support response",
        globo: { value: "fast", note: "< 24 hours" },
        google: { value: "slow", note: "Community forums" },
      },
      {
        name: "Self-hosting option",
        globo: { value: true, note: "Docker ready" },
        google: { value: false, note: "SaaS only" },
      },
    ],
  },
];

// Problems with Google Analytics
const googleProblems = [
  {
    icon: Cookie,
    title: "Cookie Consent Nightmare",
    description:
      "GA4 requires cookie consent banners that annoy visitors and reduce your tracked data by 30-50%. Many visitors simply decline cookies.",
  },
  {
    icon: Scale,
    title: "GDPR Legal Risks",
    description:
      "Several EU countries have ruled Google Analytics illegal due to US data transfers. Using GA4 exposes you to potential fines up to 4% of global revenue.",
  },
  {
    icon: Eye,
    title: "Data Sampling Issues",
    description:
      "Google Analytics samples your data on the free tier, meaning you only see approximations, not actual numbers. Critical for small to medium sites.",
  },
  {
    icon: Clock,
    title: "Steep Learning Curve",
    description:
      "GA4's interface is notoriously complex. Teams spend weeks learning it, and many features require technical expertise to configure properly.",
  },
  {
    icon: Users,
    title: "Google Uses Your Data",
    description:
      "Your visitor data contributes to Google's advertising ecosystem. Your analytics inform their AI and ad targeting across the web.",
  },
  {
    icon: AlertTriangle,
    title: "Blocked by Ad Blockers",
    description:
      "30-40% of visitors use ad blockers that specifically target Google Analytics, creating massive blind spots in your data.",
  },
];

// Migration benefits
const migrationBenefits = [
  {
    metric: "30-50%",
    label: "More accurate data",
    description: "No cookie consent rejection",
  },
  {
    metric: "5 min",
    label: "Setup time",
    description: "vs hours with GA4",
  },
  {
    metric: "100%",
    label: "GDPR compliant",
    description: "No legal risks",
  },
  {
    metric: "0",
    label: "Cookie banners needed",
    description: "Better user experience",
  },
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
  // String values like "easy", "hard", etc.
  const isPositive = ["easy", "transparent", "fast"].includes(value);
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

export default function GoogleAnalyticsComparisonPage() {
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
              <span className="text-muted-foreground line-through decoration-red-500">
                Google Analytics
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get accurate, privacy-compliant analytics without the legal headaches, cookie banners,
              or complex interfaces. See why thousands are making the switch.
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

      {/* Migration Benefits Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {migrationBenefits.map((benefit) => (
              <div key={benefit.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {benefit.metric}
                </div>
                <div className="font-medium mb-1">{benefit.label}</div>
                <div className="text-sm text-muted-foreground">{benefit.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problems with Google Analytics */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Companies Are Leaving Google Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              GA4 comes with serious drawbacks that affect your data accuracy, legal compliance, and
              user experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleProblems.map((problem) => (
              <div
                key={problem.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Feature-by-Feature Comparison</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See exactly how GloboAnalytics compares to Google Analytics across every important
              dimension.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {comparisonFeatures.map((category) => (
              <div key={category.category} className="rounded-xl border bg-card overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg">{category.category}</h3>
                </div>

                <div className="divide-y">
                  {/* Header row */}
                  <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-muted/30">
                    <div className="font-medium">Feature</div>
                    <div className="font-medium text-primary flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      GloboAnalytics
                    </div>
                    <div className="font-medium text-muted-foreground">Google Analytics</div>
                  </div>

                  {/* Feature rows */}
                  {category.features.map((feature) => (
                    <div key={feature.name} className="grid grid-cols-3 gap-4 px-6 py-4">
                      <div className="font-medium">{feature.name}</div>
                      <ComparisonValue value={feature.globo.value} note={feature.globo.note} />
                      <ComparisonValue value={feature.google.value} note={feature.google.note} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose GloboAnalytics */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose GloboAnalytics Over Google Analytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built from the ground up as a privacy-first analytics platform that respects your
              visitors and delivers accurate data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% GDPR Compliant</h3>
              <p className="text-muted-foreground">
                No cookie consent needed. No US data transfers. Your data stays in the EU if you
                choose. Sleep easy knowing you&apos;re fully compliant.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">More Accurate Data</h3>
              <p className="text-muted-foreground">
                Without cookie consent rejections and ad blocker interference, you see 30-50% more
                of your actual traffic. Real numbers, not samples.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Simple & Intuitive</h3>
              <p className="text-muted-foreground">
                No certification needed. Our clean dashboard shows you what matters in seconds.
                Setup takes 5 minutes, not days.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Data, Your Control</h3>
              <p className="text-muted-foreground">
                We don&apos;t sell your data or use it for advertising. You can export or delete
                everything anytime. Self-host if you want complete control.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Insights</h3>
              <p className="text-muted-foreground">
                See visitor activity as it happens. No 24-48 hour delays. React to trends
                immediately and optimize your campaigns in real-time.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <HeartHandshake className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Human Support</h3>
              <p className="text-muted-foreground">
                Real humans respond within 24 hours. No community forums, no AI chatbots. Get help
                from people who actually know the product.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Migration Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Migrate from Google Analytics in Minutes
              </h2>
              <p className="text-lg text-muted-foreground">
                Switching is easier than you think. Keep your historical context while gaining
                better data going forward.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border bg-card text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Create Account</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up in 30 seconds. No credit card required for the free trial.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Add Tracking Code</h3>
                <p className="text-sm text-muted-foreground">
                  Copy one line of code to your site. Works alongside GA4 during transition.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card text-center">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">See Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Watch real-time analytics flow in immediately. Remove GA4 when ready.
                </p>
              </div>
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
                  Can I run GloboAnalytics alongside Google Analytics?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Many customers run both during a transition period. This lets you compare
                  data accuracy and get comfortable before fully switching.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Will I lose my historical GA data?</h3>
                <p className="text-muted-foreground">
                  Your Google Analytics historical data stays in Google. GloboAnalytics starts
                  collecting from installation. We recommend keeping GA access for historical
                  reference.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Is GloboAnalytics really GDPR compliant without cookies?
                </h3>
                <p className="text-muted-foreground">
                  Yes. We use privacy-preserving techniques to track page views and events without
                  storing personal data or using cookies. Several EU DPAs have confirmed this
                  approach is compliant.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">What about features like Enhanced Ecommerce?</h3>
                <p className="text-muted-foreground">
                  GloboAnalytics supports ecommerce tracking, custom events, funnels, and goals.
                  While the implementation differs, you get the insights you need to optimize your
                  store.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Do you offer a self-hosted option?</h3>
                <p className="text-muted-foreground">
                  Yes! GloboAnalytics can be self-hosted using Docker. This gives you complete
                  control over your data and infrastructure. Perfect for enterprises with strict
                  data requirements.
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
              Ready to Ditch Google Analytics?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join thousands of privacy-conscious businesses using GloboAnalytics. Start your free
              trial today - no credit card required.
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

      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "GloboAnalytics vs Google Analytics Comparison",
            description:
              "Compare GloboAnalytics with Google Analytics. Privacy-first, GDPR-compliant analytics alternative.",
            mainEntity: {
              "@type": "SoftwareApplication",
              name: "GloboAnalytics",
              applicationCategory: "Web Analytics",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
                description: "Free trial available",
              },
            },
          }),
        }}
      />
    </div>
  );
}
