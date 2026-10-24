# Receipt monorepo

Two products over one engine, built from `billculate`.

| | |
|---|---|
| **CareReceipt** | *Is this bill wrong?* Prices every line of an itemised US hospital bill against what the procedure actually costs locally, and says what is worth disputing. |
| **ReliefReceipt** | *Can I get it waived?* Works out what charity care you qualify for under your state's rules and writes the application letter. |

```
packages/core    bill audit, charity-care rules, risk, exposome, geo, costs
packages/ui      design system, shared primitives, app shell
apps/carereceipt    Bill check (primary) + Preventive check [NEW]
apps/reliefreceipt  Financial assistance
```

## Running it

```bash
npm install
npm run dev:care     # localhost:3000
npm run dev:relief   # localhost:3001
npm run build        # both
npm run typecheck    # both
```

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
the bill auditor. They are `packages/core/src/relief.ts` now and ReliefReceipt
is built on them.

## Two bugs found in the original

**`fmtUsd` was never defined.** `lib/faircare.ts` used it in 7 places, declared
it once at line 730 as a non-exported local, then re-exported it at line 842.
That worked only because definition and uses happened to sit in one file — the
moment the module was split it broke. It is now exported from `core/src/bill.ts`
and imported where needed.

**Nothing rendered server-side.** Both pages gated their entire body behind a
`mounted` flag, so the first paint was an empty shell and the HTML contained
only the nav. `useStored` already handles its own hydration, so the gate was
unnecessary. CareReceipt's server HTML went from 6.9 KB to 17 KB.

## Verified

- Both apps typecheck and build clean.
- Both server-render their content: CareReceipt 17 KB, ReliefReceipt 8 KB.
- No `printer`, `receipt-col`, `PerforatedEdge` or `THERMAL` markup remains.
- Bill engine on the sample bill: 9 lines parsed, $2,124 billed against $509
  fair, $1,615 recoverable, 13 flags.
- Relief engine across income bands: $22k/hh3/NY → 80% FPL → written off;
  $48k → 175% → written off (NY's threshold is 200%); $140k → 511% → unlikely.
- Call script generates at 21 lines.

## Notes

Everything runs in the browser. No bill text, income figure or ZIP code leaves
the device; state persists in `localStorage` only.

The fair-price reference, the FPL tables and the state charity rules are
point-in-time data. Check `packages/core/src/relief.ts` before relying on a
threshold — these change annually.
