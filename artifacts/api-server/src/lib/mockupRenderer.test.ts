import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { convertPhotopeaPng } from "./mockupRenderer";

describe("Photopea output encoding", () => {
  it("keeps Photopea PNG bytes as PNG", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 240, g: 90, b: 10, alpha: 1 } },
    }).png().toBuffer();

    await expect(convertPhotopeaPng(png, "png")).resolves.toEqual(png);
  });

  it("converts Photopea PNG bytes before labeling them as webp", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 4, background: { r: 240, g: 90, b: 10, alpha: 1 } },
    }).png().toBuffer();

    const webp = await convertPhotopeaPng(png, "webp");
    expect(webp.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect((await sharp(webp).metadata()).format).toBe("webp");
  });
});