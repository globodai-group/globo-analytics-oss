(function (w, d, s, e, t) {
  var c = function () {
    var v = localStorage.getItem("gr_vid");
    if (!v) {
      v = "v_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem("gr_vid", v);
    }
    return v;
  };
  var i = function () {
    var s = sessionStorage.getItem("gr_sid");
    if (!s) {
      s = "s_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem("gr_sid", s);
    }
    return s;
  };
  var n = !sessionStorage.getItem("gr_sc");
  var f = function (y, a) {
    var p = Object.assign(
      {
        tid: t,
        cid: c(),
        sid: i(),
        t: y,
        dl: location.href,
        dp: location.pathname,
        dt: d.title,
        dr: d.referrer,
        sr: screen.width + "x" + screen.height,
        vp: innerWidth + "x" + innerHeight,
        ul: navigator.language,
        pl: "web",
      },
      a || {}
    );
    if (n) {
      p.sc = "start";
      sessionStorage.setItem("gr_sc", "1");
      n = false;
    }
    navigator.sendBeacon
      ? navigator.sendBeacon(e, JSON.stringify(p))
      : fetch(e, { method: "POST", body: JSON.stringify(p), keepalive: true });
  };
  f("pageview");
  var st = Date.now(),
    en = false;
  d.addEventListener("visibilitychange", function () {
    if (d.hidden && !en) {
      var dur = Math.round((Date.now() - st) / 1000);
      if (dur >= 10) {
        f("engagement", { et: dur });
        en = true;
      }
    }
  });
  w.addEventListener("beforeunload", function () {
    if (!en) {
      f("engagement", { et: Math.round((Date.now() - st) / 1000) });
    }
  });
  w.grTrack = function (ev, da) {
    f("event", Object.assign({ en: ev }, da || {}));
  };
})(window, document, "script", "%ENDPOINT%", "%TID%");
