export const SMART_OBJECT_REFRESH_MARKER = "trynext-smart-object-refreshed";
export const SMART_OBJECT_ERROR_MARKER = "trynext-smart-object-error:";

/**
 * Photopea's PSD open path can retain the parent document's cached Smart
 * Object composite after the server replaces the linked source bytes.
 * Reopening and saving the placed layer is Photopea's documented refresh path.
 */
export function buildSmartObjectRefreshScript(layerName: string): string {
  return [
    "(function () {",
    "  try {",
    "    var parent = app.activeDocument;",
    "    function findLayer(container, name) {",
    "      for (var index = 0; index < container.layers.length; index += 1) {",
    "        var candidate = container.layers[index];",
    "        if (candidate.name === name) return candidate;",
    "        if (candidate.layers) {",
    "          var nested = findLayer(candidate, name);",
    "          if (nested) return nested;",
    "        }",
    "      }",
    "      return null;",
    "    }",
    `    var layer = findLayer(parent, ${JSON.stringify(layerName)});`,
    `    if (!layer) throw new Error("Smart Object layer not found: " + ${JSON.stringify(layerName)});`,
    "    parent.activeLayer = layer;",
    '    executeAction(stringIDToTypeID("placedLayerEditContents"));',
    "    app.activeDocument.save();",
    "    app.activeDocument.close();",
    '    app.activeDocument.saveToOE("png");',
    `    app.echoToOE(${JSON.stringify(SMART_OBJECT_REFRESH_MARKER)});`,
    "  } catch (error) {",
    `    app.echoToOE(${JSON.stringify(SMART_OBJECT_ERROR_MARKER)} + (error && error.message ? error.message : String(error)));`,
    "  }",
    "}());",
  ].join("\n");
}