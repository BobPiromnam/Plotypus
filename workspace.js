(function (global) {
  "use strict";

  function normalizeProjectFilter(filter) {
    return ["all", "missing", "callouts"].includes(filter) ? filter : "all";
  }

  function normalizeTranslationFilter(filter) {
    return filter === "missing" ? "missing" : "all";
  }

  function normalizeActiveDataTab(tableName, tabs) {
    return (tabs || []).some(tab => tab.name === tableName) ? tableName : "preview";
  }

  function applyActiveDataTab(options) {
    const {
      tableName,
      tabs = [],
      tableActions = [],
      tablePanelTitle = null,
      body = null
    } = options || {};
    const activeName = normalizeActiveDataTab(tableName, tabs);
    const activeTab = tabs.find(tab => tab.name === activeName) || tabs[0] || null;
    if (body && body.dataset) body.dataset.workspaceView = activeName;

    tabs.forEach(tab => {
      const isActive = tab.name === activeName;
      if (tab.tab) {
        tab.tab.classList.toggle("is-active", isActive);
        tab.tab.setAttribute("aria-selected", String(isActive));
        tab.tab.tabIndex = isActive ? 0 : -1;
      }
      if (tab.pane) {
        tab.pane.classList.toggle("is-active", isActive);
        tab.pane.hidden = !isActive;
      }
    });

    tableActions.forEach(actions => {
      actions.classList.toggle("is-active", Boolean(activeTab && actions.dataset.tableActions === activeTab.actions));
    });
    if (tablePanelTitle && activeTab) tablePanelTitle.textContent = activeTab.title;

    return { activeName, activeTab };
  }

  function rowMatchesProjectFilter(state, filter) {
    const activeFilter = normalizeProjectFilter(filter);
    if (activeFilter === "missing") return state.isMissingCoordinate;
    if (activeFilter === "callouts") return state.isCallout;
    return true;
  }

  function summarizeProjectRows(rows) {
    return (rows || []).reduce((summary, row) => {
      const hasLon = row.lon !== "";
      const hasLat = row.lat !== "";
      if (hasLon && hasLat) summary.mapped += 1;
      else if (hasLon || hasLat) summary.coordinateIssues += 1;
      else summary.callouts += 1;
      return summary;
    }, { total: (rows || []).length, mapped: 0, callouts: 0, coordinateIssues: 0 });
  }

  function getQualitySummary(report, pluralize, labels = {}) {
    if (!report) return { value: labels.notChecked || "", state: "neutral", issues: 0 };
    const issues = Number(report.overlaps || 0)
      + Number(report.crossings || 0)
      + Number(report.longLines || 0)
      + Number(report.labelsNearEdge || 0)
      + (report.projectedProblems ? report.projectedProblems.length : 0)
      + (report.hiddenRegionProblems ? report.hiddenRegionProblems.length : 0);
    return {
      value: issues
        ? (labels.issueCount
        ? labels.issueCount(issues)
          : pluralize(issues, labels.issueSingular || "", labels.issuePlural || ""))
        : labels.ready || "",
      state: issues ? "warning" : "ok",
      issues
    };
  }

  function getReviewIssueCount(options) {
    const {
      rowSummary,
      translationSummary,
      mapDetailsMissingCount,
      qualitySummary
    } = options || {};
    return (rowSummary ? rowSummary.coordinateIssues : 0)
      + (translationSummary ? translationSummary.missing : 0)
      + Number(mapDetailsMissingCount || 0)
      + Number(qualitySummary && qualitySummary.issues || 0);
  }

  function summaryChip(label, value, options) {
    const { state = "neutral", action = "", destination = "", id = "", escapeHtml } = options || {};
    const key = String(label).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const content = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    if (!action) {
      return `<span class="workspace-summary-chip" data-summary-key="${escapeHtml(key)}" data-summary-state="${escapeHtml(state)}" style="cursor: default;">${content}</span>`;
    }
    const destinationText = destination || label;
    return `
      <button${id ? ` id="${escapeHtml(id)}"` : ""} type="button" class="workspace-summary-chip" data-summary-key="${escapeHtml(key)}" data-summary-state="${escapeHtml(state)}" data-summary-action="${escapeHtml(action)}" role="button" tabindex="0" title="${escapeHtml(destinationText)}" aria-label="${escapeHtml(destinationText)}">
        ${content}
      </button>
    `;
  }

  global.PLOTYPUS_WORKSPACE = Object.freeze({
    applyActiveDataTab,
    getQualitySummary,
    getReviewIssueCount,
    normalizeActiveDataTab,
    normalizeProjectFilter,
    normalizeTranslationFilter,
    rowMatchesProjectFilter,
    summarizeProjectRows,
    summaryChip
  });
})(window);
