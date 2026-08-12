<p align="center">
  <img src="assets/plotypus-pin.png" width="88" alt="Plotypus logo">
</p>

<h1 align="center">Plotypus</h1>

<p align="center"><strong>Turn spreadsheet data into publication-ready static maps—without GIS software or a build step.</strong></p>

<p align="center">
  <a href="#quick-start">Quick start</a> ·
  <a href="#what-plotypus-does">Features</a> ·
  <a href="#prepare-your-data">Data format</a> ·
  <a href="#configure-a-deployment">Configuration</a> ·
  <a href="#develop-and-test">Development</a>
</p>

<p align="center">
  <a href="https://github.com/BobPiromnam/Plotypus/actions/workflows/windows-ci.yml"><img src="https://github.com/BobPiromnam/Plotypus/actions/workflows/windows-ci.yml/badge.svg" alt="Windows CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3f6f61" alt="MIT license"></a>
</p>

![Plotypus workspace showing a publication map of Canada with project labels, leader lines, callouts, and map properties](docs/screenshots/preview.png)

Plotypus is a local-first browser app for policy, research, and communications teams creating fixed-layout maps for reports, briefings, websites, and print. Import CSV or Excel data, arrange markers and labels, review the result, and export SVG or PNG. The app runs entirely on your computer: no account, hosted service, or GIS toolchain is required.

Plotypus focuses on the last mile of map publishing—legible labels, controlled page dimensions, bilingual content, and repeatable output—rather than interactive map exploration.

## What Plotypus does

- **Starts with a spreadsheet.** Import CSV, TSV, or XLSX data, paste rows from a spreadsheet, or enter points directly.
- **Supports two location workflows.** Place projects with longitude and latitude, or attach them to named regions. Rows without coordinates can become map callouts.
- **Builds publication layouts.** Control page and canvas size, map scale, regional fills, marker categories, label wrapping, leader lines and colours, legends, and callouts.
- **Automates without taking over.** Run label auto-placement when you choose, then drag labels, markers, the map, legend, and callouts into their final positions. Manual placements remain intact until you run auto-place again.
- **Publishes in English and French.** Maintain bilingual project names, categories, map titles, and accessible text descriptions in one project.
- **Checks the map before export.** Review missing data and translations, label overlaps, leader-line crossings, off-canvas points, edge clearance, and other publishing issues.
- **Keeps projects portable.** Save the complete working state as JSON; uploaded marker icons and rich-label images are embedded in the project file.
- **Exports useful deliverables.** Download editable SVG for print, PNG for the web, or CSV for continued data work.

Runtime libraries, fonts, and Canada/world boundary data are bundled with the repository, so normal use works offline.

## See the workflow

<table>
  <tr>
    <td width="50%">
      <a href="docs/screenshots/projects.png"><img src="docs/screenshots/projects.png" alt="Plotypus Project points workspace with spreadsheet rows and coordinate controls"></a><br>
      <strong>Bring in source data</strong><br>
      <sub>Edit spreadsheet rows and locations directly.</sub>
    </td>
    <td width="50%">
      <a href="docs/screenshots/regions.png"><img src="docs/screenshots/regions.png" alt="Plotypus Map baselayer workspace with Canadian regions, status visibility, and colour controls"></a><br>
      <strong>Control the baselayer</strong><br>
      <sub>Choose regions, statuses, and colour order.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <a href="docs/screenshots/translate.png"><img src="docs/screenshots/translate.png" alt="Plotypus Translate workspace showing English and French project titles side by side"></a><br>
      <strong>Manage bilingual content</strong><br>
      <sub>Review English and French strings side by side.</sub>
    </td>
    <td width="50%">
      <a href="docs/screenshots/quality.png"><img src="docs/screenshots/quality.png" alt="Plotypus Map quality workspace with export-readiness checks"></a><br>
      <strong>Review export readiness</strong><br>
      <sub>Locate layout and publishing issues before export.</sub>
    </td>
  </tr>
</table>

## Quick start

Plotypus has no installation or build step.

1. [Download the repository as a ZIP](https://github.com/BobPiromnam/Plotypus/archive/refs/heads/main.zip) and extract it, or clone it:

   ```text
   git clone https://github.com/BobPiromnam/Plotypus.git
   ```

2. Open `index.html` in Microsoft Edge, Chrome, or another modern desktop browser.
3. Select **Sample** to load the example project.
4. Select **Fit: map + labels**, refine the layout, and open **Map quality** to review it.
5. Select **Export** and download an SVG or PNG.

Opening `index.html` directly is the simplest way to use the app. To load overrides from `plotypus.config.json`, run the included local server instead:

```powershell
.\start-plotypus.ps1
```

Or use Python on any platform:

```text
python -m http.server 8000
```

Then open <http://localhost:8000/>.

## Make a map

The five workspaces follow the publishing workflow:

1. **Project points** — add, paste, or import your source data. Choose coordinate or region-based locations.
2. **Map baselayer** — choose Canada or the world, include the regions you need, and set fills, values, and statuses.
3. **Map** — define legend items from Document Properties, choose the page and canvas size, run auto-placement, and make final adjustments directly on the canvas.
4. **Translate** — add or import French content and review missing translations.
5. **Map quality** — resolve automated checks, locate layout problems, and complete the final human review.

For a new dataset, define the legend items in **Map** before importing rows so incoming `type` values can be matched correctly.

## Prepare your data

Plotypus recognizes common English and French column headings and lets you confirm their mapping during import.

| Column | When needed | Purpose |
| --- | --- | --- |
| `name` | Required | English project or label text |
| `type` | Required | Legend category ID or label; stable IDs are preferred for integrations |
| `lon`, `lat` | Coordinate mode | Decimal-degree longitude and latitude |
| `region` | Region mode | Province, territory, country, or other region name |
| `name_fr` | Optional | French project or label text |
| `type_fr` | Optional | French category text |
| `footnote` | Optional | Superscript footnote marker |
| `hideLine` | Optional | Hides the label's leader line when truthy |

Minimal coordinate example:

```csv
name,name_fr,type,type_fr,lon,lat
Grays Bay Road and Port,Route et port de Grays Bay,Referred Project,Projets soumis,-108.4,68.5
Critical Minerals Strategy,Stratégie sur les minéraux critiques,Transformative Strategy,Stratégies de transformation,,
```

When both coordinates are blank, the row is displayed as a no-coordinate callout. Accepted `hideLine` values include `yes`, `true`, `hide`, `hidden`, `no line`, and `no leader line`.

See [`sample-projects.csv`](sample-projects.csv) for a complete example.

## Save, share, and export

Use **Save** to preserve the complete map as a self-contained Plotypus JSON project. Project files include source rows, styles, region settings, English and French layouts, resolved label positions, map furniture positions, and embedded image assets. Use **Open** to continue editing or share the JSON file with another Plotypus user.

Use CSV when you only need to exchange the project-point table. Use SVG for editable, print-oriented artwork and PNG for raster output.

Plotypus does not upload project data. Data leaves the page only when you save, export, copy, or otherwise share a file.

> [!IMPORTANT]
> Automated checks support editorial review; they do not replace it. Always inspect the final exported map before publication.

## Configure a deployment

Publishers can customize Plotypus without changing the application code.

| Layer | File | Purpose |
| --- | --- | --- |
| Bundled defaults | [`config.js`](config.js) | Keeps the app usable when opened directly from `file://` |
| Deployment overrides | [`plotypus.config.json`](plotypus.config.json) | Customizes a hosted or local-server deployment |

Configuration covers page and image sizes, fonts, map themes, category styles, approved colours, performance budgets, defaults, and sample data. Browsers commonly block sibling JSON reads from `file://`, so serve the folder locally when testing `plotypus.config.json`.

Read the [configuration guide](docs/configuration.md) for examples and the complete publishing workflow. Validate changes with:

```text
node tests/validate-config.cjs
```

## Develop and test

Plotypus is intentionally a static HTML/CSS/JavaScript application. Its classic-script loading order preserves direct-file use, and runtime dependencies are pinned under `assets/vendor/`.

### Project layout

| Path | Responsibility |
| --- | --- |
| [`index.html`](index.html) | App shell and script loading order |
| [`app.js`](app.js) | Rendering, interaction, import/export, and application orchestration |
| [`label-layout.js`](label-layout.js), [`geometry.js`](geometry.js) | Label placement policies and testable geometry |
| [`project-io.js`](project-io.js), [`project-file.js`](project-file.js) | Project serialization, validation, and version normalization |
| [`region-matching.js`](region-matching.js) | Region-name and location matching |
| [`i18n.js`](i18n.js) | English and French interface strings |
| [`config.js`](config.js), [`plotypus.config.json`](plotypus.config.json) | Defaults and deployment configuration |
| [`themes/`](themes) | Map-specific stylesheets |
| [`tests/`](tests) | Unit, smoke, interaction, and visual-regression coverage |

Run the fast checks with Node.js:

```text
node --check app.js
node tests/validate-config.cjs
node --test tests/geometry.test.cjs tests/label-layout.test.cjs tests/label-geometry.test.cjs tests/config-parity.test.cjs tests/region-matching.test.cjs tests/typography.test.cjs
```

On Windows, run the browser suites with PowerShell and Edge or Chrome installed:

```powershell
.\tests\run-smoke.ps1
.\tests\run-shell-smoke.ps1
.\tests\run-visual-regression.ps1
```

Visual-regression captures and diff reports are written to the ignored `tests/visual-output/` directory. Approved baselines live in `tests/visual-baselines/`; update them only after reviewing an intentional UI change.

## Contributing and support

Bug reports and focused improvements are welcome through [GitHub Issues](https://github.com/BobPiromnam/Plotypus/issues). Before opening a pull request, run the Node checks above; changes to the interface or map output should also pass the browser and visual-regression suites.

## License

Plotypus is available under the [MIT License](LICENSE).
