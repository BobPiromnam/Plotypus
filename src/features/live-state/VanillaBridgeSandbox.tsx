import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "../../components/primitives";
import type { PlotypusSnapshot, PlotypusStateAdapter } from "../../core/plotypusStateAdapter";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { createVanillaPlotypusStateAdapter } from "../../core/vanillaPlotypusStateAdapter";
import { ProjectPointsToolbar } from "../project-points/ProjectPointsToolbar";
import { PropertiesPanelShell } from "../properties/PropertiesPanelShell";

type BridgeStatus = "loading" | "ready" | "unavailable";

export function VanillaBridgeSandbox() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [adapter, setAdapter] = useState<PlotypusStateAdapter | null>(null);
  const [status, setStatus] = useState<BridgeStatus>("loading");
  const vanillaSrc = useMemo(() => getVanillaAppUrl(), []);

  const handleFrameLoad = () => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      setStatus("unavailable");
      return;
    }

    waitForVanillaBridge(frameWindow)
      .then(() => {
        setAdapter(createVanillaPlotypusStateAdapter(frameWindow));
        setStatus("ready");
      })
      .catch(() => {
        setStatus("unavailable");
      });
  };

  return (
    <main className="vanilla-bridge-shell">
      <section className="vanilla-bridge-panel" aria-labelledby="vanillaBridgeTitle">
        <div>
          <p className="react-migration-kicker">Read-only bridge</p>
          <h1 id="vanillaBridgeTitle">React preview from the vanilla app</h1>
          <p>
            This sandbox embeds the current Plotypus app and renders React UI from its read-only state bridge. It does
            not replace or mutate production controls.
          </p>
        </div>
        <BridgeStatusPill status={status} />
      </section>

      <div className="vanilla-bridge-layout">
        <iframe
          ref={iframeRef}
          className="vanilla-bridge-frame"
          title="Plotypus vanilla app"
          src={vanillaSrc}
          onLoad={handleFrameLoad}
        />
        {adapter ? <LiveVanillaStatePreview adapter={adapter} /> : <BridgeWaitingPanel status={status} />}
      </div>
    </main>
  );
}

export function LiveVanillaStatePreview({ adapter }: { adapter: PlotypusStateAdapter }) {
  const snapshot = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot, adapter.getSnapshot);
  return <VanillaStateSnapshotPreview snapshot={snapshot} />;
}

export function VanillaStateSnapshotPreview({ snapshot }: { snapshot: PlotypusSnapshot }) {
  return (
    <section className="vanilla-bridge-preview" aria-labelledby="vanillaBridgePreviewTitle">
      <div className="vanilla-bridge-preview-heading">
        <p className="react-migration-kicker">Live React rendering</p>
        <h2 id="vanillaBridgePreviewTitle">State snapshot</h2>
        <p>
          Workspace: <strong>{snapshot.activeWorkspace}</strong> · Rows: <strong>{snapshot.projectPoints.rowCount}</strong>{" "}
          · UI: <strong>{snapshot.locale.toUpperCase()}</strong> · Map:{" "}
          <strong>{snapshot.mapLanguage.toUpperCase()}</strong>
        </p>
      </div>

      <ProjectPointsToolbar state={snapshot.projectPoints.toolbar} />

      <PropertiesPanelShell
        collapsed={snapshot.properties.collapsed}
        contextKind={snapshot.properties.contextKind}
        guidance="Rendered from the vanilla app's read-only Properties snapshot."
        subtitle={snapshot.properties.subtitle}
        title={snapshot.properties.title}
        sections={[
          {
            title: "Bridge data",
            children: (
              <dl className="vanilla-bridge-facts">
                <div>
                  <dt>Selected cells</dt>
                  <dd>{snapshot.projectPoints.toolbar.selectedCellCount}</dd>
                </div>
                <div>
                  <dt>Selected rows</dt>
                  <dd>{snapshot.projectPoints.toolbar.selectedRowCount}</dd>
                </div>
                <div>
                  <dt>Authoring language</dt>
                  <dd>{snapshot.projectPoints.toolbar.activeLanguage.toUpperCase()}</dd>
                </div>
              </dl>
            )
          }
        ]}
      />
    </section>
  );
}

function BridgeWaitingPanel({ status }: { status: BridgeStatus }) {
  const isUnavailable = status === "unavailable";

  return (
    <section className="vanilla-bridge-preview" aria-live="polite">
      <p className="react-migration-kicker">{isUnavailable ? "Bridge unavailable" : "Waiting for bridge"}</p>
      <h2>{isUnavailable ? "No state bridge found" : "Loading vanilla app state"}</h2>
      <p>
        {isUnavailable
          ? "The iframe loaded, but the read-only Plotypus state bridge was not available."
          : "React will render the toolbar and Properties preview once the vanilla app publishes its snapshot."}
      </p>
      <Button icon="sliders" onClick={() => iframeReload()}>
        Reload sandbox
      </Button>
    </section>
  );
}

function BridgeStatusPill({ status }: { status: BridgeStatus }) {
  const label = status === "ready" ? "Connected" : status === "unavailable" ? "Unavailable" : "Loading";
  return <span className={`vanilla-bridge-status is-${status}`}>{label}</span>;
}

function waitForVanillaBridge(frameWindow: Window): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const poll = () => {
      if ("PLOTYPUS_APP_STATE_READONLY" in frameWindow) {
        resolve();
        return;
      }
      if (performance.now() - started > 8000) {
        reject(new Error("Timed out waiting for PLOTYPUS_APP_STATE_READONLY"));
        return;
      }
      window.setTimeout(poll, 50);
    };
    poll();
  });
}

function getVanillaAppUrl() {
  const isBuiltReactPage = window.location.pathname.replace(/\\/g, "/").includes("/dist/react/");
  return new URL(isBuiltReactPage ? "../../index.html?reactBridge=1" : "../index.html?reactBridge=1", window.location.href).toString();
}

function iframeReload() {
  window.location.reload();
}

export const vanillaBridgeTestSnapshot = createDefaultPlotypusSnapshot;
