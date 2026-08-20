# Runtime source

Plotypus loads these classic browser scripts in the explicit order declared at
the end of `index.html`. They publish small `window.PLOTYPUS_*` APIs so the app
continues to work when `index.html` is opened directly from disk.

- `app.js` owns application state, orchestration, rendering, import/export, and
  interaction wiring.
- Focused files such as `geometry.js`, `project-io.js`, `properties.js`, and
  `workspace.js` expose reusable boundaries consumed by `app.js`.
- `config.js` is the bundled fallback paired with the root
  `plotypus.config.json` deployment configuration.
- `lib/` contains focused first-party libraries and generated browser bridges.

Do not convert an individual file to ESM or change script order without also
updating the direct-file runtime and its tests.
