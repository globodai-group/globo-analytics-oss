import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Server,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Globe,
  Sparkles,
  TrendingUp,
  HeartHandshake,
  Cpu,
  Wrench,
  Cloud,
  HardDrive,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GloboAnalytics vs Matomo (Piwik) | Modern Analytics Alternative",
  description:
    "Compare GloboAnalytics with Matomo/Piwik. Discover the modern, cloud-first analytics solution that's simpler to use and doesn't require server maintenance.",
  keywords: [
    "Matomo alternative",
    "Piwik alternative",
    "self-hosted analytics",
    "privacy analytics",
    "Matomo vs",
    "Piwik migration",
    "web analytics comparison",
    "open source analytics",
  ],
  openGraph: {
    title: "GloboAnalytics vs Matomo (Piwik) | The Modern Alternative",
    description:
      "See why businesses choose GloboAnalytics over Matomo for simpler setup, lower costs, and modern features.",
    type: "website",
  },
};

// Feature comparison data
const comparisonFeatures = [
  {
    category: "Setup & Maintenance",
    features: [
      {
        name: "Time to first insight",
        globo: { value: "easy", note: "5 minutes" },
        matomo: { value: "hard", note: "Hours to days" },
      },
      {
        name: "Server management",
        globo: { value: true, note: "Fully managed" },
        matomo: { value: false, note: "You maintain it" },
      },
      {
        name: "Updates & security patches",
        globo: { value: true, note: "Automatic" },
        matomo: { value: false, note: "Manual updates" },
      },
      {
        name: "Database optimization",
        globo: { value: true, note: "Handled for you" },
        matomo: { value: false, note: "DIY required" },
      },
      {
        name: "Scaling",
        globo: { value: true, note: "Auto-scales" },
        matomo: { value: false, note: "Upgrade servers" },
      },
    ],
  },
  {
    category: "Privacy & Compliance",
    features: [
      {
        name: "GDPR Compliance",
        globo: { value: true, note: "Built-in" },
        matomo: { value: true, note: "Configurable" },
      },
      {
        name: "Cookieless tracking",
        globo: { value: true, note: "Default mode" },
        matomo: { value: "partial", note: "Requires setup" },
      },
      {
        name: "Data ownership",
        globo: { value: true, note: "100% yours" },
        matomo: { value: true, note: "Self-hosted" },
      },
      {
        name: "EU data hosting",
        globo: { value: true, note: "EU servers" },
        matomo: { value: "partial", note: "If you host in EU" },
      },
    ],
  },
  {
    category: "Features",
    features: [
      {
        name: "Real-time dashboard",
        globo: { value: true, note: "Instant updates" },
        matomo: { value: true, note: "With delay" },
      },
      {
        name: "Bot detection",
        globo: { value: true, note: "AI-powered" },
        matomo: { value: "partial", note: "Basic lists" },
      },
      {
        name: "Custom events",
        globo: { value: true, note: "Unlimited" },
        matomo: { value: true, note: "Supported" },
      },
      {
        name: "Funnel analysis",
        globo: { value: true, note: "Visual builder" },
        matomo: { value: "partial", note: "Paid plugin" },
      },
      {
        name: "Heatmaps",
        globo: { value: "partial", note: "Coming soon" },
        matomo: { value: "partial", note: "Paid plugin" },
      },
      {
        name: "Session recording",
        globo: { value: "partial", note: "Coming soon" },
        matomo: { value: "partial", note: "Paid plugin" },
      },
    ],
  },
  {
    category: "User Experience",
    features: [
      {
        name: "Modern UI",
        globo: { value: true, note: "2024 design" },
        matomo: { value: false, note: "Dated interface" },
      },
      {
        name: "Mobile app",
        globo: { value: true, note: "PWA ready" },
        matomo: { value: true, note: "Native app" },
      },
      {
        name: "API access",
        globo: { value: true, note: "REST API" },
        matomo: { value: true, note: "Full API" },
      },
      {
        name: "Learning curve",
        globo: { value: "easy", note: "Minutes" },
        matomo: { value: "hard", note: "Steep curve" },
      },
    ],
  },
  {
    category: "Cost & Value",
    features: [
      {
        name: "Pricing model",
        globo: { value: "transparent", note: "Per pageviews" },
        matomo: { value: "complex", note: "Server + plugins" },
      },
      {
        name: "Hidden costs",
        globo: { value: true, note: "None" },
        matomo: { value: false, note: "Server, plugins, time" },
      },
      {
        name: "Support included",
        globo: { value: true, note: "All plans" },
        matomo: { value: false, note: "Paid extra" },
      },
    ],
  },
];

// Problems with Matomo
const matomoProblems = [
  {
    icon: Server,
    title: "Server Maintenance Burden",
    description:
      "Self-hosting Matomo means you're responsible for server updates, security patches, backups, and scaling. That's a full-time DevOps job for larger sites.",
  },
  {
    icon: DollarSign,
    title: "Hidden Total Cost",
    description:
      "The 'free' self-hosted version costs $50-500+/month in server costs, plus $200+/year for essential plugins like Funnels and Heatmaps. Cloud pricing is often higher than alternatives.",
  },
  {
    icon: Clock,
    title: "Complex Setup Process",
    description:
      "Installing Matomo requires server provisioning, database setup, PHP configuration, cron jobs, and SSL certificates. Expect hours or days, not minutes.",
  },
  {
    icon: Cpu,
    title: "Performance Issues at Scale",
    description:
      "Matomo's PHP/MySQL stack struggles with high traffic. You'll need to archive data, optimize queries, and potentially shard databases as you grow.",
  },
  {
    icon: Wrench,
    title: "Plugin Dependency",
    description:
      "Core features like funnels, custom reports, and A/B testing require paid plugins. The free version is quite limited for serious analytics needs.",
  },
  {
    icon: HardDrive,
    title: "Dated User Interface",
    description:
      "Matomo's interface hasn't evolved much since its Piwik days. Navigation is confusing, and finding specific reports requires clicking through multiple menus.",
  },
];

// Why choose GloboAnalytics
const advantages = [
  {
    icon: Cloud,
    title: "Zero Maintenance",
    description:
      "We handle servers, updates, backups, and scaling. You focus on analyzing data, not managing infrastructure. No DevOps skills required.",
  },
  {
    icon: Sparkles,
    title: "Modern, Clean Interface",
    description:
      "Built in 2024 with modern design principles. Every insight is accessible in 2-3 clicks. Dark mode, responsive design, and keyboard shortcuts included.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Add one script tag and you're live. No server provisioning, no database configuration, no PHP version conflicts. Just analytics.",
  },
  {
    icon: TrendingUp,
    title: "Better Bot Detection",
    description:
      "Our AI-powered bot detection filters out spam and crawlers more accurately than static lists. See real human traffic, not inflated numbers.",
  },
  {
    icon: DollarSign,
    title: "Predictable Pricing",
    description:
      "One simple price based on pageviews. No surprise server costs, no expensive plugins, no per-seat charges. All features included.",
  },
  {
    icon: HeartHandshake,
    title: "Human Support",
    description:
      "Real support from real humans who know the product. No community forums as your only option. We respond within 24 hours.",
  },
];

// Migration stats
const migrationBenefits = [
  {
    metric: "90%",
    label: "Less maintenance time",
    description: "vs self-hosted Matomo",
  },
  {
    metric: "5 min",
    label: "Setup time",
    description: "vs hours for Matomo",
  },
  {
    metric: "$0",
    label: "Hidden costs",
    description: "All features included",
  },
  {
    metric: "24/7",
    label: "Uptime monitoring",
    description: "We watch so you don't",
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

export default function MatomoComparisonPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Cloud className="h-3 w-3 mr-1" />
              Cloud-First Analytics
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              GloboAnalytics vs <span className="text-muted-foreground">Matomo</span>
              <span className="text-sm font-normal text-muted-foreground ml-2">(Piwik)</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Love Matomo&apos;s privacy focus but tired of server maintenance? Get the same privacy
              benefits without the DevOps headache.
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

      {/* Stats Section */}
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

      {/* Problems Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Hidden Cost of Self-Hosting</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Matomo&apos;s &quot;free&quot; self-hosted option comes with significant hidden costs
              in time, money, and complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matomoProblems.map((problem) => (
              <div
                key={problem.title}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
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
              See how GloboAnalytics compares to Matomo across setup, features, and total cost of
              ownership.
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
                    <div className="font-medium text-muted-foreground">Matomo</div>
                  </div>

                  {category.features.map((feature) => (
                    <div key={feature.name} className="grid grid-cols-3 gap-4 px-6 py-4">
                      <div className="font-medium">{feature.name}</div>
                      <ComparisonValue value={feature.globo.value} note={feature.globo.note} />
                      <ComparisonValue value={feature.matomo.value} note={feature.matomo.note} />
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
              Why Switch from Matomo to GloboAnalytics
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Keep the privacy benefits you love while eliminating maintenance headaches.
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

      {/* TCO Calculator Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The True Cost of Self-Hosted Matomo
              </h2>
              <p className="text-lg text-muted-foreground">
                When you add up servers, plugins, and your time, the &quot;free&quot; option
                isn&apos;t so free.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Matomo TCO */}
              <div className="p-6 rounded-xl border bg-card">
                <h3 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400">
                  Matomo Self-Hosted (100K pageviews/mo)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>VPS Server (min spec)</span>
                    <span className="font-medium">$20-50/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database (managed)</span>
                    <span className="font-medium">$15-30/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Funnels Plugin</span>
                    <span className="font-medium">$199/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heatmaps Plugin</span>
                    <span className="font-medium">$199/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your time (2hr/mo @ $50/hr)</span>
                    <span className="font-medium">$100/mo</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total Monthly Cost</span>
                    <span className="text-orange-600 dark:text-orange-400">~$170-210/mo</span>
                  </div>
                </div>
              </div>

              {/* GloboAnalytics TCO */}
              <div className="p-6 rounded-xl border-2 border-primary bg-card">
                <h3 className="text-xl font-bold mb-4 text-primary">
                  GloboAnalytics (100K pageviews/mo)
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pro Plan</span>
                    <span className="font-medium">$29/mo</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Server costs</span>
                    <span className="font-medium">$0 (included)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Funnels</span>
                    <span className="font-medium">$0 (included)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>All features</span>
                    <span className="font-medium">$0 (included)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Maintenance time</span>
                    <span className="font-medium">$0 (none needed)</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total Monthly Cost</span>
                    <span className="text-primary">$29/mo</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                  <span className="text-green-700 dark:text-green-300 font-semibold">
                    Save ~$140-180/month
                  </span>
                </div>
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
                <h3 className="font-semibold mb-2">Can I import my Matomo data?</h3>
                <p className="text-muted-foreground">
                  We&apos;re working on a Matomo import tool. In the meantime, most customers run
                  both platforms during transition to maintain historical reference while building
                  new data in GloboAnalytics.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  I need self-hosting for compliance. Do you offer that?
                </h3>
                <p className="text-muted-foreground">
                  Yes! GloboAnalytics can be self-hosted via Docker for organizations with strict
                  data residency requirements. You get the same modern interface without the
                  complexity of Matomo&apos;s PHP stack.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">What about Matomo Tag Manager?</h3>
                <p className="text-muted-foreground">
                  GloboAnalytics integrates with Google Tag Manager and other popular tag managers.
                  Our lightweight script also supports direct event tracking without a tag manager.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">Do you have an API like Matomo?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer a comprehensive REST API for data export, custom integrations, and
                  automation. Documentation includes examples for common use cases.
                </p>
              </div>

              <div className="p-6 rounded-xl border bg-card">
                <h3 className="font-semibold mb-2">
                  Is cookieless tracking really GDPR compliant?
                </h3>
                <p className="text-muted-foreground">
                  Yes. Our cookieless tracking uses privacy-preserving techniques that don&apos;t
                  store personal data. Several EU data protection authorities have confirmed this
                  approach doesn&apos;t require consent.
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
              Ready to Stop Maintaining Servers?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Keep privacy-first analytics without the DevOps burden. Start your free trial today.
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
                  Request Demo
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
            name: "GloboAnalytics vs Matomo (Piwik) Comparison",
            description:
              "Compare GloboAnalytics with Matomo/Piwik. Modern cloud analytics without server maintenance.",
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
