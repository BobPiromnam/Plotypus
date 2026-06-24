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

  function validateColour(value, label) {
    if (value !== undefined && !isHexColour(value)) {
      throw new Error(`${label} must be a hex colour such as #444444.`);
    }
  }

  function isCustomIconDataUrl(value) {
    return typeof value === "string" && /^data:image\/(?:png|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  function validateCustomIcon(icon, label) {
    if (icon === undefined || icon === null) return;
    if (!isPlainObject(icon)) throw new Error(`${label} must be an object.`);
    const mimeType = String(icon.mimeType || "").toLowerCase();
    if (mimeType !== "image/png" && mimeType !== "image/webp") {
      throw new Error(`${label} must be a PNG or WebP image.`);
    }
    if (!isCustomIconDataUrl(icon.dataUrl)) {
      throw new Error(`${label} must be a PNG/WebP data URL.`);
    }
    const width = Number(icon.width);
    const height = Number(icon.height);
    const size = Number(icon.size);
    if (!Number.isFinite(width) || width < 8 || width > 512) throw new Error(`${label} width must be 8-512 pixels.`);
    if (!Number.isFinite(height) || height < 8 || height > 512) throw new Error(`${label} height must be 8-512 pixels.`);
    if (!Number.isFinite(size) || size < 1 || size > 256 * 1024) throw new Error(`${label} must be 256 KB or smaller.`);
  }

  function validateAndNormalizeProject(rawProject, options = {}) {
    const currentVersion = Number(options.currentVersion) || 1;
    const boundarySources = options.boundarySources || {};
    const mapStylePresets = options.mapStylePresets || {};
    const defaultBoundary = options.defaultBoundary || Object.keys(boundarySources)[0] || "canada";
    const defaultMapStyle = options.defaultMapStyle || Object.keys(mapStylePresets)[0] || "";
    const normalizeLanguage = options.normalizeLanguage || (value => value === "fr" ? "fr" : "en");

    if (!isPlainObject(rawProject)) throw new Error("Project file must contain a JSON object.");
    const version = rawProject.version === undefined ? 1 : Number(rawProject.version);
    if (!Number.isInteger(version) || version < 1) throw new Error("Project version must be a positive whole number.");
    if (version > currentVersion) {
      throw new Error(`This project uses version ${version}. This Plotypus build supports up to version ${currentVersion}.`);
    }
    if (!Array.isArray(rawProject.rows)) throw new Error("Project file is missing its rows array.");
    if (rawProject.rows.length > 10000) throw new Error("Project file contains more than 10,000 rows and was not loaded.");
    rawProject.rows.forEach((row, index) => {
      if (!isPlainObject(row)) throw new Error(`Project row ${index + 1} must be an object.`);
    });
    if (rawProject.categories !== undefined && !Array.isArray(rawProject.categories)) {
      throw new Error("Project categories must be an array.");
    }
    if (Array.isArray(rawProject.categories)) {
      rawProject.categories.forEach((category, index) => {
        if (!isPlainObject(category)) throw new Error(`Project category ${index + 1} must be an object.`);
        validateColour(category.colour, `Project category ${index + 1} colour`);
        validateColour(category.stroke, `Project category ${index + 1} stroke`);
        validateCustomIcon(category.customIcon, `Project category ${index + 1} custom icon`);
      });
    }
    if (rawProject.settings !== undefined && !isPlainObject(rawProject.settings)) {
      throw new Error("Project settings must be an object.");
    }
    if (rawProject.languageLayouts !== undefined && !isPlainObject(rawProject.languageLayouts)) {
      throw new Error("Project language layouts must be an object.");
    }

    [
      "chromeTranslations",
      "regionVisibility",
      "regionFills",
      "regionColourOverrides",
      "regionValues",
      "manualLabelPositions",
      "manualBoxPositions"
    ].forEach(field => {
      if (rawProject[field] !== undefined && !isPlainObject(rawProject[field])) {
        throw new Error(`Project field '${field}' must be an object.`);
      }
    });
    if (rawProject.regionFills !== undefined) {
      Object.entries(rawProject.regionFills).forEach(([regionId, colour]) => {
        validateColour(colour, `Project region fill '${regionId}'`);
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
