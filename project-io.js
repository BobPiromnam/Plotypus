(function (global) {
  "use strict";

  function projectIoError(message, i18nKey, i18nParams) {
    const error = new Error(message);
    error.i18nKey = i18nKey;
    error.i18nParams = i18nParams || {};
    return error;
  }

  function createProjectSnapshot(options) {
    const {
      version,
      boundary,
      mapStyle,
      mapLanguage,
      projectLocationMode,
      settings,
      chromeTranslations,
      mapDetails,
      authoringLanguage,
      categories,
      rows,
      regionVisibility,
      regionFills,
      regionColourOverrides,
      regionValues,
      regionStatuses,
      languageLayouts,
      manualLabelPositions,
      manualBoxPositions,
      cleanType
    } = options || {};
    if (typeof cleanType !== "function") throw new TypeError("Project snapshot requires cleanType.");

    return {
      version,
      savedAt: new Date().toISOString(),
      boundary,
      mapStyle,
      mapLanguage,
      projectLocationMode: projectLocationMode === "regions" ? "regions" : "coordinates",
      settings,
      chromeTranslations,
      mapDetails: { ...(mapDetails || {}) },
      authoringLanguage,
      categories: (categories || []).map(category => ({
        id: category.id,
        label: category.label,
        labelFr: category.labelFr || "",
        shape: category.shape,
        colour: category.colour,
        markerSize: category.markerSize,
        lineWidth: category.lineWidth,
        markerSizeCustom: Boolean(category.markerSizeCustom),
        lineWidthCustom: Boolean(category.lineWidthCustom),
        collapsed: category.collapsed
      })),
      rows: (rows || []).map(row => ({
        rowId: row.rowId,
        name: row.name,
        nameFr: row.nameFr || "",
        footnote: row.footnote,
        type: cleanType(row.type),
        priority: row.priority || 0,
        lon: row.lon,
        lat: row.lat,
        anchor: row.anchor || "coord",
        region: row.region || "",
        labelStyle: row.labelStyle || "compact",
        content: Array.isArray(row.content) ? row.content : [],
        chart: "none",
        chartSlices: [],
        hideLine: row.hideLine,
        labelMaxChars: row.labelMaxChars || ""
      })),
      regionVisibility,
      regionFills,
      regionColourOverrides,
      regionValues,
      regionStatuses,
      languageLayouts,
      manualLabelPositions,
      manualBoxPositions
    };
  }

  function parseProjectJson(text) {
    return JSON.parse(String(text || "{}"));
  }

  function createCsvExport(options) {
    const {
      rows,
      projectLocationMode,
      getCategoryLabel,
      getCategoryText,
      getCategoryForType
    } = options || {};
    if (typeof getCategoryLabel !== "function" || typeof getCategoryText !== "function" || typeof getCategoryForType !== "function") {
      throw new TypeError("CSV export requires category label helpers.");
    }
    const exportRows = (rows || []).map(row => ({
      name: row.name,
      name_fr: row.nameFr || "",
      footnote: row.footnote,
      type: getCategoryLabel(row.type),
      type_fr: getCategoryText(getCategoryForType(row.type), "fr"),
      priority: row.priority || "",
      lon: row.lon,
      lat: row.lat,
      region: row.region || "",
      hideLine: row.hideLine ? "yes" : ""
    }));
    return {
      rows: exportRows,
      columns: projectLocationMode === "regions" || (rows || []).some(row => row && row.anchor === "region")
        ? ["name", "name_fr", "footnote", "type", "type_fr", "priority", "region", "hideLine"]
        : ["name", "name_fr", "footnote", "type", "type_fr", "priority", "lon", "lat", "hideLine"]
    };
  }

  function getSavedJson(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || "null");
    } catch (error) {
      return null;
    }
  }

  function saveJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Storage failures should not block the active import flow.
    }
  }

  function createCsvMappingState(options) {
    const {
      results,
      file,
      targets,
      savedMapping,
      findSourceForTarget,
      defaultFileName
    } = options || {};
    if (typeof findSourceForTarget !== "function") throw new TypeError("CSV mapping requires a source matcher.");
    const fields = results && results.meta && Array.isArray(results.meta.fields)
      ? results.meta.fields.filter(Boolean)
      : [];
    const mapping = {};
    (targets || []).forEach(target => {
      mapping[target.key] = findSourceForTarget(fields, target.key);
    });
    if (savedMapping && typeof savedMapping === "object") {
      (targets || []).forEach(target => {
        if (savedMapping[target.key] && fields.includes(savedMapping[target.key])) mapping[target.key] = savedMapping[target.key];
      });
    }
    return {
      fields,
      data: results && results.data || [],
      errors: results && results.errors || [],
      mapping,
      file,
      fileName: file && file.name || defaultFileName || "CSV"
    };
  }

  function getMissingCsvTargets(mapping, targets) {
    return (targets || []).filter(target => target.required && !(mapping || {})[target.key]);
  }

  function mapCsvRowsForImport(mappingState, targets) {
    const mapping = mappingState && mappingState.mapping || {};
    return (mappingState && mappingState.data || []).map(source => {
      const row = {};
      (targets || []).forEach(target => {
        const sourceField = mapping[target.key];
        if (sourceField) row[target.key] = source[sourceField];
      });
      return row;
    });
  }

  function getMappedCsvFields(mapping, targets) {
    return (targets || []).filter(target => (mapping || {})[target.key]).map(target => target.key);
  }

  function validateAndNormalizeProject(rawProject, options) {
    const { projectFile } = options || {};
    if (!projectFile || typeof projectFile.validateAndNormalizeProject !== "function") {
      throw projectIoError("Project-file validation module did not load.", "project.error.validationModuleMissing");
    }
    return projectFile.validateAndNormalizeProject(rawProject, options);
  }

  function normalizeLayoutPreferences(preferences, options) {
    const { imageSizePresets, layoutDefaults, getBookSizePreset } = options || {};
    if (!imageSizePresets || !layoutDefaults || typeof getBookSizePreset !== "function") {
      throw new TypeError("Layout preference normalization requires presets, defaults, and getBookSizePreset.");
    }
    const bookSize = imageSizePresets[preferences && preferences.bookSize]
      ? preferences.bookSize
      : layoutDefaults.bookSizeInput;
    const book = getBookSizePreset(bookSize);
    const imageSize = book.sizes.some(size => size.value === (preferences && preferences.imageSize))
      ? preferences.imageSize
      : layoutDefaults.imageSizeInput;
    return { bookSize, imageSize };
  }

  function getSavedLayoutPreferences(storage, key, normalizePreferences) {
    try {
      const raw = storage && storage.getItem(key);
      if (!raw) return null;
      return normalizePreferences(JSON.parse(raw));
    } catch (error) {
      return null;
    }
  }

  function saveLayoutPreferences(storage, key, preferences, normalizePreferences) {
    try {
      storage.setItem(key, JSON.stringify(normalizePreferences(preferences)));
    } catch (error) {
      // Private browsing or file restrictions should not block the editor.
    }
  }

  global.PLOTYPUS_PROJECT_IO = Object.freeze({
    createCsvExport,
    createCsvMappingState,
    createProjectSnapshot,
    getMappedCsvFields,
    getMissingCsvTargets,
    getSavedLayoutPreferences,
    getSavedJson,
    mapCsvRowsForImport,
    normalizeLayoutPreferences,
    parseProjectJson,
    saveJson,
    saveLayoutPreferences,
    validateAndNormalizeProject
  });
})(window);
