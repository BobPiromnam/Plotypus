# Plotypus Refactor Roadmap

Plotypus is intentionally usable from `file://`, so refactors should preserve classic script loading unless the app moves behind a local dev server. Avoid switching to ES modules without validating local-file behavior in the target browsers.

## Current Direction

- Keep user-visible behavior stable while splitting large constants and UI assets out of `app.js`.
- Prefer small classic-script modules that publish a single `window.PLOTYPUS_*` namespace.
- Move pure functions toward testable files before moving stateful DOM/render code.
- Use `scheduleRender()` for expensive redraws triggered by UI controls, so sidebar/table interactions update before the map recomputes.

## Suggested Extraction Order

1. `icons.js`: toolbar and setting SVG path catalogue. Done.
2. `config.js`: size presets, CSV aliases, marker shape options, region presets, and JSON-backed department defaults. Done.
3. `geometry.js`: rectangle/segment helpers already covered by label geometry tests. Done.
4. `label-layout.js`: candidate generation, scoring, side-band optimization, quality measurement and manual-position handling. Done.
5. `project-io.js`: CSV/project import/export and local storage preferences. Done.
6. `workspace.js`: workspace/tab state, summaries and navigation helpers. Done.
7. `properties.js`: contextual Properties panel renderers. Done.
8. `map-renderer.js`: D3 drawing for map, markers, leaders, labels, legend, callouts.

Each step should leave `app.js` as the orchestrator until enough state has been separated to introduce clearer controller objects.

## Label Layout Boundary

`window.PLOTYPUS_LABEL_LAYOUT.create(dependencies)` provides the label-layout boundary. It owns placement scoring weights, side-order policy, deterministic optimization utilities, candidate placement, candidate/perimeter generation, dense-layout optimization, quality measurement and manual-position transformations without reading application globals directly.

The adapter in `app.js` must provide these dependencies explicitly:

- Geometry from `window.PLOTYPUS_GEOMETRY`.
- Label measurement and wrapping (`makeLabelBox`, font size, visual height and baseline helpers).
- Category marker size lookup for marker collision boxes.
- Preferred-side and designer-offset policies.
- Manual-position maps and stable label keys.
- Furniture obstacles and current render settings.

Map-scale selection, language-layout caching and D3 drawing remain in `app.js` because they are still controller/rendering concerns rather than pure layout policy.

## Step 3: Custom Marker Security and Export Design

Step 3 begins with a design/security plan, not marker upload implementation. See [Custom Marker Security and Export Plan](custom-marker-security-plan.md).

Implementation should wait until departments confirm a real need for custom markers. The safest first version should accept validated PNG/WebP files only, normalize them into embedded data URLs for offline project files and exports, and continue to reject arbitrary SVG upload until sanitization and export requirements are settled.
