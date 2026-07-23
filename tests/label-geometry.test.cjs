const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadApi() {
  const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const geometrySource = fs.readFileSync(path.join(__dirname, "..", "geometry.js"), "utf8");
  const labelLayoutSource = fs.readFileSync(path.join(__dirname, "..", "label-layout.js"), "utf8");
  const projectIoSource = fs.readFileSync(path.join(__dirname, "..", "project-io.js"), "utf8");
  const regionMatchingSource = fs.readFileSync(path.join(__dirname, "..", "region-matching.js"), "utf8");
  const workspaceSource = fs.readFileSync(path.join(__dirname, "..", "workspace.js"), "utf8");
  const propertiesSource = fs.readFileSync(path.join(__dirname, "..", "properties.js"), "utf8");
  const projectFileSource = fs.readFileSync(path.join(__dirname, "..", "project-file.js"), "utf8");
  const windowStub = {
    d3: {},
    PLOTYPUS_TEST_MODE: true,
    MAP_APP_STYLE_PRESETS: undefined,
    MAP_APP_CATEGORY_COLOUR_PRESETS: undefined,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    }
  };
  const documentStub = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const d3Stub = {
    select() {
      return {};
    }
  };
  const context = {
    console,
    window: windowStub,
    document: documentStub,
    d3: d3Stub
  };

  vm.runInNewContext(geometrySource, context, { filename: "geometry.js" });
  vm.runInNewContext(labelLayoutSource, context, { filename: "label-layout.js" });
  vm.runInNewContext(projectIoSource, context, { filename: "project-io.js" });
  vm.runInNewContext(regionMatchingSource, context, { filename: "region-matching.js" });
  windowStub.PLOTYPUS_REGION_MATCHING = context.PLOTYPUS_REGION_MATCHING;
  vm.runInNewContext(workspaceSource, context, { filename: "workspace.js" });
  vm.runInNewContext(propertiesSource, context, { filename: "properties.js" });
  vm.runInNewContext(projectFileSource, context, { filename: "project-file.js" });
  windowStub.PlotypusProjectFile = context.PlotypusProjectFile;
  vm.runInNewContext(appSource, context, { filename: "app.js" });
  assert.ok(windowStub.PLOTYPUS_TEST_API, "test API should be exported");
  return windowStub.PLOTYPUS_TEST_API;
}

function loadProjectIo() {
  const projectIoSource = fs.readFileSync(path.join(__dirname, "..", "project-io.js"), "utf8");
  const windowStub = {};
  vm.runInNewContext(projectIoSource, { window: windowStub }, { filename: "project-io.js" });
  assert.ok(windowStub.PLOTYPUS_PROJECT_IO, "project I/O API should be exported");
  return windowStub.PLOTYPUS_PROJECT_IO;
}
function makeLabel(overrides = {}) {
  return {
    rowId: "row-a",
    name: "Alpha",
    type: "referred",
    x: 100,
    y: 100,
    labelX: 130,
    labelY: 100,
    labelSide: "right",
    lines: ["Alpha"],
    lineHeight: 12,
    textWidth: 40,
    textHeight: 12,
    hideLine: false,
    ...overrides
  };
}

function makeSettings(overrides = {}) {
  return {
    width: 300,
    height: 220,
    labelSize: 12,
    labelSizeRender: 12,
    markerSize: 10,
    lineWidth: 2,
    labelMaxChars: 26,
    ...overrides
  };
}

function makeMapBounds() {
  return { x0: 80, y0: 60, x1: 220, y1: 160 };
}

test("marker dragging allows an off-canvas warning gutter without losing the point", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 300, height: 220 });
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.constrainMarkerToVisibleGutter({ x: -80, y: 400 }, settings, 12))),
    { x: -20, y: 240, wasConstrained: true, offCanvas: true }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.constrainMarkerToVisibleGutter({ x: 150, y: 110 }, settings, 12))),
    { x: 150, y: 110, wasConstrained: false, offCanvas: false }
  );
  assert.equal(api.isPointOffCanvas({ x: -1, y: 110 }, settings), true);
  assert.equal(api.isPointOffCanvas({ x: 0, y: 220 }, settings), false);
});

test("label dragging keeps the complete label inside the canvas", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 300, height: 220 });
  const label = makeLabel({ labelX: -120, labelY: -80, labelSide: "right" });
  const constrained = api.constrainLabelToCanvas(label, settings);
  const visibleLabel = { ...label, labelX: constrained.labelX, labelY: constrained.labelY };

  assert.equal(constrained.wasConstrained, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.labelBackgroundRect(visibleLabel))),
    { x0: 0, y0: 0, x1: 56, y1: 20, centerX: 28, centerY: 10 }
  );

  const inside = makeLabel({ labelX: 130, labelY: 100, labelSide: "right" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(api.constrainLabelToCanvas(inside, settings))),
    { labelX: 130, labelY: 100, wasConstrained: false }
  );
});

test("rich-label typography uses 10 px titles and 8 px body text on screen", () => {
  const api = loadApi();
  const webSizes = api.getLabelTypographyRenderSizes(12, "web");
  const printSizes = api.getLabelTypographyRenderSizes(12, "print");
  assert.deepEqual(JSON.parse(JSON.stringify(webSizes)), { title: 10, body: 8 });
  assert.deepEqual(JSON.parse(JSON.stringify(printSizes)), { title: 12, body: 12 });

  const settings = makeSettings({
    outputMode: "web",
    mapLanguage: "en",
    labelSizePt: 12,
    labelSizeRender: 12,
    labelTitleSizeRender: webSizes.title,
    labelBodySizeRender: webSizes.body
  });
  const box = api.makeLabelBox(makeLabel({
    labelStyle: "rich",
    content: [{ type: "paragraph", text: { en: "Supporting paragraph", fr: "" } }]
  }), "right", settings, makeMapBounds());
  const title = box.lines.find(line => line.role === "title");
  const paragraph = box.lines.find(line => line.role === "paragraph");

  assert.equal(title.fontSize, 10);
  assert.equal(title.lineHeight, 12);
  assert.equal(paragraph.fontSize, 8);
  assert.equal(paragraph.baselineOffset, 12);
});

test("compact label titles use the same 10 px screen size as rich-label titles", () => {
  const api = loadApi();
  const webSizes = api.getLabelTypographyRenderSizes(12, "web");
  const settings = makeSettings({
    outputMode: "web",
    mapLanguage: "en",
    labelSizePt: 12,
    labelSizeRender: 12,
    labelTitleSizeRender: webSizes.title,
    labelBodySizeRender: webSizes.body
  });
  const box = api.makeLabelBox(makeLabel({
    name: "Compact label",
    labelStyle: "compact",
    content: []
  }), "right", settings, makeMapBounds());
  const title = box.lines.find(line => line.role === "title");

  assert.equal(title.fontSize, 10);
  assert.equal(title.lineHeight, 12);
});

test("no-coordinate callouts use 10 px headings and 8 px item text on screen", () => {
  const api = loadApi();
  const sizes = api.getLabelTypographyRenderSizes(12, "web");
  const layout = api.getCalloutContentLayout([
    makeLabel({ name: "No-coordinate project" })
  ], makeSettings({
    outputMode: "web",
    mapLanguage: "en",
    compactFurniture: true,
    labelSizePt: 12,
    labelTitleSizeRender: sizes.title,
    labelBodySizeRender: sizes.body
  }), 300);

  assert.equal(layout.headingSize, 10);
  assert.equal(layout.nameSize, 8);
  assert.equal(layout.lineH, 12);
  assert.equal(layout.rows[0].rowHeight >= layout.lineH, true);
  assert.equal(layout.rows[0].textY >= layout.rows[0].rowY, true);
});

test("localized config fallbacks prefer the requested language", () => {
  const api = loadApi();
  const item = { label: "Custom style", labelFr: "Style personnalisé" };
  assert.equal(api.getLocalizedConfigLabel(item, "en"), "Custom style");
  assert.equal(api.getLocalizedConfigLabel(item, "fr"), "Style personnalisé");
  assert.equal(api.getLocalizedConfigLabel({ label: "English fallback" }, "fr"), "English fallback");
});

test("world region names resolve in French without changing stable English IDs", () => {
  const api = loadApi();
  const world = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets", "world-countries.geojson"), "utf8"));
  const unresolved = world.features.filter(feature => !api.getFrenchWorldRegionName(feature.properties));
  assert.deepEqual(unresolved.map(feature => feature.properties.name), []);

  const germany = world.features.find(feature => feature.properties.name === "Germany");
  assert.equal(api.getRegionDisplayName(germany, 0, "en"), "Germany");
  assert.equal(api.getRegionDisplayName(germany, 0, "fr"), "Allemagne");
  assert.equal(api.getFrenchWorldRegionName({ adm0_a3: "CYN", iso_a2: "-99" }), "Chypre du Nord");
});

test("CSV parser diagnostics use bilingual message keys instead of library prose", () => {
  const api = loadApi();
  assert.equal(api.getCsvParserErrorMessage({ code: "MissingQuotes" }), "dialog.csv.error.missingQuotes");
  assert.equal(api.getCsvParserErrorMessage({ code: "TooFewFields" }), "dialog.csv.error.tooFewFields");
  assert.equal(api.getCsvParserErrorMessage({ code: "UnknownLibraryCode", message: "English-only message" }), "dialog.csv.error.parse");
});

test("malformed project JSON exposes a structured bilingual error key", () => {
  const projectIo = loadProjectIo();
  assert.throws(
    () => projectIo.parseProjectJson('{"rows": ['),
    error => {
      assert.equal(error.i18nKey, "project.error.invalidJson");
      assert.equal(Object.keys(error.i18nParams).length, 0);
      assert.equal(error.cause && error.cause.name, "SyntaxError");
      return true;
    }
  );
});

test("project CSV export omits the retired Priority field", () => {
  const projectIo = loadProjectIo();
  const exported = projectIo.createCsvExport({
    rows: [{
      name: "Legacy row",
      nameFr: "Ancienne ligne",
      footnote: "",
      type: "infrastructure",
      priority: 5,
      lon: -75,
      lat: 45,
      hideLine: false
    }],
    projectLocationMode: "coordinates",
    getCategoryLabel: value => value,
    getCategoryText: category => category.labelFr || "",
    getCategoryForType: value => ({ id: value, labelFr: "Infrastructure" })
  });

  assert.equal(exported.columns.includes("priority"), false);
  assert.equal(Object.hasOwn(exported.rows[0], "priority"), false);
});

test("rich-label import composes typed, editable blocks from multiple source columns", () => {
  const projectIo = loadProjectIo();
  const source = {
    Jurisdiction: "Vaughan, Ontario",
    "Federal Funding": "$59 million",
    "New Homes Over 10 Years": "43,999"
  };
  const rows = projectIo.composeRichLabelRows(
    [{ name: source.Jurisdiction, lon: "", lat: "" }],
    [source],
    [
      { type: "text", template: "{Federal Funding} | {New Homes Over 10 Years} homes", numberFormat: "abbrev" }
    ]
  );

  assert.equal(rows[0].labelStyle, "rich");
  assert.deepEqual(JSON.parse(JSON.stringify(rows[0].content.map(block => block.type))), ["text"]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows[0].content[0].sources)), ["Federal Funding", "New Homes Over 10 Years"]);
  assert.equal(rows[0].content[0].numberFormat, "abbrev");
  assert.equal(rows[0].content[0].value.en, "$59M | 43,999 homes");
  assert.equal(rows[0].content[0].value.fr.replace(/[\u00a0\u202f]/g, " "), "59 M$ | 43 999 logements");
});

test("the row title stays the rich-label heading and legacy headings remain as text", () => {
  const api = loadApi();
  const content = api.normalizeAnnotationContent([
    { type: "heading", template: "{Place}", sources: ["Place"], numberFormat: "full", value: { en: "Vaughan", fr: "Vaughan" } },
    { type: "text", template: "{Funding}", sources: ["Funding"], numberFormat: "abbrev", value: { en: "$59M", fr: "59 M$" } },
    { type: "bullet", template: "Housing", sources: [], numberFormat: "full", value: { en: "Housing", fr: "Logement" } }
  ]);
  content[1].value.en = "$60M";
  const row = { name: "Metadata name", nameFr: "Nom de données", labelStyle: "rich", content };
  const lines = api.getLabelLines(row, makeSettings({ mapLanguage: "en", labelMaxChars: 100 }));
  assert.deepEqual(JSON.parse(JSON.stringify(lines.map(line => [line.role, line.text]))), [
    ["title", "Metadata name"],
    ["paragraph", "Vaughan"],
    ["paragraph", "$60M"],
    ["bullet", "- Housing"]
  ]);

  row.content = row.content.slice(1);
  const afterDelete = api.getLabelLines(row, makeSettings({ mapLanguage: "en", labelMaxChars: 100 }));
  assert.deepEqual(JSON.parse(JSON.stringify(afterDelete.map(line => line.text))), ["Metadata name", "$60M", "- Housing"]);
});

test("French CSV values normalize accents, booleans, and category labels", () => {
  const api = loadApi();
  assert.equal(api.normalizeHeader("  CATÉGORIE "), "categorie");
  assert.equal(api.normalizeHeader("Priorité"), "priorite");
  assert.equal(api.toBoolean("Oui"), true);
  assert.equal(api.toBoolean("Masqué"), true);
  assert.equal(api.toBoolean("sans trait de renvoi"), true);
  assert.equal(api.cleanType("Projets soumis"), "referred");
  assert.equal(api.cleanType("Stratégies de transformation"), "strategy");
});

test("captionless rich images do not become fake translation strings", () => {
  const api = loadApi();
  assert.equal(api.getImageCaptionTranslationEntry({
    type: "image",
    assetRef: "data:image/png;base64,AAAA",
    caption: { en: "", fr: "" }
  }, "row-1", 0), null);
  const entry = api.getImageCaptionTranslationEntry({ caption: { en: "Map", fr: "Carte" } }, "row-1", 2);
  assert.equal(entry.ref, "Map");
  assert.equal(entry.fr, "Carte");
  assert.equal(entry.id, "content-image:row-1:2");
});

test("new category defaults populate English and French independently", () => {
  const api = loadApi();
  const labels = api.getDefaultCategoryLabels(3, (language, _key, params) => (
    language === "fr" ? `Catégorie ${params.count}` : `Category ${params.count}`
  ));
  assert.deepEqual(JSON.parse(JSON.stringify(labels)), { label: "Category 3", labelFr: "Catégorie 3" });
});

test("localized decimal formatting uses a comma in French", () => {
  const api = loadApi();
  assert.equal(api.formatLocalizedDecimal(1.25, "en", 1), "1.3");
  assert.equal(api.formatLocalizedDecimal(1.25, "fr", 1), "1,3");
});

test("project snapshots preserve unified annotation content and strip chart metadata", () => {
  const projectIo = loadProjectIo();
  const content = [
    { type: "paragraph", en: "Rich paragraph", fr: "Paragraphe riche" },
    { type: "bullets", items: [{ en: "Rich bullet", fr: "Puce riche" }] },
    {
      type: "image",
      assetRef: "https://example.com/rich-label.png",
      caption: { en: "Rich label image", fr: "Image d'etiquette enrichie" },
      displaySize: 144,
      naturalWidth: 1200,
      naturalHeight: 600
    }
  ];

  const snapshot = projectIo.createProjectSnapshot({
    version: 2,
    rows: [{
      rowId: "row-rich",
      name: "Rich row",
      type: "referred",
      priority: 1,
      lon: -75,
      lat: 45,
      labelStyle: "rich",
      labelBorder: true,
      content,
      chart: "pie",
      chartSlices: [{ label: { en: "Federal", fr: "Federal" }, value: 60, color: "#3f6b5e" }],
      bullets: ["legacy"]
    }],
    categories: [],
    cleanType: value => value
  });

  assert.deepEqual(snapshot.rows[0].content, content);
  assert.equal(snapshot.rows[0].labelBorder, true);
  assert.equal(snapshot.rows[0].chart, "none");
  assert.equal(Array.isArray(snapshot.rows[0].chartSlices), true);
  assert.equal(snapshot.rows[0].chartSlices.length, 0);
  assert.equal(Object.hasOwn(snapshot.rows[0], "labelBlocks"), false);
  assert.equal(Object.hasOwn(snapshot.rows[0], "labelImage"), false);
  assert.equal(Object.hasOwn(snapshot.rows[0], "bullets"), false);
  assert.equal(Object.hasOwn(snapshot.rows[0], "priority"), false);
});

test("rich label image sizing stays proportional and expands label geometry", () => {
  const api = loadApi();
  assert.equal(api.normalizeRichLabelImageDisplaySize(undefined), 72);
  assert.equal(api.normalizeRichLabelImageDisplaySize(1), 24);
  assert.equal(api.normalizeRichLabelImageDisplaySize(999), 300);

  const normalized = api.normalizeAnnotationContent([{
    type: "image",
    assetRef: "data:image/png;base64,AA==",
    caption: { en: "Image caption", fr: "" },
    displaySize: 144,
    naturalWidth: 1200,
    naturalHeight: 600
  }])[0];
  const dimensions = api.getRichLabelImageDimensions(normalized);
  assert.equal(dimensions.width, 144);
  assert.equal(dimensions.height, 72);

  const box = api.makeLabelBox({
    name: "Rich label",
    labelStyle: "rich",
    content: [normalized],
    footnote: ""
  }, "right", makeSettings());
  const imageLine = box.lines.find(line => line.role === "image");
  const captionLine = box.lines.find(line => line.role === "caption");
  const fontSize = box.lineHeight / 1.2;
  const imageBottom = imageLine.baselineOffset - fontSize + imageLine.imageHeight;
  const captionTop = captionLine.baselineOffset - fontSize;
  const visualHeight = box.textHeight - box.lineHeight + fontSize;
  assert.ok(box.textWidth >= dimensions.width);
  assert.ok(captionTop >= imageBottom + 4);
  assert.ok(visualHeight >= imageBottom + fontSize);
});

test("project snapshots round-trip portable assets, styles, elbow settings, metadata, and layouts", () => {
  const projectIo = loadProjectIo();
  const projectFile = require("../project-file.js");
  const richImageBlock = {
    type: "image",
    assetRef: "data:image/png;base64,iVBORw0KGgo=",
    caption: { en: "Manufacturing", fr: "Fabrication" },
    displaySize: 96,
    naturalWidth: 160,
    naturalHeight: 112
  };
  const customIcon = {
    dataUrl: "data:image/png;base64,iVBORw0KGgo=",
    mimeType: "image/png",
    name: "infrastructure-marker.png",
    width: 24,
    height: 20,
    size: 128
  };
  const languageLayouts = {
    en: {
      manualLabelPositions: { "row:row-elbow": { x: 101.5, y: 202.5, side: "right" } },
      manualBoxPositions: { legend: { x: 11, y: 12, width: 140, height: 80 } },
      mapScale: 95
    },
    fr: {
      manualLabelPositions: { "row:row-elbow": { x: 303.5, y: 404.5, side: "left" } },
      manualBoxPositions: { callouts: { x: 21, y: 22, width: 180, height: 90 } },
      mapScale: 105
    }
  };

  const snapshot = projectIo.createProjectSnapshot({
    format: "plotypus-project",
    version: 7,
    generator: { name: "Plotypus", version: "2026.07.14" },
    boundary: "canada",
    mapStyle: "goc-green",
    categories: [{
      id: "infrastructure",
      label: "Infrastructure",
      shape: "circle",
      colour: "#123456",
      stroke: "#abcdef",
      markerSize: 12,
      lineWidth: 3,
      customIcon
    }],
    rows: [
      { rowId: "row-elbow", name: "Elbow", type: "infrastructure", elbowLeader: true, labelStyle: "rich", labelBorder: true, content: [richImageBlock] },
      { rowId: "row-default", name: "Default routing", type: "infrastructure", elbowLeader: false }
    ],
    languageLayouts,
    manualLabelPositions: { "row:legacy": { x: 1, y: 2, side: "top" } },
    manualBoxPositions: { legend: { x: 3, y: 4 } },
    cleanType: value => value
  });
  const savedProject = JSON.parse(JSON.stringify(snapshot));
  const restored = projectFile.validateAndNormalizeProject(savedProject, {
    currentVersion: 7,
    projectFormat: "plotypus-project",
    boundarySources: { canada: {} },
    mapStylePresets: { "goc-green": {} },
    defaultBoundary: "canada",
    defaultMapStyle: "goc-green"
  });

  assert.equal(restored.format, "plotypus-project");
  assert.equal(restored.version, 7);
  assert.deepEqual(restored.generator, { name: "Plotypus", version: "2026.07.14" });
  assert.equal(new Date(restored.savedAt).toISOString(), restored.savedAt);
  assert.equal(restored.categories[0].stroke, "#abcdef");
  assert.deepEqual(restored.categories[0].customIcon, customIcon);
  assert.equal(restored.rows[0].elbowLeader, true);
  assert.equal(restored.rows[0].labelBorder, true);
  assert.deepEqual(restored.rows[0].content, [richImageBlock]);
  assert.equal(Object.hasOwn(restored.rows[1], "elbowLeader"), true);
  assert.equal(restored.rows[1].elbowLeader, false);
  assert.deepEqual(restored.languageLayouts, languageLayouts);
  assert.deepEqual(restored.manualLabelPositions, { "row:legacy": { x: 1, y: 2, side: "top" } });
  assert.deepEqual(restored.manualBoxPositions, { legend: { x: 3, y: 4 } });
});

test("rect overlap detects collisions and computes positive area only", () => {
  const api = loadApi();
  const a = { x0: 0, y0: 0, x1: 10, y1: 10 };
  const b = { x0: 5, y0: 5, x1: 15, y1: 15 };
  const c = { x0: 11, y0: 11, x1: 20, y1: 20 };

  assert.equal(api.rectsOverlap(a, b), true);
  assert.equal(api.rectOverlapArea(a, b), 25);
  assert.equal(api.rectsOverlap(a, c), false);
  assert.equal(api.rectOverlapArea(a, c), 0);
});

test("segment crossing and segment-rectangle intersection catch leader conflicts", () => {
  const api = loadApi();
  const diagonalA = { x: 0, y: 0 };
  const diagonalB = { x: 10, y: 10 };
  const diagonalC = { x: 0, y: 10 };
  const diagonalD = { x: 10, y: 0 };
  const parallelC = { x: 0, y: 2 };
  const parallelD = { x: 10, y: 12 };
  const rect = { x0: 4, y0: 4, x1: 6, y1: 6 };

  assert.equal(api.segmentsCross(diagonalA, diagonalB, diagonalC, diagonalD), true);
  assert.equal(api.segmentsCross(diagonalA, diagonalB, parallelC, parallelD), false);
  assert.equal(api.segmentIntersectsRect(diagonalA, diagonalB, rect), true);
  assert.equal(api.segmentIntersectsRect({ x: 0, y: 20 }, { x: 10, y: 20 }, rect), false);
});

test("quality reports recompute from current moved label positions", () => {
  const api = loadApi();
  const layout = {
    placed: [
      makeLabel({ rowId: "row-a", labelX: 130, labelY: 100 }),
      makeLabel({ rowId: "row-b", x: 200, labelX: 210, labelY: 100 })
    ],
    settings: makeSettings(),
    mapBounds: makeMapBounds(),
    report: {
      projectedProblems: [{ rowId: "projected" }],
      hiddenRegionProblems: [{ rowId: "hidden" }]
    }
  };

  const initialReport = api.recomputeLayoutQualityReport(layout);
  assert.equal(initialReport.overlaps, 0);

  layout.placed[1].labelX = layout.placed[0].labelX;
  layout.placed[1].labelY = layout.placed[0].labelY;
  layout.placed[1].labelSide = layout.placed[0].labelSide;
  const movedReport = api.recomputeLayoutQualityReport(layout);

  assert.equal(movedReport.overlaps, 1);
  assert.deepEqual(movedReport.projectedProblems, [{ rowId: "projected" }]);
  assert.deepEqual(movedReport.hiddenRegionProblems, [{ rowId: "hidden" }]);
  assert.equal(layout.report, movedReport);
});

test("quality analysis flags and locates points outside the export canvas", () => {
  const api = loadApi();
  const settings = makeSettings();
  const placed = [
    makeLabel({ rowId: "row-inside", x: 120, y: 100 }),
    makeLabel({ rowId: "row-outside", x: -18, y: 80 })
  ];
  const analyzer = api.createLayoutQualityAnalyzer(placed, settings, [], [], makeMapBounds(), placed);
  analyzer.step();
  const report = analyzer.getReport();

  assert.equal(report.offCanvasPoints, 1);
  assert.ok(report.qualityTargets.some(target => target.type === "off-canvas-point" && target.rowId === "row-outside"));
});

test("time-sliced quality analysis matches synchronous analysis", () => {
  const api = loadApi();
  const placed = [
    makeLabel({ rowId: "row-a", labelX: 130, labelY: 100 }),
    makeLabel({ rowId: "row-b", x: 200, labelX: 130, labelY: 100 }),
    makeLabel({ rowId: "row-c", x: 80, y: 160, labelX: 105, labelY: 160 }),
    makeLabel({ rowId: "row-d", x: 240, y: 170, labelX: 250, labelY: 170, hideLine: true })
  ];
  const settings = makeSettings();
  const mapBounds = makeMapBounds();
  const projectedProblems = [{ rowId: "projected" }];
  const hiddenRegionProblems = [{ rowId: "hidden" }];
  const synchronousLayout = { placed, settings, mapBounds, report: { projectedProblems, hiddenRegionProblems } };
  const expected = JSON.parse(JSON.stringify(api.recomputeLayoutQualityReport(synchronousLayout)));

  [1, 3, 1000].forEach(maxOperations => {
    const analyzer = api.createLayoutQualityAnalyzer(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds);
    let slices = 0;
    while (!analyzer.step({ maxOperations })) slices += 1;
    slices += 1;
    assert.deepEqual(JSON.parse(JSON.stringify(analyzer.getReport())), expected);
    if (maxOperations === 1) assert.ok(slices > 1);
  });
});

test("timed-out idle quality slices still make wall-clock-budgeted progress", () => {
  const api = loadApi();
  const placed = Array.from({ length: 20 }, (_, index) => makeLabel({
    rowId: `row-${index}`,
    x: 40 + index * 11,
    y: 60 + index * 5,
    labelX: 55 + index * 11,
    labelY: 60 + index * 5
  }));
  const analyzer = api.createLayoutQualityAnalyzer(placed, makeSettings(), [], [], makeMapBounds());
  let timeRemainingCalls = 0;
  const complete = analyzer.step({
    maxOperations: 64,
    budgetMs: 1000,
    deadline: {
      didTimeout: true,
      timeRemaining() {
        timeRemainingCalls += 1;
        return 0;
      }
    }
  });

  assert.equal(complete, false);
  assert.equal(timeRemainingCalls, 0);
});

test("per-row elbow leader override routes an elbow even when automatic elbows are off", () => {
  const api = loadApi();
  const straight = api.leaderPathPoints(makeLabel({ elbowLeader: false }), makeSettings({ routeDenseLeaders: false }));
  const elbow = api.leaderPathPoints(makeLabel({ elbowLeader: true }), makeSettings({ routeDenseLeaders: false }));

  assert.equal(straight.length, 2);
  assert.equal(elbow.length, 3);
  assert.equal(elbow[1].x, straight[1].x);
  assert.equal(elbow[1].y, straight[0].y);
});

test("candidate scoring penalizes label-marker and leader-marker conflicts", () => {
  const api = loadApi();
  const settings = makeSettings();
  const mapBounds = makeMapBounds();
  const clean = makeLabel({ labelX: 230, labelY: 80, labelSide: "right" });
  const colliding = makeLabel({ labelX: 132, labelY: 100, labelSide: "right" });
  const points = [
    makeLabel({ rowId: "row-a", x: 100, y: 100 }),
    makeLabel({ rowId: "row-b", x: 150, y: 100, labelX: 10, labelY: 10 })
  ];

  const cleanScore = api.scoreCandidate(clean, [], settings, mapBounds, "right", points);
  const collidingScore = api.scoreCandidate(colliding, [], settings, mapBounds, "right", points);

  assert.ok(collidingScore > cleanScore, `expected marker conflict score ${collidingScore} > clean score ${cleanScore}`);
});

test("candidate scoring strongly penalizes labels that enter reserved layout boxes", () => {
  const api = loadApi();
  const settings = makeSettings({
    layoutObstacles: [
      { key: "legend", rect: { x0: 20, y0: 140, x1: 180, y1: 210 } }
    ]
  });
  const mapBounds = makeMapBounds();
  const clear = makeLabel({ labelX: 220, labelY: 70, labelSide: "right" });
  const blocked = makeLabel({ labelX: 40, labelY: 170, labelSide: "right" });
  const points = [makeLabel({ rowId: "row-a", x: 100, y: 100 })];

  const clearScore = api.scoreCandidate(clear, [], settings, mapBounds, "right", points);
  const blockedScore = api.scoreCandidate(blocked, [], settings, mapBounds, "right", points);

  assert.ok(blockedScore > clearScore, `expected layout obstacle score ${blockedScore} > clear score ${clearScore}`);
});

test("candidate scoring rejects opposite-side labels that create long cross-map leaders", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 360, height: 240 });
  const mapBounds = { x0: 90, y0: 60, x1: 270, y1: 170 };
  const point = makeLabel({ rowId: "row-east", x: 245, y: 115, lon: -65, lat: 46 });
  const right = makeLabel({ ...point, labelX: 285, labelY: 115, labelSide: "right" });
  const left = makeLabel({ ...point, labelX: 75, labelY: 115, labelSide: "left" });

  const rightScore = api.scoreCandidate(right, [], settings, mapBounds, "right", [point]);
  const leftScore = api.scoreCandidate(left, [], settings, mapBounds, "right", [point]);

  assert.ok(leftScore > rightScore + 50000, `expected opposite-side score ${leftScore} to exceed right-side score ${rightScore}`);
});

test("perimeter candidates add outside-map slots for dense cartographic labels", () => {
  const api = loadApi();
  const settings = makeSettings();
  const mapBounds = makeMapBounds();
  const points = [
    makeLabel({ rowId: "row-a", name: "Alpha", x: 100, y: 100, lon: -120, lat: 55 }),
    makeLabel({ rowId: "row-b", name: "Beta", x: 145, y: 105, lon: -110, lat: 56 }),
    makeLabel({ rowId: "row-c", name: "Gamma", x: 170, y: 110, lon: -90, lat: 57 })
  ];
  const perimeterMap = api.createPerimeterCandidateMap(points, settings, mapBounds);
  const alphaSlots = perimeterMap.get("row:row-a");

  assert.ok(alphaSlots.length >= 4, "expected outside candidates on all sides");
  assert.ok(
    alphaSlots.some(candidate => candidate.side === "left" && candidate.x - candidate.box.textWidth <= mapBounds.x0),
    "expected a left perimeter candidate outside the map bounds"
  );
  assert.ok(
    alphaSlots.some(candidate => candidate.side === "top" && candidate.y - candidate.box.lineHeight / 1.2 < mapBounds.y0),
    "expected a top perimeter candidate outside the map bounds"
  );
});

test("perimeter feasibility accounts for outside strip capacity", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 420, height: 300, labelSize: 12 });
  const mapBounds = { x0: 150, y0: 90, x1: 270, y1: 200 };
  const labels = [
    makeLabel({ rowId: "row-a", name: "Alpha Project", x: 160, y: 120, lon: -120, lat: 55 }),
    makeLabel({ rowId: "row-b", name: "Beta Project", x: 250, y: 140, lon: -90, lat: 55 }),
    makeLabel({ rowId: "row-c", name: "Gamma Project", x: 210, y: 95, lon: -100, lat: 65 })
  ];

  const result = api.assessPerimeterFeasibility(labels, settings, mapBounds, []);

  assert.equal(result.feasible, true);
  assert.equal(result.placed, labels.length);
});

test("perimeter feasibility rejects layouts when outside strips are too small or blocked", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 320, height: 230, labelSize: 14 });
  const mapBounds = { x0: 45, y0: 40, x1: 275, y1: 190 };
  const labels = Array.from({ length: 8 }, (_, index) => makeLabel({
    rowId: `row-${index}`,
    name: `Very Long Infrastructure Label ${index + 1}`,
    x: 100 + index * 8,
    y: 80 + index * 5,
    lon: -110 + index,
    lat: 55
  }));
  const obstacles = [
    { key: "legend", rect: { x0: 20, y0: 150, x1: 240, y1: 220 } }
  ];

  const result = api.assessPerimeterFeasibility(labels, settings, mapBounds, obstacles);

  assert.equal(result.feasible, false);
  assert.ok(result.unmet.length > 0, "expected at least one label to exceed outside strip capacity");
});

test("ordered side-band pass preserves anchor order for same-side labels", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 420, height: 280, labelSize: 12 });
  const mapBounds = { x0: 150, y0: 70, x1: 270, y1: 210 };
  const labels = [
    makeLabel({
      rowId: "upper",
      name: "Upper Label",
      x: 150,
      y: 80,
      labelX: 110,
      labelY: 170,
      labelSide: "left",
      textWidth: 80
    }),
    makeLabel({
      rowId: "lower",
      name: "Lower Label",
      x: 155,
      y: 150,
      labelX: 110,
      labelY: 85,
      labelSide: "left",
      textWidth: 80
    })
  ];

  assert.equal(api.countSideOrderInversions(labels), 1);

  const optimized = api.optimizeOrderedSideBands(labels, labels, settings, mapBounds);
  const upper = optimized.find(label => label.rowId === "upper");
  const lower = optimized.find(label => label.rowId === "lower");

  assert.equal(api.countSideOrderInversions(optimized), 0);
  assert.equal(upper.labelSide, "left");
  assert.equal(lower.labelSide, "left");
  assert.ok(upper.labelY < lower.labelY, `expected upper label ${upper.labelY} above lower label ${lower.labelY}`);
});

test("ordered side-band pass preserves anchor order for bottom labels", () => {
  const api = loadApi();
  const settings = makeSettings({ width: 520, height: 320, labelSize: 12 });
  const mapBounds = { x0: 120, y0: 70, x1: 400, y1: 220 };
  const labels = [
    makeLabel({
      rowId: "west",
      name: "West Bottom Label",
      x: 180,
      y: 170,
      labelX: 250,
      labelY: 285,
      labelSide: "bottom",
      textWidth: 110
    }),
    makeLabel({
      rowId: "east",
      name: "East Bottom Label",
      x: 260,
      y: 185,
      labelX: 150,
      labelY: 285,
      labelSide: "bottom",
      textWidth: 110
    })
  ];

  assert.equal(api.countSideOrderInversions(labels), 1);

  const optimized = api.optimizeOrderedSideBands(labels, labels, settings, mapBounds);
  const west = optimized.find(label => label.rowId === "west");
  const east = optimized.find(label => label.rowId === "east");

  assert.equal(api.countSideOrderInversions(optimized), 0);
  assert.equal(west.labelSide, "bottom");
  assert.equal(east.labelSide, "bottom");
  assert.ok(api.lineEnd(west).x < api.lineEnd(east).x, "expected bottom leader endpoints to follow anchor x-order");
});

test("manual positions override automatic labels and preserve stable keys", () => {
  const api = loadApi();
  const placed = [
    makeLabel({ rowId: "42", name: "Manual label", labelX: 10, labelY: 20 })
  ];

  api.setManualLabelPositions({ "row:42": { x: 88, y: 99 } });
  const result = api.applyManualLabelPositions(placed);

  assert.equal(result[0].labelKey, "row:42");
  assert.equal(result[0].layoutId, "label-0");
  assert.equal(result[0].labelX, 88);
  assert.equal(result[0].labelY, 99);
});

test("manual positions can override label side and anchor", () => {
  const api = loadApi();
  const placed = [
    makeLabel({ rowId: "42", name: "Manual label", labelX: 220, labelY: 120, labelSide: "right" })
  ];

  api.setManualLabelPositions({ "row:42": { x: 88, y: 99, side: "left" } });
  const result = api.applyManualLabelPositions(placed);

  assert.equal(result[0].labelSide, "left");
  assert.equal(result[0].anchor, "end");
  assert.equal(result[0].labelX, 88);
  assert.equal(result[0].labelY, 99);
});

test("leader endpoints stay outside padded label backgrounds", () => {
  const api = loadApi();
  const right = makeLabel({ labelSide: "right", labelX: 130, labelY: 100, textWidth: 40 });
  const rightEnd = api.lineEnd(right);
  const rightBox = api.labelBackgroundRect(right);

  assert.ok(rightEnd.x < rightBox.x0, "right-side leaders should stop before the label background");
  assert.equal(rightEnd.y, rightBox.centerY);

  const left = makeLabel({ labelSide: "left", labelX: 130, labelY: 100, textWidth: 40 });
  const leftEnd = api.lineEnd(left);
  const leftBox = api.labelBackgroundRect(left);

  assert.ok(leftEnd.x > leftBox.x1, "left-side leaders should stop after the label background");
  assert.equal(leftEnd.y, leftBox.centerY);
});

test("automatic labels keep stable IDs when manual positions are ignored", () => {
  const api = loadApi();
  const placed = [
    makeLabel({ rowId: "42", name: "Automatic label", labelX: 10, labelY: 20 })
  ];

  api.setManualLabelPositions({ "row:42": { x: 88, y: 99 } });
  const result = api.applyManualLabelPositions(placed, false);

  assert.equal(result[0].labelKey, "row:42");
  assert.equal(result[0].layoutId, "label-0");
  assert.equal(result[0].labelX, 10);
  assert.equal(result[0].labelY, 20);
});

test("English and French manual label positions remain independent", () => {
  const api = loadApi();
  const plain = (value) => JSON.parse(JSON.stringify(value));

  api.setManualLabelPositions({ "row:42": { x: 10, y: 20 } });
  api.setManualBoxPositions({ legend: { x: 30, y: 40 } });
  api.switchActiveLanguageLayout("fr");
  assert.equal(api.getCurrentMapLanguage(), "fr");
  assert.deepEqual(plain(api.getManualLabelPositions()), {});
  assert.deepEqual(plain(api.getManualBoxPositions()), {});

  api.setManualLabelPositions({ "row:42": { x: 88, y: 99 } });
  api.setManualBoxPositions({ legend: { x: 70, y: 80 } });
  api.switchActiveLanguageLayout("en");
  assert.deepEqual(plain(api.getManualLabelPositions()), { "row:42": { x: 10, y: 20 } });
  assert.deepEqual(plain(api.getManualBoxPositions()), { legend: { x: 30, y: 40 } });

  api.switchActiveLanguageLayout("fr");
  assert.deepEqual(plain(api.getManualLabelPositions()), { "row:42": { x: 88, y: 99 } });
  assert.deepEqual(plain(api.getManualBoxPositions()), { legend: { x: 70, y: 80 } });
});

test("project validation migrates legacy files and rejects unsupported versions", () => {
  const api = loadApi();
  const migrated = JSON.parse(JSON.stringify(api.validateAndNormalizeProject({
    rows: [{ name: "Legacy project" }],
    boundary: "not-a-boundary",
    mapStyle: "not-a-style"
  })));

  assert.equal(migrated.version, 1);
  assert.equal(migrated.format, "plotypus-project");
  assert.equal(migrated.boundary, "canada");
  assert.equal(migrated.mapLanguage, "en");
  assert.deepEqual(migrated.settings, {});
  assert.throws(
    () => api.validateAndNormalizeProject({ version: 999, rows: [] }),
    /supports up to version/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ version: 7, rows: [] }),
    /missing its format identifier/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ format: "another-project-format", version: 7, rows: [] }),
    /format.*not supported/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ format: "plotypus-project", generator: "Plotypus", version: 7, rows: [] }),
    /generator metadata must be an object/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ version: 5, rows: ["invalid"] }),
    /row 1 must be an object/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ version: 5, rows: [], categories: [{ id: "bad", colour: "url(#bad)" }] }),
    /category 1 colour must be a hex colour/
  );
  assert.doesNotThrow(() => api.validateAndNormalizeProject({
    version: 5,
    rows: [],
    categories: [{
      id: "icon",
      customIcon: {
        dataUrl: "data:image/png;base64,iVBORw0KGgo=",
        mimeType: "image/png",
        width: 24,
        height: 24,
        size: 128
      }
    }]
  }));
  assert.throws(
    () => api.validateAndNormalizeProject({
      version: 5,
      rows: [],
      categories: [{
        id: "bad-icon",
        customIcon: {
          dataUrl: "data:image/svg+xml;base64,PHN2Zy8+",
          mimeType: "image/svg+xml",
          width: 24,
          height: 24,
          size: 128
        }
      }]
    }),
    /custom icon must be a PNG or WebP image/
  );
  assert.throws(
    () => api.validateAndNormalizeProject({ version: 5, rows: [], regionFills: { canada: "not-a-colour" } }),
    /region fill 'canada' must be a hex colour/
  );
});
