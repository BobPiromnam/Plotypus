import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "../../components/primitives";
import type { PlotypusSnapshot, PlotypusStateAdapter } from "../../core/plotypusStateAdapter";
import { createDefaultPlotypusSnapshot } from "../../core/plotypusStateAdapter";
import { createVanillaPlotypusStateAdapter } from "../../core/vanillaPlotypusStateAdapter";
import { MapBaselayerPreviewTable } from "../map-baselayer/MapBaselayerPreviewTable";
import { ProjectPointsPreviewTable } from "../project-points/ProjectPointsPreviewTable";
import { ProjectPointsToolbar } from "../project-points/ProjectPointsToolbar";
import { PropertiesFactsPreview } from "../properties/PropertiesFactsPreview";
import { PropertiesPanelShell } from "../properties/PropertiesPanelShell";
import { WorkspaceSummaryPreview } from "../workspace/WorkspaceSummaryPreview";

type BridgeStatus = "loading" | "ready" | "unavailable";

export function VanillaBridgeSandbox() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [adapter, setAdapter] = useState<PlotypusStateAdapter | null>(null);
  const [status, setStatus] = useState<BridgeStatus>("loading");
  const commandsEnabled = useMemo(() => areVanillaCommandsEnabled(), []);
  const vanillaSrc = useMemo(() => getVanillaAppUrl(commandsEnabled), [commandsEnabled]);

  const handleFrameLoad = () => {
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) {
      setStatus("unavailable");
      return;
    }

    waitForVanillaBridge(frameWindow)
      .then(() => {
        setAdapter(createVanillaPlotypusStateAdapter(frameWindow, { allowCommands: commandsEnabled }));
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
            This sandbox embeds the current Plotypus app and renders React UI from its state bridge. Commands are
            {commandsEnabled ? " enabled for feature-flagged bridge testing." : " disabled, so the preview is read-only."}
          </p>
        </div>
        <BridgeStatusPill commandsEnabled={commandsEnabled} status={status} />
      </section>

      <div className="vanilla-bridge-layout">
        <iframe
          ref={iframeRef}
          className="vanilla-bridge-frame"
          title="Plotypus vanilla app"
          src={vanillaSrc}
          onLoad={handleFrameLoad}
        />
        {adapter ? (
          <LiveVanillaStatePreview adapter={adapter} commandsEnabled={commandsEnabled} />
        ) : (
          <BridgeWaitingPanel status={status} />
        )}
      </div>
    </main>
  );
}

export function LiveVanillaStatePreview({
  adapter,
  commandsEnabled = false
}: {
  adapter: PlotypusStateAdapter;
  commandsEnabled?: boolean;
}) {
  const snapshot = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot, adapter.getSnapshot);
  return <VanillaStateSnapshotPreview adapter={adapter} commandsEnabled={commandsEnabled} snapshot={snapshot} />;
}

export function VanillaStateSnapshotPreview({
  adapter,
  commandsEnabled = false,
  snapshot
}: {
  adapter?: PlotypusStateAdapter;
  commandsEnabled?: boolean;
  snapshot: PlotypusSnapshot;
}) {
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

      <WorkspaceSummaryPreview summary={snapshot.workspaceSummary} />
      <ProjectPointsToolbar state={snapshot.projectPoints.toolbar} />
      <ProjectPointsPreviewTable rows={snapshot.projectPoints.previewRows} />
      <MapBaselayerPreviewTable
        boundary={snapshot.mapBaselayer.boundary}
        includedCount={snapshot.mapBaselayer.includedCount}
        regionCount={snapshot.mapBaselayer.regionCount}
        rows={snapshot.mapBaselayer.previewRows}
      />

      <PropertiesPanelShell
        collapsed={snapshot.properties.collapsed}
        contextKind={snapshot.properties.contextKind}
        guidance="Rendered from the vanilla app's read-only Properties snapshot."
        onCollapse={
          commandsEnabled && adapter
            ? () => adapter.runPropertiesCommand({ type: "toggle-collapsed" })
            : undefined
        }
        subtitle={snapshot.properties.subtitle}
        title={snapshot.properties.title}
        sections={[
          {
            title: "Current Properties facts",
            children: <PropertiesFactsPreview sections={snapshot.properties.sections} />
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

function BridgeStatusPill({ commandsEnabled, status }: { commandsEnabled: boolean; status: BridgeStatus }) {
  const label = status === "ready"
    ? commandsEnabled ? "Connected + commands" : "Connected read-only"
    : status === "unavailable"
      ? "Unavailable"
      : "Loading";
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

function getVanillaAppUrl(commandsEnabled: boolean) {
  const isBuiltReactPage = window.location.pathname.replace(/\\/g, "/").includes("/dist/react/");
  const url = new URL(isBuiltReactPage ? "../../index.html" : "../index.html", window.location.href);
  url.searchParams.set("reactBridge", "1");
  if (commandsEnabled) url.searchParams.set("reactCommands", "1");
  return url.toString();
}

function areVanillaCommandsEnabled() {
  return new URLSearchParams(window.location.search).get("reactCommands") === "1";
}

function iframeReload() {
  window.location.reload();
}

export const vanillaBridgeTestSnapshot = createDefaultPlotypusSnapshot;
