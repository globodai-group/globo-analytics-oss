"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { clientLogger } from "@/lib/client-logger";
import { verifyTfaAction, sendTfaCodeAction } from "@/lib/actions/auth";
import {
  verifyTotpLoginAction,
  verifyRecoveryCodeAction,
  getPasskeyAuthOptionsAction,
  verifyPasskeyAuthAction,
} from "@/lib/actions/tfa";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2, Smartphone, Key, Mail, FileKey } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

type TfaMethod = "totp" | "passkey" | "email" | "recovery";

export default function TfaPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId") || "";
  const email = searchParams.get("email") || "";
  const password = searchParams.get("password") || "";
  const defaultMethod = (searchParams.get("method") as TfaMethod) || "totp";
  const hasTotp = searchParams.get("hasTotp") === "true";
  const hasPasskey = searchParams.get("hasPasskey") === "true";

  const [method, setMethod] = useState<TfaMethod>(defaultMethod);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const translations = {
    title: locale === "fr" ? "Vérification en deux étapes" : "Two-Step Verification",
    chooseMethod: locale === "fr" ? "Choisir une autre méthode" : "Choose another method",
    totp: {
      title: locale === "fr" ? "Application d'authentification" : "Authenticator App",
      description:
        locale === "fr"
          ? "Entrez le code à 6 chiffres de votre application"
          : "Enter the 6-digit code from your app",
    },
    passkey: {
      title: locale === "fr" ? "Clé de sécurité" : "Security Key",
      description:
        locale === "fr"
          ? "Utilisez votre clé de sécurité ou empreinte digitale"
          : "Use your security key or fingerprint",
      button: locale === "fr" ? "Utiliser la clé de sécurité" : "Use security key",
    },
    email: {
      title: locale === "fr" ? "Code par email" : "Email Code",
      description:
        locale === "fr"
          ? "Entrez le code envoyé à votre adresse email"
          : "Enter the code sent to your email address",
    },
    recovery: {
      title: locale === "fr" ? "Code de récupération" : "Recovery Code",
      description:
        locale === "fr"
          ? "Entrez un de vos codes de récupération"
          : "Enter one of your recovery codes",
      placeholder: "XXXX-XXXX",
    },
    verify: locale === "fr" ? "Vérifier" : "Verify",
    resend: locale === "fr" ? "Renvoyer le code" : "Resend code",
    useInstead: locale === "fr" ? "Utiliser à la place" : "Use instead",
  };

  useEffect(() => {
    if (method === "totp" || method === "email") {
      inputRefs.current[0]?.focus();
    }
  }, [method]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every((digit) => digit)) {
      handleSubmitCode(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      handleSubmitCode(pastedData);
    }
  }

  async function handleSubmitCode(codeString?: string) {
    const fullCode = codeString || code.join("");

    if (fullCode.length !== 6) {
      setError(t("tfaCodeRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    let result;

    if (method === "totp") {
      result = await verifyTotpLoginAction(userId, fullCode, locale);
    } else {
      // Legacy email-based TFA
      const formData = new FormData();
      formData.append("code", fullCode);
      formData.append("userId", userId);
      formData.append("email", email);
      formData.append("password", password);
      result = await verifyTfaAction(formData, locale);
    }

    if (result.success) {
      // Sign in the user
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        setError(locale === "fr" ? "Erreur de connexion" : "Login error");
      }
    } else {
      setError(result.error || "");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }

    setIsLoading(false);
  }

  async function handleSubmitRecoveryCode() {
    if (!recoveryCode.trim()) {
      setError(
        locale === "fr" ? "Veuillez entrer un code de récupération" : "Please enter a recovery code"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await verifyRecoveryCodeAction(userId, recoveryCode.trim(), locale);

    if (result.success) {
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        setError(locale === "fr" ? "Erreur de connexion" : "Login error");
      }
    } else {
      setError(result.error || "");
    }

    setIsLoading(false);
  }

  async function handlePasskeyAuth() {
    setIsLoading(true);
    setError("");

    try {
      const optionsResult = await getPasskeyAuthOptionsAction(userId, locale);

      if (!optionsResult.success || !optionsResult.data) {
        throw new Error(optionsResult.error || "Failed to get options");
      }

      const { options, challenge } = optionsResult.data;

      const authentication = await startAuthentication({
        optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
      });

      const verifyResult = await verifyPasskeyAuthAction(authentication, challenge, userId, locale);

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || "Verification failed");
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push(`/${locale}/dashboard`);
      } else {
        setError(locale === "fr" ? "Erreur de connexion" : "Login error");
      }
    } catch (err) {
      clientLogger.error("Passkey auth error:", err);
      setError(
        err instanceof Error
          ? err.message
          : locale === "fr"
            ? "Échec de l'authentification"
            : "Authentication failed"
      );
    }

    setIsLoading(false);
  }

  async function handleResend() {
    if (countdown > 0) return;

    setIsResending(true);
    setResendMessage("");

    const result = await sendTfaCodeAction(userId, locale);

    if (result.success) {
      setResendMessage(result.message || "");
      setCountdown(60);
    } else {
      setResendMessage(result.error || "");
    }

    setIsResending(false);
  }

  function switchMethod(newMethod: TfaMethod) {
    setMethod(newMethod);
    setError("");
    setCode(["", "", "", "", "", ""]);
    setRecoveryCode("");
  }

  function getMethodIcon() {
    switch (method) {
      case "totp":
        return <Smartphone className="h-8 w-8 text-primary" />;
      case "passkey":
        return <Key className="h-8 w-8 text-primary" />;
      case "email":
        return <Mail className="h-8 w-8 text-primary" />;
      case "recovery":
        return <FileKey className="h-8 w-8 text-primary" />;
    }
  }

  function getMethodInfo() {
    switch (method) {
      case "totp":
        return translations.totp;
      case "passkey":
        return translations.passkey;
      case "email":
        return translations.email;
      case "recovery":
        return translations.recovery;
    }
  }

  const methodInfo = getMethodInfo();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {getMethodIcon()}
          </div>
          <CardTitle>{methodInfo.title}</CardTitle>
          <CardDescription>{methodInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TOTP / Email Code Input */}
          {(method === "totp" || method === "email") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitCode();
              }}
              className="space-y-6"
            >
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="h-14 w-12 text-center text-2xl font-semibold"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {error && <p className="text-center text-sm text-red-600">{error}</p>}

              {method === "email" && resendMessage && (
                <p
                  className={`text-center text-sm ${resendMessage.includes("envoyé") || resendMessage.includes("sent") ? "text-green-600" : "text-red-600"}`}
                >
                  {resendMessage}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || code.some((d) => !d)}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  translations.verify
                )}
              </Button>

              {method === "email" && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className="text-sm"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : countdown > 0 ? (
                      `${translations.resend} (${countdown}s)`
                    ) : (
                      translations.resend
                    )}
                  </Button>
                </div>
              )}
            </form>
          )}

          {/* Passkey */}
          {method === "passkey" && (
            <div className="space-y-6">
              {error && <p className="text-center text-sm text-red-600">{error}</p>}

              <Button onClick={handlePasskeyAuth} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    {translations.passkey.button}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Recovery Code */}
          {method === "recovery" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitRecoveryCode();
              }}
              className="space-y-6"
            >
              <Input
                type="text"
                placeholder={translations.recovery.placeholder}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
              />

              {error && <p className="text-center text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading || !recoveryCode.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  translations.verify
                )}
              </Button>
            </form>
          )}

          {/* Method Switcher */}
          <Separator className="my-6" />

          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground mb-3">
              {translations.chooseMethod}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {method !== "totp" && hasTotp && (
                <Button variant="outline" size="sm" onClick={() => switchMethod("totp")}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  App
                </Button>
              )}
              {method !== "passkey" && hasPasskey && (
                <Button variant="outline" size="sm" onClick={() => switchMethod("passkey")}>
                  <Key className="h-4 w-4 mr-2" />
                  Passkey
                </Button>
              )}
              {method !== "email" && (
                <Button variant="outline" size="sm" onClick={() => switchMethod("email")}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
              {method !== "recovery" && (
                <Button variant="outline" size="sm" onClick={() => switchMethod("recovery")}>
                  <FileKey className="h-4 w-4 mr-2" />
                  Recovery
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
