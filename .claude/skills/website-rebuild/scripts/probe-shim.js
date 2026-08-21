// probe-shim.js — deterministic driver shim for A/B same-frame comparison.
// Adapted from storytellingnoomo-rebuild/scripts/probe-shim.js.
// Lineage: storytellingnoomo-rebuild (rAF pump, timer queue, visibility pin)
//   -> shopifydesign-rebuild (froze the rest of the entropy surface:
//      performance.now, Date.now, new Date, setInterval, seeded Math.random).
//
// Usage: inject into <head> of HTML responses at the SERVING layer (serve.mjs
// does this for requests carrying ?__probe) on BOTH the mirror and the rebuild,
// then from a CDP probe call window.__pump(dt, frames) to advance both sides by
// identical dt sequences and screenshot the same frame. Directly reusable for
// any scroll- or time-driven animation site, including sites whose source
// bundle is minified and cannot be instrumented from inside.
//
// Verification instrumentation only: when the page is opened with ?__probe,
// replace requestAnimationFrame with a manually pumped queue and pin the
// visibility API to "visible/focused", so BOTH the mirror (source bundle) and
// the rebuild can be driven deterministically in a background tab. Timestamps
// start at 0 so time-driven shader phases line up across tabs pumped with
// identical dt sequences. Not part of source behavior; injected at the serving
// layer (mirror) / a pre plugin (rebuild).
//
// EVERY clock and entropy source must be taken over, not just rAF. Freezing rAF
// and setTimeout while performance.now(), Date.now(), new Date(), setInterval
// and Math.random() keep running live does not make the page deterministic —
// it only hides which parts are still free-running. Field case: transitions
// interpolating on (performance.now() - start), a track picked by
// Math.floor(Date.now() / 18e4 % n), scatter positions from Math.random(), and
// a countdown on setInterval left two consecutive dumps of the SAME mirror
// disagreeing on 7 numeric fields. With all of them pinned, __pump's time is
// the only clock in the page and A/B comparison is frame-exact.
(function () {
  if (typeof location === "undefined" || !location.search.includes("__probe")) return;

  // --- clock + entropy freeze (must be installed before any page script) ---
  var EPOCH = 1767225600000; // 2026-01-01T00:00:00Z, fixed so Date.now() is stable
  var __t = 0; // advanced by __pump; the single source of time
  var nativePerfNow =
    window.performance && performance.now
      ? performance.now.bind(performance)
      : function () { return 0; };
  window.__nativePerfNow = nativePerfNow; // escape hatch for the harness itself
  try {
    performance.now = function () { return __t; };
  } catch (e) {}
  var NativeDate = Date;
  try {
    Date.now = function () { return EPOCH + __t; };
    // new Date() with no args must agree with Date.now(); every other form is
    // passed straight through so date math and parsing keep working.
    var PinnedDate = function (a, b, c, d, e2, f, g) {
      if (!(this instanceof PinnedDate)) return new NativeDate(EPOCH + __t).toString();
      switch (arguments.length) {
        case 0: return new NativeDate(EPOCH + __t);
        case 1: return new NativeDate(a);
        case 2: return new NativeDate(a, b);
        case 3: return new NativeDate(a, b, c);
        case 4: return new NativeDate(a, b, c, d);
        case 5: return new NativeDate(a, b, c, d, e2);
        case 6: return new NativeDate(a, b, c, d, e2, f);
        default: return new NativeDate(a, b, c, d, e2, f, g);
      }
    };
    PinnedDate.prototype = NativeDate.prototype;
    PinnedDate.now = function () { return EPOCH + __t; };
    PinnedDate.parse = NativeDate.parse;
    PinnedDate.UTC = NativeDate.UTC;
    window.Date = PinnedDate;
  } catch (e) {}
  // mulberry32 — same seed, same sequence, on both sides. Reseed per state with
  // window.__reseed(n) when a walk needs each step to start from a known point.
  var __seed = 0x9e3779b9;
  window.__reseed = function (s) { __seed = (s >>> 0) || 0x9e3779b9; };
  try {
    Math.random = function () {
      __seed = (__seed + 0x6d2b79f5) >>> 0;
      var t = __seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  } catch (e) {}

  try {
    Object.defineProperty(Document.prototype, "hidden", { get: () => false, configurable: true });
    Object.defineProperty(Document.prototype, "visibilityState", {
      get: () => "visible",
      configurable: true,
    });
  } catch (e) {}
  document.hasFocus = () => true;
  var queue = [];
  var nextId = 1;
  var now = 0;
  window.__rafQueue = queue;
  // Background tabs throttle setTimeout to ~1/min; route timers through a
  // pump-driven queue keyed to the real clock so engine sleeps fire promptly.
  var timers = [];
  var timerId = 1000000;
  var intervals = [];
  var nativeSetTimeout = window.setTimeout.bind(window);
  var nativeClearTimeout = window.clearTimeout.bind(window);
  window.__nativeSetTimeout = nativeSetTimeout;
  window.setTimeout = function (cb, delay) {
    if (typeof cb !== "function") return nativeSetTimeout(cb, delay);
    var args = Array.prototype.slice.call(arguments, 2);
    var id = timerId++;
    timers.push({ id: id, cb: cb, due: __t + (delay || 0), args: args });
    return id;
  };
  // setInterval must ride the same clock, otherwise it fires on the real clock
  // while everything else is frozen (countdowns and pollers use one).
  var nativeSetInterval = window.setInterval.bind(window);
  var nativeClearInterval = window.clearInterval.bind(window);
  window.setInterval = function (cb, delay) {
    if (typeof cb !== "function") return nativeSetInterval(cb, delay);
    var args = Array.prototype.slice.call(arguments, 2);
    var id = timerId++;
    intervals.push({ id: id, cb: cb, every: delay || 0, next: __t + (delay || 0), args: args });
    return id;
  };
  window.clearInterval = function (id) {
    for (var i = 0; i < intervals.length; i++)
      if (intervals[i].id === id) {
        intervals.splice(i, 1);
        return;
      }
    nativeClearInterval(id);
  };
  window.clearTimeout = function (id) {
    for (var i = 0; i < timers.length; i++)
      if (timers[i].id === id) {
        timers.splice(i, 1);
        return;
      }
    nativeClearTimeout(id);
  };
  var runDueTimers = function () {
    for (var i = 0; i < timers.length; i++) {
      if (timers[i].due <= __t) {
        var t = timers.splice(i, 1)[0];
        i--;
        try {
          t.cb.apply(null, t.args);
        } catch (e) {
          console.error("[__pump timer]", e);
        }
      }
    }
    for (var j = 0; j < intervals.length; j++) {
      var iv = intervals[j];
      // Bounded catch-up: a large dt must not spin an interval thousands of
      // times; cap at 64 firings per pumped frame and resync.
      var fired = 0;
      while (iv.next <= __t && fired < 64) {
        iv.next += iv.every || 1;
        fired++;
        try {
          iv.cb.apply(null, iv.args);
        } catch (e) {
          console.error("[__pump interval]", e);
        }
      }
      if (iv.next <= __t) iv.next = __t + (iv.every || 1);
    }
  };
  window.requestAnimationFrame = function (cb) {
    var id = nextId++;
    queue.push({ id: id, cb: cb });
    return id;
  };
  window.cancelAnimationFrame = function (id) {
    for (var i = 0; i < queue.length; i++)
      if (queue[i].id === id) {
        queue.splice(i, 1);
        return;
      }
  };
  // --- IntersectionObserver -------------------------------------------------
  // ⛔ IO is a CLOCK THIS SHIM DOES NOT OWN, and on a scroll-reveal site it is
  // the one that matters. The browser delivers intersection records on its own
  // schedule, off the main thread's frame loop, so two captures of the same
  // frozen page can start their entrance animations at different pump counts —
  // and the residual that produces MOVES between runs, which is exactly what
  // makes it unclassifiable.
  //
  // Measured on a CSS/IO-driven target: the same side compared with itself
  // drifted 0.2–0.31 meanAbsDiff and no amount of settling converged it.
  //
  // ⭐ So take it over: record every observer, and deliver its records ON THE
  // PUMP, synchronously, in registration order. Both sides then see the same
  // callbacks at the same virtual frame.
  //
  // ⚠ This changes WHEN callbacks fire, not WHETHER they do — and it is
  // verification instrumentation, active only under ?__probe. A page that never
  // pumps still gets its records, because the first pump delivers the backlog.
  var NativeIO = window.IntersectionObserver;
  var observers = [];
  if (NativeIO) {
    window.IntersectionObserver = function (cb, opts) {
      var targets = [];
      var self = this;
      var rec = { cb: cb, opts: opts || {}, targets: targets, seen: new Map() };
      observers.push(rec);
      this.observe = function (el) { if (targets.indexOf(el) < 0) targets.push(el); };
      this.unobserve = function (el) { var i = targets.indexOf(el); if (i >= 0) targets.splice(i, 1); };
      this.disconnect = function () { targets.length = 0; };
      this.takeRecords = function () { return []; };
      this.root = (opts && opts.root) || null;
      this.rootMargin = (opts && opts.rootMargin) || "0px 0px 0px 0px";
      this.thresholds = [].concat((opts && opts.threshold) || 0);
      void self;
    };
    window.IntersectionObserver.prototype = {};
  }

  // Compute intersection against the viewport the way the real IO would, and
  // deliver only on CHANGE — an observer that fires every frame is a different
  // observer, and would keep re-triggering one-shot reveals.
  function deliverIntersections() {
    for (var o = 0; o < observers.length; o++) {
      var rec = observers[o];
      var entries = [];
      for (var t = 0; t < rec.targets.length; t++) {
        var el = rec.targets[t];
        var r;
        try { r = el.getBoundingClientRect(); } catch (e) { continue; }
        var vh = window.innerHeight, vw = window.innerWidth;
        var iw = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
        var ih = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
        var area = r.width * r.height;
        var ratio = area > 0 ? (iw * ih) / area : 0;
        var isIn = ratio > 0;
        var prev = rec.seen.get(el);
        if (prev !== undefined && prev === isIn) continue;
        rec.seen.set(el, isIn);
        entries.push({
          target: el,
          isIntersecting: isIn,
          intersectionRatio: ratio,
          boundingClientRect: r,
          intersectionRect: r,
          rootBounds: { top: 0, left: 0, right: vw, bottom: vh, width: vw, height: vh },
          time: now,
        });
      }
      if (entries.length) {
        try { rec.cb(entries, { takeRecords: function () { return []; } }); }
        catch (e) { console.error("[__pump/io]", e); }
      }
    }
  }

  window.__pump = function (dt, frames) {
    dt = dt || 16.7;
    frames = frames || 1;
    for (var f = 0; f < frames; f++) {
      now += dt;
      __t = now; // keep the frozen clocks in lockstep with the rAF timestamp
      runDueTimers();
      // ⚠ Before the frame's callbacks, so a reveal triggered this frame is
      // animating within it — the order the browser would produce.
      deliverIntersections();
      var batch = queue.splice(0, queue.length);
      for (var i = 0; i < batch.length; i++) {
        try {
          batch[i].cb(now);
        } catch (e) {
          console.error("[__pump]", e);
        }
      }
    }
    return now;
  };
  window.__pumpTime = function () {
    return now;
  };
})();
