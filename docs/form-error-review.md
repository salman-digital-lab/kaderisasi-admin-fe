# Custom form error-message review

Reviewed and updated 16 September 2026. Scope: form configuration, question and routing validation, preview, identity controls, loading, saving, deletion, response/export/download feedback, and sharing in the admin custom-form workflow.

Design read: corrective feedback for BMKA form administrators, retaining the existing Indonesian interface, typography, spacing, and semantic colors. ENERGY 1 / RHYTHM 1 / MOTION 1.

## Findings and changes

| Area | Finding | Result |
| --- | --- | --- |
| Question validation | Full question titles and correction text formed one long sentence. | Structured issues carry a question key separately from the message. The panel groups corrections under the question number and a separate neutral-colored title. |
| Finding the question | The summary gave no direct editing action. | Each question group has a keyboard-accessible Perbaiki pertanyaan button that opens and focuses the question editor. |
| Missing choices | Radio/select could report the same problem twice. Missing choices and blank choice labels had indistinguishable wording. | One message for missing choices: Tambahkan minimal satu pilihan jawaban. Blank choices instead ask the admin to fill their text or remove them. |
| Upload settings | One combined error listed type, count, and size regardless of the invalid setting. | Separate instructions identify the type selector, count range of 1–5, or size range of 1–10 MB. |
| Validation rules | Generic invalid-bound and invalid-pattern messages gave little guidance. | Messages explain numeric versus character bounds, reversed minimum/maximum, and fixing or removing malformed regex. |
| Routing | Broken settings, unavailable destinations, duplicate rules, and internal IDs were difficult to interpret. | Messages identify the relevant routing controls and give a repair or escalation action. Question-key problems carry question context. Routing behavior is unchanged. |
| Preview | Inline validation repeated long question titles that were already immediately above the input. | Short, local instructions replace repeated titles; input errors have explicit accessible descriptions. Custom validation messages remain intact. |
| Preview upload | A generic file error did not identify accepted formats. | Feedback names PDF, supported images, or both, and the configured per-file size. |
| Basic settings | Mixed terminology and exclamation marks. | Consistent Indonesian instructions for form name, question title, choice text, answer type, and activity selection. |
| Activity loading | Request failure was only logged to the console. | Visible error with retry; existing form input is retained. |
| Save failure | A generic toast duplicated the persistent actionable error panel. | One persistent message remains, with a section-level summary for local validation. |
| Identity controls | Restrictions did not explain their cause. | Messages explain mandatory registration identity fields and province/city dependencies. |
| Response/export/download | Fallbacks could describe saving even when loading or downloading failed. | Context-specific fallback messages and translations for missing responses, unavailable storage, and missing export-origin configuration. |
| Delete | Generic failure hid the server's response/attachment protection reason. | Uses the existing error-code translator, with distinct response and attachment retention explanations. |
| Sharing | Invalid destination configuration looked like a temporary generic failure. | Explains allowed protocols and the existing distinct-hostname requirement; retry copy mentions connection and access. |
| Existing recovery and empty states | Already identify the condition and provide a next step. | Retained draft recovery, closed-form, missing-public-address, response loading retry, and empty-response guidance. |

## Visual decisions

- Neutral question titles keep the respondent's wording distinct from the correction.
- Dark red instructions identify the error without making the entire question read like an error message.
- One group per question avoids repeating long titles when several rules need repair.
- Existing buttons provide real keyboard navigation to the affected editor; no new icon system or decorative surfaces.
- The existing alert container, spacing, typography, and BMKA accent preserve the surrounding visual system.

## Verification

- `npm run lint`, `npm test`, and `npm run build`: passed; 160 unit tests. The existing vendor bundle-size advisory remains.
- `node tests/ui/form-errors.mjs`: passed at 1280px, 1440px, and 390px. Checks long titles, multiple errors grouped by question, deduplicated missing-choice messages, blank-choice feedback, error removal after repair, keyboard focus transfer, blocked invalid saves, no horizontal overflow, and no browser errors. All requests are intercepted; no responses or form changes are persisted.
- `npm run test:form-builder-ui`: passed at 1440px and 390px. Covers the existing large-form editor, routing, interactive preview, failed saves, and draft recovery.
- Screenshots: `../../kaderisasi-admin-be-go/.artifacts/form-errors/question-errors-1280.png`, `question-errors-1440.png`, and `question-errors-390.png`. Desktop screenshots were visually reviewed.
- Existing real-backend browser assertions were updated for the new wording and error IDs. Database behavior and migrations are unchanged by this follow-up.

## Antislop delivery gate

The full item-by-item gate in [custom forms delivery](custom-forms-delivery.md#antislop-delivery-gate) remains applicable. Rechecked changes in this follow-up:

- R-02 PASS: concise Indonesian instructions, without decorative punctuation.
- R-03 PASS: overflow and long-content checks pass at all three captured widths.
- R-25 PASS: question text uses #595959 and correction text #a8071a on the existing pale alert surface.
- R-26 PASS: repair and retry controls have real handlers; keyboard repair was exercised.
- R-27 PASS: missing choices, blank labels, invalid bounds/patterns, load failures, and save failures have visible next steps.
- R-32 PASS: Enter opens and focuses the affected editor; preview inputs reference their error descriptions.
- R-35 PASS: lint, unit tests, production build, and browser checks passed.
- R-31 PASS: hierarchy, color, grouping, spacing, and controls have written purposes above.
- Dials PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 retained, without added motion.
- C-1 PASS: hierarchy serves question identification and correction.
- C-2 PASS: repair controls perform navigation and editing.
- C-3 PASS: groups reflect actual affected questions and their errors.
- C-4 PASS: long titles, multiple simultaneous errors, keyboard use, and narrow-screen wrapping were exercised.
- C-5 PASS: results refer to recorded tests and synthetic fixtures; no fabricated product claims.
