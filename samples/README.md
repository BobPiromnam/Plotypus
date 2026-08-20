# Sample imports

These fictional CSV files exercise the three supported Markers location modes:

| File | Location mode | Required location fields |
| --- | --- | --- |
| `sample-projects.csv` | Coordinates | `lon`, `lat` |
| `sample-projects-cities.csv` | City | `city` |
| `sample-projects-provinces.csv` | Province or territory | `region` |

Keep the fixtures small, bilingual, and free of real internal project data.
`tests/import-samples.test.cjs` validates their headers and location values.
