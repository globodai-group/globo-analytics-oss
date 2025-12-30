import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Shield,
  Zap,
  Users,
  LineChart,
  BarChart3,
  ArrowRight,
  Check,
  X,
  Star,
  TrendingUp,
  Lock,
  Eye,
  Code,
  Sparkles,
  Target,
  ChevronDown,
  Play,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">GloboAnalytics</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Features
              </Link>
              <Link
                href="#compare"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Why Us
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {t("pricing.title")}
              </Link>
              <Link
                href="/developers"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Developers
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost">{t("auth.login")}</Button>
              </Link>
              <Link href="/register">
                <Button className="gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Trust badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Trusted by 2,500+ websites worldwide</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              The{" "}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                privacy-first
              </span>{" "}
              alternative to Google Analytics
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Get powerful insights without cookies, consent banners, or compromising your
              visitors&apos; privacy. Simple setup, real-time data, 100% GDPR compliant.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2">
                  <Play className="h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2">4.9/5 from 500+ reviews</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Setup in 2 minutes</span>
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 mx-auto max-w-5xl">
            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                <div className="text-center p-8">
                  <BarChart3 className="h-24 w-24 text-primary/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Interactive Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground mb-8">
            TRUSTED BY INNOVATIVE COMPANIES
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {[
              "TechCorp",
              "StartupXYZ",
              "AgencyPro",
              "E-Commerce Inc",
              "SaaS Labs",
              "Digital Co",
            ].map((company) => (
              <div key={company} className="text-xl font-bold text-muted-foreground">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            The Problem
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Google Analytics is broken</h2>
          <p className="text-lg text-muted-foreground">
            Complex interfaces, privacy violations, blocked by ad blockers, and banned in multiple
            EU countries. It&apos;s time for something better.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <ProblemCard
            icon={Eye}
            title="Privacy Nightmare"
            description="Tracks users across the entire web, selling their data to advertisers."
          />
          <ProblemCard
            icon={Code}
            title="Bloated & Slow"
            description="45KB+ script that slows down your site and hurts SEO rankings."
          />
          <ProblemCard
            icon={X}
            title="Blocked by Users"
            description="30-40% of visitors use ad blockers, making your data incomplete."
          />
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-primary text-primary-foreground py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              The Solution
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Analytics that respect privacy</h2>
            <p className="text-lg opacity-90">
              GloboAnalytics gives you all the insights you need without compromising your
              visitors&apos; privacy or breaking any laws.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <SolutionCard
              icon={Shield}
              title="100% Privacy Compliant"
              description="No cookies, no consent banners needed. GDPR, CCPA, PECR compliant out of the box."
            />
            <SolutionCard
              icon={Zap}
              title="Lightning Fast"
              description="Less than 1KB script. Zero impact on your site speed and Core Web Vitals."
            />
            <SolutionCard
              icon={TrendingUp}
              title="Accurate Data"
              description="Not blocked by ad blockers. Get the full picture of your traffic."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful analytics without the complexity. See what matters at a glance.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={LineChart}
            title="Real-time Dashboard"
            description="See who's on your site right now. Live visitor count, active pages, and instant updates."
          />
          <FeatureCard
            icon={Globe}
            title="Geographic Insights"
            description="Understand where your visitors come from with country, city, and region breakdowns."
          />
          <FeatureCard
            icon={Users}
            title="Audience Segments"
            description="Create custom segments based on behavior, location, device, and more."
          />
          <FeatureCard
            icon={Target}
            title="Goals & Conversions"
            description="Track sign-ups, purchases, and any custom event that matters to your business."
          />
          <FeatureCard
            icon={BarChart3}
            title="Funnel Analysis"
            description="Visualize user journeys and identify where visitors drop off."
          />
          <FeatureCard
            icon={Sparkles}
            title="AI Insights"
            description="Get intelligent recommendations powered by Claude AI to improve your metrics."
          />
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              Comparison
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              GloboAnalytics vs The Competition
            </h2>
            <p className="text-lg text-muted-foreground">
              See why thousands of websites are switching to GloboAnalytics.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-semibold">Feature</th>
                  <th className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-bold text-primary">GloboAnalytics</span>
                    </div>
                  </th>
                  <th className="p-4 text-center text-muted-foreground">Google Analytics</th>
                  <th className="p-4 text-center text-muted-foreground">Matomo</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  feature="No cookies required"
                  globo={true}
                  google={false}
                  matomo="partial"
                />
                <ComparisonRow
                  feature="GDPR compliant by default"
                  globo={true}
                  google={false}
                  matomo="partial"
                />
                <ComparisonRow feature="Script size" globo="< 1KB" google="45KB+" matomo="22KB" />
                <ComparisonRow
                  feature="Real-time analytics"
                  globo={true}
                  google={true}
                  matomo={true}
                />
                <ComparisonRow
                  feature="AI-powered insights"
                  globo={true}
                  google={false}
                  matomo={false}
                />
                <ComparisonRow
                  feature="No consent banner needed"
                  globo={true}
                  google={false}
                  matomo={false}
                />
                <ComparisonRow
                  feature="Self-hosted option"
                  globo={true}
                  google={false}
                  matomo={true}
                />
                <ComparisonRow feature="Pricing" globo="From $0" google="Free*" matomo="From $0" />
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              * Google Analytics is free but you pay with your visitors&apos; data
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Link href="/compare/google-analytics">
              <Button variant="outline">GloboAnalytics vs Google Analytics</Button>
            </Link>
            <Link href="/compare/matomo">
              <Button variant="outline">GloboAnalytics vs Matomo</Button>
            </Link>
            <Link href="/compare/plausible">
              <Button variant="outline">GloboAnalytics vs Plausible</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Testimonials
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Loved by developers and marketers</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <TestimonialCard
            quote="Finally, analytics I can use without feeling guilty about privacy. The real-time dashboard is incredibly useful."
            author="Sarah Chen"
            role="Founder, TechStartup"
            rating={5}
          />
          <TestimonialCard
            quote="Switched from GA4 and never looked back. Setup took 2 minutes and the interface actually makes sense."
            author="Marcus Johnson"
            role="Head of Marketing, SaaS Co"
            rating={5}
          />
          <TestimonialCard
            quote="The AI insights feature is game-changing. It spotted a conversion issue we'd missed for months."
            author="Emma Rodriguez"
            role="Growth Lead, E-commerce"
            rating={5}
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="gdpr">
                <AccordionTrigger>Is GloboAnalytics really GDPR compliant?</AccordionTrigger>
                <AccordionContent>
                  Yes! We don&apos;t use cookies or collect any personal data. We don&apos;t track
                  users across websites. No consent banner is required. We&apos;re also CCPA and
                  PECR compliant.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="migrate">
                <AccordionTrigger>Can I migrate from Google Analytics?</AccordionTrigger>
                <AccordionContent>
                  Absolutely. You can run both tools in parallel during migration. We also offer
                  historical data import from GA (coming soon).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="script">
                <AccordionTrigger>How does the tracking script work?</AccordionTrigger>
                <AccordionContent>
                  Our script is less than 1KB and loads asynchronously. It collects anonymous
                  pageviews, referrers, and events without using cookies or fingerprinting.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="accuracy">
                <AccordionTrigger>Why is your data more accurate than GA?</AccordionTrigger>
                <AccordionContent>
                  Since we don&apos;t use cookies, we&apos;re not blocked by ad blockers or privacy
                  extensions. You typically see 20-40% more traffic than GA reports.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pricing">
                <AccordionTrigger>Is there a free plan?</AccordionTrigger>
                <AccordionContent>
                  Yes! Our free plan includes up to 10,000 pageviews/month, perfect for small sites
                  and personal projects. No credit card required.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="relative rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-8 sm:p-12 lg:p-16 text-center text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to take back control?
          </h2>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto mb-8">
            Join thousands of websites using privacy-friendly analytics. Start your free trial
            today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-8 text-base text-white hover:bg-white/20"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">
            No credit card required &bull; 14-day free trial &bull; Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-6 w-6 text-primary" />
                <span className="font-bold">GloboAnalytics</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Privacy-friendly web analytics for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/developers" className="hover:text-foreground">
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compare</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/compare/google-analytics" className="hover:text-foreground">
                    vs Google Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/compare/matomo" className="hover:text-foreground">
                    vs Matomo
                  </Link>
                </li>
                <li>
                  <Link href="/compare/plausible" className="hover:text-foreground">
                    vs Plausible
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/pages/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} GloboAnalytics. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made with</span>
              <span className="text-red-500">love</span>
              <span>for privacy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component definitions
function ProblemCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
        <Icon className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SolutionCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/50">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  globo,
  google,
  matomo,
}: {
  feature: string;
  globo: boolean | string;
  google: boolean | string;
  matomo: boolean | string;
}) {
  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    if (value === false) return <X className="h-5 w-5 text-red-500 mx-auto" />;
    if (value === "partial") return <span className="text-yellow-600">Partial</span>;
    if (value === "coming")
      return <span className="text-muted-foreground text-sm">Coming soon</span>;
    return <span className="text-sm">{value}</span>;
  };

  return (
    <tr className="border-b">
      <td className="p-4 text-sm">{feature}</td>
      <td className="p-4 text-center bg-primary/5">{renderValue(globo)}</td>
      <td className="p-4 text-center">{renderValue(google)}</td>
      <td className="p-4 text-center">{renderValue(matomo)}</td>
    </tr>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-semibold text-sm">{author}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}
