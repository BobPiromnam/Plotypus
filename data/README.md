# Offline Canadian city catalogue

`cities.json` is bundled with Plotypus. The application never performs a network lookup while an author searches for or adds a city.

The catalogue is generated from:

- Natural Resources Canada, Canadian Geographical Names Database (CGNDB): official place names and WGS84 coordinates.
- Statistics Canada, 2021 GeoSuite data package: census-subdivision population and official representative points. Population is used only to include places with at least 1,000 residents and rank autosuggest results; representative points cover subdivisions that have no exact populated-place name match in CGNDB.

To rebuild it, download and unpack the Canada-wide English CGN CSV bundle and the Statistics Canada table CSV, then run:

```powershell
node tools/build-cities.js --cgn C:\path\to\cgn_canada_csv_eng.csv --geosuite C:\path\to\CSD.csv
node tools/build-reference-city-runtime.cjs
```

The first command fails instead of replacing the catalogue if fewer than 1,000 official name/coordinate matches are produced. The second command regenerates the classic scripts used when Plotypus is opened directly from disk.

## Boundary data

`boundaries/` contains the bundled Canada and world GeoJSON fallbacks plus
classic-script copies for direct-file use. The deployment configuration may
name a remote boundary source, but Plotypus must always retain these local
fallbacks for offline operation.
