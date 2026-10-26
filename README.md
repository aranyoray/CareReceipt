<img src="public/logo-wordmark.svg" alt="CareReceipt" width="268">

**Is this bill wrong?** Photograph or paste an itemised US hospital bill.
CareReceipt prices every line against what the procedure actually costs where
you live, says which lines are worth disputing, and writes the words to use on
the phone.

```
app/          one route, the workspace and its two screens
components/   BillCheck, PreventiveCheck, Scan, Slip, shared state
lib/engine/   bill audit, risk, exposome, costs, geo, charity-care rules
lib/ocr.ts    reading a bill from a photograph
ui/           design system: tokens, primitives, charts, icons, app shell
public/       county geography, the ZIP crosswalk, the risk reference
```

## Running it

```bash
npm install
npm run dev        # localhost:3000
npm run build
npm run typecheck
```

## The interface

A desktop workspace, light only. A navy bar runs the full width with the
product name and the screens as tabs: Bill check, Preventive, and a link to
Relief. There is no home screen and no bottom tab bar.

Each screen is split in two. On the left, a full-height panel of ordinary
form controls (native dropdowns, a checkbox dropdown for several choices,
plain inputs) that scrolls on its own, with the Print receipt button pinned to
its foot. On the right, the receipt. Narrow windows stack the panel above the
receipt; nothing turns into sheets, keypads or segmented controls.

**Bill check.** The panel holds everything that goes into the bill: scan with
the camera, add a photo, the pasted text, the example bill, the ZIP code, and
household income and size for charity care. Print receipt produces the bill
line by line as a white clinical slip, with billed against fair for every
charge and the totals underneath; the findings, the charts, charity care and
the call script follow beneath the slip.

**Preventive.** Age, sex, race and the conditions already diagnosed, plus the
ZIP code, on the left. Print puts the most likely conditions, what they cost a
year, the per-condition breakdown and the local exposure picture on one slip.

**The print.** Until something is printed the right side shows a navy clinic
sleeve with the top edge of a slip showing above it. Print draws the slip up
and out of the sleeve, the sleeve drops away, and the slip settles while its
sections come in one after another. With reduced motion the slip simply
appears. Height returns to auto afterwards so nothing inside is clipped.
Changing an input after printing offers Print it again.

**Charts.** Two series at most, and they always mean the same thing: `s1` is
the benchmark, `s2` is what was billed. Status colours are kept for state and
never used as a series. Both series colours were checked for colour-vision
separation and for contrast against the card surface before
being written into `tokens.css`. Every chart has a table beside it: the running
total has the line-by-line view, the category columns have the figures printed
underneath.

Tailwind is not imported. Nothing here used a utility class, and its generated
`.ring` collided with the dial in the chart set.

## Scanning a bill

`Scan a bill` opens the camera, `Add a photo` picks one already taken. The
photograph is read on the device through Tesseract compiled to WebAssembly, so
it is never uploaded; the engine's own files are fetched from a CDN on the
first scan and cached by the browser after that.

`lib/ocr.ts` greys the photo, stretches its contrast when the
exposure is uneven, and hands it to the reader. `cleanOcrText` in
`lib/engine/bill.ts` then corrects the handful of ways recognition fails
on a printed bill — O read as zero inside a code, l or I read as one, a dollar
sign read as S, a charge wrapped onto the row below — each only inside a token
that is already mostly digits, so the wording is left alone. Nothing is
guessed: a line the parser cannot read is left in the box to be corrected by
hand rather than invented.

Pages append rather than replace, because an itemised bill usually runs to
several.

## Preventive check

Age, sex and race are dropdowns and the conditions already diagnosed are one
multi-select, which is what the screen used to spend half a phone display on as
rows of chips; it is a checkbox dropdown now. Every profile in the reference is one age band, one race group
and one sex, so the screen asks rather than guessing a default.

Anything marked as diagnosed does two things: the other conditions are shown at
their rate among people who have it, and the diagnosed condition itself is
counted as certain instead of likely in the cost figure.

**Burden is reported per year.** The cost model builds a discounted present
value over the years ahead; dividing it back by the same annuity factor gives
the level annual amount, which is both easier to read and easier to act on than
a six figure lifetime total. Prevalence times cost, per condition, is back on
the screen with it.

## Two bugs found and fixed

**`fmtUsd` was never defined.** `lib/faircare.ts` used it in 7 places, declared
it once at line 730 as a non-exported local, then re-exported it at line 842.
That worked only because definition and uses happened to sit in one file: the
moment the module was split it broke. It is exported from `lib/engine/bill.ts`
now and imported where needed.

**Nothing rendered server-side.** Both pages gated their entire body behind a
`mounted` flag, so the first paint was an empty shell and the HTML contained
only the nav. `useStored` already handles its own hydration, so the gate was
unnecessary. CareReceipt's server HTML went from 6.9 KB to 17 KB.

## Verified

- Typechecks and builds clean.
- Server-renders its content.
- No `printer`, `receipt-col`, `PerforatedEdge` or `THERMAL` markup remains.
- Bill engine on the sample bill: 9 lines parsed, $2,124 billed against $509
  fair, $1,615 recoverable, 13 flags.
- Screenshotted at 390px and 1440px with no console or
  hydration errors on any screen.
- Scanning end to end: a photographed statement read on the device, cleaned,
  parsed to 7 lines, and priced into findings.
- Relief engine across income bands: $22k/hh3/NY → 80% FPL → written off;
  $48k → 175% → written off (NY's threshold is 200%); $140k → 511% → unlikely.
- Call script generates at 21 lines.

## Notes

Everything runs in the browser. No bill text, photograph or ZIP code leaves the
device; state persists in `localStorage` only. The one network request the app
makes beyond its own assets is the recognition engine's files on a first scan.

The fair-price reference, the FPL tables and the state charity rules are
point-in-time data. Check `lib/engine/relief.ts` before relying on a threshold:
these change annually.
