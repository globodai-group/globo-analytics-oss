/**
 * GloboAnalytics Tracker v5
 * Usage: <script async src="/js/tracker.js" data-tid="YOUR_TRACKING_ID"></script>
 * With HMAC: <script async src="/js/tracker.js" data-tid="YOUR_TRACKING_ID" data-sk="YOUR_SECRET_KEY"></script>
 *
 * API:
 * - gr('event', 'event_name', {params})     - Track custom event
 * - gr('ecommerce', 'view_item', {item})    - E-commerce: view product
 * - gr('ecommerce', 'add_to_cart', {item})  - E-commerce: add to cart
 * - gr('ecommerce', 'remove_from_cart', {item}) - E-commerce: remove from cart
 * - gr('ecommerce', 'begin_checkout', {items, value}) - E-commerce: begin checkout
 * - gr('ecommerce', 'purchase', {transaction_id, value, items}) - E-commerce: purchase
 * - gr('set', 'user_id', 'xxx')             - Set user ID for cross-device tracking
 * - gr.video('start', {video_id, title, duration}) - Video: start playback
 * - gr.video('progress', {video_id, progress})     - Video: progress milestone
 * - gr.video('complete', {video_id})               - Video: completed
 *
 * Auto-tracked:
 * - Pageviews
 * - Engagement time
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Time on page
 */
(function (w, d) {
  var s = d.currentScript,
    t = s && s.dataset.tid,
    sk = s && s.dataset.sk, // HMAC secret key for anti-spoofing
    // Use the script's origin as endpoint (where the script is hosted)
    // This matches Google Analytics behavior: script from google.com sends to google.com
    e =
      (s && s.dataset.endpoint) ||
      (s && s.src
        ? new URL(s.src).origin + "/api/v2/collect"
        : location.origin + "/api/v2/collect");
  if (!t) return console.warn("GloboAnalytics: Missing data-tid attribute");

  // HMAC-SHA256 signing using Web Crypto API
  var signPayload = async function (payload, secret) {
    if (!secret || !w.crypto || !w.crypto.subtle) return null;
    try {
      var enc = new TextEncoder();
      var key = await w.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      var sig = await w.crypto.subtle.sign("HMAC", key, enc.encode(payload));
      return Array.from(new Uint8Array(sig))
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    } catch (e) {
      return null;
    }
  };

  // Visitor & Session IDs
  var getVid = function () {
    var v = localStorage.getItem("gr_vid");
    if (!v) {
      v = "v_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem("gr_vid", v);
    }
    return v;
  };
  var getSid = function () {
    var x = sessionStorage.getItem("gr_sid");
    if (!x) {
      x = "s_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem("gr_sid", x);
    }
    return x;
  };
  var newSession = !sessionStorage.getItem("gr_sc");
  var userId = localStorage.getItem("gr_uid") || null;
  var isAuthenticated = sessionStorage.getItem("gr_auth") === "true";

  // Send data with optional HMAC signature
  var send = function (type, data) {
    var ts = Date.now();
    var cid = getVid();
    var p = Object.assign(
      {
        tid: t,
        cid: cid,
        sid: getSid(),
        t: type,
        dl: location.href,
        dp: location.pathname,
        dt: d.title,
        dr: d.referrer,
        sr: screen.width + "x" + screen.height,
        vp: innerWidth + "x" + innerHeight,
        ul: navigator.language,
        pl: "web",
        ts: ts, // timestamp for replay protection
      },
      data || {}
    );
    if (userId) p.uid = userId;
    if (isAuthenticated) p.auth = true;
    if (newSession) {
      p.sc = "start";
      sessionStorage.setItem("gr_sc", "1");
      newSession = false;
    }

    // Sign payload if secret key is provided
    var doSend = function (payload) {
      navigator.sendBeacon
        ? navigator.sendBeacon(e, JSON.stringify(payload))
        : fetch(e, { method: "POST", body: JSON.stringify(payload), keepalive: true });
    };

    if (sk) {
      // Create canonical payload for signing: tid|cid|t|dp|ts
      var canonical = [t, cid, type, p.dp || "", ts].join("|");
      signPayload(canonical, sk).then(function (sig) {
        if (sig) p.sig = sig;
        doSend(p);
      });
    } else {
      doSend(p);
    }
  };

  // E-commerce item normalizer
  var normalizeItem = function (item) {
    return {
      item_id: item.item_id || item.id || item.sku,
      item_name: item.item_name || item.name,
      item_brand: item.item_brand || item.brand,
      item_category: item.item_category || item.category,
      item_variant: item.item_variant || item.variant,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      discount: parseFloat(item.discount) || 0,
      coupon: item.coupon,
    };
  };

  // Main API function
  var gr = function (cmd, action, params) {
    params = params || {};

    if (cmd === "event") {
      send("event", { en: action, ep: params });
    } else if (cmd === "ecommerce") {
      var edata = { en: action, ec: "ecommerce" };

      switch (action) {
        case "view_item_list":
          edata.items = (params.items || []).map(normalizeItem);
          edata.item_list_id = params.item_list_id;
          edata.item_list_name = params.item_list_name;
          break;
        case "view_item":
          edata.items = [normalizeItem(params)];
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.price) || 0;
          break;
        case "select_item":
          edata.items = [normalizeItem(params)];
          edata.item_list_id = params.item_list_id;
          edata.item_list_name = params.item_list_name;
          break;
        case "add_to_cart":
        case "remove_from_cart":
          edata.items = [normalizeItem(params)];
          edata.currency = params.currency || "EUR";
          edata.value = (parseFloat(params.price) || 0) * (parseInt(params.quantity) || 1);
          break;
        case "view_cart":
          edata.items = (params.items || []).map(normalizeItem);
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || 0;
          break;
        case "begin_checkout":
          edata.items = (params.items || []).map(normalizeItem);
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || 0;
          edata.coupon = params.coupon;
          break;
        case "add_shipping_info":
          edata.items = (params.items || []).map(normalizeItem);
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || 0;
          edata.shipping_tier = params.shipping_tier;
          break;
        case "add_payment_info":
          edata.items = (params.items || []).map(normalizeItem);
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || 0;
          edata.payment_type = params.payment_type;
          break;
        case "purchase":
          edata.transaction_id = params.transaction_id || params.order_id;
          edata.items = (params.items || []).map(normalizeItem);
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || parseFloat(params.total) || 0;
          edata.tax = parseFloat(params.tax) || 0;
          edata.shipping = parseFloat(params.shipping) || 0;
          edata.coupon = params.coupon;
          edata.affiliation = params.affiliation;
          break;
        case "refund":
          edata.transaction_id = params.transaction_id || params.order_id;
          edata.items = params.items ? (params.items || []).map(normalizeItem) : undefined;
          edata.currency = params.currency || "EUR";
          edata.value = parseFloat(params.value) || 0;
          break;
      }
      send("ecommerce", edata);
    } else if (cmd === "set") {
      if (action === "user_id") {
        userId = params;
        if (params) localStorage.setItem("gr_uid", params);
        else localStorage.removeItem("gr_uid");
      } else if (action === "authenticated") {
        // Mark user as authenticated (definitely human)
        // Call this after user logs in: gr('set', 'authenticated', true)
        isAuthenticated = !!params;
        if (params) {
          sessionStorage.setItem("gr_auth", "true");
          // Send an authentication event for tracking
          send("event", { en: "login", ec: "auth", ea: "login" });
        } else {
          sessionStorage.removeItem("gr_auth");
        }
      }
    } else if (cmd === "config") {
      // Future config options
    }
  };

  // Auto pageview
  send("pageview");

  // Engagement tracking
  var st = Date.now(),
    en = false;
  d.addEventListener("visibilitychange", function () {
    if (d.hidden && !en) {
      var dur = Math.round((Date.now() - st) / 1000);
      if (dur >= 10) {
        send("engagement", { et: dur });
        en = true;
      }
    }
  });
  w.addEventListener("beforeunload", function () {
    if (!en) {
      send("engagement", { et: Math.round((Date.now() - st) / 1000) });
    }
  });

  // Scroll depth tracking
  var scrollDepths = [25, 50, 75, 100],
    scrollTracked = {};
  var trackScroll = function () {
    var scrollTop = w.pageYOffset || d.documentElement.scrollTop;
    var docHeight = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight) - w.innerHeight;
    if (docHeight <= 0) return;
    var depth = Math.min(100, Math.round((scrollTop / docHeight) * 100));
    scrollDepths.forEach(function (threshold) {
      if (depth >= threshold && !scrollTracked[threshold]) {
        scrollTracked[threshold] = true;
        send("scroll", { sd: threshold, pg: location.pathname });
      }
    });
  };
  var scrollTimer;
  w.addEventListener("scroll", function () {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(trackScroll, 150);
  });
  setTimeout(trackScroll, 1000);

  // Time on page tracking
  var pageStartTime = Date.now();
  var sendTimeOnPage = function () {
    var timeSpent = Math.round((Date.now() - pageStartTime) / 1000);
    if (timeSpent > 0) {
      send("time_on_page", { top: timeSpent, pg: location.pathname });
    }
  };
  d.addEventListener("visibilitychange", function () {
    if (d.hidden) {
      sendTimeOnPage();
    }
  });

  // Real-time tracking ping (like Google Analytics)
  // Send ping every 5 seconds to maintain active user count
  var pingInterval = null;
  var startPing = function () {
    if (pingInterval) return; // Already running
    pingInterval = setInterval(function () {
      if (!d.hidden) {
        send("ping", { dt: d.title, dp: location.pathname });
      }
    }, 5000); // 5 seconds like GA
  };
  var stopPing = function () {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  };

  // Start pinging after 5 seconds on page
  setTimeout(startPing, 5000);

  // Stop/resume pinging based on visibility
  d.addEventListener("visibilitychange", function () {
    if (d.hidden) {
      stopPing();
    } else {
      startPing();
    }
  });

  // Stop pinging on unload
  w.addEventListener("beforeunload", stopPing);

  // Video tracking API
  gr.video = function (action, params) {
    params = params || {};
    send("video", {
      en: "video_" + action,
      video_id: params.video_id || params.id,
      video_title: params.video_title || params.title,
      video_duration: params.video_duration || params.duration,
      progress: params.progress || params.percent,
    });
  };

  // Expose API
  w.gr = gr;
  w.grTrack = function (ev, da) {
    gr("event", ev, da);
  }; // Legacy support
})(window, document);
