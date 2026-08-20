const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");

function directRenderCallOwners(source) {
  let owner = "";
  const calls = [];
  source.split(/\r?\n/).forEach((line, index) => {
    const declaration = line.match(/^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/);
    if (declaration) owner = declaration[1];
    if (/\brender\s*\(/.test(line) && !/function\s+render\s*\(/.test(line)) {
      calls.push({ line: index + 1, owner, source: line.trim() });
    }
  });
  return calls;
}

test("interaction handlers route full map work through the render scheduler", () => {
  const calls = directRenderCallOwners(appSource);
  assert.deepEqual(
    Array.from(new Set(calls.map(call => call.owner))),
    ["scheduleRender", "cloneSvgForExport", "init"],
    `Unexpected direct render call:\n${calls.map(call => `${call.line}: ${call.owner}: ${call.source}`).join("\n")}`
  );
  assert.equal(calls.filter(call => call.owner === "scheduleRender").length, 1);
  assert.equal(calls.filter(call => call.owner === "cloneSvgForExport").length, 2);
  assert.equal(calls.filter(call => call.owner === "init").length, 1);
});

test("scheduled rendering waits for paint and idle time and remains cancellable", () => {
  assert.match(appSource, /requestAnimationFrame\(queueWhenBrowserIsIdle\)/);
  assert.match(appSource, /requestIdleCallback\(runScheduledRender, \{ timeout: 120 \}\)/);
  assert.match(appSource, /cancelIdleCallback\(pendingRenderIdleCallback\)/);
  assert.match(appSource, /deferPendingScheduledRender\(\)/);
});
