/**
 * Email Module (OSS Version)
 *
 * Uses SMTP only (no SendGrid dependency).
 * Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in environment.
 */

import nodemailer from "nodemailer";
import { randomInt } from "crypto";
import { logger, logError } from "@/lib/logger";

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@globoanalytics.com";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "GloboAnalytics";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_SECURE = process.env.SMTP_SECURE === "true"; // true for 465, false for other ports

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create SMTP transporter
 */
function createTransporter() {
  if (!SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth:
      SMTP_USER && SMTP_PASSWORD
        ? {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          }
        : undefined,
  });
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    // No SMTP configured - log in dev mode
    logger.warn({
      type: "email",
      provider: "none",
      message: "No SMTP configured. Set SMTP_HOST to enable email.",
      to,
      subject,
      preview: html.substring(0, 200),
    });
    return process.env.NODE_ENV === "development"; // Return true in dev to not block flows
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    logger.info({ type: "email", provider: "smtp", to, subject, host: SMTP_HOST });
    return true;
  } catch (error) {
    logError(error, { context: "email", provider: "smtp", to, subject });
    return false;
  }
}

// Email template helpers
export function getVerifyEmailTemplate(name: string, verifyUrl: string, locale: string = "en") {
  const translations = {
    en: {
      title: "Verify your email address",
      greeting: `Hi ${name},`,
      message: "Please click the button below to verify your email address.",
      button: "Verify Email",
      expiry: "This link will expire in 24 hours.",
      ignore: "If you didn't create an account, you can safely ignore this email.",
      footer: "GloboAnalytics - Web Analytics",
    },
    fr: {
      title: "Verifiez votre adresse email",
      greeting: `Bonjour ${name},`,
      message: "Veuillez cliquer sur le bouton ci-dessous pour verifier votre adresse email.",
      button: "Verifier l'email",
      expiry: "Ce lien expirera dans 24 heures.",
      ignore: "Si vous n'avez pas cree de compte, vous pouvez ignorer cet email.",
      footer: "GloboAnalytics - Analytics Web",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">${t.title}</h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.greeting}</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.message}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
          <tr>
            <td style="background-color: #18181b; border-radius: 6px;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">${t.button}</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">${t.expiry}</p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">${t.ignore}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getResetPasswordTemplate(name: string, resetUrl: string, locale: string = "en") {
  const translations = {
    en: {
      title: "Reset your password",
      greeting: `Hi ${name},`,
      message:
        "We received a request to reset your password. Click the button below to choose a new password.",
      button: "Reset Password",
      expiry: "This link will expire in 1 hour.",
      ignore: "If you didn't request a password reset, you can safely ignore this email.",
      footer: "GloboAnalytics - Web Analytics",
    },
    fr: {
      title: "Reinitialisez votre mot de passe",
      greeting: `Bonjour ${name},`,
      message:
        "Nous avons recu une demande de reinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
      button: "Reinitialiser le mot de passe",
      expiry: "Ce lien expirera dans 1 heure.",
      ignore:
        "Si vous n'avez pas demande de reinitialisation de mot de passe, vous pouvez ignorer cet email.",
      footer: "GloboAnalytics - Analytics Web",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">${t.title}</h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.greeting}</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.message}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
          <tr>
            <td style="background-color: #18181b; border-radius: 6px;">
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">${t.button}</a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">${t.expiry}</p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">${t.ignore}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getTfaCodeTemplate(name: string, code: string, locale: string = "en") {
  const translations = {
    en: {
      title: "Your verification code",
      greeting: `Hi ${name},`,
      message: "Use the following code to complete your sign-in:",
      expiry: "This code will expire in 10 minutes.",
      warning: "If you didn't try to sign in, someone may be trying to access your account.",
      footer: "GloboAnalytics - Web Analytics",
    },
    fr: {
      title: "Votre code de verification",
      greeting: `Bonjour ${name},`,
      message: "Utilisez le code suivant pour terminer votre connexion :",
      expiry: "Ce code expirera dans 10 minutes.",
      warning:
        "Si vous n'avez pas essaye de vous connecter, quelqu'un essaie peut-etre d'acceder a votre compte.",
      footer: "GloboAnalytics - Analytics Web",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #18181b;">${t.title}</h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.greeting}</p>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #3f3f46;">${t.message}</p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${code}</span>
        </div>
        <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">${t.expiry}</p>
        <p style="margin: 0; font-size: 14px; color: #ef4444;">${t.warning}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper to generate verification URL
export function getVerifyEmailUrl(token: string, locale: string = "en"): string {
  return `${APP_URL}/${locale}/verify-email?token=${token}`;
}

// Helper to generate reset password URL
export function getResetPasswordUrl(token: string, locale: string = "en"): string {
  return `${APP_URL}/${locale}/reset-password?token=${token}`;
}

// Generate a 6-digit TFA code using cryptographically secure random
export function generateTfaCode(): string {
  // crypto.randomInt is cryptographically secure (uses crypto.randomBytes internally)
  return randomInt(100000, 1000000).toString();
}

// Generate a secure token for email verification or password reset
export function generateToken(): string {
  return crypto.randomUUID();
}

// Weekly/Monthly analytics report email template
export function getAnalyticsReportTemplate(
  name: string,
  websiteDomain: string,
  reportType: "weekly" | "monthly",
  stats: {
    visitors: number;
    pageviews: number;
    topPages: { page: string; views: number }[];
    topCountries: { country: string; visitors: number }[];
  },
  dashboardUrl: string,
  locale: string = "en"
) {
  const translations = {
    en: {
      title: reportType === "weekly" ? "Weekly Report" : "Monthly Report",
      greeting: `Hi ${name},`,
      period: reportType === "weekly" ? "last 7 days" : "last 30 days",
      visitors: "Visitors",
      pageviews: "Pageviews",
      topPages: "Top Pages",
      topCountries: "Top Countries",
      page: "Page",
      views: "Views",
      country: "Country",
      viewReport: "View Full Report",
      footer: "GloboAnalytics - Web Analytics",
    },
    fr: {
      title: reportType === "weekly" ? "Rapport Hebdomadaire" : "Rapport Mensuel",
      greeting: `Bonjour ${name},`,
      period: reportType === "weekly" ? "7 derniers jours" : "30 derniers jours",
      visitors: "Visiteurs",
      pageviews: "Pages vues",
      topPages: "Pages populaires",
      topCountries: "Pays populaires",
      page: "Page",
      views: "Vues",
      country: "Pays",
      viewReport: "Voir le rapport complet",
      footer: "GloboAnalytics - Analytics Web",
    },
  };

  const t = translations[locale as keyof typeof translations] || translations.en;

  const topPagesRows = stats.topPages
    .slice(0, 5)
    .map(
      (p) =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #e4e4e7;">${p.page}</td><td style="padding: 8px; border-bottom: 1px solid #e4e4e7; text-align: right;">${p.views.toLocaleString()}</td></tr>`
    )
    .join("");

  const topCountriesRows = stats.topCountries
    .slice(0, 5)
    .map(
      (c) =>
        `<tr><td style="padding: 8px; border-bottom: 1px solid #e4e4e7;">${c.country}</td><td style="padding: 8px; border-bottom: 1px solid #e4e4e7; text-align: right;">${c.visitors.toLocaleString()}</td></tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #18181b;">${t.title}</h1>
        <p style="margin: 0 0 24px; font-size: 14px; color: #71717a;">${websiteDomain} - ${t.period}</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
          <tr>
            <td style="width: 50%; background-color: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: #18181b;">${stats.visitors.toLocaleString()}</div>
              <div style="font-size: 14px; color: #71717a;">${t.visitors}</div>
            </td>
            <td style="width: 16px;"></td>
            <td style="width: 50%; background-color: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center;">
              <div style="font-size: 32px; font-weight: 700; color: #18181b;">${stats.pageviews.toLocaleString()}</div>
              <div style="font-size: 14px; color: #71717a;">${t.pageviews}</div>
            </td>
          </tr>
        </table>

        ${
          stats.topPages.length > 0
            ? `
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">${t.topPages}</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 500;">${t.page}</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 500;">${t.views}</th>
            </tr>
          </thead>
          <tbody>${topPagesRows}</tbody>
        </table>
        `
            : ""
        }

        ${
          stats.topCountries.length > 0
            ? `
        <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #18181b;">${t.topCountries}</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 500;">${t.country}</th>
              <th style="text-align: right; padding: 8px; border-bottom: 2px solid #e4e4e7; color: #71717a; font-weight: 500;">${t.visitors}</th>
            </tr>
          </thead>
          <tbody>${topCountriesRows}</tbody>
        </table>
        `
            : ""
        }

        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: #18181b; border-radius: 6px;">
              <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 500; color: #ffffff; text-decoration: none;">${t.viewReport}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa;">${t.footer}</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
