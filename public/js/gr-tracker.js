/**
 * GloboRank Analytics Tracking Script v3.1
 * Project-based analytics with proper Users/Sessions distinction
 *
 * Features:
 * - Unique Users tracking (persistent across sessions)
 * - Session tracking (30-minute timeout)
 * - Multi-domain support per project
 * - Mobile SDK compatible API
 * - Google Analytics-like metrics
 * - Real-time active users tracking
 * - Engagement time tracking
 */
!(function (window, document) {
  "use strict";

  // Get script element
  var script = document.currentScript || document.getElementById("gr-tracker");
  if (!script) return;

  // Configuration
  var config = {
    trackingId:
      script.getAttribute("data-tid") || script.getAttribute("data-id"),
    host: script.getAttribute("data-host") || "",
    dnt: script.getAttribute("data-dnt") === "true",
    debug: script.getAttribute("data-debug") === "true",
  };

  if (!config.trackingId) {
    console.error("[GloboRank] Missing tracking ID. Add data-tid attribute.");
    return;
  }

  // Respect Do Not Track
  if (config.dnt && navigator.doNotTrack === "1") {
    return;
  }

  // Constants
  var SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  var HEARTBEAT_INTERVAL = 15000; // 15 seconds heartbeat for session activity
  var PING_INTERVAL = 30000; // 30 seconds ping for real-time tracking
  var ENGAGEMENT_INTERVAL = 1000; // 1 second for engagement time tracking
  var STORAGE_PREFIX = "_gr_";
  var API_ENDPOINT = config.host + "/api/v2/collect";

  // Storage keys
  var KEYS = {
    CLIENT_ID: STORAGE_PREFIX + "cid", // Persistent visitor ID
    SESSION_ID: STORAGE_PREFIX + "sid", // Current session ID
    SESSION_START: STORAGE_PREFIX + "ss", // Session start timestamp
    LAST_ACTIVITY: STORAGE_PREFIX + "la", // Last activity timestamp
    PAGE_START: STORAGE_PREFIX + "ps", // Current page start time
  };

  // State
  var clientId = null;
  var sessionId = null;
  var isNewSession = false;
  var pageStartTime = Date.now();
  var maxScrollDepth = 0;
  var scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
  var heartbeatTimer = null;
  var pingTimer = null;
  var engagementTimer = null;
  var currentPath = getPath();

  // Engagement time tracking (like GA4)
  var engagementTime = 0;
  var isEngaged = false;
  var lastEngagementCheck = Date.now();

  /**
   * Debug logger
   */
  function log() {
    if (config.debug) {
      console.log.apply(
        console,
        ["[GloboRank]"].concat(Array.prototype.slice.call(arguments)),
      );
    }
  }

  /**
   * Generate a unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generate persistent client ID (privacy-friendly hash)
   */
  function generateClientId() {
    var components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ];

    var str = components.join("|");
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return "gr" + Math.abs(hash).toString(36) + generateId().substr(0, 6);
  }

  /**
   * Get current path
   */
  function getPath() {
    return window.location.pathname + window.location.search;
  }

  /**
   * Get or create client ID (persistent across sessions)
   */
  function getOrCreateClientId() {
    try {
      clientId = localStorage.getItem(KEYS.CLIENT_ID);
      if (!clientId) {
        clientId = generateClientId();
        localStorage.setItem(KEYS.CLIENT_ID, clientId);
        log("New client ID created:", clientId);
      }
    } catch (e) {
      clientId = generateClientId();
    }
    return clientId;
  }

  /**
   * Get or create session
   */
  function getOrCreateSession() {
    try {
      var storedSessionId = sessionStorage.getItem(KEYS.SESSION_ID);
      var lastActivity = parseInt(
        sessionStorage.getItem(KEYS.LAST_ACTIVITY) || "0",
        10,
      );
      var now = Date.now();

      if (storedSessionId && now - lastActivity < SESSION_TIMEOUT) {
        sessionId = storedSessionId;
        isNewSession = false;
        log("Existing session:", sessionId);
      } else {
        sessionId = generateId();
        sessionStorage.setItem(KEYS.SESSION_ID, sessionId);
        sessionStorage.setItem(KEYS.SESSION_START, now.toString());
        isNewSession = true;
        log("New session created:", sessionId);
      }

      sessionStorage.setItem(KEYS.LAST_ACTIVITY, now.toString());
    } catch (e) {
      sessionId = generateId();
      isNewSession = true;
    }

    return sessionId;
  }

  /**
   * Parse UTM parameters
   */
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      cs: params.get("utm_source") || undefined,
      cm: params.get("utm_medium") || undefined,
      cn: params.get("utm_campaign") || undefined,
      cc: params.get("utm_content") || undefined,
      ck: params.get("utm_term") || undefined,
    };
  }

  /**
   * Calculate scroll depth
   */
  function getScrollDepth() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
    );
    var winHeight = window.innerHeight;

    if (docHeight <= winHeight) return 100;

    var scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
    return Math.min(100, Math.max(0, scrollPercent));
  }

  /**
   * Send data to server
   */
  function send(data, useBeacon) {
    var payload = Object.assign(
      {
        tid: config.trackingId,
        cid: clientId,
        sid: sessionId,
      },
      data,
    );

    // Clean undefined values
    Object.keys(payload).forEach(function (key) {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    var jsonPayload = JSON.stringify(payload);
    log("Sending:", payload);

    if (useBeacon && navigator.sendBeacon) {
      var blob = new Blob([jsonPayload], { type: "application/json" });
      navigator.sendBeacon(API_ENDPOINT, blob);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", API_ENDPOINT, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(jsonPayload);
    }
  }

  /**
   * Track pageview
   */
  function trackPageview(customPath) {
    getOrCreateClientId();
    getOrCreateSession();

    var utm = isNewSession ? getUtmParams() : {};

    var data = {
      t: "pageview",
      dp: customPath || getPath(),
      dt: document.title,
      dl: window.location.href,
      dr: document.referrer || undefined,
      sr: screen.width + "x" + screen.height,
      vp: window.innerWidth + "x" + window.innerHeight,
      sd: screen.colorDepth + "-bit",
    };

    // Add session control for new sessions
    if (isNewSession) {
      data.sc = "start";
    }

    // Add UTM params
    Object.assign(data, utm);

    send(data);

    // Reset page-level tracking
    pageStartTime = Date.now();
    maxScrollDepth = 0;
    scrollMilestones = { 25: false, 50: false, 75: false, 100: false };
    currentPath = customPath || getPath();

    startHeartbeat();
  }

  /**
   * Track custom event
   */
  function trackEvent(category, action, label, value) {
    if (!category || !action) {
      console.warn("[GloboRank] Event requires category and action");
      return;
    }

    send({
      t: "event",
      ec: category,
      ea: action,
      el: label || undefined,
      ev: value !== undefined ? parseInt(value, 10) : undefined,
      dp: currentPath,
    });
  }

  /**
   * Track engagement (time on page, scroll depth, engagement time)
   */
  function trackEngagement(isExit) {
    var timeOnPage = Math.round((Date.now() - pageStartTime) / 1000);

    send(
      {
        t: "engagement",
        dp: currentPath,
        dt: document.title,
        top: timeOnPage,
        scd: maxScrollDepth,
        et: engagementTime, // Engagement time in ms (like GA4)
        ni: true, // Non-interaction
      },
      isExit,
    );

    if (isExit) {
      send(
        {
          t: "session_end",
          dp: currentPath,
        },
        true,
      );
    }
  }

  /**
   * Send ping for real-time tracking
   */
  function sendPing() {
    send({
      t: "ping",
      dp: currentPath,
      dt: document.title,
      et: engagementTime, // Include engagement time
    });
    log("Ping sent for real-time tracking");
  }

  /**
   * Track engagement time (like GA4)
   * Only counts time when user is actively engaged (tab visible, interacting)
   */
  function trackEngagementTime() {
    var now = Date.now();
    if (isEngaged && document.visibilityState === "visible") {
      engagementTime += now - lastEngagementCheck;
    }
    lastEngagementCheck = now;
  }

  /**
   * Handle user activity (for engagement tracking)
   */
  function handleActivity() {
    isEngaged = true;
    try {
      sessionStorage.setItem(KEYS.LAST_ACTIVITY, Date.now().toString());
    } catch (e) {}
  }

  /**
   * Debounced activity handler
   */
  var activityTimeout = null;
  function debouncedActivity() {
    handleActivity();
    if (activityTimeout) clearTimeout(activityTimeout);
    // Mark as not engaged after 5 seconds of no activity
    activityTimeout = setTimeout(function () {
      isEngaged = false;
    }, 5000);
  }

  /**
   * Handle visibility change
   */
  function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      // User left the tab - track engagement
      trackEngagementTime();
      isEngaged = false;
    } else {
      // User came back
      lastEngagementCheck = Date.now();
      isEngaged = true;
    }
  }

  /**
   * Heartbeat for activity tracking
   */
  function startHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(function () {
      try {
        sessionStorage.setItem(KEYS.LAST_ACTIVITY, Date.now().toString());
      } catch (e) {}
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Start real-time ping
   */
  function startPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
    }

    // Send initial ping
    sendPing();

    // Then ping every 30 seconds
    pingTimer = setInterval(sendPing, PING_INTERVAL);
  }

  /**
   * Start engagement time tracking
   */
  function startEngagementTracking() {
    if (engagementTimer) {
      clearInterval(engagementTimer);
    }

    isEngaged = true;
    lastEngagementCheck = Date.now();

    engagementTimer = setInterval(trackEngagementTime, ENGAGEMENT_INTERVAL);
  }

  /**
   * Handle scroll events
   */
  function handleScroll() {
    var depth = getScrollDepth();

    if (depth > maxScrollDepth) {
      maxScrollDepth = depth;
    }
  }

  /**
   * Throttled scroll handler
   */
  var scrollTimeout = null;
  function throttledScroll() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function () {
      scrollTimeout = null;
      handleScroll();
    }, 100);
  }

  /**
   * Handle page unload
   */
  function handleUnload() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (pingTimer) clearInterval(pingTimer);
    if (engagementTimer) clearInterval(engagementTimer);
    trackEngagement(true);
  }

  /**
   * Initialize
   */
  function init() {
    log("Initializing with tracking ID:", config.trackingId);

    // Track initial pageview
    trackPageview();

    // Scroll tracking
    window.addEventListener("scroll", throttledScroll, { passive: true });

    // Engagement tracking (user activity)
    window.addEventListener("mousemove", debouncedActivity, { passive: true });
    window.addEventListener("keydown", debouncedActivity, { passive: true });
    window.addEventListener("click", debouncedActivity, { passive: true });
    window.addEventListener("touchstart", debouncedActivity, { passive: true });

    // Visibility change (tab switching)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Exit tracking
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    // Start engagement time tracking
    startEngagementTracking();

    // Start real-time ping
    startPing();

    // SPA navigation support
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    history.pushState = function () {
      trackEngagement(false); // Not exit, just navigation
      originalPushState.apply(history, arguments);
      setTimeout(function () {
        // Reset engagement time for new page
        engagementTime = 0;
        lastEngagementCheck = Date.now();
        trackPageview();
      }, 0);
    };

    history.replaceState = function () {
      trackEngagement(false);
      originalReplaceState.apply(history, arguments);
      setTimeout(function () {
        engagementTime = 0;
        lastEngagementCheck = Date.now();
        trackPageview();
      }, 0);
    };

    window.addEventListener("popstate", function () {
      trackEngagement(false);
      engagementTime = 0;
      lastEngagementCheck = Date.now();
      trackPageview();
    });
  }

  // Public API
  window.gr = {
    // Track custom event: gr.event('Category', 'Action', 'Label', Value)
    event: function (category, action, label, value) {
      trackEvent(category, action, label, value);
    },

    // Track pageview: gr.pageview('/custom/path')
    pageview: function (path) {
      trackPageview(path);
    },

    // Get client ID
    getClientId: function () {
      return clientId;
    },

    // Get session ID
    getSessionId: function () {
      return sessionId;
    },

    // Set user ID (for logged-in users)
    setUserId: function (userId) {
      // TODO: Implement user ID tracking
      log("User ID set:", userId);
    },

    // Debug mode
    debug: function (enable) {
      config.debug = enable !== false;
    },
  };

  // Legacy API compatibility
  window.pa = window.gr;

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
