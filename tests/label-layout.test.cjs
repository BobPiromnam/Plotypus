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

function createPolicies(overrides = {}) {
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
    segmentsCross: () => false,
    ...overrides
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

test("one-label score delta matches a complete layout rescore", () => {
  const overlapArea = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0))
    * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const toRect = label => ({
    x0: label.labelX,
    y0: label.labelY - 12,
    x1: label.labelX + 50,
    y1: label.labelY,
    centerX: label.labelX + 25,
    centerY: label.labelY - 6
  });
  const policies = createPolicies({
    labelBackgroundRect: toRect,
    labelRect: toRect,
    rectOverlapArea: overlapArea,
    segmentsCross: () => true
  });
  const settings = { width: 300, height: 220, labelSize: 12, mapScale: 100, layoutObstacles: [] };
  const bounds = { x0: 80, y0: 60, x1: 220, y1: 160 };
  const placed = [
    { rowId: "a", name: "Alpha", x: 90, y: 80, labelX: 22, labelY: 72, labelSide: "left" },
    { rowId: "b", name: "Beta", x: 120, y: 95, labelX: 42, labelY: 66, labelSide: "left" },
    { rowId: "c", name: "Gamma", x: 180, y: 120, labelX: 224, labelY: 126, labelSide: "right" }
  ];
  const replacement = { ...placed[1], labelX: 226, labelY: 96, labelSide: "right" };
  const baseline = policies.scoreLayout(placed, settings, bounds, placed);
  const incremental = policies.scoreLayoutReplacement(placed, 1, replacement, settings, bounds, placed, baseline);
  const trial = placed.slice();
  trial[1] = replacement;
  const complete = policies.scoreLayout(trial, settings, bounds, placed);

  assert.ok(Math.abs(incremental - complete) < 1e-6, `${incremental} !== ${complete}`);
});

function geometryPolicies() {
  const toRect = label => ({
    x0: label.labelX,
    y0: label.labelY - 12,
    x1: label.labelX + 50,
    y1: label.labelY,
    centerX: label.labelX + 25,
    centerY: label.labelY - 6
  });
  const pointInRect = (point, rect) => point.x >= rect.x0 && point.x <= rect.x1
    && point.y >= rect.y0 && point.y <= rect.y1;
  const segmentsCross = (a, b, c, d) => {
    const ccw = (p1, p2, p3) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
  };
  const segmentIntersectsRect = (start, end, rect) => {
    if (pointInRect(start, rect) || pointInRect(end, rect)) return true;
    const corners = [
      { x: rect.x0, y: rect.y0 },
      { x: rect.x1, y: rect.y0 },
      { x: rect.x1, y: rect.y1 },
      { x: rect.x0, y: rect.y1 }
    ];
    return corners.some((corner, index) => segmentsCross(start, end, corner, corners[(index + 1) % corners.length]));
  };
  return createPolicies({
    labelBackgroundRect: toRect,
    labelRect: toRect,
    lineEnd: label => ({ x: label.labelX, y: label.labelY }),
    rectsOverlap: (a, b) => !(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0),
    segmentIntersectsRect,
    segmentsCross
  });
}

test("hard quality counts a leader crossing another label", () => {
  const policies = geometryPolicies();
  const settings = { width: 300, height: 220, labelSize: 12, mapScale: 100, layoutObstacles: [], routeDenseLeaders: false };
  const placed = [
    { rowId: "a", name: "Alpha", x: 0, y: 0, labelX: 100, labelY: 0, labelSide: "right" },
    { rowId: "b", name: "Beta", x: 50, y: 50, labelX: 40, labelY: 6, labelSide: "left" }
  ];

  const quality = policies.measurePlacementQuality(placed, settings);
  assert.equal(quality.leaderLabelCrossings, 1);
  assert.equal(quality.hardProblems, 1);
});

test("fixed-scale solver deterministically selects a conflict-free assignment", () => {
  const policies = geometryPolicies();
  const points = [
    { rowId: "a", name: "Alpha", x: 0, y: 0 },
    { rowId: "b", name: "Beta", x: 45, y: 6 }
  ];
  const bad = { ...points[0], labelX: 100, labelY: 0, labelSide: "right", lines: ["Alpha"], lineHeight: 12, textWidth: 50, textHeight: 12 };
  const good = { ...bad, labelY: 30 };
  const beta = { ...points[1], labelX: 40, labelY: 6, labelSide: "left", lines: ["Beta"], lineHeight: 12, textWidth: 50, textHeight: 12 };
  const candidatePlacementMap = new Map([["a", [bad, good]], ["b", [beta]]]);
  const settings = { width: 300, height: 220, labelSize: 12, mapScale: 100, layoutObstacles: [], routeDenseLeaders: false };
  const bounds = { x0: 80, y0: 60, x1: 220, y1: 160 };

  const first = policies.solveConflictFreeLayout(points, settings, bounds, { candidatePlacementMap, maxNodes: 100 });
  const second = policies.solveConflictFreeLayout(points, settings, bounds, { candidatePlacementMap, maxNodes: 100 });

  assert.equal(first.status, "solved");
  assert.equal(first.placed[0].labelY, 30);
  assert.deepEqual(
    first.placed.map(label => `${label.rowId}:${label.labelSide}:${label.labelX}:${label.labelY}`),
    second.placed.map(label => `${label.rowId}:${label.labelSide}:${label.labelX}:${label.labelY}`)
  );
  assert.equal(policies.measurePlacementQuality(first.placed, settings).hardProblems, 0);
});

test("fixed-scale solver distinguishes infeasible from budget-exhausted", () => {
  const policies = geometryPolicies();
  const points = [
    { rowId: "a", name: "Alpha", x: 0, y: 0 },
    { rowId: "b", name: "Beta", x: 45, y: 6 }
  ];
  const alpha = { ...points[0], labelX: 40, labelY: 6, labelSide: "right", lines: ["Alpha"], lineHeight: 12, textWidth: 50, textHeight: 12 };
  const beta = { ...points[1], labelX: 40, labelY: 6, labelSide: "left", lines: ["Beta"], lineHeight: 12, textWidth: 50, textHeight: 12 };
  const candidatePlacementMap = new Map([["a", [alpha]], ["b", [beta]]]);
  const settings = { width: 300, height: 220, labelSize: 12, mapScale: 100, layoutObstacles: [], routeDenseLeaders: false };
  const bounds = { x0: 80, y0: 60, x1: 220, y1: 160 };

  assert.equal(policies.solveConflictFreeLayout(points, settings, bounds, { candidatePlacementMap, maxNodes: 100 }).status, "infeasible");
  assert.equal(policies.solveConflictFreeLayout(points, settings, bounds, {
    candidatePlacementMap: new Map([["a", [alpha, { ...alpha, labelY: 40 }]], ["b", [beta]]]),
    maxNodes: 1
  }).status, "budget-exhausted");
});
