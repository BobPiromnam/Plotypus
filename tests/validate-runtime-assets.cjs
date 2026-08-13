"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const visited = new Set();
const missing = [];
const remoteRuntimeAssets = [];

function normalizeReference(reference) {
  return String(reference || "").trim().replace(/[?#].*$/, "");
}

function isSkippable(reference) {
  return !reference
    || reference.startsWith("#")
    || /^(?:data|blob|mailto|tel|javascript):/i.test(reference);
}

function recordReference(reference, ownerPath) {
  const normalized = normalizeReference(reference);
  if (isSkippable(normalized)) return;
  if (/^https?:\/\//i.test(normalized)) {
    remoteRuntimeAssets.push({ owner: path.relative(repoRoot, ownerPath), reference: normalized });
    return;
  }

  const resolved = path.resolve(path.dirname(ownerPath), normalized.replace(/^\//, ""));
  if (!resolved.toLowerCase().startsWith(repoRoot.toLowerCase() + path.sep)) {
    missing.push({ owner: path.relative(repoRoot, ownerPath), reference: normalized, reason: "outside repository" });
    return;
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    missing.push({ owner: path.relative(repoRoot, ownerPath), reference: normalized, reason: "missing" });
    return;
  }
  visit(resolved);
}

function visit(filePath) {
  const resolved = path.resolve(filePath);
  if (visited.has(resolved)) return;
  visited.add(resolved);
  const extension = path.extname(resolved).toLowerCase();
  const source = fs.readFileSync(resolved, "utf8");

  if (extension === ".html") {
    for (const match of source.matchAll(/<(?:script|img)\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi)) {
      recordReference(match[1], resolved);
    }
    for (const match of source.matchAll(/<link\b[^>]*?\bhref=["']([^"']+)["'][^>]*>/gi)) {
      recordReference(match[1], resolved);
    }
  }

  if (extension === ".css") {
    for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      recordReference(match[1], resolved);
    }
    for (const match of source.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/gi)) {
      recordReference(match[1], resolved);
    }
  }
}

visit(path.join(repoRoot, "index.html"));

const errors = [
  ...missing.map(item => `${item.owner}: ${item.reference} (${item.reason})`),
  ...remoteRuntimeAssets.map(item => `${item.owner}: remote runtime asset ${item.reference}`)
];

if (errors.length) {
  process.stderr.write(`Runtime asset validation failed:\n${errors.map(error => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Runtime asset validation passed (${visited.size} local files, no remote runtime dependencies).\n`);
}
