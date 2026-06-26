import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VanillaBridgeSandbox } from "./features/live-state/VanillaBridgeSandbox";
import "../style.css";
import "./components/primitives/primitives.css";
import "./react-shell.css";

const root = document.getElementById("reactVanillaBridgeRoot");

if (!root) {
  throw new Error("Missing #reactVanillaBridgeRoot");
}

createRoot(root).render(
  <StrictMode>
    <VanillaBridgeSandbox />
  </StrictMode>
);
