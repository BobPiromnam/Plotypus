const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadGeometry() {
  const source = fs.readFileSync(path.join(__dirname, "..", "geometry.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "geometry.js" });
  return context.window.PLOTYPUS_GEOMETRY;
}

test("geometry module exports a frozen public API", () => {
  const geometry = loadGeometry();
  assert.ok(geometry);
  assert.equal(Object.isFrozen(geometry), true);
  assert.deepEqual(
    Object.keys(geometry).sort(),
    [
      "inflateRect",
      "outsideRectArea",
      "pointInRect",
      "rectArea",
      "rectCenter",
      "rectFromPosition",
      "rectOverlapArea",
      "rectsOverlap",
      "segmentIntersectsRect",
      "segmentsCross"
    ]
  );
});

test("rectangle helpers preserve Plotypus edge and area semantics", () => {
  const geometry = loadGeometry();
  const source = { x0: 10, y0: 20, x1: 30, y1: 50 };
  const touching = { x0: 30, y0: 25, x1: 40, y1: 35 };

  assert.deepEqual({ ...geometry.rectCenter(source) }, { x: 20, y: 35 });
  assert.deepEqual({ ...geometry.inflateRect(source, 5) }, { x0: 5, y0: 15, x1: 35, y1: 55 });
  assert.equal(geometry.rectArea(source), 600);
  assert.equal(geometry.rectsOverlap(source, touching), true);
  assert.equal(geometry.rectOverlapArea(source, touching), 0);
  assert.equal(geometry.outsideRectArea(source, { x0: 15, y0: 25, x1: 25, y1: 45 }), 400);
});

test("segment helpers detect crossings and rectangle intersections", () => {
  const geometry = loadGeometry();
  const rect = { x0: 4, y0: 4, x1: 6, y1: 6 };

  assert.equal(geometry.segmentsCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 }), true);
  assert.equal(geometry.segmentIntersectsRect({ x: 0, y: 5 }, { x: 10, y: 5 }, rect), true);
  assert.equal(geometry.segmentIntersectsRect({ x: 0, y: 20 }, { x: 10, y: 20 }, rect), false);
});
