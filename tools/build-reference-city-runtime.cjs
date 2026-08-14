"use strict";

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");
const sourcePath = path.join(repoRoot, "src", "lib", "city-search.js");
const runtimePath = path.join(repoRoot, "src", "lib", "city-search-runtime.js");
const citiesJsonPath = path.join(repoRoot, "data", "cities.json");
const citiesRuntimePath = path.join(repoRoot, "data", "cities.js");

function expectedSearchRuntime() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const implementation = source
    .split("/* ------------------------------------------------------------------ tests */")[0]
    .replace(/\bexport\s+(?=const\s|function\s)/g, "")
    .trim();
  return `/* Generated from src/lib/city-search.js. Do not edit by hand. */\n(function (global) {\n  "use strict";\n\n${implementation}\n\n  global.PLOTYPUS_CITY_SEARCH = Object.freeze({\n    ALIASES,\n    norm,\n    canon,\n    indexCity,\n    indexDataset,\n    matches,\n    resolveList\n  });\n})(window);\n`;
}

function expectedCitiesRuntime() {
  const cities = JSON.parse(fs.readFileSync(citiesJsonPath, "utf8"));
  return `/* Generated from data/cities.json. Do not edit by hand. */\nwindow.PLOTYPUS_CITIES = ${JSON.stringify(cities, null, 2)};\n`;
}

const expectedFiles = new Map([
  [runtimePath, expectedSearchRuntime()],
  [citiesRuntimePath, expectedCitiesRuntime()]
]);
const checkOnly = process.argv.includes("--check");
let failed = false;

for (const [filePath, expected] of expectedFiles) {
  if (checkOnly) {
    const actual = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
    if (actual !== expected) {
      process.stderr.write(`${path.relative(repoRoot, filePath)} is stale. Run node tools/build-reference-city-runtime.cjs.\n`);
      failed = true;
    }
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, expected, "utf8");
    process.stdout.write(`Generated ${path.relative(repoRoot, filePath)}.\n`);
  }
}

if (failed) process.exitCode = 1;
