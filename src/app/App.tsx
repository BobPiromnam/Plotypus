import { PrimitiveGallery } from "./PrimitiveGallery";

export function App() {
  return (
    <main className="react-migration-shell" aria-labelledby="reactMigrationTitle">
      <section className="react-migration-panel">
        <img className="app-logo" src="/assets/plotypus-pin.png" alt="" aria-hidden="true" width="32" height="32" />
        <div>
          <p className="react-migration-kicker">Plotypus React migration</p>
          <h1 id="reactMigrationTitle">React shell scaffold</h1>
          <p>
            This entry point is separate from the production app. It lets us build and test React components while the
            current vanilla Plotypus editor remains unchanged.
          </p>
        </div>
      </section>
      <PrimitiveGallery />
    </main>
  );
}
