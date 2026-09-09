# Certificate workflow validation

Implemented 9 September 2026 across the admin/public frontends and backends. No schema changes, dependency additions, framework upgrades, notification delivery, or production data changes.

## Behavior

- Activity workspace at `/activity/:id/certificates`: choose a published template, choose all eligible participants or persistent explicit selections, review a real participant sample, then issue.
- All-eligible selection covers the activity independently of filters and pagination. Only `LULUS KEGIATAN` registrations without a previous certificate qualify. Revoked certificates are excluded.
- Reviews freeze registration IDs and template ID/version. Sequential requests issue at most 100 registrations. Stop waits for the active batch; retry recalculates eligibility for unsuccessful IDs. Reopening recalculates remaining eligible recipients from the server.
- Published and archived designs open read-only. `Edit salinan` copies managed assets into a new draft namespace. Publishing the copy leaves activity assignments and issued snapshots unchanged.
- Owner downloads independently reauthorize the snapshot. Other visitors can view/share/verify. Export uses the same artwork renderer, waits for assets/fonts, preserves wrapping and layers, and produces a raster PDF at up to 2×, capped at eight megapixels.

## API additions

All routes remain under `/v2` with existing JWT/permission middleware:

| Route | Behavior |
| --- | --- |
| `GET /certificates/activities/:activityId/recipients` | Lightweight paginated rows, activity-wide counts and assigned-template readiness. Search and state filters affect rows, not aggregate counts. |
| `POST /certificates/prepare-issuance` | Non-mutating review with `activity_id` and optional explicit `registration_ids`; returns frozen IDs, exclusions, template version and sample. |
| `POST /certificates/issue-bulk` | Optional `expected: { activity_id, template_id, template_version }` and `response_mode: "compact"`; preserves the full legacy response by default. |
| `POST /certificate-templates/:id/duplicate` | Copies assets, rewrites references, returns draft; rolls back incomplete copies. |
| `GET /certificate-templates?view=summary` | Summary representation for pickers. |
| Public backend `GET /certificates/code/:code/access` | Authenticated ownership/revocation summary without snapshots. |

Assignment uses the existing activity update endpoint with **only** top-level `certificate_template_id`. Explicit `null` clears both supported representations.

## Automated evidence

All 190 tests passed: admin frontend 75, public frontend 48, admin backend 49, public backend 18. Certificate-focused coverage totals 109 tests (59 existing, 50 additional).

Coverage includes 0/1/100/101/1,000 recipients, sequential bounded batches, stop and uncertain-request retry, partial failures, context changes, cross-page IDs, exclusions, duplicate submissions, copied assets, incomplete-copy cleanup, published edit rejection, assignment clearing/permissions, immutable snapshots, compact/legacy responses, owner/non-owner/revoked access, expired sessions, unavailable/rate-limited access reads and verification URL validation. Duplicate legacy profiles do not multiply recipient rows/counts.

Backend integration tests are opt-in with `CERTIFICATE_INTEGRATION=1` and require an explicit localhost `DB_HOST`. Validation used disposable in-memory PGlite, the existing admin Ace migrations, and fake local Drive storage. No remote database or object storage was mutated. PGlite does not establish production PostgreSQL multi-connection locking behavior; existing transactional row locks and unique constraints remain in place.

Commands:

```sh
# Frontends
npm test
npm run lint
# admin frontend: also npx tsc --noEmit
# public frontend: also npm run typecheck
npm run build

# Backends (with disposable localhost DB environment overrides)
CERTIFICATE_INTEGRATION=1 node ace test unit
npm run lint
npm run typecheck
```

## Browser and PDF evidence

The admin fixture at `tests/browser/certificate.html` replaces the Axios adapter entirely and blocks unhandled requests. It does not connect to real participant data. Build it with `npx vite build --config tests/browser/vite.config.ts`; the built fixture can be opened through the running Vite server at `/tests/browser/dist/tests/browser/certificate.html`.

Open `/tests/browser/comparison.html` after building the fixture to compare the template library and activity workspace side by side at matching 390 px and 1440 px widths. The mobile library keeps template names readable inside a horizontally scrollable table.

| Fixture/check | Observed result |
| --- | --- |
| 1,000 recipients, workspace initial load | Three requests: recipient page, template summaries, selected template. No issued-page crawl. PDF dependencies unloaded. |
| Select one recipient on pages 1 and 2 | Two selections retained, reviewed and issued with named results. |
| Workspace input/selection/review | Observed event durations at most 80 ms in the local lab. |
| Production 200-element editor | Initial selection improved from 440 ms to 160 ms; text/format changes 48–152 ms; undo 104 ms. PDF dependencies unloaded until export. |
| Public owner / non-owner / signed-out / revoked | Primary download only for active owner; login guidance for signed-out visitors; sharing/verification retained; no download for revoked certificates. |
| Mobile layout | 390 px public viewport has 390 px document width; long identity/name and actions fit. Admin review is a single column. Desktop reviewed at 1440 px. |
| A4 landscape export | One 841.89 × 595.28 pt page containing a 1600 × 1132 image. |
| A4 portrait export | One 595.28 × 841.89 pt page containing a 1132 × 1600 image. |
| Long names, Georgia/sans-serif, Arabic/Japanese/accented text, opacity/rotation, background | Visually checked in browser and exported raster/PDF. |
| Exported QR | Decoded to `http://localhost:3000/certificate/verify/CERT-LAB-2026`. |
| Missing image | Export stopped and displayed a retryable error. |

The public fixture component is retained in the public frontend's `tests/browser/CertificateLab.tsx`; its temporary application route was removed before the production build. Fixtures are outside production route entry points.

These timings are local unthrottled lab observations, not field INP measurements. Full physical-device/browser coverage, 200% browser zoom, production storage CORS/font availability, and a production-native concurrent issuance stress test remain release checks. Letter/custom dimensions and the pixel cap have unit coverage; A4 portrait/landscape were exported in-browser.

## Rollout

Deploy the additive backend routes before the updated frontends. Coordinate published-template edit restrictions with the admin UI release: older editors receive `CERTIFICATE_TEMPLATE_USE_DRAFT_COPY` for protected changes. No automatic reassignment occurs when a copied design is published.

Backend batch logs include elapsed time, created/already-issued/skipped/failed counts and context conflicts. Export failures log duration and error type only. No participant payloads are logged. Check these events during rollout. Batches remain page-bound; closing the page requires reopening and reviewing remaining eligible recipients.
