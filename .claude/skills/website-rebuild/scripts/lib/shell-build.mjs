// shell-build.mjs — the strategy-A transform engine, shared by the builder and
// the gate so there is exactly one implementation of "what the table does".
//
// verification-gates.md §2.1.1: any logic two places must agree on gets ONE
// implementation. build-site.mjs applies the table to a document; verify-shell
// replays it on a diff hunk. Two copies would drift, and a gate that drifts
// from its builder reports differences that are its own.
//
// ⛔ NO SIDE EFFECTS IN THIS FILE OR IN A PROJECT'S shell-config.mjs. The gate
// imports both, and a gate must never import a module that produces what it
// audits (§2.1.2).

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ⚠ URL LOCALISATION EXISTS TWICE IN THIS TOOLCHAIN, and that is a known debt
// (verification-gates.md §2.1.1 — two places that must agree on one answer
// should have one implementation): scripts/serve.mjs rewrites at RESPONSE time,
// this table rewrites at BUILD time. They have already drifted once — serve
// learned the \u002F escaped spelling from a Nuxt SSG payload while this side
// still knew two shapes — so the shapes are kept in one exported list here and
// serve.mjs's rewrite() is the one to fold into it next.
//
// Shape 6 (\u002F): serialised SSG payloads escape "/" so the blob can never
// contain "</script>". Measured: 11 media-host URLs survived every other shape
// inside window.__NUXT__, and the runtime zero-outbound probe caught exactly
// one of them — the only one that page happened to request.
const U = "\\u002F";
const U_RE = "\\\\u002F";

/**
 * The six spellings a host can wear. `to` is what replaces `<scheme><host>`.
 * Counting happens in the callbacks, so the floor means "this transform found N
 * targets" no matter which shapes fired — a difference-based count cannot work
 * here, because localising an EXTERNAL host leaves the host string in place
 * (`https://cdn.x` -> `/ext/cdn.x`).
 */
export function localizeShapes(text, host, to, onHit = () => {}) {
  const h = esc(host);
  const toEsc = to.replace(/\//g, "\\/");   // inside JS/JSON string literals
  const toU = to.replace(/\//g, U);         // inside \u002F-escaped payloads
  const hit = (shape, rep) => (m) => (onHit(shape), rep);
  // ⚠ `to || "/"` when NO path follows. Replacing `https://host` with "" for an
  // origin host leaves `href=""`, which is not "the home page" — it is "this
  // page", a silently broken link. Caught cross-side by the payload gate: the
  // mirror kept `href="http://www.chungiyoo.com"` (serve.mjs only rewrites the
  // trailing-slash form) while the build produced `href=""`, so the two
  // localisation implementations disagreed AND one of them was wrong.
  const bare = to || "/";
  return text
    .replace(new RegExp(`https?://${h}(?=/)`, "g"), hit("absolute", to))
    .replace(new RegExp(`https?://${h}(?!/)`, "g"), hit("absolute-bare", bare))
    .replace(new RegExp(`https?:\\\\/\\\\/${h}`, "g"), hit("escaped-absolute", toEsc))
    .replace(new RegExp(`https?:${U_RE}${U_RE}${h}(?=${U_RE})`, "gi"), hit("unicode-absolute", toU))
    .replace(new RegExp(`https?:${U_RE}${U_RE}${h}(?!${U_RE})`, "gi"), hit("unicode-absolute-bare", toU || U))
    .replace(new RegExp(`(?<!:)\\\\/\\\\/${h}`, "g"), hit("escaped-protocol-relative", toEsc))
    .replace(new RegExp(`(?<!:)${U_RE}${U_RE}${h}`, "gi"), hit("unicode-protocol-relative", toU))
    .replace(new RegExp(`(?<!:)//${h}`, "g"), hit("protocol-relative", to));
}

/** The bytes T-NOINDEX inserts. Exported because verify-shell sees that hunk as
 *  a PURE INSERTION — the mirror side of it is empty, and replaying a transform
 *  over an empty string can never reproduce it, so the gate matches these bytes
 *  exactly instead. */
export const noindexBlock = (cfg) =>
  (cfg.notice || "") + '<meta name="robots" content="noindex,nofollow">\n';

/**
 * Apply the configured table to one document (or one diff hunk).
 * Pure: every counter is returned, none is module state.
 *   returns { text, hits: Map<id, n>, sub: Map<ruleId, n> }
 *
 * `head` is false when the caller is classifying a fragment rather than
 * building a page, so a hunk is never "explained" by a transform it did not use.
 */
export function transformPage(html, cfg, { head = true } = {}) {
  const hits = new Map();
  const sub = new Map();
  const bump = (id, n = 1) => hits.set(id, (hits.get(id) || 0) + n);
  const bumpSub = (k, n = 1) => sub.set(k, (sub.get(k) || 0) + n);
  let out = html;

  // --- T-LOCALIZE ------------------------------------------------------------
  // Six spellings, all of them measured on real targets. The escaped and
  // \u002F forms live inside serialised payloads, which is where a missed
  // shape hurts most: nothing requests those URLs until the page happens to,
  // so a load-time probe reports zero outbound while ten latent ones sit in the
  // blob.
  for (const host of cfg.originHosts || []) {
    out = localizeShapes(out, host, "", (shape) => {
      bump("T-LOCALIZE");
      bumpSub(`origin.${shape}:${host}`);
    });
  }
  for (const host of [...(cfg.stubExtHosts || []), ...(cfg.mirroredExtHosts || [])]) {
    out = localizeShapes(out, host, `/ext/${host}`, (shape) => {
      bump("T-LOCALIZE");
      bumpSub(`ext.${shape}:${host}`);
    });
  }

  // --- site-specific transforms ---------------------------------------------
  for (const t of cfg.transforms || []) {
    out = t.apply(out, {
      bump: (n = 1) => bump(t.id, n),
      sub: (k, n = 1) => bumpSub(`${t.id}:${k}`, n),
    });
  }

  // --- T-NOINDEX -------------------------------------------------------------
  if (head && cfg.notice) {
    const before = out;
    // ⚠ `<head\b[^>]*>`, not the literal `<head>`. Generators emit the tag with
    // whitespace or attributes — Nuxt 2 / vue-meta writes `<head >`, others
    // write `<head prefix="og: …">` — and an anchor on the bare literal fires
    // ZERO times on those documents. The whole tag is preserved and the block
    // goes after it, so the tag's own attributes are never touched.
    // Measured: on a Nuxt SSG target this injected nothing at all, and what
    // caught it was the per-transform floor (0 < 10) — which is the floor
    // earning its keep on the one transform legal-and-deploy.md requires a gate
    // to watch (noindex + the unofficial-rebuild notice).
    out = out.replace(/<head\b[^>]*>/i, (tag) => tag + "\n" + noindexBlock(cfg));
    if (out !== before) bump("T-NOINDEX");
  }

  return { text: out, hits, sub };
}

/** Every transform id the table can produce, builder and gate agreeing. */
export const transformIds = (cfg) => [
  "T-LOCALIZE",
  ...(cfg.transforms || []).map((t) => t.id),
  ...(cfg.notice ? ["T-NOINDEX"] : []),
];
