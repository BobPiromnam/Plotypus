# Plotypus

**Plotypus** is a static web app for making publication-style maps from project data. It supports map regions, project markers, labels, leader lines, legends, no-coordinate callouts, and SVG/PNG export.

Plotypus is designed to be simple for non-technical users: download the folder and open `index.html`.

## Contents

- [For Users](#for-users)
- [For Developers And Publishers](#for-developers-and-publishers)
- [Project Files](#project-files)
- [CSV Format](#csv-format)
- [Configuration](#configuration)
- [Configuration By Example](#configuration-by-example)
- [Local Testing](#local-testing)
- [Privacy](#privacy)
- [License](#license)

## For Users

### Start Plotypus

1. Download or copy the Plotypus folder.
2. Open `index.html` in Microsoft Edge, Chrome, or another modern browser.
3. Use the tabs to enter data, style the map, preview it, and export the final image.

No install step is required.

### Basic Workflow

1. Add or import project rows in **Project points**.
2. Choose included regions and colours in **Map baselayer**.
3. Define marker categories in **Legend and markers**.
4. Adjust page, image, map, label, and furniture settings in **Preview**.
5. Click **Run auto-place** when you want Plotypus to calculate label positions.
6. Drag labels, the legend, callouts, or the map for final adjustment.
7. Export the map as SVG or PNG.

### Notes

- **Run auto-place** is intentional. Moving the map, legend, labels, or callouts should not silently reposition all labels.
- Blank longitude or latitude values become no-coordinate callouts.
- Manual label positions are preserved until you run auto-place again.
- Final maps should always be reviewed before publication.

## For Developers And Publishers

Plotypus is a static HTML/CSS/JavaScript app. It currently has no build step and should remain easy to run from `file://` unless the project formally moves to a hosted-only workflow.

Runtime libraries are pinned and bundled in `assets/vendor/`, so normal map rendering and CSV import do not require an internet connection.

### Key Files

| File | Purpose |
| --- | --- |
| `index.html` | App entry point and script loading order |
| `app.js` | Main app logic, rendering, interaction, imports, exports, and label placement |
| `project-file.js` | Project-file schema validation and legacy-version normalization |
| `style.css` | App UI styling |
| `config.js` | Bundled defaults and config loading |
| `plotypus.config.json` | Optional department-level configuration |
| `icons.js` | Shared icon definitions |
| `sample-projects.csv` | Sample project data |
| `assets/` | Boundary data, logo assets, fonts, and pinned runtime libraries |
| `themes/` | Map theme CSS |
| `geometry.js` | Pure rectangle and segment geometry used by label layout and interaction tools |
| `label-layout.js` | Dependency-injected label placement policies and optimization utilities |
| `tests/` | Unit and smoke tests |

### What To Customize

Use `plotypus.config.json` when you want another department or publisher to customize defaults without editing the main app code.

Common configuration areas:

| Config area | What it controls |
| --- | --- |
| `defaults` | The starting book size, image size, print label size, map scale, marker size, line width, and label max characters |
| `bookSizes` | The Book size dropdown and each related Image size option |
| `fonts` | The Map font dropdown |
| `categories` | The default legend marker names, marker shapes, marker colours, marker sizes, and line widths |
| `categoryColourPresets` | The approved colour choices shown in category colour dropdowns |
| `mapStyles` | The map style dropdown, map theme CSS files, region colour ramps, and default marker styles |
| `sampleRows` | The sample table loaded by the sample-data buttons |

See [docs/configuration.md](docs/configuration.md) for the full configuration guide.

### Running With JSON Configuration

Opening `index.html` directly is enough for normal use. Some browsers block local JSON reads from `file://`, so use a local static server when testing `plotypus.config.json`:

```powershell
.\start-plotypus.ps1
```

Or start a server manually:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Project Files

Use **Save project** when you want to preserve the full working state of a map. The downloaded JSON file is self-contained and can be shared directly; uploaded category icons and rich-label images are embedded in it rather than linked to files on the original computer. Rich-label image sizes and original proportions are saved with each image. Project files include rows, regions, colours, category styles, resolved label positions for each rendered language, legend and callout positions, and layout settings.

Project files identify their Plotypus format version and the app version that saved them. Open a shared project with a Plotypus build that supports that project version; older builds reject newer files instead of opening them and potentially discarding fields when the project is saved again.

Use CSV when you only need to exchange the project-point table with Excel or another data source.

The Properties panel's left/right position, width, and collapsed state are interface preferences saved in the current browser. They are intentionally separate from project files, so opening a shared map does not change another user's preferred workspace layout.

## CSV Format

Recommended columns:

```csv
name,footnote,type,lon,lat,hideLine
```

Required columns:

```csv
name,type,lon,lat
```

| Column | Description |
| --- | --- |
| `name` | Label text |
| `footnote` | Optional superscript text |
| `type` | Marker category |
| `lon` | Longitude in decimal degrees |
| `lat` | Latitude in decimal degrees |
| `hideLine` | Hides the leader line for truthy values |

Accepted `hideLine` values include `yes`, `true`, `hide`, `hidden`, `no line`, and `no leader line`.

## Configuration

Plotypus has two configuration layers:

| Layer | File | Purpose |
| --- | --- | --- |
| Bundled defaults | `config.js` | Keeps the app usable from `file://` |
| Department config | `plotypus.config.json` | Lets maintainers customize hosted or local-server deployments |

When adding new configurable options, keep the bundled defaults and JSON config in sync.

Validate config changes before sharing them:

```powershell
node tests\validate-config.cjs
```

## Configuration By Example

This section shows the JSON syntax used in `plotypus.config.json`.

### JSON Keys

When the docs say "key", they mean the name on the left side of a JSON object entry.

In this example, `department-green` is the key:

```json
{
  "mapStyles": {
    "department-green": {
      "label": "Department green"
    }
  }
}
```

The key is not shown directly to users. It is the internal ID Plotypus uses to connect related settings. The user-facing name is usually the `label`.

### Map Style Example

Use `mapStyles` to add a map style. Set `defaultMapStylePreset` to the same key if that style should load by default.

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

For that example to pass validation, the file `themes/department-green.css` must exist.

### Book And Image Size Example

Use `bookSizes` to define the Book size dropdown. Each entry inside `sizes` becomes an Image size option for that book size.

```json
{
  "defaults": {
    "bookSize": "department-report",
    "imageSize": "half",
    "printLabelSize": 12,
    "mapScale": 100,
    "defaultMarkerSize": 4,
    "defaultLineWidth": 2,
    "labelMaxChars": 24
  },
  "bookSizes": {
    "department-report": {
      "label": "Department report",
      "documentPage": { "widthIn": 8.5, "heightIn": 11, "marginIn": 1 },
      "sizes": [
        { "value": "full", "label": "Full page", "width": 792, "height": 570 },
        { "value": "half", "label": "1/2 page", "width": 792, "height": 285 }
      ]
    }
  }
}
```

In this example:

- `defaults.bookSize` must match the `department-report` key.
- `defaults.imageSize` must match one of the `sizes[].value` entries.
- `documentPage` sets the width, height and conventional margin used by the non-exported document-page preview.
- `width` and `height` are output canvas dimensions in pixels.

### Category Example

Use `categories` to define the default marker types in the legend and in the Project points `Type` dropdown.

```json
{
  "categories": [
    {
      "id": "capital-project",
      "label": "Capital Project",
      "defaultLabel": "Capital Project",
      "shape": "circle",
      "colour": "#444444",
      "stroke": "#ffffff",
      "markerSize": 10,
      "lineWidth": 2,
      "markerSizeCustom": false,
      "lineWidthCustom": false,
      "collapsed": false,
      "removable": false
    },
    {
      "id": "strategy",
      "label": "Strategy",
      "defaultLabel": "Strategy",
      "shape": "square",
      "colour": "#ffffff",
      "stroke": "#555555",
      "markerSize": 10,
      "lineWidth": 2,
      "markerSizeCustom": false,
      "lineWidthCustom": false,
      "collapsed": false,
      "removable": true
    }
  ]
}
```

Category rules:

- `id` must be unique and should use simple lowercase text such as `capital-project`.
- `label` is what users see in the app.
- `sampleRows[].type` should match a category `label`, not the `id`.
- Supported marker shapes include `circle`, `square`, `diamond`, `triangle-up`, `triangle-down`, `star`, `plus`, and `cross`.

### Colour Preset Example

Use `categoryColourPresets` to control which marker colours are available in dropdowns.

```json
{
  "categoryColourPresets": [
    { "value": "", "label": "Custom" },
    { "value": "#26374a", "label": "GoC blue" },
    { "value": "#217346", "label": "Green" },
    { "value": "#444444", "label": "Charcoal" },
    { "value": "#ffffff", "label": "White" }
  ]
}
```

Use hex colours such as `#444444`. Keep the empty value if you want users to be able to choose their own custom colour.

### Font Example

Use `fonts` to add Map font choices. If the font is bundled with Plotypus, point `stylesheet` to the local CSS file that defines `@font-face`.

```json
{
  "defaultFontFamily": "Department Sans, Arial, sans-serif",
  "fonts": [
    {
      "label": "Department Sans",
      "value": "Department Sans, Arial, sans-serif",
      "stylesheet": "assets/fonts/department-sans/department-sans.css"
    },
    {
      "label": "Arial",
      "value": "Arial, sans-serif"
    }
  ]
}
```

For this example to pass validation, the file `assets/fonts/department-sans/department-sans.css` must exist.

### Sample Row Example

Use `sampleRows` to change the starter data.

```json
{
  "sampleRows": [
    {
      "name": "Example Mine",
      "type": "Capital Project",
      "lon": -103.9,
      "lat": 54.5
    },
    {
      "name": "National Strategy",
      "type": "Strategy",
      "lon": "",
      "lat": ""
    }
  ]
}
```

Rows with blank `lon` and `lat` become no-coordinate callouts. If one coordinate is blank, the other coordinate must also be blank.

### Validate Changes

After editing `plotypus.config.json`, run:

```powershell
node tests\validate-config.cjs
```

Validate another config file:

```powershell
node tests\validate-config.cjs configs\department-example.json
```

The validator catches common publishing mistakes before someone opens the app, including missing CSS files, duplicate category IDs, invalid colours, bad image sizes, and sample rows whose `type` does not match a configured category label.

## Local Testing

Pull requests and pushes to `main` run the Windows CI workflow in `.github/workflows/windows-ci.yml`. It checks JavaScript and configuration, runs unit tests, exercises the shell and generated map in Chrome, and compares the approved workspace screenshots. Failed browser jobs upload screenshots, DOM captures, browser errors, and visual diffs as workflow artifacts for 14 days.

Quick checks:

```powershell
node --check app.js
node --check config.js
node --check geometry.js
node --check icons.js
node --check label-layout.js
node --check project-file.js
node --check tests\validate-config.cjs
node tests\validate-config.cjs
node --test tests\geometry.test.cjs tests\label-layout.test.cjs tests\label-geometry.test.cjs tests\config-parity.test.cjs
```

Smoke test:

```powershell
.\tests\run-smoke.ps1
.\tests\run-shell-smoke.ps1
```

Smoke-test output is written under `tests/smoke-output/` and is ignored by Git.
The smoke run loads the bundled sample, runs auto-placement, verifies map-quality thresholds, and captures a screenshot unless `-SkipScreenshot` is supplied.
The shell smoke test starts a temporary localhost server, exercises workspace navigation and the Export menu with mouse and keyboard events, and captures the final UI state. Test the supported shell widths with:

```powershell
.\tests\run-shell-smoke.ps1 -Width 1440 -Height 1000
.\tests\run-shell-smoke.ps1 -Width 1280 -Height 900
.\tests\run-shell-smoke.ps1 -Width 1024 -Height 800
```

Target a workspace or dialog while refining the shell:

```powershell
.\tests\run-shell-smoke.ps1 -Workspace quality -LoadSample
.\tests\run-shell-smoke.ps1 -Dialog map-details
.\tests\run-shell-smoke.ps1 -Dialog csv-map
.\tests\run-shell-smoke.ps1 -Dialog point-catalog -CatalogOrigin projects
.\tests\run-shell-smoke.ps1 -Dialog point-catalog -CatalogOrigin regions
```

The optional performance diagnostic exercises scheduled auto-placement and verifies timing classification. Chromium virtual time is suitable for wiring checks, not wall-clock benchmarking:

```powershell
.\tests\run-shell-smoke.ps1 -Workspace quality -LoadSample -MeasurePerformance -VirtualTimeBudgetMs 90000 -SkipScreenshot
```

Visual regression uses approved PNG baselines for every desktop workspace plus Map and Project points at the 1280px and 1024px responsive breakpoints:

```powershell
# Capture current views and compare them with approved baselines.
.\tests\run-visual-regression.ps1

# Narrow a review to one workspace or an exact case while refining UI.
.\tests\run-visual-regression.ps1 -Workspace regions
.\tests\run-visual-regression.ps1 -Case regions-1440x1000

# Produce a report and diff images without failing the command during design audits.
.\tests\run-visual-regression.ps1 -Workspace regions -ReportOnly

# Exercise every workspace at all three supported widths.
.\tests\run-visual-regression.ps1 -FullMatrix

# After reviewing every image in tests\visual-output, approve intentional changes.
.\tests\run-visual-regression.ps1 -UpdateBaselines
```

Approved images live in `tests/visual-baselines/`. Current captures, red diff overlays, and `visual-regression-report.json` are written to the ignored `tests/visual-output/` directory. Do not update baselines merely to make a failure disappear; first confirm that the shell change is intentional and that generated map output still passes `run-smoke.ps1`.

## Privacy

Plotypus runs locally in the browser. Project data is not uploaded by the app. Data leaves the page only when the user saves, exports, copies, or otherwise shares files.

## License

See [LICENSE](LICENSE).
