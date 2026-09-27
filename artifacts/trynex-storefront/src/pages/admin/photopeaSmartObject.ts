export const SMART_OBJECT_REFRESH_MARKER = "trynext-smart-object-refreshed";

/**
 * Photopea's PSD open path can retain the parent document's cached Smart
 * Object composite after the server replaces the linked source bytes.
 * Reopening and saving the placed layer is Photopea's documented refresh path.
 */
export function buildSmartObjectRefreshScript(layerName: string): string {
  return [
    "(function () {",
    `  var parent = app.activeDocument;`,
    `  var layer = parent.layers.getByName(${JSON.stringify(layerName)});`,
    "  parent.activeLayer = layer;",
    '  executeAction(stringIDToTypeID("placedLayerEditContents"));',
    "  app.activeDocument.save();",
    "  app.activeDocument.close();",
    `  app.echoToOE(${JSON.stringify(SMART_OBJECT_REFRESH_MARKER)});`,
    "}());",
  ].join("\n");
}