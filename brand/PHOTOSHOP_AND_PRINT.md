# Photoshop / Illustrator / Print — how to use this kit

## About editable `.psd` / `.ai` files

A layered Photoshop (`.psd`) or Illustrator (`.ai`) file **cannot be created
by an automated script** — those are proprietary Adobe formats that only Adobe
software (or a licensed SDK) can author with real editable layers. What this kit
gives you instead is everything you actually need to make them in seconds:

1. **Vector source (best for print / any size):**
   `apps/web/public/rich-land-logo.svg` and `rich-land-mark.svg`.
   Open either directly in **Illustrator** or **Photoshop** (File > Open) — SVG
   imports as editable vector shapes and scales to a 40-foot hoarding with zero
   quality loss.

2. **High-res transparent PNG (drop onto any design):**
   `brand/dist/logo-transparent/richland-transparent-4096.png` — 4096px, alpha
   channel, place it on any flex/poster background as its own layer.

3. **Ready canvases (open, then add your text layers):**
   - `brand/dist/print/poster-A4-300dpi.png` (2480×3508, 300 DPI)
   - `brand/dist/print/flex-banner-6000x2000.png` (hoarding proportion)
   - `brand/dist/social/ig-post-template-1080.png`, `ig-story-template-1080x1920.png`

### Fastest way to get a real .psd
Open any `print/*.png` (or the SVG) in Photoshop, then **File > Save As > Photoshop (.psd)**.
Because the logo transparent PNG is a separate file, you drag it in as its own
layer and it stays editable/movable. This takes about 30 seconds and gives a
genuine layered PSD — which is more reliable than any auto-generated pseudo-PSD.

## Colors to set in Photoshop / Illustrator swatches

| Swatch | Hex |
| --- | --- |
| Slate (background) | #0F172A |
| Gold (accent) | #F59E0B |
| Gold light | #FCD34D |
| Emerald | #059669 |
| White | #FFFFFF |

## Fonts to install

- **Inter** (headlines/body) — free, fonts.google.com/specimen/Inter
- **Georgia** (monogram/serif accent) — ships with Windows
- **Noto Sans Devanagari** (Marathi/Hindi collateral) — free, Google Fonts

## For the flex/hoarding printer

- Give the printer the **SVG** (`rich-land-logo.svg`) as the logo source — it is
  resolution-independent, so it prints crisp at any physical size.
- Or the **4096px transparent PNG** if they only accept raster.
- State the finished size in feet and the required bleed; the printer scales it.
- Everything is built in the brand slate #0F172A + gold #F59E0B palette so it
  stays consistent across all collateral.

## Regenerating everything

If the master `richlandlogo.png` is ever replaced, double-click
`brand/build-brand-kit.cmd` (or run `node scripts/build-brand-kit.js`) and the
entire kit rebuilds. No manual steps.
