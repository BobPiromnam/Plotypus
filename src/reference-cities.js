(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlotypusReferenceCities = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function cloneModel(value) {
    return JSON.parse(JSON.stringify(normalizeModel(value)));
  }

  function normalizeModel(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const ids = Array.isArray(source.ids)
      ? source.ids.map(id => String(id || "").trim()).filter((id, index, all) => id && all.indexOf(id) === index)
      : [];
    const overrides = {};
    if (source.overrides && typeof source.overrides === "object" && !Array.isArray(source.overrides)) {
      Object.entries(source.overrides).forEach(([id, override]) => {
        if (!id || !override || typeof override !== "object" || Array.isArray(override)) return;
        const name = override.name && typeof override.name === "object" ? override.name : {};
        overrides[id] = { name: { en: String(name.en || ""), fr: String(name.fr || "") } };
      });
    }
    return {
      ids,
      overrides,
      rule: source.rule == null ? null : source.rule,
      style: String(source.style || "default")
    };
  }

  function createDefaultModel() {
    return normalizeModel();
  }

  function createField(options = {}) {
    const rootElement = options.root;
    const search = options.search;
    const indexedCities = Array.isArray(options.indexedCities) ? options.indexedCities : [];
    if (!rootElement || !search || typeof search.matches !== "function" || typeof search.resolveList !== "function") {
      throw new TypeError("Reference cities field requires a root, indexed cities, and the supplied search module.");
    }

    const idPrefix = String(options.idPrefix || "refCity");
    const allowOverrides = options.allowOverrides === true;
    const cityById = new Map(indexedCities.map(city => [city.id, city]));
    const translate = typeof options.t === "function" ? options.t : key => key;
    const getLanguage = typeof options.getLanguage === "function" ? options.getLanguage : () => "en";
    const getProvinceName = typeof options.getProvinceName === "function" ? options.getProvinceName : city => city.prov;
    const getExcludedIds = typeof options.getExcludedIds === "function" ? options.getExcludedIds : () => [];
    const textKeys = options.textKeys && typeof options.textKeys === "object" ? options.textKeys : {};
    const onBeforeChange = typeof options.onBeforeChange === "function" ? options.onBeforeChange : () => {};
    const onChange = typeof options.onChange === "function" ? options.onChange : () => {};
    let model = normalizeModel(options.model);
    let query = "";
    let open = false;
    let selectedIndex = 0;
    let misses = [];
    let editingId = "";
    let destroyed = false;

    function textKey(name, fallback) {
      return String(textKeys[name] || fallback);
    }

    function cityName(city, language = getLanguage()) {
      const override = model.overrides[city.id] && model.overrides[city.id].name;
      if (override && override[language]) return override[language];
      return language === "fr" && city.name_fr ? city.name_fr : city.name;
    }

    function storedName(id) {
      const city = cityById.get(id);
      if (city) return cityName(city);
      const override = model.overrides[id] && model.overrides[id].name;
      return override && (override[getLanguage()] || override.en || override.fr) || id;
    }

    function currentResults() {
      const excluded = model.ids.concat(getExcludedIds()).filter((id, index, all) => id && all.indexOf(id) === index);
      return search.matches(indexedCities, query, excluded, 5);
    }

    function emitChange() {
      onChange(cloneModel(model));
    }

    function addCity(id) {
      if (!id || model.ids.includes(id)) return;
      onBeforeChange();
      model.ids.push(id);
      query = "";
      open = false;
      selectedIndex = 0;
      misses = [];
      editingId = "";
      emitChange();
      render({ focusInput: true });
    }

    function addMany(text) {
      const excluded = model.ids.concat(getExcludedIds()).filter((id, index, all) => id && all.indexOf(id) === index);
      const resolved = search.resolveList(indexedCities, text, excluded);
      if (resolved.found.length) {
        onBeforeChange();
        model.ids.push(...resolved.found.map(city => city.id));
        emitChange();
      }
      query = "";
      open = false;
      selectedIndex = 0;
      misses = resolved.miss;
      editingId = "";
      render({ focusInput: true });
    }

    function removeCity(id) {
      const index = model.ids.indexOf(id);
      if (index < 0) return;
      onBeforeChange();
      model.ids.splice(index, 1);
      delete model.overrides[id];
      editingId = editingId === id ? "" : editingId;
      emitChange();
      render({ focusInput: true });
    }

    function renderResult(city, index) {
      const selected = index === selectedIndex;
      const coordinates = `${Number(city.lat).toFixed(2)}, ${Number(city.lon).toFixed(2)}`;
      const population = Number(city.pop || 0).toLocaleString(getLanguage() === "fr" ? "fr-CA" : "en-CA");
      return `
        <button type="button" id="${escapeHtml(idPrefix)}Result${index}" class="refCityResultRow${selected ? " is-selected" : ""}" role="option" aria-selected="${selected}" tabindex="-1" data-reference-city-result="${escapeHtml(city.id)}" data-reference-city-result-index="${index}">
          <span class="refCityResultDot" aria-hidden="true"></span>
          <span class="refCityResultMain">
          <span class="refCityResultName type-control-label">${escapeHtml(cityName(city))}</span>
          <span class="refCityResultCoordinates type-caption">${escapeHtml(coordinates)}</span>
          </span>
          <span class="refCityResultMeta">
            <span class="refCityResultProvince type-caption">${escapeHtml(getProvinceName(city, getLanguage()))}</span>
            <span class="refCityResultPopulation type-caption">${escapeHtml(population)}</span>
          </span>
        </button>`;
    }

    function renderOverride(id) {
      if (!allowOverrides || editingId !== id) return "";
      const city = cityById.get(id);
      const override = model.overrides[id] && model.overrides[id].name || {};
      return `
        <div class="refCityOverridePopover ui-floating-surface" data-reference-city-override="${escapeHtml(id)}">
          <div class="refCityOverrideHeader">
            <strong>${escapeHtml(translate("referenceCities.override.title", { city: storedName(id) }))}</strong>
            <button type="button" class="refCityOverrideClose" data-reference-city-override-close aria-label="${escapeHtml(translate("referenceCities.override.close"))}">×</button>
          </div>
          <label>
            <span>${escapeHtml(translate("referenceCities.override.english"))}</span>
            <input type="text" data-reference-city-override-language="en" value="${escapeHtml(override.en || "")}" placeholder="${escapeHtml(city && city.name || "")}">
          </label>
          <label>
            <span>${escapeHtml(translate("referenceCities.override.french"))}</span>
            <input type="text" data-reference-city-override-language="fr" value="${escapeHtml(override.fr || "")}" placeholder="${escapeHtml(city && (city.name_fr || city.name) || "")}">
          </label>
          <button type="button" class="refCityOverrideReset" data-reference-city-override-reset>${escapeHtml(translate("referenceCities.override.reset"))}</button>
        </div>`;
    }

    function renderChip(id) {
      const city = cityById.get(id);
      const province = city ? city.prov : translate("referenceCities.unresolved");
      const label = storedName(id);
      const nameControl = allowOverrides
        ? `<button type="button" class="refCityChipName" data-reference-city-edit="${escapeHtml(id)}" aria-label="${escapeHtml(translate("referenceCities.override.edit", { city: label }))}">${escapeHtml(label)}</button>`
        : `<span class="refCityChipName">${escapeHtml(label)}</span>`;
      return `<span class="refCityChipWrap"><span class="refCityChip${city ? "" : " is-unresolved"}">${nameControl}<span class="refCityChipProvince">${escapeHtml(province)}</span><button type="button" class="refCityChipRemove" data-reference-city-remove="${escapeHtml(id)}" aria-label="${escapeHtml(translate("referenceCities.remove", { city: label }))}"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"></path></svg></button></span>${renderOverride(id)}</span>`;
    }

    function hintText() {
      if (misses.length) return translate(textKey("hintMissing", "referenceCities.hint.missing"), { cities: misses.join(", ") });
      if (model.ids.length) return translate(textKey("hintCount", "referenceCities.hint.count"), { count: model.ids.length });
      return translate(textKey("hintDefault", "referenceCities.hint.default"));
    }

    function render(renderOptions = {}) {
      if (destroyed) return;
      const results = currentResults();
      selectedIndex = Math.max(0, Math.min(selectedIndex, Math.max(results.length - 1, 0)));
      const showResults = open && query.trim().length > 0;
      const activeDescendant = showResults && results[selectedIndex] ? `${idPrefix}Result${selectedIndex}` : "";
      rootElement.classList.add("reference-cities-field");
      rootElement.innerHTML = `
        <label class="refCityLabel type-caption" for="${escapeHtml(idPrefix)}Input">${escapeHtml(translate(textKey("label", "referenceCities.label")))} <span>${escapeHtml(translate(textKey("optional", "referenceCities.optional")))}</span></label>
        <div class="refCityCombobox">
          <span class="refCitySearchIcon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></span>
          <input id="${escapeHtml(idPrefix)}Input" class="refCityInput type-control" type="text" value="${escapeHtml(query)}" placeholder="${escapeHtml(translate(textKey("placeholder", "referenceCities.placeholder")))}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="${showResults}" aria-controls="${escapeHtml(idPrefix)}Results"${activeDescendant ? ` aria-activedescendant="${escapeHtml(activeDescendant)}"` : ""}>
          <div id="${escapeHtml(idPrefix)}Results" class="refCityResults ui-floating-surface" role="listbox"${showResults ? "" : " hidden"}>
            ${results.length ? results.map(renderResult).join("") : `<div class="refCityNoMatch">${escapeHtml(translate(textKey("noMatchBefore", "referenceCities.noMatch.before")))} <span>cities.json</span>. ${escapeHtml(translate(textKey("noMatchAfter", "referenceCities.noMatch.after")))}</div>`}
          </div>
        </div>
        <div class="refCityChips">${model.ids.map(renderChip).join("")}</div>
        <p class="refCityHint type-caption" aria-live="polite">${escapeHtml(hintText())}</p>`;
      if (renderOptions.focusInput) {
        const input = rootElement.querySelector(".refCityInput");
        input?.focus({ preventScroll: true });
        input?.setSelectionRange(query.length, query.length);
      }
    }

    function handleInput(event) {
      const overrideInput = event.target.closest("[data-reference-city-override-language]");
      if (overrideInput) {
        const container = overrideInput.closest("[data-reference-city-override]");
        const id = container && container.dataset.referenceCityOverride;
        const language = overrideInput.dataset.referenceCityOverrideLanguage;
        if (!id || !["en", "fr"].includes(language)) return;
        if (!container.dataset.referenceCityUndoCaptured) {
          onBeforeChange();
          container.dataset.referenceCityUndoCaptured = "true";
        }
        if (!model.overrides[id]) model.overrides[id] = { name: { en: "", fr: "" } };
        model.overrides[id].name[language] = overrideInput.value;
        emitChange();
        return;
      }
      if (!event.target.matches(".refCityInput")) return;
      query = event.target.value;
      open = true;
      selectedIndex = 0;
      misses = [];
      render({ focusInput: true });
    }

    function handleFocus(event) {
      if (!event.target.matches(".refCityInput")) return;
      if (open) return;
      open = true;
      render({ focusInput: true });
    }

    function handleBlur(event) {
      if (!event.target.matches(".refCityInput")) return;
      window.setTimeout(() => {
        if (destroyed || rootElement.contains(document.activeElement)) return;
        open = false;
        render();
      }, 0);
    }

    function handleKeydown(event) {
      if (!event.target.matches(".refCityInput")) return;
      const results = currentResults();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, Math.max(results.length - 1, 0));
        open = true;
        render({ focusInput: true });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        open = true;
        render({ focusInput: true });
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (query.includes(",")) addMany(query);
        else if (results[selectedIndex]) addCity(results[selectedIndex].id);
      } else if (event.key === "Escape") {
        event.stopPropagation();
        open = false;
        render({ focusInput: true });
      } else if (event.key === "Backspace" && query === "" && model.ids.length) {
        event.preventDefault();
        removeCity(model.ids[model.ids.length - 1]);
      }
    }

    function handleMouseDown(event) {
      const row = event.target.closest("[data-reference-city-result]");
      if (!row || !rootElement.contains(row)) return;
      event.preventDefault();
      addCity(row.dataset.referenceCityResult);
    }

    function handleMouseOver(event) {
      const row = event.target.closest("[data-reference-city-result-index]");
      if (!row || !rootElement.contains(row)) return;
      const nextIndex = Number(row.dataset.referenceCityResultIndex);
      if (!Number.isInteger(nextIndex) || nextIndex === selectedIndex) return;
      selectedIndex = nextIndex;
      rootElement.querySelectorAll(".refCityResultRow").forEach((item, index) => {
        const selected = index === selectedIndex;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      const input = rootElement.querySelector(".refCityInput");
      input?.setAttribute("aria-activedescendant", `${idPrefix}Result${selectedIndex}`);
    }

    function handleClick(event) {
      const remove = event.target.closest("[data-reference-city-remove]");
      if (remove) {
        removeCity(remove.dataset.referenceCityRemove);
        return;
      }
      const edit = event.target.closest("[data-reference-city-edit]");
      if (edit) {
        editingId = editingId === edit.dataset.referenceCityEdit ? "" : edit.dataset.referenceCityEdit;
        render();
        rootElement.querySelector("[data-reference-city-override-language]")?.focus({ preventScroll: true });
        return;
      }
      if (event.target.closest("[data-reference-city-override-close]")) {
        editingId = "";
        render();
        return;
      }
      if (event.target.closest("[data-reference-city-override-reset]")) {
        const id = event.target.closest("[data-reference-city-override]")?.dataset.referenceCityOverride;
        if (!id || !model.overrides[id]) return;
        onBeforeChange();
        delete model.overrides[id];
        emitChange();
        render();
      }
    }

    rootElement.addEventListener("input", handleInput);
    rootElement.addEventListener("focusin", handleFocus);
    rootElement.addEventListener("focusout", handleBlur);
    rootElement.addEventListener("keydown", handleKeydown);
    rootElement.addEventListener("mousedown", handleMouseDown);
    rootElement.addEventListener("mouseover", handleMouseOver);
    rootElement.addEventListener("click", handleClick);
    render();

    return {
      getModel: () => cloneModel(model),
      setModel(value) {
        model = normalizeModel(value);
        query = "";
        open = false;
        selectedIndex = 0;
        misses = [];
        editingId = "";
        render();
      },
      refresh: () => render(),
      destroy() {
        destroyed = true;
        rootElement.removeEventListener("input", handleInput);
        rootElement.removeEventListener("focusin", handleFocus);
        rootElement.removeEventListener("focusout", handleBlur);
        rootElement.removeEventListener("keydown", handleKeydown);
        rootElement.removeEventListener("mousedown", handleMouseDown);
        rootElement.removeEventListener("mouseover", handleMouseOver);
        rootElement.removeEventListener("click", handleClick);
        rootElement.innerHTML = "";
      }
    };
  }

  function createSingleField(options = {}) {
    const rootElement = options.root;
    const search = options.search;
    const indexedCities = Array.isArray(options.indexedCities) ? options.indexedCities : [];
    if (!rootElement || !search || typeof search.matches !== "function") {
      throw new TypeError("City location field requires a root, indexed cities, and the supplied search module.");
    }

    const idPrefix = String(options.idPrefix || "cityLocation");
    const translate = typeof options.t === "function" ? options.t : key => key;
    const getLanguage = typeof options.getLanguage === "function" ? options.getLanguage : () => "en";
    const getProvinceName = typeof options.getProvinceName === "function" ? options.getProvinceName : city => city.prov;
    const onBeforeChange = typeof options.onBeforeChange === "function" ? options.onBeforeChange : () => {};
    const onChange = typeof options.onChange === "function" ? options.onChange : () => {};
    const cityById = new Map(indexedCities.map(city => [city.id, city]));
    const compact = options.compact === true;
    let value = String(options.value || "");
    let query = "";
    let open = false;
    let selectedIndex = 0;
    let destroyed = false;

    function cityName(city) {
      if (!city) return "";
      return getLanguage() === "fr" && city.name_fr ? city.name_fr : city.name;
    }

    function selectedCity() {
      return cityById.get(value) || null;
    }

    function inputValue() {
      if (open || query) return query;
      const city = selectedCity();
      return city ? cityName(city) : String(options.fallbackLabel || "");
    }

    function currentResults() {
      return search.matches(indexedCities, query, [], 6);
    }

    function chooseCity(city) {
      if (!city || city.id === value) {
        query = "";
        open = false;
        render({ focusInput: true });
        return;
      }
      onBeforeChange();
      value = city.id;
      query = "";
      open = false;
      selectedIndex = 0;
      onChange(city);
      render({ focusInput: true });
    }

    function clearCity() {
      if (!value && !query) return;
      onBeforeChange();
      value = "";
      query = "";
      open = false;
      selectedIndex = 0;
      onChange(null);
      render({ focusInput: true });
    }

    function renderResult(city, index) {
      const selected = index === selectedIndex;
      const coordinates = `${Number(city.lat).toFixed(2)}, ${Number(city.lon).toFixed(2)}`;
      return `
        <button type="button" id="${escapeHtml(idPrefix)}Result${index}" class="refCityResultRow${selected ? " is-selected" : ""}" role="option" aria-selected="${selected}" tabindex="-1" data-city-location-result="${escapeHtml(city.id)}" data-city-location-result-index="${index}">
          <span class="refCityResultDot" aria-hidden="true"></span>
          <span class="refCityResultMain">
            <span class="refCityResultName">${escapeHtml(cityName(city))}</span>
            <span class="refCityResultCoordinates">${escapeHtml(coordinates)}</span>
          </span>
          <span class="refCityResultMeta"><span class="refCityResultProvince">${escapeHtml(getProvinceName(city, getLanguage()))}</span></span>
        </button>`;
    }

    function render(renderOptions = {}) {
      if (destroyed) return;
      const results = currentResults();
      selectedIndex = Math.max(0, Math.min(selectedIndex, Math.max(results.length - 1, 0)));
      const showResults = open && query.trim().length > 0;
      const activeDescendant = showResults && results[selectedIndex] ? `${idPrefix}Result${selectedIndex}` : "";
      const city = selectedCity();
      const label = query || (city ? `${cityName(city)}, ${getProvinceName(city, getLanguage())}` : inputValue());
      rootElement.classList.add("city-location-field");
      rootElement.classList.toggle("is-compact", compact);
      rootElement.innerHTML = `
        <div class="refCityCombobox cityLocationCombobox">
          <span class="refCitySearchIcon" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></span>
          <input id="${escapeHtml(idPrefix)}Input" class="refCityInput cityLocationInput" type="text" value="${escapeHtml(label)}" placeholder="${escapeHtml(translate("projectCities.row.placeholder"))}" autocomplete="off" role="combobox" aria-label="${escapeHtml(translate("projectCities.row.aria"))}" aria-autocomplete="list" aria-expanded="${showResults}" aria-controls="${escapeHtml(idPrefix)}Results"${activeDescendant ? ` aria-activedescendant="${escapeHtml(activeDescendant)}"` : ""}>
          ${value ? `<button type="button" class="cityLocationClear" data-city-location-clear aria-label="${escapeHtml(translate("projectCities.row.clear", { city: city ? cityName(city) : label }))}">×</button>` : ""}
          <div id="${escapeHtml(idPrefix)}Results" class="refCityResults cityLocationResults ui-floating-surface" role="listbox"${showResults ? "" : " hidden"}>
            ${results.length ? results.map(renderResult).join("") : `<div class="refCityNoMatch">${escapeHtml(translate("projectCities.row.noMatch"))}</div>`}
          </div>
        </div>`;
      if (renderOptions.focusInput) {
        const input = rootElement.querySelector(".cityLocationInput");
        input?.focus({ preventScroll: true });
        const length = input ? input.value.length : 0;
        input?.setSelectionRange(length, length);
      }
    }

    function beginSearch(input) {
      if (!open) query = "";
      open = true;
      if (input && value && input.value === `${cityName(selectedCity())}, ${getProvinceName(selectedCity(), getLanguage())}`) {
        input.select();
      }
    }

    function handleInput(event) {
      if (!event.target.matches(".cityLocationInput")) return;
      query = event.target.value;
      open = true;
      selectedIndex = 0;
      render({ focusInput: true });
    }

    function handleFocus(event) {
      if (!event.target.matches(".cityLocationInput")) return;
      beginSearch(event.target);
    }

    function handleBlur(event) {
      if (!event.target.matches(".cityLocationInput")) return;
      window.setTimeout(() => {
        if (destroyed || rootElement.contains(document.activeElement)) return;
        query = "";
        open = false;
        render();
      }, 0);
    }

    function handleKeydown(event) {
      if (!event.target.matches(".cityLocationInput")) return;
      const results = currentResults();
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, Math.max(results.length - 1, 0));
        open = true;
        render({ focusInput: true });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        open = true;
        render({ focusInput: true });
      } else if (event.key === "Enter" && results[selectedIndex]) {
        event.preventDefault();
        chooseCity(results[selectedIndex]);
      } else if (event.key === "Escape") {
        event.stopPropagation();
        query = "";
        open = false;
        render({ focusInput: true });
      }
    }

    function handleMouseDown(event) {
      const row = event.target.closest("[data-city-location-result]");
      if (!row || !rootElement.contains(row)) return;
      event.preventDefault();
      chooseCity(cityById.get(row.dataset.cityLocationResult));
    }

    function handleMouseOver(event) {
      const row = event.target.closest("[data-city-location-result-index]");
      if (!row || !rootElement.contains(row)) return;
      const nextIndex = Number(row.dataset.cityLocationResultIndex);
      if (!Number.isInteger(nextIndex) || nextIndex === selectedIndex) return;
      selectedIndex = nextIndex;
      rootElement.querySelectorAll(".refCityResultRow").forEach((item, index) => {
        const selected = index === selectedIndex;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-selected", String(selected));
      });
    }

    function handleClick(event) {
      if (event.target.closest("[data-city-location-clear]")) clearCity();
    }

    rootElement.addEventListener("input", handleInput);
    rootElement.addEventListener("focusin", handleFocus);
    rootElement.addEventListener("focusout", handleBlur);
    rootElement.addEventListener("keydown", handleKeydown);
    rootElement.addEventListener("mousedown", handleMouseDown);
    rootElement.addEventListener("mouseover", handleMouseOver);
    rootElement.addEventListener("click", handleClick);
    render();

    return {
      getValue: () => value,
      setValue(nextValue, fallbackLabel = "") {
        value = String(nextValue || "");
        options.fallbackLabel = String(fallbackLabel || "");
        query = "";
        open = false;
        selectedIndex = 0;
        render();
      },
      refresh: () => render(),
      focus: () => rootElement.querySelector(".cityLocationInput")?.focus({ preventScroll: true }),
      destroy() {
        destroyed = true;
        rootElement.removeEventListener("input", handleInput);
        rootElement.removeEventListener("focusin", handleFocus);
        rootElement.removeEventListener("focusout", handleBlur);
        rootElement.removeEventListener("keydown", handleKeydown);
        rootElement.removeEventListener("mousedown", handleMouseDown);
        rootElement.removeEventListener("mouseover", handleMouseOver);
        rootElement.removeEventListener("click", handleClick);
        rootElement.innerHTML = "";
      }
    };
  }

  return { cloneModel, createDefaultModel, createField, createSingleField, normalizeModel };
});
