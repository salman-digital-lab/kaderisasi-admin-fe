# Question workspace density

17 September 2026. Design read: the BMKA desktop form workspace, retaining ENERGY 1 / RHYTHM 1 / MOTION 1.

The earlier layout pass covered settings. This pass addresses the question workspace shown in the user's follow-up screenshot.

- Remove the builder's 1120px cap so it uses the dashboard's available content width, like ActivityDetail. Keep the sidebar, existing page gutters and 248px section outline.
- Align the toolbar with the tabs and outline rather than adding another horizontal inset.
- Put the section title and its edit action on one desktop row. Expanded section fields still use their full width.
- Remove the outline's minimum height so a short form does not reserve space for nonexistent sections.
- Reduce section-header and question-row spacing while preserving readable descriptions, visible focus, and 44px question controls. Section-level desktop actions use 32px height.
- Preserve BMKA typography, colors, borders, and mobile section layout; add no motion or decorative components.

Verification: lint and TypeScript/production build pass. `form-density.mjs` verifies the four-question fixture at 1280px, 1440px, 1920px (activity editor route), and 390px, including width usage, compact section height, section editing, no overflow and no browser errors. The full builder suite passes at 1440px and 390px; the same large-form fixture's desktop document height decreased from 1332px to 1223px. All API requests are intercepted and no real form is modified.

Antislop follow-up gate: PASS for purposeful spacing and hierarchy (reasons above), layout resilience (four viewport checks), real controls (section editing plus full builder regression), and existing visual identity/dials. The full [custom forms gate](custom-forms-delivery.md#antislop-delivery-gate) remains applicable. Screenshots are in `../../kaderisasi-admin-be-go/.artifacts/form-density/`.
