"use strict";

const fs = require("node:fs");
const path = require("node:path");

const [reportArgument, budgetsArgument] = process.argv.slice(2);
if (!reportArgument || !budgetsArgument) {
  throw new Error("Usage: node tests/validate-performance-report.cjs <smoke-report.json> <budgets.json>");
}

const report = JSON.parse(fs.readFileSync(path.resolve(reportArgument), "utf8"));
const ceilings = JSON.parse(fs.readFileSync(path.resolve(budgetsArgument), "utf8"));
const performance = report.performance || {};
const samples = Array.isArray(performance.samples) ? performance.samples : [];
const failures = [];

function maximumFor(kind) {
  const totals = samples
    .filter(sample => sample.kind === kind && Number.isFinite(Number(sample.totalMs)))
    .map(sample => Number(sample.totalMs));
  return totals.length ? Math.max(...totals) : null;
}

function enforce(label, actual, limit) {
  if (!Number.isFinite(actual)) {
    failures.push(`${label} was not recorded.`);
    return;
  }
  if (actual > limit) failures.push(`${label} ${actual.toFixed(1)} ms exceeded the Windows CI ceiling of ${limit} ms.`);
}

const measurements = {
  runnerElapsedMs: Number(report.runner?.elapsedMs),
  renderMs: maximumFor("render"),
  autoPlaceMs: maximumFor("autoPlace"),
  exportMs: maximumFor("export")
};

for (const [name, actual] of Object.entries(measurements)) enforce(name, actual, Number(ceilings[name]));

for (const sample of samples.filter(sample => sample.overBudget)) {
  process.stdout.write(`::warning title=Plotypus product performance budget::${sample.kind} took ${Number(sample.totalMs).toFixed(1)} ms; product target ${sample.budgetMs} ms.\n`);
}

if (failures.length) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Windows regression ceilings passed: ${Object.entries(measurements).map(([name, value]) => `${name}=${Number(value).toFixed(1)}ms`).join(", ")}\n`);
}
