(async function () {
  const appConfig = window.PLOTYPUS_TEST_MODE
    ? (window.PLOTYPUS_CONFIG || {})
    : await (window.PLOTYPUS_CONFIG_READY || Promise.resolve(window.PLOTYPUS_CONFIG || {}));
  const cloneConfigList = (items) => Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const defaultFontFamily = appConfig.defaultFontFamily || "Lato, Segoe UI, Arial, sans-serif";
  const startupI18n = window.PLOTYPUS_I18N;

  function getStartupUiLanguage() {
    const storageKey = appConfig.storageKeys && appConfig.storageKeys.uiLanguage || "plotypus.uiLanguage";
    try {
      return JSON.parse(window.localStorage.getItem(storageKey) || "\"en\"") === "fr" ? "fr" : "en";
    } catch (_error) {
      return "en";
    }
  }

  function startupT(key, params) {
    if (startupI18n && typeof startupI18n.t === "function") {
      return startupI18n.t(getStartupUiLanguage(), key, params);
    }
    return key;
  }

  if (!window.d3) {
    const message = startupT("startup.error.d3");
    const statusBox = document.querySelector("#statusBox");
    const mapSvg = document.querySelector("#mapSvg");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    if (mapSvg) {
      mapSvg.setAttribute("viewBox", "0 0 900 360");
      mapSvg.innerHTML = `<rect width="900" height="360" fill="#fff7e6"></rect><text x="450" y="180" text-anchor="middle" font-family="${defaultFontFamily}" font-size="22" font-weight="700" fill="#8a1f11">${message}</text>`;
    }
    return;
  }

  if (!window.PLOTYPUS_GEOMETRY) {
    const message = startupT("startup.error.module", { module: "geometry.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  if (!window.PLOTYPUS_LABEL_LAYOUT) {
    const message = startupT("startup.error.module", { module: "label-layout.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  if (!window.PLOTYPUS_PROJECT_IO) {
    const message = startupT("startup.error.module", { module: "project-io.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  if (!window.PLOTYPUS_WORKSPACE) {
    const message = startupT("startup.error.module", { module: "workspace.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  if (!window.PLOTYPUS_PROPERTIES) {
    const message = startupT("startup.error.module", { module: "properties.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  const {
    inflateRect,
    outsideRectArea,
    pointInRect,
    rectArea,
    rectCenter,
    rectFromPosition,
    rectOverlapArea,
    rectsOverlap,
    segmentIntersectsRect,
    segmentsCross
  } = window.PLOTYPUS_GEOMETRY;
  const projectIo = window.PLOTYPUS_PROJECT_IO;
  const workspace = window.PLOTYPUS_WORKSPACE;
  const properties = window.PLOTYPUS_PROPERTIES;
  const i18n = window.PLOTYPUS_I18N;

  const labelLayoutPolicies = window.PLOTYPUS_LABEL_LAYOUT.create({
    clamp,
    clampLabelBaseline,
    comparePlacementOrder,
    createSlots,
    getDesignerHorizontalOffset,
    getDesignerLineOffset,
    getDesignerVerticalOffset,
    getBoundary: () => currentBoundary,
    getCategory,
    getCategoryMarkerSize,
    getLabelKey,
    labelBackgroundRect,
    labelBaselineForCenter,
    labelFontSize,
    labelKeyText,
    labelRect,
    labelVisualHeight,
    lineEnd,
    makeLabelBox,
    mapBoundsRect,
    outsideRectArea,
    preferredSide,
    rectOverlapArea,
    rectsOverlap,
    referenceSideOptions,
    segmentIntersectsRect,
    segmentsCross
  });
  const {
    applyManualLabelPositions: applyManualLabelPositionsFromLayout,
    candidateSideOrder,
    chooseBestCandidate,
    compactPathPoints,
    compatibleSideOrder,
    countSideOrderInversions,
    createCandidateForSide,
    createLabelCandidates,
    createOrderPreservingHorizontalSlots,
    createOrderPreservingVerticalSlots,
    createPerimeterCandidateMap,
    isBetterScaleFallback,
    layoutLabels: layoutLabelsWithoutManualPositions,
    layoutLabelsWithGreedyCandidates,
    layoutSeed,
    leaderPathLength,
    leaderPathPoints,
    leaderSegmentsForLabel,
    makeSeededRandom,
    makeLabelPlacement,
    maxAllowedLeaderLength,
    measurePlacementQuality,
    oppositeSide,
    optimizeDenseLayoutWithAnnealing,
    optimizeDenseLayoutWithLocalSearch,
    optimizeOrderedSideBands,
    placementQualityAcceptable,
    rememberLabelPositions: collectLabelPositions,
    scoreCandidate,
    scoreLayout,
    sameLabelPlacement,
    weights: labelPlacementWeights
  } = labelLayoutPolicies;

  const fallbackRegionColours = ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"];
  const customMarkerIconRules = Object.freeze({
    maxBytes: 256 * 1024,
    minDimension: 8,
    maxDimension: 512,
    allowedTypes: new Set(["image/png", "image/webp"])
  });
  const boundarySources = appConfig.boundarySources || {};
  const sampleRows = cloneConfigList(appConfig.sampleRows);
  const mapStylePresets = appConfig.mapStylePresets || window.MAP_APP_STYLE_PRESETS || appConfig.fallbackMapStylePresets || {
    "goc-green": {
      label: "GoC green",
      stylesheet: "themes/goc-green.css",
      regionColours: fallbackRegionColours,
      categoryStyles: [
        { colour: "#444444", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#555555", markerSize: 10, lineWidth: 2 }
      ]
    }
  };
  const propertiesDrawerMedia = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1080px)")
    : { matches: false, addEventListener() {}, addListener() {} };
  const csvColumnAliases = appConfig.csvColumnAliases || {
    name: ["name", "project", "project name"],
    nameFr: ["name_fr", "nom", "nom du projet", "french name", "fr name", "project fr", "project name fr", "nom_fr"],
    footnote: ["footnote", "footnote marker", "note", "superscript"],
    type: ["type", "category", "project type"],
    typeFr: ["type_fr", "type fr", "categorie", "category fr", "french type"],
    priority: ["priority", "label priority", "importance", "rank"],
    lon: ["lon", "longitude", "long"],
    lat: ["lat", "latitude"],
    hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line"]
  };
  const tableFields = appConfig.tableFields || ["name", "footnote", "type", "priority", "lon", "lat"];
  const layoutDefaults = appConfig.layoutDefaults || {
    bookSizeInput: "letter",
    imageSizeInput: "full",
    labelSizeInput: 12,
    mapScaleInput: 100,
    markerSizeInput: 10,
    lineWidthInput: 2,
    labelCharsInput: 24
  };
  const storageKeys = appConfig.storageKeys || {};
  const layoutPreferencesStorageKey = storageKeys.layoutPreferences || "plotypus.layoutPreferences";
  const propertiesPanelStorageKey = storageKeys.propertiesPanel || "plotypus.propertiesPanel";
  const uiLanguageStorageKey = storageKeys.uiLanguage || "plotypus.uiLanguage";
  const imageSizePresets = appConfig.imageSizePresets || {};
  const regionPresetOptions = appConfig.regionPresetOptions || { canada: [], world: [] };
  const markerShapes = cloneConfigList(appConfig.markerShapes);
  const configuredColourPresets = cloneConfigList(appConfig.categoryColourPresets);
  const colourPresets = configuredColourPresets.length ? configuredColourPresets : window.MAP_APP_CATEGORY_COLOUR_PRESETS || [];
  const fontOptions = cloneConfigList(appConfig.fontOptions);
  const iconPaths = window.PLOTYPUS_ICON_PATHS || {};
  const configuredCategorySettings = cloneConfigList(appConfig.categorySettings);
  const categorySettings = configuredCategorySettings.length ? configuredCategorySettings : [
    {
      id: "referred",
      label: "Referred Project",
      labelFr: "Projets soumis",
      defaultLabel: "Referred Project",
      shape: "circle",
      colour: "#444444",
      stroke: "#ffffff",
      markerSize: 10,
      lineWidth: 2,
      markerSizeCustom: false,
      lineWidthCustom: false,
      collapsed: false,
      removable: false
    },
    {
      id: "strategy",
      label: "Transformative Strategy",
      labelFr: "Stratégies de transformation",
      defaultLabel: "Transformative Strategy",
      shape: "square",
      colour: "#ffffff",
      stroke: "#555555",
      markerSize: 10,
      lineWidth: 2,
      markerSizeCustom: false,
      lineWidthCustom: false,
      collapsed: false,
      removable: true
    }
  ];
  categorySettings.forEach(category => {
    category.labelFr = String(category.labelFr || "").trim();
    if (!category.defaultLabel) category.defaultLabel = category.label;
    category.customIcon = normalizeCustomMarkerIcon(category.customIcon);
  });

  const els = {
    tableBody: document.querySelector("#projectTable tbody"),
    projectTable: document.querySelector("#projectTable"),
    projectTableSummary: document.querySelector("#projectTableSummary"),
    projectTableEmptyState: document.querySelector("#projectTableEmptyState"),
    projectTableFilters: Array.from(document.querySelectorAll("[data-project-filter]")),
    projectFilterSelect: document.querySelector("#projectFilterSelect"),
    csvImportPreview: document.querySelector("#csvImportPreview"),
    regionTableBody: document.querySelector("#regionTable tbody"),
    tablePanelTitle: document.querySelector("#tablePanelTitle"),
    projectTableTab: document.querySelector("#projectTableTab"),
    categoriesTableTab: document.querySelector("#categoriesTableTab"),
    regionTableTab: document.querySelector("#regionTableTab"),
    translateTableTab: document.querySelector("#translateTableTab"),
    previewTableTab: document.querySelector("#previewTableTab"),
    qualityTableTab: document.querySelector("#qualityTableTab"),
    projectTablePane: document.querySelector("#projectTablePane"),
    categoriesTablePane: document.querySelector("#categoriesTablePane"),
    regionTablePane: document.querySelector("#regionTablePane"),
    translateTablePane: document.querySelector("#translateTablePane"),
    previewTablePane: document.querySelector("#previewTablePane"),
    qualityTablePane: document.querySelector("#qualityTablePane"),
    tableActions: Array.from(document.querySelectorAll(".table-actions")),
    workspaceSummaryMode: document.querySelector("#workspaceSummaryMode"),
    workspaceSummaryHeadline: document.querySelector("#workspaceSummaryHeadline"),
    workspaceSummaryMetrics: document.querySelector("#workspaceSummaryMetrics"),
    translationGroups: document.querySelector("#translationGroups"),
    translationProgressText: document.querySelector("#translationProgressText"),
    translationProgressBar: document.querySelector("#translationProgressBar"),
    translationDirectionText: document.querySelector("#translationDirectionText"),
    translationPasteHint: document.querySelector("#translationPasteHint"),
    translationFilters: Array.from(document.querySelectorAll("[data-translation-filter]")),
    pasteTranslationColumnBtn: document.querySelector("#pasteTranslationColumnBtn"),
    propertiesTitle: document.querySelector("#propertiesTitle"),
    propertiesSubtitle: document.querySelector("#propertiesSubtitle"),
    propertiesPanel: document.querySelector("#propertiesPanel"),
    propertiesCollapseBtn: document.querySelector("#propertiesCollapseBtn"),
    propertiesResizeHandle: document.querySelector("#propertiesResizeHandle"),
    propertiesIcon: document.querySelector("#propertiesIcon"),
    previewDisplayPropertiesSection: document.querySelector("#previewDisplayPropertiesSection"),
    previewInteractionPropertiesSection: document.querySelector("#previewInteractionPropertiesSection"),
    propertiesDescription: document.querySelector("#propertiesDescription"),
    propertiesSelectionControls: document.querySelector("#propertiesSelectionControls"),
    applyRegionValueColoursBtn: document.querySelector("#applyRegionValueColoursBtn"),
    resetRegionValuesBtn: document.querySelector("#resetRegionValuesBtn"),
    themeStylesheet: document.querySelector("#themeStylesheet"),
    csvInput: document.querySelector("#csvInput"),
    projectInput: document.querySelector("#projectInput"),
    ribbonUndoBtn: document.querySelector("#ribbonUndoBtn"),
    ribbonOpenProjectBtn: document.querySelector("#ribbonOpenProjectBtn"),
    ribbonSaveProjectBtn: document.querySelector("#ribbonSaveProjectBtn"),
    ribbonLoadSampleBtn: document.querySelector("#ribbonLoadSampleBtn"),
    ribbonImportCsvBtn: document.querySelector("#ribbonImportCsvBtn"),
    ribbonExportCsvBtn: document.querySelector("#ribbonExportCsvBtn"),
    exportMenuBtn: document.querySelector("#exportMenuBtn"),
    exportMenu: document.querySelector("#exportMenu"),
    ribbonExportSvgBtn: document.querySelector("#ribbonExportSvgBtn"),
    ribbonExportPngBtn: document.querySelector("#ribbonExportPngBtn"),
    exportLanguageNotice: document.querySelector("#exportLanguageNotice"),
    addRowBtn: document.querySelector("#addRowBtn"),
    addPointsBtn: document.querySelector("#addPointsBtn"),
    bulkPriorityInput: document.querySelector("#bulkPriorityInput"),
    bulkClearCoordinatesBtn: document.querySelector("#bulkClearCoordinatesBtn"),
    projectImportCsvBtn: document.querySelector("#projectImportCsvBtn"),
    deleteSelectedBtn: document.querySelector("#deleteSelectedBtn"),
    clearRowsBtn: document.querySelector("#clearRowsBtn"),
    bookSizeInput: document.querySelector("#bookSizeInput"),
    imageSizeInput: document.querySelector("#imageSizeInput"),
    mapHost: document.querySelector("#mapHost"),
    previewEmptyState: document.querySelector("#previewEmptyState"),
    previewErrorState: document.querySelector("#previewErrorState"),
    canvasPlaceholder: document.querySelector("#canvasPlaceholder"),
    previewLoadSampleBtn: document.querySelector("#previewLoadSampleBtn"),
    previewImportCsvBtn: document.querySelector("#previewImportCsvBtn"),
    canvasToolbar: document.querySelector("#canvasToolbar"),
    canvasQualityPill: document.querySelector("#canvasQualityPill"),
    canvasZoomOutBtn: document.querySelector("#canvasZoomOutBtn"),
    canvasZoomReadout: document.querySelector("#canvasZoomReadout"),
    canvasZoomInBtn: document.querySelector("#canvasZoomInBtn"),
    canvasAutoPlaceBtn: document.querySelector("#canvasAutoPlaceBtn"),
    canvasPlaceLabelsOnlyBtn: document.querySelector("#canvasPlaceLabelsOnlyBtn"),
    labelSizeInput: document.querySelector("#labelSizeInput"),
    mapScaleInput: document.querySelector("#mapScaleInput"),
    markerSizeInput: document.querySelector("#markerSizeInput"),
    lineWidthInput: document.querySelector("#lineWidthInput"),
    labelCharsInput: document.querySelector("#labelCharsInput"),
    fontFamilyInput: document.querySelector("#fontFamilyInput"),
    mapLanguageInput: document.querySelector("#mapLanguageInput"),
    previewLanguageInput: document.querySelector("#previewLanguageInput"),
    uiLanguageButtons: Array.from(document.querySelectorAll("[data-ui-language]")),
    showLegendInput: document.querySelector("#showLegendInput"),
    showCalloutsInput: document.querySelector("#showCalloutsInput"),
    compactFurnitureInput: document.querySelector("#compactFurnitureInput"),
    showLineCasingInput: document.querySelector("#showLineCasingInput"),
    routeDenseLeadersInput: document.querySelector("#routeDenseLeadersInput"),
    showDistanceMarkersInput: document.querySelector("#showDistanceMarkersInput"),
    lockMarkerCoordinatesInput: document.querySelector("#lockMarkerCoordinatesInput"),
    categoryList: document.querySelector("#categoryList"),
    addCategoryBtn: document.querySelector("#addCategoryBtn"),
    regionSummary: document.querySelector("#regionSummary"),
    selectAllRegionsBtn: document.querySelector("#selectAllRegionsBtn"),
    clearRegionsBtn: document.querySelector("#clearRegionsBtn"),
    selectProjectRegionsBtn: document.querySelector("#selectProjectRegionsBtn"),
    resetRegionColoursBtn: document.querySelector("#resetRegionColoursBtn"),
    boundaryInput: document.querySelector("#boundaryInput"),
    mapStylePresetInput: document.querySelector("#mapStylePresetInput"),
    regionPresetInput: document.querySelector("#regionPresetInput"),
    svg: d3.select("#mapSvg"),
    statusBox: document.querySelector("#statusBox"),
    qualitySummaryBanner: document.querySelector("#qualitySummaryBanner"),
    qualityMetricsPanel: document.querySelector("#qualityMetricsPanel"),
    performanceTelemetryStatus: document.querySelector("#performanceTelemetryStatus"),
    performanceTelemetryMetrics: document.querySelector("#performanceTelemetryMetrics"),
    mapDetailsBtn: document.querySelector("#mapDetailsBtn"),
    propertiesToggleBtn: document.querySelector("#propertiesToggleBtn"),
    frMetaWarning: document.querySelector("#frMetaWarning"),
    mapDetailsDialog: document.querySelector("#mapDetailsDialog"),
    mapDetailsForm: document.querySelector("#mapDetailsForm"),
    mapTitleEnInput: document.querySelector("#mapTitleEnInput"),
    mapTitleFrInput: document.querySelector("#mapTitleFrInput"),
    mapTextEnInput: document.querySelector("#mapTextEnInput"),
    mapTextFrInput: document.querySelector("#mapTextFrInput"),
    pointCatalogDialog: document.querySelector("#pointCatalogDialog"),
    pointCatalogTabs: Array.from(document.querySelectorAll("[data-catalog-view]")),
    pointCatalogPresetsPanel: document.querySelector("#pointCatalogPresetsPanel"),
    pointCatalogSourcesPanel: document.querySelector("#pointCatalogSourcesPanel"),
    pointCatalogScope: document.querySelector("#pointCatalogScope"),
    catalogAddPointsBtn: document.querySelector("#catalogAddPointsBtn"),
    catalogImportCsvBtn: document.querySelector("#catalogImportCsvBtn"),
    csvMapDialog: document.querySelector("#csvMapDialog"),
    csvMapFileMeta: document.querySelector("#csvMapFileMeta"),
    csvMapRows: document.querySelector("#csvMapRows"),
    csvFirstRowHeadersInput: document.querySelector("#csvFirstRowHeadersInput"),
    csvSavePresetInput: document.querySelector("#csvSavePresetInput"),
    confirmCsvMapBtn: document.querySelector("#confirmCsvMapBtn"),
    shortcutsOverlay: document.querySelector("#shortcutsOverlay"),
    closeShortcutsBtn: document.querySelector("#closeShortcutsBtn")
  };

  let canadaGeo = null;
  let lastLayout = null;
  let lastImportMessages = [];
  const manualLayoutHistoryLimit = 25;
  let pendingCsvImport = null;
  let pendingCsvMapping = null;
  let nextRowId = 1;
  let regionVisibility = {};
  let regionFills = {};
  let regionValues = {};
  let regionColourOverrides = {};
  const defaultMapStylePreset = appConfig.defaultMapStylePreset || Object.keys(mapStylePresets)[0] || "goc-green";
  let currentMapStylePreset = defaultMapStylePreset;
  let currentBoundary = "canada";
  let renderOutputMode = "web";
  let mapScaleControlsVisible = false;
  let draggedCategoryId = null;
  let activeCategoryDropEditor = null;
  let activeCategoryDropPlacement = null;
  let activePropertiesSelection = null;
  let activeProjectFilter = "all";
  let activeTranslationFilter = "all";
  let activeTranslationEntryId = "";
  let activePointCatalogView = "presets";
  let selectedPointCatalogPresets = new Set();
  const selectableProjectCellFields = ["name", "footnote", "type", "priority", "lon", "lat", "status", "hideLine"];
  const selectedProjectCells = new Set();
  let projectCellSelectionAnchor = null;
  let lastProjectCellPointerSelectionAt = 0;
  let projectTableUxRefreshFrame = 0;
  let activeDataTable = "preview";
  let activeAuthoringLanguage = "en";
  let currentUiLanguage = "en";
  let activeCategoryId = categorySettings[0] ? categorySettings[0].id : "";
  let currentMapLanguage = "en";
  const languageLayoutStates = {
    en: { manualLabelPositions: {}, manualBoxPositions: {}, history: [], mapScale: null },
    fr: { manualLabelPositions: {}, manualBoxPositions: {}, history: [], mapScale: null }
  };
  let manualLabelPositions = languageLayoutStates.en.manualLabelPositions;
  let manualBoxPositions = languageLayoutStates.en.manualBoxPositions;
  let manualLayoutHistory = languageLayoutStates.en.history;
  const chromeTranslations = {
    mapTitle: { en: "", fr: "" },
    mapSubtitle: { en: "", fr: "" },
    legendHeading: { en: "Legend", fr: "Légende" },
    calloutHeading: { en: "No-coordinate callouts", fr: "Repères sans coordonnées" },
    footnotesSource: { en: "", fr: "" }
  };
  const mapDetails = {
    titleEn: "",
    titleFr: "",
    textEn: "",
    textFr: ""
  };
  let reactMapDetailsHandle = null;
  let reactAdaptersLoadPromise = null;
  let reactMapDetailsDraft = null;
  let reactMapDetailsTarget = null;
  let reactProjectToolbarHandle = null;
  let reactProjectToolbarTarget = null;
  let reactPropertiesPanelHandle = null;
  let reactPropertiesPanelTarget = null;
  let pendingPreviewRefresh = false;
  let pendingPreviewRefreshOptions = null;
  let pendingRenderFrame = null;
  let pendingRenderFallbackTimer = null;
  let pendingRenderOptions = null;
  let shortcutsReturnFocus = null;
  const appUndoHistoryLimit = 25;
  const appUndoHistory = [];
  const inputUndoSnapshots = new WeakMap();
  let restoringAppUndoSnapshot = false;
  const languageLayoutCache = new Map();
  const languageLayoutCacheLimit = 6;
  const performanceBudgetConfig = appConfig.performanceBudgets || {};
  const renderPerformanceBudgets = Object.freeze({
    renderMs: Math.max(1, Number(performanceBudgetConfig.renderMs) || 200),
    autoPlaceMs: Math.max(1, Number(performanceBudgetConfig.autoPlaceMs) || 1500),
    exportMs: Math.max(1, Number(performanceBudgetConfig.exportMs) || 800),
    sampleWindow: Math.max(5, Math.min(100, Number(performanceBudgetConfig.sampleWindow) || 30))
  });
  const renderPerformanceSamples = [];
  let scheduledRenderRequestedAt = null;
  let previewBusyStartedAt = 0;
  let previewBusyClearTimer = null;
  let previewBusyToken = 0;

  function on(element, eventName, handler) {
    if (element) element.addEventListener(eventName, handler);
  }

  function setPreviewBusy(isBusy) {
    if (!els.mapHost) return;
    if (isBusy) {
      previewBusyToken += 1;
      if (previewBusyClearTimer) {
        window.clearTimeout(previewBusyClearTimer);
        previewBusyClearTimer = null;
      }
      previewBusyStartedAt = performanceNow();
      els.mapHost.classList.add("is-rendering");
      els.mapHost.setAttribute("aria-busy", "true");
      return;
    }

    const token = previewBusyToken;
    const minimumVisibleMs = 520;
    const elapsedMs = previewBusyStartedAt ? performanceNow() - previewBusyStartedAt : minimumVisibleMs;
    const remainingMs = Math.max(0, minimumVisibleMs - elapsedMs);
    const clearBusy = () => {
      if (token !== previewBusyToken) return;
      previewBusyClearTimer = null;
      previewBusyStartedAt = 0;
      els.mapHost.classList.remove("is-rendering");
      els.mapHost.setAttribute("aria-busy", "false");
    };

    if (remainingMs > 0) {
      previewBusyClearTimer = window.setTimeout(clearBusy, remainingMs);
    } else {
      clearBusy();
    }
  }

  function performanceNow() {
    return window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
  }

  function renderPerformanceKind(options = {}) {
    if (renderOutputMode !== "web") return "export";
    return options.autoPlace ? "autoPlace" : "render";
  }

  function renderBudgetForKind(kind) {
    if (kind === "autoPlace") return renderPerformanceBudgets.autoPlaceMs;
    if (kind === "export") return renderPerformanceBudgets.exportMs;
    return renderPerformanceBudgets.renderMs;
  }

  function percentile(values, percentileValue) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentileValue * sorted.length) - 1));
    return sorted[index];
  }

  function getRenderPerformanceSnapshot() {
    const samples = renderPerformanceSamples.map(sample => ({ ...sample }));
    const latestByKind = Object.fromEntries(["render", "autoPlace", "export"].map(kind => [
      kind,
      samples.slice().reverse().find(sample => sample.kind === kind) || null
    ]));
    const budgetRatios = samples.map(sample => sample.totalMs / sample.budgetMs);
    return {
      budgets: { ...renderPerformanceBudgets },
      samples,
      latest: samples[samples.length - 1] || null,
      latestByKind,
      p95DurationMs: percentile(samples.map(sample => sample.durationMs), 0.95),
      p95TotalMs: percentile(samples.map(sample => sample.totalMs), 0.95),
      p95BudgetRatio: percentile(budgetRatios, 0.95),
      overBudgetCount: samples.filter(sample => sample.overBudget).length
    };
  }

  function performanceMetric(label, sample, budgetMs) {
    if (!sample) {
      return `<div class="performance-metric" data-state="neutral"><span>${escapeHtml(label)}</span><strong>${escapeHtml(t("performance.notRun"))}</strong><small>${escapeHtml(t("performance.budget", { value: Math.round(budgetMs) }))}</small></div>`;
    }
    const queuedPrefix = sample.queueMs ? t("performance.renderQueued", { render: Math.round(sample.durationMs), queued: Math.round(sample.queueMs) }) : "";
    return `
      <div class="performance-metric" data-state="${sample.overBudget ? "warning" : "ok"}">
        <span>${escapeHtml(label)}</span>
        <strong>${Math.round(sample.totalMs)} ms</strong>
        <small>${escapeHtml(queuedPrefix)}${escapeHtml(t("performance.budget", { value: Math.round(sample.budgetMs) }))}</small>
      </div>`;
  }

  function refreshPerformanceTelemetry() {
    if (!els.performanceTelemetryMetrics || !els.performanceTelemetryStatus) return;
    const snapshot = getRenderPerformanceSnapshot();
    const p95Ratio = snapshot.p95BudgetRatio;
    const p95State = p95Ratio !== null && p95Ratio > 1 ? "warning" : p95Ratio === null ? "neutral" : "ok";
    const p95Value = p95Ratio === null ? t("performance.notRun") : `${Math.round(p95Ratio * 100)}%`;
    els.performanceTelemetryMetrics.innerHTML = `
      ${performanceMetric(t("performance.latestRender"), snapshot.latestByKind.render, renderPerformanceBudgets.renderMs)}
      ${performanceMetric(t("performance.latestAutoPlace"), snapshot.latestByKind.autoPlace, renderPerformanceBudgets.autoPlaceMs)}
      ${performanceMetric(t("performance.latestExportRender"), snapshot.latestByKind.export, renderPerformanceBudgets.exportMs)}
      <div class="performance-metric" data-state="${p95State}"><span>${escapeHtml(t("performance.rollingP95"))}</span><strong>${escapeHtml(p95Value)}</strong><small>${escapeHtml(t("performance.samples", { count: snapshot.samples.length, total: renderPerformanceBudgets.sampleWindow }))}</small></div>
      <div class="performance-metric" data-state="${snapshot.overBudgetCount ? "warning" : snapshot.samples.length ? "ok" : "neutral"}"><span>${escapeHtml(t("performance.budgetWarnings"))}</span><strong>${snapshot.overBudgetCount}</strong><small>${escapeHtml(t("performance.currentWindow"))}</small></div>`;
    els.performanceTelemetryStatus.textContent = snapshot.overBudgetCount ? t("performance.overBudget", { count: snapshot.overBudgetCount }) : snapshot.samples.length ? t("performance.withinBudgets") : t("quality.performance.none");
    els.performanceTelemetryStatus.dataset.state = snapshot.overBudgetCount ? "warning" : snapshot.samples.length ? "ok" : "neutral";
  }

  function recordRenderPerformance(options, startedAt, completedAt, error = null) {
    const kind = renderPerformanceKind(options);
    const durationMs = Math.max(0, completedAt - startedAt);
    const budgetMs = renderBudgetForKind(kind);
    const queuedAt = Number(options.__telemetryQueuedAt);
    const queueMs = Number.isFinite(queuedAt) ? Math.max(0, startedAt - queuedAt) : 0;
    const totalMs = queueMs + durationMs;
    const sample = {
      kind,
      source: options.__telemetrySource || "direct",
      durationMs: Number(durationMs.toFixed(2)),
      queueMs: Number(queueMs.toFixed(2)),
      totalMs: Number(totalMs.toFixed(2)),
      budgetMs,
      overBudget: totalMs > budgetMs,
      rowCount: els.tableBody ? els.tableBody.querySelectorAll("tr").length : 0,
      language: currentMapLanguage,
      outputMode: renderOutputMode,
      error: error ? String(error.message || error) : "",
      timestamp: Date.now()
    };
    renderPerformanceSamples.push(sample);
    if (renderPerformanceSamples.length > renderPerformanceBudgets.sampleWindow) renderPerformanceSamples.shift();
    refreshPerformanceTelemetry();
    if (sample.overBudget && window.console && typeof window.console.warn === "function") {
      console.warn(`[Plotypus performance] ${kind} took ${Math.round(totalMs)} ms including queue time (budget ${budgetMs} ms).`, sample);
    }
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("plotypus:render-performance", { detail: { ...sample } }));
    }
    return sample;
  }

  window.PLOTYPUS_RENDER_PERFORMANCE = Object.freeze({
    budgets: { ...renderPerformanceBudgets },
    snapshot: getRenderPerformanceSnapshot
  });

  function mergeRenderOptions(current, next) {
    const currentAutoPlace = Boolean(current && current.autoPlace);
    const nextAutoPlace = Boolean(next && next.autoPlace);
    return {
      ...(current || {}),
      ...(next || {}),
      autoPlace: currentAutoPlace || nextAutoPlace,
      autoPlaceResize: nextAutoPlace
        ? next.autoPlaceResize !== false
        : currentAutoPlace
          ? current.autoPlaceResize !== false
          : undefined
    };
  }

  function cloneCoordinateMap(map) {
    return Object.fromEntries(
      Object.entries(map || {}).map(([key, value]) => [key, { ...value }])
    );
  }

  function normalizeStoredCoordinateMap(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([key, position]) => {
      if (!position || typeof position !== "object" || Array.isArray(position)) return [];
      const x = Number(position.x);
      const y = Number(position.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
      const normalized = { ...position, x, y };
      if (position.width !== undefined && Number.isFinite(Number(position.width))) normalized.width = Number(position.width);
      if (position.height !== undefined && Number.isFinite(Number(position.height))) normalized.height = Number(position.height);
      return [[String(key), normalized]];
    }));
  }

  function getLanguageLayoutState(language = currentMapLanguage) {
    return languageLayoutStates[normalizeMapLanguage(language)];
  }

  function rememberCurrentLanguageMapScale() {
    const state = getLanguageLayoutState();
    if (state && els.mapScaleInput) state.mapScale = normalizeMapScale(els.mapScaleInput.value);
  }

  function syncCurrentLanguageLayoutState() {
    const state = getLanguageLayoutState();
    state.manualLabelPositions = manualLabelPositions;
    state.manualBoxPositions = manualBoxPositions;
    state.history = manualLayoutHistory;
    rememberCurrentLanguageMapScale();
  }

  function setCurrentManualLabelPositions(value) {
    manualLabelPositions = cloneCoordinateMap(value);
    getLanguageLayoutState().manualLabelPositions = manualLabelPositions;
  }

  function setCurrentManualBoxPositions(value) {
    manualBoxPositions = cloneCoordinateMap(value);
    getLanguageLayoutState().manualBoxPositions = manualBoxPositions;
  }

  function setCurrentManualLayoutHistory(value = []) {
    manualLayoutHistory = Array.isArray(value) ? value : [];
    getLanguageLayoutState().history = manualLayoutHistory;
  }

  function activateLanguageLayoutState(language, fallbackScale = null) {
    const state = getLanguageLayoutState(language);
    manualLabelPositions = state.manualLabelPositions;
    manualBoxPositions = state.manualBoxPositions;
    manualLayoutHistory = state.history;
    const nextScale = Number.isFinite(Number(state.mapScale))
      ? normalizeMapScale(state.mapScale)
      : fallbackScale === null
        ? null
        : normalizeMapScale(fallbackScale);
    if (nextScale !== null && els.mapScaleInput) {
      els.mapScaleInput.value = nextScale;
      state.mapScale = nextScale;
      updateCanvasToolbar();
    }
    updateUndoButtonState();
  }

  function clearAllLanguageLayouts() {
    ["en", "fr"].forEach(language => {
      languageLayoutStates[language] = {
        manualLabelPositions: {},
        manualBoxPositions: {},
        history: [],
        mapScale: null
      };
    });
    activateLanguageLayoutState(currentMapLanguage, els.mapScaleInput ? els.mapScaleInput.value : null);
  }

  function serializeLanguageLayouts() {
    syncCurrentLanguageLayoutState();
    return Object.fromEntries(["en", "fr"].map(language => {
      const state = languageLayoutStates[language];
      return [language, {
        manualLabelPositions: cloneCoordinateMap(state.manualLabelPositions),
        manualBoxPositions: cloneCoordinateMap(state.manualBoxPositions),
        mapScale: Number.isFinite(Number(state.mapScale)) ? normalizeMapScale(state.mapScale) : null
      }];
    }));
  }

  function restoreLanguageLayouts(project, language) {
    ["en", "fr"].forEach(key => {
      const saved = project && project.languageLayouts && project.languageLayouts[key];
      languageLayoutStates[key] = {
        manualLabelPositions: normalizeStoredCoordinateMap(saved && saved.manualLabelPositions),
        manualBoxPositions: normalizeStoredCoordinateMap(saved && saved.manualBoxPositions),
        history: [],
        mapScale: saved && Number.isFinite(Number(saved.mapScale)) ? normalizeMapScale(saved.mapScale) : null
      };
    });

    const targetLanguage = normalizeMapLanguage(language);
    if (!project.languageLayouts || typeof project.languageLayouts !== "object") {
      languageLayoutStates[targetLanguage].manualLabelPositions = normalizeStoredCoordinateMap(project.manualLabelPositions);
      languageLayoutStates[targetLanguage].manualBoxPositions = normalizeStoredCoordinateMap(project.manualBoxPositions);
      const legacyScale = project.settings && project.settings.mapScale;
      languageLayoutStates[targetLanguage].mapScale = Number.isFinite(Number(legacyScale)) ? normalizeMapScale(legacyScale) : null;
    }
    currentMapLanguage = targetLanguage;
    activateLanguageLayoutState(currentMapLanguage, els.mapScaleInput ? els.mapScaleInput.value : null);
  }

  function cloneManualLayoutState() {
    return {
      manualLabelPositions: cloneCoordinateMap(manualLabelPositions),
      manualBoxPositions: cloneCoordinateMap(manualBoxPositions)
    };
  }

  function clonePlainObject(value = {}) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : {};
  }

  function createAppUndoSnapshot(label) {
    return {
      label,
      rows: getRows(),
      categories: clonePlainObject(categorySettings),
      settings: getSettings(),
      boundary: currentBoundary,
      mapStyle: currentMapStylePreset,
      mapDetails: clonePlainObject(mapDetails),
      chromeTranslations: clonePlainObject(chromeTranslations),
      authoringLanguage: activeAuthoringLanguage,
      mapLanguage: currentMapLanguage,
      regionVisibility: clonePlainObject(regionVisibility),
      regionFills: clonePlainObject(regionFills),
      regionColourOverrides: clonePlainObject(regionColourOverrides),
      regionValues: clonePlainObject(regionValues),
      languageLayouts: serializeLanguageLayouts()
    };
  }

  function pushAppUndoHistory(label) {
    if (restoringAppUndoSnapshot) return false;
    pushAppUndoSnapshot(createAppUndoSnapshot(label));
    return true;
  }

  function pushAppUndoSnapshot(snapshot) {
    if (restoringAppUndoSnapshot || !snapshot) return false;
    appUndoHistory.push(snapshot);
    if (appUndoHistory.length > appUndoHistoryLimit) appUndoHistory.shift();
    updateUndoButtonState();
    return true;
  }

  function restoreChromeTranslations(snapshotTranslations = {}) {
    Object.keys(chromeTranslations).forEach(key => {
      chromeTranslations[key] = {
        ...(chromeTranslations[key] || { en: "", fr: "" }),
        ...(snapshotTranslations[key] || {})
      };
    });
  }

  async function undoLastAppStateChange() {
    const snapshot = appUndoHistory.pop();
    updateUndoButtonState();
    if (!snapshot) return false;
    restoringAppUndoSnapshot = true;
    try {
      setAuthoringLanguage(snapshot.authoringLanguage || activeAuthoringLanguage);
      const boundaryChanged = snapshot.boundary && snapshot.boundary !== currentBoundary;
      currentBoundary = snapshot.boundary || currentBoundary;
      if (els.boundaryInput) els.boundaryInput.value = currentBoundary;
      applyMapStylePreset(snapshot.mapStyle || currentMapStylePreset, { applyMapColours: false, render: false });
      applySettings(snapshot.settings || {});
      Object.keys(mapDetails).forEach(key => { mapDetails[key] = String(snapshot.mapDetails && snapshot.mapDetails[key] || ""); });
      restoreChromeTranslations(snapshot.chromeTranslations);
      applyCategorySettings(snapshot.categories || []);
      regionVisibility = clonePlainObject(snapshot.regionVisibility);
      regionFills = normalizeColourMap(snapshot.regionFills || {});
      regionColourOverrides = clonePlainObject(snapshot.regionColourOverrides);
      regionValues = clonePlainObject(snapshot.regionValues);
      restoreLanguageLayouts({ languageLayouts: snapshot.languageLayouts || {} }, snapshot.mapLanguage || currentMapLanguage);
      setRows(snapshot.rows || [], [], { preserveManualPositions: true, render: false, resetProperties: false });
      if (boundaryChanged) await loadGeo();
      renderRegionControls();
      updateMapDetailsState();
      updateWorkspaceSummary();
      updateExportLanguageNotice();
      if (activeDataTable === "translate") renderTranslationWorkbench();
      requestPreviewRefresh();
      renderPropertiesForActiveState();
      setStatusMessage(t("status.undoEdit", { label: translateUndoLabel(snapshot.label) }), "ok");
    } finally {
      restoringAppUndoSnapshot = false;
    }
    return true;
  }

  function hasManualLayoutState(state) {
    return Boolean(
      state &&
      (Object.keys(state.manualLabelPositions || {}).length ||
        Object.keys(state.manualBoxPositions || {}).length)
    );
  }

  function pushManualLayoutHistory(label, options = {}) {
    const state = cloneManualLayoutState();
    if (!options.allowEmpty && !hasManualLayoutState(state)) return false;
    manualLayoutHistory.push({ label, ...state });
    if (manualLayoutHistory.length > manualLayoutHistoryLimit) manualLayoutHistory.shift();
    updateUndoButtonState();
    refreshDocumentPropertiesIfActive();
    return true;
  }

  function clearManualLayoutHistory() {
    if (!manualLayoutHistory.length) return;
    setCurrentManualLayoutHistory([]);
    updateUndoButtonState();
    refreshDocumentPropertiesIfActive();
  }

  function updateUndoButtonState() {
    if (els.ribbonUndoBtn) els.ribbonUndoBtn.disabled = manualLayoutHistory.length === 0 && appUndoHistory.length === 0;
  }

  function undoLastManualLayoutChange() {
    if (appUndoHistory.length) {
      undoLastAppStateChange();
      return;
    }
    const previous = manualLayoutHistory.pop();
    updateUndoButtonState();
    if (!previous) {
      setStatusMessage(t("status.noManualLayoutUndo"), "warning");
      refreshDocumentPropertiesIfActive();
      return;
    }
    setCurrentManualLabelPositions(previous.manualLabelPositions);
    setCurrentManualBoxPositions(previous.manualBoxPositions);
    scheduleRender();
    setDocumentPropertiesContext();
    setStatusMessage(t("status.undoEdit", { label: translateUndoLabel(previous.label, "status.lastLayoutChange") }), "ok");
  }

  function scheduleRender(options = {}) {
    pendingRenderOptions = mergeRenderOptions(pendingRenderOptions, options);
    setPreviewBusy(true);
    if (pendingRenderFrame !== null) return;
    scheduledRenderRequestedAt = performanceNow();

    const runScheduledRender = () => {
      if (pendingRenderFrame === null) return;
      if (pendingRenderFallbackTimer !== null) {
        window.clearTimeout(pendingRenderFallbackTimer);
        pendingRenderFallbackTimer = null;
      }
      const renderOptions = pendingRenderOptions || {};
      const queuedAt = scheduledRenderRequestedAt;
      pendingRenderFrame = null;
      pendingRenderOptions = null;
      scheduledRenderRequestedAt = null;
      try {
        render({ ...renderOptions, __telemetrySource: "scheduled", __telemetryQueuedAt: queuedAt });
      } finally {
        setPreviewBusy(false);
      }
    };

    pendingRenderFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(runScheduledRender);
    });
    pendingRenderFallbackTimer = window.setTimeout(runScheduledRender, 160);
  }

  function getMapStylePreset(presetId = currentMapStylePreset) {
    return mapStylePresets[presetId] || mapStylePresets[defaultMapStylePreset] || Object.values(mapStylePresets)[0];
  }

  function getCurrentRegionColourSet() {
    const preset = getMapStylePreset();
    return preset.regionColours && preset.regionColours.length ? preset.regionColours : fallbackRegionColours;
  }

  function cleanType(type) {
    const raw = String(type || "").trim().toLowerCase();
    const matchedCategory = categorySettings.find(category => {
      const label = category.label.trim().toLowerCase();
      const defaultLabel = category.defaultLabel.trim().toLowerCase();
      return raw === category.id || raw === label || raw === defaultLabel;
    });
    if (matchedCategory) return matchedCategory.id;
    if ((raw === "strategy" || raw === "transformative" || raw.includes("transformative")) && hasCategory("strategy")) return "strategy";
    return getDefaultCategory().id;
  }

  function getCategory(type) {
    return categorySettings.find(category => category.id === cleanType(type)) || getDefaultCategory();
  }

  function getDefaultCategory() {
    return categorySettings.find(category => category.id === "referred") || categorySettings[0];
  }

  function hasCategory(categoryId) {
    return categorySettings.some(category => category.id === categoryId);
  }

  function renderRibbonIcons() {
    document.querySelectorAll("[data-icon]").forEach(element => {
      const icon = iconPaths[element.dataset.icon];
      if (!icon || element.querySelector(":scope > .button-icon")) return;
      element.insertAdjacentHTML("afterbegin", `
        <svg class="button-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${icon.join("")}
        </svg>
      `);
    });
    document.querySelectorAll("[data-setting-icon]").forEach(iconSlot => {
      const icon = iconPaths[iconSlot.dataset.settingIcon];
      if (!icon || iconSlot.querySelector("svg")) return;
      iconSlot.innerHTML = `
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          ${icon.join("")}
        </svg>
      `;
    });
  }

  function iconSvg(iconName, className = "") {
    const icon = iconPaths[iconName] || iconPaths["file-text"] || [];
    if (!icon.length) return "";
    const classAttribute = className ? ` class="${escapeHtml(className)}"` : "";
    return `<svg${classAttribute} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon.join("")}</svg>`;
  }

  function propertiesIconForSelection(selection) {
    const kind = selection && selection.kind;
    if (kind === "row" || kind === "project-data") return "map-pin";
    if (kind === "category") return "legend";
    if (kind === "region") return "regions";
    if (kind === "translation" || kind === "translation-entry") return "languages";
    if (kind === "quality") return "shield-check";
    if (kind === "map") return "regions";
    if (kind === "label") return "label-place";
    if (kind === "marker") return "map-pin";
    if (kind === "furniture") return "box";
    return "file-text";
  }

  function getCategoryLabel(type, language = currentMapLanguage) {
    const category = getCategory(type);
    if (language === "fr") return String(category.labelFr || category.label || "");
    return String(category.label || category.labelFr || "");
  }

  function getTypeOptions(selectedType, language = activeAuthoringLanguage) {
    return categorySettings.map(category => {
      const selected = cleanType(selectedType) === category.id ? " selected" : "";
      const label = language === "fr" ? category.labelFr || category.label : category.label || category.labelFr;
      return `<option value="${escapeHtml(category.id)}"${selected}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function updateTypeOptions() {
    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      const selectedType = cleanType(select.value);
      select.innerHTML = getTypeOptions(selectedType);
      select.value = selectedType;
      select.title = getCategoryLabel(selectedType, activeAuthoringLanguage);
    });
  }

  function updateProjectCoordinateDisplay() {
    getTableRows().forEach(tr => {
      const lonInput = tr.querySelector(".lon-input");
      const latInput = tr.querySelector(".lat-input");
      if (lonInput) lonInput.value = formatProjectCoordinate(lonInput.value);
      if (latInput) latInput.value = formatProjectCoordinate(latInput.value);
    });
  }

  function makeCategoryId(label) {
    const base = String(label || "category")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";
    let candidate = base;
    let index = 2;
    while (categorySettings.some(category => category.id === candidate)) {
      candidate = `${base}-${index}`;
      index += 1;
    }
    return candidate;
  }

  function normalizeMarkerShape(shape) {
    return markerShapes.some(option => option.value === shape) ? shape : "circle";
  }

  function optionalNumber(value) {
    if (value === "" || value === null || value === undefined) return "";
    const n = Number(value);
    return Number.isFinite(n) ? n : "";
  }

  function getCategoryMarkerSize(category, settings) {
    return optionalNumber(category.markerSize) || settings.markerSize;
  }

  function getCategoryLineWidth(category, settings) {
    return optionalNumber(category.lineWidth) || settings.lineWidth;
  }

  function normalizeCategorySizes(category, settings = getSettings()) {
    category.markerSize = optionalNumber(category.markerSize) || settings.markerSize;
    category.lineWidth = optionalNumber(category.lineWidth) || settings.lineWidth;
  }

  function syncDefaultCategorySizes(settings = getSettings()) {
    categorySettings.forEach(category => {
      if (!category.markerSizeCustom) category.markerSize = settings.markerSize;
      if (!category.lineWidthCustom) category.lineWidth = settings.lineWidth;
    });
  }

  function getPresetValueForColour(colour) {
    const preset = colourPresets.find(option => option.value.toLowerCase() === String(colour || "").toLowerCase());
    return preset ? preset.value : "";
  }

  function getMarkerShapeLabel(shape) {
    const value = typeof shape === "string" ? shape : shape && shape.value;
    const fallback = typeof shape === "string" ? shape : shape && shape.label || value || "";
    return tOr(`properties.category.shape.${value}`, fallback);
  }

  function getCategoryColourPresetLabel(preset) {
    if (!preset) return "";
    if (!preset.value) return t("properties.category.colour.custom");
    const colourKeyByValue = {
      "#26374a": "gocBlue",
      "#284162": "deepBlue",
      "#1c578a": "accessibleBlue",
      "#217346": "excelGreen",
      "#0b6b57": "mapGreen",
      "#7834bc": "purple",
      "#a05a00": "ochre",
      "#d3080c": "alertRed",
      "#444444": "charcoal",
      "#ffffff": "white"
    };
    const key = colourKeyByValue[String(preset.value).toLowerCase()];
    return key ? tOr(`properties.category.colour.${key}`, preset.label || preset.value) : preset.label || preset.value;
  }

  function getMapStylePresetLabel(presetId, preset) {
    return tOr(`properties.mapStyle.${presetId}`, preset && preset.label || presetId);
  }

  function tFor(language, key, params) {
    return i18n && typeof i18n.t === "function"
      ? i18n.t(normalizeUiLanguage(language), key, params)
      : key;
  }

  function tForOr(language, key, fallback, params) {
    const translated = tFor(language, key, params);
    return translated === key ? fallback : translated;
  }

  function getBoundaryLabel(boundary = currentBoundary, language = currentUiLanguage) {
    const source = boundarySources[boundary] || boundarySources.canada || {};
    return tForOr(language, `region.boundary.${boundary}`, source.label || boundary);
  }

  function isHexColour(value) {
    return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
  }

  function normalizeHexColour(value, fallback) {
    return isHexColour(value) ? value : fallback;
  }

  function normalizeColourMap(colourMap = {}) {
    return Object.entries(colourMap).reduce((acc, [key, value]) => {
      if (isHexColour(value)) acc[key] = value;
      return acc;
    }, {});
  }

  function isSafeCustomIconDataUrl(value) {
    return typeof value === "string" && /^data:image\/(?:png|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  function normalizeCustomMarkerIcon(icon) {
    if (!icon || typeof icon !== "object") return null;
    const mimeType = String(icon.mimeType || "").toLowerCase();
    const width = Math.round(Number(icon.width));
    const height = Math.round(Number(icon.height));
    const size = Math.round(Number(icon.size));
    const dataUrl = String(icon.dataUrl || "");
    if (!customMarkerIconRules.allowedTypes.has(mimeType)) return null;
    if (!isSafeCustomIconDataUrl(dataUrl)) return null;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    if (width < customMarkerIconRules.minDimension || height < customMarkerIconRules.minDimension) return null;
    if (width > customMarkerIconRules.maxDimension || height > customMarkerIconRules.maxDimension) return null;
    if (!Number.isFinite(size) || size < 1 || size > customMarkerIconRules.maxBytes) return null;
    return {
      dataUrl,
      mimeType,
      name: String(icon.name || "custom-marker").slice(0, 120),
      width,
      height,
      size
    };
  }

  function readImageDimensions(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      });
      image.onerror = () => reject(new Error(t("status.iconDecodeFailed")));
      image.src = dataUrl;
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(t("status.iconReadFailed")));
      reader.readAsDataURL(file);
    });
  }

  async function validateCustomMarkerIconFile(file) {
    if (!file) throw new Error(t("status.iconMissingFile"));
    const mimeType = String(file.type || "").toLowerCase();
    if (!customMarkerIconRules.allowedTypes.has(mimeType)) {
      throw new Error(t("status.iconUnsupportedType"));
    }
    if (file.size > customMarkerIconRules.maxBytes) {
      throw new Error(t("status.iconMaxFileSize", { size: Math.round(customMarkerIconRules.maxBytes / 1024) }));
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (!isSafeCustomIconDataUrl(dataUrl)) {
      throw new Error(t("status.iconInvalidDataUrl"));
    }
    const dimensions = await readImageDimensions(dataUrl);
    if (
      dimensions.width < customMarkerIconRules.minDimension ||
      dimensions.height < customMarkerIconRules.minDimension ||
      dimensions.width > customMarkerIconRules.maxDimension ||
      dimensions.height > customMarkerIconRules.maxDimension
    ) {
      throw new Error(t("status.iconDimensionRange", { min: customMarkerIconRules.minDimension, max: customMarkerIconRules.maxDimension }));
    }
    return normalizeCustomMarkerIcon({
      dataUrl,
      mimeType,
      name: file.name || "custom-marker",
      width: dimensions.width,
      height: dimensions.height,
      size: file.size
    });
  }

  function renderCategoryEditors() {
    const settings = getSettings();
    const categoryCounts = getRows().reduce((counts, row) => {
      const categoryId = cleanType(row.type);
      counts[categoryId] = (counts[categoryId] || 0) + 1;
      return counts;
    }, {});
    categorySettings.forEach(category => normalizeCategorySizes(category, settings));
    els.categoryList.innerHTML = categorySettings.map((category, index) => {
      const categoryUiLabel = getCategoryLabel(category.id, currentUiLanguage);
      return `
      <div class="category-editor${category.collapsed ? " is-collapsed" : ""}${category.id === activeCategoryId ? " is-selected" : ""}" data-category-id="${escapeHtml(category.id)}" tabindex="0" aria-label="${escapeHtml(t("properties.category.editAria", { label: categoryUiLabel }))}">
        <div class="category-header">
          <div class="category-title-block">
            <span class="category-swatch">${getCategorySwatchSvg(category)}</span>
            <span>
              <strong title="${escapeHtml(categoryUiLabel)}">${escapeHtml(categoryUiLabel)}</strong>
              <small>${categoryCounts[category.id] || 0} ${escapeHtml((categoryCounts[category.id] || 0) === 1 ? t("properties.category.point") : t("properties.category.points"))} · ${escapeHtml(category.customIcon ? t("properties.category.customIcon") : getMarkerShapeLabel(category.shape))}</small>
            </span>
          </div>
          <button class="toggle-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="${escapeHtml(`${category.collapsed ? t("properties.category.expand") : t("properties.category.collapse")} ${categoryUiLabel}`)}" title="${escapeHtml(category.collapsed ? t("properties.category.expand") : t("properties.category.collapse"))}">${category.collapsed ? "▸" : "▾"}</button>
          <div class="category-actions">
            <button class="category-drag-handle icon-button" type="button" draggable="true" data-category-id="${escapeHtml(category.id)}" aria-label="${escapeHtml(t("properties.category.dragAria", { label: categoryUiLabel }))}" title="${escapeHtml(t("properties.category.dragTitle"))}">
              <svg class="category-grip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.8"></circle>
                <circle cx="15" cy="6" r="1.8"></circle>
                <circle cx="9" cy="12" r="1.8"></circle>
                <circle cx="15" cy="12" r="1.8"></circle>
                <circle cx="9" cy="18" r="1.8"></circle>
                <circle cx="15" cy="18" r="1.8"></circle>
              </svg>
            </button>
            <button class="remove-category-btn icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-label="${escapeHtml(t("properties.category.removeAria", { label: categoryUiLabel }))}" title="${escapeHtml(t("properties.category.removeTitle"))}"${categorySettings.length <= 1 ? " disabled" : ""}>×</button>
          </div>
        </div>
        <div class="category-body category-form">
        <label class="category-name-field">
          ${escapeHtml(t("properties.category.name"))}
          <input class="category-label-input" type="text" value="${escapeHtml(category.label)}" />
        </label>
          <label>
            ${escapeHtml(t("properties.category.marker"))}
            <select class="category-shape-input">
              ${markerShapes.map(shape => `<option value="${escapeHtml(shape.value)}"${category.shape === shape.value ? " selected" : ""}>${escapeHtml(getMarkerShapeLabel(shape))}</option>`).join("")}
            </select>
          </label>
          <label>
            ${escapeHtml(t("properties.category.colourPreset"))}
            <select class="category-preset-input">
              ${colourPresets.map(preset => `<option value="${escapeHtml(preset.value)}"${getPresetValueForColour(category.colour) === preset.value ? " selected" : ""}>${escapeHtml(getCategoryColourPresetLabel(preset))}</option>`).join("")}
            </select>
          </label>
          <label>
            ${escapeHtml(t("properties.category.customColour"))}
            <input class="category-colour-input" type="color" value="${escapeHtml(category.colour)}" />
          </label>
          <label>
            ${escapeHtml(t("properties.category.markerSize"))}
            <input class="category-marker-size-input" type="number" min="4" max="30" step="1" value="${category.markerSize}" />
          </label>
          <label>
            ${escapeHtml(t("properties.category.lineWidth"))}
            <input class="category-line-width-input" type="number" min="1" max="10" step="0.5" value="${category.lineWidth}" />
          </label>
        </div>
      </div>
    `;
    }).join("");
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(String(value).trim().replace(",", "."));
    return Number.isFinite(n) ? n : "";
  }

  function formatProjectCoordinate(value, language = activeAuthoringLanguage) {
    const n = toNumber(value);
    if (n === "") return "";
    const text = String(n);
    return language === "fr" ? text.replace(".", ",") : text;
  }

  function toBoolean(value) {
    if (value === true || value === false) return value;
    const raw = String(value || "").trim().toLowerCase();
    return ["1", "true", "yes", "y", "hide", "hidden", "no line", "no leader line"].includes(raw);
  }

  function toPriority(value) {
    if (value === null || value === undefined || value === "") return 0;
    const priority = Math.round(Number(String(value).trim()));
    return Number.isFinite(priority) ? Math.max(0, Math.min(5, priority)) : 0;
  }

  function normalizeFootnote(value) {
    return String(value || "").trim();
  }

  function getRenderableFootnote(value) {
    const footnote = normalizeFootnote(value);
    return /^([A-Za-z0-9]+|\*)$/.test(footnote) ? footnote : "";
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getField(row, aliases) {
    const directKey = aliases.find(alias => Object.prototype.hasOwnProperty.call(row, alias));
    if (directKey) return row[directKey];

    const keys = Object.keys(row);
    const matchedKey = keys.find(key => aliases.includes(normalizeHeader(key)));
    return matchedKey ? row[matchedKey] : undefined;
  }

  function normalizeRow(row) {
    return {
      rowId: row && row.rowId ? String(row.rowId) : "",
      name: String(getField(row, csvColumnAliases.name) || "").trim(),
      nameFr: String(getField(row, csvColumnAliases.nameFr) || row.nameFr || "").trim(),
      footnote: normalizeFootnote(getField(row, csvColumnAliases.footnote)),
      type: cleanType(getField(row, csvColumnAliases.type) || getDefaultCategory().label),
      typeFr: String(getField(row, csvColumnAliases.typeFr) || row.typeFr || "").trim(),
      priority: toPriority(getField(row, csvColumnAliases.priority)),
      lon: toNumber(getField(row, csvColumnAliases.lon)),
      lat: toNumber(getField(row, csvColumnAliases.lat)),
      hideLine: toBoolean(getField(row, csvColumnAliases.hideLine)),
      elbowLeader: toBoolean(row && row.elbowLeader),
      labelMaxChars: normalizeLabelMaxCharsOverride(row && row.labelMaxChars)
    };
  }

  function setRows(rows, importMessages = [], options = {}) {
    pendingCsvImport = null;
    lastImportMessages = importMessages;
    hideCsvImportPreview();
    if (!options.preserveManualPositions) {
      clearAllLanguageLayouts();
    }
    nextRowId = 1;
    els.tableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
      const normalized = normalizeRow(row);
      if (normalized.typeFr) {
        const category = getCategoryForType(normalized.type);
        if (category && !category.labelFr) category.labelFr = normalized.typeFr;
      }
      addRow(normalized, { container: fragment, deferRefresh: true });
    });
    els.tableBody.appendChild(fragment);
    updateDeleteButtonState();
    refreshProjectTableUx();
    if (options.resetProperties !== false) {
      activePropertiesSelection = null;
    }
    if (canadaGeo && Array.isArray(canadaGeo.features) && (activeDataTable === "regions" || shouldRenderPreviewNow())) {
      applyRegionColoursByValue(false);
    }
    if (options.render !== false) requestPreviewRefresh();
    if (options.resetProperties !== false) {
      renderPropertiesForActiveState();
    }
  }

  function addRow(
    row = { name: "", nameFr: "", footnote: "", type: getDefaultCategory().id, priority: 0, lon: "", lat: "", hideLine: false, elbowLeader: false, labelMaxChars: "" },
    options = {}
  ) {
    const tr = document.createElement("tr");
    const rowId = row.rowId ? String(row.rowId) : String(nextRowId);
    const priority = toPriority(row.priority);
    tr.dataset.rowId = rowId;
    tr.dataset.nameEn = row.name || "";
    tr.dataset.nameFr = row.nameFr || "";
    tr.dataset.labelMaxChars = normalizeLabelMaxCharsOverride(row.labelMaxChars);
    const numericRowId = Number(rowId);
    nextRowId = Number.isFinite(numericRowId) ? Math.max(nextRowId, numericRowId + 1) : nextRowId + 1;
    tr.innerHTML = `
      <td class="name-cell vcell" data-cell-field="name"><input class="name-input" type="text" value="${escapeHtml(activeAuthoringLanguage === "fr" ? row.nameFr || "" : row.name || "")}" title="${escapeHtml(activeAuthoringLanguage === "fr" ? row.nameFr || "" : row.name || "")}" aria-label="${escapeHtml(t("table.projectName.aria"))}"><span class="row-validation-badge" aria-hidden="true"></span><button class="row-fix-link" type="button" hidden>${escapeHtml(t("table.fix"))}</button></td>
      <td data-cell-field="footnote"><input class="footnote-input" type="text" value="${escapeHtml(row.footnote || "")}" aria-label="${escapeHtml(t("table.footnote.title"))}" maxlength="2" pattern="[A-Za-z0-9]*|[*]"></td>
      <td class="vcell" data-cell-field="type">
        <select class="type-input" title="${escapeHtml(getCategoryLabel(row.type, activeAuthoringLanguage))}" aria-label="${escapeHtml(t("table.projectType.aria"))}">
          ${getTypeOptions(row.type)}
        </select>
      </td>
      <td class="bulk-edit-cell priority-cell vcell" data-cell-field="priority"><input class="priority-input" type="number" min="0" max="5" step="1" value="${priority}" aria-label="${escapeHtml(t("properties.field.priority"))}"></td>
      <td class="bulk-edit-cell coordinate-cell lon-cell vcell" data-cell-field="lon"><input class="lon-input" type="text" inputmode="decimal" value="${escapeHtml(formatProjectCoordinate(row.lon))}" aria-label="${escapeHtml(t("table.longitude"))}"><button class="clear-coordinate-cell" type="button" data-clear-coordinate="lon" aria-label="${escapeHtml(t("table.clearLongitude"))}" title="${escapeHtml(t("table.clearLongitude"))}" hidden>&times;</button></td>
      <td class="bulk-edit-cell coordinate-cell lat-cell vcell" data-cell-field="lat"><input class="lat-input" type="text" inputmode="decimal" value="${escapeHtml(formatProjectCoordinate(row.lat))}" aria-label="${escapeHtml(t("table.latitude"))}"><button class="clear-coordinate-cell" type="button" data-clear-coordinate="lat" aria-label="${escapeHtml(t("table.clearLatitude"))}" title="${escapeHtml(t("table.clearLatitude"))}" hidden>&times;</button></td>
      <td class="status-cell" data-cell-field="status" aria-readonly="true"><span class="row-status-badge"></span></td>
      <td class="line-cell" data-cell-field="hideLine"><input type="checkbox" class="hide-line-input" aria-label="${escapeHtml(t("properties.field.hideLeaderLine"))}"${row.hideLine ? " checked" : ""}></td>
      <td hidden><input type="checkbox" class="elbow-leader-input" aria-label="${escapeHtml(t("properties.field.useElbowLeader"))}"${row.elbowLeader ? " checked" : ""}></td>
      <td class="select-cell"><input type="checkbox" class="row-select" aria-label="${escapeHtml(t("table.selectRow"))}"></td>
    `;
    tr.querySelector(".type-input").value = cleanType(row.type);
    const handleRowEdit = (input) => {
      captureInputUndo(input, "project row edit");
      updateRowTitles(tr);
      syncCoordinateClearButtons(tr);
      if (isProjectStatusInput(input)) scheduleProjectTableUxRefresh();
      requestPreviewRefresh();
      refreshActiveRowProperties();
    };
    tr.querySelectorAll("input,select").forEach(input => {
      if (input.classList.contains("row-select")) return;
      input.addEventListener("focus", () => primeInputUndo(input, "project row edit"));
      input.addEventListener("change", () => handleRowEdit(input));
      input.addEventListener("blur", () => clearInputUndoCapture(input));
    });
    tr.querySelectorAll("input[type='text'],input[type='number']").forEach(input => {
      input.addEventListener("input", () => handleRowEdit(input));
    });
    tr.querySelector(".row-select").addEventListener("change", event => {
      tr.classList.toggle("is-row-selected", event.target.checked);
      updateDeleteButtonState();
    });
    tr.addEventListener("click", event => {
      if (event.target.closest(".row-select")) return;
      const fixButton = event.target.closest(".row-fix-link");
      if (fixButton) {
        focusProjectRowIssue(tr.dataset.rowId);
        return;
      }
      setProjectRowPropertiesFromElement(tr);
    });
    tr.addEventListener("focusin", event => {
      if (event.target.closest(".row-select")) return;
      setProjectRowPropertiesFromElement(tr);
    });
    (options.container || els.tableBody).appendChild(tr);
    syncCoordinateClearButtons(tr);
    if (!options.deferRefresh) {
      updateDeleteButtonState();
      refreshProjectTableUx();
    }
    return tr;
  }

  function refreshRegionColoursFromRows() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    applyRegionColoursByValue(false);
  }

  function shouldRenderPreviewNow() {
    return activeDataTable === "preview" || activeDataTable === "quality";
  }

  function requestPreviewRefresh(options = {}) {
    pendingPreviewRefresh = true;
    pendingPreviewRefreshOptions = mergeRenderOptions(pendingPreviewRefreshOptions, options);
    if (!shouldRenderPreviewNow()) return;
    const renderOptions = pendingPreviewRefreshOptions || {};
    pendingPreviewRefresh = false;
    pendingPreviewRefreshOptions = null;
    refreshRegionColoursFromRows();
    scheduleRender(renderOptions);
  }

  function updateRowTitles(tr) {
    tr.querySelector(".name-input").title = tr.querySelector(".name-input").value.trim();
    tr.querySelector(".type-input").title = getCategoryLabel(tr.querySelector(".type-input").value, activeAuthoringLanguage);
  }

  function syncCoordinateClearButtons(tr) {
    if (!tr) return;
    ["lon", "lat"].forEach(field => {
      const input = tr.querySelector(`.${field}-input`);
      const button = tr.querySelector(`[data-clear-coordinate="${field}"]`);
      if (button) button.hidden = !String(input?.value || "").trim();
    });
  }

  function getTableRows() {
    return Array.from(els.tableBody.querySelectorAll("tr"));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getRows() {
    return getTableRows()
      .map(readRowElement)
      .filter(row => row && (row.name.length > 0 || row.nameFr.length > 0 || row.lon !== "" || row.lat !== ""));
  }

  function getProjectSelectionCounts() {
    const selectedCellRowIds = new Set(Array.from(selectedProjectCells).map(key => parseProjectCellKey(key).rowId));
    const selectedFields = Array.from(selectedProjectCells).map(key => parseProjectCellKey(key).field);
    const selectedRowCount = getTableRows().filter(tr => tr.querySelector(".row-select")?.checked || selectedCellRowIds.has(String(tr.dataset.rowId))).length;
    return {
      selectedCellCount: selectedProjectCells.size,
      selectedCoordinateCellCount: selectedFields.filter(field => field === "lon" || field === "lat").length,
      selectedPriorityCellCount: selectedFields.filter(field => field === "priority").length,
      selectedRowCount
    };
  }

  function getSelectedOptionText(select) {
    if (!select || select.selectedIndex < 0) return "";
    return select.options[select.selectedIndex]?.textContent?.trim() || "";
  }

  function onOffLabel(value) {
    return value ? t("settings.on") : t("settings.off");
  }

  function createReadonlyPropertySections() {
    const sections = [
      {
        title: t("properties.section.mapSize"),
        rows: [
          { label: t("properties.field.pagePreset"), value: getSelectedOptionText(els.bookSizeInput), origin: "editable" },
          { label: t("properties.field.canvasSize"), value: getSelectedOptionText(els.imageSizeInput), origin: "editable" },
          { label: t("properties.field.defaultCharactersPerLine"), value: els.labelCharsInput?.value || "", origin: "editable" }
        ]
      },
      {
        title: t("properties.section.display"),
        rows: [
          { label: t("properties.furniture.legend"), value: onOffLabel(Boolean(els.showLegendInput?.checked)), origin: "editable" },
          { label: t("properties.furniture.callouts"), value: onOffLabel(Boolean(els.showCalloutsInput?.checked)), origin: "editable" },
          { label: t("settings.compactBoxes"), value: onOffLabel(Boolean(els.compactFurnitureInput?.checked)), origin: "editable" },
          { label: t("settings.leaderBorder"), value: onOffLabel(Boolean(els.showLineCasingInput?.checked)), origin: "editable" },
          { label: t("settings.elbowLeaders"), value: onOffLabel(Boolean(els.routeDenseLeadersInput?.checked)), origin: "editable" }
        ]
      }
    ];

    if (activeDataTable === "regions" || activePropertiesSelection?.kind === "map") {
      sections.unshift({
        title: t("properties.title.mapBaselayer"),
        rows: [
          { label: t("properties.field.mapBoundary"), value: getSelectedOptionText(els.boundaryInput), origin: "editable" },
          { label: t("properties.field.regionPreset"), value: getSelectedOptionText(els.regionPresetInput), origin: "editable" },
          { label: t("summary.regions"), value: getVisibleRegionSummary().value, origin: "automatic" }
        ]
      });
    } else {
      sections.unshift({
        title: t("properties.section.mapStyle"),
        rows: [
          { label: t("properties.field.mapStyle"), value: getSelectedOptionText(els.mapStylePresetInput), origin: "editable" },
          { label: t("properties.status.titleRequired"), value: els.mapTitleEnInput?.value || els.mapTitleFrInput?.value ? t("properties.status.complete") : t("properties.status.missing"), origin: "automatic" },
          { label: t("properties.status.textRequired"), value: els.mapTextEnInput?.value || els.mapTextFrInput?.value ? t("properties.status.complete") : t("properties.status.missing"), origin: "automatic" }
        ]
      });
    }

    return sections.map(section => ({
      title: section.title,
      rows: section.rows
        .filter(row => row.label)
        .map(row => ({
          label: row.label,
          origin: row.origin,
          value: row.value || "—"
        }))
    }));
  }

  function createReadonlyAppSnapshot() {
    const rows = getRows();
    const selectionCounts = getProjectSelectionCounts();
    const rowSummary = summarizeProjectRows(rows);
    const regionSummary = getVisibleRegionSummary();
    const qualitySummary = getQualitySummary();
    const reviewCount = getReviewIssueCount();
    return {
      activeWorkspace: activeDataTable,
      locale: currentUiLanguage,
      mapLanguage: currentMapLanguage,
      mapBaselayer: {
        boundary: getBoundaryLabel(currentBoundary, activeAuthoringLanguage),
        includedCount: getRegionRows().filter(region => regionVisibility[region.id] !== false).length,
        previewRows: getRegionTableRows().slice(0, 6).map(region => ({
          colour: region.colour,
          colourOrder: region.value,
          included: Boolean(region.included),
          name: region.name,
          pointCount: region.count,
          regionId: region.id
        })),
        regionCount: getRegionRows().length
      },
      projectPoints: {
        previewRows: rows.slice(0, 6).map(row => {
          const hasLongitude = row.lon !== "";
          const hasLatitude = row.lat !== "";
          const isBlank = !row.name && !row.nameFr && !hasLongitude && !hasLatitude;
          const isMapped = !isBlank && hasLongitude && hasLatitude;
          const isCallout = !isBlank && (row.name || row.nameFr) && !hasLongitude && !hasLatitude;
          const isMissingCoordinate = !isBlank && (hasLongitude || hasLatitude) && !(hasLongitude && hasLatitude);
          const status = isMapped ? "mapped" : isCallout ? "callout" : isMissingCoordinate ? "missing" : "blank";
          return {
            rowId: String(row.rowId || ""),
            name: getLabelText(row, activeAuthoringLanguage),
            type: getCategoryLabel(row.type, activeAuthoringLanguage),
            priority: row.priority,
            hasLongitude,
            hasLatitude,
            status
          };
        }),
        rowCount: rows.length,
        toolbar: {
          activeFilter: workspace.normalizeProjectFilter(activeProjectFilter),
          activeLanguage: activeAuthoringLanguage,
          filterOptions: getReactProjectFilterOptions(),
          selectedCellCount: selectionCounts.selectedCellCount,
          selectedCoordinateCellCount: selectionCounts.selectedCoordinateCellCount,
          selectedPriorityCellCount: selectionCounts.selectedPriorityCellCount,
          selectedRowCount: selectionCounts.selectedRowCount
        }
      },
      properties: {
        collapsed: propertiesDrawerMedia.matches
          ? !document.body.classList.contains("properties-open")
          : document.body.classList.contains("properties-collapsed"),
        contextKind: activePropertiesSelection && activePropertiesSelection.kind || "document",
        guidance: els.propertiesDescription ? els.propertiesDescription.textContent || "" : "",
        sections: createReadonlyPropertySections(),
        subtitle: els.propertiesSubtitle ? els.propertiesSubtitle.textContent || "" : "",
        title: els.propertiesTitle ? els.propertiesTitle.textContent || "" : ""
      },
      workspaceSummary: {
        activeLabel: els.tablePanelTitle ? els.tablePanelTitle.textContent || "" : t("summary.map"),
        metrics: [
          { key: "rows", label: t("summary.rows"), state: rowSummary.total ? "ok" : "warning", value: String(rowSummary.total) },
          { key: "mapped", label: t("summary.mapped"), state: rowSummary.mapped ? "ok" : "neutral", value: String(rowSummary.mapped) },
          { key: "regions", label: t("summary.regions"), state: regionSummary.state, value: regionSummary.value },
          { key: "quality", label: t("summary.toReview"), state: reviewCount ? "warning" : "ok", value: String(reviewCount) }
        ],
        qualityLabel: qualitySummary.label || ""
      }
    };
  }

  function publishReadonlyAppSnapshot() {
    updateReactPropertiesPanel();
    if (!window.PLOTYPUS_APP_STATE_READONLY) return;
    window.PLOTYPUS_APP_STATE_READONLY.notify();
  }

  function isReactCommandBridgeEnabled() {
    try {
      return new URLSearchParams(window.location.search).get("reactCommands") === "1";
    } catch {
      return false;
    }
  }

  function runReadonlyPropertiesCommand(command) {
    if (!command || typeof command !== "object") return { label: "Ignored invalid Properties command" };
    if (command.type === "toggle-collapsed") {
      setPropertiesCollapsed(!createReadonlyAppSnapshot().properties.collapsed);
      return { label: "Toggled vanilla Properties panel" };
    }
    if (command.type === "set-collapsed") {
      setPropertiesCollapsed(Boolean(command.collapsed));
      return { label: Boolean(command.collapsed) ? "Collapsed vanilla Properties panel" : "Expanded vanilla Properties panel" };
    }
    return { label: "Ignored unsupported Properties command" };
  }

  const readonlyAppStateBridge = {
    getSnapshot: createReadonlyAppSnapshot,
    notify() {
      if (typeof window.CustomEvent === "function") {
        window.dispatchEvent(new window.CustomEvent("plotypus:state-snapshot"));
      }
    }
  };

  if (isReactCommandBridgeEnabled()) {
    readonlyAppStateBridge.runPropertiesCommand = runReadonlyPropertiesCommand;
  }

  window.PLOTYPUS_APP_STATE_READONLY = Object.freeze(readonlyAppStateBridge);

  function getProjectRowState(tr) {
    const row = readRowElement(tr);
    const hasName = Boolean(row && row.name);
    const hasLon = row && row.lon !== "";
    const hasLat = row && row.lat !== "";
    const hasAnyCoordinate = Boolean(hasLon || hasLat);
    const hasBothCoordinates = Boolean(hasLon && hasLat);
    const isBlank = !hasName && !hasAnyCoordinate;
    const isMissingCoordinate = !isBlank && hasAnyCoordinate && !hasBothCoordinates;
    const isCallout = !isBlank && hasName && !hasAnyCoordinate;
    const isMapped = !isBlank && hasBothCoordinates;
    return { isBlank, isMapped, isCallout, isMissingCoordinate };
  }

  function isProjectStatusInput(input) {
    return input.classList.contains("name-input")
      || input.classList.contains("lon-input")
      || input.classList.contains("lat-input");
  }

  function captureInputUndo(input, label) {
    if (!input || input.dataset.undoCaptured === "true") return;
    input.dataset.undoCaptured = "true";
    const snapshot = inputUndoSnapshots.get(input) || createAppUndoSnapshot(label);
    snapshot.label = label || snapshot.label;
    pushAppUndoSnapshot(snapshot);
  }

  function primeInputUndo(input, label) {
    if (!input || restoringAppUndoSnapshot || inputUndoSnapshots.has(input)) return;
    inputUndoSnapshots.set(input, createAppUndoSnapshot(label));
  }

  function clearInputUndoCapture(input) {
    if (!input) return;
    delete input.dataset.undoCaptured;
    inputUndoSnapshots.delete(input);
  }

  function getCoordinateIssueRows() {
    return getTableRows()
      .map(readRowElement)
      .filter(row => row && ((row.lon === "") !== (row.lat === "")));
  }

  function updatePreviewState() {
    const hasRows = getRows().length > 0;
    const issueRows = getCoordinateIssueRows();
    if (els.mapHost) {
      els.mapHost.classList.toggle("is-empty-preview", !hasRows);
    }
    if (els.previewEmptyState) {
      els.previewEmptyState.hidden = hasRows;
    }
    if (els.canvasPlaceholder) {
      els.canvasPlaceholder.hidden = hasRows;
      updateCanvasPlaceholderSize();
    }
    if (els.canvasToolbar) {
      els.canvasToolbar.hidden = false;
    }
    if (els.canvasQualityPill) {
      els.canvasQualityPill.hidden = !hasRows;
    }
    if (els.previewErrorState) {
      els.previewErrorState.hidden = !hasRows || issueRows.length === 0;
      if (hasRows && issueRows.length) {
        const issueItems = issueRows.slice(0, 4).map(row => `
          <li><button type="button" data-fix-row-id="${escapeHtml(row.rowId)}">${escapeHtml(t("project.preview.fixRow", { name: row.name || t("project.preview.thisRow") }))}</button></li>
        `).join("");
        const extraIssueCount = issueRows.length - 4;
        const issueLabel = issueRows.length === 1 ? t("project.summary.coordinateIssueSingular") : t("project.summary.coordinateIssuePlural");
        const suffix = extraIssueCount > 0
          ? `<span>${escapeHtml(t("project.preview.moreIssues", { count: extraIssueCount, label: extraIssueCount === 1 ? t("summary.issueSingular") : t("summary.issuePlural") }))}</span>`
          : "";
        els.previewErrorState.innerHTML = `
          <strong>${escapeHtml(t("project.preview.coordinateIssueTitle", { count: issueRows.length, label: issueLabel }))}</strong>
          <span>${escapeHtml(t("project.preview.coordinateIssueBody"))}</span>
          <ul class="preview-error-list">${issueItems}</ul>
          ${suffix}
        `;
      } else {
        els.previewErrorState.innerHTML = "";
      }
    }
    updateCanvasToolbar();
  }

  function handleEmptyStateAction(event) {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    const action = button.dataset.emptyAction;
    if (action === "load-sample") {
      pushAppUndoHistory("load sample data");
      setRows(sampleRows);
      setDocumentPropertiesContext();
      setStatusMessage(t("status.sampleLoaded"), "ok");
      return;
    }
    if (action === "import-csv") {
      els.csvInput.click();
    }
  }

  function focusProjectRowIssue(rowId) {
    const tr = getRowElementById(rowId);
    if (!tr) return;
    setActiveDataTab("projects");
    setProjectFilter("all");
    setProjectRowPropertiesFromElement(tr);
    tr.scrollIntoView({ block: "center", behavior: "smooth" });
    const lonInput = tr.querySelector(".lon-input");
    const latInput = tr.querySelector(".lat-input");
    const target = lonInput && lonInput.value === "" ? lonInput : latInput && latInput.value === "" ? latInput : tr.querySelector(".name-input");
    if (target) target.focus({ preventScroll: true });
  }

  function handlePreviewStateAction(event) {
    const fixButton = event.target.closest("[data-fix-row-id]");
    if (fixButton) {
      focusProjectRowIssue(fixButton.dataset.fixRowId);
      return;
    }
    handleEmptyStateAction(event);
  }

  function rowMatchesProjectFilter(state) {
    return workspace.rowMatchesProjectFilter(state, activeProjectFilter);
  }

  function refreshProjectTableUx() {
    if (projectTableUxRefreshFrame) {
      cancelAnimationFrame(projectTableUxRefreshFrame);
      projectTableUxRefreshFrame = 0;
    }
    const rows = getTableRows();
    let dataRows = 0;
    let mappedRows = 0;
    let calloutRows = 0;
    let missingRows = 0;
    let visibleRows = 0;

    rows.forEach(tr => {
      const state = getProjectRowState(tr);
      const nameInput = tr.querySelector(".name-input");
      const typeInput = tr.querySelector(".type-input");
      const footnoteInput = tr.querySelector(".footnote-input");
      const priorityInput = tr.querySelector(".priority-input");
      const lonInput = tr.querySelector(".lon-input");
      const latInput = tr.querySelector(".lat-input");
      const hideLineInput = tr.querySelector(".hide-line-input");
      const elbowLeaderInput = tr.querySelector(".elbow-leader-input");
      const selectInput = tr.querySelector(".row-select");
      const clearLonButton = tr.querySelector("[data-clear-coordinate='lon']");
      const clearLatButton = tr.querySelector("[data-clear-coordinate='lat']");
      if (nameInput) nameInput.setAttribute("aria-label", t("table.projectName.aria"));
      if (typeInput) {
        typeInput.setAttribute("aria-label", t("table.projectType.aria"));
        typeInput.title = getCategoryLabel(typeInput.value, activeAuthoringLanguage);
      }
      if (footnoteInput) footnoteInput.setAttribute("aria-label", t("table.footnote.title"));
      if (priorityInput) priorityInput.setAttribute("aria-label", t("properties.field.priority"));
      if (lonInput) lonInput.setAttribute("aria-label", t("table.longitude"));
      if (latInput) latInput.setAttribute("aria-label", t("table.latitude"));
      if (hideLineInput) hideLineInput.setAttribute("aria-label", t("properties.field.hideLeaderLine"));
      if (elbowLeaderInput) elbowLeaderInput.setAttribute("aria-label", t("properties.field.useElbowLeader"));
      if (selectInput) selectInput.setAttribute("aria-label", t("table.selectRow"));
      if (clearLonButton) {
        clearLonButton.setAttribute("aria-label", t("table.clearLongitude"));
        clearLonButton.title = t("table.clearLongitude");
      }
      if (clearLatButton) {
        clearLatButton.setAttribute("aria-label", t("table.clearLatitude"));
        clearLatButton.title = t("table.clearLatitude");
      }
      if (!state.isBlank) dataRows += 1;
      if (state.isMapped) mappedRows += 1;
      if (state.isCallout) calloutRows += 1;
      if (state.isMissingCoordinate) missingRows += 1;

      tr.classList.toggle("is-row-blank", state.isBlank);
      tr.classList.toggle("is-row-mapped", state.isMapped);
      tr.classList.toggle("is-row-callout", state.isCallout);
      tr.classList.toggle("is-row-missing-coordinate", state.isMissingCoordinate);
      tr.hidden = !rowMatchesProjectFilter(state);
      if (!tr.hidden) visibleRows += 1;

      const badge = tr.querySelector(".row-validation-badge");
      const statusBadge = tr.querySelector(".row-status-badge");
      let statusText = "";
      let statusState = "blank";
      let statusTitle = "";
      if (badge) {
        if (state.isMissingCoordinate) {
          badge.textContent = t("table.status.missingCoordinate");
          statusText = t("table.status.missing");
          statusState = "missing";
          statusTitle = t("table.status.missingCoordinateTitle");
          badge.title = statusTitle;
        } else if (state.isCallout) {
          badge.textContent = t("table.status.callout");
          statusText = t("table.status.noCoord");
          statusState = "callout";
          statusTitle = t("table.status.calloutTitle");
          badge.title = statusTitle;
        } else if (state.isMapped) {
          badge.textContent = t("table.status.mapped");
          statusText = t("table.status.mapped");
          statusState = "mapped";
          statusTitle = t("table.status.mappedTitle");
          badge.title = statusTitle;
        } else {
          badge.textContent = "";
          badge.title = "";
        }
      }
      if (statusBadge) {
        statusBadge.textContent = statusText;
        statusBadge.dataset.state = statusState;
        statusBadge.title = statusTitle;
        if (statusText) {
          statusBadge.setAttribute("aria-label", t("table.status.aria", { status: statusText }));
        } else {
          statusBadge.removeAttribute("aria-label");
        }
      }
      const fixLink = tr.querySelector(".row-fix-link");
      if (fixLink) {
        fixLink.hidden = !state.isMissingCoordinate;
        fixLink.setAttribute("aria-label", t("project.preview.fixCoordinatesAria", { name: readRowElement(tr).name || t("project.preview.thisRow") }));
      }
    });

    if (els.projectTableSummary) {
      const filterSuffix = activeProjectFilter === "all" ? "" : t("project.summary.shownSuffix", { count: visibleRows });
      els.projectTableSummary.textContent = t("project.summary.table", {
        rows: dataRows,
        rowLabel: dataRows === 1 ? t("project.summary.rowSingular") : t("project.summary.rowPlural"),
        mapped: mappedRows,
        callouts: calloutRows,
        calloutLabel: calloutRows === 1 ? t("project.summary.calloutSingular") : t("project.summary.calloutPlural"),
        issues: missingRows,
        issueLabel: missingRows === 1 ? t("project.summary.coordinateIssueSingular") : t("project.summary.coordinateIssuePlural"),
        filterSuffix
      });
    }
    if (els.projectTableEmptyState) {
      const showNoRows = rows.length === 0;
      const showNoMatches = rows.length > 0 && visibleRows === 0;
      els.projectTableEmptyState.hidden = !(showNoRows || showNoMatches);
      els.projectTableEmptyState.innerHTML = showNoRows
        ? `<strong>${escapeHtml(t("project.empty.title"))}</strong>
          <span>${escapeHtml(t("project.empty.body"))}</span>
          <div class="empty-state-actions">
            <button type="button" class="primary-action" data-empty-action="load-sample">${escapeHtml(t("project.empty.loadSample"))}</button>
            <button type="button" data-empty-action="import-csv">${escapeHtml(t("project.empty.importCsv"))}</button>
          </div>`
        : `<strong>${escapeHtml(t("project.empty.noMatchesTitle"))}</strong><span>${escapeHtml(t("project.empty.noMatchesBody"))}</span>`;
    }
    els.projectTableFilters.forEach(button => {
      button.classList.toggle("is-active", button.dataset.projectFilter === activeProjectFilter);
      if (button.dataset.projectFilter === "all") {
        button.textContent = t("toolbar.filters.allCount", { count: dataRows });
      } else if (button.dataset.projectFilter === "missing") {
        button.textContent = t("toolbar.filters.missingCoordinatesCount", { count: missingRows });
      } else if (button.dataset.projectFilter === "callouts") {
        const wide = button.querySelector(".filter-label-wide");
        const compact = button.querySelector(".filter-label-compact");
        if (wide) wide.textContent = t("toolbar.filters.noCoordinateCalloutsCount", { count: calloutRows });
        if (compact) compact.textContent = t("toolbar.filters.calloutsCount", { count: calloutRows });
      }
    });
    if (els.projectFilterSelect) els.projectFilterSelect.value = activeProjectFilter;
    updateWorkspaceSummary();
    updateExportLanguageNotice();
    if (activeDataTable === "translate") renderTranslationWorkbench();
    updatePreviewState();
    refreshProjectCellSelectionUi();
  }

  function scheduleProjectTableUxRefresh() {
    if (projectTableUxRefreshFrame) return;
    projectTableUxRefreshFrame = requestAnimationFrame(() => {
      projectTableUxRefreshFrame = 0;
      refreshProjectTableUx();
    });
  }

  function getRowElementById(rowId) {
    return getTableRows().find(tr => tr.dataset.rowId === String(rowId));
  }

  function readRowElement(tr) {
    if (!tr) return null;
    return {
      rowId: tr.dataset.rowId,
      name: activeAuthoringLanguage === "en" ? tr.querySelector(".name-input").value.trim() : tr.dataset.nameEn || "",
      nameFr: activeAuthoringLanguage === "fr" ? tr.querySelector(".name-input").value.trim() : tr.dataset.nameFr || "",
      footnote: normalizeFootnote(tr.querySelector(".footnote-input").value),
      type: cleanType(tr.querySelector(".type-input").value),
      priority: toPriority(tr.querySelector(".priority-input").value),
      lon: toNumber(tr.querySelector(".lon-input").value),
      lat: toNumber(tr.querySelector(".lat-input").value),
      hideLine: tr.querySelector(".hide-line-input").checked,
      elbowLeader: tr.querySelector(".elbow-leader-input")?.checked || false,
      labelMaxChars: normalizeLabelMaxCharsOverride(tr.dataset.labelMaxChars)
    };
  }

  function updateProjectRowField(rowId, field, value) {
    const tr = getRowElementById(rowId);
    if (!tr) return null;
    if (field === "name") {
      tr.dataset.nameEn = String(value || "").trim();
      if (activeAuthoringLanguage === "en") tr.querySelector(".name-input").value = String(value || "");
    }
    if (field === "nameFr") {
      tr.dataset.nameFr = String(value || "").trim();
      if (activeAuthoringLanguage === "fr") tr.querySelector(".name-input").value = String(value || "");
    }
    if (field === "footnote") tr.querySelector(".footnote-input").value = normalizeFootnote(value);
    if (field === "type") tr.querySelector(".type-input").value = cleanType(value);
    if (field === "priority") tr.querySelector(".priority-input").value = toPriority(value);
    if (field === "lon") tr.querySelector(".lon-input").value = formatProjectCoordinate(value);
    if (field === "lat") tr.querySelector(".lat-input").value = formatProjectCoordinate(value);
    if (field === "hideLine") tr.querySelector(".hide-line-input").checked = Boolean(value);
    if (field === "elbowLeader") tr.querySelector(".elbow-leader-input").checked = Boolean(value);
    if (field === "labelMaxChars") tr.dataset.labelMaxChars = normalizeLabelMaxCharsOverride(value);
    updateRowTitles(tr);
    if (field === "lon" || field === "lat") syncCoordinateClearButtons(tr);
    if (["lon", "lat"].includes(field) || (field === "name" && activeDataTable !== "translate")) scheduleProjectTableUxRefresh();
    return readRowElement(tr);
  }

  function handleCoordinateCellClear(event) {
    const button = event.target.closest("[data-clear-coordinate]");
    if (!button) return;
    const field = button.dataset.clearCoordinate;
    if (field !== "lon" && field !== "lat") return;
    const row = button.closest("tr[data-row-id]");
    if (!row) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    const input = row.querySelector(`.${field}-input`);
    if (!input || !String(input.value || "").trim()) return;
    pushAppUndoHistory(`clear ${field === "lon" ? "longitude" : "latitude"}`);
    updateProjectRowField(row.dataset.rowId, field, "");
    requestPreviewRefresh();
    refreshActiveRowProperties();
    refreshProjectCellSelectionUi();
    input.focus();
  }

  function getProjectCellKey(rowId, field) {
    return `${rowId}:${field}`;
  }

  function parseProjectCellKey(key) {
    const [rowId, field] = String(key || "").split(":");
    return { rowId, field };
  }

  function getProjectBulkCellFromTarget(target) {
    const cell = target && target.closest ? target.closest("#projectTable td[data-cell-field]") : null;
    if (!cell || !selectableProjectCellFields.includes(cell.dataset.cellField)) return null;
    const row = cell.closest("tr");
    if (!row || !row.dataset.rowId) return null;
    return { row, cell, rowId: row.dataset.rowId, field: cell.dataset.cellField };
  }

  function getProjectCellRange(anchor, target) {
    if (!anchor || !target) return [];
    const rows = getTableRows();
    const startRow = rows.findIndex(row => row.dataset.rowId === String(anchor.rowId));
    const endRow = rows.findIndex(row => row.dataset.rowId === String(target.rowId));
    const startField = selectableProjectCellFields.indexOf(anchor.field);
    const endField = selectableProjectCellFields.indexOf(target.field);
    if (startRow < 0 || endRow < 0 || startField < 0 || endField < 0) return [];
    const rowMin = Math.min(startRow, endRow);
    const rowMax = Math.max(startRow, endRow);
    const fieldMin = Math.min(startField, endField);
    const fieldMax = Math.max(startField, endField);
    const keys = [];
    for (let rowIndex = rowMin; rowIndex <= rowMax; rowIndex += 1) {
      for (let fieldIndex = fieldMin; fieldIndex <= fieldMax; fieldIndex += 1) {
        keys.push(getProjectCellKey(rows[rowIndex].dataset.rowId, selectableProjectCellFields[fieldIndex]));
      }
    }
    return keys;
  }

  function refreshProjectCellSelectionUi() {
    getTableRows().forEach(row => {
      row.querySelectorAll("td[data-cell-field]").forEach(cell => {
        const key = getProjectCellKey(row.dataset.rowId, cell.dataset.cellField);
        cell.classList.toggle("is-cell-selected", selectedProjectCells.has(key));
      });
    });
    const selectedFields = Array.from(selectedProjectCells).map(key => parseProjectCellKey(key).field);
    const hasPriority = selectedFields.includes("priority");
    const hasCoordinate = selectedFields.some(field => field === "lon" || field === "lat");
    if (els.bulkPriorityInput) {
      els.bulkPriorityInput.disabled = !hasPriority;
      if (!hasPriority) els.bulkPriorityInput.value = "";
    }
    if (els.bulkClearCoordinatesBtn) els.bulkClearCoordinatesBtn.disabled = !hasCoordinate;
    updateDeleteButtonState();
  }

  function selectProjectCell(selection, event = {}) {
    if (!selection) return;
    const key = getProjectCellKey(selection.rowId, selection.field);
    if (event.shiftKey && projectCellSelectionAnchor) {
      selectedProjectCells.clear();
      getProjectCellRange(projectCellSelectionAnchor, selection).forEach(item => selectedProjectCells.add(item));
    } else if (event.ctrlKey || event.metaKey) {
      if (selectedProjectCells.has(key)) selectedProjectCells.delete(key);
      else selectedProjectCells.add(key);
      projectCellSelectionAnchor = selection;
    } else {
      selectedProjectCells.clear();
      selectedProjectCells.add(key);
      projectCellSelectionAnchor = selection;
    }
    refreshProjectCellSelectionUi();
  }

  function clearProjectCellSelection() {
    selectedProjectCells.clear();
    projectCellSelectionAnchor = null;
    refreshProjectCellSelectionUi();
  }

  function handleProjectCellSelection(event) {
    const selection = getProjectBulkCellFromTarget(event.target);
    if (!selection) return;
    if (event.type === "pointerdown") {
      lastProjectCellPointerSelectionAt = performance.now();
      return;
    }
    if (event.type === "focusin" && performance.now() - lastProjectCellPointerSelectionAt < 250) return;
    selectProjectCell(selection, event);
  }

  function applyBulkPriority(value) {
    const priority = toPriority(value);
    const keys = Array.from(selectedProjectCells).filter(key => parseProjectCellKey(key).field === "priority");
    if (!keys.length) return;
    pushAppUndoHistory("bulk priority edit");
    keys.forEach(key => {
      const { rowId } = parseProjectCellKey(key);
      updateProjectRowField(rowId, "priority", priority);
    });
    requestPreviewRefresh();
    refreshProjectCellSelectionUi();
    setStatusMessage(t("status.updatedPriorityCells", { count: keys.length }), "ok");
  }

  function clearSelectedCoordinateCells() {
    const keys = Array.from(selectedProjectCells).filter(key => {
      const field = parseProjectCellKey(key).field;
      return field === "lon" || field === "lat";
    });
    if (!keys.length) return;
    pushAppUndoHistory("bulk coordinate clear");
    keys.forEach(key => {
      const { rowId, field } = parseProjectCellKey(key);
      updateProjectRowField(rowId, field, "");
    });
    requestPreviewRefresh();
    refreshProjectTableUx();
    refreshProjectCellSelectionUi();
    setStatusMessage(t("status.clearedCoordinateCells", { count: keys.length }), "ok");
  }

  function highlightActiveProjectRow(rowId) {
    getTableRows().forEach(tr => {
      tr.classList.toggle("is-active-row", Boolean(rowId) && tr.dataset.rowId === String(rowId));
    });
  }

  function setProjectRowPropertiesFromElement(tr) {
    const row = readRowElement(tr);
    if (!row) return;
    setRowPropertiesContext("row", row, {
      labelKey: getLabelKey(row),
      manual: Boolean(manualLabelPositions[getLabelKey(row)])
    });
  }

  function setProjectFilter(filter) {
    activeProjectFilter = workspace.normalizeProjectFilter(filter);
    refreshProjectTableUx();
  }

  function clickProjectFilter(filter) {
    const button = els.projectTableFilters.find(item => item.dataset.projectFilter === filter);
    if (button) button.click();
    else setProjectFilter(filter);
  }

  function pluralize(count, singular, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  function summarizeProjectRows(rows = getRows()) {
    return workspace.summarizeProjectRows(rows);
  }

  function getVisibleRegionSummary() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      return { value: t("summary.regionNotLoaded"), state: "warning" };
    }
    const regions = getRegionRows();
    const selected = regions.filter(region => regionVisibility[region.id] !== false).length;
    return {
      value: `${selected}/${regions.length}`,
      state: selected ? "ok" : "warning"
    };
  }

  function getQualitySummary(report = lastLayout && lastLayout.report) {
    return workspace.getQualitySummary(report, pluralize, {
      notChecked: t("summary.qualityNotChecked"),
      ready: t("summary.qualityReady"),
      issueSingular: t("summary.issueSingular"),
      issuePlural: t("summary.issuePlural"),
      issueCount: count => t("summary.issueCount", {
        count,
        label: count === 1 ? t("summary.issueSingular") : t("summary.issuePlural")
      })
    });
  }

  function getReviewIssueCount(report = lastLayout && lastLayout.report) {
    const rowSummary = summarizeProjectRows(getRows());
    const translationSummary = getTranslationSummary();
    const qualitySummary = getQualitySummary(report);
    return workspace.getReviewIssueCount({
      rowSummary,
      translationSummary,
      mapDetailsMissingCount: getMapDetailsMissingFields().length,
      qualitySummary
    });
  }

  function summaryChip(label, value, state = "neutral", action = "", destination = "", id = "") {
    return workspace.summaryChip(label, value, { state, action, destination, id, escapeHtml });
  }

  function updateWorkspaceSummary(options = {}) {
    if (!els.workspaceSummaryHeadline || !els.workspaceSummaryMetrics) return;
    const rows = options.rows || getRows();
    const rowSummary = summarizeProjectRows(rows);
    const regionSummary = getVisibleRegionSummary();
    const qualitySummary = getQualitySummary(Object.prototype.hasOwnProperty.call(options, "report") ? options.report : undefined);
    const activeMode = els.tablePanelTitle ? els.tablePanelTitle.textContent : t("summary.map");
    const headline = tOr(`summary.headline.${activeDataTable}`, t("summary.headline.projects"));

    if (els.workspaceSummaryMode) els.workspaceSummaryMode.textContent = activeMode;
    els.workspaceSummaryHeadline.textContent = headline;
    const reviewCount = getReviewIssueCount(Object.prototype.hasOwnProperty.call(options, "report") ? options.report : undefined);
    const chips = [
      summaryChip(t("summary.rows"), String(rowSummary.total), rowSummary.total ? "ok" : "warning"),
      summaryChip(t("summary.mapped"), String(rowSummary.mapped), rowSummary.mapped ? "ok" : "neutral"),
      summaryChip(t("summary.regions"), regionSummary.value, regionSummary.state),
      summaryChip(t("summary.toReview"), String(reviewCount), reviewCount ? "warning" : "ok", "quality", t("summary.openQuality"), "workspaceReviewBtn")
    ];
    els.workspaceSummaryMetrics.innerHTML = chips.join("");
  }

  function syncAuthoringLanguageControls(language = activeAuthoringLanguage) {
    document.querySelectorAll("[data-authoring-language]").forEach(button => {
      const active = button.dataset.authoringLanguage === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function normalizeUiLanguage(language) {
    return i18n && typeof i18n.normalizeLocale === "function"
      ? i18n.normalizeLocale(language)
      : language === "fr" ? "fr" : "en";
  }

  function t(key, params) {
    return i18n && typeof i18n.t === "function"
      ? i18n.t(currentUiLanguage, key, params)
      : key;
  }

  function tOr(key, fallback, params) {
    const translated = t(key, params);
    return translated === key ? fallback : translated;
  }

  function translateUndoLabel(label, fallbackKey = "status.lastEdit") {
    if (!label) return t(fallbackKey);
    const exact = tOr(`status.undo.${label}`, null);
    if (exact) return exact;
    if (label.startsWith("label move: ")) {
      return t("status.undo.labelMove", { label: label.slice("label move: ".length) || t("properties.title.label") });
    }
    const furnitureMatch = String(label).match(/^(.*) (reset|move|resize)$/);
    if (furnitureMatch) {
      const actionKey = `status.undo.action.${furnitureMatch[2]}`;
      return t("status.undo.furnitureAction", {
        label: furnitureMatch[1],
        action: tOr(actionKey, furnitureMatch[2])
      });
    }
    return label;
  }

  function translateErrorMessage(error) {
    if (error && error.i18nKey) {
      return t(error.i18nKey, translateErrorParams(error.i18nParams || {}));
    }
    return error && error.message ? error.message : String(error);
  }

  function translateErrorParams(params) {
    const next = { ...params };
    if (next.labelKey) {
      next.label = t(next.labelKey, next.labelParams || {});
      return next;
    }
    if (typeof next.label === "string") {
      const categoryField = next.label.match(/^Project category (\d+) (colour|stroke|custom icon)$/);
      if (categoryField) {
        next.label = t(`project.error.label.category.${categoryField[2].replace(" ", "")}`, { index: categoryField[1] });
      }
      const regionFill = next.label.match(/^Project region fill '(.+)'$/);
      if (regionFill) {
        next.label = t("project.error.label.regionFill", { id: regionFill[1] });
      }
    }
    return next;
  }

  function syncUiLanguageControls(language = currentUiLanguage) {
    els.uiLanguageButtons.forEach(button => {
      const active = button.dataset.uiLanguage === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function saveUiLanguagePreference(language) {
    projectIo.saveJson(window.localStorage, uiLanguageStorageKey, normalizeUiLanguage(language));
  }

  function getSavedUiLanguagePreference() {
    return normalizeUiLanguage(projectIo.getSavedJson(window.localStorage, uiLanguageStorageKey));
  }

  function applyUiLanguage(language, options = {}) {
    const nextLanguage = normalizeUiLanguage(language);
    const openReactMapDetailsDraft = reactMapDetailsHandle && els.mapDetailsDialog && !els.mapDetailsDialog.hidden
      ? readMapDetailsDialogDraftValue()
      : null;
    currentUiLanguage = nextLanguage;
    document.documentElement.lang = nextLanguage;
    if (i18n && typeof i18n.applyStaticTranslations === "function") {
      i18n.applyStaticTranslations(nextLanguage, document);
    }
    renderBookSizeOptions();
    renderImageSizeOptions();
    renderMapStyleOptions();
    renderRegionPresetOptions();
    syncUiLanguageControls(nextLanguage);
    if (options.persist !== false) saveUiLanguagePreference(nextLanguage);
    if (options.syncMap !== false && currentMapLanguage !== nextLanguage) {
      setMapLanguage(nextLanguage, { render: options.renderMap !== false });
    }
    if (activeDataTable) {
      setActiveDataTab(activeDataTable);
    } else {
      renderPropertiesForActiveState(getDefaultPropertiesSelectionForWorkspace(activeDataTable));
    }
    if (els.csvMapDialog && !els.csvMapDialog.hidden && pendingCsvMapping) {
      renderCsvMappingDialog();
    }
    if (openReactMapDetailsDraft) {
      openReactMapDetailsDialog(openReactMapDetailsDraft);
    }
    if (reactProjectToolbarHandle) {
      mountReactProjectToolbar();
    }
    publishReadonlyAppSnapshot();
  }

  function setAuthoringLanguage(language) {
    const nextLanguage = language === "fr" ? "fr" : "en";
    if (nextLanguage === activeAuthoringLanguage) {
      syncAuthoringLanguageControls(nextLanguage);
      updateTypeOptions();
      updateProjectCoordinateDisplay();
      updateReactProjectToolbar();
      return;
    }
    getTableRows().forEach(tr => {
      const input = tr.querySelector(".name-input");
      if (!input) return;
      tr.dataset[activeAuthoringLanguage === "fr" ? "nameFr" : "nameEn"] = input.value.trim();
      input.value = tr.dataset[nextLanguage === "fr" ? "nameFr" : "nameEn"] || "";
      input.title = input.value;
      input.setAttribute("aria-label", t(nextLanguage === "fr" ? "dialog.csv.field.nameFr" : "dialog.csv.field.name"));
    });
    activeAuthoringLanguage = nextLanguage;
    updateTypeOptions();
    updateProjectCoordinateDisplay();
    syncAuthoringLanguageControls(nextLanguage);
    renderTranslationWorkbench();
    refreshProjectTableUx();
    updateReactProjectToolbar();
    publishReadonlyAppSnapshot();
  }

  function handleWorkspaceSummaryClick(event) {
    const chip = event.target.closest("[data-summary-action]");
    if (!chip) return;
    const action = chip.dataset.summaryAction;
    if (action === "callouts") {
      setActiveDataTab("projects");
      clickProjectFilter("callouts");
      return;
    }
    if (action === "missing") {
      setActiveDataTab("projects");
      clickProjectFilter("missing");
      return;
    }
    if (action === "regions") {
      setActiveDataTab("regions");
      return;
    }
    if (action === "quality") {
      setActiveDataTab("quality");
      return;
    }
    if (action === "translations") {
      setActiveDataTab("translate");
      setTranslationFilter("missing");
      return;
    }
  }

  function getTranslationEntries() {
    const projectEntries = getRows().map(row => ({
      id: `project:${row.rowId}`,
      group: "projects",
      groupLabel: t("translate.group.projects"),
      ref: row.name || "",
      fr: row.nameFr || "",
      rowId: row.rowId,
      kind: "project"
    }));
    const categoryEntries = categorySettings.map(category => ({
      id: `category:${category.id}`,
      group: "categories",
      groupLabel: t("translate.group.categories"),
      ref: category.label || "",
      fr: category.labelFr || "",
      categoryId: category.id,
      kind: "category"
    }));
    const chromeEntries = ["legendHeading", "calloutHeading", "mapTitle", "mapSubtitle", "footnotesSource"]
      .map(key => ({ key, value: chromeTranslations[key] }))
      .filter(item => item.value && String(item.value.en || "").trim())
      .map(item => ({
        id: `chrome:${item.key}`,
        group: item.key === "footnotesSource" ? "footnotes" : "chrome",
        groupLabel: item.key === "footnotesSource" ? t("translate.group.footnotes") : t("translate.group.chrome"),
        ref: item.value.en,
        fr: item.value.fr || "",
        chromeKey: item.key,
        kind: "chrome"
      }));
    return [...projectEntries, ...categoryEntries, ...chromeEntries];
  }

  function getTranslationSummary() {
    const entries = getTranslationEntries();
    const missing = entries.filter(entry => !String(entry.ref || "").trim() || !String(entry.fr || "").trim()).length;
    return {
      total: entries.length,
      complete: entries.length - missing,
      missing,
      projectTotal: entries.filter(entry => entry.group === "projects").length,
      projectMissing: entries.filter(entry => entry.group === "projects" && (!String(entry.ref || "").trim() || !String(entry.fr || "").trim())).length
    };
  }

  function setTranslationFilter(filter) {
    activeTranslationFilter = workspace.normalizeTranslationFilter(filter);
    renderTranslationWorkbench();
  }

  function showTranslationHint(message, level = "ok") {
    if (!els.translationPasteHint) {
      setStatusMessage(message, level);
      return;
    }
    els.translationPasteHint.hidden = false;
    els.translationPasteHint.textContent = message;
    els.translationPasteHint.dataset.state = level;
    window.clearTimeout(showTranslationHint.timeoutId);
    showTranslationHint.timeoutId = window.setTimeout(() => {
      if (els.translationPasteHint) els.translationPasteHint.hidden = true;
    }, 4500);
  }

  function translationGroupOrder() {
    return ["projects", "categories", "chrome", "footnotes"];
  }

  function writeTranslationEntry(entryId, value, language = "fr") {
    const [kind, id] = String(entryId || "").split(":");
    const nextValue = String(value || "").trim();
    const editingFrench = language !== "en";
    if (kind === "project") {
      updateProjectRowField(id, editingFrench ? "nameFr" : "name", nextValue);
    } else if (kind === "category") {
      const category = categorySettings.find(item => item.id === id);
      if (category) category[editingFrench ? "labelFr" : "label"] = nextValue;
    } else if (kind === "chrome" && chromeTranslations[id]) {
      chromeTranslations[id][editingFrench ? "fr" : "en"] = nextValue;
    }
    updateWorkspaceSummary();
    updateExportLanguageNotice();
    if (activeDataTable === "translate") renderTranslationProgressOnly();
    requestPreviewRefresh(languageFitRenderOptions());
  }

  function renderTranslationProgressOnly() {
    const summary = getTranslationSummary();
    if (els.translationProgressText) {
      els.translationProgressText.textContent = t("translate.progress", { complete: summary.complete, total: summary.total });
    }
    if (els.translationProgressBar) {
      els.translationProgressBar.style.width = summary.total ? `${Math.round(summary.complete / summary.total * 100)}%` : "0%";
    }
    els.translationFilters.forEach(button => {
      button.classList.toggle("is-active", button.dataset.translationFilter === activeTranslationFilter);
      if (button.dataset.translationFilter === "missing") button.textContent = t("translate.filters.missingCount", { count: summary.missing });
    });
  }

  function getTranslationStatus(entry) {
    const hasEnglish = Boolean(String(entry && entry.ref || "").trim());
    const hasFrench = Boolean(String(entry && entry.fr || "").trim());
    if (hasEnglish && hasFrench) return { state: "done", label: t("translate.status.complete") };
    if (!hasEnglish) return { state: "missing-en", label: t("translate.status.missingEn") };
    return { state: "missing-fr", label: t("translate.status.missingFr") };
  }

  function syncTranslationRowState(row) {
    if (!row) return;
    const englishInput = row.querySelector(".translation-en-input");
    const frenchInput = row.querySelector(".translation-fr-input");
    const status = getTranslationStatus({
      ref: englishInput ? englishInput.value : "",
      fr: frenchInput ? frenchInput.value : ""
    });
    row.classList.toggle("is-missing", status.state !== "done");
    row.classList.toggle("is-missing-en", status.state === "missing-en");
    row.classList.toggle("is-missing-fr", status.state === "missing-fr");
    row.querySelector(".translation-en-input")?.classList.toggle("is-missing-value", status.state === "missing-en");
    row.querySelector(".translation-fr-input")?.classList.toggle("is-missing-value", status.state === "missing-fr");
    const badge = row.querySelector(".translation-status");
    if (badge) {
      badge.dataset.state = status.state;
      badge.textContent = status.label;
    }
  }

  function renderTranslationWorkbench() {
    if (!els.translationGroups) return;
    const entries = getTranslationEntries();
    renderTranslationProgressOnly();
    const groups = translationGroupOrder()
      .map(group => {
        const groupEntries = entries.filter(entry => entry.group === group);
        return groupEntries.length ? { group, label: groupEntries[0].groupLabel, entries: groupEntries } : null;
      })
      .filter(Boolean);
    const reverse = activeAuthoringLanguage === "fr";
    const visibleEntryIds = groups.flatMap(group => (activeTranslationFilter === "missing"
      ? group.entries.filter(entry => getTranslationStatus(entry).state !== "done")
      : group.entries).map(entry => entry.id));
    if (!visibleEntryIds.includes(activeTranslationEntryId)) {
      activeTranslationEntryId = visibleEntryIds.find(id => {
        const entry = entries.find(item => item.id === id);
        return entry && getTranslationStatus(entry).state !== "done";
      }) || visibleEntryIds[0] || "";
    }
    if (els.translationDirectionText) els.translationDirectionText.textContent = t(reverse ? "translate.direction.frEn" : "translate.direction.enFr");
    document.querySelectorAll("[data-translation-direction]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.translationDirection === (reverse ? "fr-en" : "en-fr"));
    });
    els.translationGroups.innerHTML = groups.map(group => {
      const visibleEntries = activeTranslationFilter === "missing"
        ? group.entries.filter(entry => getTranslationStatus(entry).state !== "done")
        : group.entries;
      return `
        <section class="translation-group" data-translation-group="${escapeHtml(group.group)}">
          <h3>${escapeHtml(group.label)}</h3>
          ${visibleEntries.length ? `
            ${visibleEntries.map((entry, entryIndex) => {
              const status = getTranslationStatus(entry);
              const labelBase = entry.ref || entry.fr || entry.id;
              return `
                <div class="translation-row${status.state === "done" ? "" : " is-missing"}${status.state === "missing-en" ? " is-missing-en" : ""}${status.state === "missing-fr" ? " is-missing-fr" : ""}${entry.id === activeTranslationEntryId ? " is-active" : ""}" data-entry-id="${escapeHtml(entry.id)}" data-translation-group="${escapeHtml(group.group)}" tabindex="0">
                  <span class="translation-index" aria-hidden="true">${entryIndex + 1}</span>
                  <textarea class="translation-input translation-en-input${status.state === "missing-en" ? " is-missing-value" : ""}${reverse ? "" : " is-emphasis"}" rows="1" data-entry-id="${escapeHtml(entry.id)}" data-entry-lang="en" data-edit-language="en" data-translation-group="${escapeHtml(group.group)}" aria-label="${escapeHtml(t("translate.aria.enString", { label: labelBase }))}" placeholder="${escapeHtml(t("translate.placeholder.en"))}">${escapeHtml(entry.ref)}</textarea>
                  <textarea class="translation-input translation-fr-input${status.state === "missing-fr" ? " is-missing-value" : ""}${reverse ? " is-emphasis" : ""}" rows="1" data-entry-id="${escapeHtml(entry.id)}" data-entry-lang="fr" data-edit-language="fr" data-translation-group="${escapeHtml(group.group)}" aria-label="${escapeHtml(t("translate.aria.frString", { label: labelBase }))}" placeholder="${escapeHtml(t("translate.placeholder.fr"))}">${escapeHtml(entry.fr)}</textarea>
                  <span class="translation-status" data-state="${escapeHtml(status.state)}">${escapeHtml(status.label)}</span>
                </div>
              `;
            }).join("")}
          ` : `<p class="translation-empty">${escapeHtml(t("translate.empty"))}</p>`}
        </section>
      `;
    }).join("");
    els.translationGroups.querySelectorAll(".translation-input").forEach(autoGrowTextarea);
  }

  function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(42, textarea.scrollHeight)}px`;
  }

  function getTranslationInputsForGroup(group) {
    if (!els.translationGroups) return [];
    const active = document.activeElement && document.activeElement.closest(".translation-input");
    const language = active && active.dataset.translationGroup === group ? active.dataset.entryLang : "fr";
    return Array.from(els.translationGroups.querySelectorAll(`.translation-input[data-entry-lang="${language}"]`))
      .filter(input => input.dataset.translationGroup === group);
  }

  function fillTranslationColumn(startInput, text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n").filter((line, index, list) => line.length || index < list.length - 1);
    if (lines.length <= 1) return false;
    const groupInputs = getTranslationInputsForGroup(startInput.dataset.translationGroup);
    const startIndex = groupInputs.indexOf(startInput);
    if (startIndex < 0) return false;
    const writable = groupInputs.slice(startIndex);
    const count = Math.min(lines.length, writable.length);
    pushAppUndoHistory("translation paste");
    for (let index = 0; index < count; index += 1) {
      writable[index].value = lines[index].trim();
      autoGrowTextarea(writable[index]);
      writeTranslationEntry(writable[index].dataset.entryId, writable[index].value, writable[index].dataset.entryLang);
      syncTranslationRowState(writable[index].closest(".translation-row"));
    }
    const extra = lines.length - count;
    showTranslationHint(extra > 0
      ? t("translate.pasteResult.extra", { count, extra })
      : t("translate.pasteResult", { count }), extra > 0 ? "warning" : "ok");
    renderTranslationWorkbench();
    const nextInput = getTranslationInputsForGroup(startInput.dataset.translationGroup)[Math.min(startIndex + count, writable.length - 1)];
    if (nextInput) nextInput.focus();
    return true;
  }

  function handleTranslationInput(event) {
    const textarea = event.target.closest(".translation-input");
    if (!textarea) return;
    captureInputUndo(textarea, "translation edit");
    activeTranslationEntryId = textarea.dataset.entryId;
    autoGrowTextarea(textarea);
    writeTranslationEntry(textarea.dataset.entryId, textarea.value, textarea.dataset.entryLang);
    syncTranslationRowState(textarea.closest(".translation-row"));
  }

  function selectTranslationEntry(entryId) {
    activeTranslationEntryId = String(entryId || "");
    if (!activeTranslationEntryId) return;
    if (els.translationGroups) {
      els.translationGroups.querySelectorAll(".translation-row").forEach(row => {
        row.classList.toggle("is-active", row.dataset.entryId === activeTranslationEntryId);
      });
    }
    renderPropertiesForActiveState({ kind: "translation-entry", id: activeTranslationEntryId });
  }

  function handleTranslationSelection(event) {
    const row = event.target.closest(".translation-row[data-entry-id]");
    if (!row) return;
    if (activeTranslationEntryId === row.dataset.entryId) return;
    selectTranslationEntry(row.dataset.entryId);
  }

  function handleTranslationKeydown(event) {
    const textarea = event.target.closest(".translation-input");
    if (!textarea) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const inputs = getTranslationInputsForGroup(textarea.dataset.translationGroup);
      const next = inputs[inputs.indexOf(textarea) + 1];
      if (next) next.focus();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const entry = getTranslationEntries().find(item => item.id === textarea.dataset.entryId);
      textarea.value = entry ? (textarea.dataset.entryLang === "en" ? entry.ref : entry.fr) : "";
      autoGrowTextarea(textarea);
      syncTranslationRowState(textarea.closest(".translation-row"));
    }
  }

  function handleTranslationPaste(event) {
    const textarea = event.target.closest(".translation-input");
    if (!textarea) return;
    const text = event.clipboardData ? event.clipboardData.getData("text") : "";
    if (text && /\r|\n/.test(text)) {
      event.preventDefault();
      fillTranslationColumn(textarea, text);
    }
  }

  async function pasteTranslationColumnFromClipboard() {
    const active = document.activeElement && document.activeElement.closest(".translation-input")
      ? document.activeElement
      : els.translationGroups && els.translationGroups.querySelector(".translation-fr-input");
    if (!active) {
      showTranslationHint(t("status.noFrenchPasteField"), "warning");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!fillTranslationColumn(active, text)) {
        active.value = text.trim();
        autoGrowTextarea(active);
        writeTranslationEntry(active.dataset.entryId, active.value, active.dataset.entryLang);
        syncTranslationRowState(active.closest(".translation-row"));
      }
    } catch (error) {
      showTranslationHint(t("status.clipboardPasteBlocked"), "warning");
    }
  }

  function updateExportLanguageNotice() {
    if (!els.exportLanguageNotice) return;
    const summary = getTranslationSummary();
    const show = currentMapLanguage !== "en" && summary.missing > 0;
    els.exportLanguageNotice.hidden = !show;
    const noticeKey = summary.missing === 1 ? "status.exportMissingFrenchNoticeSingular" : "status.exportMissingFrenchNotice";
    els.exportLanguageNotice.textContent = show ? t(noticeKey, { count: summary.missing }) : "";
  }

  function getBookSizePreset(value = els.bookSizeInput.value) {
    return imageSizePresets[value] ? imageSizePresets[value] : imageSizePresets[layoutDefaults.bookSizeInput];
  }

  function getImageSizePreset(bookSizeValue = els.bookSizeInput.value, imageSizeValue = els.imageSizeInput.value) {
    const book = getBookSizePreset(bookSizeValue);
    return book.sizes.find(size => size.value === imageSizeValue) || book.sizes[0];
  }

  function formatImageSizeOption(size) {
    const label = tOr(`properties.size.image.${size.value}`, size.label || size.value);
    return `${label} (${size.width} x ${size.height})`;
  }

  function updateCanvasPlaceholderSize() {
    if (!els.canvasPlaceholder) return;
    const size = getImageSizePreset();
    if (!size || !Number.isFinite(Number(size.width)) || !Number.isFinite(Number(size.height))) return;
    const previewWidth = Math.round(Number(size.width) * 1.25);
    els.canvasPlaceholder.style.width = `min(${previewWidth}px, calc(100% - 56px))`;
    els.canvasPlaceholder.style.aspectRatio = `${size.width} / ${size.height}`;
    const sizeText = els.canvasPlaceholder.querySelector(".canvas-placeholder-copy span");
    if (sizeText) {
      sizeText.dataset.i18nParams = JSON.stringify({ width: size.width, height: size.height });
      sizeText.textContent = t("properties.size.canvasPoints", { width: size.width, height: size.height });
    }
  }

  function findImageSizePresetByDimensions(width, height) {
    const parsedWidth = Number(width);
    const parsedHeight = Number(height);
    if (!parsedWidth || !parsedHeight) return null;

    for (const [bookValue, book] of Object.entries(imageSizePresets)) {
      const size = book.sizes.find(option => option.width === parsedWidth && option.height === parsedHeight);
      if (size) return { bookValue, sizeValue: size.value };
    }

    return null;
  }

  function renderImageSizeOptions() {
    const currentValue = els.imageSizeInput.value;
    const book = getBookSizePreset();
    els.imageSizeInput.innerHTML = book.sizes.map(size => (
      `<option value="${escapeHtml(size.value)}">${escapeHtml(formatImageSizeOption(size))}</option>`
    )).join("");
    els.imageSizeInput.value = book.sizes.some(size => size.value === currentValue) ? currentValue : layoutDefaults.imageSizeInput;
    updateCanvasPlaceholderSize();
  }

  function renderBookSizeOptions() {
    const currentValue = els.bookSizeInput.value;
    const bookEntries = Object.entries(imageSizePresets);
    els.bookSizeInput.innerHTML = bookEntries.map(([value, preset]) => (
      `<option value="${escapeHtml(value)}">${escapeHtml(tOr(`properties.size.book.${value}`, preset.label || value))}</option>`
    )).join("");
    els.bookSizeInput.value = imageSizePresets[currentValue] ? currentValue : layoutDefaults.bookSizeInput;
  }

  function renderFontOptions() {
    const fonts = fontOptions.length ? fontOptions : [{ label: "Lato", value: defaultFontFamily }];
    const currentValue = normalizeFontFamily(els.fontFamilyInput.value);
    els.fontFamilyInput.innerHTML = fonts.map((font) => (
      `<option value="${escapeHtml(font.value || font.label)}">${escapeHtml(font.label || font.value)}</option>`
    )).join("");
    els.fontFamilyInput.value = fonts.some(font => normalizeFontFamily(font.value || font.label) === currentValue)
      ? currentValue
      : defaultFontFamily;
  }

  function applyImageSizePreset(bookValue, imageSizeValue) {
    els.bookSizeInput.value = imageSizePresets[bookValue] ? bookValue : layoutDefaults.bookSizeInput;
    renderImageSizeOptions();
    const book = getBookSizePreset();
    els.imageSizeInput.value = book.sizes.some(size => size.value === imageSizeValue) ? imageSizeValue : layoutDefaults.imageSizeInput;
    updateCanvasPlaceholderSize();
  }

  function normalizeLayoutPreferences(preferences = {}) {
    return projectIo.normalizeLayoutPreferences(preferences, {
      imageSizePresets,
      layoutDefaults,
      getBookSizePreset
    });
  }

  function getSavedLayoutPreferences() {
    return projectIo.getSavedLayoutPreferences(window.localStorage, layoutPreferencesStorageKey, normalizeLayoutPreferences);
  }

  function applySavedLayoutPreferences() {
    const preferences = getSavedLayoutPreferences();
    if (!preferences) return false;
    applyImageSizePreset(preferences.bookSize, preferences.imageSize);
    return true;
  }

  function saveLayoutPreferences() {
    projectIo.saveLayoutPreferences(window.localStorage, layoutPreferencesStorageKey, {
        bookSize: els.bookSizeInput.value,
        imageSize: els.imageSizeInput.value
      },
      normalizeLayoutPreferences
    );
  }

  function normalizeLabelSizePt(value) {
    const parsed = Number(value);
    const fallback = layoutDefaults.labelSizeInput;
    const labelSize = Number.isFinite(parsed) ? parsed : fallback;
    return Math.max(12, Math.min(30, labelSize));
  }

  function normalizeLabelMaxChars(value, fallback = layoutDefaults.labelCharsInput) {
    const parsed = Number(value);
    const fallbackValue = Number.isFinite(Number(fallback)) ? Number(fallback) : layoutDefaults.labelCharsInput;
    const maxChars = Number.isFinite(parsed) ? parsed : fallbackValue;
    return Math.max(12, Math.min(42, Math.round(maxChars)));
  }

  function normalizeLabelMaxCharsOverride(value) {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    return normalizeLabelMaxChars(value);
  }

  function normalizeMapScale(value) {
    const parsed = Number(value);
    const fallback = layoutDefaults.mapScaleInput;
    const mapScale = Number.isFinite(parsed) ? parsed : fallback;
    return Math.max(45, Math.min(115, mapScale));
  }

  function formatMapScalePercent(value) {
    return `${Math.round(normalizeMapScale(value))}%`;
  }

  function updateCanvasToolbar() {
    if (els.canvasZoomReadout && els.mapScaleInput) {
      const mapScaleText = t("canvas.mapScaleReadout", { value: formatMapScalePercent(els.mapScaleInput.value) });
      els.canvasZoomReadout.value = mapScaleText;
      els.canvasZoomReadout.textContent = mapScaleText;
    }
    if (els.canvasToolbar) {
      els.canvasToolbar.hidden = false;
    }
  }

  function setMapScaleFromCanvasToolbar(nextValue) {
    const nextScale = normalizeMapScale(nextValue);
    if (els.mapScaleInput) {
      els.mapScaleInput.value = nextScale;
      rememberCurrentLanguageMapScale();
      saveLayoutPreferences();
      updateCanvasToolbar();
      handleLayoutSettingsChange({ target: els.mapScaleInput });
    }
  }

  function adjustCanvasZoom(delta) {
    const currentScale = normalizeMapScale(els.mapScaleInput.value);
    setMapScaleFromCanvasToolbar(currentScale + delta);
  }

  const defaultPrintLabelSizePt = 18;
  const defaultWebLabelSizePx = 12;
  const minimumWebLabelSizePx = 12;
  const webLabelSizeScale = defaultWebLabelSizePx / defaultPrintLabelSizePt;

  function getWebLabelSize(printPt) {
    // Keep the control in print points, but never render map text below 12 px.
    return Math.max(minimumWebLabelSizePx, Math.round(printPt * webLabelSizeScale));
  }

  function normalizeFontFamily(value) {
    const fontFamily = String(value || "").trim();
    return fontFamily && fontFamily !== "Lato" ? fontFamily : defaultFontFamily;
  }

  function getSettings(options = {}) {
    const imageSize = getImageSizePreset();
    const outputMode = options.outputMode || renderOutputMode;
    const labelSizePt = normalizeLabelSizePt(els.labelSizeInput.value);
    const mapScale = normalizeMapScale(els.mapScaleInput.value);
    return {
      outputMode,
      bookSize: imageSizePresets[els.bookSizeInput.value] ? els.bookSizeInput.value : layoutDefaults.bookSizeInput,
      imageSize: imageSize.value,
      width: imageSize.width,
      height: imageSize.height,
      title: "",
      labelSizePt,
      labelSize: labelSizePt,
      labelSizeRender: outputMode === "print" ? labelSizePt : getWebLabelSize(labelSizePt),
      mapScale,
      markerSize: Number(els.markerSizeInput.value) || 10,
      lineWidth: Number(els.lineWidthInput.value) || 2,
      labelMaxChars: normalizeLabelMaxChars(els.labelCharsInput.value),
      mapLanguage: currentMapLanguage,
      fontFamily: normalizeFontFamily(els.fontFamilyInput.value),
      showLegend: els.showLegendInput.checked,
      showCallouts: els.showCalloutsInput.checked,
      compactFurniture: els.compactFurnitureInput.checked,
      showLineCasing: els.showLineCasingInput.checked,
      routeDenseLeaders: els.routeDenseLeadersInput.checked,
      showDistanceMarkers: els.showDistanceMarkersInput.checked,
      lockMarkerCoordinates: els.lockMarkerCoordinatesInput.checked
    };
  }

  function applySettings(settings = {}) {
    const matchedPreset = findImageSizePresetByDimensions(settings.width, settings.height);
    const hasSizeSetting = settings.bookSize !== undefined || settings.imageSize !== undefined || settings.width !== undefined || settings.height !== undefined;
    if (hasSizeSetting) {
      applyImageSizePreset(
        settings.bookSize || (matchedPreset && matchedPreset.bookValue) || els.bookSizeInput.value || layoutDefaults.bookSizeInput,
        settings.imageSize || (matchedPreset && matchedPreset.sizeValue) || els.imageSizeInput.value || layoutDefaults.imageSizeInput
      );
    }
    if (settings.labelSizePt !== undefined || settings.labelSize !== undefined) {
      els.labelSizeInput.value = normalizeLabelSizePt(settings.labelSizePt !== undefined ? settings.labelSizePt : settings.labelSize);
    }
    if (settings.mapScale !== undefined) els.mapScaleInput.value = normalizeMapScale(settings.mapScale);
    if (settings.markerSize !== undefined) els.markerSizeInput.value = settings.markerSize;
    if (settings.lineWidth !== undefined) els.lineWidthInput.value = settings.lineWidth;
    if (settings.labelMaxChars !== undefined) els.labelCharsInput.value = normalizeLabelMaxChars(settings.labelMaxChars);
    if (settings.mapLanguage !== undefined) setMapLanguage(settings.mapLanguage, { render: false });
    if (settings.fontFamily !== undefined) els.fontFamilyInput.value = normalizeFontFamily(settings.fontFamily);
    if (settings.showLegend !== undefined) els.showLegendInput.checked = Boolean(settings.showLegend);
    if (settings.showCallouts !== undefined) els.showCalloutsInput.checked = Boolean(settings.showCallouts);
    if (settings.compactFurniture !== undefined) els.compactFurnitureInput.checked = Boolean(settings.compactFurniture);
    if (settings.showLineCasing !== undefined) els.showLineCasingInput.checked = Boolean(settings.showLineCasing);
    if (settings.routeDenseLeaders !== undefined) els.routeDenseLeadersInput.checked = Boolean(settings.routeDenseLeaders);
    if (settings.showDistanceMarkers !== undefined) els.showDistanceMarkersInput.checked = Boolean(settings.showDistanceMarkers);
    if (settings.lockMarkerCoordinates !== undefined) els.lockMarkerCoordinatesInput.checked = Boolean(settings.lockMarkerCoordinates);
    syncCompactFurnitureAvailability();
  }

  function syncCompactFurnitureAvailability() {
    if (!els.compactFurnitureInput) return;
    const hasCompactTarget = Boolean(els.showLegendInput?.checked || els.showCalloutsInput?.checked);
    els.compactFurnitureInput.disabled = !hasCompactTarget;
    const label = els.compactFurnitureInput.closest(".toolbar-check");
    if (label) {
      label.classList.toggle("is-disabled", !hasCompactTarget);
      label.title = hasCompactTarget ? "" : t("status.compactUnavailable");
    }
  }

  function getRegionName(feature, index) {
    const props = feature && feature.properties ? feature.properties : {};
    return normalizeRegionName(props.name || props.NAME || props.Name || props.ADMIN || props.admin || props.sovereignt || props.SOVEREIGNT || props.prov_name_en || props.prov_name || props.province_name || props.PRENAME || props.PRNAME || props.territory || props.province, index);
  }

  function getRegionDisplayName(feature, index, language = currentUiLanguage) {
    const props = feature && feature.properties ? feature.properties : {};
    if (language === "fr") {
      const name = normalizeRegionName(
        props.prov_name_fr || props.name_fr || props.NAME_FR || props.Name_FR || props.formal_fr || props.name || props.NAME || props.Name || props.ADMIN || props.admin || props.prov_name_en || props.prov_name,
        index
      );
      return name === `Region ${index + 1}` ? t("region.fallbackName", { index: index + 1 }) : name;
    }
    return getRegionName(feature, index);
  }

  function normalizeRegionName(value, index) {
    if (Array.isArray(value)) return normalizeRegionName(value[0], index);
    if (value && typeof value === "object") {
      const objectValue = value.en || value.EN || value.name || value.label || Object.values(value).find(item => typeof item === "string");
      return normalizeRegionName(objectValue, index);
    }
    const name = String(value || "").trim();
    return name || `Region ${index + 1}`;
  }

  function getRegionId(feature, index) {
    return String(getRegionName(feature, index)).trim();
  }

  function getVisibleGeo() {
    if (!canadaGeo) return null;
    return {
      ...canadaGeo,
      features: canadaGeo.features.filter((feature, index) => regionVisibility[getRegionId(feature, index)] !== false)
    };
  }

  function getHiddenRegionForPoint(lon, lat) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return "";
    const hiddenFeatureIndex = canadaGeo.features.findIndex((feature, index) => {
      if (regionVisibility[getRegionId(feature, index)] !== false) return false;
      return d3.geoContains(feature, [lon, lat]);
    });
    return hiddenFeatureIndex >= 0 ? getRegionDisplayName(canadaGeo.features[hiddenFeatureIndex], hiddenFeatureIndex) : "";
  }

  function getRegionIdForPoint(lon, lat) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return "";
    const featureIndex = canadaGeo.features.findIndex(feature => d3.geoContains(feature, [lon, lat]));
    return featureIndex >= 0 ? getRegionId(canadaGeo.features[featureIndex], featureIndex) : "";
  }

  function initializeRegionVisibility() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const colours = getCurrentRegionColourSet();
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      if (regionVisibility[id] === undefined) regionVisibility[id] = true;
      if (!regionFills[id]) regionFills[id] = colours[index % colours.length];
    });
  }

  function getRegionFill(feature, index) {
    const colours = getCurrentRegionColourSet();
    return regionFills[getRegionId(feature, index)] || colours[index % colours.length];
  }

  function getRegionColourPresetLabel(index, total) {
    const displayIndex = index + 1;
    if (total <= 1) return t("region.colour.one");
    if (index === 0) return t("region.colour.lowest", { index: displayIndex });
    if (index === total - 1) return t("region.colour.highest", { index: displayIndex });
    return t("region.colour.numbered", { index: displayIndex });
  }

  function getRegionRows() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return [];
    return canadaGeo.features
      .map((feature, index) => ({
        feature,
        index,
        id: getRegionId(feature, index),
        name: getRegionDisplayName(feature, index)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, currentUiLanguage));
  }

  function getProjectRegionCounts(rows = getRows()) {
    const counts = {};
    rows.forEach(row => {
      if (row.lon === "" || row.lat === "") return;
      const regionId = getRegionIdForPoint(Number(row.lon), Number(row.lat));
      if (!regionId) return;
      counts[regionId] = (counts[regionId] || 0) + 1;
    });
    return counts;
  }

  function normalizeRegionValue(value) {
    if (value === "" || value === null || value === undefined) return "";
    const numberValue = Number(String(value).trim());
    return Number.isFinite(numberValue) ? numberValue : "";
  }

  function getRegionTableRows() {
    const counts = getProjectRegionCounts();
    return getRegionRows().map(region => {
      const count = counts[region.id] || 0;
      const hasManualValue = Object.prototype.hasOwnProperty.call(regionValues, region.id);
      const storedValue = hasManualValue ? normalizeRegionValue(regionValues[region.id]) : count;
      return {
        ...region,
        count,
        value: storedValue,
        valueSource: hasManualValue ? "manual" : "project-count",
        valueSourceLabel: hasManualValue ? t("properties.region.manual") : t("properties.region.projectCount"),
        colourSource: regionColourOverrides[region.id] ? "manual" : "auto-by-value",
        colourSourceLabel: regionColourOverrides[region.id] ? t("properties.region.manual") : t("region.colour.autoByValue"),
        included: regionVisibility[region.id] !== false,
        colour: getRegionFill(region.feature, region.index)
      };
    });
  }

  function getColourForRegionValue(value, allValues, colours = getCurrentRegionColourSet()) {
    const numericValue = normalizeRegionValue(value);
    if (numericValue === "" || !colours.length) return colours[0] || "#c7ded5";

    const numericValues = allValues
      .map(normalizeRegionValue)
      .filter(item => item !== "");
    if (!numericValues.length) return colours[0] || "#c7ded5";

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    if (min === max) return numericValue > 0 ? colours[colours.length - 1] : colours[0];

    const ratio = (numericValue - min) / (max - min);
    const colourIndex = Math.max(0, Math.min(colours.length - 1, Math.round(ratio * (colours.length - 1))));
    return colours[colourIndex];
  }

  function applyRegionColoursByValue(shouldRender = true, options = {}) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const regions = getRegionTableRows();
    const includedValues = regions
      .filter(region => region.included)
      .map(region => region.value);
    const comparisonValues = includedValues.length ? includedValues : regions.map(region => region.value);
    regions.forEach(region => {
      if (!regionColourOverrides[region.id]) {
        regionFills[region.id] = getColourForRegionValue(region.value, comparisonValues);
      }
    });
    if (options.refreshRowsOnly) {
      updateRegionSummaryText();
      refreshRegionValueTableRows();
    } else {
      renderRegionControls();
    }
    if (shouldRender) scheduleRender();
  }

  function updateRegionSummaryText() {
    if (!els.regionSummary) return;
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      els.regionSummary.textContent = "";
      return;
    }
    const regions = getRegionRows();
    const selectedCount = regions.filter(region => regionVisibility[region.id] !== false).length;
    els.regionSummary.textContent = t("region.summary.included", { selected: selectedCount, total: regions.length });
    updateWorkspaceSummary();
  }

  function updateRegionValuesFromProjectPoints(options = {}) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const shouldSelectRegions = options.selectRegions !== false;
    const counts = getProjectRegionCounts();
    regionValues = {};

    getRegionRows().forEach(region => {
      const count = counts[region.id] || 0;
      if (shouldSelectRegions) regionVisibility[region.id] = count > 0;
    });

    applyRegionColoursByValue(false);
    scheduleRender();
    setStatusMessage(t("status.regionColoursFromCounts", { count: Object.keys(counts).length }), "ok");
  }

  function resetRegionValues() {
    regionValues = {};
    applyRegionColoursByValue(false);
    scheduleRender();
    setStatusMessage(t("status.regionValuesReset"), "ok");
  }

  function regionColourSetOptionsHtml(region, approvedColours) {
    return `
      <option value=""${region.colourSource === "auto-by-value" ? " selected" : ""}>${escapeHtml(t("region.colour.autoByValue"))}</option>
      ${approvedColours.map((colour, index) => `<option value="${escapeHtml(colour)}"${region.colourSource !== "auto-by-value" && String(region.colour).toLowerCase() === colour.toLowerCase() ? " selected" : ""}>${escapeHtml(getRegionColourPresetLabel(index, approvedColours.length))}</option>`).join("")}
    `;
  }

  function refreshRegionValueTableRow(region, approvedColours = getCurrentRegionColourSet()) {
    if (!region || !els.regionTableBody) return;
    const row = els.regionTableBody.querySelector(`tr[data-region-id="${CSS.escape(region.id)}"]`);
    if (!row) return;
    row.setAttribute("aria-label", t("properties.region.editAria", { name: region.name }));
    const name = row.querySelector(".region-table-name");
    if (name) {
      name.textContent = region.name;
      name.title = region.name;
    }
    const includedInput = row.querySelector(".region-table-included-input");
    if (includedInput) {
      includedInput.checked = Boolean(region.included);
      includedInput.setAttribute("aria-label", t("properties.region.includeAria", { name: region.name }));
    }
    const countCell = row.querySelector(".region-count-cell");
    if (countCell) countCell.textContent = String(region.count);
    const valueInput = row.querySelector(".region-value-input");
    if (valueInput && document.activeElement !== valueInput) {
      valueInput.value = region.value === "" ? "" : String(region.value);
    }
    if (valueInput) valueInput.setAttribute("aria-label", t("properties.region.colourOrderAria", { name: region.name }));
    const presetInput = row.querySelector(".region-colour-set-input");
    if (presetInput) {
      presetInput.innerHTML = regionColourSetOptionsHtml(region, approvedColours);
      presetInput.setAttribute("aria-label", t("region.colour.approvedFillAria", { name: region.name }));
    }
    const colourInput = row.querySelector(".region-colour-input");
    if (colourInput) {
      colourInput.value = region.colour;
      colourInput.setAttribute("aria-label", t("region.colour.fillAria", { name: region.name }));
    }
    const colourText = row.querySelector(".region-fill-picker span");
    if (colourText) colourText.textContent = region.colour;
  }

  function refreshRegionValueTableRows() {
    if (!els.regionTableBody || !canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const approvedColours = getCurrentRegionColourSet();
    getRegionTableRows().forEach(region => refreshRegionValueTableRow(region, approvedColours));
  }

  function renderRegionValueTable() {
    if (!els.regionTableBody) return;
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      els.regionTableBody.innerHTML = `<tr><td colspan="6" class="empty-table-message">${escapeHtml(t("region.table.unavailable"))}</td></tr>`;
      return;
    }

    const rows = getRegionTableRows();
    const approvedColours = getCurrentRegionColourSet();
    els.regionTableBody.innerHTML = rows.map(region => `
      <tr data-region-id="${escapeHtml(region.id)}" tabindex="0" aria-label="${escapeHtml(t("properties.region.editAria", { name: region.name }))}">
        <td><span class="region-table-name" title="${escapeHtml(region.name)}">${escapeHtml(region.name)}</span></td>
        <td class="region-included-cell region-vcell">
          <input class="region-table-included-input" type="checkbox" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(t("properties.region.includeAria", { name: region.name }))}"${region.included ? " checked" : ""}>
        </td>
        <td class="region-count-cell">${region.count}</td>
        <td class="region-value-cell region-vcell">
          <input class="region-value-input" type="number" step="any" value="${region.value === "" ? "" : region.value}" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(t("properties.region.colourOrderAria", { name: region.name }))}">
        </td>
        <td>
          <select class="region-colour-set-input" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(t("region.colour.approvedFillAria", { name: region.name }))}">
            ${regionColourSetOptionsHtml(region, approvedColours)}
          </select>
        </td>
        <td class="region-fill-cell region-vcell">
          <span class="region-fill-picker">
            <input class="region-colour-input" type="color" value="${escapeHtml(region.colour)}" aria-label="${escapeHtml(t("region.colour.fillAria", { name: region.name }))}" data-region-id="${escapeHtml(region.id)}">
            <span>${escapeHtml(region.colour)}</span>
          </span>
        </td>
      </tr>
    `).join("");
  }

  function renderRegionControls() {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      updateRegionSummaryText();
      renderRegionValueTable();
      return;
    }

    renderRegionPresetOptions();
    initializeRegionVisibility();
    updateRegionSummaryText();
    renderRegionValueTable();
  }

  function renderRegionPresetOptions() {
    const options = regionPresetOptions[currentBoundary] || regionPresetOptions.canada;
    const currentValue = els.regionPresetInput.value;
    els.regionPresetInput.innerHTML = options.map(option => {
      const key = option.value === "all" && currentBoundary === "world"
        ? "region.preset.allCountries"
        : option.value
          ? `region.preset.${option.value}`
          : currentBoundary === "world"
            ? "region.preset.chooseContinent"
            : "region.preset.choose";
      const label = t(key);
      return `<option value="${escapeHtml(option.value)}">${escapeHtml(label === key ? option.label : label)}</option>`;
    }).join("");
    els.regionPresetInput.value = options.some(option => option.value === currentValue) ? currentValue : "";
    els.regionPresetInput.disabled = false;
    els.regionPresetInput.title = currentBoundary === "world" ? t("region.preset.worldTitle") : "";
  }

  function clearActiveRegionPreset() {
    if (els.regionPresetInput) els.regionPresetInput.value = "";
  }

  function setAllRegions(visible, options = {}) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    if (!options.preservePreset) clearActiveRegionPreset();
    canadaGeo.features.forEach((feature, index) => {
      regionVisibility[getRegionId(feature, index)] = visible;
    });
    renderRegionControls();
    scheduleRender();
    refreshMapPropertiesIfActive();
  }

  function getRegionPresetNames(preset) {
    const groups = {
      all: [],
      territories: ["yukon", "northwest territories", "nunavut"],
      western: ["british columbia", "alberta", "saskatchewan", "manitoba"],
      prairies: ["alberta", "saskatchewan", "manitoba"],
      central: ["ontario", "quebec"],
      atlantic: ["newfoundland", "labrador", "prince edward island", "nova scotia", "new brunswick"]
    };
    return groups[preset] || [];
  }

  function getWorldPresetContinents(preset) {
    const groups = {
      africa: ["africa"],
      antarctica: ["antarctica"],
      asia: ["asia"],
      europe: ["europe"],
      "north-america": ["north america"],
      oceania: ["oceania"],
      "south-america": ["south america"]
    };
    return groups[preset] || [];
  }

  function regionMatchesPreset(name, presetNames) {
    const normalizedName = String(name || "").toLowerCase();
    return presetNames.some(presetName => normalizedName.includes(presetName));
  }

  function getFeatureContinent(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return String(props.continent || "").trim().toLowerCase();
  }

  function applyRegionPreset(preset) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features) || !preset) return;
    if (preset === "all") {
      setAllRegions(true, { preservePreset: true });
      els.regionPresetInput.value = preset;
      return;
    }

    const presetNames = currentBoundary === "world" ? getWorldPresetContinents(preset) : getRegionPresetNames(preset);
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      const matchValue = currentBoundary === "world" ? getFeatureContinent(feature) : getRegionName(feature, index);
      regionVisibility[id] = regionMatchesPreset(matchValue, presetNames);
    });
    renderRegionControls();
    els.regionPresetInput.value = preset;
    scheduleRender();
    refreshMapPropertiesIfActive();
  }

  function applyRegionColourSet(colours = getCurrentRegionColourSet(), shouldRender = true) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) return;
    canadaGeo.features.forEach((feature, index) => {
      regionFills[getRegionId(feature, index)] = colours[index % colours.length];
    });
    renderRegionControls();
    if (shouldRender) scheduleRender();
  }

  function renderMapStyleOptions() {
    els.mapStylePresetInput.innerHTML = Object.keys(mapStylePresets).map(presetId => {
      const preset = mapStylePresets[presetId];
      return `<option value="${escapeHtml(presetId)}">${escapeHtml(getMapStylePresetLabel(presetId, preset))}</option>`;
    }).join("");
    els.mapStylePresetInput.value = currentMapStylePreset;
  }

  function applyMapStylePreset(presetId, options = {}) {
    const preset = getMapStylePreset(presetId);
    const shouldApplyMapColours = options.applyMapColours !== false;
    const shouldRender = options.render !== false;

    currentMapStylePreset = Object.prototype.hasOwnProperty.call(mapStylePresets, presetId) ? presetId : defaultMapStylePreset;
    els.mapStylePresetInput.value = currentMapStylePreset;
    els.themeStylesheet.setAttribute("href", preset.stylesheet);

    if (shouldApplyMapColours) {
      const settings = getSettings();
      preset.categoryStyles.forEach((style, index) => {
        const category = categorySettings[index];
        if (!category) return;
        category.colour = style.colour;
        category.stroke = style.stroke;
        category.markerSize = optionalNumber(style.markerSize) || category.markerSize || settings.markerSize;
        category.lineWidth = optionalNumber(style.lineWidth) || category.lineWidth || settings.lineWidth;
        category.markerSizeCustom = false;
        category.lineWidthCustom = false;
      });
      applyRegionColoursByValue(false);
      renderCategoryEditors();
      updateTypeOptions();
    }

    if (shouldRender) render();
  }

  function applySelectedMapStyle() {
    applyMapStylePreset(els.mapStylePresetInput.value);
    refreshMapPropertiesIfActive();
  }

  async function changeBoundary(boundaryValue) {
    currentBoundary = Object.prototype.hasOwnProperty.call(boundarySources, boundaryValue) ? boundaryValue : "canada";
    els.boundaryInput.value = currentBoundary;
    renderRegionPresetOptions();
    regionVisibility = {};
    regionFills = {};
    regionValues = {};
    regionColourOverrides = {};
    await loadGeo();
    render();
    refreshMapPropertiesIfActive();
  }

  function applySelectedRegionPreset() {
    const preset = els.regionPresetInput.value;
    applyRegionPreset(preset);
    if (preset) els.regionPresetInput.value = preset;
    refreshMapPropertiesIfActive();
  }

  function resetRegionColours() {
    regionColourOverrides = {};
    applyRegionColoursByValue();
    refreshMapPropertiesIfActive();
  }

  function selectRegionsWithProjectPoints() {
    clearActiveRegionPreset();
    updateRegionValuesFromProjectPoints({ selectRegions: true });
    refreshMapPropertiesIfActive();
  }

  function wrapLabel(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach(word => {
      const candidate = current ? current + " " + word : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    return lines.length ? lines : [String(text)];
  }

  function normalizeMapLanguage(value) {
    return ["en", "fr"].includes(value) ? value : "en";
  }

  function languageFitRenderOptions() {
    return { autoPlace: true, autoPlaceResize: true };
  }

  function switchActiveLanguageLayout(language, fallbackScale = null) {
    const nextLanguage = normalizeMapLanguage(language);
    if (nextLanguage === currentMapLanguage) return;
    syncCurrentLanguageLayoutState();
    currentMapLanguage = nextLanguage;
    activateLanguageLayoutState(currentMapLanguage, fallbackScale);
  }

  function setMapLanguage(value, options = {}) {
    const nextLanguage = normalizeMapLanguage(value);
    const previousScale = els.mapScaleInput ? normalizeMapScale(els.mapScaleInput.value) : null;
    switchActiveLanguageLayout(nextLanguage, previousScale);
    if (els.mapLanguageInput) els.mapLanguageInput.value = currentMapLanguage;
    if (els.previewLanguageInput) els.previewLanguageInput.value = currentMapLanguage;
    if (currentUiLanguage !== currentMapLanguage) {
      currentUiLanguage = currentMapLanguage;
      document.documentElement.lang = currentUiLanguage;
      if (i18n && typeof i18n.applyStaticTranslations === "function") {
        i18n.applyStaticTranslations(currentUiLanguage, document);
      }
      syncUiLanguageControls(currentUiLanguage);
      saveUiLanguagePreference(currentUiLanguage);
      setActiveDataTab(activeDataTable);
    }
    document.title = mapDetails[currentMapLanguage === "fr" ? "titleFr" : "titleEn"] || "Plotypus";
    updateExportLanguageNotice();
    renderPropertiesForActiveState();
    if (options.render !== false) {
      const hasSavedLayout = Object.keys(manualLabelPositions).length > 0;
      requestPreviewRefresh(hasSavedLayout ? {} : languageFitRenderOptions());
    }
    publishReadonlyAppSnapshot();
  }

  function getLabelText(row, language = currentMapLanguage) {
    const en = String(row && row.name || "").trim();
    const fr = String(row && row.nameFr || "").trim();
    if (language === "fr") return fr || en;
    return en || fr;
  }

  function getCategoryText(category, language = currentMapLanguage) {
    const en = String(category && category.label || "").trim();
    const fr = String(category && category.labelFr || "").trim();
    if (language === "fr") return fr || en;
    return en || fr;
  }

  function getChromeText(key, language = currentMapLanguage) {
    const value = chromeTranslations[key] || { en: "", fr: "" };
    const en = String(value.en || "").trim();
    const fr = String(value.fr || "").trim();
    if (language === "fr") return fr || en;
    return en || fr;
  }

  function asLabelLine(text, lang = "en", role = "text") {
    return { text: String(text || ""), lang, role };
  }

  function lineText(line) {
    return typeof line === "string" ? line : String(line && line.text || "");
  }

  function getLabelLines(row, settings) {
    const maxChars = normalizeLabelMaxCharsOverride(row && row.labelMaxChars) || settings.labelMaxChars;
    const lang = settings.mapLanguage === "fr" ? "fr" : "en";
    return wrapLabel(getLabelText(row, settings.mapLanguage), maxChars).map(line => asLabelLine(line, lang));
  }

  function visibleLabelLines(lines) {
    return lines.filter(line => line.role !== "separator");
  }

  function preferredSide(d, settings, mapBounds) {
    if (currentBoundary === "canada") {
      const name = labelKeyText(d);
      if (name.includes("mackenzie")) return "left";
      if (name.includes("red chris") || name.includes("ksi lisims") || name.includes("north coast") || name.includes("lng canada")) return "left";
      if (name.includes("grays") || name.includes("arctic")) return "top";
      if (name.includes("northwest critical")) return "left";
      if (name.includes("pathways") || name.includes("mcilvenna")) return "bottom";
      if (name.includes("taltson") || name.includes("churchill") || name.includes("iqaluit") || name.includes("alto") || name.includes("wind west")) return "right";
      if (name.includes("northcliff") || name.includes("contrecoeur")) return "right";
      if (name.includes("nouveau") || name.includes("darlington") || name.includes("crawford")) return "bottom";
      if (d.lon >= -116 && d.lon <= -108 && d.lat >= 59) return "right";
      if (d.lon >= -116 && d.lon <= -108 && d.lat >= 55) return "bottom";
      if (d.lon >= -106 && d.lon <= -100 && d.lat >= 53 && d.lat <= 56) return "bottom";
      if (d.lon <= -123 && d.lat <= 59) return "left";
      if (d.lon <= -104 && d.lat >= 62) return "top";
      if (d.lon > -75 && d.lat >= 56) return "right";
      if (d.lon > -84 && d.lon < -70 && d.lat < 50) return d.lon < -76 ? "bottom" : "right";
      if (d.lon > -70) return "right";
      if (d.lon > -98 && d.lat >= 56) return "right";
      if (d.lat > 63) return "top";
      if (d.lon < -118) return "left";
    }

    const mapCenter = (mapBounds.x0 + mapBounds.x1) / 2;
    return d.x < mapCenter ? "left" : "right";
  }

  function referenceSideOptions(item) {
    if (currentBoundary !== "canada") return [];
    const name = labelKeyText(item);
    const rules = [
      [/mackenzie|red chris|ksi lisims|north coast|lng canada/, ["left"]],
      [/grays|arctic/, ["top", "left"]],
      [/northwest critical|mcilvenna/, ["bottom", "left"]],
      [/pathways/, ["bottom"]],
      [/taltson|churchill|iqaluit|alto|wind west|northcliff|contrecoeur/, ["right"]],
      [/nouveau|darlington|crawford/, ["bottom", "right"]]
    ];
    const match = rules.find(([pattern]) => pattern.test(name));
    return match ? match[1] : [];
  }

  function labelPriority(row) {
    return toPriority(row && row.priority);
  }

  function placementDifficulty(item, points, settings) {
    const radius = Math.max(46, settings.labelSize * 3.4);
    return points.reduce((count, other) => {
      if (other === item) return count;
      return Math.hypot(item.x - other.x, item.y - other.y) <= radius ? count + 1 : count;
    }, 0);
  }

  function comparePlacementOrder(a, b, points, settings) {
    const priority = labelPriority(b) - labelPriority(a);
    if (priority) return priority;
    const difficulty = placementDifficulty(b, points, settings) - placementDifficulty(a, points, settings);
    if (difficulty) return difficulty;
    return a.y - b.y || a.x - b.x;
  }

  function createProjection(geo, settings) {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    const mapExtent = source.projection === "world"
      ? [[settings.width * 0.06, settings.height * 0.10], [settings.width * 0.94, settings.height * 0.74]]
      : [[settings.width * 0.09, settings.height * 0.07], [settings.width * 0.91, settings.height * 0.78]];
    const scaleFactor = settings.mapScale / 100;
    const scaleCenter = [
      (mapExtent[0][0] + mapExtent[1][0]) / 2,
      (mapExtent[0][1] + mapExtent[1][1]) / 2
    ];
    const applyMapScale = projection => {
      if (scaleFactor === 1) return projection;
      const translate = projection.translate();
      projection
        .scale(projection.scale() * scaleFactor)
        .translate([
          scaleCenter[0] + scaleFactor * (translate[0] - scaleCenter[0]),
          scaleCenter[1] + scaleFactor * (translate[1] - scaleCenter[1])
        ]);
      return projection;
    };

    if (source.projection === "world") {
      return applyMapScale(d3.geoEqualEarth().fitExtent(mapExtent, geo));
    }

    return applyMapScale(d3.geoConicConformal()
      .parallels([49, 77])
      .rotate([96, 0])
      .center([0, 61])
      .fitExtent(mapExtent, geo));
  }

  function projectRowsForLayout(rows, projection) {
    const mappedRows = [];
    const calloutRows = [];
    const projectedProblems = [];
    const hiddenRegionProblems = [];

    rows.forEach(row => {
      const hasCoords = row.lon !== "" && row.lat !== "";
      if (!hasCoords) {
        calloutRows.push(row);
        return;
      }
      const hiddenRegion = getHiddenRegionForPoint(Number(row.lon), Number(row.lat));
      if (hiddenRegion) {
        hiddenRegionProblems.push(`${row.name || t("status.unnamedPoint")} (${hiddenRegion})`);
        return;
      }
      const projected = projection([Number(row.lon), Number(row.lat)]);
      if (!projected || !Number.isFinite(projected[0]) || !Number.isFinite(projected[1])) {
        projectedProblems.push(row.name || t("status.unnamedPoint"));
        return;
      }
      mappedRows.push({ ...row, x: projected[0], y: projected[1] });
    });

    return { mappedRows, calloutRows, projectedProblems, hiddenRegionProblems };
  }

  function createMapLayoutContext(visibleGeo, rows, settings) {
    const projection = createProjection(visibleGeo, settings);
    const path = d3.geoPath(projection);
    const mapBoundsArray = path.bounds(visibleGeo);
    const mapBounds = {
      x0: mapBoundsArray[0][0],
      y0: mapBoundsArray[0][1],
      x1: mapBoundsArray[1][0],
      y1: mapBoundsArray[1][1]
    };
    return {
      settings,
      projection,
      path,
      mapBounds,
      ...projectRowsForLayout(rows, projection)
    };
  }

  function makeLabelBox(d, side, settings, mapBounds = null) {
    const lines = getLabelLines(d, settings);
    const textLines = visibleLabelLines(lines);
    const lineHeight = settings.labelSize * 1.2;
    const footnote = getRenderableFootnote(d.footnote);
    const longest = Math.max(...textLines.map(line => lineText(line).length), 0);
    const baseTextWidth = Math.max(80, longest * settings.labelSize * 0.58);
    const footnoteWidth = footnote ? footnote.length * settings.labelSize * 0.42 + 4 : 0;
    const lastTextLine = textLines[textLines.length - 1] || asLabelLine("");
    const textWidth = Math.max(baseTextWidth, lineText(lastTextLine).length * settings.labelSize * 0.58 + footnoteWidth);
    const textHeight = lines.length * lineHeight;
    return { lines, lineHeight, textWidth, textHeight, footnote, side };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function constrainShiftDrag(start, next, dragState, event) {
    const sourceEvent = event && event.sourceEvent ? event.sourceEvent : null;
    const axisKey = Object.prototype.hasOwnProperty.call(dragState, "axis") ? "axis" : "dragAxis";
    if (!sourceEvent || !sourceEvent.shiftKey) {
      dragState[axisKey] = null;
      return next;
    }

    const dx = next.x - start.x;
    const dy = next.y - start.y;
    if (!dragState[axisKey] && Math.hypot(dx, dy) > 2) {
      dragState[axisKey] = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }

    if (dragState[axisKey] === "x") return { x: next.x, y: start.y };
    if (dragState[axisKey] === "y") return { x: start.x, y: next.y };
    return next;
  }

  function clearDistanceMarkers() {
    d3.select(els.svg.node()).selectAll(".distance-markers").remove();
  }

  function setPreviewLayerVisibility(selector, visible) {
    const svgNode = els.svg ? els.svg.node() : null;
    if (!svgNode) return false;
    const layer = d3.select(svgNode).selectAll(selector);
    const hasLayer = Boolean(layer.size());
    if (hasLayer) layer.style("display", visible ? null : "none");
    return hasLayer;
  }

  function setMapFurnitureVisibility(key, visible, visibilityInput, label) {
    const selector = key === "legend" ? ".legend-layer" : ".callout-layer";
    if (visibilityInput) visibilityInput.checked = visible;
    const hasLayer = setPreviewLayerVisibility(selector, visible);
    if (!visible || hasLayer) {
      setStatusMessage(t("status.visibilityChanged", { label, state: t(visible ? "status.shown" : "status.hidden") }), "ok");
      return true;
    }
    return false;
  }

  function mapBoundsRect(mapBounds) {
    return {
      x0: mapBounds.x0,
      y0: mapBounds.y0,
      x1: mapBounds.x1,
      y1: mapBounds.y1
    };
  }

  function drawMeasurementLine(layer, measurement) {
    if (!measurement || measurement.distance < 1) return;
    const label = `${Math.round(measurement.distance)} px`;
    const variant = measurement.variant ? ` ${measurement.variant}` : "";
    const midX = (measurement.x1 + measurement.x2) / 2;
    const midY = (measurement.y1 + measurement.y2) / 2;
    const isHorizontal = Math.abs(measurement.y1 - measurement.y2) < Math.abs(measurement.x1 - measurement.x2);
    const tickSize = 5;

    layer.append("line")
      .attr("class", `distance-marker-line${variant}`)
      .attr("x1", measurement.x1)
      .attr("y1", measurement.y1)
      .attr("x2", measurement.x2)
      .attr("y2", measurement.y2);

    const ticks = isHorizontal
      ? [
          { x1: measurement.x1, y1: measurement.y1 - tickSize, x2: measurement.x1, y2: measurement.y1 + tickSize },
          { x1: measurement.x2, y1: measurement.y2 - tickSize, x2: measurement.x2, y2: measurement.y2 + tickSize }
        ]
      : [
          { x1: measurement.x1 - tickSize, y1: measurement.y1, x2: measurement.x1 + tickSize, y2: measurement.y1 },
          { x1: measurement.x2 - tickSize, y1: measurement.y2, x2: measurement.x2 + tickSize, y2: measurement.y2 }
        ];

    ticks.forEach(tick => {
      layer.append("line")
        .attr("class", `distance-marker-tick${variant}`)
        .attr("x1", tick.x1)
        .attr("y1", tick.y1)
        .attr("x2", tick.x2)
        .attr("y2", tick.y2);
    });

    const badgeWidth = Math.max(42, label.length * 7 + 14);
    const badgeX = clamp(midX - badgeWidth / 2, 4, measurement.settings.width - badgeWidth - 4);
    const badgeY = clamp(midY - 10, 4, measurement.settings.height - 22);
    const badge = layer.append("g")
      .attr("class", `distance-marker-badge${variant}`)
      .attr("transform", `translate(${badgeX},${badgeY})`);

    badge.append("rect")
      .attr("width", badgeWidth)
      .attr("height", 20);

    badge.append("text")
      .attr("x", badgeWidth / 2)
      .attr("y", 14)
      .text(label);
  }

  function nearestCanvasMeasurements(subjectRect, settings) {
    const center = rectCenter(subjectRect);
    const leftDistance = subjectRect.x0;
    const rightDistance = settings.width - subjectRect.x1;
    const topDistance = subjectRect.y0;
    const bottomDistance = settings.height - subjectRect.y1;
    const horizontal = leftDistance <= rightDistance
      ? { x1: 0, y1: center.y, x2: subjectRect.x0, y2: center.y, distance: leftDistance, settings }
      : { x1: subjectRect.x1, y1: center.y, x2: settings.width, y2: center.y, distance: rightDistance, settings };
    const vertical = topDistance <= bottomDistance
      ? { x1: center.x, y1: 0, x2: center.x, y2: subjectRect.y0, distance: topDistance, settings }
      : { x1: center.x, y1: subjectRect.y1, x2: center.x, y2: settings.height, distance: bottomDistance, settings };

    return [horizontal, vertical];
  }

  function nearestRectMeasurement(subjectRect, targetRect, settings) {
    const subjectCenter = rectCenter(subjectRect);
    const targetCenter = rectCenter(targetRect);
    const overlapX = Math.min(subjectRect.x1, targetRect.x1) - Math.max(subjectRect.x0, targetRect.x0);
    const overlapY = Math.min(subjectRect.y1, targetRect.y1) - Math.max(subjectRect.y0, targetRect.y0);
    const candidates = [];

    if (subjectRect.x0 >= targetRect.x1) {
      const y = clamp(subjectCenter.y, targetRect.y0, targetRect.y1);
      candidates.push({ x1: targetRect.x1, y1: y, x2: subjectRect.x0, y2: y, distance: subjectRect.x0 - targetRect.x1, settings });
    } else if (targetRect.x0 >= subjectRect.x1) {
      const y = clamp(subjectCenter.y, targetRect.y0, targetRect.y1);
      candidates.push({ x1: subjectRect.x1, y1: y, x2: targetRect.x0, y2: y, distance: targetRect.x0 - subjectRect.x1, settings });
    } else if (overlapX > 0) {
      candidates.push({ x1: subjectCenter.x, y1: subjectRect.y0, x2: subjectCenter.x, y2: targetRect.y0, distance: Math.abs(subjectRect.y0 - targetRect.y0), settings });
      candidates.push({ x1: subjectCenter.x, y1: subjectRect.y1, x2: subjectCenter.x, y2: targetRect.y1, distance: Math.abs(subjectRect.y1 - targetRect.y1), settings });
    }

    if (subjectRect.y0 >= targetRect.y1) {
      const x = clamp(subjectCenter.x, targetRect.x0, targetRect.x1);
      candidates.push({ x1: x, y1: targetRect.y1, x2: x, y2: subjectRect.y0, distance: subjectRect.y0 - targetRect.y1, settings });
    } else if (targetRect.y0 >= subjectRect.y1) {
      const x = clamp(subjectCenter.x, targetRect.x0, targetRect.x1);
      candidates.push({ x1: x, y1: subjectRect.y1, x2: x, y2: targetRect.y0, distance: targetRect.y0 - subjectRect.y1, settings });
    } else if (overlapY > 0) {
      candidates.push({ x1: subjectRect.x0, y1: subjectCenter.y, x2: targetRect.x0, y2: subjectCenter.y, distance: Math.abs(subjectRect.x0 - targetRect.x0), settings });
      candidates.push({ x1: subjectRect.x1, y1: subjectCenter.y, x2: targetRect.x1, y2: subjectCenter.y, distance: Math.abs(subjectRect.x1 - targetRect.x1), settings });
    }

    return candidates
      .filter(candidate => Number.isFinite(candidate.distance) && candidate.distance > 0)
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }

  function nearestLabelMeasurement(subjectRect, activeLabelKey, settings) {
    const placed = lastLayout && Array.isArray(lastLayout.placed) ? lastLayout.placed : [];
    return placed
      .filter(label => label.labelKey !== activeLabelKey)
      .map(label => nearestRectMeasurement(subjectRect, labelVisualBox(label, 8), settings))
      .filter(Boolean)
      .sort((a, b) => a.distance - b.distance)[0] || null;
  }

  function drawDistanceMarkers(svg, settings, subjectRect, options = {}) {
    if (!settings.showDistanceMarkers) {
      clearDistanceMarkers();
      return;
    }
    clearDistanceMarkers();
    const layer = svg.append("g")
      .attr("class", "distance-markers")
      .attr("aria-label", t("map.distanceMarkers"));

    nearestCanvasMeasurements(subjectRect, settings)
      .forEach(measurement => drawMeasurementLine(layer, measurement));

    if (options.mapBounds) {
      drawMeasurementLine(layer, nearestRectMeasurement(subjectRect, mapBoundsRect(options.mapBounds), settings));
    }

    if (options.includeNearbyLabels) {
      drawMeasurementLine(layer, nearestLabelMeasurement(subjectRect, options.activeLabelKey, settings));
    }

    if (!layer.selectAll("*").size()) layer.remove();
  }

  function labelFontSize(label) {
    return label.lineHeight / 1.2;
  }

  function labelVisualHeight(label) {
    return label.textHeight - label.lineHeight + labelFontSize(label);
  }

  function labelBaselineForCenter(centerY, label) {
    return centerY + labelFontSize(label) - labelVisualHeight(label) / 2;
  }

  function clampLabelBaseline(y, label, minY, maxY) {
    const fontSize = labelFontSize(label);
    return clamp(y, minY + fontSize, maxY - labelVisualHeight(label) + fontSize);
  }

  function createHorizontalSlots(items, boxes, side, settings, mapBounds) {
    const x0 = 30;
    const x1 = settings.width - 30;
    const gap = Math.max(28, settings.labelSize * 1.8);
    const rowGap = Math.max(18, settings.labelSize * 1.2);
    const baseY = side === "top" ? mapBounds.y0 - 58 : mapBounds.y1 + 56;
    const rows = [];

    items.forEach((item, index) => {
      const box = boxes[index];
      const minX = x0;
      const maxX = Math.max(x0, x1 - box.textWidth);
      const desiredX = clamp(item.x - box.textWidth / 2 + getDesignerHorizontalOffset(item, side, settings), minX, maxX);
      let targetRow = null;

      for (const row of rows) {
        const last = row[row.length - 1];
        if (!last || desiredX >= last.x + last.box.textWidth + gap) {
          targetRow = row;
          break;
        }
      }

      if (!targetRow) {
        targetRow = [];
        rows.push(targetRow);
      }

      const previous = targetRow[targetRow.length - 1];
      const x = previous ? Math.max(desiredX, previous.x + previous.box.textWidth + gap) : desiredX;
      targetRow.push({ item, box, x: clamp(x, minX, maxX) });
    });

    rows.forEach(row => {
      let overflow = row.length ? row[row.length - 1].x + row[row.length - 1].box.textWidth - x1 : 0;
      for (let i = row.length - 1; overflow > 0 && i >= 0; i--) {
        const minX = i > 0 ? row[i - 1].x + row[i - 1].box.textWidth + gap : x0;
        const shift = Math.min(overflow, row[i].x - minX);
        row[i].x -= shift;
        overflow -= shift;
      }
    });

    const rowHeights = rows.map(row => row.reduce((height, slot) => Math.max(height, slot.box.textHeight), 0));
    const rowOffsets = [];
    rowHeights.reduce((offset, height, index) => {
      rowOffsets[index] = offset;
      return offset + height + rowGap;
    }, 0);

    const totalBlockHeight = rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rows.length - 1) * rowGap;
    const minY = Math.max(50, settings.labelSize * 1.2 + 12);
    const canvasBottom = settings.height - 24;
    const sideGap = Math.max(24, settings.labelSize * 1.5);

    const slotsByItem = new Map();
    rows.forEach((row, rowIndex) => {
      row.forEach(slot => {
        const fontSize = labelFontSize(slot.box);
        const visualHeight = labelVisualHeight(slot.box);
        const maxTopBaseline = mapBounds.y0 - sideGap - visualHeight + fontSize;
        const minBottomBaseline = mapBounds.y1 + sideGap + fontSize;
        const topY = clamp(baseY - rowOffsets[rowIndex], minY, Math.max(minY, maxTopBaseline));
        const bottomY = clamp(baseY + rowOffsets[rowIndex], Math.min(canvasBottom, minBottomBaseline), canvasBottom);
        slotsByItem.set(slot.item, {
          side,
          x: slot.x,
          y: side === "top" ? topY : bottomY,
          box: slot.box
        });
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function createVerticalSlots(items, boxes, side, settings, mapBounds) {
    const labelGap = Math.max(22, settings.labelSize * 1.35);
    const minY = Math.max(58, settings.labelSize * 2);
    const maxY = settings.height - 44;
    const sideGap = Math.max(24, settings.labelSize * 1.5);
    const slots = items.map((item, index) => {
      const box = boxes[index];
      const centerY = item.y + getDesignerVerticalOffset(item, side, settings);
      return {
        item,
        box,
        y: clampLabelBaseline(labelBaselineForCenter(centerY, box), box, minY, maxY)
      };
    });

    slots.sort((a, b) => a.y - b.y);
    for (let i = 1; i < slots.length; i += 1) {
      const previous = slots[i - 1];
      const current = slots[i];
      const previousBottom = previous.y - labelFontSize(previous.box) + labelVisualHeight(previous.box);
      const minCurrentY = previousBottom + labelGap + labelFontSize(current.box);
      if (current.y < minCurrentY) current.y = minCurrentY;
    }

    for (let i = slots.length - 1; i >= 0; i -= 1) {
      const slot = slots[i];
      const maxSlotY = maxY - labelVisualHeight(slot.box) + labelFontSize(slot.box);
      if (slot.y > maxSlotY) slot.y = maxSlotY;
      if (i < slots.length - 1) {
        const next = slots[i + 1];
        const nextTop = next.y - labelFontSize(next.box);
        const maxBeforeNext = nextTop - labelGap - labelVisualHeight(slot.box) + labelFontSize(slot.box);
        if (slot.y > maxBeforeNext) slot.y = maxBeforeNext;
      }
      slot.y = Math.max(slot.y, minY + labelFontSize(slot.box));
    }

    const slotsByItem = new Map();
    slots.forEach(slot => {
      const lineOffset = getDesignerLineOffset(slot.item, side, settings);
      const leftMin = 30 + slot.box.textWidth;
      const leftMax = mapBounds.x0 - sideGap;
      const rightMin = mapBounds.x1 + sideGap;
      const rightMax = settings.width - slot.box.textWidth - 30;
      const leftX = leftMax >= leftMin
        ? clamp(slot.item.x - lineOffset, leftMin, leftMax)
        : leftMin;
      const rightX = rightMax >= rightMin
        ? clamp(slot.item.x + lineOffset, rightMin, rightMax)
        : Math.max(30, rightMax);
      slotsByItem.set(slot.item, {
        side,
        x: side === "left" ? leftX : rightX,
        y: slot.y,
        box: slot.box
      });
    });

    return items.map(item => slotsByItem.get(item));
  }

  function labelKeyText(item) {
    return String(item.name || "").toLowerCase();
  }

  function getDesignerLineOffset(item, side, settings) {
    const unit = settings.labelSize;
    const base = Math.max(130, unit * 8);
    if (currentBoundary !== "canada") return base;

    const name = labelKeyText(item);
    if (side === "left") {
      if (item.lon <= -126) return Math.max(220, unit * 13);
      if (name.includes("red chris")) return Math.max(215, unit * 12.5);
      if (name.includes("north coast") || name.includes("lng canada")) return Math.max(190, unit * 11);
      return Math.max(170, unit * 10);
    }

    if (side === "right") {
      if (name.includes("iqaluit")) return Math.max(210, unit * 12);
      if (name.includes("churchill") || name.includes("taltson")) return Math.max(310, unit * 18);
      if (name.includes("northcliff")) return Math.max(190, unit * 11);
      if (item.lon > -76 && item.lat < 48) return Math.max(175, unit * 10);
      return base;
    }

    return base;
  }

  function getDesignerHorizontalOffset(item, side, settings) {
    if (currentBoundary !== "canada") return 0;
    const unit = settings.labelSize;
    const name = labelKeyText(item);

    if (side === "top") {
      if (name.includes("mackenzie")) return -unit * 12;
      if (name.includes("arctic")) return -unit * 18;
      if (name.includes("grays")) return -unit * 3;
      if (item.lon < -118) return -unit * 8;
      return -unit * 3;
    }

    if (side === "bottom") {
      if (name.includes("crawford")) return -unit * 4;
      if (name.includes("darlington")) return -unit * 1;
      if (name.includes("pathways")) return -unit * 11;
      if (name.includes("mcilvenna")) return -unit * 4;
      if (name.includes("nouveau")) return unit * 9;
      return unit * 1.5;
    }

    return 0;
  }

  function getDesignerVerticalOffset(item, side, settings) {
    if (currentBoundary !== "canada") return 0;
    const unit = settings.labelSize;
    const name = labelKeyText(item);

    if (side === "left") {
      if (name.includes("northwest critical")) return unit * 7;
      if (name.includes("red chris")) return -unit * 7;
      if (name.includes("ksi lisims")) return unit * 0.3;
      if (name.includes("north coast")) return unit * 3.4;
      if (name.includes("lng canada")) return unit * 6;
      if (item.lat >= 58) return -unit * 3.8;
      if (item.lat >= 55) return -unit * 1.8;
      if (item.lat <= 52) return unit * 3.2;
      return unit * 1.2;
    }

    if (side === "right") {
      if (name.includes("taltson")) return -unit * 8;
      if (name.includes("churchill")) return -unit * 5.5;
      if (name.includes("iqaluit")) return -unit * 0.5;
      if (name.includes("northcliff")) return unit * 2;
      if (name.includes("wind west")) return unit * 4.2;
      if (name.includes("nouveau")) return unit * 5.8;
      if (name.includes("contrecoeur")) return unit * 8;
      if (name.includes("alto")) return unit * 10.5;
      if (item.lon > -76 && item.lat < 48) return unit * 4.2;
      if (item.lon > -70 && item.lat < 48) return unit * 3.2;
      if (item.lat >= 58) return -unit * 0.8;
      return unit * 0.8;
    }

    return 0;
  }

  function createSlots(items, side, settings, mapBounds) {
    const boxes = items.map(d => makeLabelBox(d, side, settings, mapBounds));

    if (side === "left" || side === "right") {
      return createVerticalSlots(items, boxes, side, settings, mapBounds);
    }

    return createHorizontalSlots(items, boxes, side, settings, mapBounds);
  }

  function subtractInterval(intervals, blockedStart, blockedEnd) {
    return intervals.flatMap(interval => {
      const start = Math.max(interval.start, blockedStart);
      const end = Math.min(interval.end, blockedEnd);
      if (end <= start) return [interval];
      const next = [];
      if (start > interval.start) next.push({ start: interval.start, end: start });
      if (end < interval.end) next.push({ start: end, end: interval.end });
      return next;
    });
  }

  function createCapacitySide(side, zone, settings, obstacles) {
    const axis = side === "left" || side === "right" ? "y" : "x";
    const minSegment = Math.max(24, settings.labelSize * 1.6);
    let intervals = axis === "y"
      ? [{ start: zone.y0, end: zone.y1 }]
      : [{ start: zone.x0, end: zone.x1 }];

    obstacles.forEach(obstacle => {
      if (!rectsOverlap(zone, obstacle.rect)) return;
      intervals = axis === "y"
        ? subtractInterval(intervals, obstacle.rect.y0, obstacle.rect.y1)
        : subtractInterval(intervals, obstacle.rect.x0, obstacle.rect.x1);
    });

    return {
      side,
      zone,
      axis,
      thickness: axis === "y" ? zone.x1 - zone.x0 : zone.y1 - zone.y0,
      intervals: intervals
        .map(interval => ({ ...interval, remaining: interval.end - interval.start }))
        .filter(interval => interval.remaining >= minSegment)
    };
  }

  function createPerimeterCapacity(settings, mapBounds, obstacles = []) {
    const margin = Math.max(24, settings.labelSize * 1.5);
    const overlapAllowance = Math.max(18, settings.labelSize * 1.4);
    const x0 = margin;
    const y0 = margin;
    const x1 = settings.width - margin;
    const y1 = settings.height - margin;
    const mapRect = mapBoundsRect(mapBounds);
    const zones = {
      left: {
        x0,
        y0,
        x1: Math.max(x0, mapRect.x0 + overlapAllowance),
        y1
      },
      right: {
        x0: Math.min(x1, mapRect.x1 - overlapAllowance),
        y0,
        x1,
        y1
      },
      top: {
        x0,
        y0,
        x1,
        y1: Math.max(y0, mapRect.y0 + overlapAllowance)
      },
      bottom: {
        x0,
        y0: Math.min(y1, mapRect.y1 - overlapAllowance),
        x1,
        y1
      }
    };

    return Object.fromEntries(Object.entries(zones).map(([side, zone]) => [
      side,
      createCapacitySide(side, zone, settings, obstacles)
    ]));
  }

  function cloneCapacity(capacity) {
    return Object.fromEntries(Object.entries(capacity).map(([side, state]) => [
      side,
      {
        ...state,
        zone: { ...state.zone },
        intervals: state.intervals.map(interval => ({ ...interval }))
      }
    ]));
  }

  function labelCapacityDemand(label, side, settings, mapBounds) {
    const box = makeLabelBox(label, side, settings, mapBounds);
    const gap = Math.max(8, settings.labelSize * 0.65);
    return {
      side,
      box,
      length: side === "left" || side === "right"
        ? labelVisualHeight(box) + gap
        : box.textWidth + gap,
      thickness: side === "left" || side === "right"
        ? box.textWidth
        : labelVisualHeight(box)
    };
  }

  function tryReserveCapacity(sideState, demand) {
    if (!sideState || sideState.thickness < demand.thickness * 0.72) return false;
    const interval = sideState.intervals
      .filter(item => item.remaining >= demand.length)
      .sort((a, b) => a.remaining - b.remaining)[0];
    if (!interval) return false;
    interval.remaining -= demand.length;
    return true;
  }

  function assessPerimeterFeasibility(labelRows, settings, mapBounds, obstacles = []) {
    if (!labelRows.length) {
      return { feasible: true, placed: 0, total: 0, capacity: createPerimeterCapacity(settings, mapBounds, obstacles), unmet: [] };
    }

    const capacity = cloneCapacity(createPerimeterCapacity(settings, mapBounds, obstacles));
    const ordered = labelRows.slice().sort((a, b) => {
      const aBox = makeLabelBox(a, preferredSide(a, settings, mapBounds), settings, mapBounds);
      const bBox = makeLabelBox(b, preferredSide(b, settings, mapBounds), settings, mapBounds);
      return Math.max(bBox.textWidth, labelVisualHeight(bBox)) - Math.max(aBox.textWidth, labelVisualHeight(aBox));
    });
    const unmet = [];

    ordered.forEach(label => {
      const preferred = preferredSide(label, settings, mapBounds);
      const sides = compatibleSideOrder(preferred);
      const placed = sides.some(side => tryReserveCapacity(capacity[side], labelCapacityDemand(label, side, settings, mapBounds)));
      if (!placed) unmet.push(label);
    });

    return {
      feasible: unmet.length === 0,
      placed: labelRows.length - unmet.length,
      total: labelRows.length,
      capacity,
      unmet
    };
  }

  function chooseFeasibleMapLayoutContext(visibleGeo, rows, baseSettings, options = {}) {
    const startScale = normalizeMapScale(baseSettings.mapScale);
    const minScale = Math.min(startScale, 65);
    const step = 5;
    let fallback = null;

    for (let scale = startScale; scale >= minScale; scale -= step) {
      const settings = { ...baseSettings, mapScale: scale };
      const context = createMapLayoutContext(visibleGeo, rows, settings);
      const labelRows = context.mappedRows.filter(row => row.name);
      settings.layoutObstacles = getLayoutBoxObstacles(settings, context.calloutRows);
      const feasibility = assessPerimeterFeasibility(labelRows, settings, context.mapBounds, settings.layoutObstacles);
      const placementQuality = feasibility.feasible
        ? measurePlacementQuality(layoutLabels(labelRows, settings, context.mapBounds, {
          applyManual: options.ignoreManualPositions !== true
        }), settings)
        : null;
      const candidate = { ...context, settings, feasibility, placementQuality, requestedMapScale: startScale };
      if (isBetterScaleFallback(candidate, fallback)) fallback = candidate;
      if (feasibility.feasible && placementQualityAcceptable(placementQuality)) {
        return candidate;
      }
    }

    return fallback || createMapLayoutContext(visibleGeo, rows, baseSettings);
  }

  function getVisibleRegionSignature() {
    return Object.keys(regionVisibility)
      .sort()
      .map(name => `${name}:${regionVisibility[name] === false ? 0 : 1}`)
      .join("|");
  }

  function getLayoutCacheKey(rows, settings, resizeMap) {
    const rowSignature = rows.map(row => [
      row.rowId,
      row.name,
      row.nameFr,
      row.footnote,
      row.type,
      row.priority,
      row.lon,
      row.lat,
      row.hideLine ? 1 : 0,
      row.elbowLeader ? 1 : 0,
      row.labelMaxChars || ""
    ]);
    const categorySignature = categorySettings.map(category => [
      category.id,
      category.label,
      category.labelFr,
      category.shape,
      category.colour,
      category.markerSize,
      category.lineWidth,
      category.hidden ? 1 : 0
    ]);
    const settingsSignature = {
      resizeMap: resizeMap ? 1 : 0,
      boundary: currentBoundary,
      mapStyle: currentMapStylePreset,
      regions: getVisibleRegionSignature(),
      regionColourOverrides,
      manualBoxPositions,
      width: settings.width,
      height: settings.height,
      mapScale: settings.mapScale,
      labelSizeRender: settings.labelSizeRender,
      labelMaxChars: settings.labelMaxChars,
      markerSize: settings.markerSize,
      lineWidth: settings.lineWidth,
      mapLanguage: settings.mapLanguage,
      fontFamily: settings.fontFamily,
      showLegend: settings.showLegend ? 1 : 0,
      showCallouts: settings.showCallouts ? 1 : 0,
      compactFurniture: settings.compactFurniture ? 1 : 0,
      showLineCasing: settings.showLineCasing ? 1 : 0,
      routeDenseLeaders: settings.routeDenseLeaders ? 1 : 0,
      categories: categorySignature,
      rows: rowSignature,
      chromeTranslations
    };
    return JSON.stringify(settingsSignature);
  }

  function cloneLayoutRow(row) {
    return {
      ...row,
      lines: Array.isArray(row.lines) ? row.lines.map(line => typeof line === "string" ? line : { ...line }) : row.lines
    };
  }

  function cloneLayoutBundle(bundle) {
    if (!bundle) return null;
    return {
      settings: {
        ...bundle.settings,
        layoutObstacles: Array.isArray(bundle.settings.layoutObstacles)
          ? bundle.settings.layoutObstacles.map(obstacle => ({ ...obstacle }))
          : bundle.settings.layoutObstacles
      },
      layoutContext: {
        ...bundle.layoutContext,
        settings: {
          ...bundle.layoutContext.settings,
          layoutObstacles: Array.isArray(bundle.layoutContext.settings.layoutObstacles)
            ? bundle.layoutContext.settings.layoutObstacles.map(obstacle => ({ ...obstacle }))
            : bundle.layoutContext.settings.layoutObstacles
        },
        mappedRows: bundle.layoutContext.mappedRows.map(cloneLayoutRow),
        calloutRows: bundle.layoutContext.calloutRows.map(cloneLayoutRow),
        projectedProblems: bundle.layoutContext.projectedProblems.map(problem => ({ ...problem })),
        hiddenRegionProblems: bundle.layoutContext.hiddenRegionProblems.map(problem => ({ ...problem }))
      },
      placed: bundle.placed.map(cloneLayoutRow)
    };
  }

  function rememberLanguageLayout(key, bundle) {
    if (!key || !bundle) return;
    languageLayoutCache.set(key, cloneLayoutBundle(bundle));
    while (languageLayoutCache.size > languageLayoutCacheLimit) {
      languageLayoutCache.delete(languageLayoutCache.keys().next().value);
    }
  }

  function getCachedLanguageLayout(key) {
    return cloneLayoutBundle(languageLayoutCache.get(key));
  }

  function computeLanguageLayout(visibleGeo, rows, baseSettings, resizeMap, options = {}) {
    const layoutContext = resizeMap
      ? chooseFeasibleMapLayoutContext(visibleGeo, rows, baseSettings, options)
      : createMapLayoutContext(visibleGeo, rows, baseSettings);
    const settings = layoutContext.settings;
    settings.layoutObstacles = getLayoutBoxObstacles(settings, layoutContext.calloutRows);
    const labelRows = layoutContext.mappedRows.filter(row => row.name);
    const placed = layoutLabels(labelRows, settings, layoutContext.mapBounds, {
      applyManual: options.ignoreManualPositions !== true
    });
    return { settings, layoutContext, placed };
  }

  function layoutLabels(points, settings, mapBounds, options = {}) {
    const placed = layoutLabelsWithoutManualPositions(points, settings, mapBounds);
    return applyManualLabelPositions(placed, options.applyManual !== false);
  }

  function getLabelKey(row) {
    return row.rowId ? `row:${row.rowId}` : getLegacyLabelKey(row);
  }

  function getLegacyLabelKey(row) {
    return `${cleanType(row.type)}|${row.name}`;
  }

  function applyManualLabelPositions(placed, useManualPositions = true) {
    return applyManualLabelPositionsFromLayout(placed, {
      useManualPositions,
      manualLabelPositions,
      getLegacyLabelKey
    });
  }

  function rememberLabelPositions(placed) {
    setCurrentManualLabelPositions(collectLabelPositions(placed));
  }

  function lineEnd(d) {
    const box = labelVisualBox(d);
    if (d.labelSide === "left") return { x: box.x1 + 8, y: box.centerY };
    if (d.labelSide === "right") return { x: box.x0 - 8, y: box.centerY };
    if (d.labelSide === "top") return { x: box.centerX, y: box.y1 + 8 };
    return { x: box.centerX, y: box.y0 - 8 };
  }

  function labelVisualBox(d, pad = 0) {
    const x = d.labelSide === "left" ? d.labelX - d.textWidth : d.labelX;
    const y = d.labelY - labelFontSize(d);
    const width = d.textWidth;
    const height = labelVisualHeight(d);
    return {
      x0: x - pad,
      y0: y - pad,
      x1: x + width + pad,
      y1: y + height + pad,
      centerX: x + width / 2,
      centerY: y + height / 2
    };
  }

  function labelBackgroundRect(d) {
    const padX = 8;
    const padY = 5;
    const box = labelVisualBox(d);
    return {
      x0: box.x0 - padX,
      y0: box.y0 - padY,
      x1: box.x1 + padX,
      y1: box.y1 + padY,
      centerX: box.centerX,
      centerY: box.centerY
    };
  }

  function labelRect(d) {
    return labelVisualBox(d, 10);
  }

  function analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds) {
    let crossings = 0;
    let overlaps = 0;
    let minLabelGap = Infinity;
    const lines = placed
      .filter(d => !d.hideLine)
      .map(d => ({ segments: leaderSegmentsForLabel(d, settings), length: leaderPathLength(d, settings), d }));
    const rects = placed.map(labelRect);
    const edgeLimit = Math.max(10, settings.labelSizeRender || settings.labelSize || 12);
    const labelsNearEdge = rects.filter(rect => (
      rect.x0 < edgeLimit
      || rect.y0 < edgeLimit
      || settings.width - rect.x1 < edgeLimit
      || settings.height - rect.y1 < edgeLimit
    )).length;

    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const crosses = lines[i].segments.some(a => lines[j].segments.some(b => segmentsCross(a.start, a.end, b.start, b.end)));
        if (crosses) crossings++;
      }
    }

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (rectsOverlap(rects[i], rects[j])) {
          overlaps++;
          minLabelGap = 0;
        } else {
          const dx = Math.max(0, Math.max(rects[i].x0 - rects[j].x1, rects[j].x0 - rects[i].x1));
          const dy = Math.max(0, Math.max(rects[i].y0 - rects[j].y1, rects[j].y0 - rects[i].y1));
          minLabelGap = Math.min(minLabelGap, Math.hypot(dx, dy));
        }
      }
    }

    const longLines = lines.filter(line => line.length > maxAllowedLeaderLength(settings)).length;
    const longestLeader = lines.reduce((best, line) => !best || line.length > best.length ? line : best, null);

    return {
      crossings,
      overlaps,
      longLines,
      projectedProblems,
      hiddenRegionProblems,
      labelsNearEdge,
      minLabelGap: Number.isFinite(minLabelGap) ? minLabelGap : null,
      longestLeaderLength: longestLeader ? longestLeader.length : 0,
      longestLeaderName: longestLeader ? longestLeader.d.name : ""
    };
  }

  function checklistItem(state, label, detail, action = null) {
    const className = state === "ok" ? "status-ok" : state === "danger" ? "status-danger" : "status-warning";
    return `
      <div class="checklist-item ${className}">
        <span class="checklist-state">${escapeHtml(state === "ok" ? t("quality.check.status.ok") : t("quality.check.status.review"))}</span>
        <span>
          <strong>${escapeHtml(label)}</strong>
          ${detail ? `<br><span>${escapeHtml(detail)}</span>` : ""}
        </span>
        ${action ? `<button type="button" data-status-action="${escapeHtml(action.action)}">${escapeHtml(action.label)}</button>` : ""}
      </div>
    `;
  }

  function getEmptyCategoryLabels(rows) {
    const usedCategories = new Set(rows.map(row => cleanType(row.type)));
    return categorySettings
      .filter(category => !usedCategories.has(category.id))
      .map(category => getCategoryLabel(category.id, currentUiLanguage));
  }

  function getExportSizeMessage(settings) {
    const pngWidth = settings.width * 2;
    const pngHeight = settings.height * 2;
    const megapixels = (pngWidth * pngHeight / 1000000).toFixed(1);
    return t("quality.exportSizeMessage", {
      width: settings.width,
      height: settings.height,
      pngWidth,
      pngHeight,
      megapixels
    });
  }

  function updateStatus(rows, mappedRows, calloutRows, report, geoLoaded) {
    const settings = getSettings();
    const checklist = [];
    const emptyCategories = getEmptyCategoryLabels(rows);
    const pngMegapixels = settings.width * settings.height * 4 / 1000000;
    const boundaryLabel = getBoundaryLabel(currentBoundary, currentUiLanguage);
    const regionNoun = t(currentBoundary === "canada" ? "quality.regionNoun.canada" : "quality.regionNoun.world");

    checklist.push(geoLoaded
      ? checklistItem("ok", t("quality.check.boundaryLoaded"), t("quality.check.boundaryLoadedDetail", { boundary: boundaryLabel }))
      : checklistItem("danger", t("quality.check.boundaryMissing"), t("quality.check.boundaryMissingDetail")));

    checklist.push(rows.length
      ? checklistItem("ok", t("quality.check.projectLoaded"), t("quality.check.projectLoadedDetail", { rows: rows.length, mapped: mappedRows.length }))
      : checklistItem("danger", t("quality.check.projectMissing"), t("quality.check.projectMissingDetail")));

    checklist.push(calloutRows.length
      ? checklistItem("warning", t("quality.check.missingCoordinates"), t("quality.check.missingCoordinatesDetail", { count: calloutRows.length }))
      : checklistItem("ok", t("quality.check.coordinatesComplete"), t("quality.check.coordinatesCompleteDetail")));

    const translationSummary = getTranslationSummary();
    checklist.push(translationSummary.projectMissing
      ? checklistItem(
        "warning",
        t("quality.check.frenchTitles"),
        t("quality.check.frenchTitlesMissing", { missing: translationSummary.projectMissing, total: translationSummary.projectTotal }),
        { action: "open-translations-missing", label: t("quality.check.locate") }
      )
      : checklistItem("ok", t("quality.check.frenchTitles"), t("quality.check.frenchTitlesComplete")));

    checklist.push(report.hiddenRegionProblems.length
      ? checklistItem("warning", t("quality.check.hiddenPoints"), t("quality.check.hiddenPointsDetail", { count: report.hiddenRegionProblems.length, regionNoun }))
      : checklistItem("ok", t("quality.check.noHiddenPoints"), t("quality.check.noHiddenPointsDetail")));

    checklist.push(report.projectedProblems.length
      ? checklistItem("danger", t("quality.check.invalidCoordinates"), t("quality.check.invalidCoordinatesDetail", { count: report.projectedProblems.length }))
      : checklistItem("ok", t("quality.check.coordinateRanges"), t("quality.check.coordinateRangesDetail")));

    checklist.push(report.overlaps
      ? checklistItem("warning", t("quality.metric.labelOverlaps"), t("quality.check.labelOverlapsDetail", { count: report.overlaps }))
      : checklistItem("ok", t("quality.metric.labelOverlaps"), t("quality.check.noLabelOverlapsDetail")));

    checklist.push(report.crossings
      ? checklistItem("warning", t("quality.check.leaderCrossings"), t("quality.check.leaderCrossingsDetail", { count: report.crossings }))
      : checklistItem("ok", t("quality.check.leaderCrossings"), t("quality.check.noLeaderCrossingsDetail")));

    checklist.push(!rows.length
      ? checklistItem("warning", t("quality.check.legendCategories"), t("quality.check.legendCategoriesMissing"))
      : emptyCategories.length
        ? checklistItem("warning", t("quality.check.emptyLegendCategories"), emptyCategories.join(", "))
        : checklistItem("ok", t("quality.check.legendCategories"), t("quality.check.legendCategoriesComplete")));

    checklist.push(pngMegapixels > 16
      ? checklistItem("warning", t("quality.check.exportSize"), t("quality.check.exportSizeLarge", { message: getExportSizeMessage(settings) }))
      : checklistItem("ok", t("quality.check.exportSize"), getExportSizeMessage(settings)));

    if (report.longLines) {
      checklist.push(checklistItem("warning", t("quality.check.longLeaderLines"), t("quality.check.longLeaderLinesDetail", { count: report.longLines })));
    }

    lastImportMessages.forEach(message => {
      checklist.push(checklistItem("warning", t("quality.check.csvImportNote"), message));
    });

    els.statusBox.innerHTML = `
      <div class="quality-checklist">
        <strong>${escapeHtml(t("quality.check.title"))}</strong>
        ${checklist.join("")}
      </div>
    `;
    refreshQualityMetricsPanel();
    updateWorkspaceSummary({ rows, report });
  }

  function setStatusMessage(message, level = "warning") {
    const className = level === "danger" ? "status-danger" : level === "ok" ? "status-ok" : "status-warning";
    els.statusBox.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
    refreshQualityMetricsPanel();
  }

  function summarizeImportRows(rows) {
    const mappedCount = rows.filter(row => row.lon !== "" && row.lat !== "").length;
    const missingCoordinateCount = rows.filter(row => (row.lon === "") !== (row.lat === "")).length;
    const calloutCount = rows.filter(row => row.lon === "" && row.lat === "").length;
    const categoryNames = Array.from(new Set(rows.map(row => getCategoryLabel(row.type, currentUiLanguage))));
    return { mappedCount, calloutCount, missingCoordinateCount, categoryNames };
  }

  function renderCsvPreviewRows(rows) {
    const previewRows = rows.slice(0, 6);
    if (!previewRows.length) {
      return `<div class="csv-preview-empty">${escapeHtml(t("dialog.csv.noImportableRows"))}</div>`;
    }
    return `
      <div class="csv-preview-table-wrap">
        <table class="csv-preview-table">
          <thead>
            <tr>
              <th>${escapeHtml(t("dialog.csv.previewProjectName"))}</th>
              <th>${escapeHtml(t("dialog.csv.previewType"))}</th>
              <th>${escapeHtml(t("dialog.csv.previewLongitude"))}</th>
              <th>${escapeHtml(t("dialog.csv.previewLatitude"))}</th>
              <th>${escapeHtml(t("dialog.csv.previewStatus"))}</th>
            </tr>
          </thead>
          <tbody>
            ${previewRows.map(row => {
              const hasLon = row.lon !== "";
              const hasLat = row.lat !== "";
              const statusState = hasLon && hasLat ? "mapped" : hasLon || hasLat ? "coordinate-issue" : "callout";
              const status = hasLon && hasLat ? t("table.status.mapped") : hasLon || hasLat ? t("project.status.coordinateIssue") : t("table.status.callout");
              return `
                <tr>
                  <td>${escapeHtml(row.name || t("dialog.csv.previewBlank"))}</td>
                  <td>${escapeHtml(getCategoryLabel(row.type))}</td>
                  <td>${escapeHtml(row.lon === "" ? "" : String(row.lon))}</td>
                  <td>${escapeHtml(row.lat === "" ? "" : String(row.lat))}</td>
                  <td><span class="csv-preview-badge" data-state="${escapeHtml(statusState)}">${escapeHtml(status)}</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      ${rows.length > previewRows.length ? `<div class="csv-preview-more">${escapeHtml(t("dialog.csv.previewMore", { shown: previewRows.length, total: rows.length }))}</div>` : ""}
    `;
  }

  function hideCsvImportPreview() {
    if (!els.csvImportPreview) return;
    els.csvImportPreview.hidden = true;
    els.csvImportPreview.innerHTML = "";
  }

  function showCsvImportPreview(report) {
    const rows = report.rows || [];
    const messages = report.messages || [];
    const summary = summarizeImportRows(rows);
    const columns = report.fields && report.fields.length ? report.fields.join(", ") : t("dialog.csv.noHeaders");
    const importDisabled = rows.length ? "" : " disabled";
    const warningList = messages.slice(0, 8);

    if (els.csvImportPreview) {
      els.csvImportPreview.hidden = false;
      els.csvImportPreview.innerHTML = `
      <div class="import-preview">
        <div class="import-preview-heading">
          <div>
            <strong>${escapeHtml(t("dialog.csv.previewTitle"))}</strong>
            <span>${escapeHtml(report.fileName || t("dialog.csv.selectedCsv"))}</span>
          </div>
          <div class="status-actions">
            <button type="button" data-status-action="confirm-csv-import"${importDisabled}>${escapeHtml(t("dialog.csv.importRowsShort"))}</button>
            <button type="button" data-status-action="cancel-csv-import">${escapeHtml(t("dialog.common.cancel"))}</button>
          </div>
        </div>
        <div class="csv-preview-metrics">
          <div><strong>${rows.length}</strong><span>${escapeHtml(t("summary.rows"))}</span></div>
          <div><strong>${summary.mappedCount}</strong><span>${escapeHtml(t("summary.mapped"))}</span></div>
          <div><strong>${summary.calloutCount}</strong><span>${escapeHtml(t("properties.metric.callouts"))}</span></div>
          <div><strong>${summary.missingCoordinateCount}</strong><span>${escapeHtml(t("properties.metric.coordinateIssues"))}</span></div>
        </div>
        <div class="csv-preview-meta">
          <span><strong>${escapeHtml(t("dialog.csv.columns"))}</strong> ${escapeHtml(columns)}</span>
          <span><strong>${escapeHtml(t("dialog.csv.categories"))}</strong> ${escapeHtml(summary.categoryNames.join(", ") || t("dialog.csv.none"))}</span>
        </div>
        ${renderCsvPreviewRows(rows)}
        ${warningList.length ? `<div class="csv-preview-warnings"><strong>${escapeHtml(t("dialog.csv.reviewNotes"))}</strong>${warningList.map(message => `<span>${escapeHtml(message)}</span>`).join("")}${messages.length > warningList.length ? `<span>${escapeHtml(t("dialog.csv.moreNotes", { count: messages.length - warningList.length }))}</span>` : ""}</div>` : ""}
      </div>
    `;
    }
    switchDataTable("projects");
    setStatusMessage(t("dialog.csv.previewReady", { count: rows.length }), rows.length ? "ok" : "warning");
  }

  function setPropertiesContext(title, subtitle, hint, controlsHtml = "", selection = null) {
    activePropertiesSelection = selection;
    highlightActiveProjectRow(selection && selection.rowId ? selection.rowId : null);
    if (els.propertiesTitle) els.propertiesTitle.textContent = title;
    if (els.propertiesSubtitle) els.propertiesSubtitle.textContent = subtitle;
    if (els.propertiesIcon) els.propertiesIcon.innerHTML = iconSvg(propertiesIconForSelection(selection), "properties-entity-svg");
    if (els.propertiesDescription) {
      els.propertiesDescription.textContent = hint;
      els.propertiesDescription.hidden = !hint;
    }
    if (els.propertiesSelectionControls) els.propertiesSelectionControls.innerHTML = controlsHtml;
    publishReadonlyAppSnapshot();
  }

  function setPreviewPropertySectionsVisible(isVisible) {
    [els.previewDisplayPropertiesSection, els.previewInteractionPropertiesSection].forEach(section => {
      if (section) section.hidden = !isVisible;
    });
  }

  function setDocumentPropertiesContext() {
    renderPropertiesForActiveState({ kind: "document" });
  }

  function selectOptionsHtml(input) {
    if (!input) return "";
    return Array.from(input.options).map(option => (
      `<option value="${escapeHtml(option.value)}"${option.selected ? " selected" : ""}>${escapeHtml(option.textContent)}</option>`
    )).join("");
  }

  function qualityMetricItem(label, value, state = "neutral", description = "") {
    return properties.qualityMetricItem(label, value, { state, description, escapeHtml, iconSvg, t });
  }

  function qualityCard(label, value, state, description, detail = "", action = null) {
    return properties.qualityCard(label, value, state, description, detail, action, escapeHtml);
  }

  function renderQualitySummaryBanner(report = lastLayout && lastLayout.report) {
    if (!report) {
      return `<strong>${escapeHtml(t("quality.banner.renderFirst.title"))}</strong><span>${escapeHtml(t("quality.banner.renderFirst.body"))}</span>`;
    }
    const issues = getReviewIssueCount(report);
    return issues
      ? `<strong>${escapeHtml(t("quality.banner.review.title", { count: t("summary.issueCount", { count: issues, label: issues === 1 ? t("summary.issueSingular") : t("summary.issuePlural") }) }))}</strong><span>${escapeHtml(t("quality.banner.review.body"))}</span><button type="button" data-property-action="open-map">${escapeHtml(t("quality.action.locateFirst"))}</button>`
      : `<strong>${escapeHtml(t("quality.banner.ready.title"))}</strong><span>${escapeHtml(t("quality.banner.ready.body"))}</span>`;
  }

  function refreshCanvasQualityPill(report = lastLayout && lastLayout.report) {
    if (!els.canvasQualityPill) return;
    if (!getRows().length || !report) {
      els.canvasQualityPill.hidden = true;
      els.canvasQualityPill.innerHTML = "";
      return;
    }
    const overlaps = Number(report.overlaps || 0);
    const crossings = Number(report.crossings || 0);
    const nearEdge = Number(report.labelsNearEdge || 0);
    els.canvasQualityPill.hidden = false;
    els.canvasQualityPill.innerHTML = `
      <span class="canvas-quality-metric" data-state="${overlaps ? "review" : "ok"}"><span aria-hidden="true"></span>${escapeHtml(t("quality.canvas.overlaps"))} <strong>${overlaps}</strong></span>
      <span class="canvas-quality-metric" data-state="${crossings ? "review" : "ok"}"><span aria-hidden="true"></span>${escapeHtml(t("quality.canvas.crossings"))} <strong>${crossings}</strong></span>
      <span class="canvas-quality-metric" data-state="${nearEdge ? "review" : "ok"}">${escapeHtml(t("quality.canvas.nearEdge"))} <strong>${nearEdge}</strong></span>
      <button type="button" data-property-action="open-map">${escapeHtml(t("quality.canvas.locateNext"))}</button>`;
  }

  function renderQualityMetrics() {
    const report = lastLayout && lastLayout.report;
    const metadataMissing = getMapDetailsMissingFields().length;
    const metadataCard = qualityCard(
      t("quality.metric.mapDetails"),
      metadataMissing ? t("quality.metric.missingCount", { count: metadataMissing }) : t("quality.metric.complete"),
      metadataMissing ? "danger" : "ok",
      t("quality.metric.mapDetailsBody"),
      metadataMissing ? t("quality.metric.mapDetailsMissing") : t("quality.metric.mapDetailsComplete"),
      metadataMissing ? { name: "open-map-details", label: t("quality.metric.addDetails") } : null
    );
    if (!report) {
      return `<div class="quality-card-grid">${metadataCard}</div>`;
    }
    const longestLeader = report.longestLeaderName
      ? `${Math.round(report.longestLeaderLength)} pt - ${report.longestLeaderName}`
      : t("quality.metric.none");
    return `
      <div class="quality-card-grid">
        ${metadataCard}
        ${qualityCard(t("quality.metric.labelOverlaps"), String(report.overlaps), report.overlaps ? "review" : "ok", report.overlaps ? t("quality.metric.reviewTighten") : t("quality.metric.noOverlaps"), "", report.overlaps ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
        ${qualityCard(t("quality.metric.leaderCrossings"), report.crossings ? String(report.crossings) : "0 /", report.crossings ? "review" : "ok", report.crossings ? t("quality.metric.reviewCrossings") : t("quality.metric.noCrossings"), "", report.crossings ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
        ${qualityCard(t("quality.metric.longestLeader"), longestLeader, report.longLines ? "review" : "ok", report.longLines ? t("quality.metric.reviewLongest") : t("quality.metric.withinLimit"), "", report.longLines ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
        ${qualityCard(t("quality.metric.labelsNearEdge"), String(report.labelsNearEdge || 0), report.labelsNearEdge ? "review" : "ok", report.labelsNearEdge ? t("quality.metric.reviewEdge") : t("quality.metric.noEdge"), "", report.labelsNearEdge ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
      </div>
    `;
  }

  function refreshQualityMetricsPanel() {
    if (els.qualityMetricsPanel) els.qualityMetricsPanel.innerHTML = renderQualityMetrics();
    if (els.qualitySummaryBanner) {
      const report = lastLayout && lastLayout.report;
      els.qualitySummaryBanner.innerHTML = renderQualitySummaryBanner(report);
      els.qualitySummaryBanner.dataset.state = !report ? "info" : getReviewIssueCount(report) ? "review" : "ok";
    }
    refreshCanvasQualityPill();
  }

  function renderDocumentPropertyControls() {
    const missingFields = getMapDetailsMissingFields();
    const missingDetails = missingFields.length;
    return properties.renderDocumentPropertyControls({
      missingDetails,
      titleMissing: missingFields.includes("titleEn") || missingFields.includes("titleFr"),
      textMissing: missingFields.includes("textEn") || missingFields.includes("textFr"),
      selectOptions: {
        mapStyle: selectOptionsHtml(els.mapStylePresetInput),
        fontFamily: selectOptionsHtml(els.fontFamilyInput),
        bookSize: selectOptionsHtml(els.bookSizeInput),
        imageSize: selectOptionsHtml(els.imageSizeInput)
      },
      values: {
        labelSize: els.labelSizeInput ? els.labelSizeInput.value : "",
        mapScale: els.mapScaleInput ? els.mapScaleInput.value : "",
        markerSize: els.markerSizeInput ? els.markerSizeInput.value : "",
        lineWidth: els.lineWidthInput ? els.lineWidthInput.value : "",
        labelChars: els.labelCharsInput ? els.labelCharsInput.value : ""
      },
      escapeHtml,
      iconSvg,
      qualityMetricItem,
      t
    });
  }

  function renderProjectDataPropertyControls() {
    const rows = getRows();
    const summary = summarizeProjectRows(rows);
    return properties.renderProjectDataPropertyControls({ summary, qualityMetricItem, escapeHtml, iconSvg, t });
  }

  function setProjectDataPropertiesContext(selection = activePropertiesSelection) {
    renderPropertiesForActiveState(selection && selection.rowId ? { ...selection, kind: "row" } : { kind: "project-data" });
  }

  function renderRowPropertyControls(row, options = {}) {
    const labelKey = options.labelKey || getLabelKey(row);
    const canResetLabel = Boolean(options.manual);
    const hasLon = row.lon !== "";
    const hasLat = row.lat !== "";
    const status = hasLon && hasLat ? t("project.status.mapped") : hasLon || hasLat ? t("project.status.coordinateIssue") : t("project.status.callout");
    const displayRow = {
      ...row,
      lon: formatProjectCoordinate(row.lon),
      lat: formatProjectCoordinate(row.lat),
      labelMaxChars: normalizeLabelMaxCharsOverride(row.labelMaxChars)
    };
    return properties.renderRowPropertyControls({
      row: displayRow,
      kind: options.kind || "row",
      labelKey,
      manual: canResetLabel,
      advancedOpen: Boolean(options.advancedOpen),
      priority: toPriority(row.priority),
      typeOptions: getTypeOptions(row.type),
      status,
      globalLabelMaxChars: normalizeLabelMaxChars(els.labelCharsInput.value),
      escapeHtml,
      iconSvg,
      t
    });
  }

  function setRowPropertiesContext(kind, rowLike, options = {}) {
    const tr = getRowElementById(rowLike.rowId);
    const row = readRowElement(tr) || rowLike;
    renderPropertiesForActiveState({
      kind,
      rowId: row.rowId,
      row,
      labelKey: options.labelKey || getLabelKey(row),
      manual: Boolean(options.manual),
      advancedOpen: Boolean(options.advancedOpen)
    });
  }

  function renderFurniturePropertyControls(key, label, visibilityInput) {
    const visible = visibilityInput ? visibilityInput.checked : true;
    return properties.renderFurniturePropertyControls({ key, label, visible, escapeHtml, iconSvg, t });
  }

  function renderMapPropertyControls() {
    const regionSummaryText = els.regionSummary ? els.regionSummary.textContent : "";
    return properties.renderMapPropertyControls({
      regionSummaryText,
      selectOptions: {
        boundary: selectOptionsHtml(els.boundaryInput),
        regionPreset: selectOptionsHtml(els.regionPresetInput),
        bookSize: selectOptionsHtml(els.bookSizeInput),
        imageSize: selectOptionsHtml(els.imageSizeInput),
        labelMaxChars: normalizeLabelMaxChars(els.labelCharsInput.value)
      },
      mapScale: els.mapScaleInput ? els.mapScaleInput.value : "",
      escapeHtml,
      iconSvg,
      t
    });
  }

  function renderQualityPropertyControls() {
    const rows = getRows();
    const rowSummary = summarizeProjectRows(rows);
    const regionSummary = getVisibleRegionSummary();
    const qualitySummary = getQualitySummary();
    const translationSummary = getTranslationSummary();
    const metadataMissing = getMapDetailsMissingFields().length;
    const reviewCount = getReviewIssueCount();
    const verdict = reviewCount
      ? t("status.reviewBeforeExport", {
        count: reviewCount,
        label: reviewCount === 1 ? t("summary.issueSingular") : t("summary.issuePlural")
      })
      : qualitySummary.state === "ok"
        ? t("status.readyForExportReview")
        : t("status.renderForReadiness");
    return properties.renderQualityPropertyControls({
      rowSummary,
      regionSummary,
      qualitySummary,
      report: lastLayout && lastLayout.report,
      translationSummary,
      metadataMissing,
      reviewCount,
      verdict,
      verdictState: reviewCount ? "review" : qualitySummary.state === "ok" ? "ok" : "info",
      qualityMetricItem,
      escapeHtml,
      iconSvg,
      t
    });
  }

  function renderTranslationPropertyControls() {
    const summary = getTranslationSummary();
    return properties.renderTranslationPropertyControls({ summary, escapeHtml, iconSvg, qualityMetricItem, t });
  }

  function renderCategoryPropertyControls() {
    const category = categorySettings.find(item => item.id === activeCategoryId) || categorySettings[0];
    return properties.renderCategoryPropertyControls({
      category,
      markerShapes: markerShapes.map(shape => ({ ...shape, label: getMarkerShapeLabel(shape) })),
      escapeHtml,
      iconSvg,
      t,
      markerShapeIcon: shape => getCategorySwatchSvg({ ...category, shape, customIcon: null })
    });
  }

  function renderRegionPropertyControls(regionId) {
    const region = getRegionTableRows().find(item => item.id === regionId);
    if (!region) return renderMapPropertyControls();
    return properties.renderRegionPropertyControls({ region, pluralize, escapeHtml, iconSvg, t });
  }

  function setCategoryPropertiesContext() {
    renderPropertiesForActiveState({ kind: "category", id: activeCategoryId });
  }

  function setQualityPropertiesContext() {
    renderPropertiesForActiveState({ kind: "quality" });
  }

  function setMapPropertiesContext() {
    renderPropertiesForActiveState({ kind: "map" });
  }

  function setTranslationPropertiesContext() {
    renderPropertiesForActiveState({ kind: "translation" });
  }

  function renderPropertiesForActiveState(selection = activePropertiesSelection) {
    const requested = selection && typeof selection === "object" ? selection : null;
    let context;

    if (activeDataTable === "projects") {
      const rowSelection = requested && requested.kind === "row" && requested.rowId ? requested : null;
      const tr = rowSelection ? getRowElementById(rowSelection.rowId) : null;
      const row = readRowElement(tr);
      if (row) {
        const labelKey = rowSelection.labelKey || getLabelKey(row);
        context = {
          title: t("properties.title.projectData"),
          subtitle: row.name || getCategoryLabel(row.type),
          hint: t("properties.hint.projectData"),
          controls: renderRowPropertyControls(row, { kind: "row", labelKey, manual: Boolean(manualLabelPositions[labelKey]), advancedOpen: Boolean(rowSelection.advancedOpen) }),
          selection: { kind: "row", rowId: row.rowId, labelKey, manual: Boolean(manualLabelPositions[labelKey]), advancedOpen: Boolean(rowSelection.advancedOpen) }
        };
      } else {
        context = {
          title: t("properties.title.noSelection"),
          subtitle: t("properties.subtitle.projectPoints"),
          hint: t("properties.hint.projectNoSelection"),
          controls: renderProjectDataPropertyControls(),
          selection: { kind: "project-data" }
        };
      }
    } else if (activeDataTable === "categories") {
      if (requested && requested.kind === "category" && requested.id) activeCategoryId = requested.id;
      const category = categorySettings.find(item => item.id === activeCategoryId) || categorySettings[0];
      if (category) activeCategoryId = category.id;
      context = {
        title: category ? getCategoryLabel(category.id, currentUiLanguage) : t("properties.title.categories"),
        subtitle: category ? t("properties.subtitle.legendMarker") : t("properties.subtitle.legendCategories"),
        hint: t("properties.hint.categories"),
        controls: renderCategoryPropertyControls(),
        selection: { kind: "category", id: category && category.id }
      };
    } else if (activeDataTable === "regions") {
      const region = requested && requested.kind === "region"
        ? getRegionTableRows().find(item => item.id === requested.id)
        : null;
      context = region ? {
        title: region.name,
        subtitle: t("properties.subtitle.mapRegion"),
        hint: t("properties.hint.region"),
        controls: renderRegionPropertyControls(region.id),
        selection: { kind: "region", id: region.id }
      } : {
        title: t("properties.title.mapBaselayer"),
        subtitle: t("properties.subtitle.mapBaselayer"),
        hint: t("properties.hint.mapBaselayer"),
        controls: renderMapPropertyControls(),
        selection: { kind: "map" }
      };
    } else if (activeDataTable === "translate") {
      const requestedEntryId = requested && requested.kind === "translation-entry" ? requested.id : activeTranslationEntryId;
      const selectedEntry = getTranslationEntries().find(entry => entry.id === requestedEntryId) || null;
      if (selectedEntry) activeTranslationEntryId = selectedEntry.id;
      context = {
        title: t("properties.title.translate"),
        subtitle: t(activeAuthoringLanguage === "fr" ? "translate.direction.frEn" : "translate.direction.enFr"),
        hint: selectedEntry ? t("properties.hint.translateEntry") : t("properties.hint.translate"),
        controls: selectedEntry ? properties.renderTranslationEntryPropertyControls({ entry: selectedEntry, escapeHtml, iconSvg, t }) : renderTranslationPropertyControls(),
        selection: selectedEntry ? { kind: "translation-entry", id: selectedEntry.id } : { kind: "translation" }
      };
    } else if (activeDataTable === "quality") {
      context = {
        title: t("properties.title.mapQuality"),
        subtitle: t("properties.subtitle.mapQuality"),
        hint: t("properties.hint.quality"),
        controls: renderQualityPropertyControls(),
        selection: { kind: "quality" }
      };
    } else if (requested && requested.kind === "document") {
      context = {
        title: t("properties.title.document"),
        subtitle: t("properties.subtitle.document"),
        hint: t("properties.hint.document"),
        controls: renderDocumentPropertyControls(),
        selection: { kind: "document" }
      };
    } else if (requested && ["row", "label", "marker"].includes(requested.kind) && requested.rowId) {
      const tr = getRowElementById(requested.rowId);
      const row = readRowElement(tr) || requested.row;
      if (row) {
        const kind = requested.kind;
        const labelKey = requested.labelKey || getLabelKey(row);
        context = {
          title: kind === "marker" ? t("properties.title.marker") : kind === "row" ? t("properties.title.projectData") : t("properties.title.label"),
          subtitle: row.name || getCategoryLabel(row.type),
          hint: kind === "marker"
            ? t("properties.hint.marker")
            : kind === "row"
              ? t("properties.hint.row")
              : t("properties.hint.label"),
          controls: renderRowPropertyControls(row, { kind, labelKey, manual: Boolean(manualLabelPositions[labelKey]), advancedOpen: Boolean(requested.advancedOpen) }),
          selection: { kind, rowId: row.rowId, labelKey, manual: Boolean(manualLabelPositions[labelKey]), advancedOpen: Boolean(requested.advancedOpen) }
        };
      }
    } else if (requested && requested.kind === "furniture" && ["legend", "callouts"].includes(requested.key)) {
      const key = requested.key;
      const label = getFurnitureLabel(key);
      context = {
        title: label,
        subtitle: t("properties.subtitle.furnitureSelected", { label }),
        hint: t("properties.hint.furniture"),
        controls: renderFurniturePropertyControls(key, label, getFurnitureVisibilityInput(key)),
        selection: { kind: "furniture", key }
      };
    } else if (requested && requested.kind === "region") {
      const region = getRegionTableRows().find(item => item.id === requested.id);
      if (region) {
        context = {
          title: region.name,
          subtitle: t("properties.subtitle.selectedMapRegion"),
          hint: t("properties.hint.region"),
          controls: renderRegionPropertyControls(region.id),
          selection: { kind: "region", id: region.id }
        };
      }
    } else if (requested && requested.kind === "map") {
      context = {
        title: t("properties.title.map"),
        subtitle: t("properties.subtitle.map"),
        hint: t("properties.hint.map"),
        controls: renderMapPropertyControls(),
        selection: { kind: "map" }
      };
    }

    if (!context) {
      context = {
        title: t("properties.title.document"),
        subtitle: t("properties.subtitle.document"),
        hint: t("properties.hint.document"),
        controls: renderDocumentPropertyControls(),
        selection: { kind: "document" }
      };
    }

    const showPreviewGroups = activeDataTable === "preview" && ["document", "map"].includes(context.selection.kind);
    setPreviewPropertySectionsVisible(showPreviewGroups);
    setPropertiesContext(context.title, context.subtitle, context.hint, context.controls, context.selection);
    if (els.regionTableBody) {
      els.regionTableBody.querySelectorAll("tr[data-region-id]").forEach(row => {
        const isActive = context.selection.kind === "region" && row.dataset.regionId === context.selection.id;
        row.classList.toggle("is-active-region", isActive);
        if (isActive) row.setAttribute("aria-current", "true");
        else row.removeAttribute("aria-current");
      });
    }
  }

  function setFurniturePropertiesContext(key, label, subtitle, hint, visibilityInput) {
    renderPropertiesForActiveState({ kind: "furniture", key });
  }

  function getFurnitureVisibilityInput(key) {
    if (key === "legend") return els.showLegendInput;
    if (key === "callouts") return els.showCalloutsInput;
    return null;
  }

  function getFurnitureLabel(key) {
    return key === "legend" ? t("properties.furniture.legend") : t("properties.furniture.callouts");
  }

  function refreshActiveRowProperties() {
    if (!activePropertiesSelection || !activePropertiesSelection.rowId) return;
    const tr = getRowElementById(activePropertiesSelection.rowId);
    const row = readRowElement(tr);
    if (!row) return;
    setRowPropertiesContext(activePropertiesSelection.kind || "label", row, {
      labelKey: activePropertiesSelection.labelKey,
      manual: Boolean(manualLabelPositions[activePropertiesSelection.labelKey]),
      advancedOpen: Boolean(activePropertiesSelection.advancedOpen)
    });
  }

  function refreshDocumentPropertiesIfActive() {
    if (activePropertiesSelection && activePropertiesSelection.kind === "document") {
      setDocumentPropertiesContext();
    }
  }

  function refreshMapPropertiesIfActive() {
    if (activePropertiesSelection && activePropertiesSelection.kind === "map") {
      setMapPropertiesContext();
    }
  }

  async function handlePropertiesControlsChange(event) {
    if (event.target.matches("[data-category-icon-upload]")) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      const file = event.target.files && event.target.files[0];
      if (!category || !file) return;
      try {
        const icon = await validateCustomMarkerIconFile(file);
        pushAppUndoHistory("category icon upload");
        category.customIcon = icon;
        activeCategoryId = category.id;
        renderCategoryEditors();
        updateWorkspaceSummary();
        requestPreviewRefresh();
        setCategoryPropertiesContext();
        setStatusMessage(t("status.categoryCustomIcon", { label: getCategoryLabel(category.id, currentUiLanguage) }), "ok");
      } catch (error) {
        setStatusMessage(t("status.customIconLoadFailedGeneric", { message: translateErrorMessage(error) }), "danger");
      } finally {
        event.target.value = "";
      }
      return;
    }

    const categoryField = event.target.dataset.categoryField;
    if (categoryField) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      if (!category) return;
      captureInputUndo(event.target, "category edit");
      const numericFields = new Set(["markerSize", "lineWidth"]);
      category[categoryField] = numericFields.has(categoryField) ? Number(event.target.value) : event.target.value;
      if (categoryField === "label") category.defaultLabel = category.defaultLabel || category.label;
      if (categoryField === "markerSize") category.markerSizeCustom = true;
      if (categoryField === "lineWidth") category.lineWidthCustom = true;
      renderCategoryEditors();
      updateTypeOptions();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      setCategoryPropertiesContext();
      return;
    }
    const layoutProxy = event.target.dataset.layoutProxy;
    if (layoutProxy) {
      const input = document.querySelector(`#${layoutProxy}`);
      if (!input) return;
      pushAppUndoHistory("map display setting");
      if (input.type === "checkbox") {
        input.checked = event.target.checked;
      } else {
        input.value = event.target.value;
      }
      handleLayoutSettingsChange({ target: input });
      if (activePropertiesSelection && activePropertiesSelection.kind === "map") {
        setMapPropertiesContext();
      } else {
        renderPropertiesForActiveState();
      }
      return;
    }

    const mapProxy = event.target.dataset.mapProxy;
    if (mapProxy) {
      const input = document.querySelector(`#${mapProxy}`);
      if (!input) return;
      pushAppUndoHistory("map setting");
      input.value = event.target.value;
      if (mapProxy === "mapStylePresetInput") {
        applySelectedMapStyle();
      } else if (mapProxy === "boundaryInput") {
        await changeBoundary(input.value);
      } else if (mapProxy === "regionPresetInput") {
        applySelectedRegionPreset();
      }
      renderPropertiesForActiveState();
      return;
    }

    const regionProperty = event.target.dataset.regionProperty;
    if (regionProperty) {
      const form = event.target.closest("[data-region-id]");
      const regionId = form && form.dataset.regionId;
      if (!regionId) return;
      pushAppUndoHistory("region edit");
      if (regionProperty === "included") {
        clearActiveRegionPreset();
        regionVisibility[regionId] = event.target.checked;
        applyRegionColoursByValue(false, { refreshRowsOnly: true });
        scheduleRender();
      } else if (regionProperty === "value") {
        const value = normalizeRegionValue(event.target.value);
        if (value === "") delete regionValues[regionId];
        else regionValues[regionId] = value;
        applyRegionColoursByValue(true, { refreshRowsOnly: true });
      } else if (regionProperty === "colour") {
        regionColourOverrides[regionId] = true;
        regionFills[regionId] = event.target.value;
        refreshRegionValueTableRow(getRegionTableRows().find(region => region.id === regionId));
        scheduleRender();
      }
      renderPropertiesForActiveState({ kind: "region", id: regionId });
      return;
    }

    const field = event.target.dataset.propertyField;
    if (!field) return;
    const form = event.target.closest(".properties-form[data-property-kind]");
    if (!form) return;

    if (form.dataset.propertyKind === "translation-entry") {
      const entryId = form.dataset.entryId;
      const language = event.target.dataset.translationProperty === "en" ? "en" : "fr";
      pushAppUndoHistory("translation edit");
      writeTranslationEntry(entryId, event.target.value, language);
      activeTranslationEntryId = entryId;
      renderTranslationWorkbench();
      renderPropertiesForActiveState({ kind: "translation-entry", id: entryId });
      return;
    }

    if (form.dataset.propertyKind === "furniture" && field === "boxVisible") {
      const key = form.dataset.boxKey;
      const input = getFurnitureVisibilityInput(key);
      const label = getFurnitureLabel(key);
      pushAppUndoHistory("map furniture setting");
      setMapFurnitureVisibility(key, event.target.checked, input, label);
      setFurniturePropertiesContext(
        key,
        label,
        t("properties.subtitle.furnitureSelected", { label }),
        t("properties.helper.furniture"),
        input
      );
      return;
    }

    const rowId = form.dataset.rowId;
    if (!rowId) return;
    const value = ["hideLine", "elbowLeader"].includes(field) ? event.target.checked : event.target.value;
    pushAppUndoHistory("project row edit");
    const row = updateProjectRowField(rowId, field, value);
    if (!row) return;
    if (field === "nameFr") {
      updateWorkspaceSummary();
      updateExportLanguageNotice();
    }
    requestPreviewRefresh();
    const advancedOpen = Boolean(event.target.closest("details")?.open);
    setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", row, {
      labelKey: form.dataset.labelKey,
      manual: Boolean(manualLabelPositions[form.dataset.labelKey]),
      advancedOpen
    });
  }

  function handlePropertiesControlsClick(event) {
    const button = event.target.closest("[data-property-action]");
    if (!button) return;
    const action = button.dataset.propertyAction;

    if (action === "reset-label") {
      const labelKey = button.dataset.labelKey;
      if (labelKey && manualLabelPositions[labelKey]) pushManualLayoutHistory("selected label reset");
      if (labelKey) delete manualLabelPositions[labelKey];
      requestPreviewRefresh();
      refreshActiveRowProperties();
      setStatusMessage(t("status.labelReset"), "ok");
      return;
    }

    if (action === "focus-row") {
      const tr = getRowElementById(button.dataset.rowId);
      if (!tr) return;
      setActiveDataTab("projects");
      tr.scrollIntoView({ block: "center", behavior: "smooth" });
      const input = tr.querySelector(".name-input");
      if (input) input.focus();
      return;
    }

    if (action === "add-project-row") {
      if (els.addRowBtn) els.addRowBtn.click();
      return;
    }

    if (action === "import-csv") {
      if (els.csvInput) els.csvInput.click();
      return;
    }

    if (action === "open-map-details") {
      openMapDetailsDialog();
      return;
    }

    if (action === "open-map") {
      setActiveDataTab("preview");
      return;
    }

    if (action === "upload-category-icon") {
      const form = button.closest("[data-category-id]");
      const input = form && form.querySelector("[data-category-icon-upload]");
      if (input) input.click();
      return;
    }

    if (action === "remove-category-icon") {
      const form = button.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      if (!category || !category.customIcon) return;
      pushAppUndoHistory("category icon remove");
      category.customIcon = null;
      activeCategoryId = category.id;
      renderCategoryEditors();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      setCategoryPropertiesContext();
      setStatusMessage(t("status.categoryReturnedToMarker", { label: getCategoryLabel(category.id, currentUiLanguage), shape: getMarkerShapeLabel(category.shape) }), "ok");
      return;
    }

    if (action === "reset-box") {
      const key = button.dataset.boxKey;
      if (!key) return;
      if (manualBoxPositions[key]) pushManualLayoutHistory(`${getFurnitureLabel(key)} reset`);
      delete manualBoxPositions[key];
      requestPreviewRefresh();
      setStatusMessage(t("status.furnitureItemReset", { label: getFurnitureLabel(key) }), "ok");
      return;
    }

    if (action === "select-all-regions") {
      setAllRegions(true);
      setStatusMessage(t("status.allRegionsSelected"), "ok");
      return;
    }

    if (action === "clear-regions") {
      setAllRegions(false);
      setStatusMessage(t("status.allRegionsCleared"), "warning");
      return;
    }

    if (action === "use-project-regions") {
      selectRegionsWithProjectPoints();
      setStatusMessage(t("status.projectRegionsApplied"), "ok");
      return;
    }

    if (action === "reset-region-colours") {
      resetRegionColours();
      setStatusMessage(t("status.regionColoursReset"), "ok");
      return;
    }

    if (action === "open-map-regions") {
      setActiveDataTab("regions");
      return;
    }

    if (action === "open-project-missing") {
      setActiveDataTab("projects");
      clickProjectFilter("missing");
      return;
    }

    if (action === "open-project-callouts") {
      setActiveDataTab("projects");
      clickProjectFilter("callouts");
      return;
    }

    if (action === "open-translations-missing") {
      setActiveDataTab("translate");
      setTranslationFilter("missing");
      return;
    }

    if (action === "paste-translations") {
      pasteTranslationColumnFromClipboard();
      return;
    }

    if (action === "reset-all-labels") {
      if (Object.keys(manualLabelPositions).length) pushManualLayoutHistory("all label reset");
      setCurrentManualLabelPositions({});
      requestPreviewRefresh();
      setDocumentPropertiesContext();
      setStatusMessage(t("status.manualLabelsReset"), "ok");
      return;
    }

    if (action === "reset-furniture") {
      if (Object.keys(manualBoxPositions).length) pushManualLayoutHistory("legend and callout reset");
      setCurrentManualBoxPositions({});
      requestPreviewRefresh();
      setDocumentPropertiesContext();
      setStatusMessage(t("status.furnitureReset"), "ok");
    }
  }

  function handleStatusAction(event) {
    const button = event.target.closest("[data-status-action]");
    if (!button) return;

    if (button.dataset.statusAction === "confirm-csv-import") {
      if (!pendingCsvImport || !pendingCsvImport.rows.length) {
        setStatusMessage(t("status.noCsvRowsReady"), "warning");
        return;
      }
      const report = pendingCsvImport;
      pendingCsvImport = null;
      hideCsvImportPreview();
      pushAppUndoHistory("CSV import");
      setRows(report.rows, report.messages);
      return;
    }

    if (button.dataset.statusAction === "cancel-csv-import") {
      pendingCsvImport = null;
      hideCsvImportPreview();
      setStatusMessage(t("status.csvImportCancelled"), "warning");
      return;
    }

    if (button.dataset.statusAction === "open-translations-missing") {
      setActiveDataTab("translate");
      setTranslationFilter("missing");
    }
  }

  function autoPlaceLabels(options = {}) {
    const resizeMap = options.resizeMap !== false;
    if (Object.keys(manualLabelPositions).length) pushManualLayoutHistory(resizeMap ? "auto-place" : "auto-place without map resize");
    setCurrentManualLabelPositions({});
    scheduleRender({ autoPlace: true, autoPlaceResize: resizeMap });
    setStatusMessage(
      resizeMap
        ? t("status.autoPlaceMayResize")
        : t("status.autoPlaceLabelsOnly"),
      "ok"
    );
  }

  function autoPlaceLabelsWithoutResize() {
    autoPlaceLabels({ resizeMap: false });
  }

  function confirmClearProjectRows() {
    const rowCount = els.tableBody ? els.tableBody.querySelectorAll("tr").length : 0;
    if (!rowCount) {
      setStatusMessage(t("status.projectTableAlreadyEmpty"), "warning");
      return;
    }

    const label = rowCount === 1 ? t("status.projectRowSingular") : t("status.projectRowPlural");
    const confirmed = window.confirm(t("status.clearProjectRowsConfirm", { count: rowCount, label }));
    if (!confirmed) {
      setStatusMessage(t("status.clearTableCancelled"), "warning");
      return;
    }

    pushAppUndoHistory("clear project rows");
    setRows([]);
    setStatusMessage(t("status.projectTableCleared"), "ok");
  }

  function setExportMenuOpen(open, options = {}) {
    if (!els.exportMenu || !els.exportMenuBtn) return;
    els.exportMenu.hidden = !open;
    els.exportMenuBtn.setAttribute("aria-expanded", String(open));
    if (open && options.focusFirst) {
      const firstItem = els.exportMenu.querySelector('[role="menuitem"]');
      if (firstItem) firstItem.focus();
    }
  }

  function handleExportMenuKeydown(event) {
    if (event.key === "ArrowDown" && event.currentTarget === els.exportMenuBtn) {
      event.preventDefault();
      setExportMenuOpen(true, { focusFirst: true });
      return;
    }
    if (event.key === "Escape" && els.exportMenu && !els.exportMenu.hidden) {
      event.preventDefault();
      setExportMenuOpen(false);
      els.exportMenuBtn.focus();
      return;
    }
    if (els.exportMenu && !els.exportMenu.hidden && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = Array.from(els.exportMenu.querySelectorAll('[role="menuitem"]'));
      if (!items.length) return;
      event.preventDefault();
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowUp"
            ? (currentIndex <= 0 ? items.length - 1 : currentIndex - 1)
            : (currentIndex + 1) % items.length;
      items[nextIndex].focus();
    }
  }

  function getDataTabs() {
    return [
      { name: "preview", title: t("tab.map"), tab: els.previewTableTab, pane: els.previewTablePane, actions: "preview" },
      { name: "projects", title: t("tab.projects"), tab: els.projectTableTab, pane: els.projectTablePane, actions: "projects" },
      { name: "categories", title: t("tab.categories"), tab: els.categoriesTableTab, pane: els.categoriesTablePane, actions: "categories" },
      { name: "regions", title: t("tab.regions"), tab: els.regionTableTab, pane: els.regionTablePane, actions: "regions" },
      { name: "translate", title: t("tab.translate"), tab: els.translateTableTab, pane: els.translateTablePane, actions: "translate" },
      { name: "quality", title: t("tab.quality"), tab: els.qualityTableTab, pane: els.qualityTablePane, actions: "quality" }
    ];
  }

  function syncResponsivePropertiesState() {
    if (!els.propertiesPanel || !els.propertiesToggleBtn) return;
    const isDrawer = propertiesDrawerMedia.matches;
    const isOpen = isDrawer && document.body.classList.contains("properties-open");
    els.propertiesPanel.inert = isDrawer && !isOpen;
    if (isDrawer) els.propertiesPanel.setAttribute("aria-hidden", String(!isOpen));
    else els.propertiesPanel.removeAttribute("aria-hidden");
    if (isDrawer) {
      document.body.classList.remove("properties-collapsed", "is-resizing-properties");
      if (els.propertiesCollapseBtn) {
        els.propertiesCollapseBtn.setAttribute("aria-expanded", "true");
        els.propertiesCollapseBtn.setAttribute("aria-label", t("aria.collapseProperties"));
      }
    } else {
      document.body.classList.remove("properties-open");
      syncPropertiesCollapsedState();
    }
    els.propertiesToggleBtn.setAttribute("aria-expanded", String(isOpen));
  }

  function setPropertiesDrawerOpen(open, { restoreFocus = false } = {}) {
    const shouldOpen = propertiesDrawerMedia.matches && Boolean(open);
    document.body.classList.toggle("properties-open", shouldOpen);
    syncResponsivePropertiesState();
    if (!shouldOpen && restoreFocus) els.propertiesToggleBtn?.focus();
  }

  function getPropertiesPanelPreference() {
    const saved = projectIo.getSavedJson(window.localStorage, propertiesPanelStorageKey);
    return saved && typeof saved === "object" ? saved : {};
  }

  function savePropertiesPanelPreference(next = {}) {
    projectIo.saveJson(window.localStorage, propertiesPanelStorageKey, {
      ...getPropertiesPanelPreference(),
      ...next
    });
  }

  function readCssPixelVariable(name, fallback) {
    const raw = window.getComputedStyle(document.documentElement).getPropertyValue(name);
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getPropertiesWidthBounds() {
    return {
      min: readCssPixelVariable("--props-min-w", 280),
      max: readCssPixelVariable("--props-max-w", 460)
    };
  }

  function setPropertiesPanelWidth(width, { persist = false } = {}) {
    const { min, max } = getPropertiesWidthBounds();
    const nextWidth = Math.round(clamp(Number(width) || readCssPixelVariable("--props-w", 320), min, max));
    document.documentElement.style.setProperty("--props-w", `${nextWidth}px`);
    if (els.propertiesResizeHandle) {
      els.propertiesResizeHandle.setAttribute("aria-valuemin", String(Math.round(min)));
      els.propertiesResizeHandle.setAttribute("aria-valuemax", String(Math.round(max)));
      els.propertiesResizeHandle.setAttribute("aria-valuenow", String(nextWidth));
    }
    if (persist) savePropertiesPanelPreference({ width: nextWidth });
    return nextWidth;
  }

  function syncPropertiesCollapsedState() {
    const isCollapsed = !propertiesDrawerMedia.matches && document.body.classList.contains("properties-collapsed");
    if (els.propertiesPanel) {
      els.propertiesPanel.inert = false;
      els.propertiesPanel.removeAttribute("aria-hidden");
    }
    if (els.propertiesToggleBtn) els.propertiesToggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
    if (els.propertiesCollapseBtn) {
      els.propertiesCollapseBtn.setAttribute("aria-expanded", String(!isCollapsed));
      els.propertiesCollapseBtn.setAttribute("aria-label", isCollapsed ? t("aria.expandProperties") : t("aria.collapseProperties"));
      els.propertiesCollapseBtn.title = isCollapsed ? t("properties.title.expand") : t("properties.title.collapse");
    }
  }

  function setPropertiesCollapsed(collapsed, { persist = true } = {}) {
    if (propertiesDrawerMedia.matches) {
      setPropertiesDrawerOpen(!Boolean(collapsed));
      return;
    }
    document.body.classList.toggle("properties-collapsed", Boolean(collapsed));
    syncPropertiesCollapsedState();
    if (persist) savePropertiesPanelPreference({ collapsed: Boolean(collapsed) });
    publishReadonlyAppSnapshot();
  }

  function togglePropertiesPanel() {
    if (propertiesDrawerMedia.matches) {
      setPropertiesDrawerOpen(!document.body.classList.contains("properties-open"));
    } else {
      setPropertiesCollapsed(!document.body.classList.contains("properties-collapsed"));
    }
  }

  function initializePropertiesPanelState() {
    const saved = getPropertiesPanelPreference();
    if (Number.isFinite(Number(saved.width))) setPropertiesPanelWidth(saved.width);
    else setPropertiesPanelWidth(readCssPixelVariable("--props-w", 320));
    if (!propertiesDrawerMedia.matches && saved.collapsed) {
      document.body.classList.add("properties-collapsed");
    }
    syncResponsivePropertiesState();
  }

  function handlePropertiesResizeStart(event) {
    if (!els.propertiesPanel || propertiesDrawerMedia.matches || document.body.classList.contains("properties-collapsed")) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startWidth = els.propertiesPanel.getBoundingClientRect().width;
    document.body.classList.add("is-resizing-properties");
    els.propertiesResizeHandle?.setPointerCapture?.(pointerId);

    const onPointerMove = moveEvent => {
      const delta = startX - moveEvent.clientX;
      setPropertiesPanelWidth(startWidth + delta);
    };
    const onPointerUp = () => {
      document.body.classList.remove("is-resizing-properties");
      els.propertiesResizeHandle?.releasePointerCapture?.(pointerId);
      setPropertiesPanelWidth(els.propertiesPanel.getBoundingClientRect().width, { persist: true });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  function handlePropertiesResizeKeydown(event) {
    if (propertiesDrawerMedia.matches || document.body.classList.contains("properties-collapsed")) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = els.propertiesPanel ? els.propertiesPanel.getBoundingClientRect().width : readCssPixelVariable("--props-w", 320);
    const { min, max } = getPropertiesWidthBounds();
    const step = event.shiftKey ? 40 : 16;
    let next = current;
    if (event.key === "ArrowLeft") next = current + step;
    if (event.key === "ArrowRight") next = current - step;
    if (event.key === "Home") next = min;
    if (event.key === "End") next = max;
    setPropertiesPanelWidth(next, { persist: true });
  }

  function getDefaultPropertiesSelectionForWorkspace(workspaceName) {
    if (workspaceName === "preview") return { kind: "document" };
    if (workspaceName === "regions") return { kind: "map" };
    return activePropertiesSelection;
  }

  function setActiveDataTab(tableName) {
    const tabs = getDataTabs();
    setExportMenuOpen(false);
    setPropertiesDrawerOpen(false);
    const { activeName } = workspace.applyActiveDataTab({
      tableName,
      tabs,
      tableActions: els.tableActions,
      tablePanelTitle: els.tablePanelTitle,
      body: document.body
    });
    activeDataTable = activeName;
    updateWorkspaceSummary();
    if (activeName === "translate") renderTranslationWorkbench();
    if (activeName === "projects") refreshProjectTableUx();
    renderPropertiesForActiveState(getDefaultPropertiesSelectionForWorkspace(activeName));
    if (activeName === "categories") renderCategoryEditors();
    if (activeName === "quality") refreshQualityMetricsPanel();
    if (activeName === "regions") {
      if (pendingPreviewRefresh) {
        refreshRegionColoursFromRows();
      } else {
        renderRegionValueTable();
      }
    }
    if (pendingPreviewRefresh && shouldRenderPreviewNow()) requestPreviewRefresh();
    publishReadonlyAppSnapshot();
  }

  function switchDataTable(tableName) {
    setActiveDataTab(tableName);
  }

  function handleDataTabKeydown(event) {
    if (!event.target.matches("[role='tab']")) return;
    const tabs = getDataTabs();
    const currentIndex = tabs.findIndex(item => item.tab === event.target);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveDataTab(tabs[nextIndex].name);
    tabs[nextIndex].tab.focus();
  }

  function clearPreviewInteractionOverlays() {
    d3.select(els.svg.node()).selectAll(".map-scale-controls, .distance-markers").remove();
  }

  function showMapScaleControls() {
    if (!lastLayout || !lastLayout.settings || !lastLayout.mapBounds) return;
    mapScaleControlsVisible = true;
    clearPreviewInteractionOverlays();
    drawMapScaleControls(els.svg, lastLayout.settings, lastLayout.mapBounds);
  }

  function hideMapScaleControls() {
    mapScaleControlsVisible = false;
    clearPreviewInteractionOverlays();
  }

  function render(options = {}) {
    const startedAt = performanceNow();
    let renderError = null;
    try {
      return renderMap(options);
    } catch (error) {
      renderError = error;
      throw error;
    } finally {
      recordRenderPerformance(options, startedAt, performanceNow(), renderError);
    }
  }

  function renderMap(options = {}) {
    pendingPreviewRefresh = false;
    pendingPreviewRefreshOptions = null;
    let settings = getSettings();
    const rows = getRows();
    updatePreviewState();
    const svg = els.svg;
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${settings.width} ${settings.height}`);
    svg.attr("width", settings.width);
    svg.attr("height", settings.height);

    svg.append("title").text(settings.title || tFor(settings.mapLanguage, "status.customMapTitle"));
    svg.append("desc").text(tFor(settings.mapLanguage, "map.svgDescription", { boundary: getBoundaryLabel(currentBoundary, settings.mapLanguage) }));

    if (settings.title) {
      svg.append("text")
        .attr("class", "map-title")
        .attr("x", 30)
        .attr("y", 42)
        .attr("font-family", settings.fontFamily)
        .text(settings.title);
    }

    if (!canadaGeo) {
      drawMissingMapMessage(svg, settings);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, false);
      if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
      return;
    }

    const visibleGeo = getVisibleGeo();
    if (!visibleGeo || !visibleGeo.features.length) {
      const title = tFor(settings.mapLanguage, currentBoundary === "canada" ? "map.empty.noCanadaRegions.title" : "map.empty.noWorldRegions.title");
      const message = tFor(settings.mapLanguage, currentBoundary === "canada" ? "map.empty.noCanadaRegions.body" : "map.empty.noWorldRegions.body");
      drawMissingMapMessage(svg, settings, title, message);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, true);
      if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
      return;
    }

    const shouldAutoPlace = Boolean(options.autoPlace);
    const shouldResizeForAutoPlace = shouldAutoPlace && options.autoPlaceResize !== false;
    const layoutCacheKey = shouldAutoPlace ? getLayoutCacheKey(rows, settings, shouldResizeForAutoPlace) : "";
    const cachedLayoutBundle = shouldAutoPlace ? getCachedLanguageLayout(layoutCacheKey) : null;
    const layoutBundle = cachedLayoutBundle || computeLanguageLayout(visibleGeo, rows, settings, shouldResizeForAutoPlace, {
      ignoreManualPositions: shouldAutoPlace
    });
    if (shouldAutoPlace && !cachedLayoutBundle) rememberLanguageLayout(layoutCacheKey, layoutBundle);
    settings = layoutBundle.settings;
    const layoutContext = layoutBundle.layoutContext;
    if (shouldResizeForAutoPlace && layoutContext.requestedMapScale && layoutContext.requestedMapScale !== settings.mapScale) {
      els.mapScaleInput.value = settings.mapScale;
      rememberCurrentLanguageMapScale();
      updateCanvasToolbar();
    }
    const {
      projection,
      path,
      mapBounds,
      mappedRows,
      calloutRows,
      projectedProblems,
      hiddenRegionProblems
    } = layoutContext;

    svg.on("click", event => {
      if (event.target === svg.node()) {
        setDocumentPropertiesContext();
        if (mapScaleControlsVisible) hideMapScaleControls();
      }
    });

    svg.append("g")
      .attr("class", "map-layer")
      .selectAll("path")
      .data(visibleGeo.features)
      .join("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d, i) => getRegionFill(d, i))
      .on("click", (event, feature) => {
        event.stopPropagation();
        const featureIndex = visibleGeo.features.indexOf(feature);
        renderPropertiesForActiveState({ kind: "region", id: getRegionId(feature, featureIndex) });
        showMapScaleControls();
      });

    const placed = layoutBundle.placed;
    rememberLabelPositions(placed);
    const placedByRowId = new Map(placed.map(row => [row.rowId, row]));
    const markerRows = mappedRows.map(row => placedByRowId.get(row.rowId) || row);
    const leaderRows = placed.filter(row => !row.hideLine);
    const report = analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds);
    lastLayout = { placed, settings, report, mapBounds, feasibility: layoutContext.feasibility };

    const leaderLayer = svg.append("g").attr("class", "leader-layer");
    if (settings.showLineCasing) {
    leaderLayer.selectAll("path.leader-casing")
        .data(leaderRows)
        .join("path")
        .attr("class", "leader-casing")
        .attr("data-layout-id", d => d.layoutId)
        .attr("data-label-side", d => d.labelSide)
        .attr("data-label-name", d => d.name)
        .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings) + 3.5)
        .attr("d", d => linePath(d, settings));
    }
    leaderLayer.selectAll("path.leader-line")
      .data(leaderRows)
      .join("path")
      .attr("class", "leader-line")
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .attr("stroke-width", d => getCategoryLineWidth(getCategory(d.type), settings))
      .attr("d", d => linePath(d, settings));

    const markerLayer = svg.append("g").attr("class", "marker-layer");
    const markers = markerLayer.selectAll(".marker")
      .data(markerRows)
      .join(function (enter) {
        return enter.append(d => createMarkerElement(getCategory(d.type)));
      })
      .attr("class", d => `marker marker-${cleanType(d.type)}${getCategory(d.type).customIcon ? " marker-custom-icon" : ""}${settings.lockMarkerCoordinates ? " is-locked" : ""}`)
      .each(function (d) {
        const category = getCategory(d.type);
        const node = d3.select(this);
        if (category.customIcon) {
          node
            .attr("href", category.customIcon.dataUrl)
            .attr("xlink:href", category.customIcon.dataUrl)
            .attr("preserveAspectRatio", "xMidYMid meet");
        } else {
          node
            .attr("fill", category.colour)
            .attr("stroke", category.stroke);
        }
        moveMarkerNode(node, d, { markerSize: getCategoryMarkerSize(category, settings) });
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        setRowPropertiesContext("marker", d, { labelKey: d.labelKey || getLabelKey(d) });
      });
    if (!settings.lockMarkerCoordinates) attachMarkerDragging(markers, projection, settings);

    const labelBackgroundLayer = svg.append("g").attr("class", "label-background-layer");
    labelBackgroundLayer.selectAll("rect")
      .data(placed)
      .join("rect")
      .attr("class", "map-label-background")
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .on("click", (event, d) => {
        event.stopPropagation();
        setRowPropertiesContext("label", d, { labelKey: d.labelKey, manual: Boolean(manualLabelPositions[d.labelKey]) });
      })
      .each(function (d) {
        positionLabelBackground(d3.select(this), d);
      });
    const labelLayer = svg.append("g").attr("class", "label-layer");
    const labels = labelLayer.selectAll("text")
      .data(placed)
      .join("text")
      .attr("class", "map-label")
      .attr("font-size", settings.labelSizeRender)
      .attr("font-family", settings.fontFamily)
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .attr("x", d => d.labelX)
      .attr("y", d => d.labelY)
      .attr("text-anchor", d => d.anchor)
      .on("click", (event, d) => {
        event.stopPropagation();
        setRowPropertiesContext("label", d, { labelKey: d.labelKey, manual: Boolean(manualLabelPositions[d.labelKey]) });
      });

    labels.each(function (d) {
      const text = d3.select(this);
      d.lines.forEach((line, i) => {
        text.append("tspan")
          .attr("class", line.role === "separator" ? "label-line label-separator" : "label-line")
          .attr("x", d.labelX)
          .attr("dy", i === 0 ? 0 : d.lineHeight)
          .text(line.role === "separator" ? "" : lineText(line));
        if (i === d.lines.length - 1 && d.footnote) appendSuperscript(text, d.footnote, settings.labelSizeRender);
      });
    });
    attachLabelDragging(labels);

    if (settings.showCallouts && calloutRows.length) drawCallouts(svg, calloutRows, settings, mapBounds);
    if (settings.showLegend) drawLegend(svg, settings, mapBounds);
    if (mapScaleControlsVisible) drawMapScaleControls(svg, settings, mapBounds);
    updateStatus(rows, mappedRows, calloutRows, report, true);
    refreshDocumentPropertiesIfActive();
    if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
  }

  function appendSuperscript(textSelection, value, labelSize) {
    textSelection.append("tspan")
      .attr("class", "label-footnote")
      .attr("dx", 2)
      .attr("baseline-shift", "super")
      .attr("font-size", labelSize * 0.68)
      .text(value);
  }

  function drawMapScaleControls(svg, settings, mapBounds) {
    const pad = 8;
    const x0 = mapBounds.x0 - pad;
    const y0 = mapBounds.y0 - pad;
    const x1 = mapBounds.x1 + pad;
    const y1 = mapBounds.y1 + pad;
    const width = x1 - x0;
    const height = y1 - y0;
    const center = {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2
    };
    const handleSize = 9;
    const handles = [
      { id: "nw", x: x0, y: y0 },
      { id: "n", x: center.x, y: y0 },
      { id: "ne", x: x1, y: y0 },
      { id: "e", x: x1, y: center.y },
      { id: "se", x: x1, y: y1 },
      { id: "s", x: center.x, y: y1 },
      { id: "sw", x: x0, y: y1 },
      { id: "w", x: x0, y: center.y }
    ];
    const guideLength = 18;
    const mapRect = { x0, y0, x1, y1 };
    drawDistanceMarkers(svg, settings, mapRect, { includeNearbyLabels: true });

    function boundsForScale(scale) {
      const ratio = normalizeMapScale(scale) / settings.mapScale;
      const scaledWidth = width * ratio;
      const scaledHeight = height * ratio;
      return {
        x0: center.x - scaledWidth / 2,
        y0: center.y - scaledHeight / 2,
        x1: center.x + scaledWidth / 2,
        y1: center.y + scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight
      };
    }

    function handlesForBounds(bounds) {
      return [
        { id: "nw", x: bounds.x0, y: bounds.y0 },
        { id: "n", x: center.x, y: bounds.y0 },
        { id: "ne", x: bounds.x1, y: bounds.y0 },
        { id: "e", x: bounds.x1, y: center.y },
        { id: "se", x: bounds.x1, y: bounds.y1 },
        { id: "s", x: center.x, y: bounds.y1 },
        { id: "sw", x: bounds.x0, y: bounds.y1 },
        { id: "w", x: bounds.x0, y: center.y }
      ];
    }

    function updateMapScalePreview(overlay, bounds, scale) {
      overlay.select(".map-scale-selection")
        .attr("x", bounds.x0)
        .attr("y", bounds.y0)
        .attr("width", bounds.width)
        .attr("height", bounds.height);

      overlay.select(".map-scale-center-guide-vertical")
        .attr("x1", center.x)
        .attr("y1", Math.max(0, bounds.y0 - guideLength))
        .attr("x2", center.x)
        .attr("y2", Math.min(settings.height, bounds.y1 + guideLength));

      overlay.select(".map-scale-center-guide-horizontal")
        .attr("x1", Math.max(0, bounds.x0 - guideLength))
        .attr("y1", center.y)
        .attr("x2", Math.min(settings.width, bounds.x1 + guideLength))
        .attr("y2", center.y);

      overlay.selectAll("rect.map-scale-handle")
        .data(handlesForBounds(bounds), d => d.id)
        .attr("x", d => d.x - handleSize / 2)
        .attr("y", d => d.y - handleSize / 2);

      const previewText = formatMapScalePercent(scale);
      const previewWidth = Math.max(48, previewText.length * 9 + 18);
      const previewX = clamp(bounds.x1 + 10, 8, settings.width - previewWidth - 8);
      const previewY = clamp(bounds.y0 - 22, 8, settings.height - 24);
      overlay.select(".map-scale-badge")
        .attr("transform", `translate(${previewX},${previewY})`);
      overlay.select(".map-scale-badge rect")
        .attr("width", previewWidth);
      overlay.select(".map-scale-badge text")
        .text(previewText);
    }

    const overlay = svg.append("g")
      .attr("class", "map-scale-controls")
      .on("click", event => event.stopPropagation());

    overlay.append("rect")
      .attr("class", "map-scale-selection")
      .attr("x", x0)
      .attr("y", y0)
      .attr("width", width)
      .attr("height", height);

    overlay.append("line")
      .attr("class", "map-scale-center-guide map-scale-center-guide-vertical")
      .attr("x1", center.x)
      .attr("y1", Math.max(0, y0 - guideLength))
      .attr("x2", center.x)
      .attr("y2", Math.min(settings.height, y1 + guideLength));

    overlay.append("line")
      .attr("class", "map-scale-center-guide map-scale-center-guide-horizontal")
      .attr("x1", Math.max(0, x0 - guideLength))
      .attr("y1", center.y)
      .attr("x2", Math.min(settings.width, x1 + guideLength))
      .attr("y2", center.y);

    overlay.append("circle")
      .attr("class", "map-scale-center-point")
      .attr("cx", center.x)
      .attr("cy", center.y)
      .attr("r", 3);

    const badgeText = `${settings.mapScale}%`;
    const badgeX = clamp(x1 + 10, 8, settings.width - 58);
    const badgeY = clamp(y0 - 22, 8, settings.height - 24);
    const badge = overlay.append("g")
      .attr("class", "map-scale-badge")
      .attr("transform", `translate(${badgeX},${badgeY})`);
    badge.append("rect")
      .attr("width", Math.max(48, badgeText.length * 9 + 18))
      .attr("height", 22)
      .attr("rx", 4);
    badge.append("text")
      .attr("x", 9)
      .attr("y", 15)
      .text(badgeText);

    overlay.selectAll("rect.map-scale-handle")
      .data(handles)
      .join("rect")
      .attr("class", d => `map-scale-handle map-scale-handle-${d.id}`)
      .attr("x", d => d.x - handleSize / 2)
      .attr("y", d => d.y - handleSize / 2)
      .attr("width", handleSize)
      .attr("height", handleSize)
      .call(d3.drag()
        .on("start", function (event, d) {
          const pointer = d3.pointer(event, els.svg.node());
          d.startScale = settings.mapScale;
          d.scaleChanged = false;
          d.center = center;
          d.startDistance = Math.max(1, Math.hypot(pointer[0] - center.x, pointer[1] - center.y));
          clearDistanceMarkers();
          overlay.classed("is-previewing", true);
          d3.select(this).classed("is-dragging", true);
        })
        .on("drag", function (event, d) {
          const pointer = d3.pointer(event, els.svg.node());
          const currentDistance = Math.max(1, Math.hypot(pointer[0] - d.center.x, pointer[1] - d.center.y));
          const nextScale = normalizeMapScale(d.startScale * currentDistance / d.startDistance);
          if (String(nextScale) === String(els.mapScaleInput.value)) return;
          d.scaleChanged = true;
          els.mapScaleInput.value = nextScale;
          rememberCurrentLanguageMapScale();
          updateMapScalePreview(overlay, boundsForScale(nextScale), nextScale);
        })
        .on("end", function (event, d) {
          d3.select(this).classed("is-dragging", false);
          overlay.classed("is-previewing", false);
          if (d.scaleChanged) {
            scheduleRender();
            setStatusMessage(t("status.mapSizeChanged"), "ok");
          }
        }));
  }

  function attachLabelDragging(labels) {
    labels.call(d3.drag()
      .on("start", function (event, d) {
        d.dragStartX = d.labelX;
        d.dragStartY = d.labelY;
        d.dragAxis = null;
        d.dragHistoryPushed = false;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const settings = getSettings();
        if (!d.dragHistoryPushed) {
          pushManualLayoutHistory(`label move: ${d.name || "label"}`, { allowEmpty: true });
          d.dragHistoryPushed = true;
        }
        let next = constrainShiftDrag(
          { x: d.dragStartX, y: d.dragStartY },
          { x: d.labelX + event.dx, y: d.labelY + event.dy },
          d,
          event
        );
        d.labelX = next.x;
        d.labelY = next.y;
        manualLabelPositions[d.labelKey] = { x: d.labelX, y: d.labelY };

        const label = d3.select(this)
          .attr("x", d.labelX)
          .attr("y", d.labelY);
        label.selectAll("tspan.label-line").attr("x", d.labelX);

        d3.select(`rect.map-label-background[data-layout-id="${d.layoutId}"]`)
          .call(node => positionLabelBackground(node, d));
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d, settings));

        drawDistanceMarkers(els.svg, settings, labelVisualBox(d, 8), {
          mapBounds: lastLayout ? lastLayout.mapBounds : null,
          includeNearbyLabels: true,
          activeLabelKey: d.labelKey
        });
      })
      .on("end", function (event, d) {
        delete d.dragStartX;
        delete d.dragStartY;
        delete d.dragAxis;
        delete d.dragHistoryPushed;
        clearDistanceMarkers();
        d3.select(this).classed("is-dragging", false);
        refreshActiveRowProperties();
      }));
  }

  function attachMarkerDragging(markers, projection, settings) {
    markers.call(d3.drag()
      .on("start", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        d.dragOffsetX = d.x - pointer[0];
        d.dragOffsetY = d.y - pointer[1];
        d.dragStartX = d.x;
        d.dragStartY = d.y;
        d.dragAxis = null;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const pointer = d3.pointer(event, els.svg.node());
        const next = constrainShiftDrag(
          { x: d.dragStartX, y: d.dragStartY },
          { x: pointer[0] + d.dragOffsetX, y: pointer[1] + d.dragOffsetY },
          d,
          event
        );
        d.x = next.x;
        d.y = next.y;
        moveMarkerNode(d3.select(this), d, { markerSize: getCategoryMarkerSize(getCategory(d.type), settings) });
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("d", linePath(d, settings));
      })
      .on("end", function (event, d) {
        delete d.dragOffsetX;
        delete d.dragOffsetY;
        delete d.dragStartX;
        delete d.dragStartY;
        delete d.dragAxis;
        d3.select(this).classed("is-dragging", false);
        const coordinates = projection.invert([d.x, d.y]);
        if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
          setStatusMessage(t("status.coordinateUpdateFailed", { name: d.name }), "danger");
          return;
        }

        const lon = roundCoordinate(coordinates[0]);
        const lat = roundCoordinate(coordinates[1]);
        updateTableCoordinates(d.rowId, lon, lat);
        d.lon = lon;
        d.lat = lat;
        setStatusMessage(t("status.coordinatesUpdated", { name: d.name }), "ok");
      }));
  }

  function positionLabelBackground(node, d) {
    const box = labelBackgroundRect(d);

    node.attr("x", box.x0)
      .attr("y", box.y0)
      .attr("width", box.x1 - box.x0)
      .attr("height", box.y1 - box.y0);
  }

  function moveMarkerNode(node, d, settings) {
    const tagName = node.node().tagName.toLowerCase();
    if (tagName === "image") {
      node.attr("x", d.x - settings.markerSize)
        .attr("y", d.y - settings.markerSize)
        .attr("width", settings.markerSize * 2)
        .attr("height", settings.markerSize * 2);
      return;
    }

    if (tagName === "rect") {
      node.attr("x", d.x - settings.markerSize)
        .attr("y", d.y - settings.markerSize)
        .attr("width", settings.markerSize * 2)
        .attr("height", settings.markerSize * 2);
      return;
    }

    if (tagName === "circle") {
      node.attr("cx", d.x)
        .attr("cy", d.y)
        .attr("r", settings.markerSize);
      return;
    }

    node.attr("d", markerPath(getCategory(d.type).shape, settings.markerSize))
      .attr("transform", `translate(${d.x},${d.y})`);
  }

  function roundCoordinate(value) {
    return Math.round(value * 100000) / 100000;
  }

  function updateTableCoordinates(rowId, lon, lat) {
    const tr = getTableRows()
      .find(row => row.dataset.rowId === String(rowId));
    if (!tr) return;

    tr.querySelector(".lon-input").value = formatProjectCoordinate(lon);
    tr.querySelector(".lat-input").value = formatProjectCoordinate(lat);
    syncCoordinateClearButtons(tr);
  }

  function getFocusedTablePosition() {
    const active = document.activeElement;
    if (!active || !els.tableBody.contains(active)) return null;

    const tr = active.closest("tr");
    const rowIndex = getTableRows().indexOf(tr);
    let fieldIndex = -1;
    if (active.classList.contains("name-input")) fieldIndex = tableFields.indexOf("name");
    if (active.classList.contains("footnote-input")) fieldIndex = tableFields.indexOf("footnote");
    if (active.classList.contains("type-input")) fieldIndex = tableFields.indexOf("type");
    if (active.classList.contains("priority-input")) fieldIndex = tableFields.indexOf("priority");
    if (active.classList.contains("lon-input")) fieldIndex = tableFields.indexOf("lon");
    if (active.classList.contains("lat-input")) fieldIndex = tableFields.indexOf("lat");

    if (rowIndex < 0 || fieldIndex < 0) return null;
    return { rowIndex, fieldIndex };
  }

  function parseExcelPaste(text) {
    const cleaned = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
    if (!cleaned.trim()) return [];
    if (window.Papa) return Papa.parse(cleaned, { delimiter: "\t" }).data;
    return parseDelimitedText(cleaned, "\t").data;
  }

  function parseDelimitedText(text, delimiter = ",") {
    const source = String(text || "").replace(/^\ufeff/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const rows = [];
    const errors = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const next = source[index + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === delimiter) {
        row.push(field);
        field = "";
        continue;
      }

      if (!inQuotes && char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }

      field += char;
    }

    if (inQuotes) errors.push({ row: rows.length, message: t("dialog.csv.error.unclosedQuotedValue") });
    row.push(field);
    if (row.some(value => String(value).length > 0) || rows.length === 0) rows.push(row);

    return { data: rows, errors };
  }

  function parseCsvText(text) {
    const parsed = parseDelimitedText(text, ",");
    const records = parsed.data.filter(row => row.some(value => String(value || "").trim() !== ""));
    const fields = records.length ? records[0].map(value => String(value || "").trim()) : [];
    const data = records.slice(1).map(record => {
      const row = {};
      fields.forEach((field, index) => {
        row[field] = record[index] === undefined ? "" : record[index];
      });
      if (record.length > fields.length) row.__parsed_extra = record.slice(fields.length);
      return row;
    });
    return { data, errors: parsed.errors, meta: { fields } };
  }

  function csvEscape(value) {
    const text = String(value === null || value === undefined ? "" : value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function unparseCsvRows(rows, columns) {
    const lines = [
      columns.map(csvEscape).join(","),
      ...rows.map(row => columns.map(column => csvEscape(row[column])).join(","))
    ];
    return lines.join("\r\n");
  }

  function setTableField(tr, field, value) {
    if (field === "name") tr.querySelector(".name-input").value = String(value || "").trim();
    if (field === "footnote") tr.querySelector(".footnote-input").value = normalizeFootnote(value);
    if (field === "type") tr.querySelector(".type-input").value = cleanType(value);
    if (field === "priority") tr.querySelector(".priority-input").value = toPriority(value);
    if (field === "lon") tr.querySelector(".lon-input").value = formatProjectCoordinate(value);
    if (field === "lat") tr.querySelector(".lat-input").value = formatProjectCoordinate(value);
    if (field === "lon" || field === "lat") syncCoordinateClearButtons(tr);
  }

  function pasteIntoTable(event) {
    const text = event.clipboardData && event.clipboardData.getData("text");
    const pastedRows = parseExcelPaste(text);
    if (!pastedRows.length) return;

    event.preventDefault();
    const start = getFocusedTablePosition() || { rowIndex: getTableRows().length, fieldIndex: 0 };
    const rowsNeeded = start.rowIndex + pastedRows.length;

    const addedRows = [];
    const fragment = document.createDocumentFragment();
    let currentRowCount = getTableRows().length;
    while (currentRowCount < rowsNeeded) {
      const tr = addRow(undefined, { container: fragment, deferRefresh: true });
      tr.classList.add("is-new");
      addedRows.push(tr);
      currentRowCount += 1;
    }
    if (addedRows.length) {
      els.tableBody.appendChild(fragment);
      window.setTimeout(() => addedRows.forEach(tr => tr.classList.remove("is-new")), 120);
    }

    const tableRows = getTableRows();
    pastedRows.forEach((pastedRow, rowOffset) => {
      const tr = tableRows[start.rowIndex + rowOffset];
      pastedRow.forEach((value, colOffset) => {
        const field = tableFields[start.fieldIndex + colOffset];
        if (field) setTableField(tr, field, value);
      });
    });

    const firstPastedRow = tableRows[start.rowIndex];
    if (firstPastedRow) firstPastedRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
    clearAllLanguageLayouts();
    refreshProjectTableUx();
    requestPreviewRefresh();
    setStatusMessage(t("status.pastedRows", { count: pastedRows.length }), "ok");
  }

  function updateDeleteButtonState() {
    const hasSelection = getProjectRowsSelectedForDelete().length > 0;
    els.deleteSelectedBtn.disabled = !hasSelection;
    updateReactProjectToolbar();
    publishReadonlyAppSnapshot();
  }

  function getProjectRowsSelectedForDelete() {
    const selectedCellRowIds = new Set(Array.from(selectedProjectCells).map(key => parseProjectCellKey(key).rowId));
    return Array.from(els.tableBody.querySelectorAll("tr")).filter(tr => {
      return tr.querySelector(".row-select")?.checked || selectedCellRowIds.has(String(tr.dataset.rowId));
    });
  }

  function isTextEntryControl(element) {
    if (!element) return false;
    const tagName = element.tagName ? element.tagName.toLowerCase() : "";
    if (element.isContentEditable || tagName === "textarea" || tagName === "select") return true;
    if (tagName !== "input") return false;
    return !["checkbox", "radio", "button", "submit", "reset"].includes((element.type || "").toLowerCase());
  }

  function getFocusableProjectRowControl(tr, fromElement) {
    if (!tr) return null;
    const selector = fromElement && fromElement.classList ? Array.from(fromElement.classList).find(className => className.endsWith("-input") || className === "row-select") : "";
    if (selector) {
      const matched = tr.querySelector(`.${selector}`);
      if (matched) return matched;
    }
    return tr.querySelector(".name-input");
  }

  function focusAdjacentProjectRow(currentRow, direction, fromElement) {
    const visibleRows = getTableRows().filter(tr => !tr.hidden);
    const currentIndex = visibleRows.indexOf(currentRow);
    if (currentIndex < 0) return;
    const nextIndex = Math.max(0, Math.min(visibleRows.length - 1, currentIndex + direction));
    const nextRow = visibleRows[nextIndex];
    if (!nextRow || nextRow === currentRow) return;
    setProjectRowPropertiesFromElement(nextRow);
    const nextControl = getFocusableProjectRowControl(nextRow, fromElement);
    if (nextControl) nextControl.focus({ preventScroll: true });
    nextRow.scrollIntoView({ block: "nearest" });
  }

  function clearProjectSelectionContext() {
    highlightActiveProjectRow(null);
    activePropertiesSelection = null;
    renderPropertiesForActiveState();
  }

  function handleProjectTableKeydown(event) {
    const tr = event.target.closest("tbody tr");
    if (!tr || !els.tableBody.contains(tr)) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusAdjacentProjectRow(tr, event.key === "ArrowDown" ? 1 : -1, event.target);
      return;
    }

    if (event.key === "Enter") {
      if (event.target.matches("button")) return;
      event.preventDefault();
      setProjectRowPropertiesFromElement(tr);
      tr.querySelector(".row-select").checked = true;
      tr.classList.add("is-row-selected");
      updateDeleteButtonState();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      clearProjectSelectionContext();
      return;
    }

    if (event.key === "Delete" && !isTextEntryControl(event.target)) {
      event.preventDefault();
      els.deleteSelectedBtn.click();
    }
  }

  function isTypingShortcutTarget(element) {
    if (!element) return false;
    const tagName = element.tagName ? element.tagName.toLowerCase() : "";
    return element.isContentEditable || ["input", "textarea", "select"].includes(tagName);
  }

  function openShortcutsOverlay() {
    if (!els.shortcutsOverlay) return;
    shortcutsReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    els.shortcutsOverlay.hidden = false;
    const closeButton = els.closeShortcutsBtn || els.shortcutsOverlay.querySelector("button");
    if (closeButton) closeButton.focus({ preventScroll: true });
  }

  function closeShortcutsOverlay() {
    if (!els.shortcutsOverlay) return;
    els.shortcutsOverlay.hidden = true;
    if (shortcutsReturnFocus && shortcutsReturnFocus.isConnected) {
      shortcutsReturnFocus.focus({ preventScroll: true });
    }
    shortcutsReturnFocus = null;
  }

  function trapShortcutsFocus(event) {
    if (event.key !== "Tab" || !els.shortcutsOverlay || els.shortcutsOverlay.hidden) return false;
    const focusable = Array.from(els.shortcutsOverlay.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter(element => !element.disabled && !element.hidden);
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return true;
  }

  function handleGlobalKeyboardShortcuts(event) {
    if (trapShortcutsFocus(event)) return;
    if (event.key === "Escape" && els.shortcutsOverlay && !els.shortcutsOverlay.hidden) {
      event.preventDefault();
      closeShortcutsOverlay();
      return;
    }
    if (event.key === "Escape" && propertiesDrawerMedia.matches && document.body.classList.contains("properties-open")) {
      event.preventDefault();
      setPropertiesDrawerOpen(false, { restoreFocus: true });
      return;
    }
    if (event.key !== "?" || isTypingShortcutTarget(event.target)) return;
    event.preventDefault();
    if (els.shortcutsOverlay && !els.shortcutsOverlay.hidden) closeShortcutsOverlay();
    else openShortcutsOverlay();
  }

  function syncCategorySettingsFromControls() {
    const settings = getSettings();
    Array.from(els.categoryList.querySelectorAll(".category-editor")).forEach(editor => {
      const category = categorySettings.find(item => item.id === editor.dataset.categoryId);
      if (!category) return;
      category.label = editor.querySelector(".category-label-input").value.trim() || category.defaultLabel;
      category.shape = normalizeMarkerShape(editor.querySelector(".category-shape-input").value);
      category.colour = editor.querySelector(".category-colour-input").value;
      category.markerSize = optionalNumber(editor.querySelector(".category-marker-size-input").value) || settings.markerSize;
      category.lineWidth = optionalNumber(editor.querySelector(".category-line-width-input").value) || settings.lineWidth;
      const categoryTitle = editor.querySelector(".category-header strong");
      if (categoryTitle) {
        const displayLabel = getCategoryLabel(category.id, currentUiLanguage);
        categoryTitle.textContent = displayLabel;
        categoryTitle.title = displayLabel;
      }
      editor.querySelector(".category-swatch").innerHTML = getCategorySwatchSvg(category);
    });
  }

  function applyCategorySettings(categories = []) {
    if (!categories.length) {
      renderCategoryEditors();
      updateTypeOptions();
      return;
    }

    const existingCategories = categorySettings.slice();
    const nextCategories = [];
    const settings = getSettings();

    categories.forEach(savedCategory => {
      const category = existingCategories.find(item => item.id === savedCategory.id);
      const fallbackLabel = t("properties.category.defaultName");
      const label = String(savedCategory.label || savedCategory.defaultLabel || fallbackLabel).trim() || fallbackLabel;
      const labelFr = String(savedCategory.labelFr || "").trim();
      const shape = normalizeMarkerShape(savedCategory.shape);
      const colour = normalizeHexColour(savedCategory.colour, "#217346");
      const markerSize = optionalNumber(savedCategory.markerSize) || settings.markerSize;
      const lineWidth = optionalNumber(savedCategory.lineWidth) || settings.lineWidth;
      const customIcon = normalizeCustomMarkerIcon(savedCategory.customIcon);
      const markerSizeCustom = savedCategory.markerSizeCustom !== undefined
        ? Boolean(savedCategory.markerSizeCustom)
        : markerSize !== settings.markerSize;
      const lineWidthCustom = savedCategory.lineWidthCustom !== undefined
        ? Boolean(savedCategory.lineWidthCustom)
        : lineWidth !== settings.lineWidth;

      if (category) {
        category.label = label;
        category.labelFr = labelFr;
        category.shape = shape;
        category.colour = colour;
        category.markerSize = markerSize;
        category.lineWidth = lineWidth;
        category.customIcon = customIcon;
        category.markerSizeCustom = markerSizeCustom;
        category.lineWidthCustom = lineWidthCustom;
        category.collapsed = Boolean(savedCategory.collapsed);
        nextCategories.push(category);
        return;
      }

      nextCategories.push({
        id: makeCategoryId(savedCategory.id || label),
        label,
        labelFr,
        defaultLabel: label,
        shape,
        colour,
        stroke: "#ffffff",
        markerSize,
        lineWidth,
        customIcon,
        markerSizeCustom,
        lineWidthCustom,
        collapsed: Boolean(savedCategory.collapsed),
        removable: true
      });
    });

    existingCategories
      .filter(category => !category.removable && !nextCategories.some(item => item.id === category.id))
      .forEach(category => nextCategories.push(category));

    categorySettings.length = 0;
    nextCategories.forEach(category => categorySettings.push(category));
    renderCategoryEditors();
    updateTypeOptions();
  }

  function handleCategorySettingsChange(event) {
    if (event && event.target) captureInputUndo(event.target, "category edit");
    if (event && event.target.classList.contains("category-preset-input") && event.target.value) {
      const editor = event.target.closest(".category-editor");
      editor.querySelector(".category-colour-input").value = event.target.value;
    }
    if (event && (event.target.classList.contains("category-marker-size-input") || event.target.classList.contains("category-line-width-input"))) {
      const editor = event.target.closest(".category-editor");
      const category = editor ? categorySettings.find(item => item.id === editor.dataset.categoryId) : null;
      if (category && event.target.classList.contains("category-marker-size-input")) category.markerSizeCustom = true;
      if (category && event.target.classList.contains("category-line-width-input")) category.lineWidthCustom = true;
    }
    syncCategorySettingsFromControls();
    updateTypeOptions();
    requestPreviewRefresh();
  }

  function handleLayoutSettingsChange(event) {
    const target = event ? event.target : null;
    if (target === els.showLegendInput && setMapFurnitureVisibility("legend", target.checked, target, t("properties.furniture.legend"))) {
      syncCompactFurnitureAvailability();
      return;
    }
    if (target === els.showCalloutsInput && setMapFurnitureVisibility("callouts", target.checked, target, t("properties.furniture.callouts"))) {
      syncCompactFurnitureAvailability();
      return;
    }
    if (target === els.showLineCasingInput) {
      const hasLayer = setPreviewLayerVisibility(".leader-casing", target.checked);
      if (!target.checked || hasLayer) {
        setStatusMessage(t("status.leaderCasing", { state: t(target.checked ? "status.shown" : "status.hidden") }), "ok");
        return;
      }
    }
    if (target === els.showDistanceMarkersInput) {
      clearDistanceMarkers();
      setStatusMessage(t("status.distanceMarkers", { state: t(target.checked ? "status.enabled" : "status.disabled") }), "ok");
      return;
    }

    if (event && event.target === els.bookSizeInput) {
      renderImageSizeOptions();
    }

    if (event && (event.target === els.bookSizeInput || event.target === els.imageSizeInput)) {
      saveLayoutPreferences();
    }

    if (event && (event.target === els.markerSizeInput || event.target === els.lineWidthInput)) {
      syncDefaultCategorySizes();
    }
    syncCompactFurnitureAvailability();
    if (!target || target === els.markerSizeInput || target === els.lineWidthInput) {
      renderCategoryEditors();
    }
    scheduleRender();
    if (event && event.target === els.mapScaleInput) {
      rememberCurrentLanguageMapScale();
      updateCanvasToolbar();
      setStatusMessage(t("status.mapSizeChanged"), "ok");
    }
  }

  function addCategory() {
    pushAppUndoHistory("add category");
    const count = categorySettings.length + 1;
    const label = t("properties.category.defaultNameNumbered", { count });
    const settings = getSettings();
    categorySettings.push({
      id: makeCategoryId(label),
      label,
      labelFr: "",
      defaultLabel: label,
      shape: "circle",
      colour: "#217346",
      stroke: "#ffffff",
      markerSize: settings.markerSize,
      lineWidth: settings.lineWidth,
      markerSizeCustom: false,
      lineWidthCustom: false,
      customIcon: null,
      collapsed: false,
      removable: true
    });
    renderCategoryEditors();
    updateTypeOptions();
    requestPreviewRefresh();
  }

  function toggleCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return;
    category.collapsed = !category.collapsed;
    renderCategoryEditors();
  }

  function removeCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return;
    if (categorySettings.length <= 1) {
      setStatusMessage(t("status.legendMarkerRequired"), "warning");
      return;
    }

    pushAppUndoHistory("remove category");
    const replacementCategory = categorySettings.find(item => item.id !== categoryId) || getDefaultCategory();
    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      if (select.value === categoryId) select.value = replacementCategory.id;
    });
    categorySettings.splice(categorySettings.indexOf(category), 1);
    renderCategoryEditors();
    updateTypeOptions();
    requestPreviewRefresh();
  }

  function clearCategoryDropIndicators() {
    if (!els.categoryList) return;
    els.categoryList.querySelectorAll(".category-editor").forEach(editor => {
      editor.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    });
    activeCategoryDropEditor = null;
    activeCategoryDropPlacement = null;
  }

  function clearCategoryDropTargets() {
    if (activeCategoryDropEditor) {
      activeCategoryDropEditor.classList.remove("is-drop-before", "is-drop-after");
    }
    activeCategoryDropEditor = null;
    activeCategoryDropPlacement = null;
  }

  function setCategoryDropTarget(editor, placement) {
    if (activeCategoryDropEditor === editor && activeCategoryDropPlacement === placement) return;
    clearCategoryDropTargets();
    activeCategoryDropEditor = editor;
    activeCategoryDropPlacement = placement;
    editor.classList.toggle("is-drop-before", placement === "before");
    editor.classList.toggle("is-drop-after", placement === "after");
  }

  function reorderCategory(categoryId, targetCategoryId, placement) {
    if (!categoryId || !targetCategoryId || categoryId === targetCategoryId) return false;
    const fromIndex = categorySettings.findIndex(category => category.id === categoryId);
    const targetIndex = categorySettings.findIndex(category => category.id === targetCategoryId);
    if (fromIndex < 0 || targetIndex < 0) return false;

    pushAppUndoHistory("reorder category");
    const [category] = categorySettings.splice(fromIndex, 1);
    const adjustedTargetIndex = categorySettings.findIndex(item => item.id === targetCategoryId);
    const insertIndex = placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    categorySettings.splice(insertIndex, 0, category);
    renderCategoryEditors();
    updateTypeOptions();
    requestPreviewRefresh();
    return true;
  }

  function getCategoryDropPlacement(event, editor) {
    const rect = editor.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
  }

  function handleCategoryDragStart(event) {
    const handle = event.target.closest(".category-drag-handle");
    if (!handle) return;
    draggedCategoryId = handle.dataset.categoryId;
    const editor = handle.closest(".category-editor");
    if (editor) editor.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedCategoryId);
    }
  }

  function handleCategoryDragOver(event) {
    if (!draggedCategoryId) return;
    const editor = event.target.closest(".category-editor");
    if (!editor || !els.categoryList.contains(editor) || editor.dataset.categoryId === draggedCategoryId) {
      clearCategoryDropTargets();
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const placement = getCategoryDropPlacement(event, editor);
    setCategoryDropTarget(editor, placement);
  }

  function handleCategoryDrop(event) {
    if (!draggedCategoryId) return;
    const editor = event.target.closest(".category-editor");
    if (!editor || !els.categoryList.contains(editor)) return;
    event.preventDefault();
    const placement = getCategoryDropPlacement(event, editor);
    const moved = reorderCategory(draggedCategoryId, editor.dataset.categoryId, placement);
    clearCategoryDropIndicators();
    if (moved) setStatusMessage(t("status.legendOrderUpdated"), "ok");
    draggedCategoryId = null;
  }

  function handleCategoryDragEnd() {
    draggedCategoryId = null;
    clearCategoryDropIndicators();
  }

  function linePath(d, settings = getSettings()) {
    const points = leaderPathPoints(d, settings);
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  }

  function translatePosition(position) {
    return `translate(${position.x},${position.y})`;
  }

  function clampBoxPosition(position, dimensions, settings) {
    return {
      x: Math.max(0, Math.min(settings.width - dimensions.width, position.x)),
      y: Math.max(0, Math.min(settings.height - dimensions.height, position.y))
    };
  }

  function clampBoxDimensions(dimensions, constraints, settings) {
    const minWidth = constraints && Number.isFinite(constraints.minWidth) ? constraints.minWidth : 80;
    const minHeight = constraints && Number.isFinite(constraints.minHeight) ? constraints.minHeight : 40;
    const maxWidth = Math.max(minWidth, Math.min(
      constraints && Number.isFinite(constraints.maxWidth) ? constraints.maxWidth : settings.width,
      settings.width
    ));
    const maxHeight = Math.max(minHeight, Math.min(
      constraints && Number.isFinite(constraints.maxHeight) ? constraints.maxHeight : settings.height,
      settings.height
    ));
    return {
      width: Math.max(minWidth, Math.min(maxWidth, dimensions.width)),
      height: Math.max(minHeight, Math.min(maxHeight, dimensions.height))
    };
  }

  function getBoxDimensions(key, fallback, constraints, settings) {
    const manual = manualBoxPositions[key];
    return clampBoxDimensions({
      width: manual && Number.isFinite(manual.width) ? manual.width : fallback.width,
      height: manual && Number.isFinite(manual.height) ? manual.height : fallback.height
    }, constraints, settings);
  }

  function getBoxPosition(key, fallback, dimensions, settings) {
    const manual = manualBoxPositions[key];
    const position = manual && Number.isFinite(manual.x) && Number.isFinite(manual.y) ? manual : fallback;
    return clampBoxPosition(position, dimensions, settings);
  }

  function saveManualBoxState(key, position, dimensions) {
    manualBoxPositions[key] = {
      ...(manualBoxPositions[key] || {}),
      x: Math.round(position.x * 10) / 10,
      y: Math.round(position.y * 10) / 10,
      width: Math.round(dimensions.width * 10) / 10,
      height: Math.round(dimensions.height * 10) / 10
    };
  }

  function getFurnitureRowMetrics(settings) {
    const compact = settings.compactFurniture !== false;
    return {
      insetX: compact ? 24 : 30,
      markerX: compact ? 46 : 52,
      textX: compact ? 72 : 82,
      rightPad: compact ? 24 : 30
    };
  }

  function getLegendBoxLayout(settings) {
    const compact = settings.compactFurniture !== false;
    const rowMetrics = getFurnitureRowMetrics(settings);
    const headingSize = Math.max(settings.labelSize, Math.round(settings.labelSize * 1.02));
    const headingSizeRender = Math.max(settings.labelSizeRender, Math.round(settings.labelSizeRender * 1.02));
    const rowHeight = Math.max(compact ? 30 : 34, Math.round(settings.labelSize * (compact ? 2.25 : 2.45)));
    const headingHeight = Math.max(compact ? 26 : 31, Math.round(headingSize * (compact ? 1.85 : 2.1)));
    const verticalPadding = Math.max(compact ? 18 : 22, Math.round(settings.labelSize * (compact ? 1.45 : 1.7)));
    const headingRuleY = verticalPadding + headingHeight;
    const headingText = getChromeText("legendHeading", settings.mapLanguage);
    const longestLabelLength = Math.max(6, headingText.length, ...categorySettings.map(category => getCategoryText(category, settings.mapLanguage).length));
    const widthPad = compact ? 112 : 126;
    const fallbackDimensions = {
      width: Math.max(compact ? 270 : 300, Math.min(420, Math.round(longestLabelLength * settings.labelSize * 0.58 + widthPad))),
      height: verticalPadding * 2 + headingHeight + categorySettings.length * rowHeight
    };
    const constraints = {
      minWidth: Math.max(compact ? 260 : 290, Math.round(longestLabelLength * settings.labelSizeRender * 0.58 + (compact ? 106 : 126))),
      minHeight: fallbackDimensions.height,
      maxWidth: settings.width - 20,
      maxHeight: settings.height - 20
    };
    const dimensions = getBoxDimensions("legend", fallbackDimensions, constraints, settings);
    const position = getBoxPosition("legend", { x: 40, y: settings.height - 150 }, dimensions, settings);
    return {
      dimensions,
      position,
      constraints,
      headingText,
      headingSizeRender,
      headingRuleY,
      rowHeight,
      headingHeight,
      verticalPadding,
      ...rowMetrics
    };
  }

  function getCalloutContentLayout(calloutRows, settings, width) {
    const compact = settings.compactFurniture !== false;
    const rowMetrics = getFurnitureRowMetrics(settings);
    const headingText = getChromeText("calloutHeading", settings.mapLanguage);
    const headingSize = Math.max(settings.labelSizeRender, Math.round(settings.labelSizeRender * 1.02));
    const headingHeight = Math.max(compact ? 26 : 31, Math.round(headingSize * (compact ? 1.85 : 2.1)));
    const nameSize = settings.labelSizeRender;
    const lineH = Math.max(compact ? 20 : 23, Math.round(nameSize * (compact ? 1.6 : 1.75)));
    const rowGap = Math.max(compact ? 9 : 12, Math.round(settings.labelSizeRender * (compact ? 0.7 : 0.9)));
    const padV = Math.max(compact ? 18 : 22, Math.round(settings.labelSize * (compact ? 1.45 : 1.7)));
    const headingRuleY = padV + headingHeight;
    const headingRuleGap = compact ? 16 : 18;
    const { textX, markerX, rightPad } = rowMetrics;
    const textWidth = Math.max(90, width - textX - rightPad);
    const maxNameChars = Math.max(12, Math.floor(textWidth / Math.max(6, nameSize * 0.58)));
    let cursorY = headingRuleY + headingRuleGap;
    const rows = calloutRows.map((row, index) => {
      const nameLines = getLabelLines(row, { ...settings, labelMaxChars: maxNameChars });
      const nameHeight = nameLines.length * lineH;
      const rowHeight = nameHeight;
      const layout = {
        row,
        rowY: cursorY,
        rowHeight,
        nameLines
      };
      cursorY += rowHeight + (index < calloutRows.length - 1 ? rowGap : 0);
      return layout;
    });

    return {
      headingText,
      headingSize,
      headingHeight,
      headingRuleY,
      nameSize,
      lineH,
      rowGap,
      padV,
      ...rowMetrics,
      rows,
      contentHeight: Math.max(padV * 2, cursorY + padV)
    };
  }

  function getCalloutBoxLayout(calloutRows, settings) {
    const compact = settings.compactFurniture !== false;
    const headingText = getChromeText("calloutHeading", settings.mapLanguage);
    const longestNameLen = Math.max(0, ...calloutRows.map(row => getLabelText(row, settings.mapLanguage).length));
    const boxPad = compact ? 118 : 132;
    const nameWidth = longestNameLen * settings.labelSize * 0.58 + boxPad;
    const headingWidth = headingText.length * Math.max(settings.labelSize, Math.round(settings.labelSize * 1.02)) * 0.58 + boxPad;
    const fallbackWidth = Math.max(compact ? 270 : 300, Math.min(settings.width - 40, Math.round(Math.max(nameWidth, headingWidth))));
    const widthConstraints = {
      minWidth: compact ? 260 : 290,
      minHeight: 40,
      maxWidth: settings.width - 20,
      maxHeight: settings.height - 20
    };
    const widthOnly = getBoxDimensions("callouts", { width: fallbackWidth, height: 40 }, widthConstraints, settings).width;
    const content = getCalloutContentLayout(calloutRows, settings, widthOnly);
    const fallbackDimensions = {
      width: widthOnly,
      height: content.contentHeight
    };
    const constraints = {
      minWidth: widthConstraints.minWidth,
      minHeight: content.contentHeight,
      maxWidth: widthConstraints.maxWidth,
      maxHeight: widthConstraints.maxHeight
    };
    const dimensions = getBoxDimensions("callouts", fallbackDimensions, constraints, settings);
    const fittedContent = dimensions.width === widthOnly
      ? content
      : getCalloutContentLayout(calloutRows, settings, dimensions.width);
    dimensions.height = Math.max(dimensions.height, fittedContent.contentHeight);
    const fallback = {
      x: Math.max(30, settings.width - dimensions.width - 30),
      y: 30
    };
    const position = getBoxPosition("callouts", fallback, dimensions, settings);
    return {
      dimensions,
      position,
      constraints: { ...constraints, minHeight: fittedContent.contentHeight },
      ...fittedContent
    };
  }

  function getLayoutBoxObstacles(settings, calloutRows) {
    const pad = Math.max(12, Math.round(settings.labelSize * 0.8));
    const obstacles = [];
    if (settings.showLegend) {
      const legend = getLegendBoxLayout(settings);
      obstacles.push({
        key: "legend",
        rect: inflateRect(rectFromPosition(legend.position, legend.dimensions), pad)
      });
    }
    if (settings.showCallouts && calloutRows.length) {
      const callouts = getCalloutBoxLayout(calloutRows, settings);
      obstacles.push({
        key: "callouts",
        rect: inflateRect(rectFromPosition(callouts.position, callouts.dimensions), pad)
      });
    }
    return obstacles;
  }

  function attachBoxDragging(group, key, position, dimensions, settings, label, mapBounds) {
    const state = { x: position.x, y: position.y };
    group.call(d3.drag()
      .on("start", function () {
        state.dragStartX = state.x;
        state.dragStartY = state.y;
        state.axis = null;
        state.historyPushed = false;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event) {
        if (!state.historyPushed) {
          pushManualLayoutHistory(`${label} move`, { allowEmpty: true });
          state.historyPushed = true;
        }
        const constrained = constrainShiftDrag(
          { x: state.dragStartX, y: state.dragStartY },
          { x: state.x + event.dx, y: state.y + event.dy },
          state,
          event
        );
        const next = clampBoxPosition(constrained, dimensions, settings);
        state.x = next.x;
        state.y = next.y;
        saveManualBoxState(key, next, dimensions);
        d3.select(this).attr("transform", translatePosition(next));
        const subjectRect = rectFromPosition(next, dimensions);
        drawDistanceMarkers(els.svg, settings, subjectRect, {
          mapBounds,
          includeNearbyLabels: true
        });
      })
      .on("end", function () {
        delete state.dragStartX;
        delete state.dragStartY;
        delete state.axis;
        delete state.historyPushed;
        clearDistanceMarkers();
        d3.select(this).classed("is-dragging", false);
        setStatusMessage(t("status.itemMoved", { label }), "ok");
      }));
  }

  function positionBoxControls(group, dimensions) {
    group.select(".box-hide-control")
      .attr("transform", `translate(${Math.max(8, dimensions.width - 25)},8)`);
    group.select(".box-resize-control")
      .attr("transform", `translate(${Math.max(0, dimensions.width - 16)},${Math.max(0, dimensions.height - 16)})`);
  }

  function attachBoxControls(group, key, position, dimensions, constraints, settings, label, mapBounds, visibilityInput) {
    const hide = group.append("g")
      .attr("class", "box-controls box-hide-control")
      .attr("role", "button")
      .attr("aria-label", t("map.hideBox", { label }))
      .on("click", event => {
        event.stopPropagation();
        if (visibilityInput) {
          setMapFurnitureVisibility(key, false, visibilityInput, label);
        }
      });

    hide.append("rect")
      .attr("width", 17)
      .attr("height", 17)
      .attr("rx", 3);
    hide.append("line")
      .attr("x1", 5)
      .attr("y1", 5)
      .attr("x2", 12)
      .attr("y2", 12);
    hide.append("line")
      .attr("x1", 12)
      .attr("y1", 5)
      .attr("x2", 5)
      .attr("y2", 12);

    const resizeState = {
      x: position.x,
      y: position.y,
      width: dimensions.width,
      height: dimensions.height
    };
    const resize = group.append("g")
      .attr("class", "box-controls box-resize-control")
      .call(d3.drag()
        .on("start", function (event) {
          if (event.sourceEvent) event.sourceEvent.stopPropagation();
          resizeState.historyPushed = false;
          d3.select(this).classed("is-dragging", true);
          group.classed("is-resizing", true);
        })
        .on("drag", function (event) {
          if (event.sourceEvent) event.sourceEvent.stopPropagation();
          if (!resizeState.historyPushed) {
            pushManualLayoutHistory(`${label} resize`, { allowEmpty: true });
            resizeState.historyPushed = true;
          }
          const nextDimensions = clampBoxDimensions({
            width: resizeState.width + event.dx,
            height: resizeState.height + event.dy
          }, constraints, settings);
          const nextPosition = clampBoxPosition({ x: resizeState.x, y: resizeState.y }, nextDimensions, settings);
          resizeState.x = nextPosition.x;
          resizeState.y = nextPosition.y;
          resizeState.width = nextDimensions.width;
          resizeState.height = nextDimensions.height;
          saveManualBoxState(key, nextPosition, nextDimensions);
          group.attr("transform", translatePosition(nextPosition));
          group.select(".legend-box, .callout-box")
            .attr("width", nextDimensions.width)
            .attr("height", nextDimensions.height);
          positionBoxControls(group, nextDimensions);
          const subjectRect = rectFromPosition(nextPosition, nextDimensions);
          drawDistanceMarkers(els.svg, settings, subjectRect, {
            mapBounds,
            includeNearbyLabels: true
          });
        })
        .on("end", function () {
          d3.select(this).classed("is-dragging", false);
          group.classed("is-resizing", false);
          delete resizeState.historyPushed;
          clearDistanceMarkers();
          scheduleRender();
          setStatusMessage(t("status.itemResized", { label }), "ok");
        }));

    resize.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("rx", 3);
    resize.append("path")
      .attr("d", "M5,12 L12,5 M9,12 L12,9");

    positionBoxControls(group, dimensions);
  }

  function drawLegend(svg, settings, mapBounds) {
    const {
      dimensions,
      position,
      constraints,
      headingText,
      headingSizeRender,
      headingRuleY,
      rowHeight,
      headingHeight,
      verticalPadding,
      markerX,
      textX
    } = getLegendBoxLayout(settings);
    const group = svg.append("g")
      .attr("class", "legend-layer movable-map-box")
      .attr("transform", translatePosition(position))
      .on("click", event => {
        event.stopPropagation();
        setFurniturePropertiesContext(
          "legend",
          t("properties.furniture.legend"),
          t("properties.subtitle.furnitureSelected", { label: t("properties.furniture.legend") }),
          t("properties.furniture.legendHint"),
          els.showLegendInput
        );
      });

    group.append("rect")
      .attr("class", "legend-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    group.append("text")
      .attr("class", "box-heading legend-heading")
      .attr("x", 24)
      .attr("y", verticalPadding + 4)
      .attr("font-size", headingSizeRender)
      .attr("font-family", settings.fontFamily)
      .attr("dominant-baseline", "hanging")
      .text(headingText);

    group.append("line")
      .attr("class", "box-heading-rule legend-heading-rule")
      .attr("x1", 24)
      .attr("y1", headingRuleY)
      .attr("x2", Math.max(24, dimensions.width - 24))
      .attr("y2", headingRuleY);

    categorySettings.forEach((category, index) => {
      const itemY = verticalPadding + headingHeight + index * rowHeight + rowHeight / 2;
      const legendMarkerSize = Math.max(8, Math.min(18, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, markerX, itemY, legendMarkerSize);
      group.append("text")
        .attr("class", "legend-text")
        .attr("x", textX)
        .attr("y", itemY)
        .attr("font-size", settings.labelSizeRender)
        .attr("font-family", settings.fontFamily)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(getCategoryText(category, settings.mapLanguage));
    });

    attachBoxDragging(group, "legend", position, dimensions, settings, t("properties.furniture.legend"), mapBounds);
    attachBoxControls(group, "legend", position, dimensions, constraints, settings, t("properties.furniture.legend"), mapBounds, els.showLegendInput);
  }

  function drawCallouts(svg, calloutRows, settings, mapBounds) {
    const {
      dimensions,
      position,
      constraints,
      headingText,
      headingSize,
      headingRuleY,
      nameSize,
      lineH,
      padV,
      textX,
      markerX,
      rows
    } = getCalloutBoxLayout(calloutRows, settings);
    const group = svg.append("g")
      .attr("class", "callout-layer movable-map-box")
      .attr("transform", translatePosition(position))
      .on("click", event => {
        event.stopPropagation();
        setFurniturePropertiesContext(
          "callouts",
          t("properties.furniture.callouts"),
          t("properties.furniture.calloutSubtitle"),
          t("properties.furniture.calloutHint"),
          els.showCalloutsInput
        );
      });

    group.append("rect")
      .attr("class", "callout-box")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    group.append("text")
      .attr("class", "box-heading callout-heading")
      .attr("x", 24)
      .attr("y", padV + 4)
      .attr("font-size", headingSize)
      .attr("font-family", settings.fontFamily)
      .attr("dominant-baseline", "hanging")
      .text(headingText);

    group.append("line")
      .attr("class", "box-heading-rule callout-heading-rule")
      .attr("x1", 24)
      .attr("y1", headingRuleY)
      .attr("x2", Math.max(24, dimensions.width - 24))
      .attr("y2", headingRuleY);

    rows.forEach(layout => {
      const { row, rowY, nameLines, rowHeight } = layout;
      const category = getCategory(row.type);
      const markerSize = Math.max(7, Math.min(14, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, markerX, rowY + rowHeight / 2, markerSize);

      const nameEl = group.append("text")
        .attr("class", "callout-text")
        .attr("x", textX)
        .attr("y", rowY)
        .attr("font-size", nameSize)
        .attr("font-family", settings.fontFamily)
        .attr("dominant-baseline", "hanging");
      nameLines.forEach((line, index) => {
        nameEl.append("tspan")
          .attr("x", textX)
          .attr("dy", index === 0 ? 0 : lineH)
          .text(line.role === "separator" ? "" : lineText(line));
      });
      const footnote = getRenderableFootnote(row.footnote);
      if (footnote) appendSuperscript(nameEl, footnote, nameSize);
    });

    attachBoxDragging(group, "callouts", position, dimensions, settings, t("properties.furniture.callouts"), mapBounds);
    attachBoxControls(group, "callouts", position, dimensions, constraints, settings, t("properties.furniture.callouts"), mapBounds, els.showCalloutsInput);
  }

  function drawMarkerSymbol(svg, category, cx, cy, size) {
    const markerData = { x: cx, y: cy, type: category.id };
    if (category.customIcon) {
      const image = svg.append("image")
        .attr("class", `marker marker-${category.id} marker-custom-icon`)
        .attr("href", category.customIcon.dataUrl)
        .attr("xlink:href", category.customIcon.dataUrl)
        .attr("preserveAspectRatio", "xMidYMid meet");
      moveMarkerNode(image, markerData, { markerSize: size });
      return image;
    }

    if (category.shape === "square") {
      const rect = svg.append("rect")
        .attr("class", `marker marker-${category.id}`)
        .attr("width", size * 2)
        .attr("height", size * 2)
        .attr("fill", category.colour)
        .attr("stroke", category.stroke);
      moveMarkerNode(rect, markerData, { markerSize: size });
      return rect;
    }

    if (category.shape === "circle") {
      const circle = svg.append("circle")
        .attr("class", `marker marker-${category.id}`)
        .attr("r", size)
        .attr("fill", category.colour)
        .attr("stroke", category.stroke);
      moveMarkerNode(circle, markerData, { markerSize: size });
      return circle;
    }

    const path = svg.append("path")
      .attr("class", `marker marker-${category.id}`)
      .attr("fill", category.colour)
      .attr("stroke", category.stroke);
    moveMarkerNode(path, markerData, { markerSize: size });
    return path;
  }

  function createMarkerElement(category) {
    const tagName = category.customIcon ? "image" : category.shape === "circle" ? "circle" : category.shape === "square" ? "rect" : "path";
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }

  function markerPath(shape, size) {
    const s = size;
    const t = size * 0.38;

    if (shape === "diamond") return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
    if (shape === "drop-pin") {
      return [
        `M0,${s}`,
        `C${-s * 0.62},${s * 0.28} ${-s * 0.86},${-s * 0.02} ${-s * 0.86},${-s * 0.32}`,
        `C${-s * 0.86},${-s * 0.78} ${-s * 0.44},${-s} 0,${-s}`,
        `C${s * 0.44},${-s} ${s * 0.86},${-s * 0.78} ${s * 0.86},${-s * 0.32}`,
        `C${s * 0.86},${-s * 0.02} ${s * 0.62},${s * 0.28} 0,${s}`,
        "Z"
      ].join(" ");
    }
    if (shape === "triangle-up") return `M0,${-s} L${s},${s} L${-s},${s} Z`;
    if (shape === "triangle-down") return `M${-s},${-s} L${s},${-s} L0,${s} Z`;
    if (shape === "plus") {
      return `M${-t},${-s} L${t},${-s} L${t},${-t} L${s},${-t} L${s},${t} L${t},${t} L${t},${s} L${-t},${s} L${-t},${t} L${-s},${t} L${-s},${-t} L${-t},${-t} Z`;
    }
    if (shape === "cross") {
      const a = size * 0.32;
      return `M0,${-a} L${s - a},${-s} L${s},${-s + a} L${a},0 L${s},${s - a} L${s - a},${s} L0,${a} L${-s + a},${s} L${-s},${s - a} L${-a},0 L${-s},${-s + a} L${-s + a},${-s} Z`;
    }
    if (shape === "star") return starPath(size);

    return `M0,${-s} L${s},0 L0,${s} L${-s},0 Z`;
  }

  function getCategorySwatchSvg(category) {
    if (category.customIcon) {
      const href = escapeHtml(category.customIcon.dataUrl);
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><image href="${href}" xlink:href="${href}" x="3" y="3" width="18" height="18" preserveAspectRatio="xMidYMid meet"></image></svg>`;
    }

    const fill = escapeHtml(category.colour);
    const stroke = escapeHtml(category.stroke);
    if (category.shape === "circle") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></circle></svg>`;
    }
    if (category.shape === "square") {
      return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></rect></svg>`;
    }

    return `<svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="${markerPath(category.shape, 9)}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"></path></svg>`;
  }

  function starPath(size) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? size : size * 0.45;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
    }
    return `M${points.join(" L")} Z`;
  }

  function drawMissingMapMessage(svg, settings, title, message) {
    const messageLanguage = settings && settings.mapLanguage || currentMapLanguage;
    const resolvedTitle = title || tFor(messageLanguage, "status.missingBoundaryTitle");
    const resolvedMessage = message || tFor(messageLanguage, "status.missingBoundaryBody");
    svg.append("rect")
      .attr("x", 30)
      .attr("y", 70)
      .attr("width", settings.width - 60)
      .attr("height", 160)
      .attr("fill", "#fff7e6")
      .attr("stroke", "#d29a22");
    svg.append("text")
      .attr("x", 55)
      .attr("y", 115)
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .text(resolvedTitle);
    svg.append("text")
      .attr("x", 55)
      .attr("y", 150)
      .attr("font-size", 16)
      .text(resolvedMessage);
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function getCssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function quoteFontFamily(fontFamily) {
    return normalizeFontFamily(fontFamily)
      .split(",")
      .map(font => {
        const trimmed = font.trim();
        return /\s/.test(trimmed) && !/^["'].*["']$/.test(trimmed) ? `"${trimmed}"` : trimmed;
      })
      .join(", ");
  }

  function getExportCss() {
    const mapBackground = getCssVar("--map-background", "#ffffff");
    const mapBoundary = getCssVar("--map-boundary", "#ffffff");
    const mapBoxBorder = getCssVar("--map-box-border", "#333333");
    const ink = getCssVar("--map-ink", getCssVar("--ink", "#222222"));
    const muted = getCssVar("--map-muted", getCssVar("--muted", "#666666"));
    const leader = getCssVar("--leader", "#333333");
    const fontFamily = quoteFontFamily(getSettings().fontFamily);

    return `
      #mapSvg { background: ${mapBackground}; }
      .map-title { font-size: 24px; font-weight: 700; fill: ${ink}; font-family: ${fontFamily}; }
      .province { stroke: ${mapBoundary}; stroke-width: 1.2; }
      .marker { stroke-width: 2.2; }
      .leader-casing { fill: none; stroke: ${mapBackground}; stroke-linecap: round; stroke-linejoin: round; }
      .leader-line { fill: none; stroke: ${leader}; stroke-linecap: round; stroke-linejoin: round; }
      .map-label-background { fill: none; stroke: none; }
      .map-label { font-family: ${fontFamily}; font-weight: 700; fill: ${ink}; }
      .label-footnote { font-weight: 700; }
      .callout-box, .legend-box { fill: ${mapBackground}; stroke: ${mapBoxBorder}; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      .callout-box { stroke-dasharray: 6 4; }
      .callout-text, .legend-text { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .box-heading { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .box-heading-rule { stroke: ${mapBoxBorder}; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      .callout-heading-rule { stroke-dasharray: 6 4; }
      .legend-note { font-family: ${fontFamily}; fill: ${muted}; font-style: italic; }
    `;
  }

  function cloneCurrentSvgForExport(outputMode = "web") {
    const svgNode = document.querySelector("#mapSvg");
    if (!svgNode || !svgNode.children.length) throw new Error(t("status.noMapToExport"));

    const clone = svgNode.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("version", "1.1");
    clone.setAttribute("style", `background:${getCssVar("--map-background", "#ffffff")}`);
    if (outputMode === "print") {
      const settings = getSettings({ outputMode: "print" });
      clone.setAttribute("width", `${settings.width}pt`);
      clone.setAttribute("height", `${settings.height}pt`);
      clone.setAttribute("data-output", "print");
    } else {
      clone.setAttribute("data-output", "web");
    }

    clone.querySelectorAll(".map-scale-controls, .distance-markers, .box-controls").forEach(node => node.remove());

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = getExportCss();
    clone.insertBefore(style, clone.firstChild);
    return clone;
  }

  function cloneSvgForExport(outputMode = "web") {
    if (outputMode === renderOutputMode) return cloneCurrentSvgForExport(outputMode);

    const previousOutputMode = renderOutputMode;
    try {
      renderOutputMode = outputMode;
      render();
      return cloneCurrentSvgForExport(outputMode);
    } finally {
      renderOutputMode = previousOutputMode;
      render();
    }
  }

  function exportSvg() {
    try {
      const clone = cloneSvgForExport("print");
      const source = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
      download("custom-map.svg", source, "image/svg+xml;charset=utf-8");
      setStatusMessage(t("status.svgExportStarted"), "ok");
    } catch (error) {
      setStatusMessage(t("status.svgGenericFailed", { message: error.message || String(error) }), "danger");
    }
  }

  function exportPng() {
    let url = "";
    try {
      const settings = getSettings();
      const clone = cloneSvgForExport("web");
      const svgText = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = function () {
        try {
          const scale = 2;
          const canvas = document.createElement("canvas");
          canvas.width = settings.width * scale;
          canvas.height = settings.height * scale;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error(t("status.pngCanvasFailed"));
          ctx.fillStyle = getCssVar("--map-background", "#ffffff");
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          canvas.toBlob(blob => {
            if (!blob) {
              setStatusMessage(t("status.pngCanvasFailed"), "danger");
              return;
            }
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = "custom-map.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(pngUrl);
            setStatusMessage(t("status.pngExportStarted"), "ok");
          }, "image/png");
        } catch (error) {
          URL.revokeObjectURL(url);
          setStatusMessage(t("status.pngGenericFailed", { message: error.message || String(error) }), "danger");
        }
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        setStatusMessage(t("status.pngReadFailed"), "danger");
      };

      img.src = url;
    } catch (error) {
      if (url) URL.revokeObjectURL(url);
      setStatusMessage(t("status.pngGenericFailed", { message: error.message || String(error) }), "danger");
    }
  }

  function exportCsv() {
    const csvExport = projectIo.createCsvExport({
      rows: getRows(),
      getCategoryLabel,
      getCategoryText,
      getCategoryForType
    });
    const csvBody = window.Papa ? Papa.unparse(csvExport.rows, { columns: csvExport.columns }) : unparseCsvRows(csvExport.rows, csvExport.columns);
    const csv = "\ufeff" + csvBody;
    download("custom-map-data.csv", csv, "text/csv;charset=utf-8");
    setStatusMessage(t("status.csvExportStarted"), "ok");
  }

  const currentProjectVersion = 5;

  function validateAndNormalizeProject(rawProject) {
    return projectIo.validateAndNormalizeProject(rawProject, {
      projectFile: window.PlotypusProjectFile,
      currentVersion: currentProjectVersion,
      boundarySources,
      mapStylePresets,
      defaultBoundary: "canada",
      defaultMapStyle: defaultMapStylePreset,
      normalizeLanguage: normalizeMapLanguage
    });
  }

  function saveProject() {
    const project = projectIo.createProjectSnapshot({
      version: currentProjectVersion,
      boundary: currentBoundary,
      mapStyle: currentMapStylePreset,
      mapLanguage: currentMapLanguage,
      settings: getSettings(),
      chromeTranslations,
      mapDetails: { ...mapDetails },
      authoringLanguage: activeAuthoringLanguage,
      categories: categorySettings,
      rows: getRows(),
      regionVisibility,
      regionFills,
      regionColourOverrides,
      regionValues,
      languageLayouts: serializeLanguageLayouts(),
      manualLabelPositions,
      manualBoxPositions,
      cleanType
    });

    download("custom-map-project.json", JSON.stringify(project, null, 2), "application/json;charset=utf-8");
    setStatusMessage(t("status.projectSaveStarted"), "ok");
  }

  function loadProject(file) {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const rawProject = projectIo.parseProjectJson(reader.result);
        const project = validateAndNormalizeProject(rawProject);

        if (rawProject.mapDetails && typeof rawProject.mapDetails === "object") {
          Object.keys(mapDetails).forEach(key => { mapDetails[key] = String(rawProject.mapDetails[key] || ""); });
        }
        setAuthoringLanguage(rawProject.authoringLanguage || "en");

        currentBoundary = project.boundary;
        els.boundaryInput.value = currentBoundary;
        applyMapStylePreset(project.mapStyle || defaultMapStylePreset, { applyMapColours: false, render: false });
        applySettings(project.settings || {});
        if (project.chromeTranslations && typeof project.chromeTranslations === "object") {
          Object.keys(chromeTranslations).forEach(key => {
            if (project.chromeTranslations[key]) {
              chromeTranslations[key] = {
                ...chromeTranslations[key],
                ...project.chromeTranslations[key]
              };
            }
          });
        }
        const projectLanguage = project.mapLanguage || project.settings && project.settings.mapLanguage || currentMapLanguage;
        setMapLanguage(projectLanguage, { render: false });
        updateMapDetailsState();
        if (project.settings) saveLayoutPreferences();
        applyCategorySettings(project.categories || []);
        regionVisibility = project.regionVisibility || {};
        regionFills = normalizeColourMap(project.regionFills || {});
        regionColourOverrides = project.regionColourOverrides || {};
        regionValues = project.regionValues || {};
        restoreLanguageLayouts(project, projectLanguage);
        setRows(project.rows, [], { preserveManualPositions: true, render: false });
        await loadGeo();
        renderRegionControls();
        render();
        setStatusMessage(t("status.projectLoaded", { count: project.rows.length }), "ok");
      } catch (error) {
        setStatusMessage(t("status.projectLoadGenericFailed", { message: translateErrorMessage(error) }), "danger");
      }
    };
    reader.onerror = function () {
      setStatusMessage(t("status.projectLoadReadFailed"), "danger");
    };
    reader.readAsText(file);
  }

  function getMapDetailsMissingFields() {
    return ["titleEn", "titleFr", "textEn", "textFr"].filter(key => !String(mapDetails[key] || "").trim());
  }

  function updateMapDetailsState() {
    const missingFrench = ["titleFr", "textFr"].some(key => !String(mapDetails[key] || "").trim());
    if (els.mapDetailsBtn) els.mapDetailsBtn.classList.toggle("has-warning", missingFrench);
    if (els.frMetaWarning) {
      els.frMetaWarning.hidden = !missingFrench;
      els.frMetaWarning.textContent = missingFrench ? "FR" : "";
    }
    updateWorkspaceSummary();
    refreshDocumentPropertiesIfActive();
    if (activeDataTable === "quality") {
      refreshQualityMetricsPanel();
      renderPropertiesForActiveState();
    }
  }

  function openDialog(dialog, returnFocus) {
    if (!dialog) return;
    dialog._returnFocus = returnFocus || document.activeElement;
    dialog.hidden = false;
    const focusTarget = dialog.querySelector("[data-dialog-initial-focus], input, textarea, select, button");
    if (focusTarget) focusTarget.focus();
  }

  function closeDialog(dialog) {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    if (dialog._returnFocus && typeof dialog._returnFocus.focus === "function") dialog._returnFocus.focus();
  }

  function isReactMapDetailsEnabled() {
    try {
      return new URLSearchParams(window.location.search).get("reactMapDetails") === "1";
    } catch {
      return false;
    }
  }

  async function loadReactAdapters() {
    if (window.PLOTYPUS_REACT_ADAPTERS) {
      return window.PLOTYPUS_REACT_ADAPTERS;
    }
    if (!reactAdaptersLoadPromise) {
      reactAdaptersLoadPromise = import("./dist/react/plotypus-react-adapters.js?v=20260626-properties-panel")
        .then(() => window.PLOTYPUS_REACT_ADAPTERS || null)
        .catch(() => null);
    }
    return reactAdaptersLoadPromise;
  }

  async function loadReactMapDetailsAdapters() {
    const adapters = await loadReactAdapters();
    return adapters && typeof adapters.mountMapDetailsDialog === "function" ? adapters : null;
  }

  function isReactProjectToolbarEnabled() {
    try {
      return new URLSearchParams(window.location.search).get("reactProjectToolbar") === "1";
    } catch {
      return false;
    }
  }

  async function loadReactProjectToolbarAdapters() {
    const adapters = await loadReactAdapters();
    return adapters && typeof adapters.mountProjectPointsToolbar === "function" ? adapters : null;
  }

  function isReactPropertiesPanelEnabled() {
    try {
      return new URLSearchParams(window.location.search).get("reactPropertiesPanel") === "1";
    } catch {
      return false;
    }
  }

  async function loadReactPropertiesPanelAdapters() {
    const adapters = await loadReactAdapters();
    return adapters && typeof adapters.mountPropertiesPanel === "function" ? adapters : null;
  }

  function getReactPropertiesPanelTarget() {
    if (!els.propertiesPanel) return null;
    if (!reactPropertiesPanelTarget) {
      reactPropertiesPanelTarget = document.createElement("div");
      reactPropertiesPanelTarget.id = "reactPropertiesPanelRoot";
      reactPropertiesPanelTarget.className = "react-properties-panel-root";
      reactPropertiesPanelTarget.hidden = true;
      const resizeHandle = els.propertiesResizeHandle;
      if (resizeHandle && resizeHandle.nextSibling) {
        els.propertiesPanel.insertBefore(reactPropertiesPanelTarget, resizeHandle.nextSibling);
      } else {
        els.propertiesPanel.appendChild(reactPropertiesPanelTarget);
      }
    }
    return reactPropertiesPanelTarget;
  }

  function setLegacyPropertiesPanelAvailable(isAvailable) {
    const card = els.propertiesPanel ? els.propertiesPanel.querySelector(".properties-card") : null;
    if (card) card.hidden = !isAvailable;
  }

  function restoreLegacyPropertiesPanel(reason, error = null) {
    if (reactPropertiesPanelHandle && typeof reactPropertiesPanelHandle.unmount === "function") {
      try {
        reactPropertiesPanelHandle.unmount();
      } catch (unmountError) {
        if (window.console && typeof window.console.warn === "function") {
          console.warn("[Plotypus React] Could not unmount Properties panel.", unmountError);
        }
      }
    }
    reactPropertiesPanelHandle = null;
    if (reactPropertiesPanelTarget) {
      reactPropertiesPanelTarget.hidden = true;
      reactPropertiesPanelTarget.replaceChildren();
    }
    setLegacyPropertiesPanelAvailable(true);
    if (reason && window.console && typeof window.console.warn === "function") {
      console.warn(`[Plotypus React] Properties panel restored to vanilla UI: ${reason}`, error || "");
    }
  }

  function updateReactPropertiesPanel() {
    if (!reactPropertiesPanelHandle || typeof reactPropertiesPanelHandle.render !== "function") return;
    try {
      reactPropertiesPanelHandle.render(createReadonlyAppSnapshot());
    } catch (error) {
      restoreLegacyPropertiesPanel("render failed", error);
    }
  }

  async function mountReactPropertiesPanel() {
    if (!isReactPropertiesPanelEnabled()) return false;
    const adapters = await loadReactPropertiesPanelAdapters();
    if (!adapters) {
      restoreLegacyPropertiesPanel("adapter unavailable");
      return false;
    }
    const target = getReactPropertiesPanelTarget();
    if (!target) {
      restoreLegacyPropertiesPanel("target unavailable");
      return false;
    }
    if (reactPropertiesPanelHandle && typeof reactPropertiesPanelHandle.unmount === "function") {
      reactPropertiesPanelHandle.unmount();
    }
    target.hidden = false;
    setLegacyPropertiesPanelAvailable(false);
    try {
      reactPropertiesPanelHandle = adapters.mountPropertiesPanel({
        onCollapseChange: runReadonlyPropertiesCommand,
        snapshot: createReadonlyAppSnapshot(),
        target
      });
      if (!reactPropertiesPanelHandle) {
        restoreLegacyPropertiesPanel("mount returned no handle");
        return false;
      }
      return true;
    } catch (error) {
      restoreLegacyPropertiesPanel("mount failed", error);
      return false;
    }
  }

  function getReactProjectToolbarTarget() {
    const host = document.querySelector('[data-table-actions="projects"]');
    if (!host) return null;
    if (!reactProjectToolbarTarget) {
      reactProjectToolbarTarget = document.createElement("div");
      reactProjectToolbarTarget.id = "reactProjectPointsToolbarRoot";
      reactProjectToolbarTarget.className = "react-project-points-toolbar-root";
      reactProjectToolbarTarget.hidden = true;
      const filters = host.querySelector(".project-table-filters");
      if (filters && filters.nextSibling) host.insertBefore(reactProjectToolbarTarget, filters.nextSibling);
      else host.appendChild(reactProjectToolbarTarget);
    }
    return reactProjectToolbarTarget;
  }

  function setLegacyProjectToolbarAvailable(isAvailable) {
    [
      document.querySelector(".project-table-filters"),
      document.querySelector(".authoring-language"),
      document.querySelector(".add-actions"),
      document.querySelector(".selection-actions"),
      els.projectImportCsvBtn,
      els.clearRowsBtn
    ].forEach(element => {
      if (element) element.hidden = !isAvailable;
    });
  }

  function restoreLegacyProjectToolbar(reason, error = null) {
    if (reactProjectToolbarHandle && typeof reactProjectToolbarHandle.unmount === "function") {
      try {
        reactProjectToolbarHandle.unmount();
      } catch (unmountError) {
        if (window.console && typeof window.console.warn === "function") {
          console.warn("[Plotypus React] Could not unmount Project points toolbar.", unmountError);
        }
      }
    }
    reactProjectToolbarHandle = null;
    if (reactProjectToolbarTarget) {
      reactProjectToolbarTarget.hidden = true;
      reactProjectToolbarTarget.replaceChildren();
    }
    setLegacyProjectToolbarAvailable(true);
    if (reason && window.console && typeof window.console.warn === "function") {
      console.warn(`[Plotypus React] Project points toolbar restored to vanilla UI: ${reason}`, error || "");
    }
  }

  function getReactProjectToolbarCopy() {
    return {
      addFromSource: t("toolbar.add.fromSource"),
      addGroup: t("toolbar.add.label"),
      addRow: t("toolbar.add.row"),
      clearCoordinates: t("toolbar.selection.clearCoordinates"),
      clearTable: t("toolbar.project.clearTable"),
      delete: t("toolbar.selection.delete"),
      filters: t("toolbar.filters.projects"),
      importCsv: t("toolbar.project.importCsv"),
      language: t("toolbar.authoring.label"),
      multiSelectGroup: t("toolbar.selection.label"),
      priority: t("toolbar.selection.priority"),
      tableGroup: t("toolbar.project.table")
    };
  }

  function getReactProjectFilterOptions() {
    const summary = summarizeProjectRows(getRows());
    return [
      { label: t("toolbar.filters.allCount", { count: summary.total }), value: "all" },
      { label: t("toolbar.filters.missingCoordinatesCount", { count: summary.coordinateIssues }), value: "missing" },
      { label: t("toolbar.filters.noCoordinateCalloutsCount", { count: summary.callouts }), value: "callouts" }
    ];
  }

  function getReactProjectToolbarState() {
    const counts = getProjectSelectionCounts();
    return {
      activeFilter: workspace.normalizeProjectFilter(activeProjectFilter),
      activeLanguage: activeAuthoringLanguage === "fr" ? "fr" : "en",
      filterOptions: getReactProjectFilterOptions(),
      selectedCellCount: counts.selectedCellCount,
      selectedCoordinateCellCount: counts.selectedCoordinateCellCount,
      selectedPriorityCellCount: counts.selectedPriorityCellCount,
      selectedRowCount: counts.selectedRowCount
    };
  }

  function updateReactProjectToolbar() {
    if (!reactProjectToolbarHandle || typeof reactProjectToolbarHandle.render !== "function") return;
    try {
      reactProjectToolbarHandle.render(getReactProjectToolbarState());
    } catch (error) {
      restoreLegacyProjectToolbar("render failed", error);
    }
  }

  function runReactProjectToolbarPriorityChange(priority) {
    if (priority === "") return;
    applyBulkPriority(priority);
  }

  async function mountReactProjectToolbar() {
    if (!isReactProjectToolbarEnabled()) return false;
    const adapters = await loadReactProjectToolbarAdapters();
    if (!adapters) {
      restoreLegacyProjectToolbar("adapter unavailable");
      return false;
    }
    const target = getReactProjectToolbarTarget();
    if (!target) {
      restoreLegacyProjectToolbar("target unavailable");
      return false;
    }
    if (reactProjectToolbarHandle && typeof reactProjectToolbarHandle.unmount === "function") {
      reactProjectToolbarHandle.unmount();
    }
    target.hidden = false;
    setLegacyProjectToolbarAvailable(false);
    try {
      reactProjectToolbarHandle = adapters.mountProjectPointsToolbar({
        copy: getReactProjectToolbarCopy(),
        onAddFromSource: () => els.addPointsBtn.click(),
        onAddRow: () => els.addRowBtn.click(),
        onClearCoordinates: clearSelectedCoordinateCells,
        onClearTable: confirmClearProjectRows,
        onDelete: () => els.deleteSelectedBtn.click(),
        onFilterChange: setProjectFilter,
        onImportCsv: () => els.csvInput.click(),
        onLanguageChange: setAuthoringLanguage,
        onPriorityChange: runReactProjectToolbarPriorityChange,
        state: getReactProjectToolbarState(),
        target
      });
      if (!reactProjectToolbarHandle) {
        restoreLegacyProjectToolbar("mount returned no handle");
        return false;
      }
      return true;
    } catch (error) {
      restoreLegacyProjectToolbar("mount failed", error);
      return false;
    }
  }

  function setLegacyMapDetailsFormAvailable(isAvailable) {
    if (!els.mapDetailsForm) return;
    els.mapDetailsForm.hidden = !isAvailable;
    [els.mapTitleEnInput, els.mapTitleFrInput, els.mapTextEnInput, els.mapTextFrInput].forEach(input => {
      if (!input) return;
      if (isAvailable) {
        if (input.dataset.reactDisabledId) {
          input.id = input.dataset.reactDisabledId;
          delete input.dataset.reactDisabledId;
        }
      } else if (input.id) {
        input.dataset.reactDisabledId = input.id;
        input.removeAttribute("id");
      }
    });
  }

  function unmountReactMapDetailsDialog({ preserveDraft = false, restoreForm = true } = {}) {
    if (reactMapDetailsHandle && typeof reactMapDetailsHandle.unmount === "function") reactMapDetailsHandle.unmount();
    reactMapDetailsHandle = null;
    if (!preserveDraft) reactMapDetailsDraft = null;
    if (reactMapDetailsTarget) {
      reactMapDetailsTarget.replaceChildren();
      reactMapDetailsTarget.hidden = true;
    }
    if (restoreForm) setLegacyMapDetailsFormAvailable(true);
  }

  function getReactMapDetailsTarget() {
    if (!els.mapDetailsDialog) return null;
    if (!reactMapDetailsTarget) {
      reactMapDetailsTarget = document.createElement("div");
      reactMapDetailsTarget.id = "reactMapDetailsDialogRoot";
      reactMapDetailsTarget.className = "react-map-details-dialog-root";
      reactMapDetailsTarget.hidden = true;
      reactMapDetailsTarget.addEventListener("input", updateReactMapDetailsDraftFromEvent);
      reactMapDetailsTarget.addEventListener("change", updateReactMapDetailsDraftFromEvent);
      els.mapDetailsDialog.appendChild(reactMapDetailsTarget);
    }
    return reactMapDetailsTarget;
  }

  function readMapDetailsDialogDraftValue() {
    const titleEnInput = els.mapDetailsDialog && els.mapDetailsDialog.querySelector("#mapTitleEnInput");
    const titleFrInput = els.mapDetailsDialog && els.mapDetailsDialog.querySelector("#mapTitleFrInput");
    const textEnInput = els.mapDetailsDialog && els.mapDetailsDialog.querySelector("#mapTextEnInput");
    const textFrInput = els.mapDetailsDialog && els.mapDetailsDialog.querySelector("#mapTextFrInput");
    if (titleEnInput || titleFrInput || textEnInput || textFrInput) {
      return {
        titleEn: titleEnInput ? titleEnInput.value : mapDetails.titleEn,
        titleFr: titleFrInput ? titleFrInput.value : mapDetails.titleFr,
        textEn: textEnInput ? textEnInput.value : mapDetails.textEn,
        textFr: textFrInput ? textFrInput.value : mapDetails.textFr
      };
    }
    if (reactMapDetailsDraft) return { ...reactMapDetailsDraft };
    return { ...mapDetails };
  }

  function updateReactMapDetailsDraftFromEvent(event) {
    if (!reactMapDetailsHandle) return;
    const target = event && event.target;
    if (!target || !["mapTitleEnInput", "mapTitleFrInput", "mapTextEnInput", "mapTextFrInput"].includes(target.id)) return;
    const currentDraft = readMapDetailsDialogDraftValue();
    reactMapDetailsDraft = {
      ...currentDraft,
      titleEn: target.id === "mapTitleEnInput" ? target.value : currentDraft.titleEn,
      titleFr: target.id === "mapTitleFrInput" ? target.value : currentDraft.titleFr,
      textEn: target.id === "mapTextEnInput" ? target.value : currentDraft.textEn,
      textFr: target.id === "mapTextFrInput" ? target.value : currentDraft.textFr
    };
  }

  function applyMapDetailsValue(value) {
    mapDetails.titleEn = String(value && value.titleEn || "").trim();
    mapDetails.titleFr = String(value && value.titleFr || "").trim();
    mapDetails.textEn = String(value && value.textEn || "").trim();
    mapDetails.textFr = String(value && value.textFr || "").trim();
  }

  function saveMapDetailsValue(value) {
    applyMapDetailsValue(value);
    document.title = mapDetails[currentMapLanguage === "fr" ? "titleFr" : "titleEn"] || "Plotypus";
    updateMapDetailsState();
    setStatusMessage(t("status.saved.mapDetails"), "ok");
  }

  async function openReactMapDetailsDialog(preservedDraft = null) {
    const adapters = await loadReactMapDetailsAdapters();
    if (!adapters || typeof adapters.mountMapDetailsDialog !== "function") return false;
    const target = getReactMapDetailsTarget();
    if (!target) return false;
    const isRemount = Boolean(reactMapDetailsHandle);
    const initialDraft = preservedDraft || (isRemount ? readMapDetailsDialogDraftValue() : { ...mapDetails });

    unmountReactMapDetailsDialog({ preserveDraft: true, restoreForm: false });
    reactMapDetailsDraft = initialDraft;
    setLegacyMapDetailsFormAvailable(false);
    target.hidden = false;
    els.mapDetailsDialog._undoSnapshot = createAppUndoSnapshot("map details edit");
    openDialog(els.mapDetailsDialog, els.mapDetailsBtn);
    reactMapDetailsHandle = adapters.mountMapDetailsDialog({
      locale: currentUiLanguage === "fr" ? "fr" : "en",
      onCancel: () => {
        unmountReactMapDetailsDialog();
        reactMapDetailsDraft = null;
        closeDialog(els.mapDetailsDialog);
        updateMapDetailsState();
      },
      onDraftChange: value => {
        reactMapDetailsDraft = { ...value };
      },
      onSave: value => {
        pushAppUndoSnapshot(els.mapDetailsDialog._undoSnapshot || createAppUndoSnapshot("map details edit"));
        els.mapDetailsDialog._undoSnapshot = null;
        saveMapDetailsValue(value);
        unmountReactMapDetailsDialog();
        reactMapDetailsDraft = null;
        closeDialog(els.mapDetailsDialog);
      },
      read: () => initialDraft,
      target,
      write: value => applyMapDetailsValue(value)
    });

    if (!reactMapDetailsHandle) {
      unmountReactMapDetailsDialog();
      closeDialog(els.mapDetailsDialog);
      return false;
    }
    const focusTarget = target.querySelector("[data-dialog-initial-focus], input, textarea, select, button");
    if (focusTarget) focusTarget.focus();
    return true;
  }

  async function openMapDetailsDialog() {
    if (isReactMapDetailsEnabled() && await openReactMapDetailsDialog()) return;
    unmountReactMapDetailsDialog();
    reactMapDetailsDraft = null;
    els.mapTitleEnInput.value = mapDetails.titleEn;
    els.mapTitleFrInput.value = mapDetails.titleFr;
    els.mapTextEnInput.value = mapDetails.textEn;
    els.mapTextFrInput.value = mapDetails.textFr;
    els.mapDetailsDialog._undoSnapshot = createAppUndoSnapshot("map details edit");
    openDialog(els.mapDetailsDialog, els.mapDetailsBtn);
    els.mapTitleEnInput.focus();
  }

  function updateMapDetailsDraftState() {
    const missingFrench = !els.mapTitleFrInput.value.trim() || !els.mapTextFrInput.value.trim();
    els.mapDetailsBtn.classList.toggle("has-warning", missingFrench);
    els.frMetaWarning.hidden = !missingFrench;
  }

  function saveMapDetails(event) {
    event.preventDefault();
    pushAppUndoSnapshot(els.mapDetailsDialog._undoSnapshot || createAppUndoSnapshot("map details edit"));
    els.mapDetailsDialog._undoSnapshot = null;
    saveMapDetailsValue({
      titleEn: els.mapTitleEnInput.value,
      titleFr: els.mapTitleFrInput.value,
      textEn: els.mapTextEnInput.value,
      textFr: els.mapTextFrInput.value
    });
    closeDialog(els.mapDetailsDialog);
  }

  const capitalCityRows = [
    { name: "Ottawa", nameFr: "Ottawa", type: "referred", lon: -75.6972, lat: 45.4215 },
    { name: "Victoria", nameFr: "Victoria", type: "referred", lon: -123.3656, lat: 48.4284 },
    { name: "Edmonton", nameFr: "Edmonton", type: "referred", lon: -113.4938, lat: 53.5461 },
    { name: "Regina", nameFr: "Regina", type: "referred", lon: -104.6189, lat: 50.4452 },
    { name: "Winnipeg", nameFr: "Winnipeg", type: "referred", lon: -97.1384, lat: 49.8951 },
    { name: "Toronto", nameFr: "Toronto", type: "referred", lon: -79.3832, lat: 43.6532 },
    { name: "Quebec City", nameFr: "Québec", type: "referred", lon: -71.208, lat: 46.8139 },
    { name: "Fredericton", nameFr: "Fredericton", type: "referred", lon: -66.6431, lat: 45.9636 },
    { name: "Halifax", nameFr: "Halifax", type: "referred", lon: -63.5752, lat: 44.6488 },
    { name: "Charlottetown", nameFr: "Charlottetown", type: "referred", lon: -63.1311, lat: 46.2382 },
    { name: "St. John's", nameFr: "Saint-Jean", type: "referred", lon: -52.7126, lat: 47.5615 },
    { name: "Whitehorse", nameFr: "Whitehorse", type: "referred", lon: -135.0568, lat: 60.7212 },
    { name: "Yellowknife", nameFr: "Yellowknife", type: "referred", lon: -114.3718, lat: 62.454 },
    { name: "Iqaluit", nameFr: "Iqaluit", type: "referred", lon: -68.517, lat: 63.7467 }
  ];

  const pointCatalogPresetRows = {
    capitals: capitalCityRows
  };

  const pointCatalogPresetLabelKeys = {
    capitals: "dialog.pointCatalog.capitals.title",
    "major-cities": "dialog.pointCatalog.majorCities.title",
    ports: "dialog.pointCatalog.ports.title",
    airports: "dialog.pointCatalog.airports.title",
    parks: "dialog.pointCatalog.parks.title",
    universities: "dialog.pointCatalog.universities.title"
  };

  function getPointCatalogPresetLabel(presetId) {
    return tOr(pointCatalogPresetLabelKeys[presetId] || "", presetId);
  }

  function syncPointCatalogSelection() {
    if (!els.pointCatalogDialog) return;
    els.pointCatalogDialog.querySelectorAll("[data-catalog-preset]").forEach(card => {
      const selected = selectedPointCatalogPresets.has(card.dataset.catalogPreset);
      card.classList.toggle("is-selected", selected);
      card.setAttribute("aria-pressed", String(selected));
      const check = card.querySelector(".catalog-card-check");
      if (check) check.textContent = selected ? "✓" : "";
    });
    if (els.catalogAddPointsBtn) {
      els.catalogAddPointsBtn.disabled = selectedPointCatalogPresets.size === 0;
    }
  }

  function togglePointCatalogPreset(presetId) {
    if (!presetId) return;
    if (selectedPointCatalogPresets.has(presetId)) selectedPointCatalogPresets.delete(presetId);
    else selectedPointCatalogPresets.add(presetId);
    syncPointCatalogSelection();
  }

  function addSelectedPointCatalogPresets() {
    const selectedPresets = Array.from(selectedPointCatalogPresets);
    if (!selectedPresets.length) return;
    const supportedPresets = selectedPresets.filter(presetId => Array.isArray(pointCatalogPresetRows[presetId]));
    const unsupportedPresets = selectedPresets.filter(presetId => !Array.isArray(pointCatalogPresetRows[presetId]));
    const rowsToAdd = supportedPresets.flatMap(presetId => pointCatalogPresetRows[presetId]);

    if (!rowsToAdd.length) {
      const names = unsupportedPresets.map(getPointCatalogPresetLabel).join(", ");
      setStatusMessage(t("status.presetNotConnected", { name: names || t("status.thatPreset") }), "warning");
      return;
    }

    pushAppUndoHistory("add preset points");
    setRows(getRows().concat(rowsToAdd), [], { render: false });
    selectedPointCatalogPresets = new Set();
    syncPointCatalogSelection();
    closeDialog(els.pointCatalogDialog);
    setActiveDataTab("projects");
    closeDialog(els.pointCatalogDialog);

    const addedNames = supportedPresets.map(getPointCatalogPresetLabel).join(", ");
    const skippedNames = unsupportedPresets.map(getPointCatalogPresetLabel).join(", ");
    setStatusMessage(
      skippedNames
        ? t("status.catalogAddedWithSkipped", { added: addedNames, skipped: skippedNames })
        : t("status.catalogAdded", { added: addedNames }),
      skippedNames ? "warning" : "ok"
    );
  }

  function setPointCatalogView(view) {
    activePointCatalogView = view === "sources" ? "sources" : "presets";
    els.pointCatalogTabs.forEach(tab => {
      const active = tab.dataset.catalogView === activePointCatalogView;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (els.pointCatalogPresetsPanel) els.pointCatalogPresetsPanel.hidden = activePointCatalogView !== "presets";
    if (els.pointCatalogSourcesPanel) els.pointCatalogSourcesPanel.hidden = activePointCatalogView !== "sources";
  }

  function showPointCatalog(event) {
    const trigger = event && event.currentTarget ? event.currentTarget : document.activeElement;
    if (els.pointCatalogScope) {
      const regionRows = getRegionRows();
      const includedCount = regionRows.filter(region => regionVisibility[region.id] !== false).length;
      const regionScope = regionRows.length
        ? t("dialog.pointCatalog.scopedRegions", {
          count: includedCount,
          unit: t(includedCount === 1 ? "dialog.pointCatalog.region" : "dialog.pointCatalog.regions")
        })
        : t("dialog.pointCatalog.scopedRegionsFallback");
      els.pointCatalogScope.textContent = t("dialog.pointCatalog.scope", { scope: regionScope });
    }
    selectedPointCatalogPresets = new Set();
    syncPointCatalogSelection();
    setPointCatalogView("presets");
    openDialog(els.pointCatalogDialog, trigger);
    const activeTab = els.pointCatalogTabs.find(tab => tab.dataset.catalogView === activePointCatalogView);
    if (activeTab) activeTab.focus();
  }

  const csvMapTargets = [
    { key: "name", labelKey: "dialog.csv.field.name", required: true },
    { key: "nameFr", labelKey: "dialog.csv.field.nameFr", required: false },
    { key: "type", labelKey: "dialog.csv.field.type", required: true },
    { key: "priority", labelKey: "dialog.csv.field.priority", required: false },
    { key: "lon", labelKey: "dialog.csv.field.lon", required: true },
    { key: "lat", labelKey: "dialog.csv.field.lat", required: true }
  ];

  function findCsvSourceForTarget(fields, target) {
    const aliases = csvColumnAliases[target] || [target];
    return fields.find(field => aliases.includes(normalizeHeader(field))) || "";
  }

  function renderCsvMappingDialog() {
    if (!pendingCsvMapping || !els.csvMapRows) return;
    const { fields, data } = pendingCsvMapping;
    if (els.csvMapFileMeta) {
      const rowCount = data.length;
      els.csvMapFileMeta.textContent = t("dialog.csv.fileMeta", {
        fileName: pendingCsvMapping.fileName,
        rows: rowCount,
        rowLabel: rowCount === 1 ? t("dialog.csv.rowSingular") : t("dialog.csv.rowPlural"),
        columns: fields.length,
        columnLabel: fields.length === 1 ? t("dialog.csv.columnSingular") : t("dialog.csv.columnPlural")
      });
    }
    els.csvMapRows.innerHTML = csvMapTargets.map(target => {
      const selected = pendingCsvMapping.mapping[target.key] || "";
      const sample = selected && data[0] ? data[0][selected] : "";
      const label = t(target.labelKey);
      return `<div class="csv-map-row" data-csv-target="${target.key}">
        <div class="csv-map-source"><strong>${escapeHtml(label)}</strong><span class="field-requirement ${target.required ? "is-required" : "is-optional"}">${escapeHtml(target.required ? t("dialog.csv.requiredTag") : t("dialog.csv.optionalTag"))}</span></div>
        <select aria-label="${escapeHtml(t("dialog.csv.columnFor", { label }))}"${target.key === "name" ? " data-dialog-initial-focus" : ""}><option value="">${escapeHtml(t("dialog.csv.notMapped"))}</option>${fields.map(field => `<option value="${escapeHtml(field)}"${field === selected ? " selected" : ""}>${escapeHtml(field)}</option>`).join("")}</select>
        <span class="csv-map-sample" title="${escapeHtml(String(sample || ""))}">${escapeHtml(String(sample || t("dialog.csv.noSample")))}</span>
      </div>`;
    }).join("");
    const missingRequired = csvMapTargets.some(target => target.required && !pendingCsvMapping.mapping[target.key]);
    if (els.confirmCsvMapBtn) els.confirmCsvMapBtn.disabled = missingRequired;
  }

  function openCsvMapping(results, file, options = {}) {
    const preset = projectIo.getSavedJson(localStorage, "plotypus.csvMapping");
    pendingCsvMapping = projectIo.createCsvMappingState({
      results,
      file,
      targets: csvMapTargets,
      savedMapping: preset,
      findSourceForTarget: findCsvSourceForTarget,
      defaultFileName: t("dialog.csv.selectedCsv")
    });
    renderCsvMappingDialog();
    if (options.open !== false) {
      openDialog(els.csvMapDialog, els.ribbonImportCsvBtn);
      const firstMapping = els.csvMapRows.querySelector('[data-csv-target="name"] select');
      if (firstMapping) firstMapping.focus();
    }
  }

  function parseCsvForMapping(file, firstRowHeaders = true, options = {}) {
    if (!window.Papa) return;
    Papa.parse(file, {
      header: firstRowHeaders,
      skipEmptyLines: true,
      complete: results => {
        if (firstRowHeaders) {
          openCsvMapping(results, file, options);
          return;
        }
        const arrays = Array.isArray(results.data) ? results.data : [];
        const width = arrays.reduce((maximum, row) => Math.max(maximum, Array.isArray(row) ? row.length : 0), 0);
        const fields = Array.from({ length: width }, (_, index) => t("dialog.csv.columnNumber", { number: index + 1 }));
        const data = arrays.map(row => Object.fromEntries(fields.map((field, index) => [field, row[index] || ""])));
        openCsvMapping({ data, errors: results.errors || [], meta: { fields } }, file, options);
      },
      error: err => setStatusMessage(t("status.csvGenericFailed", { message: translateErrorMessage(err) }), "danger")
    });
  }

  function confirmCsvMapping() {
    if (!pendingCsvMapping) return;
    const missing = projectIo.getMissingCsvTargets(pendingCsvMapping.mapping, csvMapTargets);
    if (missing.length) {
      setStatusMessage(t("status.csvRequiredFields", { fields: missing.map(item => item.label).join(", ") }), "danger");
      return;
    }
    const mappingToSave = { ...pendingCsvMapping.mapping };
    const data = projectIo.mapCsvRowsForImport(pendingCsvMapping, csvMapTargets);
    const fields = projectIo.getMappedCsvFields(pendingCsvMapping.mapping, csvMapTargets);
    const report = validateCsvImport({ data, errors: pendingCsvMapping.errors, meta: { fields } });
    if (els.csvSavePresetInput && els.csvSavePresetInput.checked) {
      projectIo.saveJson(localStorage, "plotypus.csvMapping", mappingToSave);
    }
    pendingCsvMapping = null;
    closeDialog(els.csvMapDialog);
    pushAppUndoHistory("CSV import");
    setRows(report.rows, report.messages);
    setActiveDataTab("projects");
  }

  function importCsv(file) {
    if (window.Papa) {
      if (els.csvFirstRowHeadersInput) els.csvFirstRowHeadersInput.checked = true;
      parseCsvForMapping(file, true);
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const report = validateCsvImport(parseCsvText(String(reader.result || "")));
        report.messages.unshift(t("status.papaParseFallback"));
        pendingCsvImport = { ...report, fileName: file && file.name ? file.name : t("dialog.csv.selectedCsv") };
        showCsvImportPreview(pendingCsvImport);
      } catch (error) {
        pendingCsvImport = null;
        hideCsvImportPreview();
        setStatusMessage(t("status.csvGenericFailed", { message: translateErrorMessage(error) }), "danger");
      }
    };
    reader.onerror = function () {
      pendingCsvImport = null;
      hideCsvImportPreview();
      setStatusMessage(t("status.csvReadFailed"), "danger");
    };
    reader.readAsText(file);
  }

  function validateCsvImport(results) {
    const messages = [];
    const sourceFields = results.meta && results.meta.fields ? results.meta.fields.filter(Boolean) : [];
    const fields = sourceFields.map(normalizeHeader);
    const hasColumn = aliases => aliases.some(alias => fields.includes(alias));

    if (!hasColumn(csvColumnAliases.name)) messages.push(t("status.csvMissingNameColumn"));
    if (!hasColumn(csvColumnAliases.type)) messages.push(t("status.csvMissingTypeColumn", { category: getCategoryLabel(getDefaultCategory().id, currentUiLanguage) }));
    if (!hasColumn(csvColumnAliases.lon)) messages.push(t("status.csvMissingLongitudeColumn"));
    if (!hasColumn(csvColumnAliases.lat)) messages.push(t("status.csvMissingLatitudeColumn"));

    (results.errors || []).forEach(error => {
      const rowNumber = Number.isFinite(error.row) ? error.row + 2 : "unknown";
      messages.push(t("status.csvRowError", { row: rowNumber, message: error.message }));
    });

    const rows = [];
    (results.data || []).forEach((rawRow, index) => {
      if (rawRow.__parsed_extra && rawRow.__parsed_extra.length) {
        messages.push(t("status.csvRowExtraValues", { row: index + 2 }));
      }

      const row = normalizeRow(rawRow);
      const hasLon = row.lon !== "";
      const hasLat = row.lat !== "";
      if (!row.name && !hasLon && !hasLat) return;
      if (row.footnote && !getRenderableFootnote(row.footnote)) {
        messages.push(t("status.csvRowFootnote", { row: index + 2 }));
      }
      if (!row.name && hasLon && hasLat) messages.push(t("status.csvRowBlankName", { row: index + 2 }));
      if (hasLon !== hasLat) {
        messages.push(t("status.csvRowOneCoordinate", { row: index + 2 }));
      }
      if (hasLon && (row.lon < -180 || row.lon > 180)) messages.push(t("status.csvRowLongitudeRange", { row: index + 2 }));
      if (hasLat && (row.lat < -90 || row.lat > 90)) messages.push(t("status.csvRowLatitudeRange", { row: index + 2 }));
      if (hasLon && hasLat && row.lon > -40 && row.lat < -40) {
        messages.push(t("status.csvRowSwappedCoordinates", { row: index + 2 }));
      }

      rows.push(row);
    });

    return { rows, messages, fields: sourceFields };
  }

  function initEvents() {
    on(els.ribbonLoadSampleBtn, "click", () => {
      pushAppUndoHistory("load sample data");
      setRows(sampleRows);
      setDocumentPropertiesContext();
    });
    on(els.ribbonUndoBtn, "click", undoLastManualLayoutChange);
    on(els.ribbonOpenProjectBtn, "click", () => els.projectInput.click());
    on(els.ribbonSaveProjectBtn, "click", saveProject);
    on(els.ribbonImportCsvBtn, "click", () => els.csvInput.click());
    on(els.projectImportCsvBtn, "click", () => els.csvInput.click());
    on(els.ribbonExportCsvBtn, "click", exportCsv);
    on(els.exportMenuBtn, "click", () => setExportMenuOpen(els.exportMenu.hidden));
    on(els.exportMenuBtn, "keydown", handleExportMenuKeydown);
    on(els.exportMenu, "keydown", handleExportMenuKeydown);
    on(els.ribbonExportSvgBtn, "click", () => {
      setExportMenuOpen(false);
      exportSvg();
    });
    on(els.ribbonExportPngBtn, "click", () => {
      setExportMenuOpen(false);
      exportPng();
    });
    on(els.previewEmptyState, "click", handlePreviewStateAction);
    on(els.previewErrorState, "click", handlePreviewStateAction);
    on(els.projectTableEmptyState, "click", handleEmptyStateAction);
    on(els.canvasZoomOutBtn, "click", () => adjustCanvasZoom(-5));
    on(els.canvasZoomInBtn, "click", () => adjustCanvasZoom(5));
    on(els.canvasAutoPlaceBtn, "click", autoPlaceLabels);
    on(els.canvasPlaceLabelsOnlyBtn, "click", autoPlaceLabelsWithoutResize);
    on(els.closeShortcutsBtn, "click", closeShortcutsOverlay);
    on(els.shortcutsOverlay, "click", event => {
      if (event.target === els.shortcutsOverlay) closeShortcutsOverlay();
    });
    on(els.addRowBtn, "click", () => {
      pushAppUndoHistory("add project row");
      setProjectFilter("all");
      const tr = addRow();
      tr.classList.add("is-new");
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      tr.querySelector(".name-input").focus();
      window.setTimeout(() => tr.classList.remove("is-new"), 120);
    });
    on(els.addPointsBtn, "click", showPointCatalog);
    document.querySelectorAll("[data-authoring-language]").forEach(button => {
      on(button, "click", () => setAuthoringLanguage(button.dataset.authoringLanguage));
    });
    on(els.clearRowsBtn, "click", confirmClearProjectRows);
    on(els.deleteSelectedBtn, "click", () => {
      const selectedRows = getProjectRowsSelectedForDelete();
      if (!selectedRows.length) {
        setStatusMessage(t("status.selectRowsBeforeDelete"), "warning");
        return;
      }

      const label = selectedRows.length === 1 ? t("status.selectedRowSingular") : t("status.selectedRowPlural");
      if (!window.confirm(t("status.deleteSelectedRowsConfirm", { count: selectedRows.length, label }))) {
        setStatusMessage(t("status.deleteCancelled"), "warning");
        return;
      }

      pushAppUndoHistory("delete project rows");
      selectedRows.forEach(tr => tr.classList.add("is-deleting"));
      els.deleteSelectedBtn.disabled = true;
      window.setTimeout(() => {
        selectedRows.forEach(tr => tr.remove());
        clearProjectCellSelection();
        updateDeleteButtonState();
        refreshProjectTableUx();
        requestPreviewRefresh();
      }, 260);
    });
    on(els.projectTableTab, "click", () => setActiveDataTab("projects"));
    on(els.categoriesTableTab, "click", () => setActiveDataTab("categories"));
    on(els.regionTableTab, "click", () => setActiveDataTab("regions"));
    on(els.translateTableTab, "click", () => setActiveDataTab("translate"));
    on(els.previewTableTab, "click", () => setActiveDataTab("preview"));
    on(els.qualityTableTab, "click", () => setActiveDataTab("quality"));
    getDataTabs().forEach(item => on(item.tab, "keydown", handleDataTabKeydown));
    on(els.applyRegionValueColoursBtn, "click", () => {
      pushAppUndoHistory("apply region colours");
      applyRegionColoursByValue();
      setStatusMessage(t("status.regionColoursApplied"), "ok");
    });
    on(els.resetRegionValuesBtn, "click", () => {
      pushAppUndoHistory("reset region values");
      resetRegionValues();
    });
    on(els.csvInput, "change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) importCsv(file);
      e.target.value = "";
    });
    on(els.projectInput, "change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) loadProject(file);
      e.target.value = "";
    });
    on(els.statusBox, "click", handleStatusAction);
    on(els.csvImportPreview, "click", handleStatusAction);
    on(els.workspaceSummaryMetrics, "click", handleWorkspaceSummaryClick);
    on(els.mapDetailsBtn, "click", openMapDetailsDialog);
    on(els.propertiesToggleBtn, "click", togglePropertiesPanel);
    on(els.propertiesCollapseBtn, "click", togglePropertiesPanel);
    on(els.propertiesResizeHandle, "pointerdown", handlePropertiesResizeStart);
    on(els.propertiesResizeHandle, "keydown", handlePropertiesResizeKeydown);
    if (typeof propertiesDrawerMedia.addEventListener === "function") {
      propertiesDrawerMedia.addEventListener("change", syncResponsivePropertiesState);
    } else {
      propertiesDrawerMedia.addListener(syncResponsivePropertiesState);
    }
    on(els.mapDetailsForm, "submit", saveMapDetails);
    on(els.mapDetailsForm, "input", updateMapDetailsDraftState);
    on(els.confirmCsvMapBtn, "click", confirmCsvMapping);
    on(els.csvFirstRowHeadersInput, "change", () => {
      if (pendingCsvMapping && pendingCsvMapping.file) {
        parseCsvForMapping(pendingCsvMapping.file, els.csvFirstRowHeadersInput.checked, { open: false });
      }
    });
    on(els.csvMapRows, "change", event => {
      const row = event.target.closest("[data-csv-target]");
      if (!row || !pendingCsvMapping) return;
      pendingCsvMapping.mapping[row.dataset.csvTarget] = event.target.value;
      renderCsvMappingDialog();
    });
    document.querySelectorAll("[data-dialog-close]").forEach(control => {
      on(control, "click", () => {
        const key = control.dataset.dialogClose;
        closeDialog(key === "map-details" ? els.mapDetailsDialog : key === "point-catalog" ? els.pointCatalogDialog : els.csvMapDialog);
        if (key === "map-details") {
          unmountReactMapDetailsDialog();
          updateMapDetailsState();
        }
      });
    });
    on(els.pointCatalogDialog, "click", event => {
      const viewTab = event.target.closest("[data-catalog-view]");
      if (viewTab) {
        setPointCatalogView(viewTab.dataset.catalogView);
        viewTab.focus();
        return;
      }
      if (event.target.closest("#catalogAddPointsBtn")) {
        addSelectedPointCatalogPresets();
        return;
      }
      const preset = event.target.closest("[data-catalog-preset]");
      if (!preset) return;
      togglePointCatalogPreset(preset.dataset.catalogPreset);
    });
    els.pointCatalogTabs.forEach(tab => on(tab, "keydown", event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextView = event.key === 'ArrowRight' || event.key === 'End' ? 'sources' : 'presets';
      setPointCatalogView(nextView);
      const nextTab = els.pointCatalogTabs.find(item => item.dataset.catalogView === nextView);
      if (nextTab) nextTab.focus();
    }));
    on(els.catalogImportCsvBtn, "click", () => {
      closeDialog(els.pointCatalogDialog);
      setActiveDataTab("projects");
      els.csvInput.click();
    });
    on(els.propertiesSelectionControls, "change", handlePropertiesControlsChange);
    on(els.propertiesSelectionControls, "focusin", event => primeInputUndo(event.target, "properties edit"));
    on(els.propertiesSelectionControls, "focusout", event => clearInputUndoCapture(event.target));
    on(els.propertiesSelectionControls, "click", handlePropertiesControlsClick);
    on(els.qualityMetricsPanel, "click", handlePropertiesControlsClick);
    on(els.qualitySummaryBanner, "click", handlePropertiesControlsClick);
    on(els.canvasQualityPill, "click", handlePropertiesControlsClick);
    els.translationFilters.forEach(button => {
      on(button, "click", () => setTranslationFilter(button.dataset.translationFilter));
    });
    document.querySelectorAll("[data-translation-direction]").forEach(button => {
      on(button, "click", () => setAuthoringLanguage(button.dataset.translationDirection === "fr-en" ? "fr" : "en"));
    });
    on(els.translationGroups, "click", handleTranslationSelection);
    on(els.translationGroups, "focusin", handleTranslationSelection);
    on(els.translationGroups, "focusin", event => primeInputUndo(event.target, "translation edit"));
    on(els.translationGroups, "input", handleTranslationInput);
    on(els.translationGroups, "focusout", event => clearInputUndoCapture(event.target));
    on(els.translationGroups, "keydown", handleTranslationKeydown);
    on(els.translationGroups, "paste", handleTranslationPaste);
    on(els.pasteTranslationColumnBtn, "click", pasteTranslationColumnFromClipboard);
    [els.mapLanguageInput, els.previewLanguageInput].forEach(input => {
      on(input, "change", event => setMapLanguage(event.target.value));
    });
    els.uiLanguageButtons.forEach(button => {
      on(button, "click", () => applyUiLanguage(button.dataset.uiLanguage));
    });
    els.projectTableFilters.forEach(button => {
      on(button, "click", () => setProjectFilter(button.dataset.projectFilter));
    });
    on(els.projectFilterSelect, "change", event => setProjectFilter(event.target.value));
    on(els.projectTable, "paste", pasteIntoTable);
    on(els.projectTable, "click", handleCoordinateCellClear);
    on(els.projectTable, "pointerdown", handleProjectCellSelection);
    on(els.projectTable, "click", handleProjectCellSelection);
    on(els.projectTable, "focusin", handleProjectCellSelection);
    on(els.projectTable, "keydown", handleProjectTableKeydown);
    on(els.bulkPriorityInput, "change", event => {
      if (event.target.value !== "") applyBulkPriority(event.target.value);
      event.target.value = "";
    });
    on(els.bulkClearCoordinatesBtn, "click", clearSelectedCoordinateCells);
    document.addEventListener("keydown", handleGlobalKeyboardShortcuts);
    document.addEventListener("keydown", event => {
      const openDialogElement = [els.csvMapDialog, els.pointCatalogDialog, els.mapDetailsDialog].find(dialog => dialog && !dialog.hidden);
      if (!openDialogElement) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(openDialogElement);
        if (openDialogElement === els.mapDetailsDialog) {
          unmountReactMapDetailsDialog();
          updateMapDetailsState();
        }
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(openDialogElement.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    document.addEventListener("click", event => {
      if (els.exportMenu && !els.exportMenu.hidden && !event.target.closest(".export-menu-wrap")) {
        setExportMenuOpen(false);
      }
      if (mapScaleControlsVisible && els.mapHost && !els.mapHost.contains(event.target)) {
        hideMapScaleControls();
      }
    });
    [
      els.bookSizeInput,
      els.imageSizeInput,
      els.labelSizeInput,
      els.mapScaleInput,
      els.markerSizeInput,
      els.lineWidthInput,
      els.labelCharsInput,
      els.fontFamilyInput,
      els.showLegendInput,
      els.showCalloutsInput,
      els.compactFurnitureInput,
      els.showLineCasingInput,
      els.routeDenseLeadersInput,
      els.showDistanceMarkersInput,
      els.lockMarkerCoordinatesInput
    ].forEach(el => on(el, "change", handleLayoutSettingsChange));
    on(els.addCategoryBtn, "click", addCategory);
    on(els.categoryList, "change", handleCategorySettingsChange);
    on(els.categoryList, "input", handleCategorySettingsChange);
    on(els.categoryList, "focusin", event => primeInputUndo(event.target, "category edit"));
    on(els.categoryList, "focusout", event => clearInputUndoCapture(event.target));
    on(els.categoryList, "click", event => {
      const editor = event.target.closest(".category-editor");
      if (editor) {
        activeCategoryId = editor.dataset.categoryId;
        els.categoryList.querySelectorAll(".category-editor").forEach(item => item.classList.toggle("is-selected", item === editor));
        if (activeDataTable === "categories") setCategoryPropertiesContext();
      }
      const removeButton = event.target.closest(".remove-category-btn");
      if (removeButton) removeCategory(removeButton.dataset.categoryId);

      const toggleButton = event.target.closest(".toggle-category-btn");
      if (toggleButton) toggleCategory(toggleButton.dataset.categoryId);
    });
    on(els.categoryList, "keydown", event => {
      const editor = event.target.closest(".category-editor");
      if (!editor || event.target !== editor || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      editor.click();
    });
    on(els.categoryList, "dragstart", handleCategoryDragStart);
    on(els.categoryList, "dragover", handleCategoryDragOver);
    on(els.categoryList, "drop", handleCategoryDrop);
    on(els.categoryList, "dragend", handleCategoryDragEnd);
    on(els.regionTableBody, "change", event => {
      if (event.target.classList.contains("region-table-included-input")) {
        pushAppUndoHistory("region edit");
        clearActiveRegionPreset();
        regionVisibility[event.target.dataset.regionId] = event.target.checked;
        applyRegionColoursByValue(false, { refreshRowsOnly: true });
        scheduleRender();
        return;
      }

      if (event.target.classList.contains("region-value-input")) {
        captureInputUndo(event.target, "region edit");
        const value = normalizeRegionValue(event.target.value);
        if (value === "") {
          delete regionValues[event.target.dataset.regionId];
        } else {
          regionValues[event.target.dataset.regionId] = value;
        }
        applyRegionColoursByValue(true, { refreshRowsOnly: true });
        return;
      }

      if (event.target.classList.contains("region-colour-input")) {
        captureInputUndo(event.target, "region edit");
        regionColourOverrides[event.target.dataset.regionId] = true;
        regionFills[event.target.dataset.regionId] = event.target.value;
        refreshRegionValueTableRow(getRegionTableRows().find(region => region.id === event.target.dataset.regionId));
        scheduleRender();
        return;
      }

      if (event.target.classList.contains("region-colour-set-input")) {
        pushAppUndoHistory("region edit");
        if (event.target.value) {
          regionColourOverrides[event.target.dataset.regionId] = true;
          regionFills[event.target.dataset.regionId] = event.target.value;
          refreshRegionValueTableRow(getRegionTableRows().find(region => region.id === event.target.dataset.regionId));
          scheduleRender();
          return;
        }
        delete regionColourOverrides[event.target.dataset.regionId];
        applyRegionColoursByValue(true, { refreshRowsOnly: true });
        return;
      }
    });
    on(els.regionTableBody, "click", event => {
      const row = event.target.closest("tr[data-region-id]");
      if (row && activeDataTable === "regions") renderPropertiesForActiveState({ kind: "region", id: row.dataset.regionId });
    });
    on(els.regionTableBody, "focusin", event => primeInputUndo(event.target, "region edit"));
    on(els.regionTableBody, "focusout", event => clearInputUndoCapture(event.target));
    on(els.regionTableBody, "keydown", event => {
      const row = event.target.closest("tr[data-region-id]");
      if (!row || event.target !== row || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      row.click();
    });
    on(els.mapStylePresetInput, "change", () => {
      pushAppUndoHistory("map style change");
      applySelectedMapStyle();
    });
    on(els.boundaryInput, "change", () => {
      pushAppUndoHistory("boundary change");
      changeBoundary(els.boundaryInput.value);
    });
    on(els.regionPresetInput, "change", () => {
      pushAppUndoHistory("region preset");
      applySelectedRegionPreset();
    });
    on(els.selectAllRegionsBtn, "click", () => {
      pushAppUndoHistory("include all regions");
      setAllRegions(true);
    });
    on(els.clearRegionsBtn, "click", () => {
      pushAppUndoHistory("clear regions");
      setAllRegions(false);
    });
    on(els.selectProjectRegionsBtn, "click", () => {
      pushAppUndoHistory("select project regions");
      selectRegionsWithProjectPoints();
    });
    on(els.resetRegionColoursBtn, "click", () => {
      pushAppUndoHistory("reset region colours");
      resetRegionColours();
    });
  }

  async function loadGeo() {
    const source = boundarySources[currentBoundary] || boundarySources.canada;
    try {
      canadaGeo = normalizeBoundaryGeoJson(await fetchGeoJsonWithFallback(source), source);
      initializeRegionVisibility();
      applyRegionColoursByValue(false);
      renderRegionControls();
    } catch (error) {
      canadaGeo = null;
      renderRegionControls();
      console.warn(`Could not load ${source.label} GeoJSON`, error);
    }
  }

  function normalizeBoundaryGeoJson(geo, source) {
    if (!geo || source.projection !== "canada") return geo;
    return rewindGeoJsonForD3(geo);
  }

  function rewindGeoJsonForD3(geo) {
    return {
      ...geo,
      features: Array.isArray(geo.features)
        ? geo.features.map(feature => ({
          ...feature,
          geometry: rewindGeometryForD3(feature.geometry)
        }))
        : geo.features
    };
  }

  function rewindGeometryForD3(geometry) {
    if (!geometry || !geometry.coordinates) return geometry;
    if (geometry.type === "Polygon") {
      return {
        ...geometry,
        coordinates: rewindPolygonForD3(geometry.coordinates)
      };
    }
    if (geometry.type === "MultiPolygon") {
      return {
        ...geometry,
        coordinates: geometry.coordinates.map(rewindPolygonForD3)
      };
    }
    return geometry;
  }

  function rewindPolygonForD3(rings) {
    return rings.map((ring, index) => {
      const area = planarRingArea(ring);
      const shouldReverseExterior = index === 0 && area > 0;
      const shouldReverseHole = index > 0 && area < 0;
      return shouldReverseExterior || shouldReverseHole ? ring.slice().reverse() : ring.slice();
    });
  }

  function planarRingArea(ring) {
    if (!Array.isArray(ring) || ring.length < 4) return 0;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i += 1) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return area / 2;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
    return response.json();
  }

  async function fetchGeoJsonWithFallback(source) {
    const localBoundary = getLocalBoundary(source);
    if (localBoundary && !source.preferRemote) {
      return localBoundary;
    }

    try {
      return await fetchJson(source.url);
    } catch (onlineError) {
      console.warn(`Could not load online ${source.label} GeoJSON. Trying local fallback.`, onlineError);
      if (localBoundary) return localBoundary;
      return fetchJson(source.fallbackUrl);
    }
  }

  function getLocalBoundary(source) {
    if (!window.PLOTYPUS_LOCAL_BOUNDARIES || !source || !source.fallbackKey) return null;
    return window.PLOTYPUS_LOCAL_BOUNDARIES[source.fallbackKey] || null;
  }

  async function init() {
    renderRibbonIcons();
    initEvents();
    initializePropertiesPanelState();
    updateMapDetailsState();
    els.boundaryInput.value = currentBoundary;
    renderBookSizeOptions();
    renderFontOptions();
    if (!applySavedLayoutPreferences()) renderImageSizeOptions();
    syncCompactFurnitureAvailability();
    renderRegionPresetOptions();
    renderMapStyleOptions();
    renderCategoryEditors();
    setRows([], [], { render: false, resetProperties: false });
    applyUiLanguage(getSavedUiLanguagePreference(), { persist: false, renderMap: false });
    await mountReactProjectToolbar();
    await mountReactPropertiesPanel();
    updateUndoButtonState();
    await loadGeo();
    render();
    setActiveDataTab("preview");
  }

  function createTestApi() {
    return {
      rectsOverlap,
      rectOverlapArea,
      segmentsCross,
      pointInRect,
      segmentIntersectsRect,
      lineEnd,
      leaderPathPoints,
      makeLabelPlacement,
      createCandidateForSide,
      createLabelCandidates,
      createPerimeterCandidateMap,
      createPerimeterCapacity,
      assessPerimeterFeasibility,
      scoreCandidate,
      countSideOrderInversions,
      createOrderPreservingVerticalSlots,
      createOrderPreservingHorizontalSlots,
      optimizeOrderedSideBands,
      applyManualLabelPositions,
      validateAndNormalizeProject,
      switchActiveLanguageLayout,
      serializeLanguageLayouts,
      setManualLabelPositions(value) {
        setCurrentManualLabelPositions(value);
      },
      setManualBoxPositions(value) {
        setCurrentManualBoxPositions(value);
      },
      getCurrentMapLanguage() {
        return currentMapLanguage;
      },
      getManualLabelPositions() {
        return { ...manualLabelPositions };
      },
      getManualBoxPositions() {
        return { ...manualBoxPositions };
      }
    };
  }

  if (window.PLOTYPUS_TEST_MODE) {
    window.PLOTYPUS_TEST_API = createTestApi();
    return;
  }

  init();
})();
