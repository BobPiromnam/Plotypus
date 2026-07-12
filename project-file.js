(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlotypusProjectFile = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isHexColour(value) {
    return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
  }

  function validationError(message, i18nKey, i18nParams) {
    const error = new Error(message);
    error.i18nKey = i18nKey;
    error.i18nParams = i18nParams || {};
    return error;
  }

  function fieldLabel(label, labelKey, labelParams) {
    return {
      label,
      labelKey,
      labelParams: labelParams || {}
    };
  }

  function getFieldLabelText(field) {
    return field && typeof field === "object" ? field.label : field;
  }

  function getFieldLabelParams(field) {
    return field && typeof field === "object"
      ? { label: field.label, labelKey: field.labelKey, labelParams: field.labelParams || {} }
      : { label: field };
  }

  function validateColour(value, label) {
    if (value !== undefined && !isHexColour(value)) {
      throw validationError(`${getFieldLabelText(label)} must be a hex colour such as #444444.`, "project.error.hexColour", getFieldLabelParams(label));
    }
  }

  function isCustomIconDataUrl(value) {
    return typeof value === "string" && /^data:image\/(?:png|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  function validateCustomIcon(icon, label) {
    if (icon === undefined || icon === null) return;
    const labelText = getFieldLabelText(label);
    const labelParams = getFieldLabelParams(label);
    if (!isPlainObject(icon)) throw validationError(`${labelText} must be an object.`, "project.error.objectField", labelParams);
    const mimeType = String(icon.mimeType || "").toLowerCase();
    if (mimeType !== "image/png" && mimeType !== "image/webp") {
      throw validationError(`${labelText} must be a PNG or WebP image.`, "project.error.customIconType", labelParams);
    }
    if (!isCustomIconDataUrl(icon.dataUrl)) {
      throw validationError(`${labelText} must be a PNG/WebP data URL.`, "project.error.customIconDataUrl", labelParams);
    }
    const width = Number(icon.width);
    const height = Number(icon.height);
    const size = Number(icon.size);
    if (!Number.isFinite(width) || width < 8 || width > 512) throw validationError(`${labelText} width must be 8-512 pixels.`, "project.error.customIconWidth", labelParams);
    if (!Number.isFinite(height) || height < 8 || height > 512) throw validationError(`${labelText} height must be 8-512 pixels.`, "project.error.customIconHeight", labelParams);
    if (!Number.isFinite(size) || size < 1 || size > 256 * 1024) throw validationError(`${labelText} must be 256 KB or smaller.`, "project.error.customIconSize", labelParams);
  }

  function validateAndNormalizeProject(rawProject, options = {}) {
    const currentVersion = Number(options.currentVersion) || 1;
    const boundarySources = options.boundarySources || {};
    const mapStylePresets = options.mapStylePresets || {};
    const defaultBoundary = options.defaultBoundary || Object.keys(boundarySources)[0] || "canada";
    const defaultMapStyle = options.defaultMapStyle || Object.keys(mapStylePresets)[0] || "";
    const normalizeLanguage = options.normalizeLanguage || (value => value === "fr" ? "fr" : "en");

    if (!isPlainObject(rawProject)) throw validationError("Project file must contain a JSON object.", "project.error.jsonObject");
    const version = rawProject.version === undefined ? 1 : Number(rawProject.version);
    if (!Number.isInteger(version) || version < 1) throw validationError("Project version must be a positive whole number.", "project.error.versionNumber");
    if (version > currentVersion) {
      throw validationError(
        `This project uses version ${version}. This Plotypus build supports up to version ${currentVersion}.`,
        "project.error.versionUnsupported",
        { version, currentVersion }
      );
    }
    if (!Array.isArray(rawProject.rows)) throw validationError("Project file is missing its rows array.", "project.error.rowsMissing");
    if (rawProject.rows.length > 10000) throw validationError("Project file contains more than 10,000 rows and was not loaded.", "project.error.rowsTooMany");
    rawProject.rows.forEach((row, index) => {
      if (!isPlainObject(row)) throw validationError(`Project row ${index + 1} must be an object.`, "project.error.rowObject", { index: index + 1 });
    });
    if (rawProject.categories !== undefined && !Array.isArray(rawProject.categories)) {
      throw validationError("Project categories must be an array.", "project.error.categoriesArray");
    }
    if (Array.isArray(rawProject.categories)) {
      rawProject.categories.forEach((category, index) => {
        if (!isPlainObject(category)) throw validationError(`Project category ${index + 1} must be an object.`, "project.error.categoryObject", { index: index + 1 });
        validateColour(category.colour, fieldLabel(`Project category ${index + 1} colour`, "project.error.label.category.colour", { index: index + 1 }));
        validateColour(category.stroke, fieldLabel(`Project category ${index + 1} stroke`, "project.error.label.category.stroke", { index: index + 1 }));
        validateCustomIcon(category.customIcon, fieldLabel(`Project category ${index + 1} custom icon`, "project.error.label.category.customicon", { index: index + 1 }));
      });
    }
    if (rawProject.settings !== undefined && !isPlainObject(rawProject.settings)) {
      throw validationError("Project settings must be an object.", "project.error.settingsObject");
    }
    if (rawProject.languageLayouts !== undefined && !isPlainObject(rawProject.languageLayouts)) {
      throw validationError("Project language layouts must be an object.", "project.error.languageLayoutsObject");
    }

    [
      "chromeTranslations",
      "regionVisibility",
      "regionFills",
      "regionColourOverrides",
      "regionValues",
      "regionStatuses",
      "manualLabelPositions",
      "manualBoxPositions"
    ].forEach(field => {
      if (rawProject[field] !== undefined && !isPlainObject(rawProject[field])) {
        throw validationError(`Project field '${field}' must be an object.`, "project.error.fieldObject", { field });
      }
    });
    if (rawProject.regionFills !== undefined) {
      Object.entries(rawProject.regionFills).forEach(([regionId, colour]) => {
        validateColour(colour, fieldLabel(`Project region fill '${regionId}'`, "project.error.label.regionFill", { id: regionId }));
      });
    }

    return {
      ...rawProject,
      version,
      boundary: Object.prototype.hasOwnProperty.call(boundarySources, rawProject.boundary) ? rawProject.boundary : defaultBoundary,
      mapStyle: Object.prototype.hasOwnProperty.call(mapStylePresets, rawProject.mapStyle) ? rawProject.mapStyle : defaultMapStyle,
      mapLanguage: normalizeLanguage(rawProject.mapLanguage || rawProject.settings && rawProject.settings.mapLanguage),
      settings: rawProject.settings || {},
      categories: rawProject.categories || [],
      rows: rawProject.rows
    };
  }

  return { validateAndNormalizeProject };
});
