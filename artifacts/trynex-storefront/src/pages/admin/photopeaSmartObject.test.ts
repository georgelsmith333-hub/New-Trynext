import { describe, expect, it } from "vitest";
import {
  buildSmartObjectRefreshScript,
  SMART_OBJECT_ERROR_MARKER,
  SMART_OBJECT_REFRESH_MARKER,
} from "./photopeaSmartObject";
import { renderPsdInPhotopea } from "./SmartMockupBrowserValidator";

describe("Photopea Smart Object refresh script", () => {
  it("selects the exact layer and saves the opened Smart Object before export", () => {
    const script = buildSmartObjectRefreshScript('30 Artwork - "cap"');

    expect(script).toContain('findLayer(parent, "30 Artwork - \\"cap\\""');
    expect(script).toContain('executeAction(stringIDToTypeID("placedLayerEditContents"))');
    expect(script).toContain("function findLayer(container, name)");
    expect(script).toContain("Smart Object layer not found");
    expect(script).toContain("app.activeDocument.save()");
    expect(script).toContain("app.activeDocument.close()");
    expect(script).not.toContain("saveToOE");
    expect(script).toContain(`app.echoToOE("${SMART_OBJECT_REFRESH_MARKER}")`);
    expect(script).toContain(`app.echoToOE("${SMART_OBJECT_ERROR_MARKER}" +`);
  });
});

describe("Photopea live-messaging handshake", () => {
  type MessageListener = (event: MessageEvent) => void;
  type LoadListener = (event: Event) => void;

  function installFakeWindow() {
    const listeners = new Set<MessageListener>();
    const fakeWindow = {
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (type === "message" && typeof listener === "function") listeners.add(listener as MessageListener);
      },
      removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (type === "message" && typeof listener === "function") listeners.delete(listener as MessageListener);
      },
      setTimeout,
      clearTimeout,
    };
    const originalWindow = (globalThis as typeof globalThis & { window?: unknown }).window;
    Object.defineProperty(globalThis, "window", { configurable: true, value: fakeWindow });
    return {
      emit(data: unknown, origin = "https://www.photopea.com") {
        for (const listener of listeners) listener({ data, origin } as MessageEvent);
      },
      restore() {
        Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
      },
    };
  }

  function createFakeFrame(sent: Array<string | ArrayBuffer>) {
    let loadListener: LoadListener | null = null;
    const frame = {
      contentWindow: {
        postMessage(message: string | ArrayBuffer) {
          sent.push(message);
        },
      },
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (type === "load" && typeof listener === "function") loadListener = listener as LoadListener;
      },
      removeEventListener() {},
      set src(_value: string) {},
    };
    return {
      frame: frame as unknown as HTMLIFrameElement,
      emitLoad() {
        loadListener?.(new Event("load"));
      },
    };
  }

  it("waits for iframe load after Photopea readiness before sending the PSD", async () => {
    const bridge = installFakeWindow();
    const sent: Array<string | ArrayBuffer> = [];
    const { frame, emitLoad } = createFakeFrame(sent);

    try {
      const render = renderPsdInPhotopea(frame, "AA==");
      bridge.emit("done");
      expect(sent).toHaveLength(0);

      emitLoad();
      expect(sent).toHaveLength(1);
      expect(sent[0]).toBeInstanceOf(ArrayBuffer);

      bridge.emit("done");
      expect(sent).toEqual([sent[0], 'app.activeDocument.saveToOE("png")']);

      const exportBytes = new Uint8Array([137, 80, 78, 71]);
      bridge.emit(exportBytes.buffer);
      await expect(render).resolves.toEqual(exportBytes);
    } finally {
      bridge.restore();
    }
  });

  it("waits for Photopea readiness after iframe load before sending the PSD", async () => {
    const bridge = installFakeWindow();
    const sent: Array<string | ArrayBuffer> = [];
    const { frame, emitLoad } = createFakeFrame(sent);

    try {
      const render = renderPsdInPhotopea(frame, "AA==");
      emitLoad();
      expect(sent).toHaveLength(0);

      bridge.emit("done");
      expect(sent).toHaveLength(1);
      expect(sent[0]).toBeInstanceOf(ArrayBuffer);

      bridge.emit("done");
      expect(sent).toHaveLength(2);
      expect(sent[1]).toBe('app.activeDocument.saveToOE("png")');

      const exportBytes = new Uint8Array([137, 80, 78, 71]);
      bridge.emit(exportBytes.buffer);
      await expect(render).resolves.toEqual(exportBytes);
    } finally {
      bridge.restore();
    }
  });
});