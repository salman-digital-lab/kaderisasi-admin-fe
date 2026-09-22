import { forwardRef, useEffect, useRef, useState } from "react";
import type { PublishedScoringResult } from "../../../types/services/scoring";

type ScoreSheetParticipant = {
  name: string;
  activity_name: string;
  activity_date: string;
  scoring_result?: PublishedScoringResult;
};

export const SCORE_SHEET_WIDTH = 794;
export const SCORE_SHEET_HEIGHT = 1123;

const number = (value: number | null | undefined): string =>
  value == null
    ? "Tidak tersedia"
    : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export function fitScoreSheet(source: HTMLElement): void {
  const area = source.querySelector<HTMLElement>("[data-score-sheet-area]");
  const body = source.querySelector<HTMLElement>("[data-score-sheet-body]");
  if (!area || !body) return;
  area.style.height = `${Math.max(1, source.clientHeight - area.offsetTop - 80)}px`;
  body.style.width = "100%";
  let scale = 1;
  if (body.scrollHeight > area.clientHeight) {
    let lower = 0;
    let upper = 1;
    // Keep the table across the full page while fitting long rubrics vertically.
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = (lower + upper) / 2;
      body.style.width = `${100 / candidate}%`;
      if (body.scrollHeight * candidate <= area.clientHeight) lower = candidate;
      else upper = candidate;
    }
    scale = lower || upper;
    body.style.width = `${100 / scale}%`;
  }
  body.style.transform = `scale(${scale})`;
  body.style.transformOrigin = "top left";
}

export const CertificateScoreSheet = forwardRef<
  HTMLDivElement,
  {
    participant: ScoreSheetParticipant;
    certificateCode?: string;
    revoked?: boolean;
  }
>(function CertificateScoreSheet(
  { participant, certificateCode, revoked },
  ref,
): React.ReactElement | null {
  const viewport = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const score = participant.scoring_result;
  useEffect(() => {
    const container = viewport.current;
    const sheet = page.current;
    if (!container || !sheet) return;
    const update = (): void => {
      setScale(Math.min(1, container.clientWidth / SCORE_SHEET_WIDTH));
      fitScoreSheet(sheet);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    const body = sheet.querySelector("[data-score-sheet-body]");
    if (body) observer.observe(body);
    void document.fonts.ready.then(update);
    return () => observer.disconnect();
  }, [participant]);
  if (!score) return null;
  const results = new Map(
    score.result.criteria.map((result) => [result.criterion_id, result]),
  );
  const rows = score.rubric.groups.flatMap((group) =>
    group.criteria.map((criterion) => ({ group: group.name, criterion })),
  );
  const columns =
    rows.length > 24
      ? [
          rows.slice(0, Math.ceil(rows.length / 2)),
          rows.slice(Math.ceil(rows.length / 2)),
        ]
      : [rows];
  const cell = {
    padding: columns.length > 1 ? "2px 6px" : "7px 6px",
    borderBottom: "1px solid #d1d5db",
    verticalAlign: "top",
  } as const;
  return (
    <section
      aria-label="Halaman 2: Hasil penilaian"
      style={{ width: "100%", marginTop: 24 }}
    >
      <div
        ref={viewport}
        style={{
          width: "100%",
          maxWidth: SCORE_SHEET_WIDTH,
          aspectRatio: `${SCORE_SHEET_WIDTH} / ${SCORE_SHEET_HEIGHT}`,
          marginInline: "auto",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          ref={(node) => {
            page.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          data-certificate-score-sheet
          style={{
            width: SCORE_SHEET_WIDTH,
            height: SCORE_SHEET_HEIGHT,
            boxSizing: "border-box",
            padding: 44,
            background: "#fff",
            color: "#1f2937",
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            lineHeight: 1.4,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              borderBottom: "2px solid #0f766e",
              paddingBottom: 18,
              marginBottom: 22,
            }}
          >
            <h2
              style={{
                margin: "0 0 12px",
                fontFamily: "Georgia, serif",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#0f766e",
              }}
            >
              Hasil penilaian
            </h2>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {participant.name}
            </div>
            <div
              style={{ marginTop: 6, fontSize: 15, overflowWrap: "anywhere" }}
            >
              {participant.activity_name} · {participant.activity_date}
            </div>
          </header>
          <div data-score-sheet-area style={{ height: 820 }}>
            <div data-score-sheet-body style={{ overflowWrap: "anywhere" }}>
              <div
                style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
              >
                {columns.map((column, columnIndex) => (
                  <table
                    key={columnIndex}
                    style={{
                      width: `${100 / columns.length}%`,
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                      fontSize: 14,
                      lineHeight: 1.4,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                        <th scope="col" style={{ ...cell, width: "42%" }}>
                          Aspek penilaian
                        </th>
                        <th scope="col" style={cell}>
                          Nilai / maks.
                        </th>
                        <th scope="col" style={cell}>
                          Bobot
                        </th>
                        <th scope="col" style={cell}>
                          Skala 100
                        </th>
                        {score.rubric.grades.length > 0 && (
                          <th scope="col" style={cell}>
                            Indeks
                          </th>
                        )}
                      </tr>
                    </thead>
                    {column.map(({ group, criterion }, index) => {
                      const result = results.get(criterion.id);
                      return (
                        <tbody key={criterion.id}>
                          {(index === 0 ||
                            column[index - 1]?.group !== group) && (
                            <tr>
                              <th
                                colSpan={score.rubric.grades.length > 0 ? 5 : 4}
                                scope="rowgroup"
                                style={{
                                  ...cell,
                                  textAlign: "left",
                                  paddingTop: columns.length > 1 ? 6 : 14,
                                  color: "#0f766e",
                                }}
                              >
                                {group}
                              </th>
                            </tr>
                          )}
                          <tr>
                            <th
                              scope="row"
                              style={{
                                ...cell,
                                textAlign: "left",
                                fontWeight: 400,
                              }}
                            >
                              {criterion.name}
                            </th>
                            <td style={cell}>
                              {number(result?.score)} /{" "}
                              {number(criterion.maximum)}
                            </td>
                            <td style={cell}>{number(criterion.weight)}</td>
                            <td style={cell}>{number(result?.normalized)}</td>
                            {score.rubric.grades.length > 0 && (
                              <td style={cell}>
                                {result?.grade ?? "Tidak ada"}
                              </td>
                            )}
                          </tr>
                        </tbody>
                      );
                    })}
                  </table>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "18px 0",
                  marginTop: 12,
                  borderBottom: "2px solid #0f766e",
                  fontSize: 17,
                  fontWeight: 700,
                }}
              >
                <span>Nilai akhir (rata-rata berbobot)</span>
                <span>
                  {number(score.result.total)} / 100
                  {score.result.grade ? ` · ${score.result.grade}` : ""}
                </span>
              </div>
              {[
                { label: "Catatan peserta", value: score.note },
                { label: "Catatan kegiatan", value: score.rubric.note },
              ]
                .filter((note) => note.value)
                .map((note) => (
                  <div
                    key={note.label}
                    style={{ marginTop: 18, fontSize: 13, lineHeight: 1.5 }}
                  >
                    <strong>{note.label}</strong>
                    <div style={{ whiteSpace: "pre-wrap" }}>{note.value}</div>
                  </div>
                ))}
              <p style={{ marginTop: 22, fontSize: 11, color: "#4b5563" }}>
                Nilai yang dipublikasikan pada{" "}
                {new Date(score.published_at).toLocaleDateString("id-ID", {
                  timeZone: "Asia/Jakarta",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · Revisi {score.revision}
              </p>
            </div>
          </div>
          <footer
            style={{
              position: "absolute",
              bottom: 30,
              left: 44,
              right: 44,
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              fontSize: 10,
              color: "#4b5563",
              overflowWrap: "anywhere",
            }}
          >
            <span>{certificateCode || "Pratinjau nilai peserta"}</span>
            <span style={{ whiteSpace: "nowrap" }}>Halaman 2 dari 2</span>
          </footer>
          {revoked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#b42333",
                fontSize: 64,
                fontWeight: 700,
                opacity: 0.3,
                pointerEvents: "none",
                transform: "rotate(-25deg)",
              }}
            >
              DICABUT
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
