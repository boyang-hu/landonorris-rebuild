/**
 * crossside.config.example.mjs — target-specific half of verify-crossside.mjs.
 *
 * Copy to crossside.config.mjs and rewrite for the seam this target exposes.
 * The example below is the real one from an Apple product page, kept because
 * the SHAPE of it is the reusable part, not the expressions.
 *
 * How that seam was found: the bundle exposes no module registry, but grepping
 * the pretty-printed source for `window.<Name> =` turned up three assignments
 * made as module top-level side effects. One of them was the expression parser
 * that every keyframe's start/end is written in — so a single seam covers the
 * layer that decides WHEN everything happens (porting-discipline.md §0.3).
 */

export const name = "expression parser";

// ⭐ Condition-INDEPENDENT: the same input must produce the same number no
// matter how tall the page is. Pure arithmetic, viewport units, custom-property
// reads, and anchor combinations that cancel (`a0h`, `(a0b - a0t) * k`).
export const judged = [
  "0", "100", "-50", "12.5",
  "100vh", "50vh", "200vw",
  "a0h",
  "css(--probe-h)",
  "(a0b - a0t) * 0.5",
  "(a0b - a0t) - 100vh",
  "((a0b - a0t) * 0.25) + 50",
  "a0h - (0.35 * a0h)",
  "(a0h + 100vh) * 0.5",
];

// ⚠ Condition-DEPENDENT: page coordinates. The mirror is a 29,556px product
// page; the port side is a 1,080px probe page. These differ for a reason that
// has nothing to do with the port, so they are printed, not graded — but both
// sides must still resolve them, or "unsupported" hides inside "expected".
export const info = [
  "a0t", "a0b",
  "a0t + 100", "a0b - 100vh",
  "a0b - (100vh + (0.35 * css(--probe-h)))",
];

/**
 * build(cases) returns a JS expression string, evaluated in the page, whose
 * value is `{ out: { [case]: value } }`.
 *
 * ⛔ It must construct its OWN fixture rather than reusing whatever the page
 * happens to contain: the two sides are different pages, and a gate that reads
 * their existing DOM is comparing two documents, not one implementation against
 * another. Build identical scaffolding on both sides, measure, tear it down.
 *
 * ⛔ Per-case try/catch, not one around the loop — otherwise the first failing
 * case hides every case after it, and the gate reports a single error where it
 * should report a column of them.
 */
export function build(cases) {
  return `(()=>{
    const host = document.createElement("div");
    host.style.cssText = "position:relative;width:400px;height:3000px";
    host.style.setProperty("--probe-h", "600px");
    document.body.appendChild(host);
    const anchor = document.createElement("div");
    anchor.style.cssText = "position:absolute;top:500px;width:400px;height:800px";
    host.appendChild(anchor);

    const P = window.ExpressionParser;
    if (!P || !P.parse) { host.remove(); return { error: "seam absent: window.ExpressionParser" }; }

    const out = {};
    for (const c of ${JSON.stringify(cases)}) {
      try {
        const v = P.parse(c, { target: host, anchors: [anchor] });
        out[c] = typeof v === "number" ? v : (v && v.valueOf ? v.valueOf() : String(v));
      } catch (err) { out[c] = "ERR:" + String(err).slice(0, 60); }
    }
    host.remove();
    return { out };
  })()`;
}
