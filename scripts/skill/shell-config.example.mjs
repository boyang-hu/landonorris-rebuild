/**
 * shell-config.example.mjs — ANNOTATED EXAMPLE for the strategy-A build layer.
 *
 *   node scripts/build-site.mjs   --config scripts/shell-config.mjs
 *   node scripts/verify-shell.mjs --config scripts/shell-config.mjs
 *
 * >>> EVERY VALUE BELOW IS EXAMPLE DATA <<< Copy this file to
 * scripts/shell-config.mjs, delete the entries, and rebuild them from YOUR
 * mirror. Read references/dom-shell-strategies.md §2 first — it defines what a
 * registered transform is and why the table has to be short.
 *
 * ⛔ THIS FILE MUST HAVE NO SIDE EFFECTS, AND THAT IS A GATE-SAFETY PROPERTY,
 * NOT A STYLE PREFERENCE. build-site.mjs (which produces site/) and
 * verify-shell.mjs (which audits site/) both import it. If the shared data
 * lived in build-site.mjs instead, importing it from the gate would RUN THE
 * BUILD, and the gate would audit output it had just written — measured on two
 * projects: inject a byte into a built shell, run the gate, it reports PASS and
 * the byte is gone afterwards (verification-gates.md §2.1.2).
 */
export default {
  /** Documents to build, relative to the mirror root. */
  pages: [
    { rel: "index.html", route: "/" },
    { rel: "about/index.html", route: "/about" },
  ],

  /**
   * Extra files copied into site/ verbatim, e.g. the generated port output from
   * scripts/extract-source.mjs. `from` is a project path, `to` is under site/.
   */
  extras: [{ from: "src/_gen/app.gen.js", to: "assets/js/app.js" }],

  /** Hosts that ARE this site: absolute/protocol-relative URLs -> root-relative. */
  originHosts: ["example.com", "www.example.com"],

  /**
   * Hosts rewritten to /ext/<host>/ and then answered with a stub by serve.mjs.
   * ⛔ MUST match the --stub-ext-hosts the MIRROR is served with: the mirror is
   * the oracle, and two different host lists make the two sides differ for a
   * reason that has nothing to do with the port.
   */
  stubExtHosts: ["www.googletagmanager.com", "connect.facebook.net"],

  /** Mirrored external hosts (served from <mirror>/assets/<host>/). */
  mirroredExtHosts: ["fonts.googleapis.com", "fonts.gstatic.com"],

  /**
   * The unofficial-rebuild notice + noindex, injected right after <head>.
   * legal-and-deploy.md requires BOTH, and requires a gate to watch them —
   * that is what the T-NOINDEX floor below is for.
   */
  notice:
    "<!--\n" +
    "  UNOFFICIAL STUDY REBUILD — not the real <site>. Generated from a private\n" +
    "  forensic mirror for the sole purpose of studying its implementation.\n" +
    "  Not affiliated with or endorsed by <owner>. All artwork, copy, fonts and\n" +
    "  trade dress belong to their owners. Private, noindex, never deployed.\n" +
    "-->\n",

  /**
   * Per-transform hit floors. ⛔ PER TRANSFORM, never a total: one
   * high-frequency transform (url localisation fires thousands of times) would
   * otherwise hold the guard green while a 4-hit noindex injection silently
   * stopped firing (dom-shell-strategies.md §2 step 3).
   *
   * ⭐ AND THE FLOOR IS NOT THE GUARANTEE. It says the transform still has a
   * target; it says nothing about whether the transform achieved its purpose.
   * Measured: an identifier-stripping transform fired 25x, cleared its floor,
   * and the token it exists to remove was still in every built shell under a
   * second spelling. For remove/replace transforms, add a `purpose` check below.
   */
  floors: { "T-LOCALIZE": 100, "T-NOINDEX": 2, "T-SCRIPT": 2 },

  /**
   * Site-specific transforms beyond the built-in T-LOCALIZE / T-NOINDEX.
   * Each gets an id, a REBUILD_PLAN §6 deviation number, and is applied to one
   * document (or one diff hunk — verify-shell replays these on hunks, so they
   * must be anchored on self-contained literals, never on file position).
   */
  transforms: [
    {
      id: "T-SCRIPT",
      dev: "D-B2",
      what: "the site's own bundle -> our generated build",
      apply: (html, { bump }) =>
        html.replace(
          /(<script\b[^>]*\bsrc=")([^"]*\/app\.[a-f0-9]+\.js)(")/gi,
          (m, pre, src, post) => (bump(), `${pre}/assets/js/app.js${post}`),
        ),
      // ONLY THE src VALUE CHANGES. Rebuilding the tag drops async/defer, and
      // loading semantics are not decoration: a measured case turned three
      // non-blocking scripts into parser-blocking ones and changed a canvas
      // bitmap's size (dom-shell-strategies.md).
    },
  ],

  /**
   * Optional purpose assertions: {name, values(mirrorHtml) -> string[]}.
   * After the build, none of the returned strings may appear in the BUILT
   * bytes. Values are read out of the mirror at build time rather than
   * hard-coded, so a live token never enters a tracked file and the check
   * self-updates when the origin rotates one.
   */
  purposeChecks: [],
};
