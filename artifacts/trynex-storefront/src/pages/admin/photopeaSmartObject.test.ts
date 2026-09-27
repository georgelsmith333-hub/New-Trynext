import { describe, expect, it } from "vitest";
import {
  buildSmartObjectRefreshScript,
  SMART_OBJECT_ERROR_MARKER,
  SMART_OBJECT_REFRESH_MARKER,
} from "./photopeaSmartObject";

describe("Photopea Smart Object refresh script", () => {
  it("selects the exact layer and saves the opened Smart Object before export", () => {
    const script = buildSmartObjectRefreshScript('30 Artwork - "cap"');

    expect(script).toContain('findLayer(parent, "30 Artwork - \\"cap\\""');
    expect(script).toContain('executeAction(stringIDToTypeID("placedLayerEditContents"))');
    expect(script).toContain("function findLayer(container, name)");
    expect(script).toContain("Smart Object layer not found");
    expect(script).toContain("app.activeDocument.save()");
    expect(script).toContain("app.activeDocument.close()");
    expect(script).toContain('app.activeDocument.saveToOE("png")');
    expect(script).toContain(`app.echoToOE("${SMART_OBJECT_REFRESH_MARKER}")`);
    expect(script).toContain(`app.echoToOE("${SMART_OBJECT_ERROR_MARKER}")`);
  });
});