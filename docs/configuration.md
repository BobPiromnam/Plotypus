# Plotypus Configuration

Plotypus has two configuration layers:

1. `plotypus.config.json` is the department-editable configuration file for hosted or local-server use.
2. `config.js` contains the bundled fallback defaults so `index.html` still opens directly from `file://`.

Browsers usually block JavaScript from reading a sibling JSON file when `index.html` is opened directly from disk. For JSON customization, serve the folder from a simple local/static web server or host the app internally. If the JSON cannot be loaded, Plotypus falls back to the defaults embedded in `config.js`.

## Common Edits

- `fonts`: Add font choices for the Map font dropdown. Use `stylesheet` when the font needs a local CSS file with `@font-face` rules.
- `defaults`: Set default book size, image size, print label size, map scale, marker size, line width and label max characters.
- `performanceBudgets`: Set warning thresholds for ordinary renders, auto-placement and export renders, plus the rolling telemetry sample count.
- `bookSizes`: Define the Book size dropdown, each related Image size option, and optional `documentPage` dimensions (`widthIn`, `heightIn`, and `marginIn`) for the non-exported page preview.
- `categories`: Set default legend marker/category names, shapes, colours, marker sizes and line widths.
- `categoryColourPresets`: Set the approved marker colour dropdown values.
- `mapStyles`: Set map style names, theme CSS files, region colour ramps and default category styles.
- `sampleRows`: Replace the built-in sample table loaded by the sample-data buttons.

## JSON Keys

When this guide says "key", it means the name on the left side of a JSON object entry. In this example, `department-green` is the key:

```json
{
  "mapStyles": {
    "department-green": {
      "label": "Department green"
    }
  }
}
```

Keys are internal IDs. They should be unique inside their object, use simple lowercase text, and avoid spaces. User-facing names belong in `label`.

### Render Performance Budgets

Budgets are measured in milliseconds and surface warnings in **Map quality check**. Scheduled work includes both queue and render time, matching the delay a user experiences. Budgets do not cancel rendering or alter map output.

```json
"performanceBudgets": {
  "renderMs": 200,
  "autoPlaceMs": 1500,
  "exportMs": 800,
  "sampleWindow": 30
}
```

`sampleWindow` controls how many recent render measurements are retained in memory, from 5 to 100.

The latest ordinary, auto-place and export-mode renders appear in **Map quality check**. Plotypus also exposes the same data for diagnostics:

```js
const snapshot = window.PLOTYPUS_RENDER_PERFORMANCE.snapshot();
window.addEventListener("plotypus:render-performance", event => {
  console.log(event.detail);
});
```

Each sample includes render, queue and total time, its budget and warning state, row count, language and output mode. Over-budget samples also produce a console warning. Measurements stay in memory and are not transmitted.

## Validate A Config

Run the validator before sharing a customized config:

```powershell
node tests\validate-config.cjs
```

Validate a different config file:

```powershell
node tests\validate-config.cjs path\to\department.config.json
```

The validator checks for:

- missing required default keys
- duplicate category IDs and labels
- duplicate book/image size values
- invalid colour values
- missing theme CSS files
- missing font CSS files
- bad image dimensions
- bad marker and leader-line sizes
- sample rows with incomplete coordinates
- sample row types that do not match configured categories

## Adding A Font

1. Put the font files under `assets/fonts/<font-name>/`.
2. Create a CSS file with `@font-face` declarations.
3. Add a `fonts` entry:

```json
{
  "label": "Department Sans",
  "value": "Department Sans, Arial, sans-serif",
  "stylesheet": "assets/fonts/department-sans/department-sans.css"
}
```

## Adding A Map Style

1. Create a CSS file in `themes/`.
2. Add a `mapStyles` entry with a key such as `department-green`.
3. Set `defaultMapStylePreset` to that same key if it should be selected by default.

```json
{
  "defaultMapStylePreset": "department-green",
  "mapStyles": {
    "department-green": {
      "label": "Department green",
      "stylesheet": "themes/department-green.css",
      "regionColours": ["#dcebe4", "#94c2aa", "#217346"],
      "categoryStyles": [
        { "colour": "#444444", "stroke": "#ffffff", "markerSize": 10, "lineWidth": 2 },
        { "colour": "#ffffff", "stroke": "#555555", "markerSize": 10, "lineWidth": 2 }
      ]
    }
  }
}
```

Arrays replace the bundled defaults. Objects merge with bundled defaults.
