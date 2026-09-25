/**
 * Section 16: a swappable rendering-engine interface. Nothing outside this
 * file (routes, queue, frontend) knows which engine actually renders a job.
 *
 * Current state, stated honestly:
 *   PatchyRenderer is wired to genuinely invoke Patchy's headless CLI
 *   (--headless --run-script ..., its only documented automation surface —
 *   see scripts/render-smart-object.js). It is NOT verified end-to-end yet:
 *   this environment cannot reach any host to install the Patchy binary
 *   (see AGENT_HANDOFF.md's mockup-renderer checkpoint), so PATCHY_BINARY_PATH
 *   is unset here and every render call fails clearly with
 *   RendererNotConfiguredError rather than returning a fake image.
 *
 *   The two-stage design — psdSmartObject.replaceSmartObjectContent() swaps
 *   the Smart Object's linked bytes first (real, verified: see that module),
 *   then this renderer only needs to open and export the already-modified
 *   PSD, using nothing beyond Patchy's actually-documented scripting API
 *   (app.open, doc.exportAs) — is a real hypothesis, not a confirmed result.
 *   Whether Patchy's engine regenerates the Smart Object's composited pixels
 *   from the updated linked bytes on open (likely, for a real Photoshop-
 *   compatible app) or trusts a stale cached raster (like ag-psd does) is
 *   exactly what the first real render must confirm.
 */
import { spawn } from "node:child_process";
import { writeFile, unlink, readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
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

    const swapStart = Date.now();
    const originalBytes = await readFile(template.filePath);
    const swappedPsd = replaceSmartObjectContent(originalBytes, template.smartObjectId, artworkBytes, artworkExt as any);
    const psdSwapMs = Date.now() - swapStart;

    const workDir = await mkdtemp(path.join(tmpdir(), "mockup-render-"));
    const inputPath = path.join(workDir, `template.${template.fileFormat}`);
    const outputPath = path.join(workDir, `output.${options.outputFormat}`);
    const scriptOutputPath = path.join(workDir, "script-output.txt");
    const scriptPath = path.resolve(import.meta.dirname, "..", "..", "scripts", "render-smart-object.js");

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

let cachedRenderer: MockupRenderer | null = null;
/** Single seam the rest of the app depends on. Swapping engines later
 *  (ExternalPsdRenderer, a paid API, etc.) means changing only this
 *  function — nothing else in routes/queue/frontend references PatchyRenderer
 *  directly. */
export function getMockupRenderer(): MockupRenderer {
  if (!cachedRenderer) {
    cachedRenderer = new PatchyRenderer();
    logger.info({ engine: cachedRenderer.engineName }, "[mockupRenderer] Active rendering engine");
  }
  return cachedRenderer;
}
