import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initializeMapDetailsSandboxHost } from "./features/map-details/mapDetailsSandboxHost";
import "../style.css";
import "./components/primitives/primitives.css";
import "./react-shell.css";

const root = document.getElementById("reactRoot");

if (!root) {
  throw new Error("Missing #reactRoot");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

initializeMapDetailsSandboxHost();
