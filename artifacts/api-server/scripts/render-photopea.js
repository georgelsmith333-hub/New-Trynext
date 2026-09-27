/**
 * Photopea headless Smart Object renderer.
 *
 * Photopea's supported automation boundary is the iframe postMessage API:
 *   1. send the PSD bytes as an ArrayBuffer;
 *   2. wait for Photopea's "done" message;
 *   3. send app.activeDocument.saveToOE("png");
 *   4. receive the exported image as an ArrayBuffer.
 *
 * This script deliberately does not inspect or rewrite pixels. It only
 * transports the original PSD through Photopea and persists Photopea's
 * returned export. The caller remains responsible for comparing the modified
 * result with an untouched baseline before accepting a template.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";

const PHOTOPEA_URL = process.env.PHOTOPEA_URL?.trim() || "https://www.photopea.com/";
const CHROMIUM_PATH = process.env.PHOTOPEA_CHROMIUM_PATH?.trim() || "/repl/tools/bin/chromium";
const USER_AGENT = process.env.PHOTOPEA_USER_AGENT?.trim() ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const TIMEOUT_MS = Number(process.env.PHOTOPEA_TIMEOUT_MS || "30000");

function argsFrom(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[++i];
  }
  return args;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForJson(url, deadline) {
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Chromium DevTools endpoint did not start: ${lastError?.message || "timeout"}`);
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(typeof event.data === "string" ? event.data : String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message || "CDP command failed"));
        else pending.resolve(message.result);
        return;
      }
      const handlers = this.events.get(message.method) || [];
      for (const handler of handlers) handler(message.params);
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const handlers = this.events.get(method) || [];
      const handler = (params) => {
        this.events.set(method, handlers.filter((candidate) => candidate !== handler));
        resolve(params);
      };
      handlers.push(handler);
      this.events.set(method, handlers);
    });
  }

  command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.socket.close();
    } catch {
      // The browser process is killed by the caller as a second cleanup guard.
    }
  }
}

async function openCdpTarget(port, deadline) {
  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`, deadline);
  const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
  if (!target) throw new Error("Chromium opened without a controllable page target");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return new CdpClient(socket);
}

function pageExpression(photopeaUrl, inputBase64) {
  const renderInPhotopea = async function renderInPhotopea(url, encodedPsd, timeoutMs) {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0";

    const result = await new Promise((resolve, reject) => {
      let finished = false;
      const timeout = setTimeout(() => {
        const diagnostic = (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240);
        reject(new Error(`Photopea did not return an export before the timeout${diagnostic ? `; page says: ${diagnostic}` : ""}`));
      }, timeoutMs);
      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        window.removeEventListener("message", onMessage);
        callback(value);
      };
      function onMessage(event) {
        if (event.source !== iframe.contentWindow) return;
        if (event.data === "done") {
          iframe.contentWindow.postMessage('app.activeDocument.saveToOE("png")', "*");
          return;
        }
        if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          let binary = "";
          const chunkSize = 0x8000;
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
          }
          finish(resolve, { base64: btoa(binary), byteLength: bytes.length });
          return;
        }
        if (typeof event.data === "string" && /^error/i.test(event.data)) {
          finish(reject, new Error(event.data));
        }
      }
      window.addEventListener("message", onMessage);
      iframe.addEventListener("load", () => {
        const binary = atob(encodedPsd);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        iframe.contentWindow.postMessage(bytes.buffer, "*", [bytes.buffer]);
      }, { once: true });
      iframe.src = url;
      document.body.replaceChildren(iframe);
    });
    return result;
  };
  return `(${renderInPhotopea.toString()})(...${JSON.stringify([photopeaUrl, inputBase64, TIMEOUT_MS])})`;
}

async function render(inputPath, outputPath) {
  const input = await readFile(inputPath);
  const inputBase64 = input.toString("base64");
  const port = await freePort();
  const profile = await mkdtemp(path.join(os.tmpdir(), "photopea-chromium-"));
  const browser = spawn(CHROMIUM_PATH, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-blink-features=AutomationControlled",
    "--disable-features=AutomationControlled",
    `--user-agent=${USER_AGENT}`,
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });
  const browserExited = new Promise((resolve) => {
    browser.once("exit", resolve);
  });
  const deadline = Date.now() + TIMEOUT_MS;
  let cdp = null;
  const timeout = setTimeout(() => browser.kill("SIGKILL"), TIMEOUT_MS + 1000);
  try {
    cdp = await openCdpTarget(port, deadline);
    await cdp.command("Page.enable");
    await cdp.command("Network.enable");
    await cdp.command("Runtime.enable");
    await cdp.command("Network.setUserAgentOverride", { userAgent: USER_AGENT });
    await cdp.command("Page.addScriptToEvaluateOnNewDocument", {
      source: "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });",
    });
    const evaluation = await cdp.command("Runtime.evaluate", {
      expression: pageExpression(PHOTOPEA_URL, inputBase64),
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (evaluation.exceptionDetails) {
      throw new Error(evaluation.exceptionDetails.exception?.description || "Photopea page evaluation failed");
    }
    const value = evaluation.result?.value;
    if (!value?.base64 || value.byteLength <= 0) {
      throw new Error("Photopea returned no PNG bytes");
    }
    const output = Buffer.from(value.base64, "base64");
    if (output.length !== value.byteLength) {
      throw new Error(`Photopea returned truncated PNG bytes (${output.length}/${value.byteLength})`);
    }
    await writeFile(outputPath, output);
  } finally {
    clearTimeout(timeout);
    cdp?.close();
    if (browser.exitCode === null) browser.kill("SIGKILL");
    await Promise.race([
      browserExited,
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

const args = argsFrom(process.argv.slice(2));
if (!args.input || !args.output) {
  console.error("render-photopea.js requires --input <PSD/PSB> and --output <PNG>");
  process.exitCode = 2;
} else {
  render(args.input, args.output).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}