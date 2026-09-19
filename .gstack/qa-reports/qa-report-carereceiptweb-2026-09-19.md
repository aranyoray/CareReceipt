# QA Report — CareReceipt web (Next.js port)

- Date: 2026-09-19
- Target: http://localhost:3002 (prod build, `next start`)
- Branch: `main` @ `3160169`
- Tier: Standard
- Driver: headless Chrome (Playwright), viewport 402×850 + 320×700
- Screenshots: `../../../scratchpad/qa/` (session), inline-reviewed

## Health score: 98 / 100

| Category | Score | Notes |
|----------|------:|-------|
| Console | 100 | 0 errors, 0 warnings across all screens |
| Links | 100 | referral "Visit site" links present, valid targets |
| Visual | 100 | no overflow at 320px; receipt columns fixed, aligned |
| Functional | 100 | onboarding, module/lang switch, sheets, risk pickers, conditional, tab nav all work |
| Performance | 100 | static prerender, ~single JSON fetch (1.36 MB, force-cache) |
| Content | 100 | EN/ES/HI render; accents + Devanagari correct |
| Accessibility | 90 | controls have aria-labels; decorative emoji + 8px source text are minor gaps |

## Coverage

- **Onboarding** — 3 languages (EN/ES/हिं): correct button text each, no leaks, persists ack.
- **Receipt** — all 3 modules × each language (Frisco EN/ES, Houston EN/ES, India EN/हिं): rendered, screenshotted, scanned.
- **Numbers verified** — Frisco total **$1,981** (matches iOS), Houston total **$2,233** (11.3%×$12,022=$1,358 + 31.7%×$2,759=$875). Item + total rounding consistent with iOS.
- **India signal receipt** — no cost total (correct), TODAY'S SIGNAL + population context render.
- **US Risk** — default (35–44/F/White) renders real CDC rows + CI + n + scope + † disclosure; demographic change (65–69/Male) updates; **already-diagnosed = Hypertension** → "Given:" line, ALSO AFFECTED header, baseline+Δpp per row, Hypertension pinned KNOWN PRESENT.
- **Sheets** — About opens/closes; Referral opens with pathway cards + Visit site links.
- **Persistence** — reload keeps ack + selections (no onboarding re-appearance).
- **Responsive** — 320px narrow: no horizontal overflow.

## Automated checks (0 findings)

- 0 uncaught page exceptions
- 0 failed network requests (non-data URLs)
- 0 `undefined` / `NaN` / `[object Object]` leaks in rendered body across every module×language + risk view
- language fallback correct: India shows no ES control

## Issues found: 0

No source fixes required. No fix commits.

## Deferred (low, optional polish)

- a11y: decorative emoji icons (🧾 💲 🔒 ⚠️ ❤️) and the QR glyph are unlabeled (harmless — decorative). 8px source/footnote text is low-contrast on cream.
- QR is a decorative glyph, not a scannable code (noted at build time).

## PR summary

> QA: 3 modules × 3 languages + US Risk tab exercised headless. 0 console errors, 0 exceptions, 0 data leaks. Numbers match iOS. Health 98/100. No fixes needed.
