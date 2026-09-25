/**
 * Patchy headless automation script (Section 9).
 *
 * Written strictly against Patchy's documented scripting API
 * (scripts/bundled/scripting-guide.md in SethRobinson/Patchy) as of the
 * research done for this project: app.open, doc.exportAs, patchy.args,
 * patchy.setResult. No undocumented Smart Object method is called here —
 * none exists in that guide as of this writing.
 *
 * By design this script does the least possible: the Smart Object content
 * swap already happened before Patchy was invoked (see
 * lib/psdSmartObject.ts's replaceSmartObjectContent, called from
 * lib/mockupRenderer.ts) by rewriting the PSD's linked-file bytes directly
 * with ag-psd. This script's only job is to open that already-modified PSD
 * and export it — the open step is exactly where a real Photoshop-compatible
 * engine either does or does not regenerate the Smart Object's composited
 * pixels from the updated linked bytes. That is the thing this script's
 * first real run must prove or disprove; nothing here should paper over the
 * answer either way.
 *
 * Invoked as:
 *   patchy --headless --run-script render-smart-object.js
 *     --script-output <path> --script-arg inputPath=<path>
 *     --script-arg outputPath=<path>
 */

var inputPath = patchy.args.inputPath;
var outputPath = patchy.args.outputPath;

if (!inputPath || !outputPath) {
  console.error("render-smart-object.js requires --script-arg inputPath=... and outputPath=...");
  patchy.setResult({ ok: false, error: "missing_args" });
  throw new Error("missing required script args");
}

var doc = app.open(inputPath);
console.log("Opened document: " + inputPath + " (" + doc.width + "x" + doc.height + ")");

doc.exportAs(outputPath);
console.log("Exported to: " + outputPath);

patchy.setResult({ ok: true, width: doc.width, height: doc.height, outputPath: outputPath });
