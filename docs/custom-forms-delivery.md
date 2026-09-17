# Custom forms delivery

Implemented 16 September 2026 across the admin frontend, Go admin API, public frontend, Adonis public API, and Ace migration repository. Production deployment is separate from these workspace changes.

## Behavior

- **Form mandiri** starts closed, with anyone-with-link access. `/form/[id]` is canonical; the independent-form alias redirects there. A missing access setting on an older form means member-only access. Optional identity answers belong to the response and never update a member profile.
- **Pertanyaan, Alur, Respons, Pengaturan** separate editing, routing, reviewing answers, and publication. Preview and save remain available while scrolling. Responses is specific to standalone forms; activity and club responses remain in their registration workflows.
- **Alur** shows each choice's effective destination, fallback destinations, early submission, and unreachable sections. Each section can branch independently. The route list uses ordinary keyboard-accessible buttons beside the existing rule editor. Invalid routes block saving and preview.
- **Pratinjau** runs unsaved questions, required-field validation, Back, changed answers, branching, restart, and completion. Its route history is visible. Selected files remain local simulation; it creates no uploads, responses, or profile updates.
- File questions support **PDF saja**, **Gambar saja**, and **PDF dan gambar**. Settings persist as `file.accept`, `maxFiles`, and `maxSizeMB`. Defaults are one file and 10 MB; limits are five files and 10 MB per file.
- Respondents get upload progress, processing status, retry, removal, and actionable errors. A file becomes an answer after successful processing and private storage. Lost upload responses can be retried with the same opaque upload ID.
- Static JPEG, PNG, and WebP inputs are oriented, fitted inside 2400 × 2400 without enlargement, and encoded as WebP at quality 85, retaining transparency and stripping metadata. Animated, malformed, or over-40-megapixel images are rejected. Valid PDFs retain their original bytes. Go and Adonis have matching form-upload presets.
- Sessions bind attachments to the form, question, and respondent. Only final-route attachments are claimed. Responses save a schema/title snapshot and optional member ID. Concurrent submission retries return the same response. New intentional submissions start a new session.
- Admins can paginate responses, inspect historical questions, download private attachments, and export Excel. Spreadsheet values are escaped and file hyperlinks lead to authenticated admin downloads. Closing blocks new submissions/uploads; responses survive closing and schema edits. A form with responses cannot be deleted or converted.
- Sharing reuses the existing short-link service and permissions. It supports existing-link reuse, custom-code collisions, copy/open actions, and QR download.

## Design decisions

Design read: a working form editor for BMKA administrators and a quiet respondent form, using the established BMKA visual system and Indonesian interface. **ENERGY 1 / RHYTHM 1 / MOTION 1**.

| Decision | Reason |
| --- | --- |
| Existing BMKA blue, with #087da7 primary controls and #096c92 links | Keep the established identity while maintaining readable text contrast. |
| Existing typography, 1120px editor width, white surfaces, borders, and spacing | Match activity setup and the surrounding admin workspace. |
| Focused question editor and searchable outline | Keep long forms navigable without mounting every question editor. |
| Four task tabs with persistent actions | Separate building, routing, reviewing, and opening responses without hiding preview/save/share. |
| Route overview beside editable rules | Make multiple branching sections and every answer destination visible together. |
| Numbered sections and plain route labels | Communicate sequence and destinations without a canvas that requires pointer dragging. |
| Bordered response/form surfaces | Group real form content; no decorative card grid. |
| Existing action icons and explicit Indonesian labels | Make edit, save, preview, reorder, copy, and download actions identifiable. |
| Motion disabled in the builder | Keep focus, keyboard sorting, and popup geometry predictable. |
| Narrow, centered public form | Give the respondent one question section and one primary action at a time. |

Mobile redesign remains deferred. Existing narrow-screen controls and overflow behavior were regression-tested, without imposing the desktop density target on wrapped mobile actions.

## Verification and evidence

Evidence paths below are relative to `kaderisasi-admin-be-go/.artifacts/` unless stated otherwise. Synthetic test data and private uploads were confined to owned schemas and recorded storage keys.

| Check | Result |
| --- | --- |
| Admin lint, TypeScript/Vite build, Vitest | Passed; 158 tests in 30 files. Existing vendor-chunk size advisory remains. |
| Public frontend lint, typecheck, production build | Passed, including the standalone route under Cache Components. |
| Public backend lint, typecheck, build, unit tests | Passed; 50 unit tests, 16 environment-dependent tests skipped in the unit-only invocation. Real database paths exercised by the browser/shared suites below. |
| Go `make check`, `make test-unit` | Passed, including generated-query consistency and race-enabled tests. |
| Ace maintenance lint, typecheck, build, migration tests | Passed; five migration tests, owned schemas cleaned. |
| Affected Go form, routing, media, and cleanup integrations | Passed; cleanup covers expired/unclaimed files, retained claimed/live files, storage failure, and repeat runs. Two owned integration objects removed. |
| Public browser upload/routing suite | Seven passed: `browser/2026-09-16T02-35-05-481Z`. All three acceptance modes across standalone/member activity/guest activity/club and edit ownership. Fifteen owned mode-test objects removed, plus the first scenario's recorded objects. |
| Standalone builder and response UI | Two passed in final combined run `browser/2026-09-16T02-47-02-281Z`. Three file modes, local preview, early submission, opening, custom-code collision/reuse, QR Escape/focus, pagination, historical labels, Excel download, empty-response export retention, and formula escaping. |
| Existing builder browser suite | Three passed in final combined run `browser/2026-09-16T02-47-02-281Z`; interactive validation/Back/restart, local draft recovery, keyboard ordering, routing repairs. |
| Large form UI | Passed at 1440px and 390px with normal and reduced motion, 12 sections and 96 custom questions; only eight active-section questions mounted. `form-builder-guidance/` contains screenshots and results. |
| Shared Go/Adonis database suite | 95 checks passed. |
| Existing short-link service and browser suite | Passed: real Go/Rust integration, collisions, permissions, link reuse, clipboard, QR download, errors, and desktop/mobile detail sharing. `short-links/final.log` and `short-links/verification.json`; owned schema cleanup complete. |
| Historical registration comparison | 68/128 equivalent. The 60 differences concern existing activity publication/open defaults and education-history serialization/export behavior. These implementations have no changes in this delivery. The raw comparison is retained in `contracts/registrations-report.json`; it is not represented as a passing compatibility comparison. |
| Final fixture cleanup | Passed: run `40096b1b1234d95a`, all three owned schemas removed, no pending recorded storage objects. `custom-forms-cleanup.log` and `schemas.json`; separate short-link schema cleanup is recorded in its verification report. |

The public browser suite also checks unchanged PDF bytes, optimized WebP output, anonymous storage denial, forged ownership rejection, upload retry identity, size/count limits, removal/re-upload, member-only access, optional identity, unchanged profiles, simultaneous submission retries, schema-change rejection, closed-form rejection, authenticated downloads, exports, and cleanup. Image unit tests cover orientation, dimensions, no enlargement, transparency, metadata removal, animation rejection, and invalid processing input. A separate routing test covers two branching sections and pruning both skipped destinations.

## Antislop delivery gate

This gate applies to the custom-form surfaces and controls changed here. The approved desktop focus supersedes a mobile redesign requirement; existing narrow-screen functionality is checked as a regression.

- R-02 PASS: introduced UI copy uses ordinary punctuation, without decorative em dashes.
- R-03 PASS: 1280px/1440px browser captures and 390px large-form regression include overflow checks.
- R-17 PASS: displayed counts come from fields, sections, or saved responses; test measurements are labeled as fixtures.
- R-18 PASS: no testimonials added.
- R-23 PASS: existing BMKA assets and approved navigation direction retained.
- R-24 PASS: canonical form links, sharing links, section destinations, and authenticated attachment routes resolve to implemented behavior.
- R-25 PASS: inherited dark text and #595959 secondary text remain readable on white; primary #087da7 and link #096c92 use the existing accessible BMKA shades.
- R-26 PASS: preview, save, settings, branching, uploads, response details, export, share, and QR controls have recorded interactions.
- R-27 PASS: closed, loading, empty responses, invalid fields/routes, failed save, failed upload, stale schema, and short-code collision states are implemented and exercised.
- R-28 PASS: no FAQ added.
- R-32 PASS: keyboard sorting, route buttons, input labels, focus outlines, dialog Escape, and QR focus restoration are exercised.
- R-33 PASS: feature code and styles live in source; no runtime source-patching mechanism added.
- R-34 PASS: no new theme toggle or forced theme introduced.
- R-35 PASS: production builds and browser click-throughs were run; detailed evidence is listed above.
- R-36 PASS: no invented compliance, security certification, customer, or performance claims.
- R-37 PASS: approved BMKA direction and explicit 1/1/1 dials guide the changes.
- R-38 PASS: fabricated respondent content is confined to named synthetic test fixtures.
- R-01 PASS: no decorative gradients or glow introduced.
- R-04 PASS: established icons identify actual actions, with text labels.
- R-06 PASS: existing application typography retained.
- R-07 PASS: no background patterns introduced.
- R-08 PASS: arrows are reserved for actual navigation and ordering.
- R-09 PASS: status labels describe saved/open/closed/processing state; no promotional badges.
- R-10 PASS: no glass effects introduced.
- R-12 PASS: bordered surfaces group sections; popup elevation follows existing components.
- R-13 PASS: no glow effects introduced.
- R-14 PASS: expanded question controls, compact outline entries, route lists, and response tables follow their content.
- R-19 PASS: motion is disabled in the builder; normal/reduced-motion regression checks pass.
- R-22 PASS: no decorative illustrations introduced.
- Dials PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 match the restrained working editor and respondent form.
- Focal point PASS: active question/section, selected route, or response detail supplies one main task per workspace.
- Whitespace PASS: section headings, question inputs, route rules, and actions have explicit separation.
- Accent PASS: BMKA blue marks selected sections, links, and the primary action.
- Identity PASS: BMKA typography, blue selection treatment, guided-page containers, and Indonesian action copy repeat throughout.
- Design Read PASS: the existing BMKA direction was adopted before implementation.
- C-1 PASS: major visual choices have one-line reasons in the decision table.
- C-2 PASS: changed controls have real behavior covered by the recorded checks.
- C-3 PASS: every tab and surface serves form content or administration.
- C-4 PASS: desktop states, keyboard operation, and existing narrow-screen behavior were exercised.
- C-5 PASS: claims and test results are evidence-backed; historical comparison differences are disclosed.
- R-05 PASS: layout follows form-editing tasks, without marketing-template sections.
- R-11 PASS: existing rectangular controls and surface radii retained.
- R-15 PASS: actions name their result, such as Simpan Perubahan, Kirim jawaban, and Ekspor Excel.
- R-16 PASS: no marketing buzzwords added.
- R-20 PASS: the feature uses the existing BMKA working interface and Indonesian field vocabulary.
- R-21 PASS: existing application theme retained.
- R-29 PASS: existing neutrals and BMKA blue, with semantic error/warning colors only.
- R-30 PASS: standalone access follows a familiar form workflow without copying another product's visual identity.
- R-31 PASS: color, layout, typography, spacing, surfaces, icons, and motion have written reasons above.

## Deployment

1. From `kaderisasi-admin-be`, inspect the intended environment with `node scripts/maintenance.mjs --environment=prod migration:status`, then apply the additive migration with `node scripts/maintenance.mjs --environment=prod migration:run --force`. Use `test` only when deliberately targeting the shared test database. Migration execution in this delivery was limited to owned test schemas.
2. Deploy both APIs and both frontends together after the migration. Install the public backend lockfile, including `pdf-lib`; retain its existing Sharp runtime and Go's existing libvips/govips runtime.
3. Keep `custom-forms/` objects private in the existing S3-compatible bucket. The APIs use existing storage configuration; no public object URL is returned. Public and admin origins must be configured for canonical sharing and authenticated Excel attachment links.
4. Add `node scripts/run.mjs --environment=prod forms:clean-uploads` from the Go repository to the existing external scheduler, for example hourly. The job deletes only unclaimed attachments from expired 24-hour sessions, retries storage failures on the next run, and is never started by the API.
5. Verify the configured short-link service remains available and permissions include `short_links.read`/`short_links.manage` for link administration. Keep its hostname distinct from the public site's hostname, as required by the existing loop guard. Local tests use `localhost:3000` for the public app and `127.0.0.1:4000` for short links. Responses and attachment downloads require `custom_forms.read`; form changes require `custom_forms.manage`.

No production migration, deployment, or scheduler change was performed by this delivery.
