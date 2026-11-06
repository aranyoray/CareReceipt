<img src="public/logo-wordmark.svg" alt="CareReceipt" width="268">

**Is this bill wrong?** Photograph or paste an itemised US hospital bill.
CareReceipt prices every line against what the procedure actually costs where
you live, says which lines are worth disputing, and writes the words to use on
the phone. It also prices the population health risk for a profile, works out what a
household is owed under its state's charity-care rules with the application
letter written for it, and lists the billing protections that apply to the bill
with the deadline on each one and the letter that goes with it.

```
app/          one route, the workspace and its four screens
components/   BillCheck, PreventiveCheck, FinancialHelp, RightsCheck, Scan, Slip, shared state
lib/engine/   bill audit, risk, costs, geo, charity-care rules, rights and deadlines
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
product name and the screens as tabs: Bill check, Health risk, Financial help
and Rights & deadlines. CareReceipt stands alone and links to nothing outside itself. There is no
home screen and no bottom tab bar.

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

**Health risk.** Age, sex, race and the conditions already diagnosed on the
left. Print puts the most likely conditions, what they cost a year and the
per-condition breakdown on one slip. It is the population risk receipt only;
there is no local exposure section.

**Financial help.** ZIP code, household income, household size and the balance
owed on the left. The ZIP code, income and household are the same values Bill
check uses, and the balance is taken from the checked bill (what is left after
the disputes) until it is typed over. Print puts the state's charity-care
rules, where the household sits against the poverty level, the estimated
balance after assistance and the application letter on one slip, with a button
to copy the letter. The charity care card under Bill check stays, and opens
this screen to write the letter.

**Rights & deadlines.** ZIP code (shared), how the care was paid for, whether
the hospital is a nonprofit, the date of the first bill, whether an itemized bill
has arrived and whether anyone has started collecting. Uninsured patients add the
good faith estimate and that provider's bill, which is taken from the checked
bill until it is typed over; insured patients add the date on any denial notice.
Print puts the next deadline, a dated timeline with today on it, each protection
that applies with its status, and the letters on one slip. The rules live in
`lib/engine/rights.ts`, every deadline counted in calendar days from the dates
entered:

- Texas Health and Safety Code chapter 185 (SB 490, 2023, amended by HB 216,
  2025): a provider asking for payment must send a written itemized bill and may
  not pursue debt collection until it has. Drafts the request, and the demand to
  stop collecting when collection has already started.
- No Surprises Act patient-provider dispute resolution: uninsured or self-pay,
  a bill at least $400 above that provider's good faith estimate, 120 days from
  the bill, $25 fee, no collections while the dispute is open.
- IRS 501(r) for nonprofit hospitals: applications accepted for at least 240
  days after the first post-discharge bill, no extraordinary collection actions
  before day 120 or without 30 days' written notice, and none while an
  application is pending.
- Internal appeals: at least 180 days from a denial notice for most employer and
  marketplace plans, with Medicare and Medicaid flagged as shorter.
- A surprise-billing flag from the bill check adds the No Surprises Act balance
  billing protection for insured patients.

It is general information about the rules, not legal advice, and the slip says so.

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

## Health risk

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
- Charity-care engine across income bands: $22k/hh3/NY → 80% FPL → written off;
  $48k → 175% → written off (NY's threshold is 200%); $140k → 511% → unlikely.
- Call script generates at 21 lines.
- Rights engine on fixed dates: a first bill on 1 September 2026 gives the
  federal dispute deadline and the earliest extraordinary collection on 30
  December 2026 and the financial assistance window to 29 April 2027; a denial
  on 1 October 2026 gives an appeal deadline of 30 March 2027; a bill $300 over
  its estimate is ruled out of the dispute process; a first-bill date in the
  future is ignored. Rights & deadlines screenshotted at 390px and 1440px with
  no console errors.

## Notes

Everything runs in the browser. No bill text, photograph or ZIP code leaves the
device; state persists in `localStorage` only. The one network request the app
makes beyond its own assets is the recognition engine's files on a first scan.

The fair-price reference, the FPL tables and the state charity rules are
point-in-time data. Check `lib/engine/relief.ts` before relying on a threshold:
these change annually.
