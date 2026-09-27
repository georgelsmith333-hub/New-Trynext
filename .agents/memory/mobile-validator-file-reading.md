---
name: Mobile validator file reading
description: Android browser document-picker files may be selected successfully but fail when read with FileReader in the browser validator.
---

Use `File.arrayBuffer()` and convert the bytes to base64 in bounded chunks for artwork uploads from mobile browsers.

**Why:** The Android screenshot showed a selected PNG but FileReader emitted the client error before the API request. The selected file and admin session were valid; the reader was the failure point.

**How to apply:** Keep the conversion client-side, preserve the MIME type from the file or extension, and return a clear unsupported/empty-file error before posting the private artwork to the admin API.