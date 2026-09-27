import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readPsd } from "ag-psd";
import { inspectTemplate, prepareSmartObjectArtworkImage, replaceSmartObjectContent } from "./psdSmartObject";

const fixture = new URL("../../../../dist-mockups/staging/smart-v10-v3/masters/cap/cap-black-back.psd", import.meta.url);
const artwork = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("Smart Object browser payload replacement", () => {
  it("updates the placed-layer raster and omits the stale document composite", async () => {
    const original = readFileSync(fixture);
    const inspection = inspectTemplate(original);
    const smartObjectId = inspection.smartObjects[0]?.id;
    expect(smartObjectId).toBeTruthy();

    const imageData = await prepareSmartObjectArtworkImage(original, smartObjectId!, artwork);
    const rebuilt = replaceSmartObjectContent(original, smartObjectId!, artwork, "png", imageData);
    const originalPsd: any = readPsd(original, { useImageData: true });
    const reopened: any = readPsd(rebuilt, { useImageData: true });
    const layer: any = (reopened.children ?? []).find((candidate: any) => candidate.placedLayer?.id === smartObjectId);

    expect(layer?.imageData).toMatchObject({ width: imageData.width, height: imageData.height });
    expect(Array.from(layer.imageData.data.slice(0, 4))).toEqual(Array.from(imageData.data.slice(0, 4)));
    expect(reopened.imageData).toBeTruthy();
    expect(Array.from(reopened.imageData.data)).not.toEqual(Array.from(originalPsd.imageData.data));
    expect(rebuilt.equals(original)).toBe(false);
  });
});
