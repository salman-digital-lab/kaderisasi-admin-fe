# Responsive admin implementation and validation

Implementation: 10 September 2026. Target: `kaderisasi-admin-fe` only. The implementation is available for review; full mobile release acceptance is still pending the device and workflow checks below. Nothing has been deployed.

## Review sequence

| Stage                 | Main files                                                                                                              | Result                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation            | `src/hooks/useAdminViewport.ts`, `src/styles/responsive.css`, `src/components/base`, `src/components/common/Breadcrumb` | Compact layouts below 768 px or on coarse pointers at height ≤500 px; drawer navigation below 992 px; independent desktop collapse preference; visible viewport and safe-area sizing.         |
| Shared administration | `src/components/common/Responsive`, list/detail/form integrations under `src/pages`                                     | Cards/table session preferences, original cell formatting/actions, native selection and pagination, explicit card sorting, filter drawers, stacked descriptions and full-screen form dialogs. |
| Form configuration    | `src/pages/CustomForm/CustomFormEdit`, participant `ColumnManager`, activity `ImageList`                                | Vertical question layout, persistent question configuration, labelled edit/duplicate/delete/required actions, explicit reorder buttons.                                                       |
| Certificates          | `CertificateDesigner`, `CertificateCanvas`, element drag/resize hooks, `PropertyPanel`, `ActivityCertificates`          | Compact portrait/landscape tools, persistent canvas/history, precision inputs, gesture transitions, visible save state, foreground batch interruption and reviewed recovery.                  |
| Validation            | Responsive/certificate Vitest tests and `tests/browser` fixtures                                                        | Local automated and representative browser checks completed. Physical-device acceptance remains open.                                                                                         |

No framework, dependency, route, API endpoint, request/response payload, permission definition, database, port, or deployment changes. The member-create control now follows the existing backend `members.manage` permission. Image delete/reorder services propagate failures so their UI handlers can distinguish failure from success; no mutation retry was added. Member list read failures now reach the existing retry/error UI instead of appearing as empty successful results.

## Implementation details

- `ResponsiveTable` keeps one Ant Table mounted across cards/table/desktop transitions. Original columns continue to drive native sorting, pagination, selection, disabled checkboxes and expanded rows. Cards call the original typed renderers and action callbacks. The parent page retains requests, parameters and selection scope. Session preferences use `admin-list-view:<listId>` and tolerate unavailable storage.
- All existing page-level Ant Tables use the shared presentation: members, activities/participants, club tabs, counseling, achievements/leaderboards, province/university reference data, access tickets, roles/capabilities, admin users, custom forms, templates and issuance results.
- Mobile filters use Apply/Reset and active counts for the advanced filter panels. Query values and form instances remain in their owners. Simple existing inline search/status controls remain available.
- Page form modals keep the same Ant Form mounted while CSS changes their geometry. Validation scrolls/focuses the first invalid field. Descriptions stack on compact screens. Safe-area padding and `visualViewport` geometry support keyboard-visible overlays.
- Certificate canvas remains inside one stable Splitter. Compact panels use one Drawer; changing orientation, panel placement or viewport width does not replace the editor controller or canvas. Zoom, position, selected element, document history and autosave remain shared. Valid numeric changes enter the document immediately; incomplete numeric input is retained between property panel presentations.
- Pointer tracking begins with the first touch. A second touch cancels element drag/resize and transitions to focal pan/zoom. Explicit pan, numeric geometry, alignment, layer order/visibility/locking, duplicate/delete, all element types and upload controls remain available.
- Published/archived templates retain the existing read-only/draft-copy lifecycle. The existing artwork renderer, export pipeline, autosave/retry/conflict handling and optional best-effort recovery snapshot behavior remain in use. No new offline or durable draft system was added. Loading a discarded page starts from the server-saved document; any pre-existing recovery snapshot still requires an explicit recovery choice.
- Visibility loss, pagehide or unmount prevents scheduling more certificate batches. An active request may complete. Returning refreshes server state and requires review before issuance can resume. A review that overlaps an interruption is invalidated, including a page restored from the back/forward cache. Completed results remain visible locally and through server refreshes. Only the established idempotent certificate retry flow is used.

## Automated checks

Run from `kaderisasi-admin-fe`:

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
npx vite build --config tests/browser/vite.config.ts
git diff --check
```

96 tests in 20 files pass (baseline: 83). Added coverage includes original card formatting/actions, hidden/nested columns, per-list preference fallback, preserved cross-page/disabled selection in both presentations, touch gesture transitions and viewport centres, interruption with an active request, already-hidden/unmounted batches, image mutation error propagation, and failed reads distinguished from empty member lists. Existing document-history, autosave/conflict, PDF, permission and batch tests continue to pass.

Production and isolated fixture builds pass. Vite still reports the existing large vendor-chunk warning. Ant Design development builds also report deprecated Drawer width/height props and the existing static Modal context warning; the used props are supported by the installed version. These warnings do not establish physical-device compatibility.

## Reproducible browser fixtures

Use the established local port, `npm run dev` (3005). Fixtures replace Axios with an adapter that blocks unhandled requests; fixture mutations affect in-memory fake data only. They are not imported by production routes.

| URL under `http://localhost:3005`                     | Purpose                                                                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tests/browser/responsive.html`                      | Actual layout and member list/create form; long names and pagination.                                                                                                                                    |
| `/tests/browser/responsive.html?mode=selection`       | Shared native selection/sorting/pagination plus participant column manager. DOM output records selections, page, sort and callback count.                                                                |
| `/tests/browser/responsive.html?mode=form`            | Actual custom form editor with 25 questions and Tiptap.                                                                                                                                                  |
| `/tests/browser/responsive.html?mode=club`            | Actual club list/filter/create dialog.                                                                                                                                                                   |
| `/tests/browser/responsive.html?mode=dashboard`       | Actual dashboard with large counts.                                                                                                                                                                      |
| `/tests/browser/responsive.html?mode=details`         | Shared stacked detail descriptions and long text.                                                                                                                                                        |
| `/tests/browser/responsive.html?restricted=1&empty=1` | Read-only member permissions and an empty list. `error=1` injects failed reads.                                                                                                                          |
| `/tests/browser/responsive-comparison.html`           | Member and club pages side by side at 390 and 1440 px.                                                                                                                                                   |
| `/tests/browser/certificate.html?mode=editor`         | Actual editor with 200 elements; add `published=1` for read-only/draft copy or `failSave=1` for save failure.                                                                                            |
| `/tests/browser/certificate.html?interrupt=1`         | Actual 1,000-recipient workflow. First issuance request simulates visibility loss; “Fixture: kembali ke aplikasi” simulates return. This is deterministic fixture simulation, not an OS app-switch test. |
| `/tests/browser/certificate.html?mode=library`        | Actual template library and creation dialog.                                                                                                                                                             |

The fixture build emits separate pages under `/tests/browser/dist/tests/browser/`. `#lab-metrics` exposes request counts, and certificate metrics also expose issued count and PDF dependency loading. Use a disposable browser profile for fixtures: existing application preference/recovery storage is still used. Certificate fixture IDs are 900001/900002.

## Observed browser results

Local Chromium-based in-app browser; viewport dimensions alone do not emulate a physical touch device.

| Check                                 | Observed result                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Widths 360, 390, 430, 768, 1024, 1440 | Members, clubs and dashboard fit without document horizontal overflow; desktop tables remain. Layout changes did not add data requests.                                                                                                    |
| Active member/club filters            | Values and applied queries retained through all six widths; drawer Apply/Reset and counts work.                                                                                                                                            |
| Native selection/pagination/sorting   | IDs 1 and 6 selected across pages; cards/table/desktop/mobile switches retained selection and page without extra onChange calls. Card sorting retained selection and used the existing sort callback.                                      |
| Navigation                            | Open mobile drawer, navigate, close and restore trigger focus. Previously collapsed desktop sidebar remains collapsed after returning to desktop.                                                                                          |
| Open question dialog                  | Label, text→select type and option value retained through all six widths with one GET. Saved the question, duplicated/reordered it and saved the form.                                                                                     |
| Participant column ordering           | Moved Email above Status using buttons, resized with the dialog open, then saved the order.                                                                                                                                                |
| Stacked details                       | Long labels/content fit at 360 px with a single vertical label/value column.                                                                                                                                                               |
| Member/club visual consistency        | Compared side by side at matching 390 and 1440 px widths.                                                                                                                                                                                  |
| 200-element certificate               | Edited text/position, set zoom to 108%, resized across all six widths: one canvas, retained text/zoom/selection/history. Undo and redo still restored geometry correctly.                                                                  |
| Precision input                       | X=321 entered on a phone remained in the document and input after desktop and phone transitions, including an unsaved failure state.                                                                                                       |
| Phone landscape, 640×360              | Side property panel fits; preview fills the available height and keeps its download footer visible. Preview/PDF generation and publish confirmation completed in the fixture. Published output returned to read-only mode.                 |
| Protected lifecycle/save failure      | Published template created a new draft copy. Failed PUT retained local edits and displayed failure/retry controls.                                                                                                                         |
| 1,000-recipient interruption          | First active batch completed 100; no second request started. Return refreshed state without automatic resume. Review excluded the completed 100; nine further batches completed the remaining 900. Exactly ten issuance requests in total. |
| Touch controls                        | Measured 44 px buttons, cards/table labels, and compact pagination controls. Canvas gesture behavior has unit coverage; physical multi-touch is pending.                                                                                   |

## Release acceptance still required

Do not announce full mobile support or deploy this as a completed mobile release until this matrix is signed off against a reachable HTTPS test environment using the established deployment process.

- Physical iPhone Safari (current and previous major) and current Android Chrome, both orientations, including coarse-pointer landscape above 768 px.
- Actual two-finger gestures, second-touch cancellation during drag/resize, input keyboard opening, safe-area insets, focus restoration, VoiceOver/TalkBack, keyboard navigation and 200% browser zoom.
- Login/OAuth/session refresh and expiry against the test backend; actual file selection, S3 uploads, PDF opening/downloading/sharing and app switching. Fixture export success does not establish iOS download behavior.
- Complete permitted-action matrix for every module and role: creation/editing, bulk actions, file operations, all club tabs, reference data, access reviews, admin user forms, repeatable rows, custom form section/question operations and all certificate element/lifecycle operations.
- Live failed saves, version conflicts, interrupted reviews, page discard/reopen, back/forward cache restoration and uncertain non-certificate mutation outcomes. Review completed server operations before retrying.
- Desktop regression and certificate output comparison with real fonts/assets, plus 200-element and 1,000-recipient tests on physical devices. No live production mutations were used for this validation.

Full physical-device and workflow acceptance was not performed in this environment. The local evidence above is representative coverage, not a claim that the entire release matrix passed.
