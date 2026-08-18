(async function () {
  const appConfig = window.PLOTYPUS_TEST_MODE
    ? (window.PLOTYPUS_CONFIG || {})
    : await (window.PLOTYPUS_CONFIG_READY || Promise.resolve(window.PLOTYPUS_CONFIG || {}));
  const cloneConfigList = (items) => Array.isArray(items) ? items.map((item) => ({ ...item })) : [];
  const defaultFontFamily = appConfig.defaultFontFamily || "Lato, Segoe UI, Arial, sans-serif";
  const startupI18n = window.PLOTYPUS_I18N;
  const labelTextMeasureCache = new Map();
  let labelTextMeasureContext = null;

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
      mapSvg.classList.add("map-font-lato");
      mapSvg.innerHTML = `<rect class="map-startup-error-background" width="900" height="360"></rect><text class="map-startup-error-title map-type-size-22" x="450" y="180" text-anchor="middle">${message}</text>`;
    }
    return;
  }

  if (!window.PLOTYPUS_GEOMETRY) {
    const message = startupT("startup.error.module", { module: "geometry.js" });
    const statusBox = document.querySelector("#statusBox");
    if (statusBox) statusBox.innerHTML = `<div class="status-danger">${message}</div>`;
    return;
  }

  if (!window.PLOTYPUS_MARKER_COLOUR) {
    const message = startupT("startup.error.module", { module: "marker-colour.js" });
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

  if (!window.PLOTYPUS_REGION_MATCHING) {
    const message = startupT("startup.error.module", { module: "region-matching.js" });
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

  if (!window.PLOTYPUS_FEEDBACK) {
    const message = startupT("startup.error.module", { module: "feedback.js" });
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
  const markerColour = window.PLOTYPUS_MARKER_COLOUR;
  const projectIo = window.PLOTYPUS_PROJECT_IO;
  const workspace = window.PLOTYPUS_WORKSPACE;
  const regionMatching = window.PLOTYPUS_REGION_MATCHING;
  const properties = window.PLOTYPUS_PROPERTIES;
  const feedback = window.PLOTYPUS_FEEDBACK;
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
    solveConflictFreeLayout,
    sameLabelPlacement,
    weights: labelPlacementWeights
  } = labelLayoutPolicies;

  const fallbackRegionColours = ["#b4d6c9", "#88b6a5", "#57a588", "#088b70"];
  const customMarkerIconRules = Object.freeze({
    maxBytes: 256 * 1024,
    minDimension: 8,
    maxDimension: 512,
    allowedTypes: new Set(["image/png", "image/webp"])
  });
  const richLabelImageRules = Object.freeze({
    maxBytes: 1024 * 1024,
    minDimension: 1,
    maxDimension: 2048,
    allowedTypes: new Set(["image/png", "image/jpeg", "image/webp"])
  });
  const richLabelImageDisplayRules = Object.freeze({
    defaultSize: 72,
    minSize: 24,
    maxSize: 300,
    fallbackWidth: 4,
    fallbackHeight: 3
  });
  const boundarySources = appConfig.boundarySources || {};
  const sampleRows = cloneConfigList(appConfig.sampleRows);
  const sampleMapDetails = clonePlainObject(appConfig.sampleMapDetails);
  const sampleRegionFills = clonePlainObject(appConfig.sampleRegionFills);
  const mapStylePresets = appConfig.mapStylePresets || window.MAP_APP_STYLE_PRESETS || appConfig.fallbackMapStylePresets || {
    "goc-green": {
      label: "GoC green",
      stylesheet: "themes/goc-green.css",
      regionColours: fallbackRegionColours,
      categoryStyles: [
        { colour: "#444444", stroke: "#ffffff", markerSize: 4, lineWidth: 2 },
        { colour: "#ffffff", stroke: "#555555", markerSize: 4, lineWidth: 2 }
      ]
    }
  };
  const propertiesDrawerMedia = typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 1080px)")
    : { matches: false, addEventListener() {}, addListener() {} };
  const defaultCsvColumnAliases = {
    name: ["name", "project", "project name", "english name", "nom anglais", "nom du projet anglais"],
    nameFr: ["name_fr", "nom", "nom du projet", "french name", "fr name", "project fr", "project name fr", "nom_fr"],
    footnote: ["footnote", "footnote marker", "note", "superscript"],
    type: ["type", "category", "project type", "categorie", "catégorie", "type de projet"],
    typeFr: ["type_fr", "type fr", "categorie", "catégorie", "categorie francaise", "catégorie française", "category fr", "french type", "type francais", "type français"],
    lon: ["lon", "longitude", "long"],
    lat: ["lat", "latitude"],
    city: ["city", "city name", "ville", "nom de ville", "municipality", "municipalité", "location city", "ville de localisation"],
    region: ["region", "région", "province", "territory", "territoire", "province territory", "province/territory", "province territoire", "province/territoire", "state", "jurisdiction"],
    hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line", "masquer le trait", "masquer le trait de renvoi", "sans trait", "sans trait de renvoi"]
  };
  const csvColumnAliases = {
    ...defaultCsvColumnAliases,
    ...(appConfig.csvColumnAliases || {})
  };  const translationColumnAliases = appConfig.translationColumnAliases || {
    rowId: ["row id", "rowid", "id", "project id", "plotypus id", "translation id"],
    name: ["name", "project", "project name", "english", "english project name", "source", "source text", "en"],
    nameFr: ["name_fr", "nom", "nom du projet", "french", "french name", "fr name", "project fr", "project name fr", "french project name", "translation", "fr"]
  };
  const tableFields = (appConfig.tableFields || ["name", "footnote", "type", "lon", "lat"])
    .filter(field => field !== "priority");
  const layoutDefaults = appConfig.layoutDefaults || {
    bookSizeInput: "letter",
    imageSizeInput: "two-thirds",
    labelSizeInput: 12,
    mapScaleInput: 100,
    markerSizeInput: 4,
    lineWidthInput: 2,
    leaderColourInput: "#333333",
    labelCharsInput: 24
  };
  const mapScaleRange = Object.freeze({ min: 45, max: 115 });
  const canvasViewZoomLevels = Object.freeze([25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200]);
  const defaultCanvasViewZoom = 125;
  const projectCoordinateFractionDigits = 2;
  const storageKeys = appConfig.storageKeys || {};
  const layoutPreferencesStorageKey = storageKeys.layoutPreferences || "plotypus.layoutPreferences";
  const propertiesPanelStorageKey = storageKeys.propertiesPanel || "plotypus.propertiesPanel";
  const uiLanguageStorageKey = storageKeys.uiLanguage || "plotypus.uiLanguage";
  const canvasViewZoomStorageKey = storageKeys.canvasViewZoom || "plotypus.canvasViewZoom";
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
      markerSize: 4,
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
      markerSize: 4,
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
  const categoryIconValidationErrors = new Map();

  const els = {
    tableBody: document.querySelector("#projectTable tbody"),
    projectTable: document.querySelector("#projectTable"),
    projectTableSummary: document.querySelector("#projectTableSummary"),
    projectTableEmptyState: document.querySelector("#projectTableEmptyState"),
    projectSearchControl: document.querySelector("#projectSearchControl"),
    projectSearchInput: document.querySelector("#projectSearchInput"),
    projectFilterControl: document.querySelector("#projectFilterControl"),
    projectLocationModeButtons: Array.from(document.querySelectorAll("[data-project-location-mode]")),
    projectFilterSelect: document.querySelector("#projectFilterSelect"),
    csvImportPreview: document.querySelector("#csvImportPreview"),
    regionTableBody: document.querySelector("#regionTable tbody"),
    regionStatusVisibilityAllInput: document.querySelector("#regionStatusVisibilityAllInput"),
    regionStatusVisibilityOptions: document.querySelector("#regionStatusVisibilityOptions"),
    tablePanelTitle: document.querySelector("#tablePanelTitle"),
    projectTableTab: document.querySelector("#projectTableTab"),
    regionTableTab: document.querySelector("#regionTableTab"),
    translateTableTab: document.querySelector("#translateTableTab"),
    previewTableTab: document.querySelector("#previewTableTab"),
    qualityTableTab: document.querySelector("#qualityTableTab"),
    projectTablePane: document.querySelector("#projectTablePane"),
    regionTablePane: document.querySelector("#regionTablePane"),
    baselayerReferenceCitiesField: document.querySelector("#referenceCitiesBaselayerField"),
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
    translationPasteHint: document.querySelector("#translationPasteHint"),
    translationFilters: Array.from(document.querySelectorAll("[data-translation-filter]")),
    pasteTranslationColumnBtn: document.querySelector("#pasteTranslationColumnBtn"),
    importTranslationsBtn: document.querySelector("#importTranslationsBtn"),
    propertiesTitle: document.querySelector("#propertiesTitle"),
    propertiesSubtitle: document.querySelector("#propertiesSubtitle"),
    propertiesPanel: document.querySelector("#propertiesPanel"),
    propertiesCollapseBtn: document.querySelector("#propertiesCollapseBtn"),
    propertiesResizeHandle: document.querySelector("#propertiesResizeHandle"),
    propertiesSideInputs: Array.from(document.querySelectorAll("[data-properties-side-input]")),
    propertiesIcon: document.querySelector("#propertiesIcon"),
    previewDisplayPropertiesSection: document.querySelector("#previewDisplayPropertiesSection"),
    previewInteractionPropertiesSection: document.querySelector("#previewInteractionPropertiesSection"),
    legendPropertiesSection: document.querySelector("#legendPropertiesSection"),
    propertiesDescription: document.querySelector("#propertiesDescription"),
    propertiesSelectionControls: document.querySelector("#propertiesSelectionControls"),
    applyRegionValueColoursBtn: document.querySelector("#applyRegionValueColoursBtn"),
    resetRegionValuesBtn: document.querySelector("#resetRegionValuesBtn"),
    themeStylesheet: document.querySelector("#themeStylesheet"),
    csvInput: document.querySelector("#csvInput"),
    translationImportInput: document.querySelector("#translationImportInput"),
    projectInput: document.querySelector("#projectInput"),
    ribbonUndoBtn: document.querySelector("#ribbonUndoBtn"),
    ribbonOpenProjectBtn: document.querySelector("#ribbonOpenProjectBtn"),
    ribbonSaveProjectBtn: document.querySelector("#ribbonSaveProjectBtn"),
    projectSaveState: document.querySelector("#projectSaveState"),
    ribbonLoadSampleBtn: document.querySelector("#ribbonLoadSampleBtn"),
    ribbonImportCsvBtn: document.querySelector("#ribbonImportCsvBtn"),
    ribbonExportCsvBtn: document.querySelector("#ribbonExportCsvBtn"),
    exportMenuBtn: document.querySelector("#exportMenuBtn"),
    exportMenu: document.querySelector("#exportMenu"),
    feedbackBtn: document.querySelector("#feedbackBtn"),
    applicationSettingsBtn: document.querySelector("#applicationSettingsBtn"),
    applicationSettingsMenu: document.querySelector("#applicationSettingsMenu"),
    applicationSettingsCloseBtn: document.querySelector("#applicationSettingsCloseBtn"),
    ribbonExportSvgBtn: document.querySelector("#ribbonExportSvgBtn"),
    ribbonExportPngBtn: document.querySelector("#ribbonExportPngBtn"),
    exportLanguageNotice: document.querySelector("#exportLanguageNotice"),
    projectAddMenuBtn: document.querySelector("#projectAddMenuBtn"),
    projectAddMenu: document.querySelector("#projectAddMenu"),
    projectMoreMenuBtn: document.querySelector("#projectMoreMenuBtn"),
    projectMoreMenu: document.querySelector("#projectMoreMenu"),
    addProjectTypeBtn: document.querySelector("#addProjectTypeBtn"),
    addRowBtn: document.querySelector("#addRowBtn"),
    addPointsBtn: document.querySelector("#addPointsBtn"),
    projectSelectionActions: document.querySelector("#projectSelectionActions"),
    bulkClearCoordinatesBtn: document.querySelector("#bulkClearCoordinatesBtn"),
    deleteSelectedBtn: document.querySelector("#deleteSelectedBtn"),
    clearRowsBtn: document.querySelector("#clearRowsBtn"),
    bookSizeInput: document.querySelector("#bookSizeInput"),
    imageSizeInput: document.querySelector("#imageSizeInput"),
    mapHost: document.querySelector("#mapHost"),
    previewEmptyState: document.querySelector("#previewEmptyState"),
    previewErrorState: document.querySelector("#previewErrorState"),
    documentPagePreview: document.querySelector("#documentPagePreview"),
    documentCanvasSlot: document.querySelector("#documentCanvasSlot"),
    canvasPlaceholder: document.querySelector("#canvasPlaceholder"),
    canvasEmptyActions: document.querySelector("#canvasEmptyActions"),
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
    leaderColourInput: document.querySelector("#leaderColourInput"),
    hideLeaderLinesInput: document.querySelector("#hideLeaderLinesInput"),
    labelCharsInput: document.querySelector("#labelCharsInput"),
    fontFamilyInput: document.querySelector("#fontFamilyInput"),
    mapLanguageInput: document.querySelector("#mapLanguageInput"),
    previewLanguageInput: document.querySelector("#previewLanguageInput"),
    mapLanguageButtons: Array.from(document.querySelectorAll("[data-map-language]")),
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
    propertiesToggleBtn: document.querySelector("#propertiesToggleBtn"),
    feedbackDialog: document.querySelector("#feedbackDialog"),
    feedbackForm: document.querySelector("#feedbackForm"),
    feedbackTypeInputs: Array.from(document.querySelectorAll("[name='feedback-type']")),
    feedbackTitle: document.querySelector("#feedbackTitle"),
    feedbackDetails: document.querySelector("#feedbackDetails"),
    feedbackDetailsLabel: document.querySelector("#feedbackDetailsLabel"),
    githubIssueLink: document.querySelector("#githubIssueLink"),
    feedbackEmailLink: document.querySelector("#feedbackEmailLink"),
    startupDialog: document.querySelector("#startupDialog"),
    startupStartScreen: document.querySelector("#startupStartScreen"),
    startupStartNewBtn: document.querySelector("#startupStartNewBtn"),
    startupSetupForm: document.querySelector("#startupSetupForm"),
    startupReferenceCitiesField: document.querySelector("#referenceCitiesField"),
    startupBaselayerOptions: Array.from(document.querySelectorAll("[data-startup-baselayer]")),
    startupMapStyleInput: document.querySelector("#startupMapStyleInput"),
    startupBookSizeInput: document.querySelector("#startupBookSizeInput"),
    startupImageSizeInput: document.querySelector("#startupImageSizeInput"),
    startupLabelCharsInput: document.querySelector("#startupLabelCharsInput"),
    startupCreateMapBtn: document.querySelector("#startupCreateMapBtn"),
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
    projectCitiesField: document.querySelector("#projectCitiesField"),
    catalogAddPointsBtn: document.querySelector("#catalogAddPointsBtn"),
    catalogImportCsvBtn: document.querySelector("#catalogImportCsvBtn"),
    csvMapDialog: document.querySelector("#csvMapDialog"),
    csvMapTitle: document.querySelector("#csvMapTitle"),
    csvMapGuidance: document.querySelector("#csvMapGuidance"),
    csvMapRequired: document.querySelector("#csvMapRequired"),
    csvMapFileMeta: document.querySelector("#csvMapFileMeta"),
    csvMapRows: document.querySelector("#csvMapRows"),
    csvFirstRowHeadersInput: document.querySelector("#csvFirstRowHeadersInput"),
    csvLocationModeSection: document.querySelector("#csvLocationModeSection"),
    csvLocationModeHint: document.querySelector("#csvLocationModeHint"),
    csvLocationModeButtons: Array.from(document.querySelectorAll("[data-csv-location-mode]")),
    csvSavePresetInput: document.querySelector("#csvSavePresetInput"),
    importComposerPanel: document.querySelector("#importComposerPanel"),
    csvRichLabelEnabled: document.querySelector("#csvRichLabelEnabled"),
    csvRichLabelComposer: document.querySelector("#csvRichLabelComposer"),
    csvLabelElements: document.querySelector("#csvLabelElements"),
    csvAddLabelElementBtn: document.querySelector("#csvAddLabelElementBtn"),
    csvRichLabelPreview: document.querySelector("#csvRichLabelPreview"),
    csvRichLabelSources: document.querySelector("#csvRichLabelSources"),
    confirmCsvMapBtn: document.querySelector("#confirmCsvMapBtn"),
    confirmationDialog: document.querySelector("#confirmationDialog"),
    confirmationTitle: document.querySelector("#confirmationTitle"),
    confirmationMessage: document.querySelector("#confirmationMessage"),
    confirmationConfirmBtn: document.querySelector("#confirmationConfirmBtn"),
    shortcutsOverlay: document.querySelector("#shortcutsOverlay"),
    closeShortcutsBtn: document.querySelector("#closeShortcutsBtn")
  };

  let canadaGeo = null;
  let lastLayout = null;
  let lastImportMessages = [];
  const manualLayoutHistoryLimit = 25;
  let pendingCsvImport = null;
  let pendingCsvMapping = null;
  let pendingConfirmation = null;
  let nextRowId = 1;
  let regionVisibility = {};
  let regionFills = {};
  let regionValues = {};
  let regionStatuses = {};
  let regionStatusVisibility = {};
  let regionColourOverrides = {};
  const regionStatusOptions = Object.freeze([
    { value: "", labelKey: "region.status.none", colour: "" },
    { value: "agreement-in-force", labelKey: "region.status.agreement-in-force", colour: "#3f6b5e" },
    { value: "negotiations-ongoing", labelKey: "region.status.negotiations-ongoing", colour: "#9f7616" },
    { value: "concluded-not-in-force", labelKey: "region.status.concluded-not-in-force", colour: "#5b8fa8" }
  ]);
  const defaultMapStylePreset = appConfig.defaultMapStylePreset || Object.keys(mapStylePresets)[0] || "goc-green";
  let currentMapStylePreset = defaultMapStylePreset;
  let currentBoundary = "canada";
  const referenceCitiesApi = window.PlotypusReferenceCities;
  const cityIntegration = window.PlotypusCityIntegration;
  const referenceCitySearch = window.PLOTYPUS_CITY_SEARCH;
  const indexedReferenceCities = referenceCitySearch && Array.isArray(window.PLOTYPUS_CITIES)
    ? referenceCitySearch.indexDataset(window.PLOTYPUS_CITIES)
    : [];
  let startupReferenceCitiesController = null;
  let baselayerReferenceCitiesController = null;
  let projectCitiesController = null;
  const projectRowCityControllers = new Map();
  let propertiesProjectCityController = null;
  let startupReferenceCities = referenceCitiesApi ? referenceCitiesApi.createDefaultModel() : { ids: [], overrides: {}, rule: null, style: "default" };
  let pendingProjectCities = referenceCitiesApi ? referenceCitiesApi.createDefaultModel() : { ids: [], overrides: {}, rule: null, style: "default" };
  let baselayer = {
    id: currentBoundary,
    geometrySource: currentBoundary,
    projection: boundarySources[currentBoundary] && boundarySources[currentBoundary].projection || currentBoundary,
    referenceCities: referenceCitiesApi ? referenceCitiesApi.createDefaultModel() : { ids: [], overrides: {}, rule: null, style: "default" }
  };
  let renderOutputMode = "web";
  let canvasViewZoom = defaultCanvasViewZoom;
  let appliedCanvasViewZoom = defaultCanvasViewZoom;
  let canvasResizeFrame = 0;
  let mapScaleControlsVisible = false;
  let draggedCategoryId = null;
  let activeCategoryDropEditor = null;
  let activeCategoryDropPlacement = null;
  let activePropertiesSelection = null;
  let qualityLocateIndex = -1;
  let activeQualityLocateTarget = null;
  let activeProjectFilter = "all";
  let activeProjectSearch = "";
  let activeProjectLocationMode = "coordinates";
  let cachedRegionLookupKey = "";
  let cachedRegionLookup = null;
  let activeTranslationFilter = "all";
  let activeTranslationEntryId = "";
  let activePointCatalogView = "presets";
  let startupDialogDismissed = false;
  let emptyBaselayerPreviewEnabled = false;
  let projectSaveState = "new";
  const selectableProjectCellFields = ["name", "footnote", "type", "city", "region", "lon", "lat", "status", "hideLine"];

  function getSelectableProjectCellFields() {
    return selectableProjectCellFields.filter(field => {
      if (isRegionLocationMode()) return field !== "lon" && field !== "lat" && field !== "city";
      if (isCityLocationMode()) return field !== "lon" && field !== "lat" && field !== "region";
      return field !== "region" && field !== "city";
    });
  }
  const selectedProjectCells = new Set();
  let projectCellSelectionAnchor = null;
  let lastProjectCellPointerSelectionAt = 0;
  let projectTableUxRefreshFrame = 0;
  let activeDataTable = "preview";
  let activeAuthoringLanguage = "en";
  let currentUiLanguage = "en";
  let feedbackComposer = null;
  let activeCategoryId = categorySettings[0] ? categorySettings[0].id : "";
  let currentMapLanguage = "en";
  const languageLayoutStates = {
    en: { manualLabelPositions: {}, manualBoxPositions: {}, history: [], mapScale: null, mapOffsetX: 0, mapOffsetY: 0 },
    fr: { manualLabelPositions: {}, manualBoxPositions: {}, history: [], mapScale: null, mapOffsetX: 0, mapOffsetY: 0 }
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
  let pendingPreviewRefresh = false;
  let pendingPreviewRefreshOptions = null;
  let pendingRenderFrame = null;
  let pendingRenderFallbackTimer = null;
  let pendingRenderDelayTimer = null;
  let pendingRenderIdleCallback = null;
  let pendingRenderOptions = null;
  let pendingRichLabelPreviewFrame = null;
  const pendingRichLabelPreviewRowIds = new Set();
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
  let autoFitDiagnostics = { attempts: [], selected: null };
  let scheduledRenderRequestedAt = null;
  let previewBusyStartedAt = 0;
  let previewBusyClearTimer = null;
  let previewBusyToken = 0;
  let qualityRefreshGeneration = 0;
  let qualityRefreshHandle = null;
  let qualityRefreshHandleType = "";
  let qualityRefreshWork = null;
  let qualityRefreshDirty = false;
  let qualityRefreshScheduled = false;
  let qualityRefreshPriority = false;
  let qualityRefreshAwaitingRender = false;
  let qualityRefreshError = "";
  let qualityGeometryRevision = 0;
  let activeQualityGeometryDrags = 0;
  let qualityGeometryDragNeedsSchedule = false;
  const qualityAnalysisTelemetry = {
    requests: 0,
    started: 0,
    completed: 0,
    superseded: 0,
    coalesced: 0,
    slices: 0,
    failed: 0
  };
  const renderSchedulingTelemetry = {
    requests: 0,
    coalesced: 0,
    deferredOffscreen: 0,
    deferredForNavigation: 0,
    idleQueued: 0,
    completed: 0
  };
  const deferredScriptLoads = new Map();
  const normalizedBoundaryCache = new Map();

  function on(element, eventName, handler) {
    if (element) element.addEventListener(eventName, handler);
  }

  function loadDeferredScript(url) {
    const key = String(url || "");
    if (!key) return Promise.reject(new Error("Missing script URL."));
    if (deferredScriptLoads.has(key)) return deferredScriptLoads.get(key);
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = key;
      script.async = true;
      script.onload = () => resolve(script);
      script.onerror = () => reject(new Error(`Could not load ${key}.`));
      document.head.appendChild(script);
    });
    deferredScriptLoads.set(key, promise);
    promise.catch(() => deferredScriptLoads.delete(key));
    return promise;
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
    const minimumVisibleMs = 220;
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

  function getRenderSchedulingSnapshot() {
    return {
      ...renderSchedulingTelemetry,
      pending: hasPendingRenderSchedule(),
      pendingForMap: pendingPreviewRefresh,
      phase: pendingRenderIdleCallback !== null
        ? "idle"
        : pendingRenderDelayTimer !== null
          ? "delay"
          : pendingRenderFrame !== null
            ? "paint"
            : pendingRenderFallbackTimer !== null
              ? "fallback"
              : pendingPreviewRefresh
                ? "offscreen"
                : "idle"
    };
  }

  function performanceMetric(label, sample, budgetMs) {
    if (!sample) {
      return `<div class="performance-metric" data-state="neutral"><span class="type-caption">${escapeHtml(label)}</span><strong class="type-data">${escapeHtml(t("performance.notRun"))}</strong><small class="type-caption">${escapeHtml(t("performance.budget", { value: Math.round(budgetMs) }))}</small></div>`;
    }
    const queuedPrefix = sample.queueMs ? t("performance.renderQueued", { render: Math.round(sample.durationMs), queued: Math.round(sample.queueMs) }) : "";
    return `
      <div class="performance-metric" data-state="${sample.overBudget ? "warning" : "ok"}">
        <span class="type-caption">${escapeHtml(label)}</span>
        <strong class="type-data">${Math.round(sample.totalMs)} ms</strong>
        <small class="type-caption">${escapeHtml(queuedPrefix)}${escapeHtml(t("performance.budget", { value: Math.round(sample.budgetMs) }))}</small>
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
      <div class="performance-metric" data-state="${p95State}"><span class="type-caption">${escapeHtml(t("performance.rollingP95"))}</span><strong class="type-data">${escapeHtml(p95Value)}</strong><small class="type-caption">${escapeHtml(t("performance.samples", { count: snapshot.samples.length, total: renderPerformanceBudgets.sampleWindow }))}</small></div>
      <div class="performance-metric" data-state="${snapshot.overBudgetCount ? "warning" : snapshot.samples.length ? "ok" : "neutral"}"><span class="type-caption">${escapeHtml(t("performance.budgetWarnings"))}</span><strong class="type-data">${snapshot.overBudgetCount}</strong><small class="type-caption">${escapeHtml(t("performance.currentWindow"))}</small></div>`;
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
  window.PLOTYPUS_RENDER_SCHEDULER = Object.freeze({
    snapshot: getRenderSchedulingSnapshot
  });
  window.PLOTYPUS_AUTO_FIT_DIAGNOSTICS = Object.freeze({
    snapshot: () => ({
      attempts: autoFitDiagnostics.attempts.map(attempt => ({ ...attempt })),
      selected: autoFitDiagnostics.selected ? { ...autoFitDiagnostics.selected } : null,
      unresolvedAbove: Array.isArray(autoFitDiagnostics.unresolvedAbove)
        ? autoFitDiagnostics.unresolvedAbove.slice()
        : []
    })
  });
  window.PLOTYPUS_QUALITY_ANALYSIS = Object.freeze({
    snapshot: getQualityAnalysisSnapshot
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

  function rememberCurrentLanguageMapScale(settings = null) {
    const state = getLanguageLayoutState();
    if (!state) return;
    if (settings && Number.isFinite(Number(settings.mapScale))) state.mapScale = normalizeMapScale(settings.mapScale);
    else if (els.mapScaleInput) state.mapScale = normalizeMapScale(els.mapScaleInput.value);
    if (settings) {
      state.mapOffsetX = Number(settings.mapOffsetX) || 0;
      state.mapOffsetY = Number(settings.mapOffsetY) || 0;
    }
  }

  function resetLanguageMapOffsets() {
    ["en", "fr"].forEach(language => {
      languageLayoutStates[language].mapOffsetX = 0;
      languageLayoutStates[language].mapOffsetY = 0;
    });
    languageLayoutCache.clear();
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
        mapScale: null,
        mapOffsetX: 0,
        mapOffsetY: 0
      };
    });
    activateLanguageLayoutState(currentMapLanguage, els.mapScaleInput ? els.mapScaleInput.value : null);
  }

  function serializeLanguageLayouts() {
    syncCurrentLanguageLayoutState();
    return Object.fromEntries(["en", "fr"].map(language => {
      const state = languageLayoutStates[language];
      const serialized = {
        manualLabelPositions: cloneCoordinateMap(state.manualLabelPositions),
        manualBoxPositions: cloneCoordinateMap(state.manualBoxPositions),
        mapScale: Number.isFinite(Number(state.mapScale)) ? normalizeMapScale(state.mapScale) : null
      };
      if (Number(state.mapOffsetX) || Number(state.mapOffsetY)) {
        serialized.mapOffsetX = Number(state.mapOffsetX) || 0;
        serialized.mapOffsetY = Number(state.mapOffsetY) || 0;
      }
      return [language, serialized];
    }));
  }

  function restoreLanguageLayouts(project, language) {
    ["en", "fr"].forEach(key => {
      const saved = project && project.languageLayouts && project.languageLayouts[key];
      languageLayoutStates[key] = {
        manualLabelPositions: normalizeStoredCoordinateMap(saved && saved.manualLabelPositions),
        manualBoxPositions: normalizeStoredCoordinateMap(saved && saved.manualBoxPositions),
        history: [],
        mapScale: saved && Number.isFinite(Number(saved.mapScale)) ? normalizeMapScale(saved.mapScale) : null,
        mapOffsetX: saved && Number.isFinite(Number(saved.mapOffsetX)) ? Number(saved.mapOffsetX) : 0,
        mapOffsetY: saved && Number.isFinite(Number(saved.mapOffsetY)) ? Number(saved.mapOffsetY) : 0
      };
    });

    const targetLanguage = normalizeMapLanguage(language);
    if (!project.languageLayouts || typeof project.languageLayouts !== "object") {
      languageLayoutStates[targetLanguage].manualLabelPositions = normalizeStoredCoordinateMap(project.manualLabelPositions);
      languageLayoutStates[targetLanguage].manualBoxPositions = normalizeStoredCoordinateMap(project.manualBoxPositions);
      const legacyScale = project.settings && project.settings.mapScale;
      languageLayoutStates[targetLanguage].mapScale = Number.isFinite(Number(legacyScale)) ? normalizeMapScale(legacyScale) : null;
      languageLayoutStates[targetLanguage].mapOffsetX = Number(project.settings && project.settings.mapOffsetX) || 0;
      languageLayoutStates[targetLanguage].mapOffsetY = Number(project.settings && project.settings.mapOffsetY) || 0;
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
      baselayer: clonePlainObject(baselayer),
      mapStyle: currentMapStylePreset,
      mapDetails: clonePlainObject(mapDetails),
      projectLocationMode: activeProjectLocationMode,
      chromeTranslations: clonePlainObject(chromeTranslations),
      authoringLanguage: activeAuthoringLanguage,
      mapLanguage: currentMapLanguage,
      regionVisibility: clonePlainObject(regionVisibility),
      regionFills: clonePlainObject(regionFills),
      regionColourOverrides: clonePlainObject(regionColourOverrides),
      regionValues: clonePlainObject(regionValues),
      regionStatuses: clonePlainObject(regionStatuses),
      regionStatusVisibility: clonePlainObject(regionStatusVisibility),
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
    setProjectSaveState("dirty");
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
      baselayer = normalizeBaselayerState(snapshot.baselayer, currentBoundary);
      baselayerReferenceCitiesController?.setModel(baselayer.referenceCities);
      if (els.boundaryInput) els.boundaryInput.value = currentBoundary;
      applyMapStylePreset(snapshot.mapStyle || currentMapStylePreset, { applyMapColours: false, render: false });
      applySettings(snapshot.settings || {});
      Object.keys(mapDetails).forEach(key => { mapDetails[key] = String(snapshot.mapDetails && snapshot.mapDetails[key] || ""); });
      restoreChromeTranslations(snapshot.chromeTranslations);
      activeProjectLocationMode = normalizeProjectLocationMode(snapshot.projectLocationMode || activeProjectLocationMode);
      applyCategorySettings(snapshot.categories || []);
      regionVisibility = clonePlainObject(snapshot.regionVisibility);
      regionFills = normalizeColourMap(snapshot.regionFills || {});
      regionColourOverrides = clonePlainObject(snapshot.regionColourOverrides);
      regionValues = clonePlainObject(snapshot.regionValues);
      regionStatuses = clonePlainObject(snapshot.regionStatuses || {});
      regionStatusVisibility = normalizeRegionStatusVisibility(snapshot.regionStatusVisibility);
      restoreLanguageLayouts({ languageLayouts: snapshot.languageLayouts || {} }, snapshot.mapLanguage || currentMapLanguage);
      syncProjectLocationModeUi();
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

  function captureScheduledRenderFocus() {
    const active = document.activeElement;
    if (!active || !els.propertiesSelectionControls?.contains(active)) return null;
    const stableAttributes = [
      "data-marker-size-draft",
      "data-leader-line-width-draft",
      "data-property-field",
      "data-layout-proxy",
      "data-map-proxy"
    ];
    for (const attribute of stableAttributes) {
      const value = active.getAttribute(attribute);
      if (value === null) continue;
      const escaped = window.CSS && typeof CSS.escape === "function" ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&");
      return `[${attribute}="${escaped}"]`;
    }
    return active.id ? `#${window.CSS && typeof CSS.escape === "function" ? CSS.escape(active.id) : active.id}` : null;
  }

  function restoreScheduledRenderFocus(selector) {
    if (!selector) return;
    const target = els.propertiesSelectionControls?.querySelector(selector);
    if (target && document.activeElement !== target) target.focus({ preventScroll: true });
  }

  function scheduleRender(options = {}) {
    renderSchedulingTelemetry.requests += 1;
    if (renderOutputMode === "web" && !shouldRenderPreviewNow()) {
      renderSchedulingTelemetry.deferredOffscreen += 1;
      if (pendingPreviewRefresh) renderSchedulingTelemetry.coalesced += 1;
      pendingPreviewRefresh = true;
      pendingPreviewRefreshOptions = mergeRenderOptions(pendingPreviewRefreshOptions, options);
      return;
    }
    markQualityRefreshAwaitingRender();
    pendingRenderOptions = mergeRenderOptions(pendingRenderOptions, options);
    setPreviewBusy(true);
    if (hasPendingRenderSchedule()) {
      renderSchedulingTelemetry.coalesced += 1;
      return;
    }
    scheduledRenderRequestedAt = performanceNow();

    const runScheduledRender = () => {
      if (!hasPendingRenderSchedule()) return;
      if (renderOutputMode === "web" && !shouldRenderPreviewNow()) {
        deferPendingScheduledRender();
        return;
      }
      if (activeQualityGeometryDrags > 0) {
        clearPendingRenderScheduleHandles();
        pendingRenderDelayTimer = window.setTimeout(runScheduledRender, 32);
        return;
      }
      clearPendingRenderScheduleHandles();
      const renderOptions = pendingRenderOptions || {};
      const queuedAt = scheduledRenderRequestedAt;
      const focusSelector = captureScheduledRenderFocus();
      pendingRenderOptions = null;
      scheduledRenderRequestedAt = null;
      try {
        render({ ...renderOptions, __telemetrySource: "scheduled", __telemetryQueuedAt: queuedAt });
        renderSchedulingTelemetry.completed += 1;
      } finally {
        restoreScheduledRenderFocus(focusSelector);
        setPreviewBusy(false);
      }
    };

    const queueWhenBrowserIsIdle = () => {
      pendingRenderFrame = null;
      renderSchedulingTelemetry.idleQueued += 1;
      if (typeof window.requestIdleCallback === "function") {
        pendingRenderIdleCallback = window.requestIdleCallback(runScheduledRender, { timeout: 120 });
        return;
      }
      pendingRenderDelayTimer = window.setTimeout(runScheduledRender, 0);
    };

    const queueAfterPaint = () => {
      pendingRenderFrame = window.requestAnimationFrame(() => {
        pendingRenderFrame = window.requestAnimationFrame(queueWhenBrowserIsIdle);
      });
      pendingRenderFallbackTimer = window.setTimeout(runScheduledRender, 180);
    };
    if (pendingRenderOptions.navigationFriendly) {
      pendingRenderDelayTimer = window.setTimeout(() => {
        pendingRenderDelayTimer = null;
        queueAfterPaint();
      }, 320);
    } else {
      queueAfterPaint();
    }
  }

  function hasPendingRenderSchedule() {
    return pendingRenderFrame !== null
      || pendingRenderFallbackTimer !== null
      || pendingRenderDelayTimer !== null
      || pendingRenderIdleCallback !== null;
  }

  function clearPendingRenderScheduleHandles() {
    if (pendingRenderFrame !== null) window.cancelAnimationFrame(pendingRenderFrame);
    if (pendingRenderFallbackTimer !== null) window.clearTimeout(pendingRenderFallbackTimer);
    if (pendingRenderDelayTimer !== null) window.clearTimeout(pendingRenderDelayTimer);
    if (pendingRenderIdleCallback !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(pendingRenderIdleCallback);
    }
    pendingRenderFrame = null;
    pendingRenderFallbackTimer = null;
    pendingRenderDelayTimer = null;
    pendingRenderIdleCallback = null;
  }

  function deferPendingScheduledRender() {
    if (!pendingRenderOptions || !hasPendingRenderSchedule()) return false;
    const renderOptions = pendingRenderOptions;
    clearPendingRenderScheduleHandles();
    pendingRenderOptions = null;
    scheduledRenderRequestedAt = null;
    pendingPreviewRefresh = true;
    pendingPreviewRefreshOptions = mergeRenderOptions(pendingPreviewRefreshOptions, renderOptions);
    renderSchedulingTelemetry.deferredForNavigation += 1;
    setPreviewBusy(false);
    return true;
  }

  function invalidatePatchedLayoutQuality() {
    qualityGeometryRevision += 1;
    qualityGeometryDragNeedsSchedule = false;
    qualityRefreshError = "";
    if (qualityRefreshScheduled || qualityRefreshWork) {
      cancelBackgroundQualityRefresh({ markDirty: true, preserveBusy: true });
    } else {
      qualityRefreshDirty = true;
    }
    scheduleBackgroundQualityRefresh({ refreshSurfaces: false });
  }

  function requestRichLabelPreviewRefresh(rowId) {
    const normalizedRowId = String(rowId || "");
    if (
      !normalizedRowId
      || !shouldRenderPreviewNow()
      || !lastLayout
      || renderOutputMode !== "web"
      || qualityRefreshAwaitingRender
      || hasPendingRenderSchedule()
    ) return false;

    pendingRichLabelPreviewRowIds.add(normalizedRowId);
    if (pendingRichLabelPreviewFrame !== null) return true;
    setPreviewBusy(true);
    pendingRichLabelPreviewFrame = window.requestAnimationFrame(() => {
      pendingRichLabelPreviewFrame = null;
      const rowIds = Array.from(pendingRichLabelPreviewRowIds);
      pendingRichLabelPreviewRowIds.clear();
      let patched = false;
      let needsFullRender = false;
      try {
        rowIds.forEach(id => {
          if (refreshRenderedLabel(id)) patched = true;
          else needsFullRender = true;
        });
        if (patched) invalidatePatchedLayoutQuality();
        if (needsFullRender) requestPreviewRefresh();
      } finally {
        setPreviewBusy(false);
      }
    });
    return true;
  }

  function getMapStylePreset(presetId = currentMapStylePreset) {
    return mapStylePresets[presetId] || mapStylePresets[defaultMapStylePreset] || Object.values(mapStylePresets)[0];
  }

  function getCurrentRegionColourSet() {
    const preset = getMapStylePreset();
    return preset.regionColours && preset.regionColours.length ? preset.regionColours : fallbackRegionColours;
  }

  function cleanType(type) {
    const raw = normalizeComparableText(type);
    const matchedCategory = categorySettings.find(category => {
      const candidates = [category.id, category.label, category.labelFr, category.defaultLabel]
        .map(normalizeComparableText)
        .filter(Boolean);
      return candidates.includes(raw);
    });
    if (matchedCategory) return matchedCategory.id;
    if ((raw === "strategy" || raw === "transformative" || raw.includes("transformative")) && hasCategory("strategy")) return "strategy";
    return getDefaultCategory().id;
  }

  function getCategory(type) {
    return categorySettings.find(category => category.id === cleanType(type)) || getDefaultCategory();
  }

  function getCategoryForType(type) {
    return getCategory(type);
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
    if (kind === "translation") return "languages";
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
    const sourceSize = normalizeMarkerSize(category && category.markerSize, settings.markerSize, 4, 30);
    return sourceSize * (Number(settings.labelDensityScale) || 1);
  }

  function getCategoryLineWidth(category, settings) {
    const sourceWidth = normalizeLeaderLineWidth(category && category.lineWidth, settings.lineWidth);
    return sourceWidth * (Number(settings.labelDensityScale) || 1);
  }

  function getLeaderLineWidth(row, settings) {
    const override = normalizeLeaderLineWidthOverride(row && row.leaderLineWidth);
    if (override !== "") return override * (Number(settings.labelDensityScale) || 1);
    return getCategoryLineWidth(getCategory(row && row.type), settings);
  }

  function normalizeCategorySizes(category, settings = getSettings()) {
    category.markerSize = normalizeMarkerSize(category.markerSize, settings.markerSize, 4, 30);
    category.lineWidth = normalizeLeaderLineWidth(category.lineWidth, settings.lineWidth);
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

  function getLocalizedConfigLabel(item, language = currentUiLanguage, fallback = "") {
    if (!item || typeof item !== "object") return String(fallback || "");
    return language === "fr"
      ? String(item.labelFr || item.label || fallback || "")
      : String(item.label || item.labelFr || fallback || "");
  }

  function getMarkerShapeLabel(shape) {
    const value = typeof shape === "string" ? shape : shape && shape.value;
    const fallback = typeof shape === "string"
      ? shape
      : getLocalizedConfigLabel(shape, currentUiLanguage, value);
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
    const fallback = getLocalizedConfigLabel(preset, currentUiLanguage, preset.value);
    return key ? tOr(`properties.category.colour.${key}`, fallback) : fallback;
  }

  function getMapStylePresetLabel(presetId, preset) {
    return tOr(`properties.mapStyle.${presetId}`, getLocalizedConfigLabel(preset, currentUiLanguage, presetId));
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
    return tForOr(language, `region.boundary.${boundary}`, getLocalizedConfigLabel(source, language, boundary));
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
    const leaderColour = normalizeHexColour(icon.leaderColour, "");
    return {
      dataUrl,
      mimeType,
      name: String(icon.name || "").slice(0, 120),
      width,
      height,
      size,
      leaderColour,
      matchLeaderLines: icon.matchLeaderLines === true && Boolean(leaderColour)
    };
  }

  function readCustomMarkerIconMetadata(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        let leaderColour = "";
        if (
          width < customMarkerIconRules.minDimension ||
          height < customMarkerIconRules.minDimension ||
          width > customMarkerIconRules.maxDimension ||
          height > customMarkerIconRules.maxDimension
        ) {
          resolve({ width, height, leaderColour });
          return;
        }
        try {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (context) {
            context.drawImage(image, 0, 0, width, height);
            leaderColour = markerColour.detectDominantColour(context.getImageData(0, 0, width, height));
          }
        } catch (_error) {
          leaderColour = "";
        }
        resolve({ width, height, leaderColour });
      };
      image.onerror = () => reject(new Error(t("status.iconDecodeFailed")));
      image.src = dataUrl;
    });
  }

  function readImageDimensions(dataUrl, decodeFailedKey = "status.iconDecodeFailed") {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      });
      image.onerror = () => reject(new Error(t(decodeFailedKey)));
      image.src = dataUrl;
    });
  }

  function readFileAsDataUrl(file, readFailedKey = "status.iconReadFailed") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(t(readFailedKey)));
      reader.readAsDataURL(file);
    });
  }

  function isSafeRichLabelImageDataUrl(value) {
    return typeof value === "string" && /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  async function validateRichLabelImageFile(file) {
    if (!file) throw new Error(t("status.richImageMissingFile"));
    const mimeType = String(file.type || "").toLowerCase();
    if (!richLabelImageRules.allowedTypes.has(mimeType)) {
      throw new Error(t("status.richImageUnsupportedType"));
    }
    if (file.size > richLabelImageRules.maxBytes) {
      throw new Error(t("status.richImageMaxFileSize", { size: Math.round(richLabelImageRules.maxBytes / 1024) }));
    }
    const dataUrl = await readFileAsDataUrl(file, "status.richImageReadFailed");
    if (!isSafeRichLabelImageDataUrl(dataUrl)) {
      throw new Error(t("status.richImageInvalidDataUrl"));
    }
    const dimensions = await readImageDimensions(dataUrl, "status.richImageDecodeFailed");
    if (
      dimensions.width < richLabelImageRules.minDimension ||
      dimensions.height < richLabelImageRules.minDimension ||
      dimensions.width > richLabelImageRules.maxDimension ||
      dimensions.height > richLabelImageRules.maxDimension
    ) {
      throw new Error(t("status.richImageDimensionRange", { min: richLabelImageRules.minDimension, max: richLabelImageRules.maxDimension }));
    }
    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height
    };
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
    const dimensions = await readCustomMarkerIconMetadata(dataUrl);
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
      size: file.size,
      leaderColour: dimensions.leaderColour,
      matchLeaderLines: Boolean(dimensions.leaderColour)
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
      const isSelected = activePropertiesSelection?.kind === "category" && activePropertiesSelection.id === category.id;
      const menuId = `legendItemMenu-${index}`;
      return `
      <li class="legend-item${isSelected ? " is-selected" : ""}" data-legend-item data-category-id="${escapeHtml(category.id)}">
        <button class="legend-item-select" type="button" data-property-action="edit-legend-item" data-category-id="${escapeHtml(category.id)}" aria-controls="categoryPropertiesEditor" aria-expanded="${String(isSelected)}"${isSelected ? " aria-current=\"true\"" : ""} aria-label="${escapeHtml(t("properties.category.editAria", { label: categoryUiLabel }))}">
          <span class="category-swatch" data-legend-preview aria-hidden="true">${getCategorySwatchSvg(category)}</span>
          <span class="legend-item-copy">
            <strong class="type-control-label" data-legend-name>${escapeHtml(categoryUiLabel)}</strong>
            <small class="type-caption" data-legend-count data-count="${categoryCounts[category.id] || 0}">${categoryCounts[category.id] || 0} ${escapeHtml((categoryCounts[category.id] || 0) === 1 ? t("properties.category.point") : t("properties.category.points"))} · ${escapeHtml(category.customIcon ? t("properties.category.customIcon") : getMarkerShapeLabel(category.shape))}</small>
          </span>
          <span class="legend-item-chevron" aria-hidden="true">›</span>
        </button>
        <div class="category-actions">
            <span class="category-drag-handle icon-button" draggable="true" data-category-id="${escapeHtml(category.id)}" aria-hidden="true" title="${escapeHtml(t("properties.category.dragTitle"))}">
              <svg class="category-grip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.8"></circle>
                <circle cx="15" cy="6" r="1.8"></circle>
                <circle cx="9" cy="12" r="1.8"></circle>
                <circle cx="15" cy="12" r="1.8"></circle>
                <circle cx="9" cy="18" r="1.8"></circle>
                <circle cx="15" cy="18" r="1.8"></circle>
              </svg>
            </span>
            <button class="legend-item-menu-button icon-button" type="button" data-category-id="${escapeHtml(category.id)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}" aria-label="${escapeHtml(t("properties.category.actionsAria", { label: categoryUiLabel }))}">${iconSvg("more-horizontal")}</button>
            <div id="${menuId}" class="legend-item-menu" role="menu" hidden>
              <button class="move-category-up-btn" type="button" role="menuitem" data-category-id="${escapeHtml(category.id)}"${index === 0 ? " disabled" : ""}>${escapeHtml(t("properties.category.moveUp"))}</button>
              <button class="move-category-down-btn" type="button" role="menuitem" data-category-id="${escapeHtml(category.id)}"${index >= categorySettings.length - 1 ? " disabled" : ""}>${escapeHtml(t("properties.category.moveDown"))}</button>
              <button class="remove-category-btn is-danger" type="button" role="menuitem" data-category-id="${escapeHtml(category.id)}"${category.removable === false || categorySettings.length <= 1 ? " disabled" : ""}>${escapeHtml(t("properties.category.removeTitle"))}</button>
            </div>
        </div>
      </li>
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
    const text = n.toFixed(projectCoordinateFractionDigits);
    return language === "fr" ? text.replace(".", ",") : text;
  }

  function toBoolean(value) {
    if (value === true || value === false) return value;
    const raw = normalizeComparableText(value);
    return [
      "1", "true", "yes", "y", "hide", "hidden", "no line", "no leader line",
      "vrai", "oui", "o", "masquer", "masque", "cacher", "cache", "sans ligne",
      "sans trait", "sans trait de renvoi", "aucun trait de renvoi", "pas de trait de renvoi"
    ].includes(raw);
  }

  function normalizeFootnote(value) {
    return String(value || "").trim();
  }

  function getRenderableFootnote(value) {
    const footnote = normalizeFootnote(value);
    return /^([A-Za-z0-9]+|\*)$/.test(footnote) ? footnote : "";
  }

  function normalizeComparableText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizeHeader(value) {
    return normalizeComparableText(value);
  }

  function getField(row, aliases) {
    if (!row || !Array.isArray(aliases) || !aliases.length) return "";
    const directKey = aliases.find(alias => Object.prototype.hasOwnProperty.call(row, alias));
    if (directKey) return row[directKey];

    const keys = Object.keys(row);
    const normalizedAliases = aliases.map(normalizeHeader);
    const matchedKey = keys.find(key => normalizedAliases.includes(normalizeHeader(key)));
    return matchedKey ? row[matchedKey] : undefined;
  }

  function parseArrayField(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  function normalizeAnchor(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "region") return "region";
    if (normalized === "city") return "city";
    return "coord";
  }

  function normalizeProjectLocationMode(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "region" || normalized === "regions") return "regions";
    if (normalized === "city" || normalized === "cities") return "cities";
    return "coordinates";
  }

  function isRegionLocationMode(mode = activeProjectLocationMode) {
    return normalizeProjectLocationMode(mode) === "regions";
  }

  function isCityLocationMode(mode = activeProjectLocationMode) {
    return normalizeProjectLocationMode(mode) === "cities";
  }

  function getProjectLocationAnchor(mode = activeProjectLocationMode) {
    if (isRegionLocationMode(mode)) return "region";
    if (isCityLocationMode(mode)) return "city";
    return "coord";
  }

  function getActiveTableFields() {
    if (isCityLocationMode()) {
      const fields = tableFields.filter(field => field !== "lon" && field !== "lat" && field !== "region" && field !== "city");
      return [...fields, "city"];
    }
    if (!isRegionLocationMode()) return tableFields.filter(field => field !== "city");
    const fields = tableFields.filter(field => field !== "lon" && field !== "lat" && field !== "region");
    return [...fields, "region"];
  }

  function deriveProjectLocationModeFromRows(rows = []) {
    const meaningfulRows = (rows || []).filter(row => row && (row.name || row.nameFr || row.region || row.lon !== "" || row.lat !== ""));
    if (!meaningfulRows.length) return "coordinates";
    const cityRows = meaningfulRows.filter(row => normalizeAnchor(row.anchor) === "city" && (row.cityId || row.sourceCityId));
    if (cityRows.length === meaningfulRows.length) return "cities";
    const regionRows = meaningfulRows.filter(row => normalizeAnchor(row.anchor) === "region" || (row.region && row.lon === "" && row.lat === ""));
    return regionRows.length === meaningfulRows.length ? "regions" : "coordinates";
  }

  function getRegionLookup() {
    const rows = getRegionRows();
    const key = `${currentBoundary}|${rows.map(row => `${row.id}:${row.name}`).join("|")}`;
    if (!cachedRegionLookup || cachedRegionLookupKey !== key) {
      cachedRegionLookupKey = key;
      cachedRegionLookup = regionMatching.buildRegionLookup(rows);
    }
    return cachedRegionLookup;
  }

  function resolveProjectRegionInput(value) {
    return regionMatching.resolveRegionInput(value, getRegionLookup());
  }

  function getRegionSelectOptions(selectedRegion = "") {
    const selected = String(selectedRegion || "");
    const rows = getRegionRows();
    const options = [`<option value="">${escapeHtml(t("properties.annotation.chooseRegion"))}</option>`];
    rows.forEach(region => {
      options.push(`<option value="${escapeHtml(region.id)}"${region.id === selected ? " selected" : ""}>${escapeHtml(region.name)}</option>`);
    });
    return options.join("");
  }

  function syncProjectRowRegionInput(tr) {
    const select = tr && tr.querySelector(".region-input");
    if (!select) return;
    const value = String(tr.dataset.region || "").trim();
    select.innerHTML = getRegionSelectOptions(value);
    select.value = value;
  }

  function syncAllProjectRegionInputs() {
    getTableRows().forEach(syncProjectRowRegionInput);
  }

  function syncProjectLocationModeUi() {
    const isRegions = isRegionLocationMode();
    const isCities = isCityLocationMode();
    if (els.projectTable) els.projectTable.dataset.locationMode = activeProjectLocationMode;
    els.projectLocationModeButtons.forEach(button => {
      const active = normalizeProjectLocationMode(button.dataset.projectLocationMode) === activeProjectLocationMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (els.bulkClearCoordinatesBtn) {
      const label = els.bulkClearCoordinatesBtn.querySelector("span") || els.bulkClearCoordinatesBtn;
      label.textContent = isRegions
        ? t("toolbar.selection.clearRegions")
        : isCities
          ? t("toolbar.selection.clearCities")
          : t("toolbar.selection.clearCoordinates");
    }
  }

  function setProjectLocationMode(mode, options = {}) {
    const nextMode = normalizeProjectLocationMode(mode);
    const changed = nextMode !== activeProjectLocationMode;
    const nextIsRegionMode = isRegionLocationMode(nextMode);
    const nextIsCityMode = isCityLocationMode(nextMode);
    if (changed && options.pushUndo !== false) pushAppUndoHistory("project location mode");
    if (changed && nextIsRegionMode) {
      getTableRows().forEach(tr => {
        const lonValue = tr.querySelector(".lon-input")?.value || "";
        const latValue = tr.querySelector(".lat-input")?.value || "";
        if (lonValue) tr.dataset.coordLon = lonValue;
        if (latValue) tr.dataset.coordLat = latValue;
      });
    }
    activeProjectLocationMode = nextMode;
    let autoFilled = 0;
    getTableRows().forEach(tr => {
      tr.dataset.anchor = getProjectLocationAnchor();
      if (!nextIsRegionMode) {
        const lonInput = tr.querySelector(".lon-input");
        const latInput = tr.querySelector(".lat-input");
        if (lonInput) lonInput.value = tr.dataset.coordLon || "";
        if (latInput) latInput.value = tr.dataset.coordLat || "";
      }
      if (nextIsRegionMode && !String(tr.dataset.region || "").trim()) {
        const lonValue = toNumber(tr.dataset.coordLon || tr.querySelector(".lon-input")?.value || "");
        const latValue = toNumber(tr.dataset.coordLat || tr.querySelector(".lat-input")?.value || "");
        if (lonValue !== "" && latValue !== "") {
          const regionId = getRegionIdForPoint(Number(lonValue), Number(latValue));
          if (regionId) {
            tr.dataset.region = regionId;
            autoFilled += 1;
          }
        }
      }
      syncProjectRowRegionInput(tr);
      projectRowCityControllers.get(String(tr.dataset.rowId))?.refresh();
      updateRowAnnotationPreview(tr);
      syncCoordinateClearButtons(tr);
    });
    syncProjectLocationModeUi();
    refreshProjectTableUx();
    refreshActiveRowProperties();
    if (options.render !== false) requestPreviewRefresh();
    if (changed && options.status !== false) {
      const key = nextIsRegionMode
        ? "status.locationModeRegions"
        : nextIsCityMode
          ? "status.locationModeCities"
          : "status.locationModeCoordinates";
      const message = autoFilled > 0 ? t("status.locationModeRegionsAutoFilled", { count: autoFilled }) : t(key);
      setStatusMessage(message, "ok");
    }
  }
  function normalizeImportedProjectRow(rawRow, index = 0, messages = [], locationMode = activeProjectLocationMode) {
    const row = normalizeRow(rawRow);
    row.anchor = getProjectLocationAnchor(locationMode);
    if (isCityLocationMode(locationMode)) {
      const input = String(rawRow && (rawRow.city || getField(rawRow, csvColumnAliases.city) || "") || "").trim();
      const resolved = cityIntegration && cityIntegration.resolveCityInput(input, indexedReferenceCities);
      if (resolved && resolved.status === "matched") {
        const city = resolved.city;
        row.cityId = city.id;
        row.cityName = city.name;
        row.cityNameFr = city.name_fr || city.name;
        row.cityProvince = city.prov;
        row.lon = Number(city.lon);
        row.lat = Number(city.lat);
        row.region = getCityRegionId(city);
      } else {
        row.cityId = "";
        row.cityName = "";
        row.cityNameFr = "";
        row.cityProvince = "";
        row.lon = "";
        row.lat = "";
        row.region = "";
        if (input) messages.push(t(resolved && resolved.status === "ambiguous" ? "status.csvRowCityAmbiguous" : "status.csvRowCityUnmatched", { row: index + 2, input }));
      }
      return row;
    }
    if (!isRegionLocationMode(locationMode)) return row;
    const input = String(rawRow && (rawRow.region || getField(rawRow, csvColumnAliases.region) || "") || "").trim();
    const resolved = resolveProjectRegionInput(input);
    row.lon = "";
    row.lat = "";
    row.region = resolved.status === "matched" ? resolved.id : "";
    const rowNumber = index + 2;
    if (resolved.status === "matched" && resolved.confidence !== "exact") {
      messages.push(t("status.csvRowRegionMatched", { row: rowNumber, input, region: resolved.label }));
    } else if (resolved.status === "unmatched") {
      messages.push(t("status.csvRowRegionUnmatched", { row: rowNumber, input }));
    } else if (resolved.status === "ambiguous") {
      messages.push(t("status.csvRowRegionAmbiguous", { row: rowNumber, input }));
    }
    return row;
  }

  function normalizeLabelStyle(value) {
    return String(value || "").toLowerCase() === "rich" ? "rich" : "compact";
  }

  function normalizeLocalizedText(value) {
    if (value && typeof value === "object") {
      return {
        en: String(value.en ?? value.text ?? value.label ?? "").trim(),
        fr: String(value.fr ?? "").trim()
      };
    }
    return { en: String(value || "").trim(), fr: "" };
  }

  function normalizeContentBlock(value) {
    const item = value && typeof value === "object" ? value : {};
    const rawType = String(item.type || "paragraph").toLowerCase();
    if (rawType === "heading" || rawType === "text" || (rawType === "bullet" && !Array.isArray(item.items))) {
      const template = String(item.template || "");
      const sources = Array.isArray(item.sources)
        ? item.sources.map(source => String(source || "").trim()).filter(Boolean)
        : projectIo.getRichLabelTemplateSources(template);
      return {
        type: rawType === "heading" ? "text" : rawType,
        template,
        sources,
        numberFormat: projectIo.normalizeRichLabelNumberFormat(item.numberFormat),
        value: normalizeLocalizedText(item.value !== undefined ? item.value : item)
      };
    }
    if (rawType === "bullets" || rawType === "bullet") {
      const items = parseArrayField(item.items).map(normalizeLocalizedText);
      return { type: "bullets", items };
    }
    if (rawType === "image") {
      const naturalWidth = normalizeRichLabelImageNaturalDimension(item.naturalWidth ?? item.sourceWidth);
      const naturalHeight = normalizeRichLabelImageNaturalDimension(item.naturalHeight ?? item.sourceHeight);
      const image = {
        type: "image",
        assetRef: String(item.assetRef || item.src || item.url || "").trim(),
        caption: normalizeLocalizedText(item.caption || item.alt || {}),
        displaySize: normalizeRichLabelImageDisplaySize(item.displaySize ?? item.imageSize ?? item.displayWidth)
      };
      if (naturalWidth && naturalHeight) {
        image.naturalWidth = naturalWidth;
        image.naturalHeight = naturalHeight;
      }
      return image;
    }
    return {
      type: "paragraph",
      ...normalizeLocalizedText(item.text !== undefined ? item.text : item)
    };
  }

  function normalizeAnnotationContent(value) {
    return parseArrayField(value).map(normalizeContentBlock).filter(Boolean);
  }

  function normalizeRichLabelImageDisplaySize(value) {
    const numeric = Number(value);
    const fallback = richLabelImageDisplayRules.defaultSize;
    if (!Number.isFinite(numeric)) return fallback;
    return Math.round(clamp(numeric, richLabelImageDisplayRules.minSize, richLabelImageDisplayRules.maxSize));
  }

  function normalizeRichLabelImageNaturalDimension(value) {
    const numeric = Math.round(Number(value));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }

  function getRichLabelImageDimensions(value) {
    const image = value && typeof value === "object" ? value : {};
    const size = normalizeRichLabelImageDisplaySize(image.displaySize);
    const naturalWidth = normalizeRichLabelImageNaturalDimension(image.naturalWidth) || richLabelImageDisplayRules.fallbackWidth;
    const naturalHeight = normalizeRichLabelImageNaturalDimension(image.naturalHeight) || richLabelImageDisplayRules.fallbackHeight;
    const ratio = naturalWidth / naturalHeight;
    if (ratio >= 1) {
      return { width: size, height: size / ratio };
    }
    return { width: size * ratio, height: size };
  }

  function annotationArrayToDataset(value) {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }

  function normalizeRegionStatus(value) {
    const next = String(value || "").trim();
    return regionStatusOptions.some(option => option.value === next) ? next : "";
  }

  function getRegionStatusOption(value) {
    const status = normalizeRegionStatus(value);
    return regionStatusOptions.find(option => option.value === status) || regionStatusOptions[0];
  }

  function normalizeRegionStatusVisibility(value) {
    const source = value && typeof value === "object" ? value : {};
    return regionStatusOptions.reduce((visibility, option) => {
      if (option.value && source[option.value] === false) visibility[option.value] = false;
      return visibility;
    }, {});
  }

  function isRegionStatusVisible(value) {
    const status = normalizeRegionStatus(value);
    return !status || regionStatusVisibility[status] !== false;
  }

  function renderRegionStatusVisibilityControls() {
    if (!els.regionStatusVisibilityOptions || !els.regionStatusVisibilityAllInput) return;
    const options = regionStatusOptions.filter(option => option.value);
    const visibleCount = options.filter(option => isRegionStatusVisible(option.value)).length;
    els.regionStatusVisibilityAllInput.checked = visibleCount === options.length;
    els.regionStatusVisibilityAllInput.indeterminate = visibleCount > 0 && visibleCount < options.length;
    els.regionStatusVisibilityOptions.innerHTML = options.map(option => {
      const label = t(option.labelKey);
      return `
        <label class="region-status-visibility-option">
          <input type="checkbox" data-region-status-visibility="${escapeHtml(option.value)}"${isRegionStatusVisible(option.value) ? " checked" : ""} aria-label="${escapeHtml(t("region.status.showAria", { status: label }))}">
          <span class="region-status-visibility-swatch" data-region-status-colour="${escapeHtml(option.colour)}" aria-hidden="true"></span>
          <span>${escapeHtml(label)}</span>
        </label>
      `;
    }).join("");
    els.regionStatusVisibilityOptions.querySelectorAll(".region-status-visibility-swatch").forEach(swatch => {
      swatch.style.setProperty("--region-status-colour", swatch.dataset.regionStatusColour || "transparent");
    });
  }

  function setAllRegionStatusVisibility(visible) {
    regionStatusVisibility = regionStatusOptions.reduce((visibility, option) => {
      if (option.value && !visible) visibility[option.value] = false;
      return visibility;
    }, {});
    renderRegionStatusVisibilityControls();
    refreshRegionValueTableRows();
    if (activePropertiesSelection && activePropertiesSelection.kind === "region") renderPropertiesForActiveState();
    scheduleRender();
  }

  function setRegionStatusVisibility(statusValue, visible) {
    const status = normalizeRegionStatus(statusValue);
    if (!status) return;
    if (visible) delete regionStatusVisibility[status];
    else regionStatusVisibility[status] = false;
    renderRegionStatusVisibilityControls();
    refreshRegionValueTableRows();
    if (activePropertiesSelection && activePropertiesSelection.kind === "region") renderPropertiesForActiveState();
    scheduleRender();
  }

  function getLocalizedPairText(pair, language = currentMapLanguage) {
    const value = pair && pair.value && typeof pair.value === "object" ? pair.value : pair;
    const en = String(value && value.en || "").trim();
    const fr = String(value && value.fr || "").trim();
    return language === "fr" ? fr || en : en || fr;
  }

  function getRegionFeatureById(regionId, geo = canadaGeo) {
    const id = String(regionId || "");
    if (!id || !geo || !Array.isArray(geo.features)) return null;
    for (let index = 0; index < geo.features.length; index += 1) {
      const feature = geo.features[index];
      if (getRegionId(feature, index) === id) return { feature, index };
    }
    return null;
  }

  function getRegionNameById(regionId) {
    const match = getRegionFeatureById(regionId, canadaGeo);
    return match ? getRegionDisplayName(match.feature, match.index) : String(regionId || "");
  }

  function regionStatusOptionsHtml(selectedValue) {
    const selected = normalizeRegionStatus(selectedValue);
    return regionStatusOptions.map(option => `<option value="${escapeHtml(option.value)}"${option.value === selected ? " selected" : ""}>${escapeHtml(t(option.labelKey))}</option>`).join("");
  }

  function getAnchorPreview(row) {
    if (row && row.anchor === "region") return row.region ? t("table.anchor.regionNamed", { name: getRegionNameById(row.region) }) : t("table.anchor.region");
    if (row && row.anchor === "city") {
      const city = getProjectCityById(row.cityId);
      const name = city ? (currentUiLanguage === "fr" ? city.name_fr || city.name : city.name) : row.cityName || row.cityNameFr;
      return name ? t("table.anchor.cityNamed", { name }) : t("table.anchor.city");
    }
    const lon = row && row.lon !== "" ? formatProjectCoordinate(row.lon) : "";
    const lat = row && row.lat !== "" ? formatProjectCoordinate(row.lat) : "";
    return lon && lat ? `${lon}, ${lat}` : t("table.anchor.coordinates");
  }

  function getLabelStylePreview(row) {
    if (row && row.labelStyle === "rich") {
      const count = Array.isArray(row.content) ? row.content.length : 0;
      return t("table.label.rich", { count, unit: t(count === 1 ? "table.label.item" : "table.label.items") });
    }
    return t("table.label.compact");
  }

  function normalizeRow(row) {
    const anchor = normalizeAnchor(row && row.anchor);
    return {
      rowId: row && row.rowId ? String(row.rowId) : "",
      name: String(getField(row, csvColumnAliases.name) || "").trim(),
      nameFr: String(getField(row, csvColumnAliases.nameFr) || row.nameFr || "").trim(),
      footnote: normalizeFootnote(getField(row, csvColumnAliases.footnote)),
      type: cleanType(getField(row, csvColumnAliases.type) || getDefaultCategory().label),
      typeFr: String(getField(row, csvColumnAliases.typeFr) || row.typeFr || "").trim(),
      lon: anchor === "region" ? "" : toNumber(getField(row, csvColumnAliases.lon)),
      lat: anchor === "region" ? "" : toNumber(getField(row, csvColumnAliases.lat)),
      anchor,
      region: String(row && row.region || getField(row, csvColumnAliases.region) || "").trim(),
      cityId: String(row && (row.cityId || row.sourceCityId) || "").trim(),
      cityName: String(row && row.cityName || "").trim(),
      cityNameFr: String(row && row.cityNameFr || "").trim(),
      cityProvince: String(row && row.cityProvince || "").trim(),
      labelStyle: normalizeLabelStyle(row && row.labelStyle),
      content: normalizeAnnotationContent(row && row.content),
      labelBorder: toBoolean(row && row.labelBorder),
      hideLine: toBoolean(getField(row, csvColumnAliases.hideLine)),
      elbowLeader: toBoolean(row && row.elbowLeader),
      leaderLineWidth: normalizeLeaderLineWidthOverride(row && row.leaderLineWidth),
      leaderLineColour: normalizeHexColour(row && row.leaderLineColour, ""),
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
    selectedProjectCells.clear();
    projectCellSelectionAnchor = null;
    projectRowCityControllers.forEach(controller => controller.destroy());
    projectRowCityControllers.clear();
    els.tableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
      const normalized = normalizeRow(row);
      normalized.anchor = getProjectLocationAnchor();
      if (normalized.typeFr) {
        const category = getCategoryForType(normalized.type);
        if (category && !category.labelFr) category.labelFr = normalized.typeFr;
      }
      addRow(normalized, { container: fragment, deferRefresh: true });
    });
    els.tableBody.appendChild(fragment);
    updateDeleteButtonState();
    refreshProjectTableUx();
    renderCategoryEditors();
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
    row = { name: "", nameFr: "", footnote: "", type: getDefaultCategory().id, lon: "", lat: "", anchor: "coord", region: "", cityId: "", cityName: "", cityNameFr: "", cityProvince: "", labelStyle: "compact", content: [], labelBorder: false, hideLine: false, elbowLeader: false, leaderLineWidth: "", leaderLineColour: "", labelMaxChars: "" },
    options = {}
  ) {
    const tr = document.createElement("tr");
    const rowId = row.rowId ? String(row.rowId) : String(nextRowId);
    tr.dataset.rowId = rowId;
    tr.tabIndex = 0;
    tr.setAttribute("aria-selected", "false");
    tr.dataset.nameEn = row.name || "";
    tr.dataset.nameFr = row.nameFr || "";
    tr.dataset.labelMaxChars = normalizeLabelMaxCharsOverride(row.labelMaxChars);
    tr.dataset.anchor = getProjectLocationAnchor();
    tr.dataset.region = String(row.region || "").trim();
    tr.dataset.cityId = String(row.cityId || row.sourceCityId || "").trim();
    tr.dataset.cityName = String(row.cityName || "").trim();
    tr.dataset.cityNameFr = String(row.cityNameFr || "").trim();
    tr.dataset.cityProvince = String(row.cityProvince || "").trim();
    tr.dataset.labelStyle = normalizeLabelStyle(row.labelStyle);
    tr.dataset.content = annotationArrayToDataset(normalizeAnnotationContent(row.content));
    tr.dataset.labelBorder = row.labelBorder ? "true" : "false";
    tr.dataset.coordLon = formatProjectCoordinate(row.lon);
    tr.dataset.coordLat = formatProjectCoordinate(row.lat);
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
      <td class="annotation-preview-cell label-preview-cell" data-cell-field="labelStyle"><span class="label-preview-text"></span></td>
      <td class="bulk-edit-cell city-cell vcell" data-cell-field="city"><div class="project-city-cell-field"></div></td>
      <td class="bulk-edit-cell region-cell anchor-preview-cell vcell" data-cell-field="region"><select class="region-input" aria-label="${escapeHtml(t("properties.field.region"))}"></select></td>
      <td class="bulk-edit-cell coordinate-cell lon-cell vcell" data-cell-field="lon"><input class="lon-input" type="text" inputmode="decimal" value="${escapeHtml(formatProjectCoordinate(row.lon))}" aria-label="${escapeHtml(t("table.longitude"))}"><button class="clear-coordinate-cell" type="button" data-clear-coordinate="lon" aria-label="${escapeHtml(t("table.clearLongitude"))}" title="${escapeHtml(t("table.clearLongitude"))}" hidden>&times;</button></td>
      <td class="bulk-edit-cell coordinate-cell lat-cell vcell" data-cell-field="lat"><input class="lat-input" type="text" inputmode="decimal" value="${escapeHtml(formatProjectCoordinate(row.lat))}" aria-label="${escapeHtml(t("table.latitude"))}"><button class="clear-coordinate-cell" type="button" data-clear-coordinate="lat" aria-label="${escapeHtml(t("table.clearLatitude"))}" title="${escapeHtml(t("table.clearLatitude"))}" hidden>&times;</button></td>
      <td class="status-cell" data-cell-field="status"><span class="row-status-badge"></span></td>
      <td class="line-cell" data-cell-field="hideLine"><input type="checkbox" class="hide-line-input" aria-label="${escapeHtml(t("properties.field.hideLeaderLine"))}"${row.hideLine ? " checked" : ""}></td>
      <td hidden>
        <input type="checkbox" class="elbow-leader-input" aria-label="${escapeHtml(t("properties.field.useElbowLeader"))}"${row.elbowLeader ? " checked" : ""}>
        <input type="hidden" class="leader-line-width-input" value="${escapeHtml(String(normalizeLeaderLineWidthOverride(row.leaderLineWidth)))}">
        <input type="hidden" class="leader-line-colour-input" value="${escapeHtml(normalizeHexColour(row.leaderLineColour, ""))}">
      </td>
      <td class="select-cell"><input type="checkbox" class="row-select" aria-label="${escapeHtml(t("table.selectRow"))}"></td>
    `;
    tr.querySelector(".type-input").value = cleanType(row.type);
    const handleRowEdit = (input) => {
      captureInputUndo(input, "project row edit");
      if (!isCityLocationMode() && (input.classList.contains("lon-input") || input.classList.contains("lat-input"))) {
        tr.dataset.cityId = "";
        tr.dataset.cityName = "";
        tr.dataset.cityNameFr = "";
        tr.dataset.cityProvince = "";
        projectRowCityControllers.get(String(tr.dataset.rowId))?.setValue("");
      }
      updateRowTitles(tr);
      updateRowAnnotationPreview(tr);
    syncCoordinateClearButtons(tr);
      if (isProjectStatusInput(input)) scheduleProjectTableUxRefresh();
      requestPreviewRefresh();
      refreshActiveRowProperties();
    };
    tr.querySelectorAll("input,select").forEach(input => {
      if (input.classList.contains("row-select")) return;
      input.addEventListener("focus", () => primeInputUndo(input, "project row edit"));
      input.addEventListener("change", () => {
        if (input.classList.contains("region-input")) tr.dataset.region = input.value;
        const coordinateField = input.classList.contains("lon-input") ? "Lon" : input.classList.contains("lat-input") ? "Lat" : "";
        if (coordinateField) {
          if (toNumber(input.value) !== "") input.value = formatProjectCoordinate(input.value);
          tr.dataset[`coord${coordinateField}`] = input.value;
        }
        handleRowEdit(input);
      });
      input.addEventListener("blur", () => clearInputUndoCapture(input));
    });
    tr.querySelectorAll("input[type='text'],input[type='number']").forEach(input => {
      input.addEventListener("input", () => handleRowEdit(input));
    });
    syncProjectRowRegionInput(tr);
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
    mountProjectRowCityField(tr);
    updateRowAnnotationPreview(tr);
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
    if (!shouldRenderPreviewNow()) {
      scheduleRender(options);
      return;
    }
    const renderOptions = mergeRenderOptions(pendingPreviewRefreshOptions, options);
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

  function setPreviewCell(tr, selector, value) {
    const cell = tr && tr.querySelector(selector);
    if (!cell) return;
    cell.textContent = value;
    cell.title = value;
  }

  function syncAnchorCoordinateInputs(tr, row = null) {
    if (!tr) return;
    const current = row || readRowElement(tr);
    const useRegion = isRegionLocationMode();
    const lonInput = tr.querySelector(".lon-input");
    const latInput = tr.querySelector(".lat-input");
    if (lonInput) {
      if (!useRegion) tr.dataset.coordLon = lonInput.value;
      lonInput.disabled = useRegion;
      lonInput.value = useRegion ? "" : tr.dataset.coordLon || lonInput.value;
    }
    if (latInput) {
      if (!useRegion) tr.dataset.coordLat = latInput.value;
      latInput.disabled = useRegion;
      latInput.value = useRegion ? "" : tr.dataset.coordLat || latInput.value;
    }
    tr.classList.toggle("is-region-anchored", Boolean(useRegion));
    tr.classList.toggle("is-city-anchored", isCityLocationMode());
  }

  function updateRowAnnotationPreview(tr, row = null) {
    if (!tr) return;
    const current = row || readRowElement(tr);
    syncAnchorCoordinateInputs(tr, current);
    setPreviewCell(tr, ".anchor-preview-text", getAnchorPreview(current));
    setPreviewCell(tr, ".label-preview-text", getLabelStylePreview(current));
  }
  function getRows() {
    return getTableRows()
      .map(readRowElement)
      .filter(row => row && (
        row.name.length > 0
        || row.nameFr.length > 0
        || row.lon !== ""
        || row.lat !== ""
        || row.region !== ""
        || row.cityId !== ""
        || row.content.length > 0
      ));
  }

  function getProjectRowState(tr) {
    const row = readRowElement(tr);
    const hasName = Boolean(row && row.name);
    const hasLon = row && row.lon !== "";
    const hasLat = row && row.lat !== "";
    const hasAnyCoordinate = Boolean(hasLon || hasLat);
    const hasBothCoordinates = Boolean(hasLon && hasLat);
    const hasRegionAnchor = Boolean(row && row.anchor === "region" && row.region);
    const hasCityAnchor = Boolean(row && row.anchor === "city" && row.cityId && hasBothCoordinates);
    const isRegionMode = isRegionLocationMode();
    const isCityMode = isCityLocationMode();
    const isBlank = !hasName && !hasAnyCoordinate && !hasRegionAnchor && !(row && row.cityId);
    const isMissingCoordinate = row && !isBlank && (isRegionMode ? !hasRegionAnchor : isCityMode ? !hasCityAnchor : hasAnyCoordinate && !hasBothCoordinates);
    const isCallout = row && !isRegionMode && !isCityMode && !isBlank && hasName && !hasAnyCoordinate;
    const isMapped = !isBlank && (isRegionMode ? hasRegionAnchor : isCityMode ? hasCityAnchor : hasBothCoordinates);
    return { isBlank, isMapped, isCallout, isMissingCoordinate, row };
  }

  function isProjectStatusInput(input) {
    return input.classList.contains("name-input")
      || input.classList.contains("lon-input")
      || input.classList.contains("lat-input")
      || input.classList.contains("region-input")
      || input.classList.contains("cityLocationInput");
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
      .filter(row => row && (isRegionLocationMode()
        ? row.anchor === "region" && !row.region && (row.name || row.nameFr)
        : isCityLocationMode()
          ? row.anchor === "city" && !row.cityId && (row.name || row.nameFr)
          : ((row.lon === "") !== (row.lat === ""))));
  }

  function updatePreviewState() {
    const hasRows = getRows().length > 0;
    const showMap = hasRows || emptyBaselayerPreviewEnabled;
    const issueRows = getCoordinateIssueRows();
    if (els.mapHost) {
      els.mapHost.classList.toggle("is-empty-preview", !showMap);
    }
    if (els.previewEmptyState) {
      els.previewEmptyState.hidden = showMap;
    }
    if (els.canvasPlaceholder) {
      els.canvasPlaceholder.hidden = showMap;
      updateCanvasPlaceholderSize();
    }
    if (els.canvasEmptyActions) {
      els.canvasEmptyActions.hidden = hasRows;
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

  function loadSampleData() {
    pushAppUndoHistory("load sample data");
    Object.keys(mapDetails).forEach(key => {
      mapDetails[key] = String(sampleMapDetails[key] || "");
    });
    regionFills = { ...regionFills, ...sampleRegionFills };
    regionColourOverrides = Object.fromEntries(Object.keys(sampleRegionFills).map(regionId => [regionId, true]));
    setRows(sampleRows);
    document.title = mapDetails[currentMapLanguage === "fr" ? "titleFr" : "titleEn"] || "Plotypus";
    updateMapDetailsState();
    setDocumentPropertiesContext();
    setStatusMessage(t("status.sampleLoaded"), "ok");
  }

  function handleEmptyStateAction(event) {
    const button = event.target.closest("[data-empty-action]");
    if (!button) return;
    const action = button.dataset.emptyAction;
    if (action === "load-sample") {
      loadSampleData();
      return;
    }
    if (action === "add-project") {
      setActiveDataTab("projects");
      els.addRowBtn?.click();
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
    const regionInput = tr.querySelector(".region-input");
    const cityInput = tr.querySelector(".cityLocationInput");
    const target = isRegionLocationMode() && regionInput && !regionInput.value
      ? regionInput
      : isCityLocationMode() && cityInput && !tr.dataset.cityId
        ? cityInput
        : lonInput && lonInput.value === ""
          ? lonInput
          : latInput && latInput.value === ""
            ? latInput
            : tr.querySelector(".name-input");
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
      const lonInput = tr.querySelector(".lon-input");
      const latInput = tr.querySelector(".lat-input");
      const regionInput = tr.querySelector(".region-input");
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
      if (lonInput) lonInput.setAttribute("aria-label", t("table.longitude"));
      if (latInput) latInput.setAttribute("aria-label", t("table.latitude"));
      if (regionInput) regionInput.setAttribute("aria-label", t("properties.field.region"));
      if (hideLineInput) hideLineInput.setAttribute("aria-label", t("properties.field.hideLeaderLine"));
      if (elbowLeaderInput) elbowLeaderInput.setAttribute("aria-label", t("properties.field.useElbowLeader"));
      if (selectInput) selectInput.setAttribute("aria-label", t("table.selectRow"));
      updateRowAnnotationPreview(tr, state.row);
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
      const searchableText = normalizeComparableText([
        state.row && state.row.name,
        state.row && state.row.nameFr,
        state.row && getCategoryLabel(state.row.type, currentUiLanguage),
        state.row && state.row.cityName,
        state.row && state.row.cityNameFr,
        state.row && state.row.region
      ].filter(Boolean).join(" "));
      const matchesSearch = !activeProjectSearch || searchableText.includes(activeProjectSearch);
      tr.hidden = !rowMatchesProjectFilter(state) || !matchesSearch;
      if (!tr.hidden) visibleRows += 1;

      const badge = tr.querySelector(".row-validation-badge");
      const statusBadge = tr.querySelector(".row-status-badge");
      let statusText = "";
      let statusState = "blank";
      let statusTitle = "";
      if (badge) {
        if (state.isMissingCoordinate) {
          badge.textContent = t(isCityLocationMode() ? "table.status.missingCity" : "table.status.missingCoordinate");
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
      const filterSuffix = activeProjectFilter === "all" && !activeProjectSearch ? "" : t("project.summary.shownSuffix", { count: visibleRows });
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
    if (els.projectFilterSelect) {
      const allOption = els.projectFilterSelect.querySelector('option[value="all"]');
      const missingOption = els.projectFilterSelect.querySelector('option[value="missing"]');
      const calloutsOption = els.projectFilterSelect.querySelector('option[value="callouts"]');
      if (allOption) allOption.textContent = t("toolbar.filters.allCount", { count: dataRows });
      if (missingOption) {
        missingOption.textContent = t(isRegionLocationMode()
          ? "toolbar.filters.missingRegionsCount"
          : isCityLocationMode()
            ? "toolbar.filters.missingCitiesCount"
            : "toolbar.filters.missingCoordinatesCount", { count: missingRows });
      }
      if (calloutsOption) calloutsOption.textContent = t("toolbar.filters.noCoordinateCalloutsCount", { count: calloutRows });
      els.projectFilterSelect.value = activeProjectFilter;
    }
    if (els.projectFilterControl) els.projectFilterControl.hidden = rows.length === 0;
    if (els.projectSearchControl) els.projectSearchControl.hidden = rows.length === 0;
    if (els.clearRowsBtn) els.clearRowsBtn.disabled = rows.length === 0;
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
      lon: isRegionLocationMode() ? "" : toNumber(tr.querySelector(".lon-input").value),
      lat: isRegionLocationMode() ? "" : toNumber(tr.querySelector(".lat-input").value),
      anchor: getProjectLocationAnchor(),
      region: String(tr.querySelector(".region-input")?.value || tr.dataset.region || "").trim(),
      cityId: String(tr.dataset.cityId || "").trim(),
      cityName: String(tr.dataset.cityName || "").trim(),
      cityNameFr: String(tr.dataset.cityNameFr || "").trim(),
      cityProvince: String(tr.dataset.cityProvince || "").trim(),
      labelStyle: normalizeLabelStyle(tr.dataset.labelStyle),
      content: normalizeAnnotationContent(tr.dataset.content),
      labelBorder: tr.dataset.labelBorder === "true",
      hideLine: tr.querySelector(".hide-line-input").checked,
      elbowLeader: tr.querySelector(".elbow-leader-input")?.checked || false,
      leaderLineWidth: normalizeLeaderLineWidthOverride(tr.querySelector(".leader-line-width-input")?.value),
      leaderLineColour: normalizeHexColour(tr.querySelector(".leader-line-colour-input")?.value, ""),
      labelMaxChars: normalizeLabelMaxCharsOverride(tr.dataset.labelMaxChars)
    };
  }

  function updateProjectRowField(rowId, field, value, options = {}) {
    const tr = getRowElementById(rowId);
    if (!tr) return null;
    if (field === "cityId") {
      const city = getProjectCityById(value);
      return applyProjectCitySelection(tr, city, { status: options.status, refreshProperties: options.refreshProperties });
    }
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
    if (field === "lon") {
      tr.dataset.coordLon = formatProjectCoordinate(value);
      tr.querySelector(".lon-input").value = tr.dataset.coordLon;
    }
    if (field === "lat") {
      tr.dataset.coordLat = formatProjectCoordinate(value);
      tr.querySelector(".lat-input").value = tr.dataset.coordLat;
    }
    if ((field === "lon" || field === "lat") && !isCityLocationMode()) {
      tr.dataset.cityId = "";
      tr.dataset.cityName = "";
      tr.dataset.cityNameFr = "";
      tr.dataset.cityProvince = "";
      projectRowCityControllers.get(String(rowId))?.setValue("");
    }
    if (field === "anchor") tr.dataset.anchor = getProjectLocationAnchor();
    if (field === "region") {
      tr.dataset.region = String(value || "").trim();
      const regionInput = tr.querySelector(".region-input");
      if (regionInput) regionInput.value = tr.dataset.region;
    }
    if (field === "labelStyle") tr.dataset.labelStyle = normalizeLabelStyle(value);
    if (field === "content") tr.dataset.content = annotationArrayToDataset(normalizeAnnotationContent(value));
    if (field === "labelBorder") tr.dataset.labelBorder = value ? "true" : "false";
    if (field === "hideLine") tr.querySelector(".hide-line-input").checked = Boolean(value);
    if (field === "elbowLeader") tr.querySelector(".elbow-leader-input").checked = Boolean(value);
    if (field === "leaderLineWidth") tr.querySelector(".leader-line-width-input").value = normalizeLeaderLineWidthOverride(value);
    if (field === "leaderLineColour") tr.querySelector(".leader-line-colour-input").value = normalizeHexColour(value, "");
    if (field === "labelMaxChars") tr.dataset.labelMaxChars = normalizeLabelMaxCharsOverride(value);
    updateRowTitles(tr);
    updateRowAnnotationPreview(tr);
    if (field === "lon" || field === "lat" || field === "anchor" || field === "region") syncCoordinateClearButtons(tr);
    if (options.refreshTableUx !== false && (["lon", "lat", "anchor", "region", "labelStyle", "content"].includes(field) || (field === "name" && activeDataTable !== "translate"))) scheduleProjectTableUxRefresh();
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
    if (!cell || !getSelectableProjectCellFields().includes(cell.dataset.cellField)) return null;
    const row = cell.closest("tr");
    if (!row || !row.dataset.rowId) return null;
    return { row, cell, rowId: row.dataset.rowId, field: cell.dataset.cellField };
  }

  function getProjectCellRange(anchor, target) {
    if (!anchor || !target) return [];
    const rows = getTableRows();
    const startRow = rows.findIndex(row => row.dataset.rowId === String(anchor.rowId));
    const endRow = rows.findIndex(row => row.dataset.rowId === String(target.rowId));
    const activeFields = getSelectableProjectCellFields();
    const startField = activeFields.indexOf(anchor.field);
    const endField = activeFields.indexOf(target.field);
    if (startRow < 0 || endRow < 0 || startField < 0 || endField < 0) return [];
    const rowMin = Math.min(startRow, endRow);
    const rowMax = Math.max(startRow, endRow);
    const fieldMin = Math.min(startField, endField);
    const fieldMax = Math.max(startField, endField);
    const keys = [];
    for (let rowIndex = rowMin; rowIndex <= rowMax; rowIndex += 1) {
      for (let fieldIndex = fieldMin; fieldIndex <= fieldMax; fieldIndex += 1) {
        keys.push(getProjectCellKey(rows[rowIndex].dataset.rowId, activeFields[fieldIndex]));
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
    const hasCoordinate = selectedFields.some(field => field === "lon" || field === "lat" || field === "region");
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

  function clearSelectedCoordinateCells() {
    const keys = Array.from(selectedProjectCells).filter(key => {
      const field = parseProjectCellKey(key).field;
      return field === "lon" || field === "lat" || field === "region" || field === "city";
    });
    if (!keys.length) return;
    pushAppUndoHistory(isRegionLocationMode() ? "bulk region clear" : isCityLocationMode() ? "bulk city clear" : "bulk coordinate clear");
    keys.forEach(key => {
      const { rowId, field } = parseProjectCellKey(key);
      updateProjectRowField(rowId, field === "city" ? "cityId" : field, "", { status: false, refreshProperties: false });
    });
    requestPreviewRefresh();
    refreshProjectTableUx();
    refreshProjectCellSelectionUi();
    setStatusMessage(t("status.clearedCoordinateCells", { count: keys.length }), "ok");
  }

  function highlightActiveProjectRow(rowId) {
    getTableRows().forEach(tr => {
      const isActive = Boolean(rowId) && tr.dataset.rowId === String(rowId);
      tr.classList.toggle("is-active-row", isActive);
      tr.setAttribute("aria-selected", String(isActive));
      tr.querySelectorAll("input:not([type='hidden']):not(.row-select), select, textarea, .project-city-cell-field").forEach(control => {
        control.setAttribute("aria-readonly", String(!isActive));
        if (control.matches("input[type='text'], input[type='number'], textarea")) control.readOnly = !isActive;
        if (control.matches("input, select, textarea")) control.tabIndex = isActive ? 0 : -1;
      });
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

  function setProjectSearch(value = "") {
    activeProjectSearch = normalizeComparableText(value);
    refreshProjectTableUx();
  }

  function clickProjectFilter(filter) {
    setProjectFilter(filter);
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
    const summary = workspace.getQualitySummary(report, pluralize, {
      notChecked: t("summary.qualityNotChecked"),
      ready: t("summary.qualityReady"),
      issueSingular: t("summary.issueSingular"),
      issuePlural: t("summary.issuePlural"),
      issueCount: count => t("summary.issueCount", {
        count,
        label: count === 1 ? t("summary.issueSingular") : t("summary.issuePlural")
      })
    });
    if (qualityRefreshError) {
      return {
        ...summary,
        value: t("summary.qualityUnavailable"),
        state: "warning",
        issues: 0,
        unavailable: true
      };
    }
    return isQualityRefreshPending()
      ? { ...summary, value: t("summary.qualityChecking"), state: "neutral", issues: 0, pending: true }
      : summary;
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
    const qualityUnavailable = qualitySummary.pending || qualitySummary.unavailable;
    const overviewChips = [
      summaryChip(t("summary.rows"), String(rowSummary.total), rowSummary.total ? "ok" : "warning"),
      summaryChip(t("summary.mapped"), String(rowSummary.mapped), rowSummary.mapped ? "ok" : "neutral"),
      summaryChip(t("summary.regions"), regionSummary.value, regionSummary.state)
    ];
    const reviewChip = summaryChip(
        t("summary.toReview"),
        qualityUnavailable ? qualitySummary.value : String(reviewCount),
        qualityUnavailable ? qualitySummary.state : reviewCount ? "warning" : "ok",
        qualityUnavailable ? "" : "quality",
        qualityUnavailable ? t("summary.openQuality") : t("summary.openQualityCount", { count: reviewCount }),
        "workspaceReviewBtn"
      );
    els.workspaceSummaryMetrics.innerHTML = `<div class="workspace-summary-overview">${overviewChips.join("")}</div>${reviewChip}`;
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

  function setProjectSaveState(state = "dirty") {
    projectSaveState = ["new", "dirty", "saved"].includes(state) ? state : "dirty";
    if (!els.projectSaveState) return;
    const label = t(`save.state.${projectSaveState}`);
    els.projectSaveState.dataset.state = projectSaveState;
    els.projectSaveState.textContent = label;
    els.projectSaveState.title = label;
    if (els.ribbonSaveProjectBtn) {
      els.ribbonSaveProjectBtn.classList.toggle("has-unsaved-changes", projectSaveState === "dirty");
      els.ribbonSaveProjectBtn.setAttribute("aria-describedby", "projectSaveState");
    }
  }

  const referenceCityProvinceNames = Object.freeze({
    en: Object.freeze({
      AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
      NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
      NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
      SK: "Saskatchewan", YT: "Yukon"
    }),
    fr: Object.freeze({
      AB: "Alberta", BC: "Colombie-Britannique", MB: "Manitoba", NB: "Nouveau-Brunswick",
      NL: "Terre-Neuve-et-Labrador", NS: "Nouvelle-Écosse", NT: "Territoires du Nord-Ouest",
      NU: "Nunavut", ON: "Ontario", PE: "Île-du-Prince-Édouard", QC: "Québec",
      SK: "Saskatchewan", YT: "Yukon"
    })
  });

  function cloneReferenceCities(value) {
    return referenceCitiesApi
      ? referenceCitiesApi.cloneModel(value)
      : JSON.parse(JSON.stringify(value || { ids: [], overrides: {}, rule: null, style: "default" }));
  }

  function normalizeBaselayerState(value, boundary = currentBoundary) {
    const projectFile = window.PlotypusProjectFile;
    if (projectFile && typeof projectFile.normalizeBaselayer === "function") {
      return projectFile.normalizeBaselayer(value, boundary, boundarySources);
    }
    return {
      id: boundary,
      geometrySource: boundary,
      projection: boundarySources[boundary] && boundarySources[boundary].projection || boundary,
      referenceCities: cloneReferenceCities(value && value.referenceCities)
    };
  }

  function syncBaselayerBoundary(boundary = currentBoundary) {
    baselayer = normalizeBaselayerState({
      ...baselayer,
      id: boundary,
      geometrySource: boundary,
      projection: boundarySources[boundary] && boundarySources[boundary].projection || boundary
    }, boundary);
  }

  function getReferenceCityProvinceName(city, language = currentUiLanguage) {
    const names = referenceCityProvinceNames[language] || referenceCityProvinceNames.en;
    return names[city.prov] || city.prov;
  }

  function getIndexedCityById(id) {
    return indexedReferenceCities.find(city => city.id === String(id || "")) || null;
  }

  function getCityRegionId(city) {
    if (!city || currentBoundary !== "canada" || !cityIntegration) return "";
    return cityIntegration.resolveRegionId(city, getRegionRows(), getRegionIdForPoint);
  }

  function getProjectCityById(id) {
    return cityIntegration
      ? cityIntegration.getCityById(indexedReferenceCities, id)
      : getIndexedCityById(id);
  }

  function getProjectCityFallbackLabel(row) {
    if (!row) return "";
    const name = currentUiLanguage === "fr" ? row.cityNameFr || row.cityName : row.cityName || row.cityNameFr;
    const province = cityIntegration && cityIntegration.getProvinceName(row.cityProvince) || row.cityProvince || "";
    return [name, province].filter(Boolean).join(", ");
  }

  function syncActiveProjectCityProperties(tr, row, sourceController = null) {
    if (!tr || !row || !activePropertiesSelection || String(activePropertiesSelection.rowId || "") !== String(tr.dataset.rowId || "")) return;
    if (propertiesProjectCityController && propertiesProjectCityController !== sourceController) {
      propertiesProjectCityController.setValue(row.cityId, getProjectCityFallbackLabel(row));
    }
    const regionInput = els.propertiesSelectionControls?.querySelector('[data-city-derived="region"]');
    const coordinatesInput = els.propertiesSelectionControls?.querySelector('[data-city-derived="coordinates"]');
    const status = els.propertiesSelectionControls?.querySelector(".properties-record-status");
    if (regionInput) regionInput.value = row.region ? getRegionNameById(row.region) : "";
    if (coordinatesInput) coordinatesInput.value = row.lon !== "" && row.lat !== "" ? `${row.lat}, ${row.lon}` : "";
    if (status) status.firstChild.textContent = `${getProjectRowPropertyStatus(row)} `;
  }

  function applyProjectCitySelection(tr, city, options = {}) {
    if (!tr) return null;
    if (city) {
      const regionId = getCityRegionId(city);
      tr.dataset.cityId = String(city.id || "");
      tr.dataset.cityName = String(city.name || "");
      tr.dataset.cityNameFr = String(city.name_fr || city.name || "");
      tr.dataset.cityProvince = String(city.prov || "");
      tr.dataset.coordLon = formatProjectCoordinate(city.lon);
      tr.dataset.coordLat = formatProjectCoordinate(city.lat);
      tr.dataset.region = regionId;
      tr.querySelector(".lon-input").value = tr.dataset.coordLon;
      tr.querySelector(".lat-input").value = tr.dataset.coordLat;
      if (regionId) regionVisibility[regionId] = true;
    } else {
      tr.dataset.cityId = "";
      tr.dataset.cityName = "";
      tr.dataset.cityNameFr = "";
      tr.dataset.cityProvince = "";
      tr.dataset.coordLon = "";
      tr.dataset.coordLat = "";
      tr.dataset.region = "";
      tr.querySelector(".lon-input").value = "";
      tr.querySelector(".lat-input").value = "";
    }
    tr.dataset.anchor = "city";
    syncProjectRowRegionInput(tr);
    const row = readRowElement(tr);
    const rowController = projectRowCityControllers.get(String(tr.dataset.rowId));
    if (rowController && rowController !== options.sourceController) {
      rowController.setValue(row.cityId, getProjectCityFallbackLabel(row));
    }
    if (options.deferRefresh) return row;
    updateRowAnnotationPreview(tr, row);
    syncCoordinateClearButtons(tr);
    refreshProjectTableUx();
    if (canadaGeo && Array.isArray(canadaGeo.features)) applyRegionColoursByValue(false, { refreshRowsOnly: true });
    if (options.refreshProperties !== false) syncActiveProjectCityProperties(tr, row, options.sourceController);
    requestPreviewRefresh();
    if (options.status !== false) {
      const name = row.name || row.nameFr || t("status.unnamedPoint");
      setStatusMessage(city
        ? t("status.projectCityAssigned", { name, city: cityIntegration.getCityLabel(city, currentUiLanguage) })
        : t("status.projectCityCleared", { name }), "ok");
    }
    return row;
  }

  function createSingleProjectCityController(root, rowId, options = {}) {
    if (!root || !referenceCitiesApi || typeof referenceCitiesApi.createSingleField !== "function") return null;
    const tr = getRowElementById(rowId) || options.rowElement;
    if (!tr) return null;
    let controller = null;
    controller = referenceCitiesApi.createSingleField({
      root,
      value: tr.dataset.cityId,
      fallbackLabel: getProjectCityFallbackLabel(readRowElement(tr)),
      compact: options.compact === true,
      search: referenceCitySearch,
      indexedCities: indexedReferenceCities,
      idPrefix: options.idPrefix || `projectRowCity${rowId}`,
      getLanguage: () => currentUiLanguage,
      getProvinceName: getReferenceCityProvinceName,
      t,
      onBeforeChange() {
        pushAppUndoHistory("project city edit");
      },
      onChange(city) {
        applyProjectCitySelection(tr, city, { sourceController: controller });
      }
    });
    return controller;
  }

  function mountProjectRowCityField(tr) {
    if (!tr) return;
    const rowId = String(tr.dataset.rowId || "");
    projectRowCityControllers.get(rowId)?.destroy();
    const root = tr.querySelector(".project-city-cell-field");
    const controller = createSingleProjectCityController(root, rowId, {
      rowElement: tr,
      compact: true,
      idPrefix: `projectRowCity${rowId}`
    });
    if (controller) projectRowCityControllers.set(rowId, controller);
  }

  function mountPropertiesProjectCityField(rowId) {
    propertiesProjectCityController?.destroy();
    propertiesProjectCityController = null;
    const root = els.propertiesSelectionControls && els.propertiesSelectionControls.querySelector("#projectCityPropertiesField");
    if (!root || !rowId) return;
    propertiesProjectCityController = createSingleProjectCityController(root, String(rowId), {
      idPrefix: `propertiesProjectCity${rowId}`
    });
  }

  function ensureCityRegionsIncluded(ids) {
    const enabled = [];
    (ids || []).forEach(id => {
      const city = getIndexedCityById(id);
      const regionId = getCityRegionId(city);
      if (!regionId || regionVisibility[regionId] !== false) return;
      regionVisibility[regionId] = true;
      enabled.push(regionId);
    });
    return enabled;
  }

  function createReferenceCitiesController(root, model, options = {}) {
    if (!root || !referenceCitiesApi || !referenceCitySearch) return null;
    return referenceCitiesApi.createField({
      root,
      model,
      search: referenceCitySearch,
      indexedCities: indexedReferenceCities,
      idPrefix: options.idPrefix,
      allowOverrides: options.allowOverrides,
      textKeys: options.textKeys,
      getExcludedIds: options.getExcludedIds,
      getLanguage: () => currentUiLanguage,
      getProvinceName: getReferenceCityProvinceName,
      t,
      onBeforeChange: options.onBeforeChange,
      onChange: options.onChange
    });
  }

  function mountStartupReferenceCitiesField() {
    startupReferenceCitiesController?.destroy();
    startupReferenceCitiesController = createReferenceCitiesController(els.startupReferenceCitiesField, startupReferenceCities, {
      idPrefix: "refCity",
      allowOverrides: false,
      onChange(value) {
        startupReferenceCities = cloneReferenceCities(value);
      }
    });
  }

  function mountBaselayerReferenceCitiesField() {
    baselayerReferenceCitiesController?.destroy();
    baselayerReferenceCitiesController = createReferenceCitiesController(els.baselayerReferenceCitiesField, baselayer.referenceCities, {
      idPrefix: "baselayerRefCity",
      allowOverrides: true,
      onBeforeChange() {
        pushAppUndoHistory("reference cities edit");
      },
      onChange(value) {
        baselayer.referenceCities = cloneReferenceCities(value);
        ensureCityRegionsIncluded(value.ids);
        if (canadaGeo && Array.isArray(canadaGeo.features)) applyRegionColoursByValue(false);
        requestPreviewRefresh();
      }
    });
  }

  function mountProjectCitiesField() {
    projectCitiesController?.destroy();
    projectCitiesController = createReferenceCitiesController(els.projectCitiesField, pendingProjectCities, {
      idPrefix: "projectCity",
      allowOverrides: false,
      textKeys: {
        label: "projectCities.label",
        optional: "projectCities.optional",
        placeholder: "projectCities.placeholder",
        hintDefault: "projectCities.hint.default",
        hintCount: "projectCities.hint.count",
        hintMissing: "projectCities.hint.missing",
        noMatchBefore: "projectCities.noMatch.before",
        noMatchAfter: "projectCities.noMatch.after"
      },
      onChange(value) {
        pendingProjectCities = cloneReferenceCities(value);
        if (els.catalogAddPointsBtn) els.catalogAddPointsBtn.disabled = pendingProjectCities.ids.length === 0;
      }
    });
  }

  function refreshReferenceCitiesFields() {
    startupReferenceCitiesController?.refresh();
    baselayerReferenceCitiesController?.refresh();
    projectCitiesController?.refresh();
    projectRowCityControllers.forEach(controller => controller.refresh());
    propertiesProjectCityController?.refresh();
  }

  function translateUndoLabel(label, fallbackKey = "status.lastEdit") {
    if (!label) return t(fallbackKey);
    const exact = tOr(`status.undo.${label}`, null);
    if (exact) return exact;
    if (label.startsWith("label move: ")) {
      return t("status.undo.labelMove", { label: label.slice("label move: ".length) || t("status.unnamedPoint") });
    }
    const boxMatch = String(label).match(/^box:(legend|callouts):(reset|move|resize)$/);
    if (boxMatch) {
      const objectKey = `properties.furniture.${boxMatch[1]}`;
      return t("status.undo.furnitureAction", {
        label: t(objectKey),
        action: t(`status.undo.action.${boxMatch[2]}`)
      });
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

  function getBoxHistoryLabel(key, action) {
    const object = key === "legend" || key === "callouts" ? key : "";
    return object ? `box:${object}:${action}` : action;
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
    currentUiLanguage = nextLanguage;
    document.documentElement.lang = nextLanguage;
    if (i18n && typeof i18n.applyStaticTranslations === "function") {
      i18n.applyStaticTranslations(nextLanguage, document);
    }
    renderRibbonIcons();
    feedbackComposer?.update();
    renderBookSizeOptions();
    renderImageSizeOptions();
    renderFontOptions();
    renderMapStyleOptions();
    renderStartupSetupSelectOptions();
    renderRegionPresetOptions();
    renderRegionStatusVisibilityControls();
    renderCategoryEditors();
    updateCanvasToolbar();
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
    if (els.confirmationDialog && !els.confirmationDialog.hidden && pendingConfirmation) {
      renderConfirmationDialog();
    }
    refreshReferenceCitiesFields();
    setProjectSaveState(projectSaveState);
  }

  function setAuthoringLanguage(language) {
    const nextLanguage = language === "fr" ? "fr" : "en";
    if (nextLanguage === activeAuthoringLanguage) {
      syncAuthoringLanguageControls(nextLanguage);
      updateTypeOptions();
      updateProjectCoordinateDisplay();
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
    refreshProjectTableUx();
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
    const annotationEntries = getRows().flatMap(row => {
      const contentEntries = normalizeAnnotationContent(row.content).flatMap((block, index) => {
        if (block.type === "heading" || block.type === "text" || block.type === "bullet") {
          return [{
            id: `content-element:${row.rowId}:${index}`,
            group: "annotations",
            groupLabel: t("translate.group.annotations"),
            ref: block.value && block.value.en || "",
            fr: block.value && block.value.fr || "",
            rowId: row.rowId,
            index,
            kind: "content-element"
          }];
        }
        if (block.type === "paragraph") {
          return [{
            id: `content-paragraph:${row.rowId}:${index}`,
            group: "annotations",
            groupLabel: t("translate.group.annotations"),
            ref: block.en || "",
            fr: block.fr || "",
            rowId: row.rowId,
            index,
            kind: "content-paragraph"
          }];
        }
        if (block.type === "bullets") {
          return (block.items || []).map((item, itemIndex) => ({
            id: `content-bullet:${row.rowId}:${index}:${itemIndex}`,
            group: "annotations",
            groupLabel: t("translate.group.annotations"),
            ref: item.en || "",
            fr: item.fr || "",
            rowId: row.rowId,
            index,
            itemIndex,
            kind: "content-bullet"
          }));
        }
        if (block.type === "image") {
          const entry = getImageCaptionTranslationEntry(block, row.rowId, index);
          return entry ? [entry] : [];
        }
        return [];
      });
      return contentEntries;
    });
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
    return [...projectEntries, ...annotationEntries, ...categoryEntries, ...chromeEntries];
  }

  function getImageCaptionTranslationEntry(block, rowId, index) {
    const englishCaption = String(block && block.caption && block.caption.en || "").trim();
    const frenchCaption = String(block && block.caption && block.caption.fr || "").trim();
    if (!englishCaption && !frenchCaption) return null;
    return {
      id: `content-image:${rowId}:${index}`,
      group: "annotations",
      groupLabel: t("translate.group.annotations"),
      ref: englishCaption,
      fr: frenchCaption,
      rowId,
      index,
      kind: "content-image"
    };
  }

  function getTranslationSummary() {
    const entries = getTranslationEntries();
    const missing = entries.filter(entry => !String(entry.ref || "").trim() || !String(entry.fr || "").trim()).length;
    return {
      total: entries.length,
      complete: entries.length - missing,
      missing,
      projectTotal: entries.filter(entry => entry.group === "projects" || entry.group === "annotations").length,
      projectMissing: entries.filter(entry => (entry.group === "projects" || entry.group === "annotations") && (!String(entry.ref || "").trim() || !String(entry.fr || "").trim())).length
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
    return ["projects", "annotations", "categories", "chrome", "footnotes"];
  }

  function writeTranslationEntry(entryId, value, language = "fr") {
    const [kind, id] = String(entryId || "").split(":");
    const nextValue = String(value || "").trim();
    const editingFrench = language !== "en";
    if (kind === "project") {
      updateProjectRowField(id, editingFrench ? "nameFr" : "name", nextValue);
    } else if (kind === "content-element" || kind === "content-paragraph" || kind === "content-bullet" || kind === "content-image") {
      const parts = String(entryId || "").split(":");
      const rowId = parts[1];
      const blockIndex = Number(parts[2]);
      const itemIndex = Number(parts[3]);
      const row = readRowElement(getRowElementById(rowId));
      if (row && Number.isInteger(blockIndex)) {
        const content = normalizeAnnotationContent(row.content);
        const block = content[blockIndex];
        if (block && kind === "content-element" && block.value) block.value[editingFrench ? "fr" : "en"] = nextValue;
        if (block && kind === "content-paragraph") block[editingFrench ? "fr" : "en"] = nextValue;
        if (block && kind === "content-image") block.caption[editingFrench ? "fr" : "en"] = nextValue;
        if (block && kind === "content-bullet" && Number.isInteger(itemIndex) && block.items[itemIndex]) {
          block.items[itemIndex][editingFrench ? "fr" : "en"] = nextValue;
        }
        updateProjectRowField(rowId, "content", content);
      }
    } else if (kind === "category") {
      const category = categorySettings.find(item => item.id === id);
      if (category) category[editingFrench ? "labelFr" : "label"] = nextValue;
    } else if (kind === "chrome" && chromeTranslations[id]) {
      chromeTranslations[id][editingFrench ? "fr" : "en"] = nextValue;
    }
    updateWorkspaceSummary();
    updateExportLanguageNotice();
    if (activeDataTable === "translate") renderTranslationProgressOnly();
    requestPreviewRefresh(translationPreviewRenderOptions());
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
    const visibleEntryIds = groups.flatMap(group => (activeTranslationFilter === "missing"
      ? group.entries.filter(entry => getTranslationStatus(entry).state !== "done")
      : group.entries).map(entry => entry.id));
    if (!visibleEntryIds.includes(activeTranslationEntryId)) {
      activeTranslationEntryId = visibleEntryIds.find(id => {
        const entry = entries.find(item => item.id === id);
        return entry && getTranslationStatus(entry).state !== "done";
      }) || visibleEntryIds[0] || "";
    }
    els.translationGroups.innerHTML = groups.map(group => {
      const visibleEntries = activeTranslationFilter === "missing"
        ? group.entries.filter(entry => getTranslationStatus(entry).state !== "done")
        : group.entries;
      return `
        <section class="translation-group" data-translation-group="${escapeHtml(group.group)}">
          <h3 class="type-summary-heading">${escapeHtml(group.label)}</h3>
          ${visibleEntries.length ? `
            ${visibleEntries.map((entry, entryIndex) => {
              const status = getTranslationStatus(entry);
              const labelBase = entry.ref || entry.fr || entry.id;
              return `
                <div class="translation-row${status.state === "done" ? "" : " is-missing"}${status.state === "missing-en" ? " is-missing-en" : ""}${status.state === "missing-fr" ? " is-missing-fr" : ""}${entry.id === activeTranslationEntryId ? " is-active" : ""}" data-entry-id="${escapeHtml(entry.id)}" data-translation-group="${escapeHtml(group.group)}" tabindex="0">
                  <span class="translation-index" aria-hidden="true">${entryIndex + 1}</span>
                  <label class="translation-language-field">
                    <span class="translation-mobile-language">${escapeHtml(t("translate.column.english"))}</span>
                    <textarea class="translation-input translation-en-input${status.state === "missing-en" ? " is-missing-value" : ""}" rows="1" data-entry-id="${escapeHtml(entry.id)}" data-entry-lang="en" data-edit-language="en" data-translation-group="${escapeHtml(group.group)}" aria-label="${escapeHtml(t("translate.aria.enString", { label: labelBase }))}" placeholder="${escapeHtml(t("translate.placeholder.en"))}">${escapeHtml(entry.ref)}</textarea>
                  </label>
                  <label class="translation-language-field">
                    <span class="translation-mobile-language">${escapeHtml(t("translate.column.french"))}</span>
                    <textarea class="translation-input translation-fr-input${status.state === "missing-fr" ? " is-missing-value" : ""}" rows="1" data-entry-id="${escapeHtml(entry.id)}" data-entry-lang="fr" data-edit-language="fr" data-translation-group="${escapeHtml(group.group)}" aria-label="${escapeHtml(t("translate.aria.frString", { label: labelBase }))}" placeholder="${escapeHtml(t("translate.placeholder.fr"))}">${escapeHtml(entry.fr)}</textarea>
                  </label>
                  <span class="translation-status" data-state="${escapeHtml(status.state)}">${escapeHtml(status.label)}</span>
                </div>
              `;
            }).join("")}
          ` : `<p class="translation-empty type-supporting">${escapeHtml(t("translate.empty"))}</p>`}
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
    const label = tOr(
      `properties.size.image.${size.value}`,
      getLocalizedConfigLabel(size, currentUiLanguage, size.value)
    );
    return `${label} (${size.width} x ${size.height} px)`;
  }

  function formatBookSizeOption(value, preset) {
    const label = tOr(
      `properties.size.book.${value}`,
      getLocalizedConfigLabel(preset, currentUiLanguage, value)
    );
    return `${label}${t("properties.size.inches")}`;
  }

  function updateCanvasPlaceholderSize() {
    if (!els.canvasPlaceholder) return;
    const size = getImageSizePreset();
    if (!size || !Number.isFinite(Number(size.width)) || !Number.isFinite(Number(size.height))) return;
    const sizeText = els.canvasPlaceholder.querySelector(".canvas-placeholder-copy span");
    if (sizeText) {
      sizeText.dataset.i18nParams = JSON.stringify({ width: size.width, height: size.height });
      sizeText.textContent = t("properties.size.canvasPixels", { width: size.width, height: size.height });
    }
    applyCanvasViewZoomDimensions(size);
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
      `<option value="${escapeHtml(value)}">${escapeHtml(formatBookSizeOption(value, preset))}</option>`
    )).join("");
    els.bookSizeInput.value = imageSizePresets[currentValue] ? currentValue : layoutDefaults.bookSizeInput;
  }

  function renderFontOptions() {
    const fonts = fontOptions.length ? fontOptions : [{ label: "Lato", value: defaultFontFamily }];
    const currentValue = normalizeFontFamily(els.fontFamilyInput.value);
    els.fontFamilyInput.innerHTML = fonts.map((font) => (
      `<option value="${escapeHtml(font.value || font.label)}">${escapeHtml(getLocalizedConfigLabel(font, currentUiLanguage, font.value))}</option>`
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

  function renderStartupImageSizeOptions(imageSizeValue = els.startupImageSizeInput?.value) {
    if (!els.startupBookSizeInput || !els.startupImageSizeInput) return;
    const bookValue = imageSizePresets[els.startupBookSizeInput.value]
      ? els.startupBookSizeInput.value
      : layoutDefaults.bookSizeInput;
    const book = getBookSizePreset(bookValue);
    els.startupImageSizeInput.innerHTML = book.sizes.map(size => (
      `<option value="${escapeHtml(size.value)}">${escapeHtml(formatImageSizeOption(size))}</option>`
    )).join("");
    els.startupImageSizeInput.value = book.sizes.some(size => size.value === imageSizeValue)
      ? imageSizeValue
      : (book.sizes.some(size => size.value === layoutDefaults.imageSizeInput) ? layoutDefaults.imageSizeInput : book.sizes[0].value);
  }

  function renderStartupSetupSelectOptions(options = {}) {
    if (!els.startupSetupForm) return;
    const useAppValues = options.useAppValues === true;
    const mapStyleValue = useAppValues ? currentMapStylePreset : els.startupMapStyleInput.value;
    const bookSizeValue = useAppValues ? els.bookSizeInput.value : els.startupBookSizeInput.value;
    const imageSizeValue = useAppValues ? els.imageSizeInput.value : els.startupImageSizeInput.value;

    els.startupMapStyleInput.innerHTML = Object.keys(mapStylePresets).map(presetId => (
      `<option value="${escapeHtml(presetId)}">${escapeHtml(getMapStylePresetLabel(presetId, mapStylePresets[presetId]))}</option>`
    )).join("");
    els.startupMapStyleInput.value = Object.prototype.hasOwnProperty.call(mapStylePresets, mapStyleValue)
      ? mapStyleValue
      : defaultMapStylePreset;

    els.startupBookSizeInput.innerHTML = Object.entries(imageSizePresets).map(([value, preset]) => (
      `<option value="${escapeHtml(value)}">${escapeHtml(tOr(`properties.size.book.${value}`, preset.label || value))}</option>`
    )).join("");
    els.startupBookSizeInput.value = imageSizePresets[bookSizeValue] ? bookSizeValue : layoutDefaults.bookSizeInput;
    renderStartupImageSizeOptions(imageSizeValue);
  }

  function selectStartupBaselayerOption(selectedOption, options = {}) {
    if (!selectedOption) return;
    els.startupBaselayerOptions.forEach(option => {
      const selected = option === selectedOption;
      option.dataset.selected = String(selected);
      option.setAttribute("aria-checked", String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
    if (options.focus === true) selectedOption.focus({ preventScroll: true });
  }

  function getStartupBaselayerOption(boundary, preset) {
    const exact = els.startupBaselayerOptions.find(option => (
      option.dataset.boundary === boundary && option.dataset.regionPreset === preset
    ));
    if (exact) return exact;
    return els.startupBaselayerOptions.find(option => (
      option.dataset.boundary === boundary && option.dataset.regionPreset === "all"
    )) || els.startupBaselayerOptions[0];
  }

  let startupBaselayerThumbnailGeometries = null;
  let startupBaselayerThumbnailsRendered = false;
  let startupBaselayerThumbnailsLoading = null;

  function getStartupBaselayerThumbnailGeometries() {
    if (startupBaselayerThumbnailGeometries) return startupBaselayerThumbnailGeometries;
    const localBoundaries = window.PLOTYPUS_LOCAL_BOUNDARIES || {};
    const canada = localBoundaries.canada
      ? normalizeBoundaryGeoJson(localBoundaries.canada, boundarySources.canada || {})
      : null;
    const world = localBoundaries.world;
    if (!canada || !world || !Array.isArray(world.features)) return null;
    const featureCollection = features => ({ type: "FeatureCollection", features });
    startupBaselayerThumbnailGeometries = {
      canada,
      "north-america": featureCollection(world.features.filter(feature => worldFeatureMatchesPreset(feature, "north-america"))),
      "united-states": featureCollection(world.features.filter(feature => worldFeatureMatchesPreset(feature, "united-states"))),
      world,
      europe: featureCollection(world.features.filter(feature => worldFeatureMatchesPreset(feature, "europe") && getFeatureCountryCode(feature) !== "RUS")),
      arctic: featureCollection(world.features.filter(feature => worldFeatureMatchesPreset(feature, "arctic")))
    };
    return startupBaselayerThumbnailGeometries;
  }

  function createStartupBaselayerThumbnailProjection(visual, geometry) {
    const d3 = window.d3;
    const extent = [[8, 5], [172, 67]];
    if (visual === "arctic") {
      return d3.geoAzimuthalEquidistant()
        .rotate([0, -90])
        .clipAngle(89.5)
        .fitExtent(extent, { type: "Sphere" });
    }

    let projection;
    if (visual === "canada") projection = d3.geoConicConformal().parallels([49, 77]).rotate([96, 0]);
    else if (visual === "north-america") projection = d3.geoConicConformal().parallels([20, 60]).rotate([100, 0]);
    else if (visual === "united-states") projection = d3.geoAlbersUsa();
    else if (visual === "europe") projection = d3.geoMercator();
    else projection = d3.geoEqualEarth();

    let fitGeometry = geometry;
    if (visual === "north-america") {
      const compactNorthAmerica = geometry.features.filter(feature => getFeatureCountryCode(feature) !== "GRL");
      if (compactNorthAmerica.length) fitGeometry = { type: "FeatureCollection", features: compactNorthAmerica };
    }
    return projection.fitExtent(extent, fitGeometry);
  }

  async function renderStartupBaselayerThumbnails() {
    if (!window.d3 || startupBaselayerThumbnailsRendered) return;
    if (startupBaselayerThumbnailsLoading) return startupBaselayerThumbnailsLoading;
    startupBaselayerThumbnailsLoading = Promise.all(
      [boundarySources.canada, boundarySources.world]
        .filter(Boolean)
        .map(source => loadLocalBoundary(source).catch(error => {
          console.warn(`Could not load the bundled ${source.label} baselayer thumbnail.`, error);
          return null;
        }))
    );
    await startupBaselayerThumbnailsLoading;
    startupBaselayerThumbnailsLoading = null;
    const geometries = getStartupBaselayerThumbnailGeometries();
    if (!geometries) return;
    let renderedCount = 0;
    document.querySelectorAll(".startup-baselayer-preview[data-baselayer-visual]").forEach(preview => {
      const visual = preview.dataset.baselayerVisual;
      const geometry = geometries[visual];
      const svg = preview.querySelector(".startup-baselayer-map");
      if (!svg || !geometry || !Array.isArray(geometry.features) || !geometry.features.length) return;
      const projection = createStartupBaselayerThumbnailProjection(visual, geometry);
      const path = window.d3.geoPath(projection);
      if (typeof path.digits === "function") path.digits(1);
      const selection = window.d3.select(svg);
      selection.selectAll("*").remove();
      if (visual === "world" || visual === "arctic") {
        selection.append("path")
          .datum({ type: "Sphere" })
          .attr("class", "startup-baselayer-ocean")
          .attr("d", path);
        selection.append("path")
          .datum(window.d3.geoGraticule10())
          .attr("class", "startup-baselayer-graticule")
          .attr("d", path);
      }
      selection.selectAll("path.startup-baselayer-land")
        .data(geometry.features)
        .join("path")
        .attr("class", "startup-baselayer-land")
        .attr("d", path);
      renderedCount += 1;
    });
    startupBaselayerThumbnailsRendered = renderedCount === Object.keys(geometries).length;
  }

  function syncStartupSetupControls() {
    if (!els.startupSetupForm) return;
    renderStartupSetupSelectOptions({ useAppValues: true });
    els.startupLabelCharsInput.value = normalizeLabelMaxChars(els.labelCharsInput.value);
    selectStartupBaselayerOption(getStartupBaselayerOption(currentBoundary, els.regionPresetInput?.value || "all"));
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

  function getLabelMaxCharsForResize(startChars, deltaX, side, characterWidth) {
    const start = normalizeLabelMaxChars(startChars);
    const widthPerCharacter = Math.max(1, Number(characterWidth) || 1);
    const direction = side === "left" ? -1 : 1;
    return normalizeLabelMaxChars(start + direction * Number(deltaX || 0) / widthPerCharacter);
  }

  function normalizeMapScale(value) {
    const parsed = Number(value);
    const fallback = layoutDefaults.mapScaleInput;
    const mapScale = Number.isFinite(parsed) ? parsed : fallback;
    return Math.max(mapScaleRange.min, Math.min(mapScaleRange.max, mapScale));
  }

  function normalizeMarkerSize(value, fallback = layoutDefaults.markerSizeInput, minimum = 4, maximum = 30) {
    const parsed = Number(value);
    const fallbackValue = Number.isFinite(Number(fallback)) ? Number(fallback) : 4;
    const markerSize = Number.isFinite(parsed) ? parsed : fallbackValue;
    const lowerBound = Number.isFinite(Number(minimum)) ? Number(minimum) : 4;
    const upperBound = Number.isFinite(Number(maximum)) ? Number(maximum) : 30;
    return Math.max(lowerBound, Math.min(upperBound, Math.round(markerSize)));
  }

  function getMarkerSizeDraftState(input) {
    const editor = input && input.closest("[data-marker-size-editor]");
    if (!editor) return null;
    const scope = editor.dataset.markerSizeEditor === "category" ? "category" : "global";
    const minimum = Number(input.min) || Number(editor.dataset.minimum) || 4;
    const maximum = Number(input.max) || Number(editor.dataset.maximum) || (scope === "category" ? 30 : 20);
    const step = Number(input.step) || Number(editor.dataset.step) || 1;
    const rawValue = String(input.value || "").trim();
    const numericValue = Number(rawValue);
    const valid = rawValue !== ""
      && Number.isFinite(numericValue)
      && numericValue >= minimum
      && numericValue <= maximum
      && Math.abs((numericValue - minimum) / step - Math.round((numericValue - minimum) / step)) < 1e-9;
    const normalizedValue = normalizeMarkerSize(rawValue, layoutDefaults.markerSizeInput, minimum, maximum);
    const committedValue = normalizeMarkerSize(editor.dataset.committedValue, layoutDefaults.markerSizeInput, minimum, maximum);
    const effectiveValue = valid ? normalizedValue : committedValue;
    return {
      changed: valid && normalizedValue !== committedValue,
      committedValue,
      editor,
      effectiveValue,
      input,
      maximum,
      minimum,
      normalizedValue,
      scope,
      valid
    };
  }

  function getMarkerSizePreviewCategory(scope, editor) {
    if (scope === "category") {
      const categoryId = editor.dataset.categoryId;
      const category = categorySettings.find(item => item.id === categoryId);
      if (category) return category;
    }
    return {
      id: "map-default",
      shape: "circle",
      colour: "#3b6f62",
      stroke: "#ffffff",
      customIcon: null
    };
  }

  function syncMarkerSizeDraft(input) {
    const draft = getMarkerSizeDraftState(input);
    if (!draft) return null;
    const { changed, editor, effectiveValue, maximum, minimum, scope, valid } = draft;
    const preview = editor.querySelector("[data-marker-size-preview]");
    const readout = editor.querySelector("[data-marker-size-readout]");
    const status = editor.querySelector("[data-marker-size-draft-status]");
    const applyButton = editor.querySelector("[data-property-action='apply-marker-size']");
    const state = valid ? changed ? "pending" : "applied" : "invalid";

    editor.dataset.draftState = state;
    editor.dataset.draftValue = valid ? String(draft.normalizedValue) : String(input.value || "");
    input.setAttribute("aria-invalid", String(!valid));
    if (preview) preview.innerHTML = getMarkerSizePreviewSvg(getMarkerSizePreviewCategory(scope, editor), effectiveValue);
    if (readout) readout.textContent = t("properties.markerSize.previewValue", { value: effectiveValue });
    if (status) {
      status.textContent = !valid
        ? t("properties.markerSize.draftInvalid", { min: minimum, max: maximum })
        : changed
          ? t("properties.markerSize.draftPending", { value: effectiveValue })
          : editor.dataset.appliedStatus || t("properties.markerSize.draftApplied");
    }
    if (applyButton) applyButton.disabled = !valid || !changed;
    return draft;
  }

  function focusMarkerSizeDraft(scope) {
    const targetScope = scope === "category" ? "category" : "global";
    const selector = `[data-marker-size-draft='${targetScope}']`;
    const restoreFocus = () => {
      const input = els.propertiesSelectionControls?.querySelector(selector);
      if (!input || !input.isConnected) return false;
      input.focus({ preventScroll: true });
      return document.activeElement === input;
    };
    window.requestAnimationFrame(() => {
      restoreFocus();
      window.requestAnimationFrame(() => {
        const input = els.propertiesSelectionControls?.querySelector(selector);
        if (document.activeElement !== input) restoreFocus();
      });
    });
  }

  function normalizeLeaderLineWidth(value, fallback = layoutDefaults.lineWidthInput, maximum = 10) {
    const parsed = Number(value);
    const fallbackValue = Number.isFinite(Number(fallback)) ? Number(fallback) : 2;
    const width = Number.isFinite(parsed) ? parsed : fallbackValue;
    const upperBound = Number.isFinite(Number(maximum)) ? Number(maximum) : 10;
    return Math.max(1, Math.min(upperBound, Math.round(width * 2) / 2));
  }

  function normalizeLeaderLineWidthOverride(value) {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    return Number.isFinite(Number(value)) ? normalizeLeaderLineWidth(value) : "";
  }

  function formatLeaderLineWidthInput(value) {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(1) : String(value);
  }

  function formatLeaderLineWidthDisplay(value) {
    return formatLocalizedDecimal(value, currentUiLanguage, 1);
  }

  function getLeaderLineWidthDraftState(input) {
    const editor = input && input.closest("[data-leader-line-width-editor]");
    if (!editor) return null;
    const requestedScope = editor.dataset.leaderLineWidthEditor;
    const scope = requestedScope === "point" || requestedScope === "category" ? requestedScope : "global";
    const maximum = 10;
    const rawValue = String(input.value || "").trim();
    const isBlank = rawValue === "";
    const numericValue = Number(rawValue);
    const blankIsValid = scope === "point" && isBlank;
    const numericIsValid = !isBlank
      && Number.isFinite(numericValue)
      && numericValue >= 1
      && numericValue <= maximum
      && Math.abs(numericValue * 2 - Math.round(numericValue * 2)) < 1e-9;
    const valid = blankIsValid || numericIsValid;
    const normalizedValue = isBlank ? "" : normalizeLeaderLineWidth(rawValue, layoutDefaults.lineWidthInput, maximum);
    const committedValue = scope === "point"
      ? normalizeLeaderLineWidthOverride(editor.dataset.committedValue)
      : normalizeLeaderLineWidth(editor.dataset.committedValue, layoutDefaults.lineWidthInput, maximum);
    const inheritedNumber = Number(editor.dataset.inheritedValue);
    const inheritedValue = Number.isFinite(inheritedNumber) && inheritedNumber > 0
      ? inheritedNumber
      : normalizeLeaderLineWidth(layoutDefaults.lineWidthInput);
    const committedEffectiveValue = scope === "point" && committedValue === ""
      ? inheritedValue
      : Number(committedValue);
    const effectiveValue = isBlank
      ? inheritedValue
      : Number.isFinite(numericValue)
        ? numericValue
        : committedEffectiveValue;
    const changed = valid && normalizedValue !== committedValue;
    return {
      changed,
      committedValue,
      editor,
      effectiveValue,
      input,
      isBlank,
      normalizedValue,
      scope,
      valid
    };
  }

  function syncLeaderLineWidthDraft(input) {
    const draft = getLeaderLineWidthDraftState(input);
    if (!draft) return null;
    const { changed, editor, effectiveValue, isBlank, scope, valid } = draft;
    const previewLine = editor.querySelector("[data-leader-line-width-preview]");
    const readout = editor.querySelector("[data-leader-line-width-readout]");
    const status = editor.querySelector("[data-leader-line-width-draft-status]");
    const applyButton = editor.querySelector("[data-property-action='apply-leader-line-width']");
    const previewWidth = Math.max(1, Math.min(12, Number(effectiveValue) || normalizeLeaderLineWidth(layoutDefaults.lineWidthInput)));
    const displayValue = formatLeaderLineWidthDisplay(effectiveValue);
    const state = valid ? changed ? "pending" : "applied" : "invalid";

    editor.dataset.draftState = state;
    editor.dataset.draftValue = valid ? String(draft.normalizedValue) : String(input.value || "");
    input.setAttribute("aria-invalid", String(!valid));
    if (previewLine) previewLine.setAttribute("stroke-width", String(previewWidth));
    if (readout) {
      readout.textContent = scope === "point" && isBlank
        ? t("properties.leaderLines.previewInherited", { value: displayValue })
        : t("properties.leaderLines.previewValue", { value: displayValue });
    }
    if (status) {
      status.textContent = !valid
        ? t("properties.leaderLines.draftInvalid")
        : changed
          ? scope === "point" && isBlank
            ? t("properties.leaderLines.draftPendingInherited", { value: displayValue })
            : t("properties.leaderLines.draftPending", { value: displayValue })
          : editor.dataset.appliedStatus || t("properties.leaderLines.draftApplied");
    }
    if (applyButton) applyButton.disabled = !changed;
    return draft;
  }

  function focusLeaderLineWidthDraft(scope) {
    const targetScope = scope === "point" || scope === "category" ? scope : "global";
    const selector = `[data-leader-line-width-draft='${targetScope}']`;
    const restoreFocus = () => {
      const input = els.propertiesSelectionControls?.querySelector(selector);
      if (!input || !input.isConnected) return false;
      input.focus({ preventScroll: true });
      return document.activeElement === input;
    };
    // A button's default activation may run after its click handler and move
    // focus back to the button that the Properties rerender just detached.
    // Restore on the next frame, then verify once the scheduled map render has
    // crossed its own frame boundary.
    window.requestAnimationFrame(() => {
      restoreFocus();
      window.requestAnimationFrame(() => {
        const input = els.propertiesSelectionControls?.querySelector(selector);
        if (document.activeElement !== input) restoreFocus();
      });
    });
  }

  function formatMapScalePercent(value) {
    return `${Math.round(normalizeMapScale(value))}%`;
  }

  function normalizeCanvasViewZoom(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return defaultCanvasViewZoom;
    return Math.max(canvasViewZoomLevels[0], Math.min(canvasViewZoomLevels[canvasViewZoomLevels.length - 1], parsed));
  }

  function getSavedCanvasViewZoom() {
    const saved = projectIo.getSavedJson(window.localStorage, canvasViewZoomStorageKey);
    return normalizeCanvasViewZoom(saved === null ? defaultCanvasViewZoom : saved);
  }

  function saveCanvasViewZoom(value = canvasViewZoom) {
    projectIo.saveJson(window.localStorage, canvasViewZoomStorageKey, normalizeCanvasViewZoom(value));
  }

  function formatCanvasViewZoom(value = canvasViewZoom) {
    return `${Math.round(normalizeCanvasViewZoom(value))}%`;
  }

  function getFittedCanvasViewZoom(size = getImageSizePreset(), requestedValue = canvasViewZoom) {
    const requestedZoom = normalizeCanvasViewZoom(requestedValue);
    if (!size || !els.mapHost || !els.mapHost.clientWidth) return requestedZoom;
    const width = Number(size.width);
    if (!Number.isFinite(width) || width <= 0) return requestedZoom;

    const book = getBookSizePreset();
    const documentPage = book.documentPage || (
      els.bookSizeInput.value === "compact"
        ? { widthIn: 6.5, heightIn: 9.75, marginIn: 0.75 }
        : { widthIn: 8.5, heightIn: 11, marginIn: 1 }
    );
    const pageWidthIn = Math.max(1, Number(documentPage.widthIn) || 8.5);
    const marginIn = Math.max(0, Math.min(Number(documentPage.marginIn) || 0, pageWidthIn / 2 - 0.1));
    const contentWidthIn = Math.max(0.2, pageWidthIn - marginIn * 2);
    const pageWidthAt100 = pageWidthIn * (width / contentWidthIn);
    const hostStyle = window.getComputedStyle(els.mapHost);
    const availableWidth = Math.max(0,
      els.mapHost.clientWidth
      - (parseFloat(hostStyle.paddingLeft) || 0)
      - (parseFloat(hostStyle.paddingRight) || 0)
    );
    if (!availableWidth || pageWidthAt100 <= 0) return requestedZoom;

    const fittingZoom = canvasViewZoomLevels
      .filter(level => pageWidthAt100 * level / 100 <= availableWidth)
      .pop() || canvasViewZoomLevels[0];
    return Math.min(requestedZoom, fittingZoom);
  }

  function applyCanvasViewZoomDimensions(size = getImageSizePreset()) {
    if (!size) return;
    const width = Number(size.width);
    const height = Number(size.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    appliedCanvasViewZoom = getFittedCanvasViewZoom(size);
    const scale = appliedCanvasViewZoom / 100;
    const displayWidth = Math.round(width * scale);
    const displayHeight = Math.round(height * scale);
    const book = getBookSizePreset();
    const documentPage = book.documentPage || (
      els.bookSizeInput.value === "compact"
        ? { widthIn: 6.5, heightIn: 9.75, marginIn: 0.75 }
        : { widthIn: 8.5, heightIn: 11, marginIn: 1 }
    );
    const pageWidthIn = Math.max(1, Number(documentPage.widthIn) || 8.5);
    const pageHeightIn = Math.max(1, Number(documentPage.heightIn) || 11);
    const marginIn = Math.max(0, Math.min(Number(documentPage.marginIn) || 0, pageWidthIn / 2 - 0.1));
    const contentWidthIn = Math.max(0.2, pageWidthIn - marginIn * 2);
    const pixelsPerInch = displayWidth / contentWidthIn;
    const documentPageWidth = Math.round(pageWidthIn * pixelsPerInch);
    const documentPageHeight = Math.round(pageHeightIn * pixelsPerInch);
    const documentPageMargin = Math.round(marginIn * pixelsPerInch);
    const documentCanvasBleed = Math.max(2, Math.round(pixelsPerInch * 0.125));
    const svgNode = els.svg && typeof els.svg.node === "function" ? els.svg.node() : null;
    if (svgNode) {
      svgNode.style.width = `${displayWidth}px`;
      svgNode.style.height = `${displayHeight}px`;
    }
    if (els.canvasPlaceholder) {
      els.canvasPlaceholder.style.width = `${displayWidth}px`;
      els.canvasPlaceholder.style.aspectRatio = `${width} / ${height}`;
    }
    if (els.documentCanvasSlot) {
      els.documentCanvasSlot.style.width = `${displayWidth}px`;
      els.documentCanvasSlot.style.height = `${displayHeight}px`;
    }
    if (els.documentPagePreview) {
      els.documentPagePreview.dataset.pagePreset = els.bookSizeInput.value;
      els.documentPagePreview.style.setProperty("--document-page-width", `${documentPageWidth}px`);
      els.documentPagePreview.style.setProperty("--document-page-height", `${documentPageHeight}px`);
      els.documentPagePreview.style.setProperty("--document-page-margin", `${documentPageMargin}px`);
      els.documentPagePreview.style.setProperty("--document-canvas-width", `${displayWidth}px`);
      els.documentPagePreview.style.setProperty("--document-canvas-height", `${displayHeight}px`);
      els.documentPagePreview.style.setProperty("--document-canvas-bleed", `${documentCanvasBleed}px`);
      els.documentPagePreview.dataset.bleedIn = "0.125";
    }
    if (els.mapHost) els.mapHost.dataset.canvasZoom = String(Math.round(appliedCanvasViewZoom));
  }

  function updateCanvasToolbar() {
    canvasViewZoom = normalizeCanvasViewZoom(canvasViewZoom);
    applyCanvasViewZoomDimensions();
    const zoomText = t("canvas.zoomReadout", { value: formatCanvasViewZoom(appliedCanvasViewZoom) });
    if (els.canvasZoomReadout) {
      els.canvasZoomReadout.value = zoomText;
      els.canvasZoomReadout.textContent = zoomText;
    }
    if (els.canvasZoomOutBtn) els.canvasZoomOutBtn.disabled = appliedCanvasViewZoom <= canvasViewZoomLevels[0];
    if (els.canvasZoomInBtn) {
      const nextZoom = canvasViewZoomLevels.find(level => level > appliedCanvasViewZoom);
      els.canvasZoomInBtn.disabled = nextZoom === undefined || nextZoom > getFittedCanvasViewZoom(getImageSizePreset(), nextZoom);
    }
    if (els.canvasToolbar) {
      els.canvasToolbar.hidden = false;
    }
  }

  function adjustCanvasZoom(direction) {
    const current = normalizeCanvasViewZoom(appliedCanvasViewZoom);
    const next = direction < 0
      ? canvasViewZoomLevels.slice().reverse().find(level => level < current)
      : canvasViewZoomLevels.find(level => level > current);
    if (next === undefined) return;
    canvasViewZoom = next;
    saveCanvasViewZoom();
    updateCanvasToolbar();
  }

  const defaultPrintLabelSizePt = 18;
  const defaultWebLabelSizePx = 12;
  const minimumWebLabelSizePx = 12;
  const webLabelSizeScale = defaultWebLabelSizePx / defaultPrintLabelSizePt;
  const defaultLabelTypographyPrintSizePt = 12;
  const defaultLabelTitleSizePx = 10;
  const defaultLabelBodySizePx = 8;
  const mapTypographySizeRange = Object.freeze({ min: 2, max: 40, step: 0.5 });

  function normalizeMapTypographySize(value) {
    const numeric = Number(value);
    const safe = Number.isFinite(numeric) ? numeric : defaultWebLabelSizePx;
    const stepped = Math.round(safe / mapTypographySizeRange.step) * mapTypographySizeRange.step;
    return Math.max(mapTypographySizeRange.min, Math.min(mapTypographySizeRange.max, stepped));
  }

  function mapTypographySizeClass(value) {
    return `map-type-size-${String(normalizeMapTypographySize(value)).replace(".", "-")}`;
  }

  function mapFontFamilyClass(value) {
    const normalized = normalizeFontFamily(value).toLowerCase();
    if (normalized.startsWith("segoe ui")) return "map-font-segoe";
    if (normalized.startsWith("arial")) return "map-font-arial";
    return "map-font-lato";
  }

  function syncMapTypographyRoot(svg, settings) {
    if (!svg || !settings) return;
    svg
      .classed("map-font-lato", false)
      .classed("map-font-segoe", false)
      .classed("map-font-arial", false)
      .classed(mapFontFamilyClass(settings.fontFamily), true)
      .attr("data-map-output-mode", settings.outputMode || "web");
  }

  function getWebLabelSize(printPt) {
    // Keep the control in print points, but never render map text below 12 px.
    return Math.max(minimumWebLabelSizePx, Math.round(printPt * webLabelSizeScale));
  }

  function getLabelTypographyRenderSizes(printPt, outputMode = "web") {
    const normalizedPrintSize = normalizeLabelSizePt(printPt);
    if (outputMode === "print") {
      return { title: normalizedPrintSize, body: normalizedPrintSize };
    }
    const scale = normalizedPrintSize / defaultLabelTypographyPrintSizePt;
    return {
      title: Math.max(defaultLabelTitleSizePx, Math.round(defaultLabelTitleSizePx * scale)),
      body: Math.max(defaultLabelBodySizePx, Math.round(defaultLabelBodySizePx * scale))
    };
  }

  function normalizeFontFamily(value) {
    const fontFamily = String(value || "").trim();
    return fontFamily && fontFamily !== "Lato" ? fontFamily : defaultFontFamily;
  }

  function getSettings(options = {}) {
    const imageSize = getImageSizePreset();
    const outputMode = options.outputMode || renderOutputMode;
    const labelSizePt = normalizeLabelSizePt(els.labelSizeInput.value);
    const labelTypographySizes = getLabelTypographyRenderSizes(labelSizePt, outputMode);
    const mapScale = normalizeMapScale(els.mapScaleInput.value);
    const languageLayoutState = getLanguageLayoutState();
    const bookSize = imageSizePresets[els.bookSizeInput.value] ? els.bookSizeInput.value : layoutDefaults.bookSizeInput;
    const labelDensityScale = bookSize === "compact" && imageSize.value === "half" ? 0.5 : 1;
    const scaleTypography = (value, floor) => Math.max(floor, Math.round(value * labelDensityScale));
    return {
      outputMode,
      bookSize,
      imageSize: imageSize.value,
      width: imageSize.width,
      height: imageSize.height,
      title: currentMapLanguage === "fr"
        ? String(mapDetails.titleFr || mapDetails.titleEn || "").trim()
        : String(mapDetails.titleEn || mapDetails.titleFr || "").trim(),
      labelSizePt,
      labelDensityScale,
      labelSize: labelSizePt * labelDensityScale,
      labelSizeRender: scaleTypography(outputMode === "print" ? labelSizePt : getWebLabelSize(labelSizePt), 5),
      labelTitleSizeRender: scaleTypography(labelTypographySizes.title, 5),
      labelBodySizeRender: scaleTypography(labelTypographySizes.body, 4),
      mapScale,
      mapOffsetX: Number(languageLayoutState && languageLayoutState.mapOffsetX) || 0,
      mapOffsetY: Number(languageLayoutState && languageLayoutState.mapOffsetY) || 0,
      markerSize: normalizeMarkerSize(els.markerSizeInput.value, layoutDefaults.markerSizeInput, 4, 20),
      lineWidth: normalizeLeaderLineWidth(els.lineWidthInput.value),
      leaderColour: normalizeHexColour(els.leaderColourInput && els.leaderColourInput.value, layoutDefaults.leaderColourInput || "#333333"),
      hideLeaderLines: Boolean(els.hideLeaderLinesInput && els.hideLeaderLinesInput.checked),
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
    if (settings.markerSize !== undefined) els.markerSizeInput.value = normalizeMarkerSize(settings.markerSize, layoutDefaults.markerSizeInput, 4, 20);
    if (settings.lineWidth !== undefined) els.lineWidthInput.value = normalizeLeaderLineWidth(settings.lineWidth);
    if (els.leaderColourInput) {
      els.leaderColourInput.value = normalizeHexColour(settings.leaderColour, layoutDefaults.leaderColourInput || "#333333");
    }
    if (els.hideLeaderLinesInput) els.hideLeaderLinesInput.checked = Boolean(settings.hideLeaderLines);
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

  const frenchWorldRegionOverrides = Object.freeze({
    CYN: "Chypre du Nord",
    KOS: "Kosovo",
    SOL: "Somaliland"
  });
  let frenchWorldRegionDisplayNames;

  function getFrenchWorldRegionName(properties = {}) {
    const code3 = String(properties.adm0_a3 || properties.iso_a3 || "").trim().toUpperCase();
    if (frenchWorldRegionOverrides[code3]) return frenchWorldRegionOverrides[code3];

    const code2 = String(properties.iso_a2 || properties.wb_a2 || "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code2) || typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") return "";
    try {
      if (!frenchWorldRegionDisplayNames) {
        frenchWorldRegionDisplayNames = new Intl.DisplayNames(["fr-CA", "fr"], { type: "region" });
      }
      const name = frenchWorldRegionDisplayNames.of(code2);
      return name && name !== code2 ? name : "";
    } catch (_error) {
      return "";
    }
  }

  function getRegionDisplayName(feature, index, language = currentUiLanguage) {
    const props = feature && feature.properties ? feature.properties : {};
    if (language === "fr") {
      const name = normalizeRegionName(
        props.prov_name_fr || props.name_fr || props.NAME_FR || props.Name_FR || getFrenchWorldRegionName(props) || props.formal_fr || props.name || props.NAME || props.Name || props.ADMIN || props.admin || props.prov_name_en || props.prov_name,
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
    const id = getRegionId(feature, index);
    const status = getRegionStatusOption(regionStatuses[id]);
    if (status.colour && isRegionStatusVisible(status.value)) return status.colour;
    return regionFills[id] || colours[index % colours.length];
  }

  function getRegionFillById(regionId) {
    const id = String(regionId || "").trim();
    if (!id) return "";
    const match = getRegionFeatureById(id, canadaGeo);
    return match ? getRegionFill(match.feature, match.index) : "";
  }

  function getLeaderLineColour(row, settings = getSettings()) {
    const category = row ? getCategory(row.type) : null;
    const fallback = normalizeHexColour(settings && settings.leaderColour, layoutDefaults.leaderColourInput || "#333333");
    return markerColour.resolveLeaderLineColour(row, category, fallback);
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
      const regionId = row.anchor === "region" ? row.region : getRegionIdForPoint(Number(row.lon), Number(row.lat));
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
        status: normalizeRegionStatus(regionStatuses[region.id]),
        statusLabel: t(getRegionStatusOption(regionStatuses[region.id]).labelKey),
        statusColour: getRegionStatusOption(regionStatuses[region.id]).colour,
        colour: getRegionFill(region.feature, region.index)
      };
    });
  }

  function getColourForRegionValue(value, allValues, colours = getCurrentRegionColourSet()) {
    const numericValue = normalizeRegionValue(value);
    if (numericValue === "" || !colours.length) return colours[0] || "#b4d6c9";

    const numericValues = allValues
      .map(normalizeRegionValue)
      .filter(item => item !== "");
    if (!numericValues.length) return colours[0] || "#b4d6c9";

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
    const statusInput = row.querySelector(".region-status-input");
    if (statusInput) {
      statusInput.innerHTML = regionStatusOptionsHtml(region.status);
      statusInput.setAttribute("aria-label", t("properties.region.statusAria", { name: region.name }));
    }
  }

  function refreshRegionValueTableRows() {
    if (!els.regionTableBody || !canadaGeo || !Array.isArray(canadaGeo.features)) return;
    const approvedColours = getCurrentRegionColourSet();
    getRegionTableRows().forEach(region => refreshRegionValueTableRow(region, approvedColours));
  }

  function renderRegionValueTable() {
    if (!els.regionTableBody) return;
    if (!canadaGeo || !Array.isArray(canadaGeo.features)) {
      els.regionTableBody.innerHTML = `<tr><td colspan="7" class="empty-table-message">${escapeHtml(t("region.table.unavailable"))}</td></tr>`;
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
        <td class="region-status-cell region-vcell">
          <select class="region-status-input" data-region-id="${escapeHtml(region.id)}" aria-label="${escapeHtml(t("properties.region.statusAria", { name: region.name }))}">
            ${regionStatusOptionsHtml(region.status)}
          </select>
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
    renderRegionStatusVisibilityControls();
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
      const fallback = getLocalizedConfigLabel(option, currentUiLanguage, option.value);
      return `<option value="${escapeHtml(option.value)}">${escapeHtml(label === key ? fallback : label)}</option>`;
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

  function getFeatureCountryCode(feature) {
    const props = feature && feature.properties ? feature.properties : {};
    return String(props.iso_a3 || props.adm0_a3 || props.ADM0_A3 || "").trim().toUpperCase();
  }

  function worldFeatureMatchesPreset(feature, preset) {
    const countryCode = getFeatureCountryCode(feature);
    if (preset === "united-states") return countryCode === "USA";
    if (preset === "arctic") return ["CAN", "FIN", "GRL", "ISL", "NOR", "RUS", "SWE", "USA"].includes(countryCode);
    return regionMatchesPreset(getFeatureContinent(feature), getWorldPresetContinents(preset));
  }

  function applyRegionPreset(preset) {
    if (!canadaGeo || !Array.isArray(canadaGeo.features) || !preset) return;
    if (preset === "all") {
      setAllRegions(true, { preservePreset: true });
      els.regionPresetInput.value = preset;
      return;
    }

    const presetNames = currentBoundary === "world" ? [] : getRegionPresetNames(preset);
    canadaGeo.features.forEach((feature, index) => {
      const id = getRegionId(feature, index);
      regionVisibility[id] = currentBoundary === "world"
        ? worldFeatureMatchesPreset(feature, preset)
        : regionMatchesPreset(getRegionName(feature, index), presetNames);
    });
    renderRegionControls();
    els.regionPresetInput.value = preset;
    scheduleRender();
    refreshMapPropertiesIfActive();
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
        category.markerSize = normalizeMarkerSize(style.markerSize, category.markerSize || settings.markerSize, 4, 30);
        category.lineWidth = normalizeLeaderLineWidth(style.lineWidth, category.lineWidth || settings.lineWidth);
        category.markerSizeCustom = false;
        category.lineWidthCustom = false;
      });
      applyRegionColoursByValue(false);
      renderCategoryEditors();
      updateTypeOptions();
    }

    if (shouldRender) requestPreviewRefresh();
  }

  function applySelectedMapStyle() {
    applyMapStylePreset(els.mapStylePresetInput.value);
    refreshMapPropertiesIfActive();
  }

  async function changeBoundary(boundaryValue) {
    currentBoundary = Object.prototype.hasOwnProperty.call(boundarySources, boundaryValue) ? boundaryValue : "canada";
    syncBaselayerBoundary(currentBoundary);
    resetLanguageMapOffsets();
    els.boundaryInput.value = currentBoundary;
    renderRegionPresetOptions();
    regionVisibility = {};
    regionFills = {};
    regionValues = {};
    regionStatuses = {};
    regionColourOverrides = {};
    await loadGeo();
    syncAllProjectRegionInputs();
    syncProjectLocationModeUi();
    requestPreviewRefresh();
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

  function translationPreviewRenderOptions() {
    return {
      autoPlace: true,
      autoPlaceResize: false,
      navigationFriendly: true
    };
  }

  function switchActiveLanguageLayout(language, fallbackScale = null) {
    const nextLanguage = normalizeMapLanguage(language);
    if (nextLanguage === currentMapLanguage) return;
    syncCurrentLanguageLayoutState();
    currentMapLanguage = nextLanguage;
    activateLanguageLayoutState(currentMapLanguage, fallbackScale);
  }

  function syncMapLanguageControls(language = currentMapLanguage) {
    const nextLanguage = normalizeMapLanguage(language);
    if (els.mapLanguageInput) els.mapLanguageInput.value = nextLanguage;
    if (els.previewLanguageInput) els.previewLanguageInput.value = nextLanguage;
    els.mapLanguageButtons.forEach(button => {
      const active = button.dataset.mapLanguage === nextLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setMapLanguage(value, options = {}) {
    const nextLanguage = normalizeMapLanguage(value);
    const languageChanged = nextLanguage !== currentMapLanguage;
    const previousScale = els.mapScaleInput ? normalizeMapScale(els.mapScaleInput.value) : null;
    switchActiveLanguageLayout(nextLanguage, previousScale);
    syncMapLanguageControls(currentMapLanguage);
    document.title = mapDetails[currentMapLanguage === "fr" ? "titleFr" : "titleEn"] || "Plotypus";
    updateExportLanguageNotice();
    renderPropertiesForActiveState();
    if (options.render !== false) {
      const hasSavedLayout = Object.keys(manualLabelPositions).length > 0;
      requestPreviewRefresh(hasSavedLayout ? {} : languageFitRenderOptions());
    }
    if (languageChanged && options.markDirty !== false) setProjectSaveState("dirty");
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

  function asLabelLine(text, lang = "en", role = "title") {
    return { text: String(text || ""), lang, role };
  }

  function lineText(line) {
    return typeof line === "string" ? line : String(line && line.text || "");
  }

  function getLabelLines(row, settings) {
    const maxChars = normalizeLabelMaxCharsOverride(row && row.labelMaxChars) || settings.labelMaxChars;
    const lang = settings.mapLanguage === "fr" ? "fr" : "en";
    const headingLines = wrapLabel(getLabelText(row, settings.mapLanguage), maxChars).map(line => asLabelLine(line, lang, "title"));
    if (!row || row.labelStyle !== "rich") return headingLines;
    const normalizedContent = normalizeAnnotationContent(row.content);
    const titleText = getLabelText(row, settings.mapLanguage);
    const contentLines = normalizedContent
      .flatMap(block => {
        if (block.type === "text" || block.type === "bullet") {
          const text = getLocalizedPairText(block, settings.mapLanguage);
          if (!text) return [];
          if (block.type === "text" && normalizeComparableText(text) === normalizeComparableText(titleText)) return [];
          const role = block.type === "bullet" ? "bullet" : "paragraph";
          const prefix = block.type === "bullet" ? "- " : "";
          return wrapLabel(`${prefix}${text}`, maxChars).map(line => asLabelLine(line, lang, role));
        }
        if (block.type === "paragraph") {
          const text = getLocalizedPairText(block, settings.mapLanguage);
          return text ? wrapLabel(text, maxChars).map(line => asLabelLine(line, lang, "paragraph")) : [];
        }
        if (block.type === "bullets") {
          return (block.items || []).flatMap(item => {
            const text = getLocalizedPairText(item, settings.mapLanguage);
            return text ? wrapLabel(`- ${text}`, maxChars).map(line => asLabelLine(line, lang, "bullet")) : [];
          });
        }
        if (block.type === "image") {
          const lines = [];
          if (block.assetRef) {
            const imageLine = asLabelLine("", lang, "image");
            const dimensions = getRichLabelImageDimensions(block);
            imageLine.assetRef = block.assetRef;
            imageLine.caption = getLocalizedPairText(block.caption, settings.mapLanguage);
            imageLine.imageWidth = dimensions.width;
            imageLine.imageHeight = dimensions.height;
            lines.push(imageLine);
          }
          const caption = getLocalizedPairText(block.caption, settings.mapLanguage);
          if (caption) lines.push(...wrapLabel(caption, maxChars).map(line => asLabelLine(line, lang, "caption")));
          return lines;
        }
        return [];
      });
    return contentLines.length ? headingLines.concat(contentLines) : headingLines;
  }

  function visibleLabelLines(lines) {
    return lines.filter(line => line.role !== "separator");
  }

  function getRenderedLabelTextAnchor(row) {
    return row && (row.labelSide === "top" || row.labelSide === "bottom")
      ? "middle"
      : row && row.labelSide === "left"
        ? "end"
        : "start";
  }

  function getRenderedLabelTextX(row) {
    if (!row || (row.labelSide !== "top" && row.labelSide !== "bottom")) {
      return Number(row && row.labelX) || 0;
    }
    return labelVisualBox(row).centerX;
  }

  function getLabelWrapSignature(row, settings, maxChars) {
    return getLabelLines({ ...row, labelMaxChars: maxChars }, settings)
      .map(line => `${line && line.role || "title"}:${lineText(line)}`)
      .join("\n");
  }

  function isLabelWidthResizable(row, settings) {
    return getLabelWrapSignature(row, settings, 12) !== getLabelWrapSignature(row, settings, 42);
  }

  function getLabelLineFontWeight(line) {
    return line && ["paragraph", "bullet", "caption"].includes(line.role) ? 400 : 700;
  }

  function getLabelTextMeasureContext() {
    if (labelTextMeasureContext) return labelTextMeasureContext;
    if (!document || typeof document.createElement !== "function") return null;
    const canvas = document.createElement("canvas");
    labelTextMeasureContext = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
    return labelTextMeasureContext;
  }

  function measureLabelTextWidth(text, fontSize, fontFamily = defaultFontFamily, fontWeight = 700) {
    const value = String(text || "");
    if (!value) return 0;
    const size = Math.max(1, Number(fontSize) || 1);
    const weight = Number(fontWeight) === 400 ? 400 : 700;
    const family = String(fontFamily || defaultFontFamily);
    const cacheKey = `${weight}|${size}|${family}|${value}`;
    if (labelTextMeasureCache.has(cacheKey)) return labelTextMeasureCache.get(cacheKey);

    let width = value.length * size * 0.58;
    const context = getLabelTextMeasureContext();
    if (context) {
      context.font = `${weight} ${size}px ${family}`;
      const measured = context.measureText(value).width;
      if (Number.isFinite(measured) && measured >= 0) width = measured;
    }
    if (labelTextMeasureCache.size >= 5000) labelTextMeasureCache.clear();
    labelTextMeasureCache.set(cacheKey, width);
    return width;
  }

  function getLabelLineFontSize(line, settings) {
    const role = line && line.role || "title";
    if (role === "title") {
      return normalizeMapTypographySize(Number(settings && settings.labelTitleSizeRender) || getLabelTypographyRenderSizes(settings && (settings.labelSizePt || settings.labelSize), settings && settings.outputMode).title);
    }
    return normalizeMapTypographySize(Number(settings && settings.labelBodySizeRender) || getLabelTypographyRenderSizes(settings && (settings.labelSizePt || settings.labelSize), settings && settings.outputMode).body);
  }

  function getLabelLineHeight(line, settings) {
    return getLabelLineFontSize(line, settings) * 1.2;
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

  function referenceSideOptions(item, settings = null) {
    if (currentBoundary !== "canada") return [];
    const name = labelKeyText(item);
    const exactReferenceCanvas = settings && settings.bookSize === "compact" && settings.imageSize === "half";
    const rules = [
      [/mackenzie|red chris|ksi lisims|north coast|lng canada/, ["left"]],
      [/grays|arctic/, ["top", "left"]],
      [/northwest critical|mcilvenna/, exactReferenceCanvas ? ["bottom"] : ["bottom", "left"]],
      [/pathways/, ["bottom"]],
      [/taltson|churchill|iqaluit|alto|wind west|northcliff|contrecoeur/, ["right"]],
      [/nouveau|darlington|crawford/, ["bottom", "right"]]
    ];
    const match = rules.find(([pattern]) => pattern.test(name));
    return match ? match[1] : [];
  }

  function placementDifficulty(item, points, settings) {
    const radius = Math.max(46, settings.labelSize * 3.4);
    return points.reduce((count, other) => {
      if (other === item) return count;
      return Math.hypot(item.x - other.x, item.y - other.y) <= radius ? count + 1 : count;
    }, 0);
  }

  function comparePlacementOrder(a, b, points, settings) {
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
    const mapOffsetX = Number(settings.mapOffsetX) || 0;
    const mapOffsetY = Number(settings.mapOffsetY) || 0;
    const scaleCenter = [
      (mapExtent[0][0] + mapExtent[1][0]) / 2,
      (mapExtent[0][1] + mapExtent[1][1]) / 2
    ];
    const applyMapScale = projection => {
      const translate = projection.translate();
      projection
        .scale(projection.scale() * scaleFactor)
        .translate([
          scaleCenter[0] + scaleFactor * (translate[0] - scaleCenter[0]) + mapOffsetX,
          scaleCenter[1] + scaleFactor * (translate[1] - scaleCenter[1]) + mapOffsetY
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

  function projectRowsForLayout(rows, projection, path, visibleGeo) {
    const mappedRows = [];
    const calloutRows = [];
    const projectedProblems = [];
    const hiddenRegionProblems = [];

    rows.forEach(row => {
      if (row.anchor === "region") {
        if (!row.region) {
          calloutRows.push(row);
          return;
        }
        const visibleRegion = getRegionFeatureById(row.region, visibleGeo);
        if (!visibleRegion) {
          const regionName = getRegionNameById(row.region) || row.region;
          hiddenRegionProblems.push(`${row.name || t("status.unnamedPoint")} (${regionName})`);
          return;
        }
        const centroid = path.centroid(visibleRegion.feature);
        if (!centroid || !Number.isFinite(centroid[0]) || !Number.isFinite(centroid[1])) {
          projectedProblems.push(row.name || t("status.unnamedPoint"));
          return;
        }
        mappedRows.push({
          ...row,
          regionName: getRegionDisplayName(visibleRegion.feature, visibleRegion.index),
          x: centroid[0],
          y: centroid[1]
        });
        return;
      }
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
      ...projectRowsForLayout(rows, projection, path, visibleGeo)
    };
  }

  function createProjectedLandMaskQuery(visibleGeo, projection, settings) {
    if (!visibleGeo || !projection) return null;
    const cellSize = 2;
    const columns = Math.max(1, Math.ceil(settings.width / cellSize));
    const rows = Math.max(1, Math.ceil(settings.height / cellSize));
    const stride = columns + 1;
    const integral = new Uint32Array((rows + 1) * stride);
    let alpha = null;

    try {
      const canvas = typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(columns, rows)
        : document.createElement("canvas");
      canvas.width = columns;
      canvas.height = rows;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const pathData = d3.geoPath(projection)(visibleGeo);
      if (context && pathData && typeof Path2D === "function") {
        context.setTransform(1 / cellSize, 0, 0, 1 / cellSize, 0, 0);
        context.fillStyle = "#000";
        context.fill(new Path2D(pathData));
        context.setTransform(1, 0, 0, 1, 0, 0);
        alpha = context.getImageData(0, 0, columns, rows).data;
      }
    } catch (error) {
      console.warn("Could not rasterize the projected land mask; map-aware label avoidance is unavailable.", error);
    }

    if (!alpha) return null;
    for (let row = 1; row <= rows; row += 1) {
      let rowTotal = 0;
      for (let column = 1; column <= columns; column += 1) {
        const alphaIndex = ((row - 1) * columns + column - 1) * 4 + 3;
        if (alpha[alphaIndex] > 8) rowTotal += 1;
        integral[row * stride + column] = integral[(row - 1) * stride + column] + rowTotal;
      }
    }

    return rect => {
      if (!rect) return false;
      const x0 = clamp(Math.floor(rect.x0 / cellSize), 0, columns);
      const y0 = clamp(Math.floor(rect.y0 / cellSize), 0, rows);
      const x1 = clamp(Math.ceil(rect.x1 / cellSize), 0, columns);
      const y1 = clamp(Math.ceil(rect.y1 / cellSize), 0, rows);
      if (x1 <= x0 || y1 <= y0) return false;
      const occupied = integral[y1 * stride + x1]
        - integral[y0 * stride + x1]
        - integral[y1 * stride + x0]
        + integral[y0 * stride + x0];
      return occupied > 0;
    };
  }

  function makeLabelBox(d, side, settings, mapBounds = null) {
    const sourceLines = getLabelLines(d, settings);
    const firstLine = sourceLines[0] || asLabelLine("");
    const fontSize = getLabelLineFontSize(firstLine, settings);
    const lineHeight = getLabelLineHeight(firstLine, settings);
    const imageGap = Math.max(4, getLabelLineFontSize(asLabelLine("", "en", "paragraph"), settings) * 0.3);
    let baselineOffset = 0;
    let visualBottom = 0;
    const lines = sourceLines.map((line, index) => {
      const lineFontSize = getLabelLineFontSize(line, settings);
      const currentLineHeight = getLabelLineHeight(line, settings);
      const nextLine = { ...line, baselineOffset, fontSize: lineFontSize, lineHeight: currentLineHeight };
      if (line.role === "image") {
        const imageHeight = Number(line.imageHeight) || currentLineHeight;
        visualBottom = Math.max(visualBottom, baselineOffset - fontSize + imageHeight);
        if (index < sourceLines.length - 1) baselineOffset += Math.max(currentLineHeight, imageHeight + imageGap);
      } else {
        visualBottom = Math.max(visualBottom, baselineOffset);
        if (index < sourceLines.length - 1) baselineOffset += currentLineHeight;
      }
      return nextLine;
    });
    const textLines = visibleLabelLines(lines);
    const footnote = getRenderableFootnote(d.footnote);
    const fontFamily = settings && settings.fontFamily || defaultFontFamily;
    const lineWidths = textLines.map(line => measureLabelTextWidth(
      lineText(line),
      Number(line.fontSize) || fontSize,
      fontFamily,
      getLabelLineFontWeight(line)
    ));
    const baseTextWidth = Math.max(...lineWidths, 0);
    const lastTextLine = textLines[textLines.length - 1] || asLabelLine("");
    const lastLineFontSize = Number(lastTextLine.fontSize) || fontSize;
    const lastLineWidth = lineWidths[lineWidths.length - 1] || 0;
    const footnoteFontSize = normalizeMapTypographySize(lastLineFontSize * 0.68);
    const footnoteWidth = footnote
      ? measureLabelTextWidth(footnote, footnoteFontSize, fontFamily, 700) + 2
      : 0;
    const imageWidth = Math.max(...lines.filter(line => line.role === "image").map(line => Number(line.imageWidth) || 0), 0);
    const textWidth = Math.max(baseTextWidth, imageWidth, lastLineWidth + footnoteWidth);
    const visualHeight = Math.max(fontSize, visualBottom + fontSize);
    const textHeight = visualHeight - fontSize + lineHeight;
    return {
      lines,
      lineHeight,
      textWidth,
      textHeight,
      footnote,
      side,
      collisionPaddingScale: Number(settings.labelDensityScale) || 1
    };
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
    if (hasLayer) layer.attr("display", visible ? null : "none");
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
      if (name.includes("alto")) {
        return settings.bookSize === "compact" && settings.imageSize === "half"
          ? -unit * 8
          : unit * 10.5;
      }
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

  function finalizeAutomaticLabelPlacements(placed, settings) {
    const positioned = applyManualLabelPositions(placed, false);
    positioned.forEach(label => {
      const constrained = constrainLabelToCanvas(label, settings);
      if (!constrained.wasConstrained) return;
      label.labelX = constrained.labelX;
      label.labelY = constrained.labelY;
    });
    return positioned;
  }

  function chooseFeasibleMapLayoutContext(visibleGeo, rows, baseSettings, options = {}) {
    const requestedMapScale = normalizeMapScale(baseSettings.mapScale);
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        ...createMapLayoutContext(visibleGeo, [], { ...baseSettings, mapScale: requestedMapScale }),
        requestedMapScale
      };
    }
    // "Fit map + labels" may grow or shrink the baselayer. Searching only
    // downward from the current value leaves previously undersized maps stuck.
    const maxScale = mapScaleRange.max;
    const minScale = mapScaleRange.min;
    const referenceCanvas = currentBoundary === "canada"
      && baseSettings.bookSize === "compact"
      && baseSettings.imageSize === "half";
    const searchMaxScale = referenceCanvas ? Math.min(98, maxScale) : maxScale;
    let fallback = null;
    const attempts = [];
    const unresolvedAbove = [];
    const translationCandidates = referenceCanvas
      ? [
        { mapOffsetX: baseSettings.width * 0.024, mapOffsetY: baseSettings.height * 0.06 },
        { mapOffsetX: 0, mapOffsetY: 0 },
        { mapOffsetX: -baseSettings.width * 0.024, mapOffsetY: baseSettings.height * 0.06 }
      ].slice(0, 2)
      : [{ mapOffsetX: 0, mapOffsetY: 0 }];

    function orderedTranslations(preferredTranslation = null) {
      if (!preferredTranslation) return translationCandidates;
      return translationCandidates.slice().sort((a, b) => {
        const aDistance = Math.hypot(a.mapOffsetX - preferredTranslation.mapOffsetX, a.mapOffsetY - preferredTranslation.mapOffsetY);
        const bDistance = Math.hypot(b.mapOffsetX - preferredTranslation.mapOffsetX, b.mapOffsetY - preferredTranslation.mapOffsetY);
        return aDistance - bDistance;
      });
    }

    function tryScale(scale, phase, solverOptions, warmStart = null, preferredTranslation = null) {
      let sawBudgetExhaustion = false;
      let bestAttemptDiagnostic = null;
      for (const translation of orderedTranslations(preferredTranslation)) {
        const settings = { ...baseSettings, ...translation, mapScale: scale };
        const context = createMapLayoutContext(visibleGeo, rows, settings);
        const labelRows = context.mappedRows.filter(row => row.name);
        settings.layoutObstacles = getLayoutBoxObstacles(settings, context.calloutRows);
        settings.labelTouchesLand = createProjectedLandMaskQuery(visibleGeo, context.projection, settings);
        const feasibility = assessPerimeterFeasibility(labelRows, settings, context.mapBounds, settings.layoutObstacles);
        const { seedWithHeuristic = false, ...constraintOptions } = solverOptions;
        const heuristicWarmStart = !warmStart && seedWithHeuristic
          ? layoutLabelsWithoutManualPositions(labelRows, settings, context.mapBounds)
          : null;
        const effectiveWarmStart = warmStart || heuristicWarmStart;
        const finalizedHeuristic = heuristicWarmStart
          ? finalizeAutomaticLabelPlacements(heuristicWarmStart, settings)
          : null;
        const heuristicQuality = finalizedHeuristic ? measurePlacementQuality(finalizedHeuristic, settings) : null;
        const solved = finalizedHeuristic && placementQualityAcceptable(heuristicQuality)
          ? {
            status: "solved",
            placed: heuristicWarmStart,
            nodesVisited: 0,
            candidateCount: 0,
            conflictChecks: 0,
            truncatedDomainCount: 0,
            deadEnds: [],
            domainSummary: [],
            strategy: "heuristic-seed"
          }
          : solveConflictFreeLayout(labelRows, settings, context.mapBounds, {
            ...constraintOptions,
            warmStart: effectiveWarmStart,
            preferWarmStart: !referenceCanvas && Array.isArray(effectiveWarmStart) && effectiveWarmStart.length > 0
          });
        sawBudgetExhaustion ||= solved.status === "budget-exhausted" || solved.status === "candidate-limited" || solved.status === "not-found";
        const placed = solved.status === "solved"
          ? finalizeAutomaticLabelPlacements(solved.placed, settings)
          : null;
        const placementQuality = placed ? measurePlacementQuality(placed, settings) : null;
        const diagnostic = {
          phase,
          scale,
          mapOffsetX: Math.round(settings.mapOffsetX * 10) / 10,
          mapOffsetY: Math.round(settings.mapOffsetY * 10) / 10,
          status: solved.status,
          nodesVisited: solved.nodesVisited,
          candidateCount: solved.candidateCount,
          minDomainSize: solved.domains ? Math.min(...solved.domains.map(domain => domain.length)) : null,
          emptyLabel: Number.isInteger(solved.emptyDomainIndex) ? labelRows[solved.emptyDomainIndex]?.name || "" : "",
          conflictChecks: solved.conflictChecks || 0,
          strategy: solved.strategy || "constraint-solver",
          bestConflictCount: Number.isFinite(solved.bestConflictCount) ? solved.bestConflictCount : null,
          polishMoves: solved.polishMoves || 0,
          pairPolishMoves: solved.pairPolishMoves || 0,
          polishPasses: solved.polishPasses || 0,
          heuristicHardProblems: heuristicQuality ? heuristicQuality.hardProblems : null,
          truncatedDomainCount: solved.truncatedDomainCount || 0,
          deadEnds: Array.isArray(solved.deadEnds) ? solved.deadEnds.slice(0, 3) : [],
          hardProblems: placementQuality ? placementQuality.hardProblems : null
        };
        attempts.push(diagnostic);
        const diagnosticConflictCount = Number.isFinite(diagnostic.bestConflictCount)
          ? diagnostic.bestConflictCount
          : Number.POSITIVE_INFINITY;
        const bestConflictCount = bestAttemptDiagnostic && Number.isFinite(bestAttemptDiagnostic.bestConflictCount)
          ? bestAttemptDiagnostic.bestConflictCount
          : Number.POSITIVE_INFINITY;
        if (!bestAttemptDiagnostic || diagnosticConflictCount < bestConflictCount) bestAttemptDiagnostic = diagnostic;
        const candidate = {
          ...context,
          settings,
          feasibility,
          solver: {
            status: solved.status,
            strategy: solved.strategy || "constraint-solver",
            nodesVisited: solved.nodesVisited || 0,
            candidateCount: solved.candidateCount || 0,
            conflictChecks: solved.conflictChecks || 0,
            polishMoves: solved.polishMoves || 0,
            pairPolishMoves: solved.pairPolishMoves || 0,
            polishPasses: solved.polishPasses || 0,
            truncatedDomainCount: solved.truncatedDomainCount || 0
          },
          placementQuality,
          placed,
          requestedMapScale,
          autoFitDiagnostic: diagnostic
        };
        if (isBetterScaleFallback(candidate, fallback)) fallback = candidate;
        if (solved.status === "solved" && placementQualityAcceptable(placementQuality)) {
          return { candidate, sawBudgetExhaustion, diagnostic };
        }
      }
      return { candidate: null, sawBudgetExhaustion, diagnostic: bestAttemptDiagnostic };
    }

    // First find a feasible foothold cheaply. The expensive former search ran a
    // full CSP at every one-percent scale. A coarse descent skips most
    // impossible scales, then a warm-started one-percent ascent finds the
    // largest conflict-free layout within the bounded search budget.
    const coarseStep = 10;
    let bestSolved = null;
    const coarseScales = referenceCanvas
      ? Array.from({ length: Math.floor((searchMaxScale - minScale) / 5) + 1 }, (_, index) => searchMaxScale - index * 5)
      : Array.from({ length: Math.floor((searchMaxScale - minScale) / coarseStep) + 1 }, (_, index) => searchMaxScale - index * coarseStep);
    const coarseMisses = [];
    for (const scale of coarseScales) {
      const result = tryScale(scale, "coarse", {
        maxCandidatesPerLabel: referenceCanvas ? 64 : 48,
        maxNodes: referenceCanvas ? 20000 : 6000,
        computeSupportOrdering: false,
        seedWithHeuristic: true,
        minConflictRestarts: referenceCanvas ? 5 : 2,
        minConflictSteps: referenceCanvas ? 900 : 300,
        pairPolishMoves: referenceCanvas ? 3 : 0,
        pairPolishCandidates: 8,
        minConflictsOnly: true
      });
      if (!result.candidate && result.sawBudgetExhaustion) unresolvedAbove.push(scale);
      if (result.candidate) {
        bestSolved = result.candidate;
        break;
      }
      coarseMisses.push({ scale, result });
    }

    if (!bestSolved && !referenceCanvas) {
      const promisingScales = coarseMisses
        .filter(item => Number.isFinite(item.result.diagnostic && item.result.diagnostic.bestConflictCount))
        .sort((a, b) => (
          a.result.diagnostic.bestConflictCount - b.result.diagnostic.bestConflictCount
          || b.scale - a.scale
        ))
        .slice(0, 3);
      for (const item of promisingScales) {
        const result = tryScale(item.scale, "coarse-retry", {
          maxCandidatesPerLabel: 64,
          computeSupportOrdering: false,
          seedWithHeuristic: true,
          minConflictRestarts: 6,
          minConflictSteps: 1200,
          minConflictsOnly: true
        });
        if (result.candidate) {
          bestSolved = result.candidate;
          break;
        }
      }
    }

    if (!bestSolved) {
      const recovery = tryScale(minScale, "recovery", {
        maxCandidatesPerLabel: referenceCanvas ? 72 : 96,
        maxNodes: 40000,
        computeSupportOrdering: false,
        seedWithHeuristic: true,
        minConflictRestarts: referenceCanvas ? 10 : 16,
        minConflictSteps: referenceCanvas ? 1500 : 2200,
        minConflictsOnly: true
      });
      bestSolved = recovery.candidate;
    }

    if (bestSolved) {
      for (let scale = bestSolved.settings.mapScale + 1; scale <= searchMaxScale; scale += 1) {
        const preferredTranslation = {
          mapOffsetX: Number(bestSolved.settings.mapOffsetX) || 0,
          mapOffsetY: Number(bestSolved.settings.mapOffsetY) || 0
        };
        let result = tryScale(scale, "refine", {
          maxCandidatesPerLabel: 28,
          maxNodes: 12000,
          computeSupportOrdering: false,
          minConflictRestarts: 4,
          minConflictSteps: 700,
          minConflictsOnly: true
        }, bestSolved.placed, preferredTranslation);

        if (!result.candidate && result.sawBudgetExhaustion) {
          result = tryScale(scale, "refine-retry", {
            maxCandidatesPerLabel: 36,
            maxNodes: 40000,
            computeSupportOrdering: false,
            minConflictRestarts: 8,
            minConflictSteps: 1200,
            minConflictsOnly: true
          }, bestSolved.placed, preferredTranslation);
        }

        if (!result.candidate) {
          if (result.sawBudgetExhaustion) unresolvedAbove.push(scale);
          break;
        }
        bestSolved = result.candidate;
      }

      autoFitDiagnostics = {
        attempts,
        selected: bestSolved.autoFitDiagnostic,
        unresolvedAbove: Array.from(new Set(unresolvedAbove))
          .filter(scale => scale > bestSolved.settings.mapScale)
          .sort((a, b) => b - a)
      };
      return bestSolved;
    }

    autoFitDiagnostics = {
      attempts,
      selected: null,
      unresolvedAbove: Array.from(new Set(unresolvedAbove)).sort((a, b) => b - a)
    };
    return fallback || createMapLayoutContext(visibleGeo, rows, baseSettings);
  }

  function getVisibleRegionSignature() {
    const visibility = Object.keys(regionVisibility)
      .sort()
      .map(name => `${name}:${regionVisibility[name] === false ? 0 : 1}`)
      .join("|");
    const statuses = Object.keys(regionStatuses)
      .sort()
      .map(name => `${name}:${normalizeRegionStatus(regionStatuses[name])}`)
      .join("|");
    const statusVisibility = regionStatusOptions
      .filter(option => option.value)
      .map(option => `${option.value}:${isRegionStatusVisible(option.value) ? 1 : 0}`)
      .join("|");
    return `${visibility}::${statuses}::${statusVisibility}`;
  }

  function getLayoutCacheKey(rows, settings, resizeMap) {
    const rowSignature = rows.map(row => [
      row.rowId,
      row.name,
      row.nameFr,
      row.footnote,
      row.type,
      row.lon,
      row.lat,
      row.anchor || "coord",
      row.region || "",
      row.labelStyle || "compact",
      JSON.stringify(row.content || []),
      row.labelBorder ? 1 : 0,
      row.hideLine ? 1 : 0,
      row.elbowLeader ? 1 : 0,
      row.leaderLineWidth || "",
      row.leaderLineColour || "",
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
      regionStatuses,
      regionColourOverrides,
      manualBoxPositions,
      width: settings.width,
      height: settings.height,
      mapScale: settings.mapScale,
      mapOffsetX: Number(settings.mapOffsetX) || 0,
      mapOffsetY: Number(settings.mapOffsetY) || 0,
      labelSizeRender: settings.labelSizeRender,
      labelTitleSizeRender: settings.labelTitleSizeRender,
      labelBodySizeRender: settings.labelBodySizeRender,
      labelMaxChars: settings.labelMaxChars,
      markerSize: settings.markerSize,
      lineWidth: settings.lineWidth,
      leaderColour: settings.leaderColour,
      hideLeaderLines: settings.hideLeaderLines ? 1 : 0,
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

  function cloneCachedLayoutSettings(settings = {}) {
    const { labelTouchesLand: _labelTouchesLand, ...cacheableSettings } = settings;
    return {
      ...cacheableSettings,
      layoutObstacles: Array.isArray(settings.layoutObstacles)
        ? settings.layoutObstacles.map(obstacle => ({ ...obstacle }))
        : settings.layoutObstacles
    };
  }

  function cloneLayoutBundle(bundle) {
    if (!bundle) return null;
    return {
      settings: cloneCachedLayoutSettings(bundle.settings),
      layoutContext: {
        ...bundle.layoutContext,
        settings: cloneCachedLayoutSettings(bundle.layoutContext.settings),
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
    const selectedLayoutContext = resizeMap
      ? chooseFeasibleMapLayoutContext(visibleGeo, rows, baseSettings, options)
      : createMapLayoutContext(visibleGeo, rows, baseSettings);
    const { placed: precomputedPlaced = null, ...layoutContext } = selectedLayoutContext;
    const settings = layoutContext.settings;
    settings.layoutObstacles = getLayoutBoxObstacles(settings, layoutContext.calloutRows);
    const labelRows = layoutContext.mappedRows.filter(row => row.name);
    const placed = precomputedPlaced || layoutLabels(labelRows, settings, layoutContext.mapBounds, {
        applyManual: options.ignoreManualPositions !== true
      });
    return { settings, layoutContext, placed };
  }

  function layoutLabels(points, settings, mapBounds, options = {}) {
    const placed = layoutLabelsWithoutManualPositions(points, settings, mapBounds);
    const positioned = applyManualLabelPositions(placed, options.applyManual !== false);
    positioned.forEach(label => {
      const constrained = constrainLabelToCanvas(label, settings);
      if (!constrained.wasConstrained) return;
      label.labelX = constrained.labelX;
      label.labelY = constrained.labelY;
      if (manualLabelPositions[label.labelKey]) {
        manualLabelPositions[label.labelKey] = {
          x: label.labelX,
          y: label.labelY,
          side: label.labelSide
        };
      }
    });
    return positioned;
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
    const box = labelBackgroundRect(d);
    const gap = 4;
    if (d.labelSide === "left") return { x: box.x1 + gap, y: box.centerY };
    if (d.labelSide === "right") return { x: box.x0 - gap, y: box.centerY };
    if (d.labelSide === "top") return { x: box.centerX, y: box.y1 + gap };
    return { x: box.centerX, y: box.y0 - gap };
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
    const paddingScale = Number(d.collisionPaddingScale) || 1;
    const padX = Math.max(4, 8 * paddingScale);
    const padY = Math.max(2.5, 5 * paddingScale);
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
    return labelVisualBox(d, Math.max(5, 10 * (Number(d.collisionPaddingScale) || 1)));
  }

  function getLabelSideForPosition(d) {
    const box = labelVisualBox(d);
    const dx = box.centerX - d.x;
    const dy = box.centerY - d.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
    return dy < 0 ? "top" : "bottom";
  }

  function setLabelSidePreservingBox(d, side) {
    const box = labelVisualBox(d);
    d.labelSide = side;
    d.anchor = side === "left" ? "end" : "start";
    d.labelX = side === "left" ? box.x1 : box.x0;
    d.labelY = box.y0 + labelFontSize(d);
    return d;
  }

  function getQualityIssueKey(type, row) {
    const labelKey = row && (row.labelKey || getLabelKey(row));
    return `${type}:${labelKey || row && row.rowId || ""}`;
  }

  function addQualityIssueTarget(targets, seen, type, row) {
    if (!row) return;
    const labelKey = row.labelKey || getLabelKey(row);
    const key = getQualityIssueKey(type, row);
    if (!labelKey || seen.has(key)) return;
    seen.add(key);
    targets.push({
      type,
      rowId: row.rowId,
      labelKey,
      layoutId: row.layoutId,
      name: labelKeyText(row)
    });
  }

  function snapshotQualityTarget(row) {
    return {
      rowId: row.rowId,
      labelKey: row.labelKey || getLabelKey(row),
      layoutId: row.layoutId,
      name: String(row.name || "")
    };
  }

  function createLayoutQualityAnalyzer(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds, markerRows = placed) {
    let crossings = 0;
    let leaderLabelCrossings = 0;
    let overlaps = 0;
    let minLabelGap = Infinity;
    const placedByRowId = new Map(placed.map(row => [String(row.rowId), row]));
    const markerItems = (Array.isArray(markerRows) ? markerRows : placed)
      .map(row => placedByRowId.get(String(row.rowId)) || row);
    const offCanvasPointItems = markerItems.filter(row => isPointOffCanvas(row, settings));
    const lines = placed
      .filter(d => !settings.hideLeaderLines && !d.hideLine)
      .map(d => ({
        segments: leaderSegmentsForLabel(d, settings),
        length: leaderPathLength(d, settings),
        target: snapshotQualityTarget(d)
      }));
    const rectItems = placed.map(d => ({
      target: snapshotQualityTarget(d),
      rect: labelBackgroundRect(d)
    }));
    const rects = rectItems.map(item => item.rect);
    const qualityTargets = [];
    const qualityTargetKeys = new Set();
    const edgeLimit = Math.max(10, settings.labelSizeRender || settings.labelSize || 12);
    const labelsNearEdgeItems = rectItems.filter(({ rect }) => (
      rect.x0 < edgeLimit
      || rect.y0 < edgeLimit
      || settings.width - rect.x1 < edgeLimit
      || settings.height - rect.y1 < edgeLimit
    ));
    const labelsNearEdge = labelsNearEdgeItems.length;
    const hasLeaderLabelPairs = lines.length > 0 && rects.length > 1;
    let phase = lines.length > 1
      ? "line-pairs"
      : hasLeaderLabelPairs
        ? "line-labels"
        : rects.length > 1
          ? "rect-pairs"
          : "finalize";
    let pairI = 0;
    let pairJ = 1;
    let lineRectI = 0;
    let lineRectJ = 0;
    let report = null;

    function advancePair(length, nextPhase) {
      pairJ += 1;
      if (pairJ < length) return;
      pairI += 1;
      pairJ = pairI + 1;
      if (pairI < length - 1) return;
      phase = nextPhase;
      pairI = 0;
      pairJ = 1;
    }

    function processLinePair() {
      const left = lines[pairI];
      const right = lines[pairJ];
      const crosses = left.segments.some(a => right.segments.some(b => segmentsCross(a.start, a.end, b.start, b.end)));
      if (crosses) {
        crossings++;
        addQualityIssueTarget(qualityTargets, qualityTargetKeys, "crossing", left.target);
        addQualityIssueTarget(qualityTargets, qualityTargetKeys, "crossing", right.target);
      }
      advancePair(lines.length, hasLeaderLabelPairs ? "line-labels" : rects.length > 1 ? "rect-pairs" : "finalize");
    }

    function targetsMatch(left, right) {
      if (!left || !right) return false;
      if (left.layoutId && right.layoutId) return left.layoutId === right.layoutId;
      if (left.labelKey && right.labelKey) return left.labelKey === right.labelKey;
      return String(left.rowId || "") === String(right.rowId || "");
    }

    function processLineLabelPair() {
      const line = lines[lineRectI];
      const rectItem = rectItems[lineRectJ];
      if (!targetsMatch(line.target, rectItem.target)) {
        const crosses = line.segments.some(segment => (
          segmentIntersectsRect(segment.start, segment.end, rectItem.rect)
        ));
        if (crosses) {
          leaderLabelCrossings += 1;
          crossings += 1;
          addQualityIssueTarget(qualityTargets, qualityTargetKeys, "crossing", line.target);
          addQualityIssueTarget(qualityTargets, qualityTargetKeys, "crossing", rectItem.target);
        }
      }
      lineRectJ += 1;
      if (lineRectJ < rectItems.length) return;
      lineRectI += 1;
      lineRectJ = 0;
      if (lineRectI < lines.length) return;
      phase = rects.length > 1 ? "rect-pairs" : "finalize";
      pairI = 0;
      pairJ = 1;
    }

    function processRectPair() {
      const left = rects[pairI];
      const right = rects[pairJ];
      if (rectsOverlap(left, right)) {
        overlaps++;
        addQualityIssueTarget(qualityTargets, qualityTargetKeys, "overlap", rectItems[pairI].target);
        addQualityIssueTarget(qualityTargets, qualityTargetKeys, "overlap", rectItems[pairJ].target);
        minLabelGap = 0;
      } else {
        const dx = Math.max(0, Math.max(left.x0 - right.x1, right.x0 - left.x1));
        const dy = Math.max(0, Math.max(left.y0 - right.y1, right.y0 - left.y1));
        minLabelGap = Math.min(minLabelGap, Math.hypot(dx, dy));
      }
      advancePair(rects.length, "finalize");
    }

    function finalize() {
      offCanvasPointItems.forEach(item => addQualityIssueTarget(qualityTargets, qualityTargetKeys, "off-canvas-point", item));
      labelsNearEdgeItems.forEach(item => addQualityIssueTarget(qualityTargets, qualityTargetKeys, "near-edge", item.target));
      const longLineItems = lines.filter(line => line.length > maxAllowedLeaderLength(settings));
      longLineItems.forEach(line => addQualityIssueTarget(qualityTargets, qualityTargetKeys, "long-line", line.target));
      const longestLeader = lines.reduce((best, line) => !best || line.length > best.length ? line : best, null);
      report = {
        crossings,
        leaderLabelCrossings,
        overlaps,
        longLines: longLineItems.length,
        offCanvasPoints: offCanvasPointItems.length,
        projectedProblems,
        hiddenRegionProblems,
        labelsNearEdge,
        minLabelGap: Number.isFinite(minLabelGap) ? minLabelGap : null,
        longestLeaderLength: longestLeader ? longestLeader.length : 0,
        longestLeaderName: longestLeader ? longestLeader.target.name : "",
        qualityTargets
      };
      phase = "done";
    }

    function step(options = {}) {
      if (phase === "done") return true;
      const maxOperations = Number.isFinite(Number(options.maxOperations))
        ? Math.max(1, Number(options.maxOperations))
        : Infinity;
      const budgetMs = Number.isFinite(Number(options.budgetMs))
        ? Math.max(1, Number(options.budgetMs))
        : Infinity;
      const deadline = options.deadline;
      const isTimeBounded = Number.isFinite(budgetMs) || Boolean(deadline && typeof deadline.timeRemaining === "function");
      const startedAt = isTimeBounded ? performanceNow() : 0;
      let operations = 0;
      while (phase !== "done") {
        if (phase === "line-pairs") processLinePair();
        else if (phase === "line-labels") processLineLabelPair();
        else if (phase === "rect-pairs") processRectPair();
        else finalize();
        operations += 1;
        if (phase === "done" || operations >= maxOperations) break;
        if (isTimeBounded && operations % 32 === 0) {
          const idleTimeLow = deadline
            && !deadline.didTimeout
            && typeof deadline.timeRemaining === "function"
            && deadline.timeRemaining() < 1;
          if (idleTimeLow || performanceNow() - startedAt >= budgetMs) break;
        }
      }
      return phase === "done";
    }

    return {
      step,
      isComplete: () => phase === "done",
      getReport: () => report
    };
  }

  function analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds, markerRows = placed) {
    const analyzer = createLayoutQualityAnalyzer(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds, markerRows);
    analyzer.step();
    return analyzer.getReport();
  }

  function recomputeLayoutQualityReport(layout = lastLayout) {
    if (!layout || !Array.isArray(layout.placed) || !layout.settings || !layout.mapBounds) return null;
    const previousReport = layout.report || {};
    const report = analyzeLayout(
      layout.placed,
      layout.settings,
      Array.isArray(previousReport.projectedProblems) ? previousReport.projectedProblems : [],
      Array.isArray(previousReport.hiddenRegionProblems) ? previousReport.hiddenRegionProblems : [],
      layout.mapBounds,
      Array.isArray(layout.mappedRows) ? layout.mappedRows : layout.placed
    );
    attachReferenceCityDiagnostics(report, createReferenceCityRenderState(layout.projection, layout.settings, layout.placed));
    layout.report = report;
    return report;
  }

  function isQualityRefreshPending() {
    return qualityRefreshAwaitingRender || qualityRefreshDirty || qualityRefreshScheduled;
  }

  function isQualityRefreshUnavailable() {
    return isQualityRefreshPending() || Boolean(qualityRefreshError);
  }

  function getQualityAnalysisSnapshot() {
    return {
      requests: qualityAnalysisTelemetry.requests,
      started: qualityAnalysisTelemetry.started,
      completed: qualityAnalysisTelemetry.completed,
      superseded: qualityAnalysisTelemetry.superseded,
      coalesced: qualityAnalysisTelemetry.coalesced,
      slices: qualityAnalysisTelemetry.slices,
      failed: qualityAnalysisTelemetry.failed,
      pending: isQualityRefreshPending(),
      awaitingRender: qualityRefreshAwaitingRender,
      error: qualityRefreshError,
      revision: qualityRefreshGeneration,
      geometryRevision: qualityGeometryRevision,
      activeDrags: activeQualityGeometryDrags
    };
  }

  function setQualityRefreshBusy(isBusy) {
    const busy = Boolean(isBusy);
    const actionsBlocked = busy || Boolean(qualityRefreshError);
    if (els.qualityTablePane) els.qualityTablePane.setAttribute("aria-busy", String(busy));
    if (els.canvasQualityPill) {
      els.canvasQualityPill.classList.toggle("is-updating", busy);
      els.canvasQualityPill.setAttribute("aria-busy", String(busy));
      if (busy) els.canvasQualityPill.dataset.updatingLabel = t("summary.qualityChecking");
      else delete els.canvasQualityPill.dataset.updatingLabel;
    }
    [els.canvasQualityPill, els.qualityTablePane, els.propertiesSelectionControls].forEach(root => {
      root?.querySelectorAll("[data-property-action='open-map']").forEach(action => {
        action.disabled = actionsBlocked;
      });
    });
  }

  function showPendingQualityRefresh(options = {}) {
    setQualityRefreshBusy(true);
    if (options.refreshSurfaces === false) return;
    updateWorkspaceSummary();
    if (activeDataTable === "quality") {
      refreshQualityMetricsPanel();
      renderPropertiesForActiveState({ kind: "quality" });
    }
  }

  function clearQualityRefreshHandle() {
    if (qualityRefreshHandle === null) return;
    if (qualityRefreshHandleType === "idle" && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(qualityRefreshHandle);
    } else {
      window.clearTimeout(qualityRefreshHandle);
    }
    qualityRefreshHandle = null;
    qualityRefreshHandleType = "";
  }

  function cancelBackgroundQualityRefresh(options = {}) {
    const wasPending = qualityRefreshScheduled || qualityRefreshWork;
    qualityRefreshGeneration += 1;
    clearQualityRefreshHandle();
    qualityRefreshWork = null;
    qualityRefreshScheduled = false;
    qualityRefreshPriority = false;
    if (Object.prototype.hasOwnProperty.call(options, "markDirty")) {
      qualityRefreshDirty = Boolean(options.markDirty);
    }
    if (wasPending) qualityAnalysisTelemetry.superseded += 1;
    if (!options.preserveBusy) setQualityRefreshBusy(false);
  }

  function markQualityRefreshAwaitingRender(options = {}) {
    const stateChanged = !qualityRefreshAwaitingRender || Boolean(qualityRefreshError) || qualityRefreshScheduled || qualityRefreshWork;
    qualityRefreshError = "";
    if (qualityRefreshScheduled || qualityRefreshWork) {
      cancelBackgroundQualityRefresh({ markDirty: true, preserveBusy: true });
    } else {
      qualityRefreshDirty = true;
    }
    qualityRefreshAwaitingRender = true;
    if (stateChanged) showPendingQualityRefresh(options);
    else setQualityRefreshBusy(true);
  }

  function completeQualityRefreshFromRender() {
    clearQualityRefreshHandle();
    qualityRefreshWork = null;
    qualityRefreshScheduled = false;
    qualityRefreshDirty = false;
    qualityRefreshPriority = false;
    qualityRefreshAwaitingRender = false;
    qualityRefreshError = "";
    qualityGeometryDragNeedsSchedule = false;
    setQualityRefreshBusy(false);
  }

  function failQualityRefresh(error) {
    clearQualityRefreshHandle();
    qualityRefreshWork = null;
    qualityRefreshScheduled = false;
    qualityRefreshDirty = false;
    qualityRefreshPriority = false;
    qualityRefreshAwaitingRender = false;
    qualityRefreshError = String(error && error.message || error || "unknown error");
    qualityAnalysisTelemetry.failed += 1;
    setQualityRefreshBusy(false);
    refreshQualitySurfaces();
  }

  function refreshQualitySurfaces(options = {}) {
    const report = lastLayout && lastLayout.report;
    if (!isQualityRefreshUnavailable()) restoreActiveQualityLocateTarget();
    const showChecklist = options.showChecklist !== undefined
      ? Boolean(options.showChecklist)
      : activeDataTable === "quality";
    if (report && showChecklist && !isQualityRefreshUnavailable()) {
      updateStatus(
        getRows(),
        Array.isArray(lastLayout.mappedRows) ? lastLayout.mappedRows : lastLayout.placed,
        Array.isArray(lastLayout.calloutRows) ? lastLayout.calloutRows : [],
        report,
        true
      );
    } else {
      refreshQualityMetricsPanel();
      updateWorkspaceSummary({ report });
    }
    if (options.refreshProperties !== false && activeDataTable === "quality") {
      renderPropertiesForActiveState({ kind: "quality" });
    }
    return report;
  }

  function queueQualityAnalysisChunk(token, priority = qualityRefreshPriority) {
    const callback = deadline => runQualityAnalysisChunk(token, deadline);
    if (!priority && typeof window.requestIdleCallback === "function") {
      qualityRefreshHandleType = "idle";
      qualityRefreshHandle = window.requestIdleCallback(callback, { timeout: 400 });
      return;
    }
    qualityRefreshHandleType = "timeout";
    qualityRefreshHandle = window.setTimeout(() => callback(null), 0);
  }

  function setQualityAnalysisPriority(priority) {
    const nextPriority = Boolean(priority);
    if (!qualityRefreshScheduled || qualityRefreshPriority === nextPriority) return;
    qualityRefreshPriority = nextPriority;
    const shouldRequeue = (nextPriority && qualityRefreshHandleType === "idle")
      || (!nextPriority && qualityRefreshHandleType === "timeout" && typeof window.requestIdleCallback === "function");
    if (!shouldRequeue) return;
    clearQualityRefreshHandle();
    queueQualityAnalysisChunk(qualityRefreshGeneration, nextPriority);
  }

  function restartBackgroundQualityRefresh(token) {
    if (token !== qualityRefreshGeneration) return false;
    cancelBackgroundQualityRefresh({ markDirty: true, preserveBusy: true });
    if (!qualityRefreshAwaitingRender && activeQualityGeometryDrags === 0 && lastLayout) {
      return scheduleBackgroundQualityRefresh({
        priority: activeDataTable === "quality",
        refreshSurfaces: false
      });
    }
    showPendingQualityRefresh({ refreshSurfaces: false });
    return false;
  }

  function finishBackgroundQualityRefresh(token, work, report) {
    if (
      token !== qualityRefreshGeneration
      || work.layout !== lastLayout
      || work.geometryRevision !== qualityGeometryRevision
    ) {
      restartBackgroundQualityRefresh(token);
      return false;
    }
    attachReferenceCityDiagnostics(report, createReferenceCityRenderState(work.layout.projection, work.layout.settings, work.layout.placed));
    work.layout.report = report;
    if (Array.isArray(work.mappedRows)) work.layout.mappedRows = work.mappedRows;
    if (Array.isArray(work.calloutRows)) work.layout.calloutRows = work.calloutRows;
    qualityRefreshWork = null;
    qualityRefreshScheduled = false;
    qualityRefreshDirty = false;
    qualityRefreshPriority = false;
    qualityRefreshError = "";
    qualityAnalysisTelemetry.completed += 1;
    setQualityRefreshBusy(false);
    refreshQualitySurfaces();
    return true;
  }

  function runQualityAnalysisChunk(token, deadline) {
    if (token !== qualityRefreshGeneration) return;
    if (!qualityRefreshDirty || qualityRefreshAwaitingRender || !lastLayout) {
      cancelBackgroundQualityRefresh({ markDirty: false });
      return;
    }
    qualityRefreshHandle = null;
    qualityRefreshHandleType = "";
    try {
      if (!qualityRefreshWork) {
        const layout = lastLayout;
        const previousReport = layout.report || {};
        const rowProjection = layout.projection && layout.path && layout.visibleGeo
          ? projectRowsForLayout(getRows(), layout.projection, layout.path, layout.visibleGeo)
          : null;
        qualityRefreshWork = {
          layout,
          geometryRevision: qualityGeometryRevision,
          mappedRows: rowProjection ? rowProjection.mappedRows : layout.mappedRows,
          calloutRows: rowProjection ? rowProjection.calloutRows : layout.calloutRows,
          analyzer: createLayoutQualityAnalyzer(
            layout.placed,
            layout.settings,
            rowProjection
              ? rowProjection.projectedProblems
              : Array.isArray(previousReport.projectedProblems) ? previousReport.projectedProblems : [],
            rowProjection
              ? rowProjection.hiddenRegionProblems
              : Array.isArray(previousReport.hiddenRegionProblems) ? previousReport.hiddenRegionProblems : [],
            layout.mapBounds,
            rowProjection
              ? rowProjection.mappedRows
              : Array.isArray(layout.mappedRows) ? layout.mappedRows : layout.placed
          )
        };
        qualityAnalysisTelemetry.started += 1;
      }
      qualityAnalysisTelemetry.slices += 1;
      const complete = qualityRefreshWork.analyzer.step({
        maxOperations: 50000,
        budgetMs: 7,
        deadline
      });
      if (token !== qualityRefreshGeneration) return;
      if (
        qualityRefreshWork.layout !== lastLayout
        || qualityRefreshWork.geometryRevision !== qualityGeometryRevision
      ) {
        restartBackgroundQualityRefresh(token);
        return;
      }
      if (!complete) {
        queueQualityAnalysisChunk(token);
        return;
      }
      finishBackgroundQualityRefresh(token, qualityRefreshWork, qualityRefreshWork.analyzer.getReport());
    } catch (error) {
      if (token !== qualityRefreshGeneration) return;
      failQualityRefresh(error);
      if (window.console && typeof window.console.error === "function") {
        console.error("Plotypus quality analysis failed.", error);
      }
    }
  }

  function scheduleBackgroundQualityRefresh(options = {}) {
    if (!lastLayout || !Array.isArray(lastLayout.placed)) return false;
    if (qualityRefreshAwaitingRender || activeQualityGeometryDrags > 0) {
      qualityRefreshDirty = true;
      showPendingQualityRefresh(options);
      return false;
    }
    qualityAnalysisTelemetry.requests += 1;
    qualityRefreshError = "";
    qualityRefreshDirty = true;
    const priority = Boolean(options.priority || activeDataTable === "quality");
    if (qualityRefreshScheduled) {
      qualityAnalysisTelemetry.coalesced += 1;
      if (priority !== qualityRefreshPriority) setQualityAnalysisPriority(priority);
      showPendingQualityRefresh(options);
      return true;
    }
    qualityRefreshGeneration += 1;
    qualityRefreshScheduled = true;
    qualityRefreshPriority = priority;
    showPendingQualityRefresh(options);
    queueQualityAnalysisChunk(qualityRefreshGeneration, priority);
    return true;
  }

  function beginLayoutQualityDrag() {
    activeQualityGeometryDrags += 1;
  }

  function markLayoutQualityDirty() {
    qualityGeometryRevision += 1;
    qualityGeometryDragNeedsSchedule = true;
    qualityRefreshError = "";
    if (qualityRefreshScheduled || qualityRefreshWork) {
      cancelBackgroundQualityRefresh({ markDirty: true, preserveBusy: true });
    } else {
      qualityRefreshDirty = true;
    }
    setQualityRefreshBusy(true);
  }

  function endLayoutQualityDrag() {
    activeQualityGeometryDrags = Math.max(0, activeQualityGeometryDrags - 1);
    if (activeQualityGeometryDrags > 0 || !qualityGeometryDragNeedsSchedule) return;
    qualityGeometryDragNeedsSchedule = false;
    if (!qualityRefreshAwaitingRender) scheduleBackgroundQualityRefresh();
  }

  function checklistItem(state, label, detail, action = null) {
    const className = state === "ok" ? "status-ok" : state === "danger" ? "status-danger" : state === "info" ? "status-neutral" : "status-warning";
    const stateLabel = state === "ok"
      ? t("quality.check.status.ok")
      : state === "info"
        ? t("quality.check.status.info")
        : t("quality.check.status.review");
    return `
      <div class="checklist-item ${className}">
        <span class="checklist-state">${escapeHtml(stateLabel)}</span>
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
    const megapixels = formatLocalizedDecimal(pngWidth * pngHeight / 1000000, currentUiLanguage, 1);
    return t("quality.exportSizeMessage", {
      width: settings.width,
      height: settings.height,
      pngWidth,
      pngHeight,
      megapixels
    });
  }

  function formatLocalizedDecimal(value, language = currentUiLanguage, fractionDigits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value || "");
    try {
      return new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
      }).format(number);
    } catch (_error) {
      const fallback = number.toFixed(fractionDigits);
      return language === "fr" ? fallback.replace(".", ",") : fallback;
    }
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

    if (baselayer.referenceCities.ids.length) {
      const unresolvedReferenceCities = (report.referenceCityUnresolvedIds || []).length;
      const excludedReferenceCities = (report.referenceCityExcludedRegionIds || []).length;
      const unsupportedReferenceCities = (report.referenceCityUnsupportedBoundaryIds || []).length;
      const referenceProblemCount = unresolvedReferenceCities + excludedReferenceCities + unsupportedReferenceCities;
      checklist.push(referenceProblemCount
        ? checklistItem(
          unresolvedReferenceCities ? "danger" : "warning",
          t("quality.check.referenceCities"),
          t("quality.check.referenceCitiesProblems", {
            unresolved: unresolvedReferenceCities,
            excluded: excludedReferenceCities,
            unsupported: unsupportedReferenceCities
          })
        )
        : checklistItem("ok", t("quality.check.referenceCities"), t("quality.check.referenceCitiesReady", { count: baselayer.referenceCities.ids.length })));
      checklist.push(report.referenceCityHiddenLabelCount
        ? checklistItem("info", t("quality.check.referenceCityLabels"), t("quality.check.referenceCityLabelsHidden", { count: report.referenceCityHiddenLabelCount }))
        : checklistItem("ok", t("quality.check.referenceCityLabels"), t("quality.check.referenceCityLabelsVisible")));
    }

    checklist.push(report.projectedProblems.length
      ? checklistItem("danger", t("quality.check.invalidCoordinates"), t("quality.check.invalidCoordinatesDetail", { count: report.projectedProblems.length }))
      : checklistItem("ok", t("quality.check.coordinateRanges"), t("quality.check.coordinateRangesDetail")));

    checklist.push(Number(report.offCanvasPoints || 0)
      ? checklistItem("danger", t("quality.check.offCanvasPoints"), t("quality.check.offCanvasPointsDetail", { count: report.offCanvasPoints }))
      : checklistItem("ok", t("quality.check.pointsInsideCanvas"), t("quality.check.pointsInsideCanvasDetail")));

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
    const useRegions = isRegionLocationMode();
    const useCities = isCityLocationMode();
    const mappedCount = rows.filter(row => useRegions ? row.anchor === "region" && row.region : useCities ? row.anchor === "city" && row.cityId : row.lon !== "" && row.lat !== "").length;
    const missingCoordinateCount = rows.filter(row => useRegions ? row.anchor === "region" && !row.region && (row.name || row.nameFr) : useCities ? row.anchor === "city" && !row.cityId && (row.name || row.nameFr) : (row.lon === "") !== (row.lat === "")).length;
    const calloutCount = rows.filter(row => useRegions || useCities ? false : row.lon === "" && row.lat === "").length;
    const categoryNames = Array.from(new Set(rows.map(row => getCategoryLabel(row.type, currentUiLanguage))));
    return { mappedCount, calloutCount, missingCoordinateCount, categoryNames };
  }

  function renderCsvPreviewRows(rows) {
    const previewRows = rows.slice(0, 6);
    const useRegions = isRegionLocationMode();
    const useCities = isCityLocationMode();
    const locationMode = useRegions ? "regions" : useCities ? "cities" : "coordinates";
    if (!previewRows.length) {
      return `<div class="csv-preview-empty">${escapeHtml(t("dialog.csv.noImportableRows"))}</div>`;
    }
    return `
      <div class="csv-preview-table-wrap">
        <table class="csv-preview-table" data-location-mode="${locationMode}">
          <thead>
            <tr>
              <th class="csv-preview-name-col">${escapeHtml(t("dialog.csv.previewProjectName"))}</th>
              <th class="csv-preview-type-col">${escapeHtml(t("dialog.csv.previewType"))}</th>
              ${useRegions ? `<th class="csv-preview-region-col">${escapeHtml(t("dialog.csv.field.region"))}</th>` : useCities ? `<th class="csv-preview-region-col">${escapeHtml(t("dialog.csv.field.city"))}</th>` : `<th class="csv-preview-coordinate-col">${escapeHtml(t("dialog.csv.previewLongitude"))}</th><th class="csv-preview-coordinate-col">${escapeHtml(t("dialog.csv.previewLatitude"))}</th>`}
              <th class="csv-preview-status-col">${escapeHtml(t("dialog.csv.previewStatus"))}</th>
            </tr>
          </thead>
          <tbody>
            ${previewRows.map(row => {
              const hasLon = row.lon !== "";
              const hasLat = row.lat !== "";
              const hasRegion = row.anchor === "region" && row.region;
              const hasCity = row.anchor === "city" && row.cityId;
              const statusState = useRegions ? hasRegion ? "mapped" : "coordinate-issue" : useCities ? hasCity ? "mapped" : "coordinate-issue" : hasLon && hasLat ? "mapped" : hasLon || hasLat ? "coordinate-issue" : "callout";
              const status = useRegions ? hasRegion ? t("table.status.mapped") : t("project.status.coordinateIssue") : useCities ? hasCity ? t("project.status.mappedCity") : t("table.status.missingCity") : hasLon && hasLat ? t("table.status.mapped") : hasLon || hasLat ? t("project.status.coordinateIssue") : t("table.status.callout");
              return `
                <tr>
                  <td class="csv-preview-name-cell">${escapeHtml(row.name || t("dialog.csv.previewBlank"))}</td>
                  <td class="csv-preview-type-cell">${escapeHtml(getCategoryLabel(row.type))}</td>
                  ${useRegions ? `<td class="csv-preview-region-cell">${escapeHtml(row.region || "")}</td>` : useCities ? `<td class="csv-preview-region-cell">${escapeHtml(getProjectCityFallbackLabel(row))}</td>` : `<td class="csv-preview-coordinate-cell">${escapeHtml(formatProjectCoordinate(row.lon))}</td><td class="csv-preview-coordinate-cell">${escapeHtml(formatProjectCoordinate(row.lat))}</td>`}
                  <td class="csv-preview-status-cell"><span class="csv-preview-badge" data-state="${escapeHtml(statusState)}">${escapeHtml(status)}</span></td>
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
            <strong class="type-card-title">${escapeHtml(t("dialog.csv.previewTitle"))}</strong>
            <span class="type-caption">${escapeHtml(report.fileName || t("dialog.csv.selectedCsv"))}</span>
          </div>
          <div class="status-actions">
            <button type="button" data-status-action="confirm-csv-import"${importDisabled}>${escapeHtml(t("dialog.csv.importRowsShort"))}</button>
            <button type="button" data-status-action="cancel-csv-import">${escapeHtml(t("dialog.common.cancel"))}</button>
          </div>
        </div>
        <div class="csv-preview-metrics">
          <div><strong class="type-data">${rows.length}</strong><span class="type-caption">${escapeHtml(t("summary.rows"))}</span></div>
          <div><strong class="type-data">${summary.mappedCount}</strong><span class="type-caption">${escapeHtml(t("summary.mapped"))}</span></div>
          <div><strong class="type-data">${summary.calloutCount}</strong><span class="type-caption">${escapeHtml(t("properties.metric.callouts"))}</span></div>
          <div><strong class="type-data">${summary.missingCoordinateCount}</strong><span class="type-caption">${escapeHtml(t("properties.metric.coordinateIssues"))}</span></div>
        </div>
        <div class="csv-preview-meta type-caption">
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
    if (mapScaleControlsVisible && !isBaselayerPropertiesSelection(selection)) hideMapScaleControls();
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
    mountPropertiesProjectCityField(selection && selection.rowId);
    syncPropertiesLabelHighlight(selection);
  }

  function isPointPropertiesSelection(selection = activePropertiesSelection) {
    return Boolean(selection && selection.rowId && ["marker", "label"].includes(selection.kind));
  }

  function clearPointPropertiesSelection() {
    if (!isPointPropertiesSelection()) return false;
    activePropertiesSelection = null;
    activeQualityLocateTarget = null;
    qualityLocateIndex = -1;
    clearQualityLocateHighlight();
    renderPropertiesForActiveState();
    return true;
  }

  function isBaselayerPropertiesSelection(selection = activePropertiesSelection) {
    return Boolean(activeDataTable === "preview" && selection && ["map", "region"].includes(selection.kind));
  }

  function clearBaselayerPropertiesSelection() {
    if (!isBaselayerPropertiesSelection()) return false;
    activePropertiesSelection = null;
    if (mapScaleControlsVisible) hideMapScaleControls();
    renderPropertiesForActiveState();
    return true;
  }

  function eventOriginatedInPropertiesPanel(event) {
    if (!els.propertiesPanel) return false;
    if (typeof event?.composedPath === "function" && event.composedPath().includes(els.propertiesPanel)) return true;
    return Boolean(event?.target instanceof Element && event.target.closest("#propertiesPanel"));
  }

  function isBaselayerSelectionInteractionTarget(target, event = null) {
    if (!(target instanceof Element)) return false;
    if (eventOriginatedInPropertiesPanel(event)) return true;
    return Boolean(target.closest([
      "#propertiesPanel",
      "#mapSvg .province",
      "#mapSvg .map-scale-controls"
    ].join(", ")));
  }

  function isPointSelectionInteractionTarget(target, event = null) {
    if (!(target instanceof Element)) return false;
    if (eventOriginatedInPropertiesPanel(event)) return true;
    return Boolean(target.closest([
      "#propertiesPanel",
      "#mapSvg .marker",
      "#mapSvg .map-label",
      "#mapSvg .map-label-background",
      "#mapSvg .rich-label-image"
    ].join(", ")));
  }

  function setPreviewPropertySectionsVisible(isVisible, showLegend = isVisible) {
    [els.previewDisplayPropertiesSection, els.previewInteractionPropertiesSection].forEach(section => {
      if (section) section.hidden = !isVisible;
    });
    if (els.legendPropertiesSection) els.legendPropertiesSection.hidden = !showLegend;
  }

  function setDocumentPropertiesContext() {
    renderPropertiesForActiveState({ kind: "document" });
  }

  function focusCategoryEditor(selector = ".properties-back-button", { preventScroll = true } = {}) {
    window.requestAnimationFrame(() => {
      els.propertiesSelectionControls?.querySelector(selector)?.focus({ preventScroll });
    });
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
    if (qualityRefreshError) {
      return `<strong>${escapeHtml(t("quality.banner.failed.title"))}</strong><span>${escapeHtml(t("quality.banner.failed.body"))}</span>`;
    }
    if (isQualityRefreshPending()) {
      return `<strong>${escapeHtml(t("quality.banner.checking.title"))}</strong><span>${escapeHtml(t("quality.banner.checking.body"))}</span>`;
    }
    if (!report) {
      return `<strong>${escapeHtml(t("quality.banner.renderFirst.title"))}</strong><span>${escapeHtml(t("quality.banner.renderFirst.body"))}</span>`;
    }
    const issues = getReviewIssueCount(report);
    return issues
      ? `<strong>${escapeHtml(t("quality.banner.review.title", { count: t("summary.issueCount", { count: issues, label: issues === 1 ? t("summary.issueSingular") : t("summary.issuePlural") }) }))}</strong><button type="button" class="primary-action" data-property-action="open-map">${escapeHtml(t("quality.action.locateFirst"))}</button>`
      : `<strong>${escapeHtml(t("quality.banner.ready.title"))}</strong><span>${escapeHtml(t("quality.banner.ready.body"))}</span>`;
  }

  function refreshCanvasQualityPill(report = lastLayout && lastLayout.report) {
    if (!els.canvasQualityPill) return;
    if (!getRows().length) {
      els.canvasQualityPill.hidden = true;
      els.canvasQualityPill.innerHTML = "";
      return;
    }
    if (qualityRefreshError || isQualityRefreshPending()) {
      els.canvasQualityPill.hidden = false;
      els.canvasQualityPill.innerHTML = `
        <span class="canvas-quality-metric" data-state="neutral"><span aria-hidden="true"></span><strong>${escapeHtml(qualityRefreshError ? t("summary.qualityUnavailable") : t("summary.qualityChecking"))}</strong></span>`;
      return;
    }
    if (!report) {
      els.canvasQualityPill.hidden = true;
      els.canvasQualityPill.innerHTML = "";
      return;
    }
    const overlaps = Number(report.overlaps || 0);
    const crossings = Number(report.crossings || 0);
    const nearEdge = Number(report.labelsNearEdge || 0);
    const offCanvas = Number(report.offCanvasPoints || 0);
    els.canvasQualityPill.hidden = false;
    els.canvasQualityPill.innerHTML = `
      <span class="canvas-quality-metric" data-state="${overlaps ? "review" : "ok"}"><span aria-hidden="true"></span>${escapeHtml(t("quality.canvas.overlaps"))} <strong>${overlaps}</strong></span>
      <span class="canvas-quality-metric" data-state="${crossings ? "review" : "ok"}"><span aria-hidden="true"></span>${escapeHtml(t("quality.canvas.crossings"))} <strong>${crossings}</strong></span>
      <span class="canvas-quality-metric" data-state="${nearEdge ? "review" : "ok"}">${escapeHtml(t("quality.canvas.nearEdge"))} <strong>${nearEdge}</strong></span>
      <span class="canvas-quality-metric" data-state="${offCanvas ? "danger" : "ok"}">${escapeHtml(t("quality.canvas.offCanvas"))} <strong>${offCanvas}</strong></span>
      <button type="button" data-property-action="open-map">${escapeHtml(t("quality.canvas.locateNext"))}</button>`;
  }

  function getQualityLocateTargets(report = lastLayout && lastLayout.report) {
    if (isQualityRefreshUnavailable()) return [];
    if (!report || !Array.isArray(report.qualityTargets)) return [];
    const seen = new Set();
    return report.qualityTargets.filter(target => {
      if (!target || !target.labelKey || seen.has(target.labelKey)) return false;
      seen.add(target.labelKey);
      return true;
    });
  }

  function clearQualityLocateHighlight() {
    document.querySelectorAll(".is-quality-located").forEach(node => node.classList.remove("is-quality-located"));
  }

  function getPropertiesSelectedLabelLayoutId(selection = activePropertiesSelection) {
    if (!selection || selection.kind !== "label") return "";
    const labelKey = String(selection.labelKey || "");
    const rowId = String(selection.rowId || "");
    const placed = lastLayout && Array.isArray(lastLayout.placed) ? lastLayout.placed : [];
    const match = placed.find(row => (
      (labelKey && String(row.labelKey || "") === labelKey)
      || (!labelKey && rowId && String(row.rowId || "") === rowId)
    ));
    return match ? String(match.layoutId || "") : "";
  }

  function syncPropertiesLabelHighlight(selection = activePropertiesSelection) {
    const layoutId = getPropertiesSelectedLabelLayoutId(selection);
    document.querySelectorAll([
      "#mapSvg .map-label",
      "#mapSvg .map-label-background",
      "#mapSvg .leader-line",
      "#mapSvg .leader-casing",
      "#mapSvg .rich-label-image",
      "#mapSvg .annotation-chart",
      "#mapSvg .label-width-control"
    ].join(", ")).forEach(node => {
      const isSelected = Boolean(layoutId) && node.dataset.layoutId === layoutId;
      node.classList.toggle("is-properties-selected", isSelected);
      if (node.classList.contains("label-width-control")) {
        const handle = node.querySelector(".label-width-handle");
        const isDisabled = node.classList.contains("is-disabled");
        if (handle) handle.setAttribute("tabindex", isSelected && !isDisabled ? "0" : "-1");
      }
    });
  }

  function highlightQualityLocateTarget(target) {
    clearQualityLocateHighlight();
    if (!target || !window.CSS || typeof CSS.escape !== "function") return;
    const selector = target.layoutId
      ? `[data-layout-id="${CSS.escape(target.layoutId)}"]`
      : target.rowId
        ? `#mapSvg [data-row-id="${CSS.escape(String(target.rowId))}"]`
        : "";
    if (!selector) return;
    document.querySelectorAll(selector).forEach(node => node.classList.add("is-quality-located"));
  }

  function restoreActiveQualityLocateTarget() {
    if (!activeQualityLocateTarget) return;
    const targets = getQualityLocateTargets();
    const match = targets.find(target => target.labelKey === activeQualityLocateTarget.labelKey || target.layoutId === activeQualityLocateTarget.layoutId);
    if (!match) {
      activeQualityLocateTarget = null;
      qualityLocateIndex = -1;
      clearQualityLocateHighlight();
      return;
    }
    activeQualityLocateTarget = match;
    qualityLocateIndex = Math.max(0, targets.findIndex(target => target.labelKey === match.labelKey || target.layoutId === match.layoutId));
    highlightQualityLocateTarget(match);
  }

  function locateNextQualityIssue() {
    if (isQualityRefreshUnavailable()) return;
    const targets = getQualityLocateTargets();
    setActiveDataTab("preview");
    if (!targets.length) {
      activeQualityLocateTarget = null;
      qualityLocateIndex = -1;
      clearQualityLocateHighlight();
      setStatusMessage(t("status.qualityNoLocateTargets"), "warning");
      return;
    }
    qualityLocateIndex = (qualityLocateIndex + 1) % targets.length;
    activeQualityLocateTarget = targets[qualityLocateIndex];
    const placed = lastLayout && Array.isArray(lastLayout.placed)
      ? lastLayout.placed.find(row => row.labelKey === activeQualityLocateTarget.labelKey || row.layoutId === activeQualityLocateTarget.layoutId)
      : null;
    const row = placed || getRows().find(item => String(item.rowId) === String(activeQualityLocateTarget.rowId)) || activeQualityLocateTarget;
    setRowPropertiesContext(activeQualityLocateTarget.type === "off-canvas-point" ? "marker" : "label", row, {
      labelKey: activeQualityLocateTarget.labelKey,
      manual: Boolean(manualLabelPositions[activeQualityLocateTarget.labelKey])
    });
    highlightQualityLocateTarget(activeQualityLocateTarget);
    setStatusMessage(t("status.qualityLocated", {
      index: qualityLocateIndex + 1,
      total: targets.length,
      label: activeQualityLocateTarget.name || labelKeyText(row)
    }), "ok");
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
    if (qualityRefreshError || isQualityRefreshPending()) {
      const state = qualityRefreshError ? "danger" : "neutral";
      const value = qualityRefreshError ? t("summary.qualityUnavailable") : t("summary.qualityChecking");
      const description = qualityRefreshError ? t("quality.banner.failed.body") : t("quality.banner.checking.body");
      return `<div class="quality-card-grid">${metadataCard}${qualityCard(t("quality.metric.layoutAnalysis"), value, state, description)}</div>`;
    }
    if (!report) {
      return `<div class="quality-card-grid">${metadataCard}</div>`;
    }
    const longestLeader = report.longestLeaderName
      ? `${Math.round(report.longestLeaderLength)} pt - ${report.longestLeaderName}`
      : t("quality.metric.none");
    return `
      <div class="quality-card-grid">
        ${metadataCard}
        ${qualityCard(t("quality.metric.offCanvasPoints"), String(report.offCanvasPoints || 0), report.offCanvasPoints ? "danger" : "ok", report.offCanvasPoints ? t("quality.metric.reviewOffCanvasPoints") : t("quality.metric.noOffCanvasPoints"), "", report.offCanvasPoints ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
        ${qualityCard(t("quality.metric.labelOverlaps"), String(report.overlaps), report.overlaps ? "review" : "ok", report.overlaps ? t("quality.metric.reviewTighten") : t("quality.metric.noOverlaps"), "", report.overlaps ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
        ${qualityCard(t("quality.metric.leaderCrossings"), report.crossings ? String(report.crossings) : "0", report.crossings ? "review" : "ok", report.crossings ? t("quality.metric.reviewCrossings") : t("quality.metric.noCrossings"), "", report.crossings ? { name: "open-map", label: t("quality.action.locateFirst") } : null)}
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
      els.qualitySummaryBanner.dataset.state = qualityRefreshError ? "review" : isQualityRefreshPending() || !report ? "info" : getReviewIssueCount(report) ? "review" : "ok";
    }
    refreshCanvasQualityPill();
    setQualityRefreshBusy(isQualityRefreshPending());
  }

  function renderDocumentPropertyControls() {
    return properties.renderDocumentPropertyControls({
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
        leaderColour: els.leaderColourInput ? els.leaderColourInput.value : "#333333",
        hideLeaderLines: Boolean(els.hideLeaderLinesInput && els.hideLeaderLinesInput.checked),
        routeDenseLeaders: Boolean(els.routeDenseLeadersInput && els.routeDenseLeadersInput.checked),
        showLineCasing: Boolean(els.showLineCasingInput && els.showLineCasingInput.checked),
        labelChars: els.labelCharsInput ? els.labelCharsInput.value : ""
      },
      escapeHtml,
      formatLeaderLineWidth: formatLeaderLineWidthDisplay,
      iconSvg,
      qualityMetricItem,
      renderMarkerSizePreview: value => getMarkerSizePreviewSvg({
        shape: "circle",
        colour: "#3b6f62",
        stroke: "#ffffff",
        customIcon: null
      }, value),
      t
    });
  }

  function renderProjectDataPropertyControls() {
    const rows = getRows();
    const summary = summarizeProjectRows(rows);
    return properties.renderProjectDataPropertyControls({ summary, qualityMetricItem, escapeHtml, iconSvg, t });
  }

  function getProjectRowPropertyStatus(row) {
    const hasLon = row && row.lon !== "";
    const hasLat = row && row.lat !== "";
    if (row && row.anchor === "region" && row.region) return t("project.status.mappedRegion");
    if (row && row.anchor === "city" && row.cityId && hasLon && hasLat) return t("project.status.mappedCity");
    if (row && row.anchor === "city") return t("project.status.missingCity");
    if (hasLon && hasLat) return t("project.status.mapped");
    if (hasLon || hasLat) return t("project.status.coordinateIssue");
    return t("project.status.callout");
  }

  function renderRowPropertyControls(row, options = {}) {
    const labelKey = options.labelKey || getLabelKey(row);
    const canResetLabel = Boolean(options.manual);
    const settings = getSettings();
    const inheritedLeaderLineWidth = getCategoryLineWidth(getCategory(row.type), settings) / (Number(settings.labelDensityScale) || 1);
    const inheritedLeaderLineColour = getLeaderLineColour(null, settings);
    const status = getProjectRowPropertyStatus(row);
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
      typeOptions: getTypeOptions(row.type),
      status,
      regionOptions: getRegionRows().map(region => ({ value: region.id, label: region.name })),
      cityRegionLabel: row.region ? getRegionNameById(row.region) : "",
      projectLocationMode: activeProjectLocationMode,
      authoringLanguage: activeAuthoringLanguage,
      globalLabelMaxChars: normalizeLabelMaxChars(els.labelCharsInput.value),
      inheritedLeaderLineWidth,
      inheritedLeaderLineColour,
      escapeHtml,
      formatLeaderLineWidth: formatLeaderLineWidthDisplay,
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
    if (activeDataTable === "preview" && (kind === "marker" || kind === "label") && propertiesDrawerMedia.matches) {
      setPropertiesDrawerOpen(true);
    }
  }

  function renderFurniturePropertyControls(key, label, visibilityInput) {
    const visible = visibilityInput ? visibilityInput.checked : true;
    return properties.renderFurniturePropertyControls({ key, label, visible, escapeHtml, iconSvg, t });
  }

  function renderMapPropertyControls() {
    return properties.renderMapPropertyControls({
      mapScale: els.mapScaleInput ? els.mapScaleInput.value : "",
      escapeHtml,
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
      qualityPending: isQualityRefreshPending(),
      qualityError: Boolean(qualityRefreshError),
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
      iconValidationMessage: category ? categoryIconValidationErrors.get(category.id) || "" : "",
      markerShapes: markerShapes.map(shape => ({ ...shape, label: getMarkerShapeLabel(shape) })),
      colourPresets: colourPresets.map(preset => ({
        value: preset.value,
        label: getCategoryColourPresetLabel(preset)
      })),
      escapeHtml,
      iconSvg,
      formatLeaderLineWidth: formatLeaderLineWidthDisplay,
      renderMarkerSizePreview: value => getMarkerSizePreviewSvg(category, value),
      t,
      backLabel: activeDataTable === "projects"
        ? t("properties.category.backToProjectPoints")
        : t("properties.category.backToDocument"),
      markerShapeIcon: shape => getCategorySwatchSvg({ ...category, shape, customIcon: null })
    });
  }

  function renderRegionPropertyControls(regionId) {
    const region = getRegionTableRows().find(item => item.id === regionId);
    if (!region) return renderMapPropertyControls();
    return properties.renderRegionPropertyControls({ region, statusOptions: regionStatusOptions, pluralize, escapeHtml, iconSvg, t });
  }

  function setCategoryPropertiesContext({ focus = false, focusSelector = ".properties-back-button", preventScroll = true } = {}) {
    renderPropertiesForActiveState({
      kind: "category",
      id: activeCategoryId,
      ...(activeDataTable === "projects" ? { workspace: "projects" } : {})
    });
    if (focus) focusCategoryEditor(focusSelector, { preventScroll });
  }

  function setMapPropertiesContext() {
    renderPropertiesForActiveState({ kind: "map" });
  }

  function renderPropertiesForActiveState(selection = activePropertiesSelection) {
    const requested = selection && typeof selection === "object" ? selection : null;
    let context;

    if (activeDataTable === "projects" && requested && requested.kind === "category" && requested.id && requested.workspace === "projects") {
      activeCategoryId = requested.id;
      const category = categorySettings.find(item => item.id === activeCategoryId) || categorySettings[0];
      if (category) activeCategoryId = category.id;
      context = {
        title: category ? getCategoryLabel(category.id, currentUiLanguage) : t("properties.title.categories"),
        subtitle: category ? t("properties.subtitle.projectType") : t("properties.subtitle.projectPoints"),
        hint: t("properties.hint.projectType"),
        controls: renderCategoryPropertyControls(),
        selection: { kind: "category", id: category && category.id, workspace: "projects" }
      };
    } else if (activeDataTable === "projects") {
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
      context = {
        title: t("properties.title.translate"),
        subtitle: t("properties.subtitle.translate"),
        hint: t("properties.hint.translate"),
        controls: renderTranslationPropertyControls(),
        selection: { kind: "translation" }
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
    } else if (requested && requested.kind === "category" && requested.id) {
      activeCategoryId = requested.id;
      const category = categorySettings.find(item => item.id === activeCategoryId) || categorySettings[0];
      if (category) activeCategoryId = category.id;
      context = {
        title: category ? getCategoryLabel(category.id, currentUiLanguage) : t("properties.title.categories"),
        subtitle: category ? t("properties.subtitle.legendMarker") : t("properties.subtitle.legendCategories"),
        hint: t("properties.hint.categories"),
        controls: renderCategoryPropertyControls(),
        selection: { kind: "category", id: category && category.id }
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

    const isPreviewContext = activeDataTable === "preview";
    const showPreviewGroups = isPreviewContext && ["document", "map"].includes(context.selection.kind);
    const showPreviewLegend = isPreviewContext && context.selection.kind === "document";
    setPreviewPropertySectionsVisible(showPreviewGroups, showPreviewLegend);
    setPropertiesContext(context.title, context.subtitle, context.hint, context.controls, context.selection);
    if (showPreviewLegend) renderCategoryEditors();
    syncPropertiesAccordions(context.selection);
    applyAdaptivePropertiesState(context.selection);
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

  const richLabelLiveTextFields = new Set([
    "name",
    "nameFr",
    "contentElementValue",
    "contentParagraph",
    "contentImageCaption",
    "contentBulletItem"
  ]);

  function updateRichLabelContentFromPropertyInput(row, input) {
    const field = input && input.dataset.propertyField;
    if (!row || !input || ![
      "contentElementType",
      "contentElementValue",
      "contentParagraph",
      "contentImageCaption",
      "contentImageSize",
      "contentBulletItem"
    ].includes(field)) return null;
    const content = normalizeAnnotationContent(row.content);
    const blockIndex = Number(input.dataset.blockIndex);
    const itemIndex = Number(input.dataset.itemIndex);
    const block = Number.isInteger(blockIndex) ? content[blockIndex] : null;
    if (!block) return null;
    if (field === "contentElementType" && ["text", "bullet"].includes(block.type)) {
      block.type = projectIo.normalizeRichLabelElementType(input.value);
    } else if (field === "contentElementValue" && ["text", "bullet"].includes(block.type)) {
      block.value[activeAuthoringLanguage === "fr" ? "fr" : "en"] = String(input.value || "").trim();
    } else if (field === "contentParagraph" && block.type === "paragraph") {
      block[activeAuthoringLanguage === "fr" ? "fr" : "en"] = String(input.value || "").trim();
    } else if (field === "contentImageCaption" && block.type === "image") {
      block.caption[activeAuthoringLanguage === "fr" ? "fr" : "en"] = String(input.value || "").trim();
    } else if (field === "contentImageSize" && block.type === "image") {
      block.displaySize = normalizeRichLabelImageDisplaySize(input.value);
      input.value = block.displaySize;
    } else if (field === "contentBulletItem" && block.type === "bullets" && Number.isInteger(itemIndex) && block.items[itemIndex]) {
      block.items[itemIndex][activeAuthoringLanguage === "fr" ? "fr" : "en"] = String(input.value || "").trim();
    } else {
      return null;
    }
    return content;
  }

  function handleRichLabelEditorInput(event) {
    if (event.target && event.target.matches("[data-marker-size-draft]")) {
      syncMarkerSizeDraft(event.target);
      return;
    }
    if (event.target && event.target.matches("[data-leader-line-width-draft]")) {
      syncLeaderLineWidthDraft(event.target);
      return;
    }
    const field = event.target && event.target.dataset.propertyField;
    if (!richLabelLiveTextFields.has(field)) return;
    const form = event.target.closest(".properties-form[data-row-id]");
    const rowId = form && form.dataset.rowId;
    const currentRow = rowId && readRowElement(getRowElementById(rowId));
    if (!currentRow || (field.startsWith("content") && currentRow.labelStyle !== "rich")) return;

    let fieldToUpdate = field;
    let value = event.target.value;
    if (field.startsWith("content")) {
      value = updateRichLabelContentFromPropertyInput(currentRow, event.target);
      if (!value) return;
      fieldToUpdate = "content";
    }
    captureInputUndo(event.target, "project row edit");
    updateProjectRowField(rowId, fieldToUpdate, value, { refreshTableUx: false });
    if (!requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
  }

  async function handlePropertiesControlsChange(event) {
    if (event.target.matches("[data-marker-size-draft]")) {
      const draft = syncMarkerSizeDraft(event.target);
      if (draft && draft.valid) {
        event.target.value = String(draft.normalizedValue);
        syncMarkerSizeDraft(event.target);
      }
      return;
    }
    if (event.target.matches("[data-leader-line-width-draft]")) {
      const draft = syncLeaderLineWidthDraft(event.target);
      if (draft && draft.valid && !draft.isBlank) {
        event.target.value = formatLeaderLineWidthInput(draft.normalizedValue);
        syncLeaderLineWidthDraft(event.target);
      }
      return;
    }
    if (event.target.matches("[data-category-icon-upload]")) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      const file = event.target.files && event.target.files[0];
      if (!category || !file) return;
      try {
        const icon = await validateCustomMarkerIconFile(file);
        pushAppUndoHistory("category icon upload");
        categoryIconValidationErrors.delete(category.id);
        category.customIcon = icon;
        activeCategoryId = category.id;
        renderCategoryEditors();
        updateWorkspaceSummary();
        requestPreviewRefresh();
        setCategoryPropertiesContext({ focus: true, focusSelector: "[data-property-action='remove-category-icon']" });
        setStatusMessage(t("status.categoryCustomIcon", { label: getCategoryLabel(category.id, currentUiLanguage) }), "ok");
      } catch (error) {
        const message = translateErrorMessage(error);
        categoryIconValidationErrors.set(category.id, message);
        activeCategoryId = category.id;
        setCategoryPropertiesContext({ focus: true, focusSelector: "[data-category-icon-error]", preventScroll: false });
        setStatusMessage(t("status.customIconLoadFailedGeneric", { message }), "danger");
      } finally {
        event.target.value = "";
      }
      return;
    }

    if (event.target.matches("[data-category-icon-match-leaders], [data-category-icon-leader-colour]")) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      if (!category || !category.customIcon) return;
      pushAppUndoHistory("category icon leader colour");
      if (event.target.matches("[data-category-icon-match-leaders]")) {
        category.customIcon.leaderColour = normalizeHexColour(
          category.customIcon.leaderColour,
          normalizeHexColour(category.colour, "#333333")
        );
        category.customIcon.matchLeaderLines = event.target.checked;
      } else {
        category.customIcon.leaderColour = normalizeHexColour(event.target.value, category.customIcon.leaderColour || "#333333");
      }
      activeCategoryId = category.id;
      renderCategoryEditors();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      const focusSelector = event.target.matches("[data-category-icon-match-leaders]")
        ? "[data-category-icon-match-leaders]"
        : "[data-category-icon-leader-colour]";
      setCategoryPropertiesContext({ focus: true, focusSelector });
      setStatusMessage(t("status.categoryIconLeaderColour", { label: getCategoryLabel(category.id, currentUiLanguage) }), "ok");
      return;
    }

    if (event.target.matches("[data-category-colour-preset]")) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      if (!category) return;
      if (!event.target.value) {
        form.querySelector("[data-category-field='colour']")?.focus();
        return;
      }
      pushAppUndoHistory("category edit");
      category.colour = event.target.value;
      const colourInput = form.querySelector("[data-category-field='colour']");
      if (colourInput) colourInput.value = category.colour;
      syncMarkerSizeDraft(form.querySelector("[data-marker-size-draft='category']"));
      renderCategoryEditors();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      return;
    }

    const categoryField = event.target.dataset.categoryField;
    if (categoryField) {
      const form = event.target.closest("[data-category-id]");
      const category = form && categorySettings.find(item => item.id === form.dataset.categoryId);
      if (!category) return;
      captureInputUndo(event.target, "category edit");
      category[categoryField] = event.target.value;
      if (categoryField === "label") category.defaultLabel = category.defaultLabel || category.label;
      if (categoryField === "shape") {
        form.querySelectorAll(".category-shape-option").forEach(option => {
          option.classList.toggle("is-selected", option.querySelector("input")?.checked);
        });
        if (!category.customIcon) {
          const preview = form.querySelector(".custom-icon-preview");
          if (preview) preview.innerHTML = getCategorySwatchSvg(category);
        }
      }
      if (categoryField === "colour") {
        const presetInput = form.querySelector("[data-category-colour-preset]");
        if (presetInput) presetInput.value = getPresetValueForColour(category.colour);
      }
      syncMarkerSizeDraft(form.querySelector("[data-marker-size-draft='category']"));
      if ((categoryField === "label" && currentUiLanguage === "en") || (categoryField === "labelFr" && currentUiLanguage === "fr")) {
        if (els.propertiesTitle) els.propertiesTitle.textContent = getCategoryLabel(category.id, currentUiLanguage);
      }
      renderCategoryEditors();
      updateTypeOptions();
      updateWorkspaceSummary();
      requestPreviewRefresh();
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
      } else if (regionProperty === "status") {
        const status = normalizeRegionStatus(event.target.value);
        if (status) regionStatuses[regionId] = status;
        else delete regionStatuses[regionId];
        refreshRegionValueTableRow(getRegionTableRows().find(region => region.id === regionId));
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
    const currentRow = readRowElement(getRowElementById(rowId));

    if (field === "contentImageUpload") {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      const content = normalizeAnnotationContent(currentRow && currentRow.content);
      const blockIndex = Number(event.target.dataset.blockIndex);
      const block = Number.isInteger(blockIndex) ? content[blockIndex] : null;
      if (!block || block.type !== "image") return;
      try {
        const image = await validateRichLabelImageFile(file);
        block.assetRef = image.dataUrl;
        block.naturalWidth = image.width;
        block.naturalHeight = image.height;
        block.displaySize = normalizeRichLabelImageDisplaySize(block.displaySize);
        pushAppUndoHistory("project row edit");
        const row = updateProjectRowField(rowId, "content", content);
        if (!row) return;
        updateWorkspaceSummary();
        updateExportLanguageNotice();
        if (!requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
        setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", row, {
          labelKey: form.dataset.labelKey,
          manual: Boolean(manualLabelPositions[form.dataset.labelKey]),
          advancedOpen: Boolean(event.target.closest("details")?.open)
        });
        setStatusMessage(t("status.richImageUploaded"), "ok");
      } catch (error) {
        setStatusMessage(t("status.richImageUploadFailed", { message: translateErrorMessage(error) }), "danger");
      }
      return;
    }

    let fieldToUpdate = field;
    let value = ["hideLine", "elbowLeader", "labelBorder"].includes(field) ? event.target.checked : event.target.value;
    if (field === "leaderLineWidth") value = normalizeLeaderLineWidthOverride(value);
    if (field === "leaderLineColour") value = normalizeHexColour(value, "");
    if (field === "contentElementType" || field === "contentElementValue" || field === "contentParagraph" || field === "contentImageCaption" || field === "contentImageSize" || field === "contentBulletItem") {
      const content = updateRichLabelContentFromPropertyInput(currentRow, event.target);
      if (!content) return;
      fieldToUpdate = "content";
      value = content;
    }
    captureInputUndo(event.target, "project row edit");
    const row = updateProjectRowField(rowId, fieldToUpdate, value);
    if (!row) return;
    if (fieldToUpdate === "nameFr" || fieldToUpdate === "content") {
      updateWorkspaceSummary();
      updateExportLanguageNotice();
    }
    const canPatchLabel = [
      "name",
      "nameFr",
      "footnote",
      "content",
      "labelBorder",
      "labelMaxChars",
      "labelStyle",
      "elbowLeader",
      "leaderLineWidth",
      "leaderLineColour"
    ].includes(fieldToUpdate);
    if (!canPatchLabel || !requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
    const advancedOpen = Boolean(event.target.closest("details")?.open);
    if (!richLabelLiveTextFields.has(field)) {
      setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", row, {
        labelKey: form.dataset.labelKey,
        manual: Boolean(manualLabelPositions[form.dataset.labelKey]),
        advancedOpen
      });
    }
  }

  function handlePropertiesControlsClick(event) {
    const button = event.target.closest("[data-property-action]");
    if (!button) return;
    const action = button.dataset.propertyAction;

    if (action === "apply-marker-size") {
      event.stopPropagation();
      const editor = button.closest("[data-marker-size-editor]");
      const draftInput = editor && editor.querySelector("[data-marker-size-draft]");
      const draft = syncMarkerSizeDraft(draftInput);
      if (!draft || !draft.valid || !draft.changed) return;

      if (draft.scope === "global") {
        pushAppUndoHistory("map marker size");
        els.markerSizeInput.value = draft.normalizedValue;
        handleLayoutSettingsChange({ target: els.markerSizeInput });
        renderPropertiesForActiveState();
        focusMarkerSizeDraft("global");
        return;
      }

      const categoryForm = button.closest("#categoryPropertiesEditor[data-category-id]");
      const category = categoryForm && categorySettings.find(item => item.id === categoryForm.dataset.categoryId);
      if (!category) return;
      pushAppUndoHistory("category marker size");
      category.markerSize = draft.normalizedValue;
      category.markerSizeCustom = true;
      activeCategoryId = category.id;
      renderCategoryEditors();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      setCategoryPropertiesContext();
      focusMarkerSizeDraft("category");
      return;
    }

    if (action === "apply-leader-line-width") {
      event.stopPropagation();
      const editor = button.closest("[data-leader-line-width-editor]");
      const draftInput = editor && editor.querySelector("[data-leader-line-width-draft]");
      const draft = syncLeaderLineWidthDraft(draftInput);
      if (!draft || !draft.valid || !draft.changed) return;

      if (draft.scope === "global") {
        pushAppUndoHistory("map leader line thickness");
        els.lineWidthInput.value = draft.normalizedValue;
        handleLayoutSettingsChange({ target: els.lineWidthInput });
        renderPropertiesForActiveState();
        focusLeaderLineWidthDraft("global");
        return;
      }

      if (draft.scope === "category") {
        const categoryForm = button.closest("#categoryPropertiesEditor[data-category-id]");
        const category = categoryForm && categorySettings.find(item => item.id === categoryForm.dataset.categoryId);
        if (!category) return;
        pushAppUndoHistory("category leader line thickness");
        category.lineWidth = draft.normalizedValue;
        category.lineWidthCustom = true;
        activeCategoryId = category.id;
        renderCategoryEditors();
        updateWorkspaceSummary();
        requestPreviewRefresh();
        setCategoryPropertiesContext();
        focusLeaderLineWidthDraft("category");
        return;
      }

      const rowForm = button.closest(".properties-form[data-row-id]");
      const rowId = rowForm && rowForm.dataset.rowId;
      const currentRow = rowId ? readRowElement(getRowElementById(rowId)) : null;
      if (!currentRow) return;
      const selectionKind = activePropertiesSelection && activePropertiesSelection.kind || "label";
      const labelKey = rowForm.dataset.labelKey;
      const advancedOpen = Boolean(rowForm.querySelector("details")?.open);
      pushAppUndoHistory("point leader line thickness");
      const updatedRow = updateProjectRowField(rowId, "leaderLineWidth", draft.normalizedValue);
      if (!updatedRow) return;
      if (!requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
      setRowPropertiesContext(selectionKind, updatedRow, {
        labelKey,
        manual: Boolean(manualLabelPositions[labelKey]),
        advancedOpen
      });
      focusLeaderLineWidthDraft("point");
      return;
    }

    if (action === "reset-leader-colour") {
      const rowForm = button.closest(".properties-form[data-row-id]");
      const rowId = rowForm && rowForm.dataset.rowId;
      const row = rowId ? readRowElement(getRowElementById(rowId)) : null;
      if (!row || !row.leaderLineColour) return;
      pushAppUndoHistory("project row edit");
      const updatedRow = updateProjectRowField(rowId, "leaderLineColour", "");
      if (!requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
      setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", updatedRow, {
        labelKey: rowForm.dataset.labelKey,
        manual: Boolean(manualLabelPositions[rowForm.dataset.labelKey]),
        advancedOpen: Boolean(rowForm.querySelector("details")?.open)
      });
      return;
    }

    if (action === "back-to-document") {
      const categoryId = button.dataset.categoryId || activeCategoryId;
      if (activeDataTable === "projects") {
        renderPropertiesForActiveState({ kind: "project-data" });
        window.requestAnimationFrame(() => {
          els.projectAddMenuBtn?.focus({ preventScroll: true });
        });
        return;
      }
      setDocumentPropertiesContext();
      renderCategoryEditors();
      window.requestAnimationFrame(() => {
        els.categoryList?.querySelector(`.legend-item-select[data-category-id="${window.CSS && CSS.escape ? CSS.escape(categoryId) : categoryId}"]`)?.focus({ preventScroll: true });
      });
      return;
    }

    const rowForm = button.closest(".properties-form[data-row-id]");
    if (rowForm && ["add-content-text", "add-content-bullet", "add-content-paragraph", "add-content-bullets", "add-content-image", "move-content-block-up", "move-content-block-down", "remove-content-block", "clear-content-image", "add-content-bullet-item", "remove-content-bullet-item"].includes(action)) {
      const rowId = rowForm.dataset.rowId;
      const tr = getRowElementById(rowId);
      const row = readRowElement(tr);
      if (!row) return;
      pushAppUndoHistory("project row edit");
      if (action === "add-content-text" || action === "add-content-bullet") {
        const type = action.replace("add-content-", "");
        updateProjectRowField(rowId, "content", row.content.concat([{
          type,
          template: "",
          sources: [],
          numberFormat: "full",
          value: { en: "", fr: "" }
        }]));
        updateProjectRowField(rowId, "labelStyle", "rich");
      } else if (action === "add-content-paragraph") {
        updateProjectRowField(rowId, "content", row.content.concat([{ type: "paragraph", en: "", fr: "" }]));
        updateProjectRowField(rowId, "labelStyle", "rich");
      } else if (action === "add-content-bullets") {
        updateProjectRowField(rowId, "content", row.content.concat([{ type: "bullets", items: [{ en: "", fr: "" }] }]));
        updateProjectRowField(rowId, "labelStyle", "rich");
      } else if (action === "add-content-image") {
        updateProjectRowField(rowId, "content", row.content.concat([{
          type: "image",
          assetRef: "",
          caption: { en: "", fr: "" },
          displaySize: richLabelImageDisplayRules.defaultSize
        }]));
        updateProjectRowField(rowId, "labelStyle", "rich");
      } else if (action === "move-content-block-up" || action === "move-content-block-down") {
        const index = Number(button.dataset.blockIndex);
        const nextIndex = action === "move-content-block-up" ? index - 1 : index + 1;
        const content = row.content.slice();
        if (Number.isInteger(index) && nextIndex >= 0 && nextIndex < content.length) {
          [content[index], content[nextIndex]] = [content[nextIndex], content[index]];
          updateProjectRowField(rowId, "content", content);
        }
      } else if (action === "remove-content-block") {
        const index = Number(button.dataset.blockIndex);
        updateProjectRowField(rowId, "content", row.content.filter((item, itemIndex) => itemIndex !== index));
      } else if (action === "clear-content-image") {
        const index = Number(button.dataset.blockIndex);
        const content = normalizeAnnotationContent(row.content);
        const block = Number.isInteger(index) ? content[index] : null;
        if (block && block.type === "image") {
          block.assetRef = "";
          delete block.naturalWidth;
          delete block.naturalHeight;
          updateProjectRowField(rowId, "content", content);
          setStatusMessage(t("status.richImageCleared"), "ok");
        }
      } else if (action === "add-content-bullet-item" || action === "remove-content-bullet-item") {
        const blockIndex = Number(button.dataset.blockIndex);
        const itemIndex = Number(button.dataset.itemIndex);
        const content = normalizeAnnotationContent(row.content);
        const block = Number.isInteger(blockIndex) ? content[blockIndex] : null;
        if (block && block.type === "bullets") {
          if (action === "add-content-bullet-item") block.items.push({ en: "", fr: "" });
          if (action === "remove-content-bullet-item") block.items = block.items.filter((item, index) => index !== itemIndex);
          updateProjectRowField(rowId, "content", content);
        }
      }
      updateWorkspaceSummary();
      updateExportLanguageNotice();
      const updatedRow = readRowElement(tr);
      if (!requestRichLabelPreviewRefresh(rowId)) requestPreviewRefresh();
      setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", updatedRow, {
        labelKey: rowForm.dataset.labelKey,
        manual: Boolean(manualLabelPositions[rowForm.dataset.labelKey])
      });
      return;
    }
    if (action === "reset-label-max-chars" && rowForm) {
      const rowId = rowForm.dataset.rowId;
      const currentRow = readRowElement(getRowElementById(rowId));
      if (!currentRow || normalizeLabelMaxCharsOverride(currentRow.labelMaxChars) === "") return;
      pushAppUndoHistory("label width reset");
      const row = updateProjectRowField(rowId, "labelMaxChars", "", { refreshTableUx: false });
      const patched = refreshRenderedLabel(rowId);
      if (patched) invalidatePatchedLayoutQuality();
      else requestPreviewRefresh();
      setRowPropertiesContext(activePropertiesSelection && activePropertiesSelection.kind || "label", row, {
        labelKey: rowForm.dataset.labelKey,
        manual: Boolean(manualLabelPositions[rowForm.dataset.labelKey]),
        advancedOpen: true
      });
      setStatusMessage(t("status.labelWidthReset", { count: normalizeLabelMaxChars(els.labelCharsInput.value) }), "ok");
      return;
    }
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
      event.stopPropagation();
      locateNextQualityIssue();
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
      categoryIconValidationErrors.delete(category.id);
      category.customIcon = null;
      activeCategoryId = category.id;
      renderCategoryEditors();
      updateWorkspaceSummary();
      requestPreviewRefresh();
      setCategoryPropertiesContext({ focus: true, focusSelector: "[data-property-action='upload-category-icon']" });
      setStatusMessage(t("status.categoryReturnedToMarker", { label: getCategoryLabel(category.id, currentUiLanguage), shape: getMarkerShapeLabel(category.shape) }), "ok");
      return;
    }

    if (action === "reset-box") {
      const key = button.dataset.boxKey;
      if (!key) return;
      if (manualBoxPositions[key]) pushManualLayoutHistory(getBoxHistoryLabel(key, "reset"));
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

    openConfirmationDialog({
      kind: "clear",
      count: rowCount,
      returnFocus: els.projectMoreMenuBtn || els.clearRowsBtn,
      onCancel: () => setStatusMessage(t("status.clearTableCancelled"), "warning"),
      onConfirm: () => {
        pushAppUndoHistory("clear project rows");
        setRows([]);
        setStatusMessage(t("status.projectTableCleared"), "ok");
      }
    });
  }

  function setExportMenuOpen(open, options = {}) {
    if (!els.exportMenu || !els.exportMenuBtn) return;
    if (open) setApplicationSettingsOpen(false);
    els.exportMenu.hidden = !open;
    els.exportMenuBtn.setAttribute("aria-expanded", String(open));
    if (open && options.focusFirst) {
      const firstItem = els.exportMenu.querySelector('[role="menuitem"]');
      if (firstItem) firstItem.focus();
    }
  }

  function setApplicationSettingsOpen(open, options = {}) {
    if (!els.applicationSettingsMenu || !els.applicationSettingsBtn) return;
    const shouldOpen = Boolean(open);
    if (shouldOpen) {
      setExportMenuOpen(false);
      closeProjectToolbarMenus();
      if (propertiesDrawerMedia.matches && document.body.classList.contains("properties-open")) {
        setPropertiesDrawerOpen(false);
      }
    }
    els.applicationSettingsMenu.hidden = !shouldOpen;
    els.applicationSettingsBtn.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen && options.focusFirst) {
      const firstControl = els.applicationSettingsMenu.querySelector("[data-ui-language][aria-pressed='true']")
        || els.applicationSettingsMenu.querySelector("[data-ui-language]");
      if (firstControl) firstControl.focus();
    } else if (!shouldOpen && options.restoreFocus) {
      els.applicationSettingsBtn.focus();
    }
  }

  function handleApplicationSettingsKeydown(event) {
    if (event.key !== "ArrowDown" || event.currentTarget !== els.applicationSettingsBtn) return;
    event.preventDefault();
    setApplicationSettingsOpen(true, { focusFirst: true });
  }

  function getProjectToolbarMenus() {
    return [
      { button: els.projectAddMenuBtn, menu: els.projectAddMenu },
      { button: els.projectMoreMenuBtn, menu: els.projectMoreMenu }
    ].filter(item => item.button && item.menu);
  }

  function positionProjectToolbarMenu(button, menu) {
    const boundary = button.closest(".workspace") || document.documentElement;
    menu.style.setProperty("--project-menu-shift-x", "0px");
    const menuRect = menu.getBoundingClientRect();
    const boundaryRect = boundary.getBoundingClientRect();
    const minimumLeft = boundaryRect.left;
    const maximumLeft = Math.max(minimumLeft, boundaryRect.right - menuRect.width);
    const targetLeft = Math.min(Math.max(menuRect.left, minimumLeft), maximumLeft);
    menu.style.setProperty("--project-menu-shift-x", `${targetLeft - menuRect.left}px`);
  }

  function setProjectToolbarMenuOpen(button, menu, open, options = {}) {
    getProjectToolbarMenus().forEach(item => {
      const isTarget = item.button === button && item.menu === menu;
      const shouldOpen = isTarget && open;
      item.menu.hidden = !shouldOpen;
      item.button.setAttribute("aria-expanded", String(shouldOpen));
    });
    if (open) positionProjectToolbarMenu(button, menu);
    if (open && options.focusFirst) {
      const firstItem = menu.querySelector('[role="menuitem"]:not([disabled])');
      if (firstItem) firstItem.focus();
    }
  }

  function closeProjectToolbarMenus() {
    getProjectToolbarMenus().forEach(item => {
      item.menu.hidden = true;
      item.button.setAttribute("aria-expanded", "false");
    });
  }

  function handleProjectToolbarMenuKeydown(event) {
    const definition = getProjectToolbarMenus().find(item => item.button === event.currentTarget || item.menu === event.currentTarget);
    if (!definition) return;
    const { button, menu } = definition;
    if (event.key === "ArrowDown" && event.currentTarget === button) {
      event.preventDefault();
      setProjectToolbarMenuOpen(button, menu, true, { focusFirst: true });
      return;
    }
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setProjectToolbarMenuOpen(button, menu, false);
      button.focus();
      return;
    }
    if (event.currentTarget === menu && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])'));
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

  function handleExportMenuKeydown(event) {
    if (event.key === "ArrowDown" && event.currentTarget === els.exportMenuBtn) {
      event.preventDefault();
      setExportMenuOpen(true, { focusFirst: true });
      return;
    }
    if (event.key === "Escape" && els.exportMenu && !els.exportMenu.hidden) {
      event.preventDefault();
      event.stopPropagation();
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
      { name: "regions", title: t("tab.regions"), tab: els.regionTableTab, pane: els.regionTablePane, actions: "regions" },
      { name: "translate", title: t("tab.translate"), tab: els.translateTableTab, pane: els.translateTablePane, actions: "translate" },
      { name: "quality", title: t("tab.quality"), tab: els.qualityTableTab, pane: els.qualityTablePane, actions: "quality" }
    ];
  }

  function syncResponsivePropertiesState() {
    if (!els.propertiesPanel || !els.propertiesToggleBtn) return;
    if (document.body.classList.contains("properties-unavailable")) {
      document.body.classList.remove("properties-open", "is-resizing-properties");
      els.propertiesPanel.inert = true;
      els.propertiesPanel.setAttribute("aria-hidden", "true");
      els.propertiesToggleBtn.setAttribute("aria-expanded", "false");
      return;
    }
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

  function normalizePropertiesPanelSide(value) {
    return String(value || "right").toLowerCase() === "left" ? "left" : "right";
  }

  function handlePropertiesControlsKeydown(event) {
    if (event.key !== "Enter" || event.isComposing) return;
    const isMarkerSizeDraft = event.target.matches("[data-marker-size-draft]");
    const isLeaderWidthDraft = event.target.matches("[data-leader-line-width-draft]");
    if (!isMarkerSizeDraft && !isLeaderWidthDraft) return;
    const editor = event.target.closest(isMarkerSizeDraft ? "[data-marker-size-editor]" : "[data-leader-line-width-editor]");
    const applyButton = editor && editor.querySelector(`[data-property-action='${isMarkerSizeDraft ? "apply-marker-size" : "apply-leader-line-width"}']`);
    if (!applyButton || applyButton.disabled) return;
    event.preventDefault();
    applyButton.click();
  }

  function getPropertiesPanelSide() {
    return normalizePropertiesPanelSide(document.body.dataset.propertiesSide);
  }

  function syncPropertiesPanelDomOrder(side) {
    if (!els.propertiesPanel) return;
    const shell = els.propertiesPanel.parentElement;
    const workspace = shell && shell.querySelector(".workspace");
    if (!shell || !workspace) return;
    if (side === "left" && els.propertiesPanel.nextElementSibling !== workspace) {
      shell.insertBefore(els.propertiesPanel, workspace);
    }
    if (side === "right" && workspace.nextElementSibling !== els.propertiesPanel) {
      workspace.insertAdjacentElement("afterend", els.propertiesPanel);
    }
  }

  function setPropertiesPanelSide(value, { persist = true } = {}) {
    const side = normalizePropertiesPanelSide(value);
    document.body.dataset.propertiesSide = side;
    syncPropertiesPanelDomOrder(side);
    els.propertiesSideInputs.forEach(input => {
      input.checked = input.value === side;
    });
    if (persist) savePropertiesPanelPreference({ side });
    return side;
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
      setPropertiesDrawerOpen(Boolean(collapsed));
      return;
    }
    document.body.classList.toggle("properties-collapsed", Boolean(collapsed));
    syncPropertiesCollapsedState();
    if (persist) savePropertiesPanelPreference({ collapsed: Boolean(collapsed) });
  }

  function togglePropertiesPanel() {
    if (document.body.classList.contains("properties-unavailable")) return;
    if (propertiesDrawerMedia.matches) {
      setPropertiesDrawerOpen(!document.body.classList.contains("properties-open"));
    } else {
      setPropertiesCollapsed(!document.body.classList.contains("properties-collapsed"));
    }
  }

  function initializePropertiesPanelState() {
    const saved = getPropertiesPanelPreference();
    setPropertiesPanelSide(saved.side, { persist: false });
    if (Number.isFinite(Number(saved.width))) setPropertiesPanelWidth(saved.width);
    else setPropertiesPanelWidth(readCssPixelVariable("--props-w", 320));
    if (!propertiesDrawerMedia.matches && saved.collapsed !== false) {
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
      const delta = getPropertiesPanelSide() === "left"
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX;
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
    const side = getPropertiesPanelSide();
    let next = current;
    if (event.key === "ArrowLeft") next = current + (side === "right" ? step : -step);
    if (event.key === "ArrowRight") next = current + (side === "left" ? step : -step);
    if (event.key === "Home") next = min;
    if (event.key === "End") next = max;
    setPropertiesPanelWidth(next, { persist: true });
  }

  function getDefaultPropertiesSelectionForWorkspace(workspaceName) {
    if (workspaceName === "preview") return { kind: "document" };
    if (workspaceName === "regions") return { kind: "map" };
    if (workspaceName === "projects" && activePropertiesSelection && ["row", "category"].includes(activePropertiesSelection.kind)) {
      return activePropertiesSelection;
    }
    return null;
  }

  function getAdaptivePropertiesMode(selection = activePropertiesSelection) {
    if (activeDataTable === "preview") return "workspace";
    if (activeDataTable === "projects") {
      return selection && ["row", "category"].includes(selection.kind) ? "contextual" : "unavailable";
    }
    if (activeDataTable === "regions") return selection && selection.kind === "region" ? "contextual" : "collapsed";
    return "unavailable";
  }

  function applyAdaptivePropertiesState(selection = activePropertiesSelection) {
    if (!els.propertiesPanel || !els.propertiesToggleBtn) return;
    const mode = getAdaptivePropertiesMode(selection);
    const unavailable = mode === "unavailable";
    document.body.dataset.propertiesMode = mode;
    document.body.classList.toggle("properties-unavailable", unavailable);
    els.propertiesToggleBtn.hidden = unavailable;
    if (unavailable) {
      document.body.classList.remove("properties-open", "is-resizing-properties");
      els.propertiesPanel.inert = true;
      els.propertiesPanel.setAttribute("aria-hidden", "true");
      els.propertiesToggleBtn.setAttribute("aria-expanded", "false");
      if (els.propertiesCollapseBtn) {
        const isCollapsed = document.body.classList.contains("properties-collapsed");
        els.propertiesCollapseBtn.setAttribute("aria-expanded", String(!isCollapsed));
        els.propertiesCollapseBtn.setAttribute("aria-label", isCollapsed ? t("aria.expandProperties") : t("aria.collapseProperties"));
        els.propertiesCollapseBtn.title = isCollapsed ? t("properties.title.expand") : t("properties.title.collapse");
      }
      return;
    }

    els.propertiesPanel.inert = false;
    els.propertiesPanel.removeAttribute("aria-hidden");
    if (propertiesDrawerMedia.matches) {
      setPropertiesDrawerOpen(mode === "contextual");
      return;
    }
    if (mode === "contextual") {
      setPropertiesCollapsed(false, { persist: false });
    } else if (mode === "collapsed") {
      setPropertiesCollapsed(true, { persist: false });
    } else {
      const saved = getPropertiesPanelPreference();
      setPropertiesCollapsed(saved.collapsed !== false, { persist: false });
    }
  }

  function syncPropertiesAccordions(selection = activePropertiesSelection) {
    if (!els.propertiesPanel || activeDataTable !== "preview") return;
    const details = Array.from(els.propertiesPanel.querySelectorAll("details[data-properties-accordion]"))
      .filter(detail => !detail.hidden);
    if (!details.length) return;
    const savedSection = getPropertiesPanelPreference().openSection;
    const defaultSection = selection && selection.kind === "map" ? "display" : "legend";
    const openSection = details.some(detail => detail.dataset.propertiesAccordion === savedSection)
      ? savedSection
      : defaultSection;
    details.forEach(detail => {
      detail.open = detail.dataset.propertiesAccordion === openSection;
      if (detail.dataset.propertiesAccordionBound === "true") return;
      detail.dataset.propertiesAccordionBound = "true";
      detail.addEventListener("toggle", () => {
        if (!detail.open) return;
        Array.from(els.propertiesPanel.querySelectorAll("details[data-properties-accordion]")).forEach(other => {
          if (other !== detail) other.open = false;
        });
        savePropertiesPanelPreference({ openSection: detail.dataset.propertiesAccordion });
      });
    });
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
    if (!shouldRenderPreviewNow()) deferPendingScheduledRender();
    let qualitySurfacesRefreshed = false;
    if (activeName === "quality") {
      if (qualityRefreshDirty && !qualityRefreshAwaitingRender) {
        scheduleBackgroundQualityRefresh({ priority: true, refreshSurfaces: false });
      }
      if (!isQualityRefreshUnavailable() && lastLayout && lastLayout.report) {
        refreshQualitySurfaces({ showChecklist: true, refreshProperties: false });
        qualitySurfacesRefreshed = true;
      }
    } else if (qualityRefreshScheduled && qualityRefreshPriority) {
      setQualityAnalysisPriority(false);
    }
    if (!qualitySurfacesRefreshed) updateWorkspaceSummary();
    if (activeName === "translate") renderTranslationWorkbench();
    if (activeName === "projects") refreshProjectTableUx();
    renderPropertiesForActiveState(getDefaultPropertiesSelectionForWorkspace(activeName));
    if (activeName === "preview") renderCategoryEditors();
    if (activeName === "quality" && !qualitySurfacesRefreshed) refreshQualityMetricsPanel();
    if (activeName === "regions") {
      if (pendingPreviewRefresh) {
        refreshRegionColoursFromRows();
      } else {
        renderRegionValueTable();
      }
    }
    if (pendingPreviewRefresh && shouldRenderPreviewNow()) requestPreviewRefresh();
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

  function getReferenceCityMapLabel(city, language = currentMapLanguage) {
    if (!city) return "";
    const override = baselayer.referenceCities.overrides[city.id] && baselayer.referenceCities.overrides[city.id].name;
    if (override && String(override[language] || "").trim()) return String(override[language]).trim();
    return language === "fr" ? String(city.name_fr || city.name || "") : String(city.name || city.name_fr || "");
  }

  function createReferenceCityRenderState(projection, settings, placed) {
    const state = {
      items: [],
      unresolvedIds: [],
      excludedRegionIds: [],
      unsupportedBoundaryIds: [],
      hiddenLabelCount: 0,
      active: false
    };
    const model = cloneReferenceCities(baselayer.referenceCities);
    if (!model.ids.length) return state;
    state.active = true;
    if (currentBoundary !== "canada") {
      state.unsupportedBoundaryIds = model.ids.slice();
      return state;
    }

    const occupied = (placed || []).map(labelBackgroundRect);
    const acceptedReferenceRects = [];
    const fontSize = Math.max(8, Math.min(11, Number(settings.labelSize || 14) * 0.62));
    const dotRadius = Math.max(2.5, Math.min(4, settings.width / 245));

    model.ids.forEach(id => {
      const city = getIndexedCityById(id);
      if (!city) {
        state.unresolvedIds.push(id);
        return;
      }
      const regionId = getCityRegionId(city);
      if (!regionId) {
        state.unresolvedIds.push(id);
        return;
      }
      if (regionVisibility[regionId] === false) {
        state.excludedRegionIds.push(id);
        return;
      }
      const point = projection([Number(city.lon), Number(city.lat)]);
      if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
        state.unresolvedIds.push(id);
        return;
      }
      const name = getReferenceCityMapLabel(city, settings.mapLanguage);
      const labelX = point[0] + dotRadius + 3;
      const labelY = point[1] + fontSize * 0.34;
      const labelWidth = measureLabelTextWidth(name, fontSize, settings.fontFamily, 700);
      const rect = {
        x0: labelX - 1,
        y0: labelY - fontSize - 1,
        x1: labelX + labelWidth + 1,
        y1: labelY + 2
      };
      const outsideCanvas = rect.x0 < 0 || rect.y0 < 0 || rect.x1 > settings.width || rect.y1 > settings.height;
      const conflicts = outsideCanvas
        || occupied.some(other => rectsOverlap(rect, other))
        || acceptedReferenceRects.some(other => rectsOverlap(rect, other));
      if (conflicts) state.hiddenLabelCount += 1;
      else acceptedReferenceRects.push(rect);
      state.items.push({
        id: city.id,
        name,
        province: city.prov,
        regionId,
        x: point[0],
        y: point[1],
        labelX,
        labelY,
        fontSize,
        dotRadius,
        showLabel: !conflicts
      });
    });
    return state;
  }

  function attachReferenceCityDiagnostics(report, referenceState) {
    const target = report || {};
    const state = referenceState || {};
    if (!state.active) {
      delete target.referenceCityUnresolvedIds;
      delete target.referenceCityExcludedRegionIds;
      delete target.referenceCityUnsupportedBoundaryIds;
      delete target.referenceCityHiddenLabelCount;
      return target;
    }
    target.referenceCityUnresolvedIds = Array.isArray(state.unresolvedIds) ? state.unresolvedIds : [];
    target.referenceCityExcludedRegionIds = Array.isArray(state.excludedRegionIds) ? state.excludedRegionIds : [];
    target.referenceCityUnsupportedBoundaryIds = Array.isArray(state.unsupportedBoundaryIds) ? state.unsupportedBoundaryIds : [];
    target.referenceCityHiddenLabelCount = Number(state.hiddenLabelCount || 0);
    return target;
  }

  function drawReferenceCities(svg, referenceState) {
    const layer = svg.append("g").attr("class", "reference-city-layer");
    layer.selectAll("circle")
      .data(referenceState.items)
      .join("circle")
      .attr("class", "reference-city-dot")
      .attr("data-reference-city-id", city => city.id)
      .attr("data-region-id", city => city.regionId)
      .attr("cx", city => city.x)
      .attr("cy", city => city.y)
      .attr("r", city => city.dotRadius);
    layer.selectAll("text")
      .data(referenceState.items.filter(city => city.showLabel))
      .join("text")
      .attr("class", city => `reference-city-label ${mapTypographySizeClass(city.fontSize)}`)
      .attr("data-reference-city-id", city => city.id)
      .attr("data-region-id", city => city.regionId)
      .attr("x", city => city.labelX)
      .attr("y", city => city.labelY)
      .text(city => city.name);
  }

  function render(options = {}) {
    const startedAt = performanceNow();
    let renderError = null;
    try {
      return renderMap(options);
    } catch (error) {
      renderError = error;
      if (qualityRefreshAwaitingRender) failQualityRefresh(error);
      throw error;
    } finally {
      recordRenderPerformance(options, startedAt, performanceNow(), renderError);
    }
  }

  function renderMap(options = {}) {
    markQualityRefreshAwaitingRender({ refreshSurfaces: false });
    pendingPreviewRefresh = false;
    pendingPreviewRefreshOptions = null;
    let settings = getSettings();
    const rows = getRows();
    updatePreviewState();
    const svg = els.svg;
    svg.selectAll("*").remove();
    syncMapTypographyRoot(svg, settings);
    svg.attr("viewBox", `0 0 ${settings.width} ${settings.height}`);
    svg.attr("width", settings.width);
    svg.attr("height", settings.height);

    svg.append("title").text(settings.title || tFor(settings.mapLanguage, "status.customMapTitle"));
    svg.append("desc").text(tFor(settings.mapLanguage, "map.svgDescription", { boundary: getBoundaryLabel(currentBoundary, settings.mapLanguage) }));

    if (settings.title) {
      const denseCompact = settings.bookSize === "compact" && settings.imageSize === "half";
      const fittedTitleSize = denseCompact
        ? 5
        : Math.max(8, Math.min(24, (settings.width - 60) / Math.max(1, settings.title.length * 0.55)));
      svg.append("text")
        .attr("class", `map-title ${mapTypographySizeClass(fittedTitleSize)}${denseCompact ? " is-compact" : ""}`)
        .attr("x", denseCompact ? Math.round(settings.width * 0.058) : 30)
        .attr("y", denseCompact ? Math.round(settings.height * 0.072) : 42)
        .text(settings.title);
    }

    if (!canadaGeo) {
      lastLayout = null;
      completeQualityRefreshFromRender();
      drawMissingMapMessage(svg, settings);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, false);
      if (activeDataTable === "quality") renderPropertiesForActiveState({ kind: "quality" });
      if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
      return;
    }

    const visibleGeo = getVisibleGeo();
    if (!visibleGeo || !visibleGeo.features.length) {
      const title = tFor(settings.mapLanguage, currentBoundary === "canada" ? "map.empty.noCanadaRegions.title" : "map.empty.noWorldRegions.title");
      const message = tFor(settings.mapLanguage, currentBoundary === "canada" ? "map.empty.noCanadaRegions.body" : "map.empty.noWorldRegions.body");
      lastLayout = null;
      completeQualityRefreshFromRender();
      drawMissingMapMessage(svg, settings, title, message);
      updateStatus(rows, [], [], { crossings: 0, overlaps: 0, longLines: 0, projectedProblems: [], hiddenRegionProblems: [] }, true);
      if (activeDataTable === "quality") renderPropertiesForActiveState({ kind: "quality" });
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
    settings = layoutBundle.settings;
    const layoutContext = layoutBundle.layoutContext;
    if (shouldResizeForAutoPlace) {
      if (layoutContext.requestedMapScale && layoutContext.requestedMapScale !== settings.mapScale) {
        els.mapScaleInput.value = settings.mapScale;
      }
      rememberCurrentLanguageMapScale(settings);
    }
    if (shouldAutoPlace && !cachedLayoutBundle) {
      rememberLanguageLayout(layoutCacheKey, layoutBundle);
      const finalLayoutCacheKey = getLayoutCacheKey(rows, settings, shouldResizeForAutoPlace);
      if (finalLayoutCacheKey !== layoutCacheKey) rememberLanguageLayout(finalLayoutCacheKey, layoutBundle);
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
      .attr("data-region-id", (d, i) => getRegionId(d, i))
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
    const sourceRowsByRowId = new Map(rows.map(row => [String(row.rowId), row]));
    const sourceRowForLayout = row => sourceRowsByRowId.get(String(row.rowId)) || row;
    const leaderRegionId = row => {
      const sourceRow = sourceRowForLayout(row);
      return sourceRow && sourceRow.anchor === "region" ? sourceRow.region || null : null;
    };
    const markerRows = mappedRows.map(row => placedByRowId.get(row.rowId) || row);
    const leaderRows = settings.hideLeaderLines ? [] : placed.filter(row => !row.hideLine);
    const report = analyzeLayout(placed, settings, projectedProblems, hiddenRegionProblems, mapBounds, mappedRows);
    const referenceCityState = createReferenceCityRenderState(projection, settings, placed);
    attachReferenceCityDiagnostics(report, referenceCityState);
    lastLayout = {
      placed,
      settings,
      report,
      mapBounds,
      feasibility: layoutContext.feasibility,
      mappedRows,
      calloutRows,
      projection,
      path,
      visibleGeo
    };

    drawReferenceCities(svg, referenceCityState);

    const leaderLayer = svg.append("g").attr("class", "leader-layer");
    if (settings.showLineCasing) {
      const casingExtra = Number(settings.labelDensityScale) < 1 ? 1.5 : 3.5;
      leaderLayer.selectAll("path.leader-casing")
        .data(leaderRows)
        .join("path")
        .attr("class", d => `leader-casing${isPointOffCanvas(d, settings) ? " is-off-canvas" : ""}`)
        .attr("data-layout-id", d => d.layoutId)
        .attr("data-label-side", d => d.labelSide)
        .attr("data-label-name", d => d.name)
        .attr("stroke-width", d => getLeaderLineWidth(sourceRowForLayout(d), settings) + casingExtra)
        .attr("d", d => linePath(d, settings));
    }
    leaderLayer.selectAll("path.leader-line")
      .data(leaderRows)
      .join("path")
      .attr("class", d => `leader-line${isPointOffCanvas(d, settings) ? " is-off-canvas" : ""}`)
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .attr("data-region-id", d => leaderRegionId(d))
      .attr("stroke-width", d => getLeaderLineWidth(sourceRowForLayout(d), settings))
      .attr("stroke", d => getLeaderLineColour(sourceRowForLayout(d), settings))
      .attr("d", d => linePath(d, settings));

    const markerLayer = svg.append("g").attr("class", "marker-layer");
    markerLayer.selectAll(".marker-boundary-warning")
      .data(markerRows)
      .join("circle")
      .attr("class", d => `marker-boundary-warning${isPointOffCanvas(d, settings) ? " is-active" : ""}`)
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-row-id", d => d.rowId)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => getCategoryMarkerSize(getCategory(d.type), settings) + 4)
      .attr("aria-hidden", "true");
    const markers = markerLayer.selectAll(".marker")
      .data(markerRows)
      .join(function (enter) {
        return enter.append(d => createMarkerElement(getCategory(d.type)));
      })
      .attr("class", d => `marker marker-${cleanType(d.type)}${getCategory(d.type).customIcon ? " marker-custom-icon" : ""}${settings.lockMarkerCoordinates ? " is-locked" : ""}${isPointOffCanvas(d, settings) ? " is-off-canvas" : ""}`)
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-row-id", d => d.rowId)
      .attr("data-off-canvas", d => String(isPointOffCanvas(d, settings)))
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
      .attr("class", d => `map-label-background${d.labelStyle === "rich" && d.labelBorder ? " has-label-border" : ""}`)
      .attr("rx", 5)
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
      .attr("data-layout-id", d => d.layoutId)
      .attr("data-label-style", d => d.labelStyle === "rich" ? "rich" : "compact")
      .attr("data-label-side", d => d.labelSide)
      .attr("data-label-name", d => d.name)
      .attr("x", d => getRenderedLabelTextX(d))
      .attr("y", d => d.labelY)
      .attr("text-anchor", d => getRenderedLabelTextAnchor(d))
      .on("click", (event, d) => {
        event.stopPropagation();
        setRowPropertiesContext("label", d, { labelKey: d.labelKey, manual: Boolean(manualLabelPositions[d.labelKey]) });
      });

    labels.each(function (d) {
      renderLabelTextLines(d3.select(this), d, settings);
    });
    attachLabelDragging(labels);
    drawRichLabelImages(svg, placed, settings);

    if (settings.showCallouts && calloutRows.length) drawCallouts(svg, calloutRows, settings, mapBounds);
    if (settings.showLegend && rows.length) drawLegend(svg, settings, mapBounds);
    if (mapScaleControlsVisible) drawMapScaleControls(svg, settings, mapBounds);
    if (renderOutputMode === "web") drawLabelWidthControls(svg, placed, settings);
    completeQualityRefreshFromRender();
    updateStatus(rows, mappedRows, calloutRows, report, true);
    restoreActiveQualityLocateTarget();
    refreshDocumentPropertiesIfActive();
    if (activeDataTable === "quality") renderPropertiesForActiveState({ kind: "quality" });
    syncPropertiesLabelHighlight();
    if (!els.regionTableBody.contains(document.activeElement)) renderRegionValueTable();
  }

  function renderLabelTextLines(text, row, settings) {
    text.selectAll("*").remove();
    const textX = getRenderedLabelTextX(row);
    text
      .attr("x", textX)
      .attr("text-anchor", getRenderedLabelTextAnchor(row));
    row.lines.forEach((line, index) => {
      const role = line && line.role || "title";
      const previousOffset = index > 0 ? Number(row.lines[index - 1].baselineOffset) : 0;
      const currentOffset = Number(line && line.baselineOffset);
      const lineAdvance = index === 0
        ? 0
        : (Number.isFinite(currentOffset) ? currentOffset - previousOffset : row.lineHeight);
      const lineFontSize = Number(line && line.fontSize) || getLabelLineFontSize(line, settings);
      text.append("tspan")
        .attr("class", `${role === "separator" ? "label-line label-separator" : `label-line label-${role}`} ${mapTypographySizeClass(lineFontSize)}`)
        .attr("x", textX)
        .attr("dy", lineAdvance)
        .text(role === "separator" ? "" : lineText(line));
      if (index === row.lines.length - 1 && row.footnote) {
        appendSuperscript(text, row.footnote, lineFontSize);
      }
    });
  }

  function refreshRenderedLabel(rowId) {
    if (!lastLayout || !Array.isArray(lastLayout.placed) || !lastLayout.settings || !lastLayout.mapBounds) return false;
    const row = readRowElement(getRowElementById(rowId));
    if (!row) return false;
    const placedIndex = lastLayout.placed.findIndex(item => String(item.rowId) === String(rowId));
    if (placedIndex < 0) return false;

    const current = lastLayout.placed[placedIndex];
    const mappedIndex = Array.isArray(lastLayout.mappedRows)
      ? lastLayout.mappedRows.findIndex(item => String(item.rowId) === String(rowId))
      : -1;
    const mapped = mappedIndex >= 0 ? lastLayout.mappedRows[mappedIndex] : current;
    const projected = { ...mapped, ...row, x: mapped.x, y: mapped.y };
    const box = makeLabelBox(projected, current.labelSide, lastLayout.settings, lastLayout.mapBounds);
    const next = {
      ...current,
      ...projected,
      ...box,
      layoutId: current.layoutId,
      labelKey: current.labelKey,
      labelSide: current.labelSide,
      labelX: current.labelX,
      labelY: current.labelY,
      anchor: current.anchor
    };
    const constrained = constrainLabelToCanvas(next, lastLayout.settings);
    if (constrained.wasConstrained) {
      next.labelX = constrained.labelX;
      next.labelY = constrained.labelY;
      if (manualLabelPositions[next.labelKey]) {
        manualLabelPositions[next.labelKey] = {
          x: next.labelX,
          y: next.labelY,
          side: next.labelSide
        };
      }
    }
    lastLayout.placed[placedIndex] = next;
    if (mappedIndex >= 0) lastLayout.mappedRows[mappedIndex] = projected;

    const svg = d3.select(els.svg.node());
    const selector = `[data-layout-id="${window.CSS && typeof CSS.escape === "function" ? CSS.escape(next.layoutId) : next.layoutId}"]`;
    svg.select(`rect.map-label-background${selector}`)
      .datum(next)
      .attr("class", `map-label-background${next.labelStyle === "rich" && next.labelBorder ? " has-label-border" : ""}`)
      .attr("data-label-side", next.labelSide)
      .attr("data-label-name", next.name)
      .call(node => positionLabelBackground(node, next));

    const label = svg.select(`text.map-label${selector}`)
      .datum(next)
      .attr("data-label-style", next.labelStyle === "rich" ? "rich" : "compact")
      .attr("data-label-side", next.labelSide)
      .attr("data-label-name", next.name)
      .attr("x", getRenderedLabelTextX(next))
      .attr("y", next.labelY)
      .attr("text-anchor", getRenderedLabelTextAnchor(next));
    if (label.empty()) return false;
    renderLabelTextLines(label, next, lastLayout.settings);

    svg.select(`path.leader-line${selector}`)
      .datum(next)
      .classed("is-off-canvas", isPointOffCanvas(next, lastLayout.settings))
      .attr("data-label-side", next.labelSide)
      .attr("data-label-name", next.name)
      .attr("stroke-width", getLeaderLineWidth(next, lastLayout.settings))
      .attr("stroke", getLeaderLineColour(next, lastLayout.settings))
      .attr("d", linePath(next, lastLayout.settings));
    const casingExtra = Number(lastLayout.settings.labelDensityScale) < 1 ? 1.5 : 3.5;
    svg.select(`path.leader-casing${selector}`)
      .datum(next)
      .classed("is-off-canvas", isPointOffCanvas(next, lastLayout.settings))
      .attr("data-label-side", next.labelSide)
      .attr("data-label-name", next.name)
      .attr("stroke-width", getLeaderLineWidth(next, lastLayout.settings) + casingExtra)
      .attr("d", linePath(next, lastLayout.settings));
    redrawRichLabelImages(next);
    const widthControl = svg.select(`g.label-width-control${selector}`).datum(next);
    if (!widthControl.empty()) positionLabelWidthControl(widthControl, next, lastLayout.settings);
    syncPropertiesLabelHighlight();
    return true;
  }

  function getEffectiveLabelMaxChars(row, settings = lastLayout && lastLayout.settings || getSettings()) {
    return normalizeLabelMaxCharsOverride(row && row.labelMaxChars) || normalizeLabelMaxChars(settings && settings.labelMaxChars);
  }

  function getLabelResizeCharacterWidth(row, settings) {
    const titleLine = Array.isArray(row && row.lines)
      ? row.lines.find(line => line && line.role === "title") || row.lines[0]
      : null;
    const fontSize = Number(titleLine && titleLine.fontSize) || getLabelLineFontSize(titleLine || asLabelLine(""), settings);
    return Math.max(1, fontSize * 0.58);
  }

  function syncLabelMaxCharsPropertyControl(rowId, value, hasOverride = true) {
    if (!els.propertiesSelectionControls) return;
    const form = els.propertiesSelectionControls.querySelector(".properties-form[data-row-id]");
    if (!form || String(form.dataset.rowId) !== String(rowId)) return;
    const input = form.querySelector("[data-property-field='labelMaxChars']");
    const reset = form.querySelector("[data-property-action='reset-label-max-chars']");
    if (input) input.value = String(value);
    if (reset) reset.disabled = !hasOverride;
  }

  function updateLabelMaxCharsOverride(rowId, value) {
    const normalized = normalizeLabelMaxChars(value);
    const row = updateProjectRowField(rowId, "labelMaxChars", normalized, { refreshTableUx: false });
    if (!row) return { row: null, patched: false };
    const patched = refreshRenderedLabel(rowId);
    syncLabelMaxCharsPropertyControl(rowId, normalized, true);
    return { row, patched };
  }

  function getLabelWidthHandlePosition(edge, resizeEdge, handleWidth = 9, gap = 2) {
    const width = Math.max(1, Number(handleWidth) || 9);
    const spacing = Math.max(0, Number(gap) || 0);
    const x = resizeEdge === "left"
      ? Number(edge) - spacing - width
      : Number(edge) + spacing;
    return { x, centerX: x + width / 2 };
  }

  function positionLabelWidthControl(group, row, settings) {
    const box = labelBackgroundRect(row);
    const resizeEdge = row.labelSide === "left" ? "left" : "right";
    const edge = resizeEdge === "left" ? box.x0 : box.x1;
    const centerY = box.centerY;
    const handleHeight = Math.max(14, Math.min(22, box.y1 - box.y0 - 2));
    const handleWidth = 9;
    const handlePosition = getLabelWidthHandlePosition(edge, resizeEdge, handleWidth);
    const characters = getEffectiveLabelMaxChars(row, settings);
    const resizable = isLabelWidthResizable(row, settings);
    const accessibleLabel = t(resizable ? "aria.resizeLabelWidth" : "aria.resizeLabelWidthUnavailable", {
      label: row.name || t("status.unnamedPoint")
    });
    group
      .attr("data-layout-id", row.layoutId)
      .attr("data-row-id", row.rowId)
      .attr("data-resize-edge", resizeEdge)
      .classed("is-disabled", !resizable)
      .attr("aria-disabled", String(!resizable));
    group.select(".label-width-edge")
      .attr("x1", edge)
      .attr("x2", edge)
      .attr("y1", box.y0)
      .attr("y2", box.y1);
    group.select(".label-width-handle")
      .attr("x", handlePosition.x)
      .attr("y", centerY - handleHeight / 2)
      .attr("width", handleWidth)
      .attr("height", handleHeight)
      .attr("aria-valuenow", characters)
      .attr("aria-valuetext", t("properties.field.charactersPerLine") + `: ${characters}`)
      .attr("aria-label", accessibleLabel)
      .attr("aria-disabled", String(!resizable));
    group.select(".label-width-grip")
      .attr("d", `M${handlePosition.centerX - 1.5},${centerY - 4}V${centerY + 4} M${handlePosition.centerX + 1.5},${centerY - 4}V${centerY + 4}`);
    group.select("title").text(accessibleLabel);
  }

  function commitKeyboardLabelWidth(row, delta) {
    if (!isLabelWidthResizable(row, lastLayout && lastLayout.settings || getSettings())) return;
    const currentRow = readRowElement(getRowElementById(row.rowId));
    if (!currentRow) return;
    const current = getEffectiveLabelMaxChars(currentRow);
    const next = normalizeLabelMaxChars(current + delta);
    if (next === current) return;
    pushAppUndoHistory("label width resize");
    const result = updateLabelMaxCharsOverride(row.rowId, next);
    if (result.patched) invalidatePatchedLayoutQuality();
    else requestPreviewRefresh();
    setStatusMessage(t("status.labelWidthChanged", { label: currentRow.name || t("status.unnamedPoint"), count: next }), "ok");
  }

  function attachLabelWidthResizing(handles, settings) {
    handles
      .on("click", event => {
        event.stopPropagation();
      })
      .on("keydown", function (event, row) {
        if (!["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        if (!isLabelWidthResizable(row, settings)) return;
        event.preventDefault();
        event.stopPropagation();
        const currentRow = readRowElement(getRowElementById(row.rowId));
        if (!currentRow) return;
        const current = getEffectiveLabelMaxChars(currentRow, settings);
        const next = event.key === "Home"
          ? 12
          : event.key === "End"
            ? 42
            : normalizeLabelMaxChars(current + (["ArrowRight", "ArrowUp"].includes(event.key) ? 1 : -1));
        commitKeyboardLabelWidth(row, next - current);
      })
      .call(d3.drag()
        .on("start", function (event, row) {
          if (event.sourceEvent) event.sourceEvent.stopPropagation();
          if (!isLabelWidthResizable(row, settings)) return;
          const currentRow = readRowElement(getRowElementById(row.rowId));
          if (!currentRow) return;
          const pointer = d3.pointer(event, els.svg.node());
          this.__labelWidthResize = {
            rowId: row.rowId,
            label: currentRow.name || row.name || t("status.unnamedPoint"),
            startX: pointer[0],
            startChars: getEffectiveLabelMaxChars(currentRow, settings),
            lastChars: getEffectiveLabelMaxChars(currentRow, settings),
            side: row.labelSide,
            characterWidth: getLabelResizeCharacterWidth(row, settings),
            changed: false,
            historyPushed: false,
            needsRender: false
          };
          beginLayoutQualityDrag();
          d3.select(this).classed("is-dragging", true);
        })
        .on("drag", function (event) {
          const state = this.__labelWidthResize;
          if (!state) return;
          const pointer = d3.pointer(event, els.svg.node());
          const next = getLabelMaxCharsForResize(
            state.startChars,
            pointer[0] - state.startX,
            state.side,
            state.characterWidth
          );
          if (next === state.lastChars) return;
          if (!state.historyPushed) {
            pushAppUndoHistory("label width resize");
            state.historyPushed = true;
          }
          if (!state.changed) markLayoutQualityDirty();
          const result = updateLabelMaxCharsOverride(state.rowId, next);
          state.changed = Boolean(result.row) || state.changed;
          state.needsRender = !result.patched || state.needsRender;
          state.lastChars = next;
        })
        .on("end", function () {
          const state = this.__labelWidthResize;
          delete this.__labelWidthResize;
          d3.select(this).classed("is-dragging", false);
          if (state && state.changed) {
            if (state.needsRender) requestPreviewRefresh();
            setStatusMessage(t("status.labelWidthChanged", { label: state.label, count: state.lastChars }), "ok");
          }
          endLayoutQualityDrag();
        }));
  }

  function drawLabelWidthControls(svg, placed, settings) {
    const layer = svg.append("g")
      .attr("class", "label-width-control-layer")
      .attr("role", "group")
      .attr("aria-label", t("properties.field.charactersPerLine"));
    const controls = layer.selectAll("g.label-width-control")
      .data(placed, row => row.layoutId)
      .join(enter => {
        const group = enter.append("g").attr("class", "label-width-control");
        group.append("line").attr("class", "label-width-edge");
        group.append("rect")
          .attr("class", "label-width-handle")
          .attr("rx", 3)
          .attr("role", "slider")
          .attr("aria-valuemin", 12)
          .attr("aria-valuemax", 42)
          .attr("tabindex", -1);
        group.append("path").attr("class", "label-width-grip");
        group.append("title");
        return group;
      })
      .each(function (row) {
        positionLabelWidthControl(d3.select(this), row, settings);
      });
    attachLabelWidthResizing(controls.select(".label-width-handle"), settings);
  }

  function drawRichLabelImages(svg, placed, settings) {
    const imageRows = placed.filter(row => row.labelStyle === "rich" && row.lines.some(line => line.role === "image" && line.assetRef));
    if (!imageRows.length) return;
    const layer = svg.select(".rich-label-image-layer").empty()
      ? svg.append("g").attr("class", "rich-label-image-layer")
      : svg.select(".rich-label-image-layer");
    imageRows.forEach(row => {
      row.lines.forEach((line, imageLineIndex) => {
        if (line.role !== "image" || !line.assetRef) return;
        const group = layer.append("g")
          .attr("class", "rich-label-image")
          .attr("data-layout-id", row.layoutId)
          .attr("data-image-line-index", imageLineIndex)
          .datum({ line })
          .on("click", event => {
            event.stopPropagation();
            setRowPropertiesContext("label", row, { labelKey: row.labelKey, manual: Boolean(manualLabelPositions[row.labelKey]) });
          });
        if (line.caption) group.append("title").text(line.caption);
        group.append("image")
          .attr("href", line.assetRef)
          .attr("xlink:href", line.assetRef)
          .attr("preserveAspectRatio", "xMidYMid meet");
        positionRichLabelImage(group, row, line);
      });
    });
  }

  function redrawRichLabelImages(row) {
    const svg = d3.select(els.svg.node());
    const escapedLayoutId = window.CSS && typeof CSS.escape === "function" ? CSS.escape(row.layoutId) : row.layoutId;
    svg.selectAll(`g.rich-label-image[data-layout-id="${escapedLayoutId}"]`).remove();
    drawRichLabelImages(svg, [row], lastLayout && lastLayout.settings);
    const layer = svg.select(".rich-label-image-layer");
    if (!layer.empty() && layer.selectAll(".rich-label-image").empty()) layer.remove();
  }

  function positionRichLabelImage(group, row, line) {
    if (!group || !row || !line) return;
    const box = labelVisualBox(row);
    const imageWidth = Math.min(row.textWidth, Math.max(1, Number(line.imageWidth) || richLabelImageDisplayRules.defaultSize));
    const imageHeight = Math.max(1, Number(line.imageHeight) || richLabelImageDisplayRules.defaultSize);
    const baselineOffset = Number(line.baselineOffset) || 0;
    const imageX = row.labelSide === "left" ? box.x1 - imageWidth : box.x0;
    const imageY = row.labelY - labelFontSize(row) + baselineOffset;
    group.select("image")
      .attr("x", imageX)
      .attr("y", imageY)
      .attr("width", imageWidth)
      .attr("height", imageHeight);
  }

  function appendSuperscript(textSelection, value, labelSize) {
    textSelection.append("tspan")
      .attr("class", `label-footnote ${mapTypographySizeClass(labelSize * 0.68)}`)
      .attr("dx", 2)
      .attr("baseline-shift", "super")
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
        beginLayoutQualityDrag();
        d.dragStartX = d.labelX;
        d.dragStartY = d.labelY;
        d.dragAxis = null;
        d.dragHistoryPushed = false;
        d.qualityRefreshInvalidated = false;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        const settings = getSettings();
        if (!d.qualityRefreshInvalidated) {
          markLayoutQualityDirty();
          d.qualityRefreshInvalidated = true;
        }
        if (!d.dragHistoryPushed) {
          pushManualLayoutHistory(`label move: ${d.name || ""}`, { allowEmpty: true });
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
        setLabelSidePreservingBox(d, getLabelSideForPosition(d));
        const constrained = constrainLabelToCanvas(d, settings);
        d.labelX = constrained.labelX;
        d.labelY = constrained.labelY;
        manualLabelPositions[d.labelKey] = { x: d.labelX, y: d.labelY, side: d.labelSide };

        const textX = getRenderedLabelTextX(d);
        const label = d3.select(this)
          .attr("data-label-side", d.labelSide)
          .attr("x", textX)
          .attr("y", d.labelY)
          .attr("text-anchor", getRenderedLabelTextAnchor(d));
        label.selectAll("tspan.label-line").attr("x", textX);

        d3.select(`rect.map-label-background[data-layout-id="${d.layoutId}"]`)
          .attr("data-label-side", d.labelSide)
          .call(node => positionLabelBackground(node, d));
        const widthControl = d3.select(`g.label-width-control[data-layout-id="${d.layoutId}"]`).datum(d);
        if (!widthControl.empty()) positionLabelWidthControl(widthControl, d, settings);
        d3.selectAll(`g.rich-label-image[data-layout-id="${d.layoutId}"]`)
          .each(function (imageDatum) {
            positionRichLabelImage(d3.select(this), d, imageDatum && imageDatum.line);
          });
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .attr("data-label-side", d.labelSide)
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
        delete d.qualityRefreshInvalidated;
        clearDistanceMarkers();
        d3.select(this).classed("is-dragging", false);
        endLayoutQualityDrag();
        refreshActiveRowProperties();
      }));
  }

  function attachMarkerDragging(markers, projection, settings) {
    markers.call(d3.drag()
      .on("start", function (event, d) {
        beginLayoutQualityDrag();
        const pointer = d3.pointer(event, els.svg.node());
        d.dragOffsetX = d.x - pointer[0];
        d.dragOffsetY = d.y - pointer[1];
        d.dragStartX = d.x;
        d.dragStartY = d.y;
        d.dragAxis = null;
        d.dragMarkerSize = getCategoryMarkerSize(getCategory(d.type), settings);
        d.qualityRefreshInvalidated = false;
        d3.select(this).classed("is-dragging", true);
      })
      .on("drag", function (event, d) {
        if (!d.qualityRefreshInvalidated) {
          markLayoutQualityDirty();
          d.qualityRefreshInvalidated = true;
        }
        const pointer = d3.pointer(event, els.svg.node());
        const next = constrainShiftDrag(
          { x: d.dragStartX, y: d.dragStartY },
          { x: pointer[0] + d.dragOffsetX, y: pointer[1] + d.dragOffsetY },
          d,
          event
        );
        const constrained = constrainMarkerToVisibleGutter(next, settings, d.dragMarkerSize);
        d.x = constrained.x;
        d.y = constrained.y;
        syncMarkerBoundaryState(d3.select(this), d, settings, d.dragMarkerSize);
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .classed("is-off-canvas", isPointOffCanvas(d, settings))
          .attr("d", linePath(d, settings));
      })
      .on("end", function (event, d) {
        const startX = d.dragStartX;
        const startY = d.dragStartY;
        const markerSize = d.dragMarkerSize || getCategoryMarkerSize(getCategory(d.type), settings);
        const constrained = constrainMarkerToVisibleGutter({ x: d.x, y: d.y }, settings, markerSize);
        d.x = constrained.x;
        d.y = constrained.y;
        syncMarkerBoundaryState(d3.select(this), d, settings, markerSize);
        d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
          .classed("is-off-canvas", isPointOffCanvas(d, settings))
          .attr("d", linePath(d, settings));
        const moved = Math.abs(d.x - startX) > 0.01 || Math.abs(d.y - startY) > 0.01;
        const offCanvas = isPointOffCanvas(d, settings);
        delete d.dragOffsetX;
        delete d.dragOffsetY;
        delete d.dragStartX;
        delete d.dragStartY;
        delete d.dragAxis;
        delete d.dragMarkerSize;
        delete d.qualityRefreshInvalidated;
        d3.select(this).classed("is-dragging", false);
        endLayoutQualityDrag();
        const coordinates = projection.invert([d.x, d.y]);
        if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
          d.x = startX;
          d.y = startY;
          syncMarkerBoundaryState(d3.select(this), d, settings, markerSize);
          d3.selectAll(`path[data-layout-id="${d.layoutId}"]`)
            .classed("is-off-canvas", isPointOffCanvas(d, settings))
            .attr("d", linePath(d, settings));
          setStatusMessage(t("status.coordinateUpdateFailed", { name: d.name }), "danger");
          return;
        }

        if (moved) pushAppUndoHistory("marker coordinate move");
        const lon = roundCoordinate(coordinates[0]);
        const lat = roundCoordinate(coordinates[1]);
        updateTableCoordinates(d.rowId, lon, lat);
        d.lon = lon;
        d.lat = lat;
        setStatusMessage(t(offCanvas ? "status.markerMovedOffCanvas" : "status.coordinatesUpdated", { name: d.name }), offCanvas ? "warning" : "ok");
      }));
  }

  function isPointOffCanvas(position, settings) {
    const width = Math.max(0, Number(settings && settings.width) || 0);
    const height = Math.max(0, Number(settings && settings.height) || 0);
    const x = Number(position && position.x);
    const y = Number(position && position.y);
    return Number.isFinite(x) && Number.isFinite(y) && (x < 0 || x > width || y < 0 || y > height);
  }

  function constrainLabelToCanvas(label, settings) {
    const width = Math.max(0, Number(settings && settings.width) || 0);
    const height = Math.max(0, Number(settings && settings.height) || 0);
    const sourceX = Number(label && label.labelX);
    const sourceY = Number(label && label.labelY);
    const rect = labelBackgroundRect(label);
    let offsetX = 0;
    let offsetY = 0;
    if (rect.x1 - rect.x0 <= width) {
      if (rect.x0 < 0) offsetX = -rect.x0;
      else if (rect.x1 > width) offsetX = width - rect.x1;
    } else {
      offsetX = -rect.x0;
    }
    if (rect.y1 - rect.y0 <= height) {
      if (rect.y0 < 0) offsetY = -rect.y0;
      else if (rect.y1 > height) offsetY = height - rect.y1;
    } else {
      offsetY = -rect.y0;
    }
    const labelX = sourceX + offsetX;
    const labelY = sourceY + offsetY;
    return {
      labelX,
      labelY,
      wasConstrained: Math.abs(offsetX) > 0.01 || Math.abs(offsetY) > 0.01
    };
  }

  function constrainMarkerToVisibleGutter(position, settings, markerSize) {
    const width = Math.max(0, Number(settings && settings.width) || 0);
    const height = Math.max(0, Number(settings && settings.height) || 0);
    const warningGutter = Math.max(16, (Number(markerSize) || 0) + 8);
    const sourceX = Number.isFinite(Number(position && position.x)) ? Number(position.x) : width / 2;
    const sourceY = Number.isFinite(Number(position && position.y)) ? Number(position.y) : height / 2;
    const x = clamp(sourceX, -warningGutter, width + warningGutter);
    const y = clamp(sourceY, -warningGutter, height + warningGutter);
    return {
      x,
      y,
      wasConstrained: Math.abs(x - sourceX) > 0.01 || Math.abs(y - sourceY) > 0.01,
      offCanvas: isPointOffCanvas({ x, y }, settings)
    };
  }

  function syncMarkerBoundaryState(node, d, settings, markerSize) {
    const offCanvas = isPointOffCanvas(d, settings);
    moveMarkerNode(node, d, { markerSize });
    node
      .classed("is-off-canvas", offCanvas)
      .attr("data-off-canvas", String(offCanvas));
    d3.selectAll(".marker-boundary-warning")
      .filter(warning => String(warning && warning.rowId) === String(d.rowId))
      .classed("is-active", offCanvas)
      .attr("cx", d.x)
      .attr("cy", d.y)
      .attr("r", markerSize + 4);
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
    updateRowAnnotationPreview(tr);
    syncCoordinateClearButtons(tr);
  }

  function getFocusedTablePosition() {
    const active = document.activeElement;
    if (!active || !els.tableBody.contains(active)) return null;

    const tr = active.closest("tr");
    const rowIndex = getTableRows().indexOf(tr);
    let fieldIndex = -1;
    const activeFields = getActiveTableFields();
    if (active.classList.contains("name-input")) fieldIndex = activeFields.indexOf("name");
    if (active.classList.contains("footnote-input")) fieldIndex = activeFields.indexOf("footnote");
    if (active.classList.contains("type-input")) fieldIndex = activeFields.indexOf("type");
    if (active.classList.contains("cityLocationInput")) fieldIndex = activeFields.indexOf("city");
    if (active.classList.contains("region-input")) fieldIndex = activeFields.indexOf("region");
    if (active.classList.contains("lon-input")) fieldIndex = activeFields.indexOf("lon");
    if (active.classList.contains("lat-input")) fieldIndex = activeFields.indexOf("lat");

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

    if (inQuotes) errors.push({
      row: rows.length,
      code: "MissingQuotes",
      i18nKey: "dialog.csv.error.unclosedQuotedValue"
    });
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

  function getCsvParserErrorMessage(error = {}) {
    if (error && error.i18nKey) return t(error.i18nKey, error.i18nParams || {});
    const keyByCode = {
      MissingQuotes: "dialog.csv.error.missingQuotes",
      UndetectableDelimiter: "dialog.csv.error.undetectableDelimiter",
      TooFewFields: "dialog.csv.error.tooFewFields",
      TooManyFields: "dialog.csv.error.tooManyFields"
    };
    return t(keyByCode[error && error.code] || "dialog.csv.error.parse");
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
    if (field === "city") {
      const resolved = cityIntegration && cityIntegration.resolveCityInput(value, indexedReferenceCities);
      applyProjectCitySelection(tr, resolved && resolved.status === "matched" ? resolved.city : null, {
        deferRefresh: true,
        refreshProperties: false,
        status: false
      });
      return resolved || { status: "unmatched", city: null, matches: [] };
    }
    if (field === "region") {
      const resolved = resolveProjectRegionInput(value);
      tr.dataset.region = resolved.status === "matched" ? resolved.id : "";
      const regionInput = tr.querySelector(".region-input");
      if (regionInput) regionInput.value = tr.dataset.region;
    }
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
    const cityIssues = [];
    pastedRows.forEach((pastedRow, rowOffset) => {
      const tr = tableRows[start.rowIndex + rowOffset];
      pastedRow.forEach((value, colOffset) => {
        const field = getActiveTableFields()[start.fieldIndex + colOffset];
        if (field) {
          const result = setTableField(tr, field, value);
          if (field === "city" && result && !["matched", "empty"].includes(result.status)) {
            cityIssues.push(String(value || "").trim());
          }
        }
      });
    });

    const firstPastedRow = tableRows[start.rowIndex];
    if (firstPastedRow) firstPastedRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
    clearAllLanguageLayouts();
    refreshProjectTableUx();
    requestPreviewRefresh();
    setStatusMessage(cityIssues.length
      ? t("status.pastedRowsWithCityIssues", { count: pastedRows.length, cities: cityIssues.join(", ") })
      : t("status.pastedRows", { count: pastedRows.length }), cityIssues.length ? "warning" : "ok");
  }

  function updateDeleteButtonState() {
    const hasSelection = getProjectRowsSelectedForDelete().length > 0;
    els.deleteSelectedBtn.disabled = !hasSelection;
    if (els.projectSelectionActions) {
      const hasCellSelection = Array.from(selectedProjectCells).some(key => Boolean(getRowElementById(parseProjectCellKey(key).rowId)));
      els.projectSelectionActions.hidden = !(hasSelection || hasCellSelection);
    }
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
    if (event.key === "Escape" && els.applicationSettingsMenu && !els.applicationSettingsMenu.hidden) {
      event.preventDefault();
      setApplicationSettingsOpen(false, { restoreFocus: true });
      return;
    }
    if (event.key === "Escape" && els.shortcutsOverlay && !els.shortcutsOverlay.hidden) {
      event.preventDefault();
      closeShortcutsOverlay();
      return;
    }
    if (event.key === "Escape" && (isPointPropertiesSelection() || isBaselayerPropertiesSelection()) && !getOpenDialogElement()) {
      event.preventDefault();
      if (!clearPointPropertiesSelection()) clearBaselayerPropertiesSelection();
      if (propertiesDrawerMedia.matches && document.body.classList.contains("properties-open")) {
        setPropertiesDrawerOpen(false, { restoreFocus: true });
      }
      return;
    }
    if (event.key === "Escape" && propertiesDrawerMedia.matches && document.body.classList.contains("properties-open")) {
      event.preventDefault();
      setPropertiesDrawerOpen(false, { restoreFocus: true });
      return;
    }
    if (event.key !== "?" || isTypingShortcutTarget(event.target)) return;
    if (getOpenDialogElement()) return;
    event.preventDefault();
    if (els.shortcutsOverlay && !els.shortcutsOverlay.hidden) closeShortcutsOverlay();
    else openShortcutsOverlay();
  }

  function getOpenDialogElement() {
    return [els.feedbackDialog, els.confirmationDialog, els.startupDialog, els.csvMapDialog, els.pointCatalogDialog, els.mapDetailsDialog]
      .find(dialog => dialog && !dialog.hidden) || null;
  }

  function applyCategorySettings(categories = []) {
    categoryIconValidationErrors.clear();
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
      const stroke = normalizeHexColour(savedCategory.stroke, (category && category.stroke) || "#ffffff");
      const markerSize = normalizeMarkerSize(savedCategory.markerSize, settings.markerSize, 4, 30);
      const lineWidth = normalizeLeaderLineWidth(savedCategory.lineWidth, settings.lineWidth);
      const customIcon = normalizeCustomMarkerIcon(savedCategory.customIcon);
      const markerSizeCustom = savedCategory.markerSizeCustom !== undefined
        ? Boolean(savedCategory.markerSizeCustom)
        : markerSize !== settings.markerSize;
      const lineWidthCustom = savedCategory.lineWidthCustom !== undefined
        ? Boolean(savedCategory.lineWidthCustom)
        : lineWidth !== settings.lineWidth;
      const resolvedMarkerSize = markerSizeCustom ? markerSize : settings.markerSize;
      const resolvedLineWidth = lineWidthCustom ? lineWidth : settings.lineWidth;

      if (category) {
        category.label = label;
        category.labelFr = labelFr;
        category.shape = shape;
        category.colour = colour;
        category.stroke = stroke;
        category.markerSize = resolvedMarkerSize;
        category.lineWidth = resolvedLineWidth;
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
        stroke,
        markerSize: resolvedMarkerSize,
        lineWidth: resolvedLineWidth,
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
    if (!categorySettings.some(category => category.id === activeCategoryId)) {
      activeCategoryId = categorySettings[0] ? categorySettings[0].id : "";
    }
    renderCategoryEditors();
    updateTypeOptions();
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
      resetLanguageMapOffsets();
      saveLayoutPreferences();
    }

    if (event && (event.target === els.markerSizeInput || event.target === els.lineWidthInput)) {
      syncDefaultCategorySizes();
    }
    if (target === els.mapScaleInput) {
      target.value = normalizeMapScale(target.value);
    }
    if (target === els.markerSizeInput) target.value = normalizeMarkerSize(target.value, layoutDefaults.markerSizeInput, 4, 20);
    if (target === els.lineWidthInput) target.value = normalizeLeaderLineWidth(target.value);
    if (target === els.leaderColourInput) target.value = normalizeHexColour(target.value, layoutDefaults.leaderColourInput || "#333333");
    syncCompactFurnitureAvailability();
    if (!target || target === els.markerSizeInput || target === els.lineWidthInput) {
      renderCategoryEditors();
    }
    scheduleRender();
    if (event && event.target === els.mapScaleInput) {
      rememberCurrentLanguageMapScale();
      setStatusMessage(t("status.mapSizeChanged"), "ok");
    }
  }

  function addCategory() {
    pushAppUndoHistory("add category");
    const count = categorySettings.length + 1;
    const { label, labelFr } = getDefaultCategoryLabels(count);
    const settings = getSettings();
    const category = {
      id: makeCategoryId(label),
      label,
      labelFr,
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
    };
    categorySettings.push(category);
    activeCategoryId = category.id;
    renderCategoryEditors();
    updateTypeOptions();
    requestPreviewRefresh();
    setCategoryPropertiesContext({ focus: true });
  }

  function getDefaultCategoryLabels(count, translate = tFor) {
    const params = { count };
    return {
      label: translate("en", "properties.category.defaultNameNumbered", params),
      labelFr: translate("fr", "properties.category.defaultNameNumbered", params)
    };
  }

  function removeCategory(categoryId) {
    const category = categorySettings.find(item => item.id === categoryId);
    if (!category) return false;
    if (categorySettings.length <= 1) {
      setStatusMessage(t("status.legendMarkerRequired"), "warning");
      return false;
    }
    if (category.removable === false) {
      setStatusMessage(t("status.legendMarkerProtected"), "warning");
      return false;
    }

    pushAppUndoHistory("remove category");
    const replacementCategory = categorySettings.find(item => item.id !== categoryId) || getDefaultCategory();
    Array.from(els.tableBody.querySelectorAll(".type-input")).forEach(select => {
      if (select.value === categoryId) select.value = replacementCategory.id;
    });
    categoryIconValidationErrors.delete(categoryId);
    categorySettings.splice(categorySettings.indexOf(category), 1);
    if (activeCategoryId === categoryId) activeCategoryId = replacementCategory.id;
    renderCategoryEditors();
    updateTypeOptions();
    requestPreviewRefresh();
    if (activePropertiesSelection && activePropertiesSelection.kind === "category") setCategoryPropertiesContext();
    return true;
  }

  function closeLegendItemMenus({ restoreFocus = false } = {}) {
    if (!els.categoryList) return;
    els.categoryList.querySelectorAll(".legend-item-menu-button").forEach(button => {
      const menu = document.getElementById(button.getAttribute("aria-controls"));
      const wasOpen = menu && !menu.hidden;
      if (menu) menu.hidden = true;
      button.closest(".legend-item")?.classList.remove("is-menu-open");
      button.setAttribute("aria-expanded", "false");
      if (restoreFocus && wasOpen) button.focus({ preventScroll: true });
    });
  }

  function setLegendItemMenuOpen(button, open) {
    if (!button) return;
    const menu = document.getElementById(button.getAttribute("aria-controls"));
    if (!menu) return;
    closeLegendItemMenus();
    menu.hidden = !open;
    button.closest(".legend-item")?.classList.toggle("is-menu-open", open);
    button.setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
  }

  function handleLegendItemMenuKeydown(event) {
    const menu = event.target.closest(".legend-item-menu");
    if (!menu) return;
    const items = Array.from(menu.querySelectorAll("button:not([disabled])"));
    if (event.key === "Escape") {
      event.preventDefault();
      closeLegendItemMenus({ restoreFocus: true });
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) || !items.length) return;
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

  function clearCategoryDropIndicators() {
    if (!els.categoryList) return;
    els.categoryList.querySelectorAll(".legend-item").forEach(editor => {
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

  function moveCategoryByOffset(categoryId, offset) {
    const fromIndex = categorySettings.findIndex(category => category.id === categoryId);
    const targetIndex = fromIndex + offset;
    if (fromIndex < 0 || targetIndex < 0 || targetIndex >= categorySettings.length) return false;
    return reorderCategory(categoryId, categorySettings[targetIndex].id, offset < 0 ? "before" : "after");
  }

  function getCategoryDropPlacement(event, editor) {
    const rect = editor.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2 ? "after" : "before";
  }

  function handleCategoryDragStart(event) {
    const handle = event.target.closest(".category-drag-handle");
    if (!handle) return;
    draggedCategoryId = handle.dataset.categoryId;
    const editor = handle.closest(".legend-item");
    if (editor) editor.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedCategoryId);
    }
  }

  function handleCategoryDragOver(event) {
    if (!draggedCategoryId) return;
    const editor = event.target.closest(".legend-item");
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
    const editor = event.target.closest(".legend-item");
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
    const denseCompact = compact && Number(settings.labelDensityScale) < 1;
    return {
      insetX: denseCompact ? 5 : compact ? 10 : 30,
      markerX: denseCompact ? 12 : compact ? 18 : 52,
      textX: denseCompact ? 24 : compact ? 36 : 82,
      rightPad: denseCompact ? 5 : compact ? 10 : 30
    };
  }

  function getLegendBoxLayout(settings) {
    const compact = settings.compactFurniture !== false;
    const denseCompact = compact && Number(settings.labelDensityScale) < 1;
    const rowMetrics = getFurnitureRowMetrics(settings);
    const textSizeRender = normalizeMapTypographySize(compact
      ? Math.max(denseCompact ? 5 : 7, Math.round(settings.labelSizeRender * 0.78))
      : settings.labelSizeRender);
    const headingSize = Math.max(settings.labelSize, Math.round(settings.labelSize * 1.02));
    const headingSizeRender = normalizeMapTypographySize(Math.max(settings.labelSizeRender, Math.round(settings.labelSizeRender * 1.02)));
    const rowHeight = compact
      ? Math.max(denseCompact ? 14 : 18, Math.round(textSizeRender * 2.1))
      : Math.max(34, Math.round(settings.labelSize * 2.45));
    const headingHeight = compact
      ? Math.max(denseCompact ? 12 : 16, Math.round(headingSizeRender * (denseCompact ? 1.8 : 2)))
      : Math.max(31, Math.round(headingSize * 2.1));
    const verticalPadding = denseCompact ? 4 : compact ? 6 : Math.max(22, Math.round(settings.labelSize * 1.7));
    const headingRuleY = verticalPadding + headingHeight;
    const headingText = getChromeText("legendHeading", settings.mapLanguage);
    const statusItems = getUsedRegionStatusOptions();
    const legendLabels = categorySettings.map(category => getCategoryText(category, settings.mapLanguage)).concat(statusItems.map(item => item.label));
    const longestLabelLength = Math.max(6, headingText.length, ...legendLabels.map(label => label.length));
    const widthPad = compact ? rowMetrics.textX + rowMetrics.rightPad : 126;
    const fallbackDimensions = {
      width: Math.max(denseCompact ? 120 : compact ? 132 : 300, Math.min(compact ? 210 : 420, Math.round(longestLabelLength * textSizeRender * 0.58 + widthPad))),
      height: verticalPadding * 2 + headingHeight + (categorySettings.length + statusItems.length) * rowHeight
    };
    const constraints = {
      minWidth: compact
        ? Math.max(denseCompact ? 120 : 126, Math.round(longestLabelLength * textSizeRender * 0.58 + widthPad))
        : Math.max(290, Math.round(longestLabelLength * settings.labelSizeRender * 0.58 + 126)),
      minHeight: fallbackDimensions.height,
      maxWidth: settings.width - 20,
      maxHeight: settings.height - 20
    };
    const dimensions = getBoxDimensions("legend", fallbackDimensions, constraints, settings);
    const position = getBoxPosition("legend", {
      x: compact ? Math.round(settings.width * 0.1) : 40,
      y: compact
        ? settings.height - dimensions.height - Math.max(12, Math.round(settings.height * 0.04))
        : settings.height - 150
    }, dimensions, settings);
    return {
      dimensions,
      position,
      constraints,
      headingText,
      headingSizeRender,
      textSizeRender,
      headingRuleY,
      rowHeight,
      headingHeight,
      verticalPadding,
      statusItems,
      ...rowMetrics
    };
  }

  function getCalloutTypography(settings) {
    const fallback = getLabelTypographyRenderSizes(
      settings && (settings.labelSizePt || settings.labelSize),
      settings && settings.outputMode
    );
    return {
      headingSize: normalizeMapTypographySize(Number(settings && settings.labelTitleSizeRender) || fallback.title),
      nameSize: normalizeMapTypographySize(Number(settings && settings.labelBodySizeRender) || fallback.body)
    };
  }

  function getCalloutContentLayout(calloutRows, settings, width) {
    const compact = settings.compactFurniture !== false;
    const rowMetrics = compact
      ? { insetX: 24, markerX: 46, textX: 72, rightPad: 24 }
      : getFurnitureRowMetrics(settings);
    const headingText = getChromeText("calloutHeading", settings.mapLanguage);
    const { headingSize, nameSize } = getCalloutTypography(settings);
    const headingHeight = Math.max(compact ? 22 : 26, Math.round(headingSize * (compact ? 1.8 : 2)));
    const lineH = Math.max(compact ? 12 : 14, Math.round(nameSize * (compact ? 1.5 : 1.65)));
    const rowGap = Math.max(compact ? 6 : 8, Math.round(nameSize * (compact ? 0.75 : 1)));
    const padV = Math.max(compact ? 16 : 20, Math.round(headingSize * (compact ? 1.4 : 1.6)));
    const headingRuleY = padV + headingHeight;
    const headingRuleGap = compact ? 12 : 15;
    const { textX, markerX, rightPad } = rowMetrics;
    const textWidth = Math.max(90, width - textX - rightPad);
    const maxNameChars = Math.max(12, Math.floor(textWidth / Math.max(6, nameSize * 0.58)));
    let cursorY = headingRuleY + headingRuleGap;
    const rows = calloutRows.map((row, index) => {
      const nameLines = getLabelLines(row, { ...settings, labelMaxChars: maxNameChars });
      const nameHeight = nameLines.length * lineH;
      const markerSize = Math.max(7, Math.min(14, getCategoryMarkerSize(getCategory(row.type), settings)));
      const rowHeight = Math.max(nameHeight, markerSize * 2);
      const layout = {
        row,
        rowY: cursorY,
        textY: cursorY + (rowHeight - nameHeight) / 2,
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
    const { headingSize, nameSize } = getCalloutTypography(settings);
    const longestNameLen = Math.max(0, ...calloutRows.map(row => getLabelText(row, settings.mapLanguage).length));
    const boxPad = compact ? 118 : 132;
    const nameWidth = longestNameLen * nameSize * 0.58 + boxPad;
    const headingWidth = headingText.length * headingSize * 0.58 + boxPad;
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
    const denseCompact = settings.bookSize === "compact" && settings.imageSize === "half";
    const pad = denseCompact ? 4 : Math.max(12, Math.round(settings.labelSize * 0.8));
    const obstacles = [];
    if (settings.title) {
      const denseCompact = settings.bookSize === "compact" && settings.imageSize === "half";
      obstacles.push({
        key: "title",
        rect: {
          x0: denseCompact ? Math.round(settings.width * 0.04) : 18,
          y0: 0,
          x1: denseCompact ? Math.round(settings.width * 0.96) : settings.width - 18,
          y1: denseCompact ? Math.round(settings.height * 0.09) : 62
        }
      });
    }
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
          pushManualLayoutHistory(getBoxHistoryLabel(key, "move"), { allowEmpty: true });
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
    if (visibilityInput) {
      const hide = group.append("g")
        .attr("class", "box-controls box-hide-control")
        .attr("role", "button")
        .attr("aria-label", t("map.hideBox", { label }))
        .on("click", event => {
          event.stopPropagation();
          setMapFurnitureVisibility(key, false, visibilityInput, label);
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
    }

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
            pushManualLayoutHistory(getBoxHistoryLabel(key, "resize"), { allowEmpty: true });
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

  function getUsedRegionStatusOptions() {
    const used = new Set(Object.values(regionStatuses).map(normalizeRegionStatus).filter(Boolean));
    return regionStatusOptions
      .filter(option => option.value && used.has(option.value) && isRegionStatusVisible(option.value))
      .map(option => ({ ...option, label: t(option.labelKey) }));
  }

  function drawLegend(svg, settings, mapBounds) {
    const {
      dimensions,
      position,
      constraints,
      headingText,
      headingSizeRender,
      textSizeRender,
      headingRuleY,
      rowHeight,
      headingHeight,
      verticalPadding,
      markerX,
      textX,
      statusItems
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
      .attr("height", dimensions.height)
      .attr("rx", 0);

    group.append("text")
      .attr("class", `box-heading legend-heading ${mapTypographySizeClass(headingSizeRender)}`)
      .attr("x", 24)
      .attr("y", verticalPadding + 4)
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
      const denseCompact = settings.compactFurniture !== false && Number(settings.labelDensityScale) < 1;
      const legendMarkerSize = Math.max(denseCompact ? 4 : 8, Math.min(denseCompact ? 9 : 18, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, markerX, itemY, legendMarkerSize)
        .classed("legend-category-marker", true)
        .attr("data-category-id", category.id);
      group.append("text")
        .attr("class", `legend-text ${mapTypographySizeClass(textSizeRender)}`)
        .attr("data-category-id", category.id)
        .attr("x", textX)
        .attr("y", itemY)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(getCategoryText(category, settings.mapLanguage));
    });

    statusItems.forEach((status, index) => {
      const itemY = verticalPadding + headingHeight + (categorySettings.length + index) * rowHeight + rowHeight / 2;
      group.append("rect")
        .attr("class", "legend-status-swatch")
        .attr("x", markerX - 9)
        .attr("y", itemY - 9)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", status.colour)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5);
      group.append("text")
        .attr("class", `legend-text ${mapTypographySizeClass(textSizeRender)}`)
        .attr("x", textX)
        .attr("y", itemY)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .text(status.label);
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
      .attr("height", dimensions.height)
      .attr("rx", 0);

    group.append("text")
      .attr("class", `box-heading callout-heading ${mapTypographySizeClass(headingSize)}`)
      .attr("x", 24)
      .attr("y", padV + 4)
      .attr("dominant-baseline", "hanging")
      .text(headingText);

    group.append("line")
      .attr("class", "box-heading-rule callout-heading-rule")
      .attr("x1", 24)
      .attr("y1", headingRuleY)
      .attr("x2", Math.max(24, dimensions.width - 24))
      .attr("y2", headingRuleY);

    rows.forEach(layout => {
      const { row, rowY, textY, nameLines, rowHeight } = layout;
      const category = getCategory(row.type);
      const markerSize = Math.max(7, Math.min(14, getCategoryMarkerSize(category, settings)));
      drawMarkerSymbol(group, category, markerX, rowY + rowHeight / 2, markerSize);

      const nameEl = group.append("text")
        .attr("class", `callout-text ${mapTypographySizeClass(nameSize)}`)
        .attr("x", textX)
        .attr("y", textY)
        .attr("dominant-baseline", "hanging");
      nameLines.forEach((line, index) => {
        nameEl.append("tspan")
          .attr("class", `callout-line callout-${line.role || "title"}`)
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
    const markerSize = normalizeMarkerSize(category.markerSize, layoutDefaults.markerSizeInput);
    const lineWidth = optionalNumber(category.lineWidth) || layoutDefaults.lineWidthInput;
    const previewRadius = Math.max(6, Math.min(12, markerSize));
    const previewLineWidth = Math.max(1, Math.min(4, lineWidth));
    const centre = 14;
    const svgAttributes = `class="category-marker-preview" viewBox="0 0 28 28" data-marker-size="${markerSize}" data-preview-radius="${previewRadius}" aria-hidden="true"`;
    if (category.customIcon) {
      const href = escapeHtml(category.customIcon.dataUrl);
      const iconSize = previewRadius * 2;
      return `<svg ${svgAttributes}><image href="${href}" xlink:href="${href}" x="${centre - previewRadius}" y="${centre - previewRadius}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet"></image></svg>`;
    }

    const fill = escapeHtml(category.colour);
    const stroke = escapeHtml(category.stroke);
    if (category.shape === "circle") {
      return `<svg ${svgAttributes}><circle cx="${centre}" cy="${centre}" r="${previewRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${previewLineWidth}"></circle></svg>`;
    }
    if (category.shape === "square") {
      const side = previewRadius * 2;
      return `<svg ${svgAttributes}><rect x="${centre - previewRadius}" y="${centre - previewRadius}" width="${side}" height="${side}" fill="${fill}" stroke="${stroke}" stroke-width="${previewLineWidth}"></rect></svg>`;
    }

    return `<svg ${svgAttributes}><path d="${markerPath(category.shape, previewRadius)}" transform="translate(${centre} ${centre})" fill="${fill}" stroke="${stroke}" stroke-width="${previewLineWidth}"></path></svg>`;
  }

  function getMarkerSizePreviewSvg(category = {}, markerSize = layoutDefaults.markerSizeInput) {
    const size = normalizeMarkerSize(markerSize, layoutDefaults.markerSizeInput, 4, 30);
    const centre = 36;
    const fill = escapeHtml(normalizeHexColour(category.colour, "#3b6f62"));
    const stroke = escapeHtml(normalizeHexColour(category.stroke, "#ffffff"));
    const shape = normalizeMarkerShape(category.shape);
    const svgAttributes = `class="marker-size-preview-svg" viewBox="0 0 72 72" data-marker-size="${size}" data-marker-shape="${escapeHtml(shape)}" focusable="false" aria-hidden="true"`;
    if (category.customIcon && category.customIcon.dataUrl) {
      const href = escapeHtml(category.customIcon.dataUrl);
      const side = size * 2;
      return `<svg ${svgAttributes}><image href="${href}" xlink:href="${href}" x="${centre - size}" y="${centre - size}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet"></image></svg>`;
    }
    if (shape === "circle") {
      return `<svg ${svgAttributes}><circle cx="${centre}" cy="${centre}" r="${size}" fill="${fill}" stroke="${stroke}" stroke-width="2"></circle></svg>`;
    }
    if (shape === "square") {
      const side = size * 2;
      return `<svg ${svgAttributes}><rect x="${centre - size}" y="${centre - size}" width="${side}" height="${side}" fill="${fill}" stroke="${stroke}" stroke-width="2"></rect></svg>`;
    }
    return `<svg ${svgAttributes}><path d="${markerPath(shape, size)}" transform="translate(${centre} ${centre})" fill="${fill}" stroke="${stroke}" stroke-width="2"></path></svg>`;
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
      .attr("class", "map-missing-title map-type-size-20")
      .attr("x", 55)
      .attr("y", 115)
      .text(resolvedTitle);
    svg.append("text")
      .attr("class", "map-missing-body map-type-size-16")
      .attr("x", 55)
      .attr("y", 150)
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

  function getMapTypographyExportCss(unit = "px") {
    const rules = [];
    for (let value = mapTypographySizeRange.min; value <= mapTypographySizeRange.max; value += mapTypographySizeRange.step) {
      const normalized = normalizeMapTypographySize(value);
      const token = String(normalized).replace(".", "-");
      rules.push(`.map-type-size-${token} { font-size: ${normalized}${unit}; }`);
    }
    return rules.join("\n      ");
  }

  function getExportCss(outputMode = "web") {
    const mapBackground = getCssVar("--map-background", "#ffffff");
    const mapBoundary = getCssVar("--map-boundary", "#ffffff");
    const mapBoxBorder = getCssVar("--map-box-border", "#333333");
    const ink = getCssVar("--map-ink", getCssVar("--ink", "#222222"));
    const muted = getCssVar("--map-muted", getCssVar("--muted", "#666666"));
    const leader = normalizeHexColour(getSettings().leaderColour, getCssVar("--leader", "#333333"));
    const fontFamily = quoteFontFamily(getSettings().fontFamily);

    return `
      #mapSvg { background: ${mapBackground}; }
      #mapSvg text { font-family: ${fontFamily}; }
      .map-title { font-weight: 700; fill: ${ink}; }
      .map-title.is-compact { font-weight: 400; }
      .province { stroke: ${mapBoundary}; stroke-width: 1.2; }
      .reference-city-dot { fill: ${getCssVar("--accent", "#3f6b5e")}; stroke: ${mapBackground}; stroke-width: 0.8; vector-effect: non-scaling-stroke; }
      .reference-city-label { fill: ${ink}; font-family: ${fontFamily}; font-weight: 700; paint-order: stroke; stroke: ${mapBackground}; stroke-width: 2.5px; stroke-linejoin: round; }
      .marker { stroke-width: 2.2; }
      .leader-casing { fill: none; stroke: ${mapBackground}; stroke-linecap: round; stroke-linejoin: round; }
      .leader-line { fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .leader-line:not([stroke]) { stroke: ${leader}; }
      .map-label-background { fill: none; stroke: none; }
      .map-label-background.has-label-border { fill: none; stroke: ${ink}; stroke-width: 1.2; vector-effect: non-scaling-stroke; }
      .map-label { font-family: ${fontFamily}; font-weight: 700; fill: ${ink}; }
      .map-label .label-paragraph, .map-label .label-bullet, .map-label .label-caption { font-weight: 400; }
      .label-footnote { font-weight: 700; }
      .callout-box, .legend-box { fill: ${mapBackground}; stroke: ${mapBoxBorder}; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      .callout-box { stroke-dasharray: 6 4; }
      .callout-text, .legend-text { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .box-heading { font-family: ${fontFamily}; fill: ${ink}; font-weight: 700; }
      .box-heading-rule { stroke: ${mapBoxBorder}; stroke-width: 1.5; vector-effect: non-scaling-stroke; }
      .callout-heading-rule { stroke-dasharray: 6 4; }
      .box-heading.is-hidden, .box-heading-rule.is-hidden { display: none; }
      .callout-paragraph, .callout-caption { font-style: italic; font-weight: 400; }
      .legend-note { font-family: ${fontFamily}; fill: ${muted}; font-style: italic; }
      ${getMapTypographyExportCss("px")}
    `;
  }

  function cloneCurrentSvgForExport(outputMode = "web") {
    const svgNode = document.querySelector("#mapSvg");
    if (!svgNode || !svgNode.children.length) throw new Error(t("status.noMapToExport"));

    const clone = svgNode.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("version", "1.1");
    clone.removeAttribute("style");
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
    style.textContent = getExportCss(outputMode);
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
      projectLocationMode: activeProjectLocationMode,
      getCategoryLabel,
      getCategoryText,
      getCategoryForType
    });
    const csvBody = window.Papa ? Papa.unparse(csvExport.rows, { columns: csvExport.columns }) : unparseCsvRows(csvExport.rows, csvExport.columns);
    const csv = "\ufeff" + csvBody;
    download("custom-map-data.csv", csv, "text/csv;charset=utf-8");
    setStatusMessage(t("status.csvExportStarted"), "ok");
  }

  const projectFormat = "plotypus-project";
  const currentProjectVersion = 9;
  const currentAppVersion = String(appConfig.appVersion || "2026.07.14");

  function validateAndNormalizeProject(rawProject) {
    return projectIo.validateAndNormalizeProject(rawProject, {
      projectFile: window.PlotypusProjectFile,
      projectFormat,
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
      format: projectFormat,
      version: currentProjectVersion,
      generator: { name: "Plotypus", version: currentAppVersion },
      boundary: currentBoundary,
      baselayer,
      mapStyle: currentMapStylePreset,
      mapLanguage: currentMapLanguage,
      projectLocationMode: activeProjectLocationMode,
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
      regionStatuses,
      regionStatusVisibility,
      languageLayouts: serializeLanguageLayouts(),
      manualLabelPositions,
      manualBoxPositions,
      cleanType
    });

    download("custom-map-project.json", JSON.stringify(project, null, 2), "application/json;charset=utf-8");
    setProjectSaveState("saved");
    setStatusMessage(t("status.projectSaveStarted"), "ok");
  }

  function loadProject(file) {
    const reader = new FileReader();
    reader.onload = async function () {
      try {
        const rawProject = projectIo.parseProjectJson(reader.result);
        const project = validateAndNormalizeProject(rawProject);
        emptyBaselayerPreviewEnabled = true;

        if (rawProject.mapDetails && typeof rawProject.mapDetails === "object") {
          Object.keys(mapDetails).forEach(key => { mapDetails[key] = String(rawProject.mapDetails[key] || ""); });
        }
        setAuthoringLanguage(rawProject.authoringLanguage || "en");

        currentBoundary = project.boundary;
        baselayer = normalizeBaselayerState(project.baselayer, currentBoundary);
        baselayerReferenceCitiesController?.setModel(baselayer.referenceCities);
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
        regionStatuses = project.regionStatuses || {};
        regionStatusVisibility = normalizeRegionStatusVisibility(project.regionStatusVisibility);
        restoreLanguageLayouts(project, projectLanguage);
        activeProjectLocationMode = normalizeProjectLocationMode(project.projectLocationMode || deriveProjectLocationModeFromRows(project.rows));
        syncProjectLocationModeUi();
        setRows(project.rows, [], { preserveManualPositions: true, render: false });
        await loadGeo();
        syncAllProjectRegionInputs();
        renderRegionControls();
        requestPreviewRefresh();
        setProjectSaveState("saved");
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
    updateWorkspaceSummary();
    refreshDocumentPropertiesIfActive();
    if (activeDataTable === "quality") {
      refreshQualityMetricsPanel();
      renderPropertiesForActiveState();
    }
  }

  function hasProjectStartupInformation() {
    return getTableRows().length > 0;
  }

  function setStartupScreen(screenName, options = {}) {
    const showSetup = screenName === "setup";
    els.startupStartScreen.hidden = showSetup;
    els.startupSetupForm.hidden = !showSetup;
    els.startupDialog.dataset.startupScreen = showSetup ? "setup" : "start";
    els.startupDialog.setAttribute("aria-labelledby", showSetup ? "startupSetupTitle" : "startupTitle");
    els.startupDialog.setAttribute("aria-describedby", showSetup ? "startupSetupSubtitle" : "startupSubtitle");
    if (options.focus === false) return;
    const focusTarget = showSetup
      ? els.startupBaselayerOptions.find(option => option.dataset.selected === "true")
      : els.startupStartNewBtn;
    focusTarget?.focus({ preventScroll: true });
  }

  function showStartupSetupScreen() {
    startupReferenceCities = referenceCitiesApi.createDefaultModel();
    startupReferenceCitiesController?.setModel(startupReferenceCities);
    syncStartupSetupControls();
    setStartupScreen("setup");
    renderStartupBaselayerThumbnails();
  }

  function showStartupStartScreen() {
    setStartupScreen("start");
  }

  function openStartupDialogIfEmpty() {
    if (startupDialogDismissed || hasProjectStartupInformation()) return;
    setStartupScreen("start", { focus: false });
    openDialog(els.startupDialog, els.previewTableTab);
    els.startupStartNewBtn?.focus({ preventScroll: true });
  }

  function closeStartupDialog() {
    startupDialogDismissed = true;
    closeDialog(els.startupDialog);
    setStartupScreen("start", { focus: false });
  }

  function getDialogByCloseKey(key) {
    if (key === "startup") return els.startupDialog;
    if (key === "feedback") return els.feedbackDialog;
    if (key === "map-details") return els.mapDetailsDialog;
    if (key === "point-catalog") return els.pointCatalogDialog;
    return els.csvMapDialog;
  }

  function closeDialogByKey(key) {
    if (key === "startup") closeStartupDialog();
    else closeDialog(getDialogByCloseKey(key));
  }

  function handleStartupDialogClick(event) {
    if (event.target.closest("[data-startup-back]")) {
      showStartupStartScreen();
      return;
    }
    const baselayerOption = event.target.closest("[data-startup-baselayer]");
    if (baselayerOption) {
      selectStartupBaselayerOption(baselayerOption);
      return;
    }
    const button = event.target.closest("[data-startup-action]");
    if (!button) return;
    const action = button.dataset.startupAction;
    if (action === "new") {
      showStartupSetupScreen();
      return;
    }
    closeStartupDialog();
    if (action === "open") {
      els.projectInput.click();
      return;
    }
    if (action === "sample") {
      loadSampleData();
      return;
    }
    if (action === "csv") {
      setActiveDataTab("projects");
      els.csvInput.click();
    }
  }

  function handleStartupBaselayerKeydown(event) {
    const option = event.currentTarget;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = els.startupBaselayerOptions.indexOf(option);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = els.startupBaselayerOptions.length - 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + els.startupBaselayerOptions.length) % els.startupBaselayerOptions.length;
    else nextIndex = (currentIndex + 1) % els.startupBaselayerOptions.length;
    selectStartupBaselayerOption(els.startupBaselayerOptions[nextIndex], { focus: true });
  }

  async function handleStartupSetupSubmit(event) {
    event.preventDefault();
    const selectedBaselayer = els.startupBaselayerOptions.find(option => option.dataset.selected === "true") || els.startupBaselayerOptions[0];
    const boundary = selectedBaselayer?.dataset.boundary || "canada";
    const regionPreset = selectedBaselayer?.dataset.regionPreset || "all";
    els.startupCreateMapBtn.disabled = true;
    els.startupSetupForm.setAttribute("aria-busy", "true");
    try {
      emptyBaselayerPreviewEnabled = true;
      baselayer.referenceCities = cloneReferenceCities(startupReferenceCities);
      baselayerReferenceCitiesController?.setModel(baselayer.referenceCities);
      applyMapStylePreset(els.startupMapStyleInput.value, { render: false });
      applyImageSizePreset(els.startupBookSizeInput.value, els.startupImageSizeInput.value);
      const defaultMapScale = normalizeMapScale(layoutDefaults.mapScaleInput);
      els.mapScaleInput.value = defaultMapScale;
      ["en", "fr"].forEach(language => {
        languageLayoutStates[language].mapScale = defaultMapScale;
      });
      els.labelCharsInput.value = normalizeLabelMaxChars(els.startupLabelCharsInput.value);
      saveLayoutPreferences();
      await changeBoundary(boundary);
      applyRegionPreset(regionPreset);
      ensureCityRegionsIncluded(baselayer.referenceCities.ids);
      setActiveDataTab("preview");
      setProjectSaveState("dirty");
      els.startupDialog._returnFocus = els.previewTableTab;
      setStatusMessage(t("status.startupNewProject"), "ok");
      closeStartupDialog();
    } finally {
      els.startupCreateMapBtn.disabled = false;
      els.startupSetupForm.removeAttribute("aria-busy");
    }
  }

  function openDialog(dialog, returnFocus) {
    if (!dialog) return;
    dialog._returnFocus = returnFocus || document.activeElement;
    dialog.hidden = false;
    const focusTarget = dialog.querySelector("[data-dialog-initial-focus]")
      || dialog.querySelector("input, textarea, select, button");
    if (focusTarget) focusTarget.focus();
  }

  function closeDialog(dialog) {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    if (dialog === els.feedbackDialog) els.feedbackBtn?.setAttribute("aria-expanded", "false");
    if (dialog._returnFocus && typeof dialog._returnFocus.focus === "function") dialog._returnFocus.focus();
  }

  function initializeFeedbackComposer() {
    feedbackComposer = feedback.createFeedbackComposer({
      form: els.feedbackForm,
      typeInputs: els.feedbackTypeInputs,
      titleInput: els.feedbackTitle,
      detailsInput: els.feedbackDetails,
      detailsLabel: els.feedbackDetailsLabel,
      githubIssueLink: els.githubIssueLink,
      feedbackEmailLink: els.feedbackEmailLink
    }, {
      appVersion: currentAppVersion,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: window.navigator.userAgent,
      browserLanguage: window.navigator.language
    }, { t });
  }

  function openFeedbackDialog() {
    feedbackComposer?.update();
    els.feedbackBtn?.setAttribute("aria-expanded", "true");
    openDialog(els.feedbackDialog, els.feedbackBtn);
  }

  function setDynamicDialogTranslation(node, key, params = {}) {
    if (!node) return;
    node.dataset.i18n = key;
    if (Object.keys(params).length) node.dataset.i18nParams = JSON.stringify(params);
    else delete node.dataset.i18nParams;
    node.textContent = t(key, params);
  }

  function getConfirmationCopy(confirmation = pendingConfirmation) {
    if (!confirmation) return null;
    const deleting = confirmation.kind === "delete";
    const label = confirmation.count === 1
      ? t(deleting ? "status.selectedRowSingular" : "status.projectRowSingular")
      : t(deleting ? "status.selectedRowPlural" : "status.projectRowPlural");
    return {
      titleKey: deleting ? "dialog.confirm.deleteTitle" : "dialog.confirm.clearTitle",
      actionKey: deleting ? "dialog.confirm.deleteAction" : "dialog.confirm.clearAction",
      messageKey: deleting ? "status.deleteSelectedRowsConfirm" : "status.clearProjectRowsConfirm",
      messageParams: { count: confirmation.count, label }
    };
  }

  function renderConfirmationDialog() {
    const copy = getConfirmationCopy();
    if (!copy) return;
    setDynamicDialogTranslation(els.confirmationTitle, copy.titleKey);
    setDynamicDialogTranslation(els.confirmationMessage, copy.messageKey, copy.messageParams);
    setDynamicDialogTranslation(els.confirmationConfirmBtn, copy.actionKey);
  }

  function openConfirmationDialog(options = {}) {
    if (!els.confirmationDialog) {
      if (typeof options.onConfirm === "function") options.onConfirm();
      return;
    }
    pendingConfirmation = {
      kind: options.kind === "delete" ? "delete" : "clear",
      count: Number(options.count) || 0,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel
    };
    renderConfirmationDialog();
    openDialog(els.confirmationDialog, options.returnFocus);
    els.confirmationConfirmBtn?.focus({ preventScroll: true });
  }

  function resolveConfirmationDialog(confirmed) {
    if (!pendingConfirmation) return;
    const confirmation = pendingConfirmation;
    pendingConfirmation = null;
    closeDialog(els.confirmationDialog);
    const callback = confirmed ? confirmation.onConfirm : confirmation.onCancel;
    if (typeof callback === "function") callback();
  }

  function openMapDetailsDialog() {
    els.mapTitleEnInput.value = mapDetails.titleEn;
    els.mapTitleFrInput.value = mapDetails.titleFr;
    els.mapTextEnInput.value = mapDetails.textEn;
    els.mapTextFrInput.value = mapDetails.textFr;
    els.mapDetailsDialog._undoSnapshot = createAppUndoSnapshot("map details edit");
    openDialog(els.mapDetailsDialog);
    els.mapTitleEnInput.focus();
  }

  function saveMapDetails(event) {
    event.preventDefault();
    pushAppUndoSnapshot(els.mapDetailsDialog._undoSnapshot || createAppUndoSnapshot("map details edit"));
    els.mapDetailsDialog._undoSnapshot = null;
    mapDetails.titleEn = els.mapTitleEnInput.value.trim();
    mapDetails.titleFr = els.mapTitleFrInput.value.trim();
    mapDetails.textEn = els.mapTextEnInput.value.trim();
    mapDetails.textFr = els.mapTextFrInput.value.trim();
    document.title = mapDetails[currentMapLanguage === "fr" ? "titleFr" : "titleEn"] || "Plotypus";
    closeDialog(els.mapDetailsDialog);
    updateMapDetailsState();
    setStatusMessage(t("status.saved.mapDetails"), "ok");
  }

  function addSelectedProjectCities() {
    if (!cityIntegration || !pendingProjectCities.ids.length) return;
    const selectedCities = pendingProjectCities.ids.map(getIndexedCityById).filter(Boolean);
    const importResult = cityIntegration.buildProjectCityImport(selectedCities, {
      regionRows: getRegionRows(),
      findContainingRegion: getRegionIdForPoint,
      type: getDefaultCategory().id
    });
    if (!importResult.rows.length) {
      setStatusMessage(t("status.projectCitiesNoNewRows"), "warning");
      return;
    }

    pushAppUndoHistory("add project cities");
    setProjectLocationMode("cities", { pushUndo: false, render: false, status: false });
    importResult.regionIds.forEach(regionId => {
      regionVisibility[regionId] = true;
    });
    setRows(getRows().concat(importResult.rows), [], { render: false });
    if (canadaGeo && Array.isArray(canadaGeo.features)) applyRegionColoursByValue(false);
    pendingProjectCities = referenceCitiesApi.createDefaultModel();
    projectCitiesController?.setModel(pendingProjectCities);
    closeDialog(els.pointCatalogDialog);
    setActiveDataTab("projects");
    requestPreviewRefresh();

    const regionNames = importResult.regionIds.map(getRegionNameById).filter(Boolean).join(", ");
    const statusKey = importResult.unresolvedRegionIds.length
      ? "status.projectCitiesAddedWithRegionIssues"
      : regionNames
        ? "status.projectCitiesAddedWithRegions"
        : "status.projectCitiesAdded";
    setStatusMessage(t(statusKey, {
      count: importResult.rows.length,
      regions: regionNames,
      unresolved: importResult.unresolvedRegionIds.length
    }), importResult.unresolvedRegionIds.length ? "warning" : "ok");
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
      els.pointCatalogScope.textContent = t("dialog.pointCatalog.scope", { count: indexedReferenceCities.length });
    }
    pendingProjectCities = referenceCitiesApi.createDefaultModel();
    mountProjectCitiesField();
    if (els.catalogAddPointsBtn) els.catalogAddPointsBtn.disabled = true;
    setPointCatalogView("presets");
    openDialog(els.pointCatalogDialog, trigger);
    els.projectCitiesField?.querySelector(".refCityInput")?.focus({ preventScroll: true });
  }

  const csvMapTargets = [
    { key: "name", labelKey: "dialog.csv.field.name", required: true },
    { key: "nameFr", labelKey: "dialog.csv.field.nameFr", required: false },
    { key: "type", labelKey: "dialog.csv.field.type", required: false },
    { key: "typeFr", labelKey: "dialog.csv.field.typeFr", required: false },
    { key: "lon", labelKey: "dialog.csv.field.lon", required: false },
    { key: "lat", labelKey: "dialog.csv.field.lat", required: false }
  ];
  const regionCsvMapTargets = [
    { key: "name", labelKey: "dialog.csv.field.name", required: true },
    { key: "nameFr", labelKey: "dialog.csv.field.nameFr", required: false },
    { key: "type", labelKey: "dialog.csv.field.type", required: true },
    { key: "typeFr", labelKey: "dialog.csv.field.typeFr", required: false },
    { key: "region", labelKey: "dialog.csv.field.region", required: true }
  ];
  const cityCsvMapTargets = [
    { key: "name", labelKey: "dialog.csv.field.name", required: true },
    { key: "nameFr", labelKey: "dialog.csv.field.nameFr", required: false },
    { key: "type", labelKey: "dialog.csv.field.type", required: false },
    { key: "typeFr", labelKey: "dialog.csv.field.typeFr", required: false },
    { key: "city", labelKey: "dialog.csv.field.city", required: true }
  ];

  const translationCsvMapTargets = [
    { key: "name", labelKey: "dialog.csv.field.translationName", required: true },
    { key: "nameFr", labelKey: "dialog.csv.field.translationNameFr", required: true },
    { key: "rowId", labelKey: "dialog.csv.field.translationRowId", required: false }
  ];

  function getCsvMappingMode() {
    return pendingCsvMapping && pendingCsvMapping.mode === "translations" ? "translations" : "projects";
  }

  function getCsvImportLocationMode() {
    return normalizeProjectLocationMode(pendingCsvMapping && pendingCsvMapping.locationMode || activeProjectLocationMode);
  }

  function getCsvMappingTargets(mode = getCsvMappingMode(), locationMode = getCsvImportLocationMode()) {
    if (mode === "translations") return translationCsvMapTargets;
    if (isCityLocationMode(locationMode)) return cityCsvMapTargets;
    return isRegionLocationMode(locationMode) ? regionCsvMapTargets : csvMapTargets;
  }

  function getCsvMappingStorageKey(mode = getCsvMappingMode(), locationMode = getCsvImportLocationMode()) {
    if (mode === "translations") return "plotypus.translationCsvMapping";
    if (isCityLocationMode(locationMode)) return "plotypus.cityCsvMapping";
    return isRegionLocationMode(locationMode) ? "plotypus.regionCsvMapping" : "plotypus.csvMapping";
  }

  function ensureCsvMappingsForLocationMode(locationMode) {
    if (!pendingCsvMapping || getCsvMappingMode() === "translations") return;
    const targets = getCsvMappingTargets("projects", locationMode);
    const fields = pendingCsvMapping.fields || [];
    const savedMapping = projectIo.getSavedJson(localStorage, getCsvMappingStorageKey("projects", locationMode));
    targets.forEach(target => {
      const current = pendingCsvMapping.mapping[target.key];
      if (current && fields.includes(current)) return;
      const saved = savedMapping && savedMapping[target.key];
      pendingCsvMapping.mapping[target.key] = saved && fields.includes(saved)
        ? saved
        : findCsvSourceForTarget(fields, target.key);
    });
  }

  function setCsvImportLocationMode(locationMode) {
    if (!pendingCsvMapping || getCsvMappingMode() === "translations") return;
    const nextMode = normalizeProjectLocationMode(locationMode);
    pendingCsvMapping.locationMode = nextMode;
    ensureCsvMappingsForLocationMode(nextMode);
    renderCsvMappingDialog();
  }

  function findCsvSourceForTarget(fields, target) {
    const aliases = csvColumnAliases[target] || [target];
    const normalizedAliases = aliases.map(normalizeHeader);
    return fields.find(field => normalizedAliases.includes(normalizeHeader(field))) || "";
  }

  function findTranslationCsvSourceForTarget(fields, target) {
    const aliases = translationColumnAliases[target] || csvColumnAliases[target] || [target];
    const normalizedAliases = aliases.map(normalizeHeader);
    return fields.find(field => normalizedAliases.includes(normalizeHeader(field))) || "";
  }

  function createCsvRichLabelState() {
    return {
      enabled: false,
      nextId: 2,
      elements: [{ id: 1, type: "text", template: "", numberFormat: "full" }]
    };
  }

  function getCsvRichLabelState() {
    return pendingCsvMapping && pendingCsvMapping.richLabel || null;
  }

  function renderCsvRichLabelPreview() {
    const state = getCsvRichLabelState();
    if (!state || !els.csvRichLabelPreview || !els.csvRichLabelSources) return;
    const sourceRow = pendingCsvMapping.data && pendingCsvMapping.data[0] || {};
    const titleSource = pendingCsvMapping.mapping && pendingCsvMapping.mapping.name || "";
    const titleValue = titleSource ? String(sourceRow[titleSource] || "") : "";
    const blocks = state.elements
      .filter(element => String(element.template || "").trim())
      .map(element => projectIo.createRichLabelContentBlock(element, sourceRow));
    const titlePreview = titleValue
      ? `<div class="rich-label-preview-line" data-element-type="title">${escapeHtml(titleValue)}</div>`
      : "";
    const contentPreview = blocks.length
      ? blocks.map(block => {
        const value = block.value && (currentUiLanguage === "fr" ? block.value.fr || block.value.en : block.value.en || block.value.fr) || "";
        return `<div class="rich-label-preview-line" data-element-type="${escapeHtml(block.type)}">${block.type === "bullet" ? "• " : ""}${escapeHtml(value || "…")}</div>`;
      }).join("")
      : `<span class="properties-muted">${escapeHtml(t("dialog.csv.composer.emptyPreview"))}</span>`;
    els.csvRichLabelPreview.innerHTML = titlePreview + contentPreview;
    const usedSources = [];
    const seen = new Set();
    if (titleSource) {
      seen.add(titleSource);
      usedSources.push(titleSource);
    }
    state.elements.forEach(element => {
      projectIo.getRichLabelTemplateSources(element.template).forEach(source => {
        if (!seen.has(source)) {
          seen.add(source);
          usedSources.push(source);
        }
      });
    });
    els.csvRichLabelSources.innerHTML = usedSources.length
      ? `<strong>${escapeHtml(t("dialog.csv.composer.resolvedFrom"))}</strong><br>${usedSources.map(source => `${escapeHtml(source)} → “${escapeHtml(sourceRow[source] ?? "")}”`).join("<br>")}`
      : "";
  }

  function renderCsvRichLabelComposer(translationMode = false) {
    if (!els.importComposerPanel) return;
    els.importComposerPanel.hidden = translationMode;
    if (translationMode) return;
    const state = getCsvRichLabelState();
    if (!state) return;
    if (els.csvRichLabelEnabled) els.csvRichLabelEnabled.checked = Boolean(state.enabled);
    if (els.csvRichLabelComposer) els.csvRichLabelComposer.hidden = !state.enabled;
    if (!els.csvLabelElements) return;
    const fields = pendingCsvMapping.fields || [];
    els.csvLabelElements.innerHTML = state.elements.map((element, index) => `
      <div class="labelElementCard label-element-card" data-label-element-id="${element.id}">
        <div class="label-element-card-header">
          <select class="elementTypeSelect" data-label-element-field="type" aria-label="${escapeHtml(t("dialog.csv.composer.type"))}">
            <option value="text"${element.type === "text" ? " selected" : ""}>${escapeHtml(t("dialog.csv.composer.text"))}</option>
            <option value="bullet"${element.type === "bullet" ? " selected" : ""}>${escapeHtml(t("dialog.csv.composer.bullet"))}</option>
          </select>
          <select data-label-element-field="numberFormat" aria-label="${escapeHtml(t("dialog.csv.composer.numberFormat"))}">
            <option value="full"${element.numberFormat === "full" ? " selected" : ""}>${escapeHtml(t("dialog.csv.composer.full"))}</option>
            <option value="abbrev"${element.numberFormat === "abbrev" ? " selected" : ""}>${escapeHtml(t("dialog.csv.composer.abbrev"))}</option>
            <option value="raw"${element.numberFormat === "raw" ? " selected" : ""}>${escapeHtml(t("dialog.csv.composer.raw"))}</option>
          </select>
          <div class="label-element-actions">
            <button type="button" data-label-element-action="up"${index === 0 ? " disabled" : ""} aria-label="${escapeHtml(t("dialog.csv.composer.moveUp"))}" title="${escapeHtml(t("dialog.csv.composer.moveUp"))}">↑</button>
            <button type="button" data-label-element-action="down"${index >= state.elements.length - 1 ? " disabled" : ""} aria-label="${escapeHtml(t("dialog.csv.composer.moveDown"))}" title="${escapeHtml(t("dialog.csv.composer.moveDown"))}">↓</button>
            <button type="button" data-label-element-action="remove" aria-label="${escapeHtml(t("dialog.csv.composer.remove"))}" title="${escapeHtml(t("dialog.csv.composer.remove"))}">×</button>
          </div>
        </div>
        <label class="label-element-template">${escapeHtml(t("dialog.csv.composer.template"))}
          <input class="elementTemplateInput" data-label-element-field="template" type="text" value="${escapeHtml(element.template || "")}">
        </label>
        <div class="label-token-list" aria-label="${escapeHtml(t("dialog.csv.composer.insert"))}">
          ${fields.map(field => `<button type="button" class="tokenChip token-chip" data-label-token="${escapeHtml(field)}">+ ${escapeHtml(field)}</button>`).join("")}
        </div>
      </div>`).join("");
    renderCsvRichLabelPreview();
  }

  function renderCsvMappingDialog() {
    if (!pendingCsvMapping || !els.csvMapRows) return;
    const { fields, data } = pendingCsvMapping;
    const mode = getCsvMappingMode();
    const targets = getCsvMappingTargets(mode);
    const translationMode = mode === "translations";
    const locationMode = getCsvImportLocationMode();
    if (els.csvLocationModeSection) els.csvLocationModeSection.hidden = translationMode;
    els.csvLocationModeButtons.forEach(button => {
      const active = normalizeProjectLocationMode(button.dataset.csvLocationMode) === locationMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (els.csvLocationModeHint && !translationMode) {
      els.csvLocationModeHint.textContent = t(isRegionLocationMode(locationMode)
        ? "dialog.csv.locationMode.regionsHint"
        : isCityLocationMode(locationMode)
          ? "dialog.csv.locationMode.citiesHint"
          : "dialog.csv.locationMode.coordinatesHint");
    }
    if (els.csvMapTitle) els.csvMapTitle.textContent = t(translationMode ? "dialog.csv.translationTitle" : "dialog.csv.title");
    if (els.csvMapGuidance) els.csvMapGuidance.textContent = t(translationMode ? "dialog.csv.translationGuidance" : "dialog.csv.guidance");
    if (els.csvMapRequired) els.csvMapRequired.textContent = t(translationMode ? "dialog.csv.translationRequired" : "dialog.csv.required");
    if (els.confirmCsvMapBtn) els.confirmCsvMapBtn.textContent = t(translationMode ? "dialog.csv.importTranslations" : "dialog.csv.importRows");
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
    const firstRequiredKey = (targets.find(target => target.required) || targets[0] || {}).key;
    els.csvMapRows.innerHTML = targets.map(target => {
      const selected = pendingCsvMapping.mapping[target.key] || "";
      const sample = selected && data[0] ? data[0][selected] : "";
      const label = t(target.labelKey);
      return `<div class="csv-map-row" data-csv-target="${target.key}">
        <div class="csv-map-source"><strong>${escapeHtml(label)}</strong><span class="field-requirement ${target.required ? "is-required" : "is-optional"}">${escapeHtml(target.required ? t("dialog.csv.requiredTag") : t("dialog.csv.optionalTag"))}</span></div>
        <select aria-label="${escapeHtml(t("dialog.csv.columnFor", { label }))}"${target.key === firstRequiredKey ? " data-dialog-initial-focus" : ""}><option value="">${escapeHtml(t("dialog.csv.notMapped"))}</option>${fields.map(field => `<option value="${escapeHtml(field)}"${field === selected ? " selected" : ""}>${escapeHtml(field)}</option>`).join("")}</select>
        <span class="csv-map-sample" title="${escapeHtml(String(sample || ""))}">${escapeHtml(String(sample || t("dialog.csv.noSample")))}</span>
      </div>`;
    }).join("");
    renderCsvRichLabelComposer(translationMode);
    const missingRequired = targets.some(target => target.required && !pendingCsvMapping.mapping[target.key]);
    const richState = getCsvRichLabelState();
    const missingRichLabel = !translationMode && richState && richState.enabled && !richState.elements.some(element => String(element.template || "").trim());
    if (els.confirmCsvMapBtn) els.confirmCsvMapBtn.disabled = missingRequired || missingRichLabel;
  }

  function openCsvMapping(results, file, options = {}) {
    const mode = options.mode === "translations" ? "translations" : "projects";
    const locationMode = normalizeProjectLocationMode(activeProjectLocationMode);
    const targets = getCsvMappingTargets(mode, locationMode);
    const preset = projectIo.getSavedJson(localStorage, getCsvMappingStorageKey(mode, locationMode));
    pendingCsvMapping = {
      ...projectIo.createCsvMappingState({
        results,
        file,
        targets,
        savedMapping: preset,
        findSourceForTarget: mode === "translations" ? findTranslationCsvSourceForTarget : findCsvSourceForTarget,
        defaultFileName: t(mode === "translations" ? "dialog.csv.selectedTranslationFile" : "dialog.csv.selectedCsv")
      }),
      sourceRows: options.sourceRows || null,
      mode,
      locationMode,
      trigger: options.trigger || (mode === "translations" ? els.importTranslationsBtn : els.ribbonImportCsvBtn)
    };
    pendingCsvMapping.richLabel = createCsvRichLabelState();
    renderCsvMappingDialog();
    if (options.open !== false) {
      openDialog(els.csvMapDialog, pendingCsvMapping.trigger);
      const firstMapping = els.csvMapRows.querySelector("[data-dialog-initial-focus]");
      if (firstMapping) firstMapping.focus();
    }
  }

  function parseCsvForMapping(file, firstRowHeaders = true, options = {}) {
    if (!window.Papa) return;
    Papa.parse(file, {
      worker: typeof window.Worker === "function"
        && window.location.protocol !== "file:"
        && Number(file && file.size) >= 256 * 1024,
      header: firstRowHeaders,
      skipEmptyLines: true,
      delimitersToGuess: [",", "\t", "|", ";"],
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
      error: err => setStatusMessage(t("status.csvGenericFailed", { message: getCsvParserErrorMessage(err) }), "danger")
    });
  }

  function isExcelWorkbookFile(file) {
    if (window.PlotypusXlsx) return window.PlotypusXlsx.isWorkbookFile(file);
    const name = String(file && file.name || "").toLowerCase();
    const type = String(file && file.type || "").toLowerCase();
    return name.endsWith(".xlsx") || type.includes("spreadsheetml.sheet");
  }

  function uniqueTabularFields(values) {
    const counts = new Map();
    return values.map((value, index) => {
      const base = String(value || "").trim() || t("dialog.csv.columnNumber", { number: index + 1 });
      const count = counts.get(base) || 0;
      counts.set(base, count + 1);
      return count ? `${base}_${count + 1}` : base;
    });
  }

  function openTabularRowsForMapping(rows, file, firstRowHeaders = true, options = {}) {
    const arrays = Array.isArray(rows) ? rows.filter(row => Array.isArray(row) && row.some(value => String(value || "").trim())) : [];
    if (!arrays.length) throw new Error(t("status.excelNoRows"));
    const width = arrays.reduce((maximum, row) => Math.max(maximum, row.length), 0);
    const fields = firstRowHeaders
      ? uniqueTabularFields(Array.from({ length: width }, (_, index) => arrays[0][index] || ""))
      : Array.from({ length: width }, (_, index) => t("dialog.csv.columnNumber", { number: index + 1 }));
    const sourceRows = firstRowHeaders ? arrays.slice(1) : arrays;
    const data = sourceRows.map(row => Object.fromEntries(fields.map((field, index) => [field, row[index] || ""])));
    openCsvMapping({ data, errors: [], meta: { fields } }, file, { ...options, sourceRows: arrays });
  }

  async function readExcelWorkbookRows(file) {
    if (!window.PlotypusXlsx) await loadDeferredScript("xlsx-lite.js?v=20260722-performance");
    if (!window.PlotypusXlsx) throw new Error(t("status.excelInvalidWorkbook"));
    return window.PlotypusXlsx.readWorkbookRows(file, {
      invalidWorkbook: t("status.excelInvalidWorkbook"),
      unsupportedCompression: t("status.excelUnsupportedCompression")
    });
  }
  function normalizeTranslationMatch(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function normalizeTranslationRowId(value) {
    return String(value || "").trim().replace(/^project:/i, "");
  }

  function importProjectTranslations(data) {
    const rows = getRows();
    const byId = new Map(rows.map(row => [String(row.rowId), row]));
    const usedRowIds = new Set();
    const updates = [];
    let skipped = 0;

    (data || []).forEach(rawRow => {
      const french = String(rawRow.nameFr || "").trim();
      const rowId = normalizeTranslationRowId(rawRow.rowId);
      const source = normalizeTranslationMatch(rawRow.name);
      let row = rowId ? byId.get(rowId) : null;
      if (!row && source) {
        row = rows.find(candidate => !usedRowIds.has(String(candidate.rowId)) && normalizeTranslationMatch(candidate.name) === source);
      }
      if (!french || !row) {
        skipped += 1;
        return;
      }
      usedRowIds.add(String(row.rowId));
      updates.push({ rowId: row.rowId, french });
    });

    if (!updates.length) return { updated: 0, skipped };
    pushAppUndoHistory("translation import");
    updates.forEach(update => updateProjectRowField(update.rowId, "nameFr", update.french));
    refreshProjectTableUx();
    renderTranslationWorkbench();
    renderPropertiesForActiveState(activePropertiesSelection || { kind: "translation" });
    updateWorkspaceSummary();
    updateExportLanguageNotice();
    requestPreviewRefresh(translationPreviewRenderOptions());
    return { updated: updates.length, skipped };
  }

  function confirmTranslationCsvMapping(targets) {
    const mappingToSave = { ...pendingCsvMapping.mapping };
    const data = projectIo.mapCsvRowsForImport(pendingCsvMapping, targets);
    if (els.csvSavePresetInput && els.csvSavePresetInput.checked) {
      projectIo.saveJson(localStorage, getCsvMappingStorageKey("translations"), mappingToSave);
    }
    pendingCsvMapping = null;
    closeDialog(els.csvMapDialog);
    const result = importProjectTranslations(data);
    setActiveDataTab("translate");
    if (result.updated) {
      setStatusMessage(result.skipped
        ? t("status.translationImportResultSkipped", { count: result.updated, skipped: result.skipped })
        : t("status.translationImportResult", { count: result.updated }),
        result.skipped ? "warning" : "ok");
    } else {
      setStatusMessage(t("status.translationImportNoMatches"), "warning");
    }
  }

  function confirmCsvMapping() {
    if (!pendingCsvMapping) return;
    const mode = getCsvMappingMode();
    const targets = getCsvMappingTargets(mode);
    const importLocationMode = getCsvImportLocationMode();
    const missing = projectIo.getMissingCsvTargets(pendingCsvMapping.mapping, targets);
    if (missing.length) {
      setStatusMessage(t("status.csvRequiredFields", { fields: missing.map(item => t(item.labelKey)).join(", ") }), "danger");
      return;
    }
    if (mode === "translations") {
      confirmTranslationCsvMapping(targets);
      return;
    }
    const mappingToSave = { ...pendingCsvMapping.mapping };
    let data = projectIo.mapCsvRowsForImport(pendingCsvMapping, targets);
    const richLabelState = getCsvRichLabelState();
    if (richLabelState && richLabelState.enabled) {
      data = projectIo.composeRichLabelRows(data, pendingCsvMapping.data, richLabelState.elements);
    }
    const fields = projectIo.getMappedCsvFields(pendingCsvMapping.mapping, targets);
    const report = validateCsvImport(
      { data, errors: pendingCsvMapping.errors, meta: { fields } },
      { locationMode: importLocationMode }
    );
    if (els.csvSavePresetInput && els.csvSavePresetInput.checked) {
      projectIo.saveJson(localStorage, getCsvMappingStorageKey("projects", importLocationMode), mappingToSave);
    }
    pushAppUndoHistory("CSV import");
    setProjectLocationMode(importLocationMode, { pushUndo: false, render: false, status: false });
    if (isCityLocationMode(importLocationMode)) {
      report.rows.forEach(row => {
        if (row && row.region) regionVisibility[row.region] = true;
      });
    }
    pendingCsvMapping = null;
    closeDialog(els.csvMapDialog);
    setRows(report.rows, report.messages);
    setActiveDataTab("projects");
  }

  async function importTranslationFile(file) {
    try {
      if (els.csvFirstRowHeadersInput) els.csvFirstRowHeadersInput.checked = true;
      const options = { mode: "translations", trigger: els.importTranslationsBtn };
      if (isExcelWorkbookFile(file)) {
        openTabularRowsForMapping(await readExcelWorkbookRows(file), file, true, options);
        return;
      }
      if (!window.Papa) {
        setStatusMessage(t("status.csvReadFailed"), "danger");
        return;
      }
      parseCsvForMapping(file, true, options);
    } catch (error) {
      setStatusMessage(t("status.csvGenericFailed", { message: translateErrorMessage(error) }), "danger");
    }
  }

  async function importCsv(file) {
    if (isExcelWorkbookFile(file)) {
      try {
        if (els.csvFirstRowHeadersInput) els.csvFirstRowHeadersInput.checked = true;
        openTabularRowsForMapping(await readExcelWorkbookRows(file), file, true);
      } catch (error) {
        setStatusMessage(t("status.csvGenericFailed", { message: translateErrorMessage(error) }), "danger");
      }
      return;
    }
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

  function validateCsvImport(results, options = {}) {
    const messages = [];
    const locationMode = normalizeProjectLocationMode(options.locationMode || activeProjectLocationMode);
    const sourceFields = results.meta && results.meta.fields ? results.meta.fields.filter(Boolean) : [];
    const fields = sourceFields.map(normalizeHeader);
    const hasColumn = aliases => aliases.some(alias => fields.includes(alias));

    if (!hasColumn(csvColumnAliases.name)) messages.push(t("status.csvMissingNameColumn"));
    if (!hasColumn(csvColumnAliases.type)) messages.push(t("status.csvMissingTypeColumn", { category: getCategoryLabel(getDefaultCategory().id, currentUiLanguage) }));
    if (isCityLocationMode(locationMode)) {
      if (!hasColumn(csvColumnAliases.city)) messages.push(t("status.csvMissingCityColumn"));
    } else if (isRegionLocationMode(locationMode)) {
      if (!hasColumn(csvColumnAliases.region)) messages.push(t("status.csvMissingRegionColumn"));
    } else {
      if (!hasColumn(csvColumnAliases.lon)) messages.push(t("status.csvMissingLongitudeColumn"));
      if (!hasColumn(csvColumnAliases.lat)) messages.push(t("status.csvMissingLatitudeColumn"));
    }

    (results.errors || []).forEach(error => {
      const rowNumber = Number.isFinite(error.row) ? error.row + 2 : t("status.csvUnknownRow");
      messages.push(t("status.csvRowError", { row: rowNumber, message: getCsvParserErrorMessage(error) }));
    });

    const rows = [];
    (results.data || []).forEach((rawRow, index) => {
      if (rawRow.__parsed_extra && rawRow.__parsed_extra.length) {
        messages.push(t("status.csvRowExtraValues", { row: index + 2 }));
      }

      const row = normalizeImportedProjectRow(rawRow, index, messages, locationMode);
      const hasLon = row.lon !== "";
      const hasLat = row.lat !== "";
      const hasRegion = row.anchor === "region" && row.region;
      const hasCity = row.anchor === "city" && row.cityId;
      if (!row.name && !hasLon && !hasLat && !hasRegion && !hasCity) return;
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
      closeProjectToolbarMenus();
      loadSampleData();
    });
    on(els.ribbonUndoBtn, "click", undoLastManualLayoutChange);
    on(els.ribbonOpenProjectBtn, "click", () => els.projectInput.click());
    on(els.ribbonSaveProjectBtn, "click", saveProject);
    on(els.ribbonImportCsvBtn, "click", () => {
      closeProjectToolbarMenus();
      els.csvInput.click();
    });
    on(els.ribbonExportCsvBtn, "click", () => {
      setExportMenuOpen(false);
      exportCsv();
    });
    on(els.exportMenuBtn, "click", () => setExportMenuOpen(els.exportMenu.hidden));
    on(els.exportMenuBtn, "keydown", handleExportMenuKeydown);
    on(els.exportMenu, "keydown", handleExportMenuKeydown);
    on(els.feedbackBtn, "click", openFeedbackDialog);
    on(els.feedbackForm, "submit", event => event.preventDefault());
    on(els.applicationSettingsBtn, "click", () => setApplicationSettingsOpen(els.applicationSettingsMenu.hidden, { focusFirst: true }));
    on(els.applicationSettingsBtn, "keydown", handleApplicationSettingsKeydown);
    on(els.applicationSettingsCloseBtn, "click", () => setApplicationSettingsOpen(false, { restoreFocus: true }));
    on(els.ribbonExportSvgBtn, "click", () => {
      setExportMenuOpen(false);
      exportSvg();
    });
    on(els.ribbonExportPngBtn, "click", () => {
      setExportMenuOpen(false);
      exportPng();
    });
    on(els.previewEmptyState, "click", handlePreviewStateAction);
    on(els.canvasEmptyActions, "click", handlePreviewStateAction);
    on(els.previewErrorState, "click", handlePreviewStateAction);
    on(els.projectTableEmptyState, "click", handleEmptyStateAction);
    on(els.canvasZoomOutBtn, "click", () => adjustCanvasZoom(-1));
    on(els.canvasZoomInBtn, "click", () => adjustCanvasZoom(1));
    on(els.canvasAutoPlaceBtn, "click", autoPlaceLabels);
    on(els.canvasPlaceLabelsOnlyBtn, "click", autoPlaceLabelsWithoutResize);
    on(els.closeShortcutsBtn, "click", closeShortcutsOverlay);
    on(els.shortcutsOverlay, "click", event => {
      if (event.target === els.shortcutsOverlay) closeShortcutsOverlay();
    });
    on(els.addProjectTypeBtn, "click", () => {
      closeProjectToolbarMenus();
      if (propertiesDrawerMedia.matches) setPropertiesDrawerOpen(true);
      else setPropertiesCollapsed(false);
      addCategory();
      setStatusMessage(t("status.projectTypeAdded", { label: getCategoryLabel(activeCategoryId, currentUiLanguage) }), "ok");
    });
    on(els.addRowBtn, "click", () => {
      closeProjectToolbarMenus();
      pushAppUndoHistory("add project row");
      setProjectFilter("all");
      const tr = addRow();
      tr.classList.add("is-new");
      tr.scrollIntoView({ block: "nearest", behavior: "smooth" });
      tr.querySelector(".name-input").focus();
      window.setTimeout(() => tr.classList.remove("is-new"), 120);
    });
    on(els.addPointsBtn, "click", () => {
      closeProjectToolbarMenus();
      showPointCatalog({ currentTarget: els.projectAddMenuBtn });
    });
    getProjectToolbarMenus().forEach(({ button, menu }) => {
      on(button, "click", () => setProjectToolbarMenuOpen(button, menu, menu.hidden));
      on(button, "keydown", handleProjectToolbarMenuKeydown);
      on(menu, "keydown", handleProjectToolbarMenuKeydown);
    });
    on(window, "resize", () => {
      getProjectToolbarMenus().forEach(({ button, menu }) => {
        if (!menu.hidden) positionProjectToolbarMenu(button, menu);
      });
      if (canvasResizeFrame) window.cancelAnimationFrame(canvasResizeFrame);
      canvasResizeFrame = window.requestAnimationFrame(() => {
        canvasResizeFrame = 0;
        updateCanvasToolbar();
      });
    });
    document.querySelectorAll("[data-authoring-language]").forEach(button => {
      on(button, "click", () => setAuthoringLanguage(button.dataset.authoringLanguage));
    });
    on(els.clearRowsBtn, "click", () => {
      closeProjectToolbarMenus();
      confirmClearProjectRows();
    });
    on(els.deleteSelectedBtn, "click", () => {
      const selectedRows = getProjectRowsSelectedForDelete();
      if (!selectedRows.length) {
        setStatusMessage(t("status.selectRowsBeforeDelete"), "warning");
        return;
      }

      openConfirmationDialog({
        kind: "delete",
        count: selectedRows.length,
        returnFocus: els.deleteSelectedBtn,
        onCancel: () => setStatusMessage(t("status.deleteCancelled"), "warning"),
        onConfirm: () => {
          pushAppUndoHistory("delete project rows");
          selectedRows.forEach(tr => tr.classList.add("is-deleting"));
          els.deleteSelectedBtn.disabled = true;
          window.setTimeout(() => {
            selectedRows.forEach(tr => {
              const rowId = String(tr.dataset.rowId || "");
              projectRowCityControllers.get(rowId)?.destroy();
              projectRowCityControllers.delete(rowId);
              tr.remove();
            });
            clearProjectCellSelection();
            updateDeleteButtonState();
            refreshProjectTableUx();
            requestPreviewRefresh();
          }, 260);
        }
      });
    });
    on(els.projectTableTab, "click", () => setActiveDataTab("projects"));
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
    on(els.propertiesToggleBtn, "click", togglePropertiesPanel);
    on(els.propertiesCollapseBtn, "click", togglePropertiesPanel);
    on(els.propertiesResizeHandle, "pointerdown", handlePropertiesResizeStart);
    on(els.propertiesResizeHandle, "keydown", handlePropertiesResizeKeydown);
    els.propertiesSideInputs.forEach(input => {
      on(input, "change", event => {
        if (event.target.checked) setPropertiesPanelSide(event.target.value);
      });
    });
    if (typeof propertiesDrawerMedia.addEventListener === "function") {
      propertiesDrawerMedia.addEventListener("change", syncResponsivePropertiesState);
    } else {
      propertiesDrawerMedia.addListener(syncResponsivePropertiesState);
    }
    on(els.startupDialog, "click", handleStartupDialogClick);
    on(els.startupSetupForm, "submit", handleStartupSetupSubmit);
    on(els.startupBookSizeInput, "change", () => renderStartupImageSizeOptions());
    els.startupBaselayerOptions.forEach(option => on(option, "keydown", handleStartupBaselayerKeydown));
    on(els.mapDetailsForm, "submit", saveMapDetails);
    on(els.confirmCsvMapBtn, "click", confirmCsvMapping);
    els.csvLocationModeButtons.forEach(button => {
      on(button, "click", () => setCsvImportLocationMode(button.dataset.csvLocationMode));
    });
    on(els.csvRichLabelEnabled, "change", event => {
      const state = getCsvRichLabelState();
      if (!state) return;
      state.enabled = event.target.checked;
      renderCsvMappingDialog();
    });
    on(els.csvAddLabelElementBtn, "click", () => {
      const state = getCsvRichLabelState();
      if (!state) return;
      state.elements.push({ id: state.nextId++, type: "text", template: "", numberFormat: "full" });
      renderCsvMappingDialog();
      const card = els.csvLabelElements && els.csvLabelElements.lastElementChild;
      card && card.querySelector(".elementTemplateInput")?.focus();
    });
    on(els.csvLabelElements, "input", event => {
      if (!event.target.matches("[data-label-element-field='template']")) return;
      const state = getCsvRichLabelState();
      const card = event.target.closest("[data-label-element-id]");
      const element = state && card && state.elements.find(item => String(item.id) === card.dataset.labelElementId);
      if (!element) return;
      element.template = event.target.value;
      renderCsvRichLabelPreview();
      if (els.confirmCsvMapBtn) {
        const missingRequired = projectIo.getMissingCsvTargets(pendingCsvMapping.mapping, getCsvMappingTargets()).length > 0;
        els.confirmCsvMapBtn.disabled = missingRequired || !state.elements.some(item => String(item.template || "").trim());
      }
    });
    on(els.csvLabelElements, "change", event => {
      const field = event.target.dataset.labelElementField;
      if (field !== "type" && field !== "numberFormat") return;
      const state = getCsvRichLabelState();
      const card = event.target.closest("[data-label-element-id]");
      const element = state && card && state.elements.find(item => String(item.id) === card.dataset.labelElementId);
      if (!element) return;
      element[field] = field === "type"
        ? projectIo.normalizeRichLabelElementType(event.target.value)
        : projectIo.normalizeRichLabelNumberFormat(event.target.value);
      renderCsvRichLabelPreview();
    });
    on(els.csvLabelElements, "click", event => {
      const button = event.target.closest("button");
      const card = button && button.closest("[data-label-element-id]");
      const state = getCsvRichLabelState();
      const index = state && card ? state.elements.findIndex(item => String(item.id) === card.dataset.labelElementId) : -1;
      if (!button || !state || index < 0) return;
      const token = button.dataset.labelToken;
      if (token !== undefined) {
        const input = card.querySelector(".elementTemplateInput");
        const start = Number.isInteger(input.selectionStart) ? input.selectionStart : input.value.length;
        const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : start;
        const inserted = `{${token}}`;
        state.elements[index].template = input.value.slice(0, start) + inserted + input.value.slice(end);
        renderCsvRichLabelComposer(false);
        const nextInput = els.csvLabelElements.querySelector(`[data-label-element-id="${state.elements[index].id}"] .elementTemplateInput`);
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(start + inserted.length, start + inserted.length);
        }
        return;
      }
      const action = button.dataset.labelElementAction;
      if (action === "remove") state.elements.splice(index, 1);
      if (action === "up" && index > 0) [state.elements[index - 1], state.elements[index]] = [state.elements[index], state.elements[index - 1]];
      if (action === "down" && index < state.elements.length - 1) [state.elements[index + 1], state.elements[index]] = [state.elements[index], state.elements[index + 1]];
      if (action) renderCsvMappingDialog();
    });
    on(els.csvFirstRowHeadersInput, "change", () => {
      if (pendingCsvMapping && pendingCsvMapping.file) {
        if (pendingCsvMapping.sourceRows) {
          openTabularRowsForMapping(pendingCsvMapping.sourceRows, pendingCsvMapping.file, els.csvFirstRowHeadersInput.checked, {
            open: false,
            mode: pendingCsvMapping.mode,
            trigger: pendingCsvMapping.trigger
          });
        } else {
          parseCsvForMapping(pendingCsvMapping.file, els.csvFirstRowHeadersInput.checked, {
            open: false,
            mode: pendingCsvMapping.mode,
            trigger: pendingCsvMapping.trigger
          });
        }
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
        closeDialogByKey(key);
        if (key === "map-details") updateMapDetailsState();
      });
    });
    on(els.confirmationDialog, "click", event => {
      const action = event.target.closest("[data-confirmation-action]")?.dataset.confirmationAction;
      if (action === "confirm") resolveConfirmationDialog(true);
      if (action === "cancel") resolveConfirmationDialog(false);
    });
    on(els.pointCatalogDialog, "click", event => {
      const viewTab = event.target.closest("[data-catalog-view]");
      if (viewTab) {
        setPointCatalogView(viewTab.dataset.catalogView);
        viewTab.focus();
        return;
      }
      if (event.target.closest("#catalogAddPointsBtn")) {
        addSelectedProjectCities();
        return;
      }
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
    on(els.propertiesSelectionControls, "input", handleRichLabelEditorInput);
    on(els.propertiesSelectionControls, "keydown", handlePropertiesControlsKeydown);
    on(els.propertiesSelectionControls, "focusin", event => primeInputUndo(event.target, "properties edit"));
    on(els.propertiesSelectionControls, "focusout", event => clearInputUndoCapture(event.target));
    on(els.propertiesSelectionControls, "click", handlePropertiesControlsClick);
    on(els.qualityMetricsPanel, "click", handlePropertiesControlsClick);
    on(els.qualitySummaryBanner, "click", handlePropertiesControlsClick);
    on(els.canvasQualityPill, "click", handlePropertiesControlsClick);
    els.translationFilters.forEach(button => {
      on(button, "click", () => setTranslationFilter(button.dataset.translationFilter));
    });
    on(els.translationGroups, "click", handleTranslationSelection);
    on(els.translationGroups, "focusin", handleTranslationSelection);
    on(els.translationGroups, "focusin", event => primeInputUndo(event.target, "translation edit"));
    on(els.translationGroups, "input", handleTranslationInput);
    on(els.translationGroups, "focusout", event => clearInputUndoCapture(event.target));
    on(els.translationGroups, "keydown", handleTranslationKeydown);
    on(els.translationGroups, "paste", handleTranslationPaste);
    on(els.pasteTranslationColumnBtn, "click", pasteTranslationColumnFromClipboard);
    on(els.importTranslationsBtn, "click", () => els.translationImportInput.click());
    on(els.translationImportInput, "change", e => {
      const file = e.target.files && e.target.files[0];
      if (file) importTranslationFile(file);
      e.target.value = "";
    });
    [els.mapLanguageInput, els.previewLanguageInput].forEach(input => {
      on(input, "change", event => setMapLanguage(event.target.value));
    });
    els.mapLanguageButtons.forEach(button => {
      on(button, "click", () => setMapLanguage(button.dataset.mapLanguage));
    });
    els.uiLanguageButtons.forEach(button => {
      on(button, "click", () => applyUiLanguage(button.dataset.uiLanguage, { syncMap: false }));
    });
    on(els.projectFilterSelect, "change", event => setProjectFilter(event.target.value));
    on(els.projectSearchInput, "input", event => setProjectSearch(event.target.value));
    els.projectLocationModeButtons.forEach(button => {
      on(button, "click", () => setProjectLocationMode(button.dataset.projectLocationMode));
    });
    on(els.projectTable, "paste", pasteIntoTable);
    on(els.projectTable, "click", handleCoordinateCellClear);
    on(els.projectTable, "pointerdown", handleProjectCellSelection);
    on(els.projectTable, "click", handleProjectCellSelection);
    on(els.projectTable, "focusin", handleProjectCellSelection);
    on(els.projectTable, "keydown", handleProjectTableKeydown);
    on(els.bulkClearCoordinatesBtn, "click", clearSelectedCoordinateCells);
    document.addEventListener("keydown", handleGlobalKeyboardShortcuts);
    document.addEventListener("keydown", event => {
      const openDialogElement = getOpenDialogElement();
      if (!openDialogElement) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (openDialogElement === els.confirmationDialog) resolveConfirmationDialog(false);
        else if (openDialogElement === els.startupDialog && els.startupDialog.dataset.startupScreen === "setup") showStartupStartScreen();
        else if (openDialogElement === els.startupDialog) closeStartupDialog();
        else closeDialog(openDialogElement);
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(openDialogElement.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter(element => !element.closest("[hidden]"));
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
      if (els.applicationSettingsMenu && !els.applicationSettingsMenu.hidden && !event.target.closest(".application-settings-wrap")) {
        setApplicationSettingsOpen(false);
      }
      if (getProjectToolbarMenus().some(item => !item.menu.hidden) && !event.target.closest(".project-menu-wrap")) {
        closeProjectToolbarMenus();
      }
      if (els.categoryList?.querySelector(".legend-item-menu:not([hidden])") && !event.target.closest(".category-actions")) {
        closeLegendItemMenus();
      }
      if (mapScaleControlsVisible && els.mapHost && !els.mapHost.contains(event.target) && !eventOriginatedInPropertiesPanel(event)) {
        hideMapScaleControls();
      }
      if (isPointPropertiesSelection() && !isPointSelectionInteractionTarget(event.target, event)) {
        clearPointPropertiesSelection();
      }
      if (isBaselayerPropertiesSelection() && !isBaselayerSelectionInteractionTarget(event.target, event)) {
        clearBaselayerPropertiesSelection();
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
      els.hideLeaderLinesInput,
      els.showLineCasingInput,
      els.routeDenseLeadersInput,
      els.leaderColourInput,
      els.showDistanceMarkersInput,
      els.lockMarkerCoordinatesInput
    ].forEach(el => on(el, "change", handleLayoutSettingsChange));
    on(els.addCategoryBtn, "click", addCategory);
    on(els.categoryList, "click", event => {
      const menuButton = event.target.closest(".legend-item-menu-button");
      if (menuButton) {
        const menu = document.getElementById(menuButton.getAttribute("aria-controls"));
        setLegendItemMenuOpen(menuButton, Boolean(menu && menu.hidden));
        return;
      }
      const selectButton = event.target.closest(".legend-item-select");
      if (selectButton) {
        activeCategoryId = selectButton.dataset.categoryId;
        els.categoryList.querySelectorAll(".legend-item").forEach(item => {
          const isSelected = item.dataset.categoryId === activeCategoryId;
          item.classList.toggle("is-selected", isSelected);
          const button = item.querySelector(".legend-item-select");
          button?.setAttribute("aria-expanded", String(isSelected));
          if (isSelected) button?.setAttribute("aria-current", "true");
          else button?.removeAttribute("aria-current");
        });
        setCategoryPropertiesContext({ focus: true });
        return;
      }
      const moveButton = event.target.closest(".move-category-up-btn, .move-category-down-btn");
      if (moveButton) {
        closeLegendItemMenus();
        const offset = moveButton.classList.contains("move-category-up-btn") ? -1 : 1;
        const categoryId = moveButton.dataset.categoryId;
        if (moveCategoryByOffset(categoryId, offset)) {
          setStatusMessage(t("status.legendOrderUpdated"), "ok");
          window.requestAnimationFrame(() => {
            els.categoryList?.querySelector(`[data-legend-item][data-category-id="${window.CSS && CSS.escape ? CSS.escape(categoryId) : categoryId}"] .legend-item-menu-button`)?.focus({ preventScroll: true });
          });
        }
        return;
      }
      const removeButton = event.target.closest(".remove-category-btn");
      if (removeButton) {
        closeLegendItemMenus();
        const item = removeButton.closest(".legend-item");
        const focusCategoryId = item?.nextElementSibling?.dataset.categoryId || item?.previousElementSibling?.dataset.categoryId || "";
        if (removeCategory(removeButton.dataset.categoryId) && focusCategoryId) {
          window.requestAnimationFrame(() => {
            els.categoryList?.querySelector(`.legend-item-select[data-category-id="${window.CSS && CSS.escape ? CSS.escape(focusCategoryId) : focusCategoryId}"]`)?.focus({ preventScroll: true });
          });
        }
      }
    });
    on(els.categoryList, "keydown", handleLegendItemMenuKeydown);
    on(els.categoryList, "dragstart", handleCategoryDragStart);
    on(els.categoryList, "dragover", handleCategoryDragOver);
    on(els.categoryList, "drop", handleCategoryDrop);
    on(els.categoryList, "dragend", handleCategoryDragEnd);
    on(els.regionStatusVisibilityAllInput, "change", event => {
      pushAppUndoHistory("region status visibility");
      setAllRegionStatusVisibility(event.target.checked);
    });
    on(els.regionStatusVisibilityOptions, "change", event => {
      const status = event.target.dataset.regionStatusVisibility;
      if (!status) return;
      pushAppUndoHistory("region status visibility");
      setRegionStatusVisibility(status, event.target.checked);
    });
    on(els.regionTableBody, "change", event => {
      if (event.target.classList.contains("region-table-included-input")) {
        pushAppUndoHistory("region edit");
        clearActiveRegionPreset();
        regionVisibility[event.target.dataset.regionId] = event.target.checked;
        applyRegionColoursByValue(false, { refreshRowsOnly: true });
        scheduleRender();
        return;
      }

      if (event.target.classList.contains("region-status-input")) {
        pushAppUndoHistory("region edit");
        const status = normalizeRegionStatus(event.target.value);
        if (status) regionStatuses[event.target.dataset.regionId] = status;
        else delete regionStatuses[event.target.dataset.regionId];
        refreshRegionValueTableRow(getRegionTableRows().find(region => region.id === event.target.dataset.regionId));
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
      if (!normalizedBoundaryCache.has(currentBoundary)) {
        normalizedBoundaryCache.set(currentBoundary, normalizeBoundaryGeoJson(await fetchGeoJsonWithFallback(source), source));
      }
      canadaGeo = normalizedBoundaryCache.get(currentBoundary);
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
    let localBoundary = null;
    if (!source.preferRemote) {
      try {
        localBoundary = await loadLocalBoundary(source);
      } catch (error) {
        console.warn(`Could not lazy-load bundled ${source.label} GeoJSON. Trying configured sources.`, error);
      }
    }
    if (localBoundary && !source.preferRemote) {
      return localBoundary;
    }

    try {
      return await fetchJson(source.url);
    } catch (onlineError) {
      console.warn(`Could not load online ${source.label} GeoJSON. Trying local fallback.`, onlineError);
      if (!localBoundary) {
        try {
          localBoundary = await loadLocalBoundary(source);
        } catch (_error) {
          // The JSON fallback below may still be available when script loading is blocked.
        }
      }
      if (localBoundary) return localBoundary;
      return fetchJson(source.fallbackUrl);
    }
  }

  async function loadLocalBoundary(source) {
    const existing = getLocalBoundary(source);
    if (existing || !source || !source.fallbackKey) return existing;
    const fallbackUrl = String(source.fallbackUrl || "");
    const scriptUrl = String(source.fallbackScriptUrl || fallbackUrl.replace(/\.geojson(?:\?.*)?$/i, ".js"));
    if (!scriptUrl || scriptUrl === fallbackUrl) return null;
    await loadDeferredScript(`${scriptUrl}${scriptUrl.includes("?") ? "&" : "?"}v=20260722-performance`);
    return getLocalBoundary(source);
  }

  function getLocalBoundary(source) {
    if (!window.PLOTYPUS_LOCAL_BOUNDARIES || !source || !source.fallbackKey) return null;
    return window.PLOTYPUS_LOCAL_BOUNDARIES[source.fallbackKey] || null;
  }

  async function init() {
    renderRibbonIcons();
    mountStartupReferenceCitiesField();
    mountBaselayerReferenceCitiesField();
    initializeFeedbackComposer();
    initEvents();
    initializePropertiesPanelState();
    updateMapDetailsState();
    els.boundaryInput.value = currentBoundary;
    renderBookSizeOptions();
    renderFontOptions();
    if (!applySavedLayoutPreferences()) renderImageSizeOptions();
    canvasViewZoom = getSavedCanvasViewZoom();
    syncCompactFurnitureAvailability();
    renderRegionPresetOptions();
    renderMapStyleOptions();
    syncStartupSetupControls();
    renderCategoryEditors();
    setRows([], [], { render: false, resetProperties: false });
    applyUiLanguage(getSavedUiLanguagePreference(), { persist: false, renderMap: false });
    updateUndoButtonState();
    await loadGeo();
    render();
    setActiveDataTab("preview");
    openStartupDialogIfEmpty();
  }

  function createTestApi() {
    return {
      rectsOverlap,
      rectOverlapArea,
      segmentsCross,
      pointInRect,
      segmentIntersectsRect,
      lineEnd,
      labelBackgroundRect,
      leaderPathPoints,
      makeLabelPlacement,
      createCandidateForSide,
      createLabelCandidates,
      createPerimeterCandidateMap,
      createPerimeterCapacity,
      assessPerimeterFeasibility,
      scoreCandidate,
      createLayoutQualityAnalyzer,
      recomputeLayoutQualityReport,
      getQualityLocateTargets,
      getActiveQualityLocateTarget: () => activeQualityLocateTarget,
      countSideOrderInversions,
      createOrderPreservingVerticalSlots,
      createOrderPreservingHorizontalSlots,
      measurePlacementQuality,
      optimizeOrderedSideBands,
      applyManualLabelPositions,
      normalizeAnnotationContent,
      getLabelLines,
      getLabelTypographyRenderSizes,
      getLabelLineFontSize,
      getLabelLineFontWeight,
      getLabelMaxCharsForResize,
      getLabelWidthHandlePosition,
      getRenderedLabelTextAnchor,
      getRenderedLabelTextX,
      isLabelWidthResizable,
      measureLabelTextWidth,
      getCalloutContentLayout,
      normalizeRichLabelImageDisplaySize,
      getRichLabelImageDimensions,
      getLocalizedConfigLabel,
      getFrenchWorldRegionName,
      getRegionDisplayName,
      getCsvParserErrorMessage,
      getImageCaptionTranslationEntry,
      getDefaultCategoryLabels,
      normalizeComparableText,
      normalizeHeader,
      toBoolean,
      cleanType,
      formatProjectCoordinate,
      formatLocalizedDecimal,
      isPointOffCanvas,
      constrainMarkerToVisibleGutter,
      constrainLabelToCanvas,
      makeLabelBox,
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
