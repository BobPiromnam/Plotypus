const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");
const style = fs.readFileSync(path.join(repoRoot, "style.css"), "utf8");
const app = fs.readFileSync(path.join(repoRoot, "app.js"), "utf8");

function ruleBody(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = style.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[1];
}

test("Properties splitter keeps its full hit target inside either dock edge", () => {
  const defaultHandle = ruleBody(".properties-resize-handle");
  const rightHandle = ruleBody('body[data-properties-side="right"] .properties-resize-handle');
  const defaultGuide = ruleBody(".properties-resize-handle::after");
  const rightGuide = ruleBody('body[data-properties-side="right"] .properties-resize-handle::after');

  assert.match(defaultHandle, /inset:\s*0 0 0 auto/);
  assert.match(defaultHandle, /width:\s*var\(--space-4\)/);
  assert.match(rightHandle, /inset:\s*0 auto 0 0/);
  assert.match(defaultGuide, /right:\s*0/);
  assert.match(defaultGuide, /left:\s*auto/);
  assert.match(rightGuide, /right:\s*auto/);
  assert.match(rightGuide, /left:\s*0/);
  assert.match(style, /body\[data-properties-side="left"\] \.properties-panel\s*\{[^}]*direction:\s*rtl/s);
  assert.match(style, /body\[data-properties-side="left"\] \.properties-panel > \*\s*\{[^}]*direction:\s*ltr/s);
});

test("pointer resize math mirrors correctly for left and right docks", () => {
  assert.match(app, /getPropertiesPanelSide\(\) === "left"\s*\? moveEvent\.clientX - startX\s*:\s*startX - moveEvent\.clientX/);
  assert.match(app, /setPropertiesPanelWidth\(startWidth \+ delta\)/);
});
