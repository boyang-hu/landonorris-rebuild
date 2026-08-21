#!/usr/bin/env node
/**
 * pixel-walk.mjs — run the pixel gate at N scroll checkpoints, not one.
 *
 * ⛔ A single 0.00 is the most misleading number this toolchain produces. It is
 * one frame, usually the top of the page in the first couple of seconds, on a
 * document that may be tens of thousands of pixels tall — and §4.8 of
 * verification-gates.md exists because a whole suite once photographed one
 * state and reported the site correct.
 *
 * This drives both sides to the same scroll fraction before capturing, and
 * repeats. It is a thin loop over pixelcompare.mjs on purpose: the comparison,
 * the determinism shim, the non-empty-frame precondition and the
 * distinct-sides guard all stay in one place.
 *
 * ⚠ Establish the SELF-BAND at these same checkpoints first (--self on one
 * side). A cross-side number is only meaningful against the band: measured on
 * one target, the unfrozen self-band was 4.6-5.0 while the unfrozen cross-side
 * was 2.6-3.4 — the "difference" was entirely the page's own session noise, and
 * both numbers were useless until the shim brought the band to 0.00.
 *
 *   node scripts/pixel-walk.mjs --a <rebuild-url> --b <mirror-url> [--steps 9]
 *                               [--pump 16.7,120] [--max-mean 1.0] [--self]
 */
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf("--" + n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };
const A = flag("a", null), B = flag("b", null);
const STEPS = Number(flag("steps", "9"));
const PUMP = flag("pump", "16.7,120");
const OUT = flag("out", "docs/pixelcompare");
const MAX_MEAN = flag("max-mean", null);
const SELF = args.includes("--self");
const FMT = flag("format", "jpeg"), Q = flag("quality", "92");
if (!A || !B) { console.error("usage: pixel-walk.mjs --a <rebuild-url> --b <mirror-url> [--steps N] [--pump dt,frames] [--max-mean N] [--self]"); process.exit(2); }
if (STEPS < 2) { console.error("FATAL — --steps must be >= 2. One checkpoint is the problem this tool exists to fix."); process.exit(2); }

// ⛔ Scroll at load, before the pump budget is spent, so the engine sees the
// position for the whole frame sequence rather than jumping at the end.
const seedFor = (f) =>
  `window.addEventListener("load", () => { const m = document.documentElement.scrollHeight - innerHeight; window.scrollTo(0, Math.round(m * ${f})); });`;

const run = (a) =>
  new Promise((res) => {
    const p = spawn("node", [path.join(path.dirname(new URL(import.meta.url).pathname), "pixelcompare.mjs"), ...a], { stdio: ["ignore", "pipe", "pipe"] });
    let o = "";
    p.stdout.on("data", (d) => (o += d));
    p.stderr.on("data", (d) => (o += d));
    p.on("close", (code) => res({ code, out: o }));
  });

console.log(`=== pixel-walk — ${STEPS} checkpoint(s)${SELF ? " (SELF-BAND SAMPLE, not a verdict)" : ""} ===`);
console.log(`  A ${A}\n  B ${B}\n`);
console.log(`  ${"checkpoint".padEnd(12)} ${"colours".padStart(8)} ${"meanAbsDiff".padStart(12)} ${"worstCell".padStart(10)}  similarity`);

const rows = [];
let fail = 0;
for (let i = 0; i < STEPS; i++) {
  const f = i / (STEPS - 1);
  const name = `walk-${String(Math.round(f * 100)).padStart(3, "0")}`;
  const a = ["--a", A, "--b", B, "--name", name, "--pump", PUMP, "--seed", seedFor(f), "--out", OUT, "--format", FMT, "--quality", Q];
  if (SELF) a.push("--self");
  const { code, out } = await run(a);
  const m = out.match(/\{"meanAbsDiff":[^}]+\}/);
  const census = out.match(/REBUILD: (\d+) colours/);
  if (!m) {
    fail++;
    rows.push({ name, error: (out.match(/FATAL[^\n]*/) || ["no metric line"])[0] });
    console.log(`  ${name.padEnd(12)} ${"-".padStart(8)} ${"FAIL".padStart(12)}  ${(out.match(/FATAL[^\n]*/) || ["no metric"])[0].slice(0, 60)}`);
    continue;
  }
  const j = JSON.parse(m[0]);
  const colours = census ? Number(census[1]) : null;
  rows.push({ name, f, colours, ...j, code });
  const bad = MAX_MEAN !== null && !SELF && j.meanAbsDiff > Number(MAX_MEAN);
  if (bad) fail++;
  console.log(`  ${name.padEnd(12)} ${String(colours ?? "?").padStart(8)} ${String(j.meanAbsDiff).padStart(12)} ${String(j.worstCellDiff).padStart(10)}  ${j.similarityPct}%${bad ? "   <- over --max-mean" : ""}`);
}

// ⛔ Checkpoints that all photograph the same frame are one checkpoint repeated.
// The colour census is the cheapest evidence that the page actually moved.
const distinct = new Set(rows.filter((r) => r.colours != null).map((r) => r.colours));
console.log("");
// ⛔ Zero counts as "did not move" too. Guarding only on `=== 1` let a run where
// every checkpoint FAILED print "the walk moved the page" underneath a column of
// failures — a reassuring sentence in the middle of a total failure.
if (distinct.size === 0) {
  console.log(`FATAL — no checkpoint produced a frame at all. Nothing below is a measurement.`);
  process.exit(5);
}
if (distinct.size === 1 && rows.length > 1) {
  console.log(`FATAL — every checkpoint captured a frame with the same colour count (${[...distinct][0]}).`);
  console.log(`        The scroll driving did not move the page, so this is one checkpoint run ${rows.length} times.`);
  process.exit(5);
}
console.log(`  ${distinct.size} distinct frame(s) across ${rows.length} checkpoint(s) — the walk moved the page.`);

const means = rows.filter((r) => r.meanAbsDiff != null).map((r) => r.meanAbsDiff);
if (means.length) {
  const worst = Math.max(...means);
  console.log(`  worst meanAbsDiff ${worst}${SELF ? "  (this is the BAND; cross-side results must be read against it)" : ""}`);
}
if (SELF) {
  console.log(`\n⚠ SELF-BAND SAMPLE — not a pass. Collect several per side and interleave them;`);
  console.log(`  a band from one side lets that side's luck set the tolerance.`);
  process.exit(0);
}
console.log(fail ? `\nFAIL — ${fail} checkpoint(s) failed.` : `\nPASS — ${rows.length} checkpoint(s)${MAX_MEAN !== null ? ` within --max-mean ${MAX_MEAN}` : ""}.`);
process.exit(fail ? 1 : 0);
