# Third-party model notice

`u2netp.onnx` in this directory is the U-2-Net model (portable variant),
created by Xuebin Qin et al. and published at
https://github.com/xuebinqin/U-2-Net under the Apache License, Version 2.0
(https://www.apache.org/licenses/LICENSE-2.0). It is used here unmodified.

Retrieved from
https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
(MD5 8e83ca70e441ab06c318d82300c84806, matching the checksum published by the
rembg project at https://github.com/danielgatis/rembg).

The WASM/JS runtime files in this directory (`ort-wasm-simd-threaded.*`) are
from `onnxruntime-web` (MIT License), copied here so background removal does
not depend on any third-party CDN at request time.

Paper: Qin, X., Zhang, Z., Huang, C., Dehghan, M., Zaiane, O. R., & Jagersand,
M. (2020). U2-Net: Going Deeper with Nested U-Structure for Salient Object
Detection. Pattern Recognition, 106, 107404.
