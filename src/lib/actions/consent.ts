"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ConsentMode } from "@prisma/client";

// Types
interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// SECURITY: Valid banner positions to prevent XSS injection
const VALID_BANNER_POSITIONS = ["top", "bottom", "center"] as const;
type BannerPosition = (typeof VALID_BANNER_POSITIONS)[number];

interface ConsentConfigInput {
  requireConsent: boolean;
  consentMode: ConsentMode;
  bannerPosition: BannerPosition;
  bannerText?: string;
  privacyUrl?: string;
  consentDuration: number;
}

interface ConsentConfigData {
  id: number;
  projectId: number;
  requireConsent: boolean;
  consentMode: ConsentMode;
  bannerPosition: string;
  bannerText: string | null;
  privacyUrl: string | null;
  consentDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get consent config for project
export async function getConsentConfigAction(
  projectId: number,
  locale: string,
): Promise<ActionResult<ConsentConfigData | null>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    const config = await prisma.consentConfig.findUnique({
      where: { projectId },
    });

    return { success: true, data: config };
  } catch (error) {
    console.error("Error fetching consent config:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Create or update consent config
export async function saveConsentConfigAction(
  projectId: number,
  input: ConsentConfigInput,
  locale: string,
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    // SECURITY: Validate bannerPosition to prevent XSS injection in generated script
    if (
      !VALID_BANNER_POSITIONS.includes(input.bannerPosition as BannerPosition)
    ) {
      return {
        success: false,
        error:
          locale === "fr"
            ? "Position de bannière invalide"
            : "Invalid banner position",
      };
    }

    await prisma.consentConfig.upsert({
      where: { projectId },
      update: {
        requireConsent: input.requireConsent,
        consentMode: input.consentMode,
        bannerPosition: input.bannerPosition,
        bannerText: input.bannerText,
        privacyUrl: input.privacyUrl,
        consentDuration: input.consentDuration,
      },
      create: {
        projectId,
        requireConsent: input.requireConsent,
        consentMode: input.consentMode,
        bannerPosition: input.bannerPosition,
        bannerText: input.bannerText,
        privacyUrl: input.privacyUrl,
        consentDuration: input.consentDuration,
      },
    });

    revalidatePath(`/projects/${projectId}/settings/consent`);

    return {
      success: true,
      message:
        locale === "fr" ? "Configuration sauvegardée" : "Configuration saved",
    };
  } catch (error) {
    console.error("Error saving consent config:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Get consent statistics
export async function getConsentStatsAction(
  projectId: number,
  locale: string,
): Promise<
  ActionResult<{
    totalVisitors: number;
    consentedVisitors: number;
    analyticsConsent: number;
    marketingConsent: number;
    preferencesConsent: number;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    const [
      totalVisitors,
      consentedVisitors,
      analyticsConsent,
      marketingConsent,
      preferencesConsent,
    ] = await Promise.all([
      prisma.visitorConsent.count({
        where: { projectId },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          consentedAt: { not: null },
        },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          analytics: true,
        },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          marketing: true,
        },
      }),
      prisma.visitorConsent.count({
        where: {
          projectId,
          preferences: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalVisitors,
        consentedVisitors,
        analyticsConsent,
        marketingConsent,
        preferencesConsent,
      },
    };
  } catch (error) {
    console.error("Error fetching consent stats:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}

// Generate consent banner script
export async function getConsentBannerScriptAction(
  projectId: number,
  locale: string,
): Promise<ActionResult<string>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: locale === "fr" ? "Non authentifié" : "Not authenticated",
      };
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return {
        success: false,
        error: locale === "fr" ? "Projet non trouvé" : "Project not found",
      };
    }

    const config = await prisma.consentConfig.findUnique({
      where: { projectId },
    });

    if (!config) {
      return {
        success: false,
        error:
          locale === "fr"
            ? "Configuration de consentement non trouvée"
            : "Consent configuration not found",
      };
    }

    // Generate the script
    const script = `<!-- GloboAnalytics Consent Banner -->
<script>
(function() {
  var config = {
    projectId: "${project.trackingId}",
    position: "${config.bannerPosition}",
    mode: "${config.consentMode}",
    duration: ${config.consentDuration},
    text: ${JSON.stringify(config.bannerText || "")},
    privacyUrl: ${JSON.stringify(config.privacyUrl || "")}
  };

  var STORAGE_KEY = 'gr_consent';

  function getConsent() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var consent = JSON.parse(stored);
        if (consent.expires && new Date(consent.expires) > new Date()) {
          return consent;
        }
      }
    } catch (e) {}
    return null;
  }

  function setConsent(analytics, marketing, preferences) {
    var expires = new Date();
    expires.setDate(expires.getDate() + config.duration);
    var consent = {
      analytics: analytics,
      marketing: marketing,
      preferences: preferences,
      expires: expires.toISOString(),
      consentedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));

    // Send to server
    fetch('/api/v2/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: config.projectId,
        ...consent
      })
    }).catch(function() {});

    hideBanner();

    // Trigger tracking if analytics consent given
    if (analytics && window.gr) {
      window.gr('consent', 'granted');
    }
  }

  function hideBanner() {
    var banner = document.getElementById('gr-consent-banner');
    if (banner) banner.remove();
  }

  function showBanner() {
    if (document.getElementById('gr-consent-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'gr-consent-banner';
    banner.innerHTML = \`
      <div class="gr-consent-content">
        <p>\${config.text || 'We use cookies to improve your experience.'}</p>
        \${config.privacyUrl ? '<a href="' + config.privacyUrl + '" target="_blank">Privacy Policy</a>' : ''}
        <div class="gr-consent-buttons">
          <button onclick="window.grConsent.acceptAll()">Accept All</button>
          <button onclick="window.grConsent.acceptNecessary()">Necessary Only</button>
          <button onclick="window.grConsent.showSettings()">Customize</button>
        </div>
      </div>
    \`;

    banner.style.cssText = 'position:fixed;' + config.position + ':0;left:0;right:0;background:#fff;padding:20px;box-shadow:0 -2px 10px rgba(0,0,0,0.1);z-index:99999;font-family:system-ui,-apple-system,sans-serif;';
    document.body.appendChild(banner);
  }

  window.grConsent = {
    acceptAll: function() { setConsent(true, true, true); },
    acceptNecessary: function() { setConsent(false, false, false); },
    showSettings: function() {
      // TODO: Show detailed settings modal
      setConsent(true, false, false);
    },
    getConsent: getConsent,
    hasConsent: function() { return !!getConsent(); }
  };

  // Check if consent needed
  if (!getConsent()) {
    if (config.mode === 'EXPLICIT') {
      showBanner();
    } else if (config.mode === 'IMPLICIT') {
      // Implicit: track by default but show opt-out option
      setConsent(true, true, true);
    }
    // DISABLED mode: no consent needed
  }
})();
</script>`;

    return { success: true, data: script };
  } catch (error) {
    console.error("Error generating consent script:", error);
    return {
      success: false,
      error: locale === "fr" ? "Erreur serveur" : "Server error",
    };
  }
}
