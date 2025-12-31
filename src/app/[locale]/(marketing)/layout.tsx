"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Globe, Menu } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">GloboAnalytics</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/pricing"
                className="text-sm font-medium hover:text-primary"
              >
                {t("pricing.title")}
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium hover:text-primary"
              >
                {t("footer.contact")}
              </Link>
            </nav>

            {/* Desktop auth buttons */}
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">{t("auth.login")}</Button>
              </Link>
              <Link href="/register">
                <Button>{t("auth.register")}</Button>
              </Link>
            </div>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden touch-target"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] max-w-[85vw]">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link
                    href="/pricing"
                    className="flex items-center min-h-[44px] px-4 py-2 text-base font-medium hover:bg-muted rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("pricing.title")}
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center min-h-[44px] px-4 py-2 text-base font-medium hover:bg-muted rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("footer.contact")}
                  </Link>
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <Link
                      href="/login"
                      className="block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        {t("auth.login")}
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      className="block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">{t("auth.register")}</Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.product")}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("pricing.title")}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.selfHosted")}
                  </a>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.contact")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Open Source */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.openSource")}</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss#-documentation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.documentation")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.releases")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.community")}</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.discussions")}
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.gg/globoanalytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com/globoanalytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Twitter
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">{t("footer.legal")}</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/pages/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pages/terms"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/globodai-group/globo-analytics-oss/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    AGPL-3.0 License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              <span className="font-bold">GloboAnalytics</span>
            </Link>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              &copy; {new Date().getFullYear()} GloboAnalytics.{" "}
              {t("footer.copyright")}
              <span className="ml-2 text-muted-foreground/60">
                v{APP_VERSION}
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
