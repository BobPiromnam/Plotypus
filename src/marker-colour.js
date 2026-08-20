(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PLOTYPUS_MARKER_COLOUR = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function isHexColour(value) {
    return typeof value === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
  }

  function toHexByte(value) {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
  }

  function detectDominantColour(imageData, options = {}) {
    const pixels = imageData && imageData.data ? imageData.data : imageData;
    if (!pixels || typeof pixels.length !== "number" || pixels.length < 4) return "";

    const alphaThreshold = Math.max(0, Math.min(255, Number(options.alphaThreshold) || 32));
    const bucketSize = Math.max(8, Math.min(128, Number(options.bucketSize) || 32));
    const buckets = new Map();

    for (let index = 0; index + 3 < pixels.length; index += 4) {
      const alpha = Number(pixels[index + 3]) || 0;
      if (alpha < alphaThreshold) continue;
      const red = Number(pixels[index]) || 0;
      const green = Number(pixels[index + 1]) || 0;
      const blue = Number(pixels[index + 2]) || 0;
      const key = `${Math.floor(red / bucketSize)}:${Math.floor(green / bucketSize)}:${Math.floor(blue / bucketSize)}`;
      const weight = alpha / 255;
      const bucket = buckets.get(key) || { weight: 0, red: 0, green: 0, blue: 0 };
      bucket.weight += weight;
      bucket.red += red * weight;
      bucket.green += green * weight;
      bucket.blue += blue * weight;
      buckets.set(key, bucket);
    }

    let winner = null;
    buckets.forEach(bucket => {
      if (!winner || bucket.weight > winner.weight) winner = bucket;
    });
    if (!winner || winner.weight <= 0) return "";

    return `#${toHexByte(winner.red / winner.weight)}${toHexByte(winner.green / winner.weight)}${toHexByte(winner.blue / winner.weight)}`;
  }

  function resolveLeaderLineColour(row, category, fallback = "#333333") {
    const rowColour = row && row.leaderLineColour;
    if (isHexColour(rowColour)) return rowColour;
    const customIcon = category && category.customIcon;
    if (customIcon && customIcon.matchLeaderLines === true && isHexColour(customIcon.leaderColour)) {
      return customIcon.leaderColour;
    }
    return isHexColour(fallback) ? fallback : "#333333";
  }

  return Object.freeze({
    detectDominantColour,
    resolveLeaderLineColour
  });
});
