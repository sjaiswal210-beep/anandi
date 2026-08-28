# Anandi Park 40×40 ft Flex — working files

The user wants further design changes to this flex, so all working files are kept
here (committed, travels with the repo/zip).

## Files
- `SOURCE-Anandi_Park_40x40ft_UltraHD_Print.pdf` — original artwork the user supplied.
- `flex-source.png` — the artwork extracted from that PDF (1254×1254). **Edit target.**
- `anandi-park-flex-40x40-final.png` / `.pdf` — current output with the real WhatsApp QR.

## What the current script does (`scripts/replace-flex-qr.js`)
Starting from `flex-source.png`, it:
1. Clears the old QR + Marathi "स्कॅन करा..." text strip (x754–1230, y600–806).
2. Places a real scannable WhatsApp QR on the left (188px) —
   `https://wa.me/917558444117?text=Hi- Send more information`.
3. Adds a "SCAN / NOW" caption to the right of the QR.
4. Removes "+91" from the second phone number (shifts the digits left, fills the gap).
5. Exports a 40in×40in PDF (printer scales 1in → 1ft).

## Rebuild
```bash
npm i qrcode@1.5.4 jsqr@1.4.0 --no-save   # if not installed
node scripts/replace-flex-qr.js
```
Needs **ffmpeg** and **Chrome** on PATH (paths in the script; override with CHROME_PATH).

## Making further changes
All positions are pixel coordinates measured against `flex-source.png` (1254 px square).
Helpers to re-measure after any change:
- `node scripts/inspect-png.js <png>` — size + corner/center colors.
- `node scripts/probe-flex-panel.js` — white-run scan to find panels/text bands.
Edit the geometry constants near the top of `scripts/replace-flex-qr.js`
(`WIPE`, `px0/py0/pw/ph`, `qrSize`, phone `D`/`PASTE_X`/`FILL`) and re-run.

## The QR is verified
`scripts/replace-flex-qr.js` output is decode-checked with `jsqr`; the current
file decodes to the wa.me URL above. Always re-scan with a real phone before printing.
