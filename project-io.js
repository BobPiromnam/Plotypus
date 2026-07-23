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
      format = "plotypus-project",
      version,
      generator,
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
      format,
      version,
      generator: {
        name: String(generator && generator.name || "Plotypus"),
        version: String(generator && generator.version || "unknown")
      },
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
        stroke: category.stroke,
        markerSize: category.markerSize,
        lineWidth: category.lineWidth,
        markerSizeCustom: Boolean(category.markerSizeCustom),
        lineWidthCustom: Boolean(category.lineWidthCustom),
        collapsed: category.collapsed,
        customIcon: category.customIcon ? { ...category.customIcon } : null
      })),
      rows: (rows || []).map(row => ({
        rowId: row.rowId,
        name: row.name,
        nameFr: row.nameFr || "",
        footnote: row.footnote,
        type: cleanType(row.type),
        lon: row.lon,
        lat: row.lat,
        anchor: row.anchor || "coord",
        region: row.region || "",
        labelStyle: row.labelStyle || "compact",
        content: Array.isArray(row.content) ? row.content : [],
        labelBorder: Boolean(row.labelBorder),
        chart: "none",
        chartSlices: [],
        hideLine: row.hideLine,
        elbowLeader: Boolean(row.elbowLeader),
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
    try {
      return JSON.parse(String(text || "{}"));
    } catch (cause) {
      const error = projectIoError(
        "Project file contains invalid JSON.",
        "project.error.invalidJson"
      );
      error.cause = cause;
      throw error;
    }
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
      lon: row.lon,
      lat: row.lat,
      region: row.region || "",
      hideLine: row.hideLine ? "yes" : ""
    }));
    return {
      rows: exportRows,
      columns: projectLocationMode === "regions" || (rows || []).some(row => row && row.anchor === "region")
        ? ["name", "name_fr", "footnote", "type", "type_fr", "region", "hideLine"]
        : ["name", "name_fr", "footnote", "type", "type_fr", "lon", "lat", "hideLine"]
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

  function normalizeRichLabelElementType(value) {
    const type = String(value || "text").toLowerCase();
    return type === "bullet" ? "bullet" : "text";
  }

  function normalizeRichLabelNumberFormat(value) {
    const format = String(value || "full").toLowerCase();
    return format === "abbrev" || format === "raw" ? format : "full";
  }

  function getRichLabelTemplateSources(template) {
    const sources = [];
    const seen = new Set();
    String(template || "").replace(/\{([^{}]+)\}/g, (_match, source) => {
      const field = String(source || "").trim();
      if (field && !seen.has(field)) {
        seen.add(field);
        sources.push(field);
      }
      return _match;
    });
    return sources;
  }

  function parseRichLabelNumber(value) {
    const raw = String(value ?? "").trim().replace(/\u00a0/g, " ");
    if (!raw) return null;
    const match = raw.match(/^([$€£])?\s*(-?[\d\s,]+(?:\.\d+)?)\s*(thousand|million|billion|k|m|b)?\s*$/i);
    if (!match) return null;
    const numeric = Number(String(match[2] || "").replace(/[\s,]/g, ""));
    if (!Number.isFinite(numeric)) return null;
    const unit = String(match[3] || "").toLowerCase();
    const multiplier = unit === "thousand" || unit === "k"
      ? 1e3
      : unit === "million" || unit === "m"
        ? 1e6
        : unit === "billion" || unit === "b"
          ? 1e9
          : 1;
    return { raw, currency: match[1] || "", numeric, multiplier };
  }

  function formatRichLabelNumber(value, numberFormat = "full", language = "en") {
    const parsed = parseRichLabelNumber(value);
    if (!parsed) return String(value ?? "");
    const format = normalizeRichLabelNumberFormat(numberFormat);
    const lang = language === "fr" ? "fr" : "en";
    const locale = lang === "fr" ? "fr-CA" : "en-CA";
    const amount = parsed.numeric * parsed.multiplier;
    if (format === "raw") return String(Number.isInteger(amount) ? amount : Number(amount.toFixed(6)));

    const number = new Intl.NumberFormat(locale, {
      maximumFractionDigits: Number.isInteger(parsed.numeric) ? 0 : 6,
      useGrouping: parsed.multiplier === 1
    }).format(parsed.numeric);
    if (format === "abbrev" && parsed.multiplier > 1) {
      const suffix = parsed.multiplier === 1e3 ? "K" : parsed.multiplier === 1e6 ? "M" : "B";
      if (parsed.currency === "$" && lang === "fr") return `${number} ${suffix}$`;
      return `${parsed.currency}${number}${suffix}`;
    }
    if (format === "full" && lang === "en") return parsed.raw;
    if (format === "full" && parsed.multiplier > 1) {
      const unit = parsed.multiplier === 1e3 ? (lang === "fr" ? "mille" : "thousand")
        : parsed.multiplier === 1e6 ? (lang === "fr" ? "millions" : "million")
          : (lang === "fr" ? "milliards" : "billion");
      if (parsed.currency === "$" && lang === "fr") return `${number} ${unit} $`;
      return `${parsed.currency}${number} ${unit}`;
    }
    if (parsed.currency === "$" && lang === "fr") return `${number} $`;
    return `${parsed.currency}${number}`;
  }

  function localizeRichLabelLiteral(value, language) {
    if (language !== "fr") return value;
    return String(value || "").replace(/\bhomes\b/gi, "logements");
  }

  function resolveRichLabelTemplate(template, sourceRow, numberFormat = "full", language = "en") {
    const source = sourceRow && typeof sourceRow === "object" ? sourceRow : {};
    const resolved = String(template || "").replace(/\{([^{}]+)\}/g, (match, rawField) => {
      const field = String(rawField || "").trim();
      if (!Object.prototype.hasOwnProperty.call(source, field)) return match;
      return formatRichLabelNumber(source[field], numberFormat, language);
    });
    return localizeRichLabelLiteral(resolved, language).trim();
  }

  function createRichLabelContentBlock(element, sourceRow) {
    const template = String(element && element.template || "");
    const numberFormat = normalizeRichLabelNumberFormat(element && element.numberFormat);
    return {
      type: normalizeRichLabelElementType(element && element.type),
      template,
      sources: getRichLabelTemplateSources(template),
      numberFormat,
      value: {
        en: resolveRichLabelTemplate(template, sourceRow, numberFormat, "en"),
        fr: resolveRichLabelTemplate(template, sourceRow, numberFormat, "fr")
      }
    };
  }

  function composeRichLabelRows(mappedRows, sourceRows, elements) {
    const definitions = (elements || []).filter(element => String(element && element.template || "").trim());
    return (mappedRows || []).map((row, index) => ({
      ...(row || {}),
      labelStyle: definitions.length ? "rich" : row && row.labelStyle,
      content: definitions.map(element => createRichLabelContentBlock(element, sourceRows && sourceRows[index]))
    }));
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
    composeRichLabelRows,
    createRichLabelContentBlock,
    createCsvExport,
    createCsvMappingState,
    createProjectSnapshot,
    formatRichLabelNumber,
    getMappedCsvFields,
    getMissingCsvTargets,
    getRichLabelTemplateSources,
    getSavedLayoutPreferences,
    getSavedJson,
    mapCsvRowsForImport,
    normalizeLayoutPreferences,
    normalizeRichLabelElementType,
    normalizeRichLabelNumberFormat,
    parseProjectJson,
    resolveRichLabelTemplate,
    saveJson,
    saveLayoutPreferences,
    validateAndNormalizeProject
  });
})(window);
