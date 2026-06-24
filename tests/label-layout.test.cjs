const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadFactory() {
  const source = fs.readFileSync(path.join(__dirname, "..", "label-layout.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "label-layout.js" });
  return context.window.PLOTYPUS_LABEL_LAYOUT;
}

function createPolicies() {
  return loadFactory().create({
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    clampLabelBaseline: (value, _label, min, max) => Math.max(min, Math.min(max, value)),
    comparePlacementOrder: (a, b) => a.y - b.y || a.x - b.x,
    createSlots: items => items.map((item, index) => ({ x: item.x + 20, y: item.y + index * 10 })),
    getBoundary: () => "canada",
    getCategory: () => ({ markerSize: 10 }),
    getCategoryMarkerSize: category => category.markerSize,
    getDesignerHorizontalOffset: () => 0,
    getDesignerLineOffset: () => 50,
    getDesignerVerticalOffset: () => 0,
    getLabelKey: label => label.rowId,
    labelBackgroundRect: label => ({ x0: label.labelX, y0: label.labelY - 12, x1: label.labelX + 50, y1: label.labelY, centerX: label.labelX + 25, centerY: label.labelY - 6 }),
    labelBaselineForCenter: center => center,
    labelFontSize: () => 12,
    labelKeyText: item => String(item.name || "").toLowerCase(),
    labelRect: label => ({ x0: label.labelX, y0: label.labelY - 12, x1: label.labelX + 50, y1: label.labelY, centerX: label.labelX + 25, centerY: label.labelY - 6 }),
    labelVisualHeight: label => label.textHeight || 12,
    lineEnd: label => ({ x: label.labelX, y: label.labelY }),
    makeLabelBox: item => ({ lines: [item.name], lineHeight: 12, textWidth: 50, textHeight: 12, footnote: "" }),
    mapBoundsRect: bounds => ({ ...bounds }),
    outsideRectArea: () => 0,
    preferredSide: () => "right",
    rectOverlapArea: () => 0,
    rectsOverlap: () => false,
    referenceSideOptions: () => [],
    segmentIntersectsRect: () => false,
    segmentsCross: () => false
  });
}

test("label layout factory validates and freezes its dependency boundary", () => {
  const factory = loadFactory();
  assert.equal(Object.isFrozen(factory), true);
  assert.throws(() => factory.create({}), /missing dependencies/);
  assert.equal(Object.isFrozen(createPolicies()), true);
  assert.equal(Object.isFrozen(factory.weights), true);
});

test("side-order policy keeps preferred and opposite positions deterministic", () => {
  const policies = createPolicies();
  assert.deepEqual(Array.from(policies.compatibleSideOrder("left")), ["left", "top", "bottom"]);
  assert.deepEqual(Array.from(policies.candidateSideOrder("left")), ["left", "top", "bottom", "right"]);
  assert.equal(policies.oppositeSide("top"), "bottom");
});

test("seeded layout randomization is reproducible", () => {
  const policies = createPolicies();
  const first = policies.makeSeededRandom(1234);
  const second = policies.makeSeededRandom(1234);
  assert.deepEqual([first(), first(), first()], [second(), second(), second()]);
  assert.equal(
    policies.layoutSeed([{ x: 10, y: 20, name: "Alpha" }], { width: 300, height: 200, mapScale: 100 }),
    policies.layoutSeed([{ x: 10, y: 20, name: "Alpha" }], { width: 300, height: 200, mapScale: 100 })
  );
});

test("side-order inversion and placement equality policies remain stable", () => {
  const policies = createPolicies();
  const labels = [
    { rowId: "a", x: 20, y: 20, labelX: 10, labelY: 80, labelSide: "left" },
    { rowId: "b", x: 20, y: 80, labelX: 10, labelY: 20, labelSide: "left" }
  ];
  assert.equal(policies.countSideOrderInversions(labels), 1);
  assert.equal(policies.sameLabelPlacement(labels[0], { ...labels[0], labelX: 10.05 }), true);
  assert.equal(policies.sameLabelPlacement(labels[0], { ...labels[0], labelX: 10.2 }), false);
});

test("candidate generation is deterministic and keeps perimeter slots", () => {
  const policies = createPolicies();
  const item = { rowId: "a", name: "Alpha", x: 100, y: 90 };
  const settings = { width: 300, height: 220, labelSize: 12 };
  const bounds = { x0: 80, y0: 60, x1: 220, y1: 160 };
  const perimeter = { side: "left", x: 50, y: 80, box: { lines: ["Alpha"], lineHeight: 12, textWidth: 50, textHeight: 12 } };
  const candidates = policies.createLabelCandidates(item, settings, bounds, [perimeter]);
  const repeated = policies.createLabelCandidates(item, settings, bounds, [perimeter]);

  assert.equal(candidates[0], perimeter);
  assert.ok(candidates.length > 4);
  assert.deepEqual(
    candidates.map(candidate => `${candidate.side}:${candidate.x}:${candidate.y}`),
    repeated.map(candidate => `${candidate.side}:${candidate.x}:${candidate.y}`)
  );
  assert.equal(policies.makeLabelPlacement(item, candidates[1]).labelSide, candidates[1].side);
});
