(function (global) {
  "use strict";

  function translator(options) {
    return options && typeof options.t === "function" ? options.t : (key, params) => {
      let value = key;
      Object.entries(params || {}).forEach(([name, replacement]) => {
        value = value.replace(new RegExp(`\\{${name}\\}`, "g"), String(replacement));
      });
      return value;
    };
  }

  function propertyOriginIcon(options, origin = "edit") {
    const { escapeHtml } = options || {};
    const t = translator(options);
    const iconName = origin === "auto" ? "wand" : "pencil";
    const labelKey = origin === "auto" ? "fieldOrigin.automatic" : "fieldOrigin.editable";
    const label = escapeHtml(t(labelKey));
    const iconSvg = options && typeof options.iconSvg === "function"
      ? options.iconSvg(iconName, "field-origin-svg")
      : "";
    return `<span class="field-origin-icon field-origin-icon-${escapeHtml(origin)}" title="${label}" aria-label="${label}">${iconSvg}</span>`;
  }

  function propertyFieldLabel(options, label, origin = "edit") {
    const { escapeHtml } = options || {};
    return `<span class="properties-field-label">${escapeHtml(label)} ${propertyOriginIcon(options, origin)}</span>`;
  }

  function qualityMetricItem(label, value, options) {
    const { state = "neutral", description = "", escapeHtml } = options || {};
    const metricState = state === "ok" ? "ok" : (state === "warning" || state === "review") ? "review" : "info";
    return `
      <div class="properties-metric" data-state="${escapeHtml(metricState)}">
        <span>
          <span class="metric-label">${escapeHtml(label)} ${propertyOriginIcon(options, "auto")}</span>
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
    const t = translator(options);
    return `
      <div class="properties-form" data-property-kind="furniture" data-box-key="${escapeHtml(key)}">
        <label class="toolbar-check">
          <input type="checkbox" data-property-field="boxVisible"${visible ? " checked" : ""}>
          <span>${propertyFieldLabel(options, t("properties.furniture.showBox", { label }))}</span>
        </label>
        <div class="properties-actions">
          <button type="button" data-property-action="reset-box" data-box-key="${escapeHtml(key)}">${escapeHtml(t("properties.button.resetPositionSize"))}</button>
        </div>
        <p class="properties-muted">${escapeHtml(t("properties.helper.furniture"))}</p>
      </div>
    `;
  }

  function renderDocumentPropertyControls(options) {
    const {
      missingDetails = 0,
      titleMissing = false,
      textMissing = false,
      selectOptions = {},
      values = {},
      escapeHtml,
      iconSvg
    } = options || {};
    const t = translator(options);
    return `
      <div class="properties-form" data-property-kind="document">
        <section class="document-property-section">
          <h3>${escapeHtml(t("properties.section.mapStyle"))}</h3>
          <label class="properties-field-group">
            <select data-map-proxy="mapStylePresetInput">
              ${selectOptions.mapStyle || ""}
            </select>
          </label>
        </section>
        <section class="document-property-section">
          <h3>${escapeHtml(t("properties.section.mapSize"))}</h3>
          <label class="properties-field-group">
            ${propertyFieldLabel(options, t("properties.field.pagePreset"))}
            <select data-layout-proxy="bookSizeInput">
              ${selectOptions.bookSize || ""}
            </select>
          </label>
          <label class="properties-field-group">
            ${propertyFieldLabel(options, t("properties.field.canvasSize"))}
            <select data-layout-proxy="imageSizeInput">
              ${selectOptions.imageSize || ""}
            </select>
          </label>
          <label class="properties-field-group">
            ${propertyFieldLabel(options, t("properties.field.defaultCharactersPerLine"))}
            <input type="number" min="12" max="42" step="1" data-layout-proxy="labelCharsInput" value="${escapeHtml(values.labelChars || "")}">
          </label>
        </section>
        <section class="document-property-section">
          <h3>${escapeHtml(t("properties.section.mapDetails"))}</h3>
          <div class="map-details-status-card" data-state="${missingDetails ? "review" : "ok"}">
            <div class="map-details-status-row">
              <span>${escapeHtml(t("properties.status.titleRequired"))}</span>
              <strong>${escapeHtml(titleMissing ? t("properties.status.missing") : t("properties.status.complete"))}</strong>
            </div>
            <div class="map-details-status-row">
              <span>${escapeHtml(t("properties.status.textRequired"))}</span>
              <strong>${escapeHtml(textMissing ? t("properties.status.missing") : t("properties.status.complete"))}</strong>
            </div>
            <button type="button" data-property-action="open-map-details">${iconSvg("file-text")} ${escapeHtml(t("properties.button.openMapDetails"))}</button>
          </div>
          <p class="properties-muted">${escapeHtml(t("properties.helper.mapDetails"))}</p>
        </section>
      </div>
    `;
  }

  function renderProjectDataPropertyControls(options) {
    const { summary, qualityMetricItem: metricItem, escapeHtml } = options || {};
    const t = translator(options);
    return `
      <div class="properties-form" data-property-kind="project-data">
        <div class="properties-metric-list">
          ${metricItem(t("properties.metric.rows"), String(summary.total), summary.total ? "ok" : "info", t("properties.metric.rows.description"))}
          ${metricItem(t("properties.metric.mapped"), String(summary.mapped), summary.mapped ? "ok" : "info", t("properties.metric.mapped.description"))}
          ${metricItem(t("properties.metric.callouts"), String(summary.callouts), summary.callouts ? "review" : "ok", t("properties.metric.callouts.description"))}
          ${metricItem(t("properties.metric.coordinateIssues"), String(summary.coordinateIssues), summary.coordinateIssues ? "review" : "ok", t("properties.metric.coordinateIssues.description"))}
        </div>
        <div class="properties-actions">
          <button type="button" class="primary" data-property-action="add-project-row">${escapeHtml(t("properties.button.addRow"))}</button>
          <button type="button" data-property-action="import-csv">${escapeHtml(t("properties.button.importCsv"))}</button>
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
      advancedOpen = false,
      priority = 0,
      typeOptions = "",
      status = "",
      globalLabelMaxChars = 24,
      regionOptions = [],
      projectLocationMode = "coordinates",
      authoringLanguage = "en",
      escapeHtml,
      iconSvg = () => ""
    } = options || {};
    const t = translator(options);
    const rowId = escapeHtml(row.rowId || "");
    const safeLabelKey = escapeHtml(labelKey);
    const effectiveLabelMaxChars = row.labelMaxChars === "" || row.labelMaxChars === undefined
      ? globalLabelMaxChars
      : row.labelMaxChars;
    const numericStyle = "font-family: &quot;IBM Plex Mono&quot;, ui-monospace, monospace; text-align: right; font-variant-numeric: tabular-nums;";
    const anchor = projectLocationMode === "regions" ? "region" : "coord";
    const labelStyle = row.labelStyle === "rich" ? "rich" : "compact";
    const languageKey = authoringLanguage === "fr" ? "fr" : "en";
    const content = Array.isArray(row.content) ? row.content : [];
    const localText = value => {
      const pair = value && value.value && typeof value.value === "object" ? value.value : value;
      return pair && typeof pair === "object" ? String(pair[languageKey] || "") : "";
    };
    const titleLabel = labelStyle === "rich" ? t("properties.annotation.title") : t("properties.field.projectName");
    const titleFrLabel = labelStyle === "rich" ? t("properties.annotation.titleFr") : t("properties.field.projectNameFr");
    const regionSelectOptions = regionOptions.length
      ? regionOptions.map(region => `<option value="${escapeHtml(region.value)}"${region.value === row.region ? " selected" : ""}>${escapeHtml(region.label)}</option>`).join("")
      : `<option value="">${escapeHtml(t("properties.annotation.noRegions"))}</option>`;
    const segmented = (field, current, choices) => `
      <div class="annotation-segmented" role="group">
        ${choices.map(choice => `
          <label class="annotation-segment${choice.value === current ? " is-active" : ""}">
            <input type="radio" name="${escapeHtml(field)}-${rowId}" data-property-field="${escapeHtml(field)}" value="${escapeHtml(choice.value)}"${choice.value === current ? " checked" : ""}>
            <span>${escapeHtml(choice.label)}</span>
          </label>
        `).join("")}
      </div>`;
    const blockControls = index => `
      <div class="annotation-block-controls">
        <button type="button" data-property-action="move-content-block-up" data-block-index="${index}"${index === 0 ? " disabled" : ""} aria-label="${escapeHtml(t("properties.annotation.moveUp"))}">&uarr;</button>
        <button type="button" data-property-action="move-content-block-down" data-block-index="${index}"${index >= content.length - 1 ? " disabled" : ""} aria-label="${escapeHtml(t("properties.annotation.moveDown"))}">&darr;</button>
        <button type="button" data-property-action="remove-content-block" data-block-index="${index}" aria-label="${escapeHtml(t("properties.annotation.remove"))}">&times;</button>
      </div>`;
    const contentEditor = labelStyle === "rich" ? `
      <div class="annotation-list-editor">
        ${content.map((block, index) => {
          const type = block && block.type || "paragraph";
          if (type === "text" || type === "bullet") {
            const typeLabel = type === "bullet"
              ? t("properties.annotation.bullet")
              : t("properties.annotation.text");
            const template = String(block.template || "").trim();
            return `
              <div class="annotation-list-row annotation-block annotation-composed-block" data-content-block-type="${escapeHtml(type)}">
                <div class="annotation-list-row-label">
                  <select data-property-field="contentElementType" data-block-index="${index}" aria-label="${escapeHtml(t("properties.annotation.elementType"))}">
                    <option value="text"${type === "text" ? " selected" : ""}>${escapeHtml(t("properties.annotation.text"))}</option>
                    <option value="bullet"${type === "bullet" ? " selected" : ""}>${escapeHtml(t("properties.annotation.bullet"))}</option>
                  </select>
                  ${blockControls(index)}
                </div>
                <textarea rows="2" data-property-field="contentElementValue" data-block-index="${index}" placeholder="${escapeHtml(typeLabel)}">${escapeHtml(localText(block))}</textarea>
                ${template ? `<small class="annotation-template-source">${escapeHtml(t("properties.annotation.importTemplate", { template }))}</small>` : ""}
              </div>`;
          }
          if (type === "bullets") {
            const items = Array.isArray(block.items) ? block.items : [];
            return `
              <div class="annotation-list-row annotation-block" data-content-block-type="bullets">
                <div class="annotation-list-row-label"><span>${escapeHtml(t("properties.annotation.bullets"))}</span>${blockControls(index)}</div>
                <div class="annotation-bullet-items">
                  ${items.map((item, itemIndex) => `
                    <div class="annotation-bullet-item">
                      <textarea rows="2" data-property-field="contentBulletItem" data-block-index="${index}" data-item-index="${itemIndex}" placeholder="${escapeHtml(t("properties.annotation.bulletPlaceholder"))}">${escapeHtml(localText(item))}</textarea>
                      <button type="button" data-property-action="remove-content-bullet-item" data-block-index="${index}" data-item-index="${itemIndex}" aria-label="${escapeHtml(t("properties.annotation.remove"))}">&times;</button>
                    </div>
                  `).join("")}
                </div>
                <button type="button" data-property-action="add-content-bullet-item" data-block-index="${index}">${escapeHtml(t("properties.annotation.addBulletItem"))}</button>
              </div>`;
          }
          if (type === "image") {
            const caption = block.caption && typeof block.caption === "object" ? block.caption : {};
            const assetRef = String(block.assetRef || "").trim();
            const hasImage = Boolean(assetRef);
            const displaySize = Math.max(24, Math.min(300, Math.round(Number(block.displaySize) || 72)));
            const sizeHintId = `annotation-image-size-hint-${rowId}-${index}`;
            return `
              <div class="annotation-list-row annotation-block" data-content-block-type="image">
                <div class="annotation-list-row-label"><span>${escapeHtml(t("properties.annotation.image"))}</span>${blockControls(index)}</div>
                <div class="annotation-image-editor">
                  ${hasImage ? `
                    <div class="annotation-image-preview">
                      <img src="${escapeHtml(assetRef)}" alt="">
                      <span>${escapeHtml(t("properties.annotation.imageUploaded"))}</span>
                    </div>` : `<div class="annotation-image-empty">${escapeHtml(t("properties.annotation.imageEmpty"))}</div>`}
                  <div class="annotation-image-actions">
                    <label class="annotation-image-upload-button">
                      <input type="file" accept="image/png,image/jpeg,image/webp" data-property-field="contentImageUpload" data-block-index="${index}">
                      <span>${escapeHtml(t(hasImage ? "properties.annotation.replaceImage" : "properties.annotation.uploadImage"))}</span>
                    </label>
                    <button type="button" data-property-action="clear-content-image" data-block-index="${index}"${hasImage ? "" : " disabled"}>${escapeHtml(t("properties.annotation.clearImage"))}</button>
                  </div>
                  <p class="annotation-image-rules">${escapeHtml(t("properties.annotation.imageRules"))}</p>
                </div>
                <label class="annotation-image-size-field">
                  ${propertyFieldLabel(options, t("properties.annotation.imageSize"))}
                  <span class="annotation-image-size-control">
                    <input type="number" min="24" max="300" step="4" inputmode="numeric" data-property-field="contentImageSize" data-block-index="${index}" aria-describedby="${escapeHtml(sizeHintId)}" style="${numericStyle}" value="${displaySize}">
                    <span aria-hidden="true">pt</span>
                  </span>
                  <small id="${escapeHtml(sizeHintId)}">${escapeHtml(t("properties.annotation.imageSizeHint"))}</small>
                </label>
                <label>
                  ${propertyFieldLabel(options, t("properties.annotation.caption"))}
                  <textarea rows="2" data-property-field="contentImageCaption" data-block-index="${index}" placeholder="${escapeHtml(t("properties.annotation.captionPlaceholder"))}">${escapeHtml(localText(caption))}</textarea>
                </label>
              </div>`;
          }
          return `
            <div class="annotation-list-row annotation-block" data-content-block-type="paragraph">
              <div class="annotation-list-row-label"><span>${escapeHtml(t("properties.annotation.paragraph"))}</span>${blockControls(index)}</div>
              <textarea rows="3" data-property-field="contentParagraph" data-block-index="${index}" placeholder="${escapeHtml(t("properties.annotation.paragraphPlaceholder"))}">${escapeHtml(localText(block))}</textarea>
            </div>`;
        }).join("")}
        <div class="properties-actions annotation-add-actions" role="toolbar" aria-label="${escapeHtml(t("properties.annotation.addElement"))}">
          <button type="button" class="annotation-add-button" data-property-action="add-content-text" aria-label="${escapeHtml(t("properties.annotation.addText"))}" title="${escapeHtml(t("properties.annotation.addText"))}">${iconSvg("text")}<span class="visually-hidden">${escapeHtml(t("properties.annotation.addText"))}</span></button>
          <button type="button" class="annotation-add-button" data-property-action="add-content-bullets" aria-label="${escapeHtml(t("properties.annotation.addBullets"))}" title="${escapeHtml(t("properties.annotation.addBullets"))}">${iconSvg("list")}<span class="visually-hidden">${escapeHtml(t("properties.annotation.addBullets"))}</span></button>
          <button type="button" class="annotation-add-button" data-property-action="add-content-image" aria-label="${escapeHtml(t("properties.annotation.addImage"))}" title="${escapeHtml(t("properties.annotation.addImage"))}">${iconSvg("image")}<span class="visually-hidden">${escapeHtml(t("properties.annotation.addImage"))}</span></button>
        </div>
      </div>` : "";
    return `
      <div class="properties-form" data-property-kind="${escapeHtml(kind)}" data-row-id="${rowId}" data-label-key="${safeLabelKey}">
        <div class="properties-record-status">${escapeHtml(status)} ${propertyOriginIcon(options, "auto")}</div>
        <label>
          ${propertyFieldLabel(options, titleLabel)}
          <input type="text" data-property-field="name" value="${escapeHtml(row.name || "")}">
        </label>
        <label>
          ${propertyFieldLabel(options, titleFrLabel)}
          <textarea data-property-field="nameFr" rows="2" placeholder="${escapeHtml(titleFrLabel)}">${escapeHtml(row.nameFr || "")}</textarea>
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.priority"))}
          <input type="number" min="0" max="5" step="1" data-property-field="priority" style="${numericStyle}" value="${priority}">
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.type"))}
          <select data-property-field="type">
            ${typeOptions}
          </select>
        </label>
        <section class="annotation-property-section">
          <h3>${escapeHtml(t(anchor === "region" ? "properties.field.region" : "properties.field.coordinates"))}</h3>
          ${anchor === "region" ? `
            <label>
              ${propertyFieldLabel(options, t("properties.field.region"))}
              <select data-property-field="region">${regionSelectOptions}</select>
            </label>` : `
            <div class="properties-inline-grid">
              <label>
                ${propertyFieldLabel(options, t("properties.field.longitude"))}
                <input type="text" inputmode="decimal" data-property-field="lon" style="${numericStyle}" value="${escapeHtml(row.lon === "" ? "" : String(row.lon))}">
              </label>
              <label>
                ${propertyFieldLabel(options, t("properties.field.latitude"))}
                <input type="text" inputmode="decimal" data-property-field="lat" style="${numericStyle}" value="${escapeHtml(row.lat === "" ? "" : String(row.lat))}">
              </label>
            </div>`}
        </section>
        <section class="annotation-property-section">
          <h3>${escapeHtml(t("properties.field.labelStyle"))}</h3>
          ${segmented("labelStyle", labelStyle, [{ value: "compact", label: t("properties.annotation.compact") }, { value: "rich", label: t("properties.annotation.rich") }])}
          ${labelStyle === "rich" ? `<label class="toolbar-check annotation-label-border-option">
            <input type="checkbox" data-property-field="labelBorder"${row.labelBorder ? " checked" : ""}>
            <span>${propertyFieldLabel(options, t("properties.field.labelBorder"))}</span>
          </label>` : ""}
          ${contentEditor}
        </section>

        <label class="toolbar-check">
          <input type="checkbox" data-property-field="hideLine"${row.hideLine ? " checked" : ""}>
          <span>${propertyFieldLabel(options, t("properties.field.hideLeaderLine"))}</span>
        </label>
        <label class="toolbar-check">
          <input type="checkbox" data-property-field="elbowLeader"${row.elbowLeader ? " checked" : ""}>
          <span>${propertyFieldLabel(options, t("properties.field.useElbowLeader"))}</span>
        </label>
        <details${advancedOpen ? " open" : ""}>
          <summary>${escapeHtml(t("properties.field.advanced"))}</summary>
          <div class="properties-form">
            <label>
              ${propertyFieldLabel(options, t("properties.field.footnote"))}
              <input type="text" maxlength="2" pattern="[A-Za-z0-9]*|[*]" data-property-field="footnote" value="${escapeHtml(row.footnote || "")}">
            </label>
            <label>
              ${propertyFieldLabel(options, t("properties.field.charactersPerLine"))}
              <input type="number" min="12" max="42" step="1" data-property-field="labelMaxChars" value="${escapeHtml(String(effectiveLabelMaxChars))}" placeholder="${escapeHtml(t("properties.field.defaultValue", { value: globalLabelMaxChars }))}">
            </label>
            <div class="properties-actions">
              <button type="button" data-property-action="reset-label" data-label-key="${safeLabelKey}"${manual ? "" : " disabled"}>${escapeHtml(t("properties.button.resetLabelPosition"))}</button>
              <button type="button" data-property-action="focus-row" data-row-id="${rowId}">${escapeHtml(t("properties.button.editRowInTable"))}</button>
            </div>
          </div>
        </details>
      </div>
    `;
  }
  function renderMapPropertyControls(options) {
    const { regionSummaryText = "", selectOptions = {}, escapeHtml } = options || {};
    const t = translator(options);
    return `
      <div class="properties-form" data-property-kind="map">
        <label>
          ${propertyFieldLabel(options, t("properties.field.mapBoundary"))}
          <select data-map-proxy="boundaryInput">
            ${selectOptions.boundary || ""}
          </select>
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.regionPreset"))}
          <select data-map-proxy="regionPresetInput">
            ${selectOptions.regionPreset || ""}
          </select>
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.pagePreset"))}
          <select data-layout-proxy="bookSizeInput">
            ${selectOptions.bookSize || ""}
          </select>
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.canvasSize"))}
          <select data-layout-proxy="imageSizeInput">
            ${selectOptions.imageSize || ""}
          </select>
        </label>
        <label>
          ${propertyFieldLabel(options, t("properties.field.defaultCharactersPerLine"))}
          <input type="number" min="12" max="42" step="1" data-layout-proxy="labelCharsInput" value="${escapeHtml(selectOptions.labelMaxChars || "")}">
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
      qualityPending = false,
      qualityError = false,
      translationSummary,
      metadataMissing = 0,
      reviewCount = 0,
      verdict = "",
      verdictState = "info",
      qualityMetricItem: metricItem,
      escapeHtml
    } = options || {};
    const t = translator(options);
    const overlapCount = report ? Number(report.overlaps || 0) : 0;
    const qualityUnavailable = qualityPending || qualityError;
    const qualityVerdict = qualityError
      ? t("quality.property.failed")
      : qualityPending
        ? t("quality.property.checking")
        : overlapCount
          ? t("quality.property.overlapsFound", { count: overlapCount })
          : t("quality.property.noOverlapsFound");
    return `
      <div class="properties-form" data-property-kind="quality">
        <h3>${escapeHtml(t("quality.property.threshold"))}</h3>
        <label>${propertyFieldLabel(options, t("quality.property.warnAbove"), "auto")}<input type="text" value="${escapeHtml(t("quality.property.overlapLimit"))}" readonly></label>
        <p class="properties-muted">${escapeHtml(t("quality.property.help"))}</p>
        <p class="quality-properties-verdict" data-state="${escapeHtml(qualityError ? "review" : qualityPending ? "info" : verdictState)}">${escapeHtml(qualityVerdict)}</p>
        <div class="properties-actions">
          <button type="button" class="primary-action" data-property-action="open-map"${qualityUnavailable ? " disabled" : ""}>${escapeHtml(overlapCount ? t("quality.action.locateFirstOverlap") : t("quality.action.openMap"))}</button>
          ${metadataMissing ? `<button type="button" data-property-action="open-map-details">${escapeHtml(t("quality.action.completeMapDetails"))}</button>` : ""}
          ${rowSummary.coordinateIssues ? `<button type="button" data-property-action="open-project-missing">${escapeHtml(t("quality.action.reviewCoordinateIssues"))}</button>` : ""}
          ${rowSummary.callouts ? `<button type="button" data-property-action="open-project-callouts">${escapeHtml(t("quality.action.reviewCallouts"))}</button>` : ""}
          ${translationSummary.missing ? `<button type="button" data-property-action="open-translations-missing">${escapeHtml(t("quality.action.reviewFrenchStrings"))}</button>` : ""}
          ${regionSummary.state === "warning" ? `<button type="button" data-property-action="open-map-regions">${escapeHtml(t("quality.action.reviewRegions"))}</button>` : ""}
          ${!qualityUnavailable && qualitySummary.issues ? `<button type="button" data-property-action="open-map">${escapeHtml(t("quality.action.reviewMapPlacement"))}</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderTranslationPropertyControls(options) {
    const { summary, escapeHtml, qualityMetricItem: metricItem } = options || {};
    const t = translator(options);
    const state = summary.missing ? "review" : "ok";
    return `
      <div class="properties-form" data-property-kind="translation">
        <p class="properties-muted">${escapeHtml(t("properties.translation.help"))}</p>
        <div class="properties-metric-list">
          ${metricItem(t("properties.translation.complete"), `${summary.complete} / ${summary.total}`, state, t("properties.translation.completeHelp"))}
          ${metricItem(t("properties.translation.missing"), String(summary.missing), state, t("properties.translation.missingHelp"))}
        </div>
        <div class="properties-actions">
          <button type="button" data-property-action="open-translations-missing">${escapeHtml(t("properties.translation.showMissing"))}</button>
          <button type="button" data-property-action="paste-translations">${escapeHtml(t("properties.translation.pasteColumn"))}</button>
        </div>
      </div>
    `;
  }

  function renderTranslationEntryPropertyControls(options) {
    const { entry, escapeHtml } = options || {};
    const t = translator(options);
    if (!entry) return `<p class="properties-muted">${escapeHtml(t("properties.translation.empty"))}</p>`;
    return `
      <div class="properties-form" data-property-kind="translation-entry" data-entry-id="${escapeHtml(entry.id)}">
        <h3>${escapeHtml(t("properties.translation.selected"))}</h3>
        <label>${propertyFieldLabel(options, t("properties.category.english"))}<input data-translation-property="en" type="text" value="${escapeHtml(entry.ref)}"></label>
        <label>${propertyFieldLabel(options, t("properties.category.french"))}<input data-translation-property="fr" type="text" value="${escapeHtml(entry.fr || "")}" placeholder="-"></label>
        <p class="properties-muted">${escapeHtml(t("properties.translation.outputNote"))}</p>
      </div>
    `;
  }

  function renderCategoryPropertyControls(options) {
    const { category, markerShapes = [], escapeHtml, markerShapeIcon } = options || {};
    const t = translator(options);
    if (!category) return `<p class="properties-muted">${escapeHtml(t("properties.category.empty"))}</p>`;
    const customIcon = category.customIcon || null;
    const customIconName = customIcon && customIcon.name && customIcon.name !== "custom-marker"
      ? customIcon.name
      : t("properties.category.customMarkerFallback");
    const iconDetails = customIcon
      ? `${escapeHtml(customIconName)} · ${escapeHtml(String(customIcon.width))} x ${escapeHtml(String(customIcon.height))} px`
      : escapeHtml(t("properties.category.iconRules"));
    const shapeOptions = markerShapes.map(shape => `
          <label class="category-shape-option${shape.value === category.shape ? " is-selected" : ""}">
            <input data-category-field="shape" type="radio" name="category-shape-${escapeHtml(category.id)}" value="${escapeHtml(shape.value)}"${shape.value === category.shape ? " checked" : ""}>
            ${typeof markerShapeIcon === "function" ? markerShapeIcon(shape.value, category) : ""}
            <span>${escapeHtml(shape.label)}</span>
      </label>`).join("");
    return `
      <div class="properties-form" data-property-kind="category" data-category-id="${escapeHtml(category.id)}">
        <h3>${escapeHtml(t("properties.category.legendLabel"))}</h3>
        <label>${propertyFieldLabel(options, t("properties.category.english"))}<input data-category-field="label" type="text" value="${escapeHtml(category.label)}"></label>
        <label>${propertyFieldLabel(options, t("properties.category.french"))}<input data-category-field="labelFr" type="text" value="${escapeHtml(category.labelFr || "")}"></label>
        <p class="properties-muted properties-dot-note">${escapeHtml(t("properties.category.languageNote"))}</p>
        <h3>${escapeHtml(t("properties.category.markerShape"))}</h3>
        <div class="category-shape-grid">${shapeOptions}</div>
        <label>${propertyFieldLabel(options, t("properties.category.markerColour"))}<input data-category-field="colour" type="color" value="${escapeHtml(category.colour)}"></label>
        <div class="custom-icon-dropzone${customIcon ? " is-active" : ""}">
          <input data-category-icon-upload type="file" accept="image/png,image/webp" hidden>
          <div class="custom-icon-summary">
            <span class="custom-icon-preview" aria-hidden="true">
              ${customIcon ? `<img src="${escapeHtml(customIcon.dataUrl)}" alt="">` : typeof markerShapeIcon === "function" ? markerShapeIcon(category.shape, category) : ""}
            </span>
            <span>
              <strong>${escapeHtml(customIcon ? t("properties.category.customActive") : t("properties.category.uploadCustom"))}</strong>
              <span>${iconDetails}</span>
            </span>
          </div>
          <div class="custom-icon-actions">
            <button type="button" class="ghost-button" data-property-action="upload-category-icon">${escapeHtml(customIcon ? t("properties.category.replaceIcon") : t("properties.category.uploadIcon"))}</button>
            ${customIcon ? `<button type="button" class="ghost-button" data-property-action="remove-category-icon">${escapeHtml(t("properties.category.removeIcon"))}</button>` : ""}
          </div>
          <span class="custom-icon-note">${escapeHtml(t("properties.category.iconNote"))}</span>
        </div>
        <h3>${escapeHtml(t("properties.category.size"))}</h3>
        <div class="properties-inline-grid">
          <label>${propertyFieldLabel(options, t("properties.category.marker"))}<input data-category-field="markerSize" type="number" min="4" max="30" step="1" value="${escapeHtml(category.markerSize)}"></label>
          <label>${propertyFieldLabel(options, t("properties.category.legend"))}<input data-category-field="lineWidth" type="number" min="1" max="10" step="0.5" value="${escapeHtml(category.lineWidth)}"></label>
        </div>
        <p class="properties-muted">${escapeHtml(t("properties.category.sizeNote"))}</p>
      </div>`;
  }

  function renderRegionPropertyControls(options) {
    const { region, pluralize, escapeHtml, statusOptions = [] } = options || {};
    const t = translator(options);
    const pointLabel = region.count === 1 ? t("properties.region.projectPoint") : t("properties.region.projectPoints");
    const presetLabel = region.colourSource === "auto-by-value" ? t("properties.region.sequential") : t("properties.region.manual");
    const statusSelect = statusOptions.map(option => `<option value="${escapeHtml(option.value)}"${option.value === region.status ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("");
    return `
      <div class="properties-form" data-property-kind="region" data-region-id="${escapeHtml(region.id)}">
        <h3>${escapeHtml(t("properties.region.inclusion"))}</h3>
        <label class="toolbar-check region-property-switch">
          <span>
            <strong>${escapeHtml(t("properties.region.includeInMap"))}</strong>
            <small>${escapeHtml(t("properties.region.pointsFallHere", { count: region.count, points: pointLabel }))}</small>
            ${propertyOriginIcon(options, "edit")}
          </span>
          <input type="checkbox" data-region-property="included"${region.included ? " checked" : ""}>
        </label>
        <h3>${escapeHtml(t("properties.region.status"))}</h3>
        <label>${propertyFieldLabel(options, t("properties.region.status"))}<select data-region-property="status">${statusSelect}</select></label>
        <h3>${escapeHtml(t("properties.region.colour"))}</h3>
        <div class="properties-inline-grid">
          <label>${propertyFieldLabel(options, t("properties.region.order"))}<input type="number" step="any" data-region-property="value" value="${escapeHtml(region.value === "" ? "" : String(region.value))}"></label>
          <label>${propertyFieldLabel(options, t("properties.region.preset"), "auto")}<input type="text" value="${escapeHtml(presetLabel)}" readonly></label>
        </div>
        <label>${propertyFieldLabel(options, t("properties.region.fillColour"))}<input data-region-property="colour" type="color" value="${escapeHtml(region.colour)}"></label>
        <p class="properties-muted">${escapeHtml(t("properties.region.valueColour", { valueSource: region.valueSourceLabel, colourSource: region.colourSourceLabel }))}</p>
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
