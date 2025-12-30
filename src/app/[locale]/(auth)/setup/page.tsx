"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, BarChart3, Key, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "license" | "account";

export default function SetupPage() {
  const t = useTranslations("setup");
  const router = useRouter();
  const [step, setStep] = useState<Step>("license");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<{
    valid: boolean;
    tier?: string;
    organization?: string;
  } | null>(null);

  async function validateLicense() {
    if (!licenseKey.trim()) {
      // Skip license validation - use Community tier
      setLicenseStatus({ valid: true, tier: "community", organization: "Self-Hosted" });
      setStep("account");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup/validate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || t("license.invalid"));
      }

      setLicenseStatus({
        valid: true,
        tier: data.tier,
        organization: data.organization,
      });
      setStep("account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          password: formData.get("password"),
          licenseKey: licenseKey.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Setup failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold">{t("success.title")}</h2>
              <p className="text-muted-foreground">{t("success.description")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>
            {step === "license" ? t("license.description") : t("account.description")}
          </CardDescription>
          {/* Step indicator */}
          <div className="flex justify-center gap-2 pt-4">
            <div
              className={`h-2 w-8 rounded-full ${step === "license" ? "bg-primary" : "bg-muted"}`}
            />
            <div
              className={`h-2 w-8 rounded-full ${step === "account" ? "bg-primary" : "bg-muted"}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          {step === "license" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t("license.label")}
                </Label>
                <Input
                  id="licenseKey"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="GLOB-PRO-xxxxx.xxxxx"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t("license.hint")}</p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={validateLicense} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {licenseKey.trim() ? t("license.validate") : t("license.skipCommunity")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">{t("license.communityTitle")}</p>
                <ul className="mt-2 space-y-1 text-muted-foreground text-xs">
                  <li>• 3 {t("license.websites")}</li>
                  <li>• 10,000 {t("license.pageviews")}</li>
                  <li>• {t("license.basicFeatures")}</li>
                </ul>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {licenseStatus && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium capitalize">
                    {licenseStatus.tier === "community"
                      ? t("license.communityTier")
                      : `${licenseStatus.tier} Edition`}
                  </p>
                  <p className="text-xs text-muted-foreground">{licenseStatus.organization}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("account.firstName")}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t("account.lastName")}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("account.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("account.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={8}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">{t("account.passwordHint")}</p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("license")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("back")}
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("account.submit")}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
