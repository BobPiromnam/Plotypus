(function () {
  const fallbackRegionColours = ["#c7ded5", "#96c6b4", "#6caf94", "#078c70"];

  const defaultConfig = {
    appVersion: "2026.07.14",
    configPath: "plotypus.config.json",
    defaultFontFamily: "Lato, Segoe UI, Arial, sans-serif",
    defaultMapStylePreset: "goc-green",
    performanceBudgets: {
      renderMs: 200,
      autoPlaceMs: 1500,
      exportMs: 800,
      sampleWindow: 30
    },
    fontOptions: [
      {
        label: "Lato",
        value: "Lato, Segoe UI, Arial, sans-serif",
        stylesheet: "assets/fonts/lato/lato.css?v=20260612-file-fonts"
      },
      {
        label: "Segoe UI",
        value: "Segoe UI, Arial, sans-serif"
      },
      {
        label: "Arial",
        value: "Arial, sans-serif"
      }
    ],
    boundarySources: {
      canada: {
        label: "Canada provinces and territories",
        labelFr: "Provinces et territoires du Canada",
        url: "https://data.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-canada-province%40public/exports/geojson?lang=en&timezone=America%2FToronto",
        fallbackUrl: "assets/canada-regions.geojson",
        fallbackKey: "canada",
        projection: "canada"
      },
      world: {
        label: "World countries",
        labelFr: "Pays du monde",
        url: "https://datahub.io/core/geo-boundaries-world-110m/_r/-/countries.geojson",
        fallbackUrl: "assets/world-countries.geojson",
        fallbackKey: "world",
        projection: "world"
      }
    },
    sampleRows: [
      { name: "Grays Bay Road and Port", nameFr: "Route et port de Grays Bay", type: "Referred Project", lon: -108.4, lat: 68.5 },
      { name: "Arctic Economic and Security Corridor", nameFr: "Corridor économique et de sécurité pour l'Arctique", type: "Referred Project", lon: -112.5, lat: 64.5 },
      { name: "Mackenzie Valley Highway", nameFr: "Route de la vallée du Mackenzie", type: "Referred Project", lon: -124.0, lat: 65.5 },
      { name: "Red Chris Mine Expansion", nameFr: "Expansion de la mine Red Chris", type: "Referred Project", lon: -129.9, lat: 57.7 },
      { name: "Ksi Lisims LNG", nameFr: "Terminal de gaz naturel liquéfié Ksi Lisims", type: "Referred Project", lon: -130.1, lat: 55.1 },
      { name: "North Coast Transmission Line", nameFr: "Ligne de transport d'électricité de la côte nord", type: "Referred Project", lon: -128.0, lat: 54.9 },
      { name: "LNG Canada Phase 2", nameFr: "LNG Canada – phase 2", type: "Referred Project", lon: -128.65, lat: 54.05 },
      { name: "Northwest Critical Conservation Corridor", nameFr: "Corridor essentiel de conservation du Nord‑Ouest", type: "Transformative Strategy", lon: -130.0, lat: 58.2 },
      { name: "Pathways Plus", nameFr: "Nouvelles voies (Pathways Plus)", type: "Transformative Strategy", lon: -111.4, lat: 56.7 },
      { name: "McIlvenna Bay Copper Mine", nameFr: "Mine de cuivre à McIlvenna Bay", type: "Referred Project", lon: -103.9, lat: 54.5 },
      { name: "Crawford Nickel", nameFr: "Projet nickélifère Crawford", type: "Referred Project", lon: -81.33, lat: 48.47 },
      { name: "Darlington New Nuclear Project", nameFr: "Projet de nouvelle centrale nucléaire de Darlington", type: "Referred Project", lon: -78.72, lat: 43.87 },
      { name: "Nouveau Monde Graphite's Matawinie Mine", nameFr: "Mine Matawinie de Nouveau Monde Graphite", type: "Referred Project", lon: -73.92, lat: 46.68 },
      { name: "Contrecoeur Terminal Container Project", nameFr: "Projet de terminal à conteneurs de Contrecœur", type: "Transformative Strategy", lon: -73.23, lat: 45.85 },
      { name: "Northcliff Resources' Sisson Mine", nameFr: "Mine Sisson de Northcliff Resources", type: "Referred Project", lon: -67.25, lat: 46.35 },
      { name: "Wind West Atlantic Energy", nameFr: "Wind West Atlantic Energy", type: "Transformative Strategy", lon: -63.2, lat: 45.0 },
      { name: "Iqaluit Hydro", nameFr: "Projet hydroélectrique à Iqaluit", type: "Referred Project", lon: -68.52, lat: 63.75 },
      { name: "Port of Churchill Plus", nameFr: "Port de Churchill plus", type: "Transformative Strategy", lon: -94.17, lat: 58.77 },
      { name: "Taltson Hydro Expansion Project", nameFr: "Agrandissement de la centrale hydroélectrique Taltson", type: "Referred Project", lon: -111.0, lat: 60.5 },
      { name: "Alto High-Speed Rail, Ontario-Quebec Corridor", nameFr: "Train à grande vitesse Alto, corridor Ontario‑Québec", type: "Transformative Strategy", lon: -74.5, lat: 45.8 },
      { name: "Critical Minerals Strategy", nameFr: "Stratégie sur les minéraux critiques", type: "Transformative Strategy", lon: "", lat: "" }
    ],
    fallbackRegionColours,
    mapStylePresets: {
      "goc-green": {
        label: "GoC green",
        labelFr: "Vert GC",
        stylesheet: "themes/goc-green.css?v=20260612-map-only",
        regionColours: fallbackRegionColours,
        categoryStyles: [
          { colour: "#444444", stroke: "#ffffff", markerSize: 4, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#555555", markerSize: 4, lineWidth: 2 },
          { colour: "#0b6b57", stroke: "#ffffff", markerSize: 4, lineWidth: 2 }
        ]
      },
      "goc-blue": {
        label: "GoC blue",
        labelFr: "Bleu GC",
        stylesheet: "themes/goc-blue.css?v=20260612-map-only",
        regionColours: ["#d7e5f5", "#9dbbe0", "#26374a"],
        categoryStyles: [
          { colour: "#26374a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#26374a", markerSize: 10, lineWidth: 2 },
          { colour: "#1c578a", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
        ]
      },
      "neutral-print": {
        label: "Neutral print",
        labelFr: "Impression neutre",
        stylesheet: "themes/neutral-print.css?v=20260612-map-only",
        regionColours: ["#efefef", "#d8d8d8", "#bdbdbd"],
        categoryStyles: [
          { colour: "#222222", stroke: "#ffffff", markerSize: 10, lineWidth: 2 },
          { colour: "#ffffff", stroke: "#222222", markerSize: 10, lineWidth: 2 },
          { colour: "#777777", stroke: "#ffffff", markerSize: 10, lineWidth: 2 }
        ]
      },
      "high-contrast": {
        label: "High contrast",
        labelFr: "Contraste élevé",
        stylesheet: "themes/high-contrast.css?v=20260612-map-only",
        regionColours: ["#ffffff", "#d8d8d8", "#000000"],
        categoryStyles: [
          { colour: "#000000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 },
          { colour: "#ffffff", stroke: "#000000", markerSize: 11, lineWidth: 3 },
          { colour: "#b00000", stroke: "#ffffff", markerSize: 11, lineWidth: 3 }
        ]
      }
    },
    csvColumnAliases: {
      name: ["name", "project", "project name"],
      nameFr: ["name_fr", "nom", "nom du projet", "french name", "fr name", "project fr", "project name fr", "nom_fr"],
      footnote: ["footnote", "footnote marker", "note", "superscript"],
      type: ["type", "category", "project type"],
      typeFr: ["type_fr", "type fr", "categorie", "category fr", "french type"],
      lon: ["lon", "longitude", "long"],
      lat: ["lat", "latitude"],
      hideLine: ["hide line", "hide lines", "hideline", "no line", "no leader line"]
    },
    tableFields: ["name", "footnote", "type", "lon", "lat"],
    layoutDefaults: {
      bookSizeInput: "letter",
      imageSizeInput: "full",
      labelSizeInput: 12,
      mapScaleInput: 100,
      markerSizeInput: 4,
      lineWidthInput: 2,
      labelCharsInput: 24
    },
    storageKeys: {
      layoutPreferences: "plotypus.layoutPreferences",
      propertiesPanel: "plotypus.propertiesPanel",
      uiLanguage: "plotypus.uiLanguage",
      canvasViewZoom: "plotypus.canvasViewZoom"
    },
    imageSizePresets: {
      letter: {
        label: "8.5 x 11",
        labelFr: "8,5 x 11",
        documentPage: { widthIn: 8.5, heightIn: 11, marginIn: 1 },
        sizes: [
          { value: "full", label: "Full page", labelFr: "Page complète", width: 612, height: 750 },
          { value: "two-thirds", label: "2/3 page", labelFr: "2/3 de page", width: 612, height: 520 },
          { value: "half", label: "1/2 page", labelFr: "1/2 page", width: 612, height: 390 },
          { value: "third", label: "1/3 page", labelFr: "1/3 de page", width: 612, height: 260 },
          { value: "quarter", label: "1/4 page", labelFr: "1/4 de page", width: 612, height: 200 }
        ]
      },
      compact: {
        label: "6.5 x 9.75",
        labelFr: "6,5 x 9,75",
        documentPage: { widthIn: 6.5, heightIn: 9.75, marginIn: 0.75 },
        sizes: [
          { value: "full", label: "Full page", labelFr: "Page complète", width: 468, height: 700 },
          { value: "two-thirds", label: "2/3 page", labelFr: "2/3 de page", width: 468, height: 468 },
          { value: "half", label: "1/2 page", labelFr: "1/2 page", width: 468, height: 350 },
          { value: "third", label: "1/3 page", labelFr: "1/3 de page", width: 468, height: 235 },
          { value: "quarter", label: "1/4 page", labelFr: "1/4 de page", width: 468, height: 175 }
        ]
      }
    },
    regionPresetOptions: {
      canada: [
        { value: "", label: "Choose preset", labelFr: "Choisir un préréglage" },
        { value: "all", label: "All Canada", labelFr: "Tout le Canada" },
        { value: "territories", label: "Territories", labelFr: "Territoires" },
        { value: "western", label: "Western Canada", labelFr: "Ouest canadien" },
        { value: "prairies", label: "Prairies", labelFr: "Prairies" },
        { value: "central", label: "Central Canada", labelFr: "Centre du Canada" },
        { value: "atlantic", label: "Atlantic Canada", labelFr: "Canada atlantique" }
      ],
      world: [
        { value: "", label: "Choose continent", labelFr: "Choisir un continent" },
        { value: "all", label: "All countries", labelFr: "Tous les pays" },
        { value: "africa", label: "Africa", labelFr: "Afrique" },
        { value: "antarctica", label: "Antarctica", labelFr: "Antarctique" },
        { value: "asia", label: "Asia", labelFr: "Asie" },
        { value: "europe", label: "Europe", labelFr: "Europe" },
        { value: "north-america", label: "North America", labelFr: "Amérique du Nord" },
        { value: "oceania", label: "Oceania", labelFr: "Océanie" },
        { value: "south-america", label: "South America", labelFr: "Amérique du Sud" }
      ]
    },
    markerShapes: [
      { value: "circle", label: "Circle", labelFr: "Cercle" },
      { value: "square", label: "Square", labelFr: "Carré" },
      { value: "diamond", label: "Diamond", labelFr: "Losange" },
      { value: "drop-pin", label: "Drop pin", labelFr: "Épingle" },
      { value: "triangle-up", label: "Triangle up", labelFr: "Triangle vers le haut" },
      { value: "triangle-down", label: "Triangle down", labelFr: "Triangle vers le bas" },
      { value: "star", label: "Star", labelFr: "Étoile" },
      { value: "plus", label: "Plus", labelFr: "Plus" },
      { value: "cross", label: "Cross", labelFr: "Croix" }
    ],
    categoryColourPresets: [
      { value: "", label: "Custom", labelFr: "Personnalisée" },
      { value: "#26374a", label: "GoC blue", labelFr: "Bleu GC" },
      { value: "#284162", label: "Deep blue", labelFr: "Bleu foncé" },
      { value: "#1c578a", label: "Accessible blue", labelFr: "Bleu accessible" },
      { value: "#217346", label: "Excel green", labelFr: "Vert Excel" },
      { value: "#0b6b57", label: "Map green", labelFr: "Vert cartographique" },
      { value: "#7834bc", label: "Purple", labelFr: "Violet" },
      { value: "#a05a00", label: "Ochre", labelFr: "Ocre" },
      { value: "#d3080c", label: "Alert red", labelFr: "Rouge alerte" },
      { value: "#444444", label: "Charcoal", labelFr: "Anthracite" },
      { value: "#ffffff", label: "White", labelFr: "Blanc" }
    ],
    categorySettings: [
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
    ]
  };

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(base, override) {
    if (Array.isArray(override)) return override.slice();
    if (!isPlainObject(override)) return override === undefined ? base : override;
    const merged = { ...(isPlainObject(base) ? base : {}) };
    Object.keys(override).forEach((key) => {
      merged[key] = deepMerge(merged[key], override[key]);
    });
    return merged;
  }

  function normalizeExternalConfig(config) {
    if (!isPlainObject(config)) return {};
    const normalized = { ...config };
    if (config.defaults) normalized.layoutDefaults = deepMerge(normalized.layoutDefaults, mapLayoutDefaults(config.defaults));
    if (config.bookSizes) normalized.imageSizePresets = config.bookSizes;
    if (config.mapStyles) normalized.mapStylePresets = config.mapStyles;
    if (config.categories) normalized.categorySettings = config.categories;
    if (config.fonts) normalized.fontOptions = config.fonts;
    return normalized;
  }

  function mapLayoutDefaults(defaults) {
    return {
      bookSizeInput: defaults.bookSize || defaults.bookSizeInput,
      imageSizeInput: defaults.imageSize || defaults.imageSizeInput,
      labelSizeInput: defaults.printLabelSize || defaults.labelSizeInput,
      mapScaleInput: defaults.mapScale || defaults.mapScaleInput,
      markerSizeInput: defaults.defaultMarkerSize || defaults.markerSizeInput,
      lineWidthInput: defaults.defaultLineWidth || defaults.lineWidthInput,
      labelCharsInput: defaults.labelMaxChars || defaults.labelCharsInput
    };
  }

  function loadFontStylesheets(config) {
    const fonts = Array.isArray(config.fontOptions) ? config.fontOptions : [];
    fonts.forEach((font) => {
      if (!font || !font.stylesheet || document.querySelector(`link[href="${font.stylesheet}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = font.stylesheet;
      document.head.appendChild(link);
    });
  }

  async function loadExternalConfig(baseConfig) {
    const configPath = window.PLOTYPUS_CONFIG_PATH || baseConfig.configPath;
    const canFetchConfig = configPath && window.location.protocol !== "file:";
    if (!canFetchConfig || !window.fetch) return baseConfig;

    try {
      const response = await window.fetch(configPath, { cache: "no-store" });
      if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
      const externalConfig = normalizeExternalConfig(await response.json());
      return deepMerge(baseConfig, externalConfig);
    } catch (error) {
      console.warn(`Plotypus config: using bundled defaults because ${configPath} could not be loaded.`, error);
      return baseConfig;
    }
  }

  window.PLOTYPUS_CONFIG = defaultConfig;
  window.PLOTYPUS_CONFIG_READY = loadExternalConfig(defaultConfig).then((config) => {
    window.PLOTYPUS_CONFIG = config;
    loadFontStylesheets(config);
    return config;
  });
})();
