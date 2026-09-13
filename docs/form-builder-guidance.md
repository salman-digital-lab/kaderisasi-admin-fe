# Form builder guidance

Verified 13 September 2026. This refinement adds Indonesian guidance to the shared activity/club form editor without changing the schema or registration APIs.

## Content and interaction

- A compact **Panduan** button explains built-in profile data, custom questions, sections, routing, preview, and explicit saving. Help opens on click or Enter, closes on Escape or outside click, and does not change the form or save status.
- **Data diri** explains that these are built-in fields, so administrators should use them instead of creating duplicate custom questions. A visible campus example points to **Pendidikan Sekarang**, or **Riwayat Pendidikan** when already selected. The info button explains where to find these fields and which values they collect.
- Profile rows show their purpose instead of only their input type. The picker explains reuse and distinguishes current education from multiple education records. Its existing education exclusivity rule remains intact, and options support keyboard activation.
- The custom-question area links directly to Data diri. Routing and validation explanations appear inside their existing expanded settings, preserving the collapsed layout.

The education descriptions were checked against the current-education and education-history rendering in the public frontend. Both collect campus/school, degree, faculty, major, and entry year; their existing schema keys remain unchanged.

Design read: contextual help for BMKA administrators within the approved calm form editor. ENERGY 1 / RHYTHM 1 / MOTION 1. Existing activity workflow widths, typography, spacing, white surfaces, and BMKA accent are retained. An information icon identifies optional explanation; plain supporting text carries the important reuse reminder. Popovers use centered placement so Ant Design can shift them within narrow viewports. Picker descriptions stack on mobile for readability.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run build` | PASS, including TypeScript; existing vendor chunk advisory remains |
| `npm test` | PASS, 148 tests in 27 files |
| `npm run test:form-builder-ui` | PASS at 1440px and 390px |
| `FORM_BUILDER_REDUCED_MOTION=1 npm run test:form-builder-ui` | PASS at both widths |

The existing API-intercepted browser workflow uses 12 sections, 96 custom questions, and 9 initial profile fields. It now verifies help opening/dismissal, keyboard activation, unchanged save status after reading help, the direct Data diri link, education descriptions, and switching between the two education types. Adding Pendidikan Sekarang produces exactly one `current_education` profile field while the custom-question count remains 96. The workflow still exercises editing, reordering, duplication, routing validation, preview, recovery, and five successful intercepted saves per width.

Screenshots of the builder, both help popovers, education picker, and analogous activity setup were inspected at matching mobile and desktop widths. Capture waits for popup alignment and opacity before checking document width and taking screenshots. No horizontal overflow or browser page errors remains. All `/v2` requests are intercepted, including mutations: no live forms, profiles, registrations, or database fixtures are created.

Evidence is retained in `../../kaderisasi-admin-be-go/.artifacts/form-builder-guidance/`, including `ui-normal.log`, `ui-reduced.log`, `lint.log`, `build.log`, `tests.log`, `ui-results.json`, and matching-width screenshots. The broader feature checks remain documented in `form-builder-refinement.md`.

## UI delivery gate

Applies to this guidance refinement; each result refers to the source review and recorded browser workflow above.

- R-02 PASS: introduced UI copy contains no decorative em dash.
- R-03 PASS: both widths pass document and popup bounds checks; mobile descriptions wrap and controls retain 44px targets.
- R-17 PASS: no product statistics added; fixture counts are identified as test data.
- R-18 PASS: no testimonials added.
- R-23 PASS: existing application assets and navigation retained.
- R-24 PASS: Data diri link opens the actual profile section.
- R-25 PASS: help text uses #454545 or #595959 on white; the inline link uses #096c92, all above 4.5:1.
- R-26 PASS: guide, profile tip, profile link, picker, keyboard activation, and closing controls have verified outcomes.
- R-27 PASS: existing loading/error wrappers remain; failed saves and recovery still pass the browser workflow.
- R-28 PASS: no FAQ added.
- R-32 PASS: Enter opens help and adds a field; Escape dismisses help; visible focus and accessible names are present.
- R-33 PASS: functionality lives in source components and CSS.
- R-34 PASS: no theme change introduced.
- R-35 PASS: lint, TypeScript/build, existing tests, and both browser modes pass.
- R-36 PASS: no security, performance, or compliance claims added.
- R-37 PASS: the user-approved clean direction is retained, with explicit dials above.
- R-38 PASS: realistic synthetic content is confined to intercepted tests; help describes existing field behavior.
- R-01 PASS: no gradient or glow added.
- R-04 PASS: the information icon marks optional help and is hidden from accessible names.
- R-06 PASS: existing typography preserves consistency with activity setup.
- R-07 PASS: no background pattern added.
- R-08 PASS: no decorative arrow added.
- R-09 PASS: no badge added.
- R-10 PASS: no glass effect added.
- R-12 PASS: existing Ant Design popup elevation distinguishes help from the editor.
- R-13 PASS: no glow added.
- R-14 PASS: existing picker cards represent selectable built-in fields; no decorative card grid added.
- R-19 PASS: existing builder no-motion configuration retained and reduced-motion checks pass.
- R-22 PASS: no illustration added.
- Dials PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 match the approved restrained editor.
- Focal point PASS: the active section remains primary, and detailed help is optional.
- Whitespace PASS: existing section spacing is retained; concise text sits beside the related action.
- Accent PASS: existing BMKA accent remains reserved for actions and selection.
- Identity PASS: Indonesian field names and activity/club terminology match the product.
- Design read PASS: audience, visual direction, and dials are stated above.
- C-1 PASS: explanations answer the user's specific reuse and discoverability problem.
- C-2 PASS: every introduced control has an exercised action.
- C-3 PASS: help is attached to actual editor concepts.
- C-4 PASS: both widths, keyboard use, normal motion, and reduced motion pass.
- C-5 PASS: field-coverage claims were checked against the public renderer.
- R-05 PASS: the existing focused-section layout is preserved.
- R-11 PASS: existing rectangular controls and surface radii are retained.
- R-15 PASS: labels specify Panduan, Tambah data diri, and the named field to add.
- R-16 PASS: no marketing buzzwords added.
- R-20 PASS: BMKA terminology and profile restrictions remain visible.
- R-21 PASS: the accepted light appearance is retained.
- R-29 PASS: existing neutral surfaces and BMKA accent are retained.
- R-30 PASS: the implementation follows adjacent application pages.
- R-31 PASS: layout, typography, spacing, icon, and popup decisions have reasons recorded above.
