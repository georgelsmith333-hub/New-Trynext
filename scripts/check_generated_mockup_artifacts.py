#!/usr/bin/env python3
"""Scan mockup source/runtime PNGs for placeholder content (proof artwork,
chroma-key magenta, checkerboard transparency) that must never ship in a
release. Exits nonzero on any finding OR if a configured root is missing/
empty, so a broken path can no longer silently report success.

Usage: python3 scripts/check_generated_mockup_artifacts.py
"""
import sys
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent

# Roots that must be clean of placeholder/proof content — these ship to
# customers or are presented as the "clean" preview.
GATED_ROOTS = [
    REPO_ROOT / "dist-mockups/staging/smart-v10-v3/previews",
    REPO_ROOT / "artifacts/trynex-storefront/public/mockups/psd-master-v10/runtime-roles",
]

# proof-previews/ exists specifically to show the "TRY NEX" proof artwork
# (tools/build-smartobject-mockups.mjs:artworkProof) composited in for
# internal visual review — finding it there is expected, not a defect. Scan
# it for information only (confirms the proof-preview generator still
# actually produces the proof pattern) and never fail the gate on it.
INFO_ONLY_ROOTS = [
    REPO_ROOT / "dist-mockups/staging/smart-v10-v3/proof-previews",
]

# Exact RGB signature of tools/build-smartobject-mockups.mjs's artworkProof()
# fill color, so we detect the *actual* known proof pattern precisely rather
# than only a generic magenta/checkerboard heuristic.
PROOF_RGB = (238, 84, 48)
PROOF_RGB_TOLERANCE = 6


def is_proof_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a == 0:
        return False
    return (
        abs(r - PROOF_RGB[0]) <= PROOF_RGB_TOLERANCE
        and abs(g - PROOF_RGB[1]) <= PROOF_RGB_TOLERANCE
        and abs(b - PROOF_RGB[2]) <= PROOF_RGB_TOLERANCE
    )


def is_magenta_pixel(r: int, g: int, b: int, a: int) -> bool:
    """True chroma-key magenta is a near-pure R=B, G=0 fill (e.g. #FF00FF).
    A legitimately pink/magenta-colored product (a pink mug's real ceramic
    color measures around r=210 g=65 b=140, for example) has visibly more
    green and a wider R/B gap than that — require both a near-zero green
    channel and R/B close to equal, so real product colors don't trigger it.
    """
    return a > 200 and g < 40 and r > 150 and b > 150 and abs(r - b) < 35


def has_checkerboard_pattern(im: Image.Image) -> bool:
    """Detect an actual alternating light/dark checkerboard (the classic
    "transparency" placeholder pattern), not just "this pixel happens to be
    light gray" — a single-pixel color-range test fires on any plain white
    or light product photo, which is most of this catalog, and is useless
    as a gate. A real checkerboard has neighboring cells that differ sharply
    in one axis and repeat with a regular period; require several such
    transitions before flagging.
    """
    w, h = im.size
    px = im.load()
    period_candidates = (8, 16, 32)
    for period in period_candidates:
        if period * 3 >= min(w, h):
            continue
        transitions = 0
        samples = 0
        for y in range(period, h - period, period * 2):
            for x in range(period, w - period, period * 2):
                r1, g1, b1, a1 = px[x, y]
                r2, g2, b2, a2 = px[x + period, y]
                if a1 < 250 or a2 < 250:
                    continue
                samples += 1
                lum1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1
                lum2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2
                if abs(lum1 - lum2) > 40:
                    transitions += 1
        if samples >= 6 and transitions / samples > 0.6:
            return True
    return False


def scan_file(path: Path) -> dict:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    counts = {"proof": 0, "magenta": 0, "sampled": 0}
    step_x = max(1, w // 96)
    step_y = max(1, h // 96)
    for y in range(0, h, step_y):
        for x in range(0, w, step_x):
            r, g, b, a = px[x, y]
            counts["sampled"] += 1
            if is_proof_pixel(r, g, b, a):
                counts["proof"] += 1
            if is_magenta_pixel(r, g, b, a):
                counts["magenta"] += 1
    counts["checkerboard"] = has_checkerboard_pattern(im)
    return counts


def scan_root(root: Path) -> tuple[list[Path], list[str]]:
    """Returns (files scanned, findings) for one root. Prints per-file lines."""
    if not root.exists():
        print(f"ERROR: root does not exist: {root}", file=sys.stderr)
        return [], []
    files = sorted(root.rglob("*.png"))
    if not files:
        print(f"ERROR: no PNG files found under: {root}", file=sys.stderr)
        return [], []

    findings = []
    for path in files:
        counts = scan_file(path)
        rel = path.relative_to(REPO_ROOT)
        flagged = counts["proof"] > 0 or counts["magenta"] > 0 or counts["checkerboard"]
        marker = "FLAGGED" if flagged else "ok"
        print(
            f"[{marker}] {rel} size={path.stat().st_size}B "
            f"proof={counts['proof']} magenta={counts['magenta']} checkerboard={counts['checkerboard']} "
            f"(sampled {counts['sampled']} px)"
        )
        if flagged:
            findings.append(str(rel))
    return files, findings


def main() -> int:
    any_root_missing = False
    total_files = 0
    findings = []

    print("=== Gated roots (must be clean) ===")
    for root in GATED_ROOTS:
        files, root_findings = scan_root(root)
        if not files:
            any_root_missing = True
        total_files += len(files)
        findings.extend(root_findings)

    print("\n=== Informational roots (proof content expected, not gated) ===")
    info_total = 0
    info_with_proof = 0
    for root in INFO_ONLY_ROOTS:
        files, root_findings = scan_root(root)
        if not files:
            print(f"WARNING: expected proof-preview content under {root} but found none — the proof-preview generator may be broken.", file=sys.stderr)
        info_total += len(files)
        info_with_proof += len(root_findings)
    if info_total:
        print(f"\n{info_with_proof} of {info_total} proof-preview files show the expected proof pattern.")

    if any_root_missing:
        print("\nFAIL: one or more gated roots were missing or empty — see ERROR lines above.", file=sys.stderr)
        return 1

    if total_files == 0:
        print("\nFAIL: zero files were scanned across the gated roots.", file=sys.stderr)
        return 1

    if findings:
        print(f"\nFAIL: {len(findings)} of {total_files} gated files contain placeholder/proof content:", file=sys.stderr)
        for f in findings:
            print(f"  - {f}", file=sys.stderr)
        return 1

    print(f"\nPASS: {total_files} files scanned across {len(GATED_ROOTS)} gated roots, no placeholder content found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
