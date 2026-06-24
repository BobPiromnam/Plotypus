(function (global) {
  "use strict";

  function qualityMetricItem(label, value, options) {
    const { state = "neutral", description = "", escapeHtml } = options || {};
    const metricState = state === "ok" ? "ok" : (state === "warning" || state === "review") ? "review" : "info";
    return `
      <div class="properties-metric" data-state="${escapeHtml(metricState)}">
        <span>
          <span class="metric-label">${escapeHtml(label)}</span>
          ${description ? `<small>${escapeHtml(description)}</small>` : ""}
        </span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function qualityCard(label, value, state, description, detail, action, escapeHtml) {
    const safeState = state === "ok" ? "ok" : state === "danger" ? "danger" : "review";
    return `
      <article class="quality-card" data-state="${safeState}">
        <header>
          <h3>${escapeHtml(label)}</h3>
          <strong>${escapeHtml(value)}</strong>
        </header>
        <div class="quality-card-rule" aria-hidden="true"><span></span></div>
        <p>${escapeHtml(description)}</p>
        ${(detail || action) ? `
          <footer>
            <span>${escapeHtml(detail || "")}</span>
            ${action ? `<button type="button" data-property-action="${escapeHtml(action.name)}">${escapeHtml(action.label)}</button>` : ""}
          </footer>
        ` : ""}
      </article>
    `;
  }

  function renderFurniturePropertyControls(options) {
    const { key, label, visible, escapeHtml } = options || {};
    return `
      <div class="properties-form" data-property-kind="furniture" data-box-key="${escapeHtml(key)}">
        <label class="toolbar-check">
          <input type="checkbox" data-property-field="boxVisible"${visible ? " checked" : ""}>
          <span>Show ${escapeHtml(label)}</span>
        </label>
        <div class="properties-actions">
          <button type="button" data-property-action="reset-box" data-box-key="${escapeHtml(key)}">Reset position and size</button>
        </div>
        <p class="properties-muted">Drag the box on the map for manual placement, or use reset to return it to the automatic furniture layout.</p>
      </div>
    `;
  }

  function renderDocumentPropertyControls(options) {
    const {
      missingDetails = 0,
      titleMissing = false,
      textMissing = false,
      selectOptions = {},
      escapeHtml,
      iconSvg
    } = options || {};
    return `
      <div class="properties-form" data-property-kind="document">
        <section class="document-property-section">
          <h3>Map style</h3>
          <label class="properties-field-group">
            <select data-map-proxy="mapStylePresetInput">
              ${selectOptions.mapStyle || ""}
            </select>
          </label>
        </section>
        <section class="document-property-section">
          <h3>Map size</h3>
          <label class="properties-field-group">
            Page preset
            <select data-layout-proxy="bookSizeInput">
              ${selectOptions.bookSize || ""}
            </select>
          </label>
          <label class="properties-field-group">
            Canvas size
            <select data-layout-proxy="imageSizeInput">
              ${selectOptions.imageSize || ""}
            </select>
          </label>
        </section>
        <section class="document-property-section">
          <h3>Map details & accessibility</h3>
          <div class="map-details-status-card" data-state="${missingDetails ? "review" : "ok"}">
            <div class="map-details-status-row">
              <span>Title (required)</span>
              <strong>${titleMissing ? "Missing" : "Complete"}</strong>
            </div>
            <div class="map-details-status-row">
              <span>Text version (required)</span>
              <strong>${textMissing ? "Missing" : "Complete"}</strong>
            </div>
            <button type="button" data-property-action="open-map-details">${iconSvg("file-text")} Open Map details</button>
          </div>
          <p class="properties-muted">Bilingual title & text version for the web page and Word document - not embedded in the map export.</p>
        </section>
      </div>
    `;
  }

  function renderProjectDataPropertyControls(options) {
    const { summary, qualityMetricItem: metricItem } = options || {};
    return `
      <div class="properties-form" data-property-kind="project-data">
        <div class="properties-metric-list">
          ${metricItem("Rows", String(summary.total), summary.total ? "ok" : "info", "Project records in the table.")}
          ${metricItem("Mapped", String(summary.mapped), summary.mapped ? "ok" : "info", "Rows with longitude and latitude.")}
          ${metricItem("Callouts", String(summary.callouts), summary.callouts ? "review" : "ok", "Rows without coordinates.")}
          ${metricItem("Coordinate issues", String(summary.coordinateIssues), summary.coordinateIssues ? "review" : "ok", "Rows with only one coordinate.")}
        </div>
        <div class="properties-actions">
          <button type="button" class="primary" data-property-action="add-project-row">Add row</button>
          <button type="button" data-property-action="import-csv">Import CSV</button>
        </div>
      </div>
    `;
  }

  function renderRowPropertyControls(options) {
    const {
      row,
      kind = "row",
      labelKey = "",
      manual = false,
      priority = 0,
      typeOptions = "",
      status = "",
      escapeHtml
    } = options || {};
    const rowId = escapeHtml(row.rowId || "");
    const safeLabelKey = escapeHtml(labelKey);
    const numericStyle = "font-family: &quot;IBM Plex Mono&quot;, ui-monospace, monospace; text-align: right; font-variant-numeric: tabular-nums;";
    return `
      <div class="properties-form" data-property-kind="${escapeHtml(kind)}" data-row-id="${rowId}" data-label-key="${safeLabelKey}">
        <div class="properties-record-status">${escapeHtml(status)}</div>
        <label>
          Project name
          <input type="text" data-property-field="name" value="${escapeHtml(row.name || "")}">
        </label>
        <label>
          Project name (French)
          <textarea data-property-field="nameFr" rows="2" placeholder="French project title">${escapeHtml(row.nameFr || "")}</textarea>
        </label>
        <label>
          Priority
          <input type="number" min="0" max="5" step="1" data-property-field="priority" style="${numericStyle}" value="${priority}">
        </label>
        <label>
          Type
          <select data-property-field="type">
            ${typeOptions}
          </select>
        </label>
        <div class="properties-inline-grid">
          <label>
            Longitude
            <input type="text" inputmode="decimal" data-property-field="lon" style="${numericStyle}" value="${escapeHtml(row.lon === "" ? "" : String(row.lon))}">
          </label>
          <label>
            Latitude
            <input type="text" inputmode="decimal" data-property-field="lat" style="${numericStyle}" value="${escapeHtml(row.lat === "" ? "" : String(row.lat))}">
          </label>
        </div>
        <label class="toolbar-check">
          <input type="checkbox" data-property-field="hideLine"${row.hideLine ? " checked" : ""}>
          <span>Hide leader line</span>
        </label>
        <label class="toolbar-check">
          <input type="checkbox" data-property-field="elbowLeader"${row.elbowLeader ? " checked" : ""}>
          <span>Use elbow leader</span>
        </label>
        <details>
          <summary>Advanced - footnote, label nudge</summary>
          <div class="properties-form">
            <label>
              Footnote
              <input type="text" maxlength="2" pattern="[A-Za-z0-9]*|[*]" data-property-field="footnote" value="${escapeHtml(row.footnote || "")}">
            </label>
            <div class="properties-actions">
              <button type="button" data-property-action="reset-label" data-label-key="${safeLabelKey}"${manual ? "" : " disabled"}>Reset label position</button>
              <button type="button" data-property-action="focus-row" data-row-id="${rowId}">Edit row in table</button>
            </div>
          </div>
        </details>
      </div>
    `;
  }

  function renderMapPropertyControls(options) {
    const { regionSummaryText = "", selectOptions = {}, escapeHtml } = options || {};
    return `
      <div class="properties-form" data-property-kind="map">
        <label>
          Map boundary
          <select data-map-proxy="boundaryInput">
            ${selectOptions.boundary || ""}
          </select>
        </label>
        <label>
          Region preset
          <select data-map-proxy="regionPresetInput">
            ${selectOptions.regionPreset || ""}
          </select>
        </label>
        <label>
          Page preset
          <select data-layout-proxy="bookSizeInput">
            ${selectOptions.bookSize || ""}
          </select>
        </label>
        <label>
          Canvas size
          <select data-layout-proxy="imageSizeInput">
            ${selectOptions.imageSize || ""}
          </select>
        </label>
      </div>
    `;
  }

  function renderQualityPropertyControls(options) {
    const {
      rowSummary,
      regionSummary,
      qualitySummary,
      report,
      translationSummary,
      metadataMissing = 0,
      reviewCount = 0,
      verdict = "",
      verdictState = "info",
      qualityMetricItem: metricItem,
      escapeHtml
    } = options || {};
    const overlapCount = report ? Number(report.overlaps || 0) : 0;
    return `
      <div class="properties-form" data-property-kind="quality">
        <h3>Threshold</h3>
        <label>Warn above<input type="text" value="4 overlaps" readonly></label>
        <p class="properties-muted">Use Locate to step through each overlapping pair on the map. Fixing them does not re-render until you run auto-place.</p>
        <p class="quality-properties-verdict" data-state="${escapeHtml(verdictState)}">${escapeHtml(overlapCount ? `${overlapCount} label overlaps found.` : "No label overlaps found.")}</p>
        <div class="properties-actions">
          <button type="button" class="primary-action" data-property-action="open-map">${overlapCount ? "Locate first overlap" : "Open map"}</button>
          ${metadataMissing ? '<button type="button" data-property-action="open-map-details">Complete map details</button>' : ""}
          ${rowSummary.coordinateIssues ? '<button type="button" data-property-action="open-project-missing">Review coordinate issues</button>' : ""}
          ${rowSummary.callouts ? '<button type="button" data-property-action="open-project-callouts">Review callouts</button>' : ""}
          ${translationSummary.missing ? '<button type="button" data-property-action="open-translations-missing">Review French strings</button>' : ""}
          ${regionSummary.state === "warning" ? '<button type="button" data-property-action="open-map-regions">Review regions</button>' : ""}
          ${qualitySummary.issues ? '<button type="button" data-property-action="open-map">Review map placement</button>' : ""}
        </div>
      </div>
    `;
  }

  function renderTranslationPropertyControls(options) {
    const { summary, escapeHtml, qualityMetricItem: metricItem } = options || {};
    const state = summary.missing ? "review" : "ok";
    return `
      <div class="properties-form" data-property-kind="translation">
        <p class="properties-muted">Author French strings once, then switch the language used for the map and exports.</p>
        <div class="properties-metric-list">
          ${metricItem("French complete", `${summary.complete} / ${summary.total}`, state, "Strings with French values across project titles, categories, and map chrome.")}
          ${metricItem("Missing FR", String(summary.missing), state, "Strings that will fall back to English in French output.")}
        </div>
        <div class="properties-actions">
          <button type="button" data-property-action="open-translations-missing">Show missing French</button>
          <button type="button" data-property-action="paste-translations">Paste translation column</button>
        </div>
      </div>
    `;
  }

  function renderTranslationEntryPropertyControls(options) {
    const { entry, escapeHtml } = options || {};
    if (!entry) return '<p class="properties-muted">Select a translation row to edit its English and French strings.</p>';
    return `
      <div class="properties-form" data-property-kind="translation-entry" data-entry-id="${escapeHtml(entry.id)}">
        <h3>Selected string</h3>
        <label>English<input data-translation-property="en" type="text" value="${escapeHtml(entry.ref)}"></label>
        <label>French<input data-translation-property="fr" type="text" value="${escapeHtml(entry.fr || "")}" placeholder="-"></label>
        <p class="properties-muted">Map language is set in the command bar and is the only place that changes printed output.</p>
      </div>
    `;
  }

  function renderCategoryPropertyControls(options) {
    const { category, markerShapes = [], escapeHtml, markerShapeIcon } = options || {};
    if (!category) return '<p class="properties-muted">Add a category to define its marker and legend label.</p>';
    const customIcon = category.customIcon || null;
    const iconDetails = customIcon
      ? `${escapeHtml(customIcon.name || "custom-marker")} · ${escapeHtml(String(customIcon.width))} x ${escapeHtml(String(customIcon.height))} px`
      : "PNG/WebP only · 256 KB max · 8-512 px";
    const shapeOptions = markerShapes.map(shape => `
          <label class="category-shape-option${shape.value === category.shape ? " is-selected" : ""}">
            <input data-category-field="shape" type="radio" name="category-shape-${escapeHtml(category.id)}" value="${escapeHtml(shape.value)}"${shape.value === category.shape ? " checked" : ""}>
            ${typeof markerShapeIcon === "function" ? markerShapeIcon(shape.value, category) : ""}
            <span>${escapeHtml(shape.label)}</span>
          </label>`).join("");
    return `
      <div class="properties-form" data-property-kind="category" data-category-id="${escapeHtml(category.id)}">
        <h3>Legend label</h3>
        <label>English<input data-category-field="label" type="text" value="${escapeHtml(category.label)}"></label>
        <label>Francais<input data-category-field="labelFr" type="text" value="${escapeHtml(category.labelFr || "")}"></label>
        <p class="properties-muted properties-dot-note">Both render per the map language.</p>
        <h3>Marker shape (map output)</h3>
        <div class="category-shape-grid">${shapeOptions}</div>
        <label>Marker colour<input data-category-field="colour" type="color" value="${escapeHtml(category.colour)}"></label>
        <div class="custom-icon-dropzone${customIcon ? " is-active" : ""}">
          <input data-category-icon-upload type="file" accept="image/png,image/webp" hidden>
          <div class="custom-icon-summary">
            <span class="custom-icon-preview" aria-hidden="true">
              ${customIcon ? `<img src="${escapeHtml(customIcon.dataUrl)}" alt="">` : typeof markerShapeIcon === "function" ? markerShapeIcon(category.shape, category) : ""}
            </span>
            <span>
              <strong>${customIcon ? "Custom icon active" : "Upload custom icon"}</strong>
              <span>${iconDetails}</span>
            </span>
          </div>
          <div class="custom-icon-actions">
            <button type="button" class="ghost-button" data-property-action="upload-category-icon">${customIcon ? "Replace icon" : "Upload icon"}</button>
            ${customIcon ? '<button type="button" class="ghost-button" data-property-action="remove-category-icon">Remove icon</button>' : ""}
          </div>
          <span class="custom-icon-note">Icons are embedded in saved projects and exports for offline use. SVG upload is not accepted.</span>
        </div>
        <h3>Size</h3>
        <div class="properties-inline-grid">
          <label>Marker<input data-category-field="markerSize" type="number" min="4" max="30" step="1" value="${escapeHtml(category.markerSize)}"></label>
          <label>Legend<input data-category-field="lineWidth" type="number" min="1" max="10" step="0.5" value="${escapeHtml(category.lineWidth)}"></label>
        </div>
        <p class="properties-muted">Marker size affects map points. Legend size preserves relative weight in the exported key.</p>
      </div>`;
  }

  function renderRegionPropertyControls(options) {
    const { region, pluralize, escapeHtml } = options || {};
    const presetLabel = region.colourSource === "Auto by value" ? "Sequential" : "Manual";
    return `
      <div class="properties-form" data-property-kind="region" data-region-id="${escapeHtml(region.id)}">
        <h3>Inclusion</h3>
        <label class="toolbar-check region-property-switch">
          <span>
            <strong>Include in map</strong>
            <small>${escapeHtml(region.count)} ${pluralize(region.count, "project point")} fall here</small>
          </span>
          <input type="checkbox" data-region-property="included"${region.included ? " checked" : ""}>
        </label>
        <h3>Colour</h3>
        <div class="properties-inline-grid">
          <label>Order<input type="number" step="any" data-region-property="value" value="${escapeHtml(region.value === "" ? "" : String(region.value))}"></label>
          <label>Preset<input type="text" value="${escapeHtml(presetLabel)}" readonly></label>
        </div>
        <label>Fill colour<input data-region-property="colour" type="color" value="${escapeHtml(region.colour)}"></label>
        <p class="properties-muted">${escapeHtml(region.valueSource)} value · ${escapeHtml(region.colourSource)} colour</p>
      </div>
    `;
  }

  global.PLOTYPUS_PROPERTIES = Object.freeze({
    qualityCard,
    qualityMetricItem,
    renderCategoryPropertyControls,
    renderDocumentPropertyControls,
    renderFurniturePropertyControls,
    renderMapPropertyControls,
    renderProjectDataPropertyControls,
    renderQualityPropertyControls,
    renderRegionPropertyControls,
    renderRowPropertyControls,
    renderTranslationEntryPropertyControls,
    renderTranslationPropertyControls
  });
})(window);
