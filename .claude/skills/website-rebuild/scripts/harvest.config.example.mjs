/**
 * harvest.config.mjs — where this target keeps its engine, and what is worth
 * recording from it.
 *
 * The mirror exposes no module registry, but the engine stashes a back
 * reference on every scroll-group element: `el._animInfo` holds
 * {isGroup, group, controller, controllers, tweenProps}. That is the seam.
 * ⭐ It was found by listing own properties of a group element — worth doing
 * before concluding a subsystem has no seam, which is what I had concluded.
 */

export const name = "keyframes via el._animInfo";

// ⛔ Drive with real scroll, not by writing progress. The engine reads
// `pageMetrics.scrollY`, and only its own scroll handler writes that — setting
// a progress value directly tests a path the page never takes.
export function states(steps) {
  const out = [];
  for (let i = 0; i < steps; i++) {
    const f = i / (steps - 1);
    out.push({ label: `scroll ${(f * 100).toFixed(0)}%`, js: `window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * ${f}))` });
  }
  return out;
}

// ⚠ RESOLVED numbers only. `start`/`end` here are what the expression parser
// computed, not the expression text — so the port can be fed the same numbers
// without re-deriving them, and a parser difference shows up as its own gate
// (verify-crossside) rather than contaminating this one.
// ⛔ Do not identify an easing curve by its name. On this bundle every
// `easeFunction.name` is the empty string — they are anonymous function
// expressions — and a gate that grouped by name would put 342 samples into one
// bucket called "". Naming is also how the earlier hand-written suite failed:
// it set a field it believed named the curve, and every case ran the same one.
//
// ⭐ Identify a curve by EVALUATING it. Sampled at fixed points, the values ARE
// the curve's identity, they are condition-independent, and the port has to
// reproduce them without either side agreeing on a name.
const CURVE_TS = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];

export function collect() {
  return `(()=>{
    const CURVE_TS = ${JSON.stringify([0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1])};
    const fingerprint = (fn) => {
      if (typeof fn !== "function") return null;
      try { return CURVE_TS.map(t => { const v = fn(t); return typeof v === "number" && isFinite(v) ? +v.toFixed(9) : null; }); }
      catch (e) { return "ERR:" + String(e).slice(0, 40); }
    };
    // ⛔ Do not enumerate by the declarative attribute. [data-anim-scroll-group]
    // NAMES the concept, but it is not the index: the engine marks every
    // participating element with an _animInfo expando, groups and items alike.
    // Querying by the attribute reached 17 elements and 38 keyframes on ONE
    // curve; walking the expando reaches 254 elements and 798 keyframes on
    // THREE. The attribute version passed every check it had — including a
    // "did anything move" guard — while missing 95% of the subject.
    const marked = [...document.querySelectorAll("*")].filter(e => e._animInfo);
    const rows = [];
    for (const el of marked) {
      const gi = el._animInfo, g = gi.group;
      if (!g) continue;
      const ctrls = [].concat(gi.controllers || [], gi.controller ? [gi.controller] : []);
      const kfs = [];
      for (const c of ctrls) {
        for (const k of (c._allKeyframes || c.keyframes || [])) {
          kfs.push({
            owner: c.friendlyName || null,
            start: k.start, end: k.end,
            ease: k.ease,
            curve: fingerprint(k.easeFunction),
            localT: k.localT, curvedT: k.curvedT,
            values: Object.keys(k.animValues || {}),
            hidden: !!k.hidden, enabled: !!k.isEnabled,
          });
        }
      }
      if (kfs.length === 0) continue;
      rows.push({
        group: g.name, isGroup: !!gi.isGroup,
        el: el.tagName + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0,2).join(".") : ""),
        local: g.position ? g.position.local : null,
        unclamped: g.position ? g.position.localUnclamped : null,
        boundsMin: g.boundsMin, boundsMax: g.boundsMax,
        keyframes: kfs,
      });
    }
    return { scrollY: Math.round(window.scrollY), groups: rows };
  })()`;
}

export function summarize(s) {
  const kfs = (s.groups || []).flatMap((g) => g.keyframes);
  void 0;
  const curves = new Set(kfs.map((k) => JSON.stringify(k.curve)).filter((c) => c && c !== "null"));
  const live = kfs.filter((k) => k.localT > 0 && k.localT < 1).length;
  return `scrollY=${String(s.scrollY).padStart(6)}  ${s.groups.length} groups, ${kfs.length} kf, ${curves.size} distinct curve(s), ${live} kf mid-flight`;
}

// --- the B side --------------------------------------------------------------
// ⭐ The source's easing functions are anonymous, so they can only be compared
// by behaviour. Matching fingerprints also RECOVERS THE NAMES: the port's module
// exports its curves under readable keys, so a match tells you which named curve
// the page was actually running — something the page itself cannot tell you.

export function harvestedIdentities(baseline) {
  const seen = new Map();
  for (const st of baseline.states || []) {
    for (const g of st.groups || []) {
      for (const k of g.keyframes || []) {
        if (!Array.isArray(k.curve)) continue;
        const key = JSON.stringify(k.curve);
        if (!seen.has(key)) seen.set(key, { fp: k.curve, n: 0, where: `${g.group} / ${g.el}` });
        seen.get(key).n++;
      }
    }
  }
  const out = {};
  let i = 0;
  for (const { fp, n } of [...seen.values()].sort((a, b) => b.n - a.n)) out[`curve#${++i} (${n} uses)`] = fp;
  return out;
}

export function portIdentities() {
  return `JSON.stringify((()=>{
    const TS = ${JSON.stringify([0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1])};
    const m = window.__req("d96e6e5c9ee0a7b049a0");   // the port's easing module
    const identities = {};
    for (const k of Object.keys(m)) {
      if (typeof m[k] !== "function") continue;
      try { identities[k] = TS.map(t => { const v = m[k](t); return typeof v === "number" && isFinite(v) ? +v.toFixed(9) : null; }); }
      catch (e) { /* a curve that throws is not an identity */ }
    }
    return { identities };
  })())`;
}
