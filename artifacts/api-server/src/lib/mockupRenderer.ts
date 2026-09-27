/**
 * Section 16: a swappable rendering-engine interface. Nothing outside this
 * file (routes, queue, frontend) knows which engine actually renders a job.
 *
 * Current state, stated honestly:
 *   PhotopeaRenderer uses Photopea's supported iframe API through a local
 *   headless Chromium process. It sends the PSD as an ArrayBuffer, waits for
 *   "done", executes app.activeDocument.saveToOE("png"), and receives the
 *   returned ArrayBuffer. The admin validation route compares the changed
 *   export with an untouched baseline before a template can be activated.
 *
 *   PatchyRenderer genuinely invokes Patchy's headless CLI
 *   (--headless --run-script ..., its only documented automation surface —
 *   see scripts/render-smart-object.js). Patchy v0.99 was launched with its
 *   verified Linux runtime and one real cap PSD was opened/exported. The export
 *   succeeded, but it was byte-for-byte identical to exporting the untouched
 *   PSD: Patchy did not regenerate the Smart Object composite after the linked
 *   bytes were replaced. The real-render gate therefore remains failed and no
 *   templates may be activated. When PATCHY_BINARY_PATH is unset, every render
 *   call still fails clearly with RendererNotConfiguredError rather than
 *   returning a fake image.
 *
 *   The two-stage design — psdSmartObject.replaceSmartObjectContent() swaps
 *   the Smart Object's linked bytes first (real, verified: see that module),
 *   then this renderer only needs to open and export the already-modified
 *   PSD, using nothing beyond Patchy's actually-documented scripting API
 *   (app.open, doc.exportAs). The first real run disproved the hypothesis for
 *   this release: Patchy exported the stale cached raster, so it is not an
 *   acceptable Smart Object compositor for this pipeline.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { access, writeFile, unlink, readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "./logger";
import { replaceSmartObjectContent } from "./psdSmartObject";

export interface RenderTemplate {
  /** Absolute path to the template's PSD/PSB bytes on disk. */
  filePath: string;
  fileFormat: "psd" | "psb";
  smartObjectId: string;
}

export interface RenderOptions {
  outputFormat: "png" | "webp" | "jpg";
  outputQuality?: number;
  timeoutMs?: number;
  /** Admin validation only: export the source PSD without replacing its Smart Object. */
  skipSmartObjectReplacement?: boolean;
}

export interface RenderResult {
  outputBytes: Buffer;
  outputFormat: string;
  width: number;
  height: number;
  engine: string;
  metrics: {
    psdSwapMs: number;
    renderMs: number;
    totalMs: number;
  };
}

export class RendererNotConfiguredError extends Error {
  constructor(engine: string, detail: string) {
    super(`${engine} is not available in this environment: ${detail}`);
    this.name = "RendererNotConfiguredError";
  }
}

export class RenderTimeoutError extends Error {
  constructor(ms: number) {
    super(`Render did not complete within ${ms}ms`);
    this.name = "RenderTimeoutError";
  }
}

export interface MockupRenderer {
  readonly engineName: string;
  /** Whether this engine is actually usable right now (binary present, etc). */
  isAvailable(): Promise<{ available: boolean; reason?: string }>;
  render(template: RenderTemplate, artworkBytes: Buffer, artworkExt: string, options: RenderOptions): Promise<RenderResult>;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export class PatchyRenderer implements MockupRenderer {
  readonly engineName = "patchy";

  private binaryPath(): string | null {
    return process.env.PATCHY_BINARY_PATH?.trim() || null;
  }

  async isAvailable(): Promise<{ available: boolean; reason?: string }> {
    const bin = this.binaryPath();
    if (!bin) {
      return { available: false, reason: "PATCHY_BINARY_PATH is not set." };
    }
    return { available: true };
  }

  async render(
    template: RenderTemplate,
    artworkBytes: Buffer,
    artworkExt: string,
    options: RenderOptions,
  ): Promise<RenderResult> {
    const totalStart = Date.now();
    const bin = this.binaryPath();
    if (!bin) {
      throw new RendererNotConfiguredError(
        this.engineName,
        "No Patchy binary is installed/reachable in this environment. See AGENT_HANDOFF.md.",
      );
    }

    const originalBytes = await readFile(template.filePath);
    const swapStart = Date.now();
    const swappedPsd = options.skipSmartObjectReplacement
      ? originalBytes
      : replaceSmartObjectContent(originalBytes, template.smartObjectId, artworkBytes, artworkExt as any);
    const psdSwapMs = options.skipSmartObjectReplacement ? 0 : Date.now() - swapStart;

    const workDir = await mkdtemp(path.join(tmpdir(), "mockup-render-"));
    const inputPath = path.join(workDir, `template.${template.fileFormat}`);
    const outputPath = path.join(workDir, `output.${options.outputFormat}`);
    const scriptOutputPath = path.join(workDir, "script-output.txt");
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const scriptPath = path.resolve(moduleDir, "..", "scripts", "render-smart-object.js");

    try {
      await writeFile(inputPath, swappedPsd);

      const renderStart = Date.now();
      await this.runPatchy(bin, scriptPath, scriptOutputPath, [inputPath, outputPath], options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      const renderMs = Date.now() - renderStart;

      const outputBytes = await readFile(outputPath);
      const sharp = (await import("sharp")).default;
      const meta = await sharp(outputBytes).metadata();
      const dims = { width: meta.width ?? 0, height: meta.height ?? 0 };

      return {
        outputBytes,
        outputFormat: options.outputFormat,
        width: dims.width,
        height: dims.height,
        engine: this.engineName,
        metrics: { psdSwapMs, renderMs, totalMs: Date.now() - totalStart },
      };
    } finally {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      await unlink(scriptOutputPath).catch(() => {});
    }
  }

  private runPatchy(bin: string, scriptPath: string, scriptOutputPath: string, args: [string, string], timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const [inputPath, outputPath] = args;
      const child = spawn(
        bin,
        [
          "--headless",
          "--run-script",
          scriptPath,
          "--script-output",
          scriptOutputPath,
          "--script-arg",
          `inputPath=${inputPath}`,
          "--script-arg",
          `outputPath=${outputPath}`,
        ],
        { stdio: "ignore" },
      );

      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new RenderTimeoutError(timeoutMs));
      }, timeoutMs);

      child.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
      child.on("exit", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`Patchy exited with code ${code} — see ${scriptOutputPath}`));
      });
    });
  }
}

export class PhotopeaRenderer implements MockupRenderer {
  readonly engineName = "photopea";

  private chromiumPath(): string {
    return process.env.PHOTOPEA_CHROMIUM_PATH?.trim() || "/repl/tools/bin/chromium";
  }

  async isAvailable(): Promise<{ available: boolean; reason?: string }> {
    try {
      await access(this.chromiumPath());
      return { available: true };
    } catch {
      return {
        available: false,
        reason: `Photopea requires a Chromium executable at ${this.chromiumPath()} (set PHOTOPEA_CHROMIUM_PATH to override).`,
      };
    }
  }

  async render(
    template: RenderTemplate,
    artworkBytes: Buffer,
    artworkExt: string,
    options: RenderOptions,
  ): Promise<RenderResult> {
    const totalStart = Date.now();
    const availability = await this.isAvailable();
    if (!availability.available) {
      throw new RendererNotConfiguredError(this.engineName, availability.reason ?? "Chromium is unavailable.");
    }

    const originalBytes = await readFile(template.filePath);
    const swapStart = Date.now();
    const swappedPsd = options.skipSmartObjectReplacement
      ? originalBytes
      : replaceSmartObjectContent(originalBytes, template.smartObjectId, artworkBytes, artworkExt as any);
    const psdSwapMs = options.skipSmartObjectReplacement ? 0 : Date.now() - swapStart;

    const workDir = await mkdtemp(path.join(tmpdir(), "mockup-photopea-"));
    const inputPath = path.join(workDir, `template.${template.fileFormat}`);
    const outputPath = path.join(workDir, `output.${options.outputFormat}`);
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const scriptPath = path.resolve(moduleDir, "..", "scripts", "render-photopea.js");
    const renderStart = Date.now();

    try {
      await writeFile(inputPath, swappedPsd);
      await this.runPhotopea(
        scriptPath,
        inputPath,
        outputPath,
        options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );
      const renderMs = Date.now() - renderStart;
      const outputBytes = await readFile(outputPath);
      const sharp = (await import("sharp")).default;
      const meta = await sharp(outputBytes).metadata();
      return {
        outputBytes,
        outputFormat: options.outputFormat,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        engine: this.engineName,
        metrics: { psdSwapMs, renderMs, totalMs: Date.now() - totalStart },
      };
    } finally {
      await unlink(inputPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
    }
  }

  private runPhotopea(scriptPath: string, inputPath: string, outputPath: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [scriptPath, "--input", inputPath, "--output", outputPath], {
        stdio: "ignore",
        env: { ...process.env, PHOTOPEA_TIMEOUT_MS: String(timeoutMs) },
      });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new RenderTimeoutError(timeoutMs));
      }, timeoutMs + 2_000);
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("exit", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`Photopea renderer exited with code ${code}`));
      });
    });
  }
}

let cachedRenderer: MockupRenderer | null = null;
/** Single seam the rest of the app depends on. Select with PSD_RENDERER:
 * photopea, patchy, or auto. Auto chooses Photopea when Chromium is present,
 * otherwise it preserves the explicit Patchy fail-closed path. No engine is
 * considered a successful compositor until the admin validation route proves
 * the modified export differs from baseline. */
export function getMockupRenderer(): MockupRenderer {
  if (!cachedRenderer) {
    const requested = (process.env.PSD_RENDERER?.trim().toLowerCase() || "auto");
    if (requested === "patchy") {
      cachedRenderer = new PatchyRenderer();
    } else if (requested === "photopea") {
      cachedRenderer = new PhotopeaRenderer();
    } else {
      const chromiumPath = process.env.PHOTOPEA_CHROMIUM_PATH?.trim() || "/repl/tools/bin/chromium";
      cachedRenderer = existsSync(chromiumPath) ? new PhotopeaRenderer() : new PatchyRenderer();
    }
    logger.info({ engine: cachedRenderer.engineName }, "[mockupRenderer] Active rendering engine");
  }
  return cachedRenderer;
}
