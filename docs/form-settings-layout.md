# Form settings layout review

17 September 2026. Design read: a desktop editing workspace for BMKA administrators, using the existing guided admin form style. ENERGY 1 / RHYTHM 1 / MOTION 1.

## Decisions

- Reuse ActivitySetup's guided-section border and padding so settings share the same container treatment as activity editing.
- Place respondent messages side by side from 992px to use desktop width while preserving their before/after order.
- Replace the metadata sidebar with a wrapping definition list below the editor; facts no longer reserve a third of the editing width.
- Keep the existing font, square controls, blue save action, focus treatment, and white surface to preserve BMKA's visual system.
- Use a 32px desktop rich-text toolbar to keep formatting controls subordinate to the content; retain existing touch targets on narrow screens.
- Bound editor heights to keep long content editable without pushing settings far down the page.
- Use neutral status text because an inactive form is a state, not a validation error.

## Verification and delivery gate

- PASS, layout: `node tests/ui/form-settings.mjs` checks 1280px, 1440px, and 390px, desktop columns, narrow-screen stacking, editable inputs, keyboard expansion, no overflow, and no browser errors.
- PASS, visual consistency: settings screenshots compared with ActivitySetup at 1440px and the existing guided-section source; shared container, borders, spacing, and controls are retained. Screenshots live in `../../kaderisasi-admin-be-go/.artifacts/form-settings/`.
- PASS, functional regression: `npm run test:form-builder-ui` passes at 1440px and 390px, including saves, routing, preview, and local draft recovery. Requests use intercepted fixtures; no database records or storage objects are created.
- PASS, engineering: lint and production build, including TypeScript checking, pass. Existing vendor bundle-size advisory remains.
- PASS, purpose and craftsmanship: every layout change has its content-specific reason above; no decorative assets, navigation, fabricated facts, or new motion were introduced.
- PASS, interaction and resilience: existing controls retain handlers and focus treatment; the settings test edits both message inputs and opens advanced settings with Enter.
- PASS, hierarchy and dials: the editing area remains primary, metadata is secondary, and the existing blue save action remains the accent. ENERGY 1 / RHYTHM 1 / MOTION 1.

The complete rule-by-rule [antislop gate](custom-forms-delivery.md#antislop-delivery-gate) remains applicable; this follow-up changes layout and metadata presentation only.
