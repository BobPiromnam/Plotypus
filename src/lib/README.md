# First-party runtime libraries

These files are application libraries, not downloaded dependencies:

| File | Purpose |
| --- | --- |
| `city-search.js` | ESM reference implementation and Node self-test for offline city lookup |
| `city-search-runtime.js` | Generated classic-script bridge used by direct-file browser mode |
| `xlsx-lite.js` | Deferred, dependency-free XLSX reader used only when an XLSX file is imported |

Rebuild `city-search-runtime.js` with
`node tools/build-reference-city-runtime.cjs`. Third-party browser libraries
belong in `assets/vendor/` with pinned versions and licensing information.
