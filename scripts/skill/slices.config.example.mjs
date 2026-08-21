/**
 * slices.config.example.mjs — ANNOTATED EXAMPLE for scripts/extract-source.mjs.
 *
 *   node scripts/extract-source.mjs --slices scripts/slices.config.mjs
 *   node scripts/extract-source.mjs --slices scripts/slices.config.mjs --check
 *
 * >>> EVERY VALUE BELOW IS EXAMPLE DATA <<<
 * The line ranges, symbol names and sha256 are real entries from the
 * shopify.design rebuild (a beautified Vite bundle + three.js), kept because a
 * concrete slice table is far more legible than placeholders. They are
 * MEANINGLESS for any other site: copy this file next to your own project's
 * script, delete the slice/alias entries, and rebuild them from YOUR
 * `_pretty/` coordinate system. The sha256 guard will refuse to run until you
 * re-pin it anyway.
 *
 * Read references/porting-discipline.md §2.2 first — it defines the mandatory
 * trio this config carries (slice table / sha256 guard / symbol alias table),
 * how to decide whether a symbol is sliceable at all, and the rule that no
 * gate can catch: never add a keyword to make a slice parse.
 *
 * JSON works too (`--slices slices.config.json`, same keys) — this file is
 * .mjs so the slice table can carry comments, which is the whole point: the
 * table IS the §2.1 line-range provenance map in executable form.
 */
export default {
  // Paths resolve against this file's directory unless `root` says otherwise.
  // Point `root` at the project root when the config lives in scripts/.
  root: "..",

  // The beautified bundle to slice. NEVER slice the minified original: the
  // whole coordinate system is `_pretty/` line numbers (beautify-bundle.mjs
  // pins js-beautify@1.15.1 for exactly this reason).
  source: "mirror/_pretty/_index-c3dAurQC.js",

  // TRIO #2 — the sha256 guard. `shasum -a 256 <source>`. If the beautifier
  // version changes or the site is re-mirrored, this stops the script instead
  // of silently slicing the wrong lines.
  sha256: "9e505f52a573c4ed6f7c2c557702d50f3ad69531605624b704c0b166234c827d",

  // The generated file. It is an artifact: never hand-edit it, and it should be
  // obvious from its path that it is generated (_gen/, .gen.js, …).
  out: "src/engine/_gen/engine.gen.js",

  // How the generated header tells the next person to regenerate/verify.
  generator: "scripts/extract-source.mjs",

  // TRIO #3 — the symbol tables, emitted as imports at the top of the output.
  // Any number of groups; two are typical:
  imports: [
    {
      // (a) the alias table: minified identifiers re-bound to real library
      // exports. §2.2 requires EVERY line to record how it was resolved —
      // put that in the per-symbol `note` (class brand `isXxx` + the line
      // where the class is defined; for numeric enum constants beware of
      // SAME VALUE IN DIFFERENT GROUPS, e.g. blending 2 vs side 2).
      from: "../three-aliases.js",
      note: "minified three.js identifiers -> real three r182 exports",
      symbols: [
        { name: "zl", note: "Scene — isScene brand @ L11482" },
        { name: "t3", note: "WebGLRenderer — isWebGLRenderer-equivalent ctor @ L18904" },
        { name: "lm", note: "CustomBlending = 5 (BLENDING group, not the side group)" },
        "Ue", // a bare string is fine while the resolution note is still TODO
        "Cn",
      ],
    },
    {
      // (b) the pending stubs (§6.2): symbols of subsystems the current
      // vertical slice has NOT ported yet. They stay CALLED verbatim; the stub
      // file makes reaching one a loud, line-numbered failure.
      from: "../pending.js",
      note: "not-yet-ported subsystems -> loud stubs (porting-discipline.md §6.2)",
      symbols: ["CI", "nF", "oL"],
    },
  ],

  // Extra lines for the AUTO-GENERATED header block ("// " is prepended).
  // Use it to point at this project's own registers.
  header: [
    "Minified library identifiers are re-bound in ../three-aliases.js;",
    "not-yet-ported subsystems are bound to loud stubs in ../pending.js",
    "(registered as REBUILD_PLAN §6 D9).",
  ],

  // TRIO #1 — THE SLICE TABLE, in SOURCE ORDER. `to` is INCLUSIVE.
  //   from/to  1-based line numbers in `source`
  //   note     what the slice contains (goes into the generated file verbatim)
  //   symbols  what the rest of the rebuild may import from this slice; the
  //            union of all `symbols` becomes the generated export list
  //
  // Slice whole self-contained top-level declarations: pure functions, data
  // tables, GLSL, assembly order. Framework-layer effects and glue that must
  // be re-bound to imports get transcribed statement-by-statement in a
  // hand-written file instead (§2.2) — the two can live side by side.
  //
  // A symbol is sliceable only if its ENTIRE top-level declaration is: minifiers
  // weld unrelated things into one `const` comma chain, and cutting into the
  // middle yields an orphan that needs a keyword to parse. Do not add it.
  slices: [
    { from: 27, to: 29, note: "bx — double requestAnimationFrame helper", symbols: ["bx"] },
    { from: 2361, to: 2400, note: "Sy — scene config object (UB receives {...Sy})", symbols: ["Sy"] },
    {
      from: 22309,
      to: 22354,
      note: "camera/world constants + gf() FOV mapping",
      symbols: ["ac", "Pn", "Ir", "gf"],
    },
    // A slice with no `symbols` is still worth having: it carries dependencies
    // the exported ones need, and it keeps the generated file diffable.
    { from: 22637, to: 22647, note: "I1 — texture downscale to quality.texMaxSize", symbols: [] },
    {
      from: 22648,
      to: 22762,
      note: "QUALITY TIER: G3 table / z3 GPU name / ci() device / V3 live GPU benchmark / H3 grader (engine-notes Q12,Q17)",
      symbols: ["G3", "ci", "H3"],
    },
    {
      from: 43110,
      to: 43300,
      note: "Lb — the rAF loop (x progress / _ camera / y reveal / b post uniforms / T dots / w fog)",
      symbols: ["Lb"],
    },
  ],
};
