"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${key}`);
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

function required(values, key) {
  const value = values[key];
  if (!value) throw new Error(`Missing required --${key} argument.`);
  return value;
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitFor(description, predicate, timeoutMs, intervalMs = 50) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }
  const suffix = lastError ? ` Last error: ${lastError.message}` : "";
  throw new Error(`Timed out waiting for ${description} after ${timeoutMs} ms.${suffix}`);
}

class DevToolsConnection {
  constructor(webSocketUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(webSocketUrl);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", () => reject(new Error("Could not connect to the Chrome DevTools target.")), { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      if (!message.id) {
        for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
        return;
      }
      if (!this.pending.has(message.id)) return;
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
      else resolve(message.result);
    });
    this.socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("Chrome DevTools connection closed."));
      this.pending.clear();
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId;
    this.nextId += 1;
    const response = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return response;
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) this.socket.close();
  }
}

async function evaluate(connection, expression) {
  const response = await connection.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Browser evaluation failed.");
  }
  return response.result?.value;
}

async function main() {
  const values = parseArguments(process.argv.slice(2));
  const browserPath = path.resolve(required(values, "browser"));
  const url = required(values, "url");
  const profilePath = path.resolve(required(values, "profile"));
  const domPath = path.resolve(required(values, "dom"));
  const errorPath = path.resolve(required(values, "error-output"));
  const screenshotPath = values.screenshot ? path.resolve(values.screenshot) : "";
  const axeScriptPath = values["axe-script"] ? path.resolve(values["axe-script"]) : "";
  const axeReportPath = values["axe-report"] ? path.resolve(values["axe-report"]) : "";
  const axeFailImpacts = new Set(String(values["axe-fail-impacts"] || "").split(",").map(value => value.trim()).filter(Boolean));
  const width = Number(values.width || 1440);
  const height = Number(values.height || 1000);
  const timeoutMs = Number(values.timeout || 30000);
  const strictDiagnostics = values["strict-diagnostics"] === "true";
  if (!Number.isInteger(width) || width <= 0) throw new Error("--width must be a positive integer.");
  if (!Number.isInteger(height) || height <= 0) throw new Error("--height must be a positive integer.");
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout must be a positive integer.");

  fs.mkdirSync(profilePath, { recursive: true });
  fs.mkdirSync(path.dirname(domPath), { recursive: true });
  fs.mkdirSync(path.dirname(errorPath), { recursive: true });
  if (screenshotPath) fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
  if (axeReportPath) fs.mkdirSync(path.dirname(axeReportPath), { recursive: true });

  const browserArguments = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-extensions",
    "--no-first-run",
    "--use-gl=swiftshader",
    "--allow-file-access-from-files",
    "--remote-debugging-port=0",
    `--user-data-dir=${profilePath}`,
    `--window-size=${width},${height}`,
    "about:blank"
  ];
  const browser = spawn(browserPath, browserArguments, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let browserOutput = "";
  let connection = null;
  browser.stdout.on("data", chunk => { browserOutput += String(chunk); });
  browser.stderr.on("data", chunk => { browserOutput += String(chunk); });

  try {
    const activePortPath = path.join(profilePath, "DevToolsActivePort");
    const activePort = await waitFor("Chrome DevTools endpoint", async () => {
      if (browser.exitCode !== null) throw new Error(`Chrome exited early with code ${browser.exitCode}.`);
      if (!fs.existsSync(activePortPath)) return null;
      const [portText] = fs.readFileSync(activePortPath, "utf8").trim().split(/\r?\n/);
      const port = Number(portText);
      return Number.isInteger(port) && port > 0 ? port : null;
    }, Math.min(timeoutMs, 10000));

    const target = await waitFor("Chrome page target", async () => {
      const response = await fetch(`http://127.0.0.1:${activePort}/json/list`);
      if (!response.ok) return null;
      const targets = await response.json();
      return targets.find(candidate => candidate.type === "page" && candidate.webSocketDebuggerUrl)
        || null;
    }, Math.min(timeoutMs, 10000));

    connection = new DevToolsConnection(target.webSocketDebuggerUrl);
    const diagnostics = {
      consoleErrors: [],
      networkFailures: [],
      httpErrors: [],
      externalRequests: []
    };
    const requestUrls = new Map();
    const localOrigins = new Set([new URL(url).origin, `http://127.0.0.1:${activePort}`]);
    connection.on("Runtime.consoleAPICalled", event => {
      if (event.type !== "error") return;
      diagnostics.consoleErrors.push(event.args?.map(argument => argument.value ?? argument.description ?? "").join(" ") || "Console error");
    });
    connection.on("Network.requestWillBeSent", event => {
      const requestUrl = event.request?.url || "";
      requestUrls.set(event.requestId, requestUrl);
      if (!/^https?:\/\//i.test(requestUrl)) return;
      const requestOrigin = new URL(requestUrl).origin;
      if (!localOrigins.has(requestOrigin)) diagnostics.externalRequests.push(requestUrl);
    });
    connection.on("Network.loadingFailed", event => {
      const requestUrl = requestUrls.get(event.requestId) || "unknown request";
      if (!event.canceled) diagnostics.networkFailures.push(`${requestUrl}: ${event.errorText || "loading failed"}`);
    });
    connection.on("Network.responseReceived", event => {
      const status = Number(event.response?.status);
      if (status >= 400) diagnostics.httpErrors.push(`${status} ${event.response?.url || requestUrls.get(event.requestId) || "unknown request"}`);
    });
    await connection.send("Runtime.enable");
    await connection.send("Page.enable");
    await connection.send("Network.enable");

    const startedAt = Date.now();
    await connection.send("Page.navigate", { url });
    const readResult = () => evaluate(connection, `(() => {
      const node = document.querySelector("#result");
      const text = node?.textContent?.trim() || "";
      if (!text) return { ready: false, status: "", text: "" };
      try {
        const parsed = JSON.parse(text);
        return { ready: Boolean(parsed.status && parsed.status !== "running"), status: parsed.status || "", text };
      } catch (_error) {
        return { ready: false, status: "", text };
      }
    })()`);

    let smokeResult;
    try {
      smokeResult = await waitFor("shell smoke completion", async () => {
        const result = await readResult();
        return result?.ready ? result : null;
      }, timeoutMs, 100);
    } catch (error) {
      const html = await evaluate(connection, "document.documentElement?.outerHTML || ''");
      if (html) fs.writeFileSync(domPath, `<!doctype html>\n${html}\n`, "utf8");
      throw error;
    }

    const html = await evaluate(connection, "document.documentElement.outerHTML");
    fs.writeFileSync(domPath, `<!doctype html>\n${html}\n`, "utf8");
    if (screenshotPath) {
      const screenshot = await connection.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width, height, scale: 1 }
      });
      fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));
    }
    let accessibility = null;
    if (axeScriptPath) {
      const axeSource = fs.readFileSync(axeScriptPath, "utf8");
      const injected = await evaluate(connection, `(() => {
        const frame = document.querySelector("#app");
        const targetDocument = frame?.contentDocument;
        if (!targetDocument) return false;
        const script = targetDocument.createElement("script");
        script.textContent = ${JSON.stringify(axeSource)};
        targetDocument.documentElement.appendChild(script);
        script.remove();
        return Boolean(frame.contentWindow.axe);
      })()`);
      if (!injected) throw new Error("Could not inject axe-core into the application frame.");
      const axeResults = await evaluate(connection, `(async () => {
        const frame = document.querySelector("#app");
        return frame.contentWindow.axe.run(frame.contentDocument, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
          resultTypes: ["violations", "incomplete"]
        });
      })()`);
      accessibility = {
        url: axeResults.url,
        timestamp: axeResults.timestamp,
        violations: axeResults.violations || [],
        incomplete: axeResults.incomplete || []
      };
      if (axeReportPath) fs.writeFileSync(axeReportPath, `${JSON.stringify(accessibility, null, 2)}\n`, "utf8");
      const blockingViolations = accessibility.violations.filter(violation => axeFailImpacts.has(violation.impact));
      if (blockingViolations.length) {
        throw new Error(`Accessibility audit found ${blockingViolations.length} blocking violation(s): ${blockingViolations.map(violation => `${violation.id} (${violation.impact}, ${violation.nodes.length} node(s))`).join(", ")}`);
      }
    }

    const diagnosticFailures = Object.values(diagnostics).flat();
    if (strictDiagnostics && diagnosticFailures.length) {
      throw new Error(`Strict browser diagnostics failed:\n${diagnosticFailures.map(item => `- ${item}`).join("\n")}`);
    }

    fs.writeFileSync(errorPath, browserOutput, "utf8");
    process.stdout.write(`${JSON.stringify({
      status: smokeResult.status,
      elapsedMs: Date.now() - startedAt,
      diagnostics,
      accessibility: accessibility ? {
        violations: accessibility.violations.length,
        incomplete: accessibility.incomplete.length,
        violationIds: accessibility.violations.map(violation => violation.id)
      } : null
    })}\n`);
  } finally {
    if (connection) connection.close();
    if (browser.exitCode === null) browser.kill();
    fs.writeFileSync(errorPath, browserOutput, "utf8");
  }
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
