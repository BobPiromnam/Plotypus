(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PLOTYPUS_NUMBERED_MAP = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalizeNumber(value) {
    const text = String(value ?? "").trim();
    if (!/^[0-9]+$/.test(text)) return "";
    const number = Number(text);
    return Number.isSafeInteger(number) && number > 0 ? String(number) : "";
  }

  // Assign once, in source order. Rendering, filtering and sorting never assign numbers.
  function assignMissingNumbers(rows) {
    const used = new Set(rows.map(row => normalizeNumber(row.mapNumber)).filter(Boolean));
    let next = 1;
    return rows.map(row => {
      if (String(row.mapNumber ?? "").trim()) return { ...row };
      while (used.has(String(next))) next++;
      const mapNumber = String(next++);
      used.add(mapNumber);
      return { ...row, mapNumber };
    });
  }

  function findNumberIssues(rows) {
    const groups = new Map();
    const invalid = [];
    rows.forEach(row => {
      const number = normalizeNumber(row.mapNumber);
      if (!number) { invalid.push(row); return; }
      if (!groups.has(number)) groups.set(number, []);
      groups.get(number).push(row);
    });
    const conflicts = [];
    groups.forEach((group, number) => {
      const differs = field => new Set(group.map(row => String(row[field] || "").trim()).filter(Boolean)).size > 1;
      if (["name", "nameFr", "type"].some(differs)) conflicts.push({ number, rows: group });
    });
    return { invalid, conflicts };
  }

  function companionRows(rows, language, categoryText) {
    const entries = new Map();
    rows.forEach(row => {
      const number = normalizeNumber(row.mapNumber) || String(row.mapNumber || "");
      const title = String(language === "fr" ? row.nameFr || "" : row.name || "");
      const category = String(categoryText(row.type, language) || "");
      const key = JSON.stringify([number, title, category]);
      if (!entries.has(key)) entries.set(key, { number, title, category });
    });
    return Array.from(entries.values()).sort((a, b) => Number(a.number) - Number(b.number) || a.title.localeCompare(b.title, language));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function companionHtml(entries, options) {
    const { language, title, headers, note = "" } = options;
    return `<!doctype html><html lang="${language === "fr" ? "fr" : "en"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>
      body { font: 11pt/1.5 Arial,sans-serif; color: #222; max-width: 70em; margin: 2em auto; padding: 0 1em; }
      h1 { font-size: 18pt; } table { width: 100%; border-collapse: collapse; } th,td { padding: .5em .75em; border: 1px solid #777; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { background: #eee; } th:first-child { font-variant-numeric: tabular-nums; width: 5em; } caption { text-align: left; font-weight: bold; margin-bottom: .75em; } thead { display: table-header-group; } tr { break-inside: avoid; }
      @media print { body { max-width: none; margin: 0; } }
    </style><body><h1>${escapeHtml(title)}</h1>${note ? `<p>${escapeHtml(note)}</p>` : ""}<table><thead><tr>${headers.map(header => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${entries.map(entry => `<tr><th scope="row">${escapeHtml(entry.number)}</th><td>${escapeHtml(entry.title)}</td><td>${escapeHtml(entry.category)}</td></tr>`).join("")}</tbody></table></body></html>`;
  }

  function badgeRect(badge, padding = 0) {
    const radius = badge.badgeRadius + padding;
    return { x0: badge.labelX - radius, y0: badge.labelY - radius, x1: badge.labelX + radius, y1: badge.labelY + radius, centerX: badge.labelX, centerY: badge.labelY };
  }

  function overlap(left, right) {
    return left.x0 < right.x1 && left.x1 > right.x0 && left.y0 < right.y1 && left.y1 > right.y0;
  }

  function layoutBadges(points, options) {
    const { width, height, sizeForRow, manual = {}, obstacles = [], autoPlace = false } = options;
    const placed = [];
    // Saved placements are obstacles before new badges are placed, regardless of row order.
    const reserved = points.filter(row => manual[`badge:row:${row.rowId}`]).map(row => {
      const position = manual[`badge:row:${row.rowId}`];
      return badgeRect({ labelX: position.x, labelY: position.y, badgeRadius: Math.max(10, sizeForRow(row), (normalizeNumber(row.mapNumber) || "?").length * 3.5 + 4) }, 2);
    });
    points.forEach(row => {
      const badgeText = normalizeNumber(row.mapNumber) || "?";
      const badgeRadius = Math.max(10, sizeForRow(row), badgeText.length * 3.5 + 4);
      const labelKey = `badge:row:${row.rowId}`;
      const saved = !autoPlace && manual[labelKey];
      const badge = { ...row, numberedBadge: true, badgeText, badgeRadius, labelKey, layoutId: `badge-${row.rowId}`, labelSide: "top", labelX: saved ? saved.x : row.x, labelY: saved ? saved.y : row.y, textWidth: badgeRadius * 2, textHeight: badgeRadius * 2, lineHeight: badgeRadius * 2, lines: [], footnote: "" };
      if (!saved) {
        const candidates = [{ x: row.x, y: row.y }];
        for (const ring of [2.5, 3.6, 5, 7]) {
          for (let index = 0; index < 16; index++) {
            const angle = index * Math.PI / 8;
            candidates.push({ x: row.x + Math.cos(angle) * badgeRadius * ring, y: row.y + Math.sin(angle) * badgeRadius * ring });
          }
        }
        const blocked = [...obstacles.map(item => item.rect || item), ...placed.map(item => badgeRect(item, 2)), ...(!autoPlace ? reserved : [])];
        const candidate = candidates.find(position => {
          const rect = badgeRect({ ...badge, labelX: position.x, labelY: position.y }, 2);
          return rect.x0 >= 0 && rect.y0 >= 0 && rect.x1 <= width && rect.y1 <= height && !blocked.some(other => overlap(rect, other));
        }) || candidates[0];
        badge.labelX = candidate.x;
        badge.labelY = candidate.y;
      }
      badge.labelX = Math.max(badgeRadius + 2, Math.min(width - badgeRadius - 2, badge.labelX));
      badge.labelY = Math.max(badgeRadius + 2, Math.min(height - badgeRadius - 2, badge.labelY));
      placed.push(badge);
    });
    return placed;
  }

  return Object.freeze({ normalizeNumber, assignMissingNumbers, findNumberIssues, companionRows, companionHtml, badgeRect, layoutBadges });
});
