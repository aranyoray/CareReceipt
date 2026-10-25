<img src="public/logo-wordmark.svg" alt="CareReceipt" width="268">

**Is this bill wrong?** Photograph or paste an itemised US hospital bill.
CareReceipt prices every line against what the procedure actually costs where
you live, says which lines are worth disputing, and writes the words to use on
the phone.

Its sister product, [ReliefReceipt](https://github.com/aranyoray/ReliefReceipt),
answers the other half: *can I get it waived?* The two were one monorepo until
they were split into a repository each; the engine under `lib/engine` and the
design system under `ui` are vendored into both, identical on each side.

```
app/          one route, the shell and the three tabs
components/   Home, BillCheck, PreventiveCheck, Scan, shared state
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

Built for a phone browser first and widened for a desktop one.

**On a phone** it is an app: a teal bar at the top, cards on a tinted
canvas, and a fixed tab bar at the bottom holding the sections a thumb reaches
for. It opens on a home screen that says where the bill in hand has
got to (added, priced, findings ready), leads with the one figure that matters,
and lists the single next thing to do. The bill screen is a segmented control
over three views: the findings, the bill line by line, and the bill itself.
Input arrives in a bottom sheet rather than inline, so the page never reflows
around the system keyboard, and numeric fields open a keypad in that sheet on a
touch screen while staying ordinary inputs on a desktop.

**From 860px** the tab bar becomes a pill row in the header, single-column
screens hold to a readable width, and the preventive check splits into controls
on the left and results on the right.

Both run light and dark from the same tokens, with a toggle for pinning one.

**Charts.** Two series at most, and they always mean the same thing: `s1` is
the benchmark, `s2` is what was billed. Status colours are kept for state and
never used as a series. Both series colours were checked for colour-vision
separation and for contrast against the card surface in both themes before
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
rows of chips. Every profile in the reference is one age band, one race group
and one sex, so the screen asks rather than guessing a default.

Anything marked as diagnosed does two things: the other conditions are shown at
their rate among people who have it, and the diagnosed condition itself is
counted as certain instead of likely in the cost figure.

**Burden is reported per year.** The cost model builds a discounted present
value over the years ahead; dividing it back by the same annuity factor gives
the level annual amount, which is both easier to read and easier to act on than
a six figure lifetime total. Prevalence times cost, per condition, is back on
the screen with it.

## What changed from Billculate

**The receipt paper is gone.** Billculate rendered a thermal printer: a housing
with a status LED, a slot, and a one-second paper-feed animation that grew a
cream page out of it. Findings were rows on that page, separated by dotted
leaders, with a tilted red rubber stamp for the verdict. Everything was
monospaced.

None of it survives. `Workspace`, `PrintStage`, `usePrinted`, `ReceiptPaper`,
`PerforatedEdge`, `DashRule` and `Stamp` are all deleted. A finding is now a row
in a card, severity is a coloured rail, and a verdict is a badge. Results appear
as soon as they are computed instead of being "printed" on demand.

The one thing kept is tabular figures — columns of money do have to line up — so
`--font-num` is still monospaced while prose is not.

**Bill check is the product.** It is the default view and the first thing in the
nav. The old three-tab split gave it equal billing with two research features.

**Preventive check is one feature, marked [NEW].** Risk Receipt and The Exposome
answered halves of the same question — what is likely to go wrong for someone
like you, and what where you live adds on top — so they are merged.

**Charity care became its own product.** `federalPovertyLevel`, `charityRule`,
`assessEligibility` and the FPL tables were buried inside `faircare.ts` behind
the bill auditor. They are `lib/engine/relief.ts` now, and ReliefReceipt is
built on them. The call script this app copies comes from the same file.

## Two bugs found in the original

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
- Screenshotted at 390px and 1280px, in light and dark, with no console or
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
