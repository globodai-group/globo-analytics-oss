"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  verifyEmailAction,
  resendVerificationEmailAction,
} from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "resend"
  >(token ? "loading" : "resend");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(emailParam || "");
  const [isResending, setIsResending] = useState(false);
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    if (token && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      verifyEmailAction(token, locale).then((result) => {
        if (result.success) {
          setStatus("success");
          setMessage(result.message || "");
        } else {
          setStatus("error");
          setMessage(result.error || "");
        }
      });
    }
  }, [token, locale]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsResending(true);
    const result = await resendVerificationEmailAction(email, locale);

    if (result.success) {
      setMessage(result.message || "");
    } else {
      setMessage(result.error || "");
    }
    setIsResending(false);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{t("verifyEmail")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">{t("emailVerified")}</h2>
            <p className="mt-2 text-center text-muted-foreground">{message}</p>
            <Button asChild className="mt-6">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold">
              {t("verificationFailed")}
            </h2>
            <p className="mt-2 text-center text-muted-foreground">{message}</p>
            <div className="mt-6 flex gap-4">
              <Button variant="outline" asChild>
                <Link href="/login">{t("backToLogin")}</Link>
              </Button>
              <Button onClick={() => setStatus("resend")}>
                {t("resendCode")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resend form
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t("verifyEmail")}</CardTitle>
          <CardDescription>{t("verifyEmailDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.includes("envoyé") || message.includes("sent") ? "text-green-600" : "text-red-600"}`}
              >
                {message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isResending}>
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                t("resendVerificationEmail")
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
