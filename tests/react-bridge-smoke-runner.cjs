const fs = require("node:fs");
const path = require("node:path");

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const profileDir = args.get("--profile");
const resultPath = args.get("--result");
const url = args.get("--url");

if (!profileDir || !resultPath || !url) {
  console.error("Usage: node tests/react-bridge-smoke-runner.cjs --url <url> --profile <profileDir> --result <resultPath>");
  process.exit(2);
}

const devToolsPortPath = path.join(profileDir, "DevToolsActivePort");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForDevToolsPort() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    if (fs.existsSync(devToolsPortPath)) {
      const [port] = fs.readFileSync(devToolsPortPath, "utf8").split(/\r?\n/);
      if (port) return port.trim();
    }
    await sleep(50);
  }
  throw new Error(`Timed out waiting for ${devToolsPortPath}`);
}

async function getPageWebSocket(port) {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    const pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
    const page = pages.find(candidate => candidate.type === "page" && candidate.url === url)
      || pages.find(candidate => candidate.type === "page");
    if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    await sleep(50);
  }
  throw new Error("Timed out waiting for Chrome page target");
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();
  const events = [];

  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id) {
      if (message.method === "Runtime.exceptionThrown" || message.method === "Runtime.consoleAPICalled" || message.method === "Log.entryAdded") {
        events.push(message);
      }
      return;
    }
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else request.resolve(message.result);
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        close: () => socket.close(),
        events,
        send(method, params = {}) {
          const commandId = ++id;
          socket.send(JSON.stringify({ id: commandId, method, params }));
          return new Promise((commandResolve, commandReject) => {
            pending.set(commandId, { resolve: commandResolve, reject: commandReject });
          });
        }
      });
    });
    socket.addEventListener("error", () => reject(new Error("Chrome DevTools WebSocket failed")));
  });
}

async function pollResult(client) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    const evaluation = await client.send("Runtime.evaluate", {
      expression: "document.querySelector('#result')?.textContent || ''",
      returnByValue: true
    });
    const text = evaluation.result?.value || "";
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.status && parsed.status !== "running") return parsed;
      } catch (_error) {
        // Keep waiting until the harness writes valid JSON.
      }
    }
    await sleep(100);
  }
  throw new Error("Timed out waiting for React bridge smoke result");
}

(async () => {
  const port = await waitForDevToolsPort();
  const webSocketUrl = await getPageWebSocket(port);
  const client = await createCdpClient(webSocketUrl);
  try {
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Log.enable");
    const result = await pollResult(client);
    result.browserEvents = client.events;
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
    if (result.status !== "ok") process.exit(1);
  } catch (error) {
    fs.writeFileSync(resultPath, JSON.stringify({
      status: "error",
      message: error.message,
      browserEvents: client.events
    }, null, 2), "utf8");
    throw error;
  } finally {
    client.close();
  }
})().catch(error => {
  fs.writeFileSync(resultPath, JSON.stringify({ status: "error", message: error.message }, null, 2), "utf8");
  console.error(error);
  process.exit(1);
});
