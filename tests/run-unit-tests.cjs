"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const testsDirectory = __dirname;
const testFiles = fs.readdirSync(testsDirectory, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".test.cjs"))
  .map(entry => path.join(testsDirectory, entry.name))
  .sort((left, right) => left.localeCompare(right));

if (!testFiles.length) {
  throw new Error(`No root test files were found in ${testsDirectory}.`);
}

process.stdout.write(`Discovered ${testFiles.length} unit test files.\n`);
const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  cwd: path.join(testsDirectory, ".."),
  stdio: "inherit"
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
