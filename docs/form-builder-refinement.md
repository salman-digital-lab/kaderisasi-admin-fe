# Form builder refinement

Verified 12 September 2026. This update changes the admin editor's presentation and navigation. The stored schema and public registration behavior retain the existing routing contract.

## Interaction changes

- Show one custom section at a time. Keep data diri pinned first in a searchable section outline, with a drawer on mobile. Search also finds question titles and opens the matching editor.
- Show questions as compact rows. Expand one question for editing; summarize its type, choice count, required state, and routing role when collapsed. Edit section metadata on demand and keep routing controls collapsed initially.
- Keep Save, Preview, and section navigation available during scrolling. Measure the toolbar height so long titles and mobile wrapping do not cover navigation.
- Move questions through a searchable destination dialog, with Cancel and an empty search state. Retain drag handles, keyboard sorting, move menus, duplication, and deletion.
- Use the existing guided workflow width, typography, white surfaces, borders, and BMKA accent. Simplify profile rows while preserving required name/gender restrictions.
- Report local draft completion only after the current snapshot is written. Preserve the option editor's row identity during first-label normalization so the next menu click is retained.
- Disable builder motion through Ant Design configuration. Under reduced motion, explicitly disable positional transitions in builder popups: the application's universal short transition otherwise interferes with synchronous popup measurements.

Design read: a working editor for BMKA administrators, following the existing activity setup visual language. ENERGY 1 / RHYTHM 1 / MOTION 1. The current section is the focal point; the accent identifies selection and the save action. Dividers and spacing organize actual form content.

## Verification

The API-intercepted large-form test contains 12 sections, 96 custom questions, and 9 profile fields. These are synthetic test data. At 1440px and 390px the initial view renders only 8 custom questions. Document height is 1,292px and 1,601px respectively, compared with 16,402px and 19,200px in the captured previous editor.

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run build` (TypeScript and Vite) | PASS; existing large vendor-chunk advisory remains |
| `npm test` | PASS, 148 tests in 27 files in the shared workspace |
| `npm run test:form-builder-ui` | PASS at 1440px and 390px |
| `FORM_BUILDER_REDUCED_MOTION=1 npm run test:form-builder-ui` | PASS at both widths |
| Go harness `node scripts/browser.mjs --borrow-workspace tests/browser/form-builder.spec.mjs` | Four persistence/recovery cases passed; both controls cases passed after fixes in the focused `--grep 'builder keyboard'` rerun |
| Fixture cleanup | PASS; run `a327364ec035d818` cleaned all three owned schemas, with zero pending storage objects |

The large-form test requires the sibling Go repository's installed Playwright dependency and a Vite server on port 3005. It intercepts all API requests, checks unexpected mutations, and never writes registrations. The Go browser suite uses its fixture lease and real isolated PostgreSQL schemas; it also verifies that preview creates no registrations.

Recorded control checks:

- Outline: section selection, profile selection, title search, question search, no results, mobile drawer, focus transfer, sticky position, previous/next buttons, keyboard reordering, add section.
- Questions: inline title/type/options/required editing, option keyboard sorting and move/delete menus, first-blur menu click, question move/copy/delete, searchable destinations, no matching destination, Cancel and confirm.
- Sections: metadata Edit/Done, duplicate with fresh IDs and no routes, reorder, delete/Cancel, description-only empty sections.
- Validation/routing: hidden invalid section opens on Save, invalid bounds/patterns block persistence, removed options and backward destinations show repair errors, stable values survive label changes.
- Preview: desktop/mobile width, both branches, skipped required questions, current-section validation, Back, early submission, simulated completion, restart, Close, no persistence.
- Recovery: failed Save, local draft status, refresh, Restore/Discard, changed-server warning, successful Save clears recovery.
- Visuals: matching activity setup and builder screenshots at 390px and 1440px; no horizontal overflow or browser page errors. Captures settle finite animations before inspection.

Evidence is retained in `../../kaderisasi-admin-be-go/.artifacts/form-builder-refinement/`, including `ui-normal.log`, `ui-reduced.log`, `browser.log`, `browser-controls.log`, `cleanup.log`, and matching-width PNGs. Database reports are in the browser runs `2026-09-12T15-20-54-842Z` and `2026-09-12T15-25-02-708Z`. The original feature's broader backend verification remains in `../../kaderisasi-admin-be-go/docs/FORM_BUILDER_VERIFICATION.md`.

## UI delivery gate

Applies to controls and presentation changed in this refinement, not to unrelated application pages. Each PASS refers to the source review and recorded interactions above.

- R-02 PASS: no decorative em dash in introduced UI text.
- R-03 PASS: both widths have document-width assertions, inspected screenshots, and 44px buttons/menu targets.
- R-17 PASS: counts derive from schema fields; measured fixture dimensions are identified as test evidence.
- R-18 PASS: no testimonials added.
- R-23 PASS: existing logos, application navigation, and approved visual direction retained.
- R-24 PASS: section destinations resolve by stable IDs; previous/next and search navigation exercised.
- R-25 PASS: white-surface text uses #595959 (7.0:1), #454545 (9.59:1), #096c92 (5.88:1), and errors #a8071a (7.75:1); primary #087da7 has 4.66:1 against white. Destructive menu text is darkened, including hover.
- R-26 PASS: every changed control produces a tested state change, navigation, validation result, or save.
- R-27 PASS: loading/error wrappers retained; empty sections, empty searches, invalid routes, and failed saves exercised.
- R-28 PASS: no FAQ introduced.
- R-32 PASS: keyboard sorting, menu alternatives, visible focus, dialog dismissal, and section focus exercised.
- R-33 PASS: changes implemented in source; no runtime source-patching script added.
- R-34 PASS: no theme added or deferred.
- R-35 PASS: production build and recorded control checks pass.
- R-36 PASS: no invented performance, customer, or compliance claims.
- R-37 PASS: approved calm BMKA workflow direction and explicit dials used.
- R-38 PASS: synthetic content confined to test fixtures.
- R-01 PASS: no decorative gradient or glow.
- R-04 PASS: established icons represent search, ordering, editing, copying, deleting, preview, and navigation; decorative icons are hidden from accessible labels.
- R-06 PASS: application typography retained for adjacent-page consistency.
- R-07 PASS: no background pattern.
- R-08 PASS: arrows indicate actual section movement.
- R-09 PASS: status appears as plain supporting text; no promotional badges.
- R-10 PASS: no glass effects.
- R-12 PASS: section borders establish grouping; popup elevation uses existing components.
- R-13 PASS: no glow effects.
- R-14 PASS: compact rows and expanded editor reflect different interaction states.
- R-19 PASS: native no-motion builder configuration and reduced-motion browser checks pass.
- R-22 PASS: no illustrations.
- Dials PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 match the restrained editor.
- Focal point PASS: only the active section and selected question expose editing controls.
- Whitespace PASS: section metadata, questions, and routing have distinct spacing and dividers.
- Accent PASS: established BMKA accent indicates selection and primary actions.
- Identity PASS: Indonesian workflow language, data-diri restrictions, and existing guided surfaces remain.
- Design read PASS: audience, direction, and dials recorded above.
- C-1 PASS: presentation choices reduce simultaneous controls and support navigation.
- C-2 PASS: changed controls have recorded functional outcomes.
- C-3 PASS: sections derive from administrator content.
- C-4 PASS: both widths, keyboard use, reduced motion, validation, and recovery exercised.
- C-5 PASS: suite counts and layout dimensions come from recorded results.
- R-05 PASS: layout follows form content and active editing state.
- R-11 PASS: existing rectangular controls and restrained surfaces retained.
- R-15 PASS: actions use specific labels such as Simpan Perubahan, Edit bagian, and Pindahkan.
- R-16 PASS: no marketing buzzwords.
- R-20 PASS: BMKA terminology and profile constraints remain visible.
- R-21 PASS: existing light appearance retained.
- R-29 PASS: neutral surfaces, established accent, and semantic error colors.
- R-30 PASS: Google Forms informs interaction; adjacent BMKA pages determine styling.
- R-31 PASS: each layout change has its practical reason recorded in this report.
