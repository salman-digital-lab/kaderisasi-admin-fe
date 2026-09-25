import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { PublishedScoringResult } from "../../../types/services/scoring";
import type { CertificateApproval } from "../../../types/services/certificateTemplate";

type Participant = {
  name: string;
  university?: string | null;
  certificate_group?: string | null;
  activity_name: string;
  scoring_result?: PublishedScoringResult;
};

const number = (value: number | null | undefined): string =>
  value == null
    ? "-"
    : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });

const cell = {
  border: "1px solid #222",
  padding: "9px 7px",
  verticalAlign: "middle" as const,
};

export function salmanScoreOverflow(page: HTMLElement): string[] {
  const body = page.querySelector<HTMLElement>("[data-salman-score-body]");
  if (!body) return [];
  return body.scrollHeight > body.clientHeight + 1
    ? ["Daftar nilai atau catatan melebihi halaman kedua"]
    : [];
}

export const SalmanScoreSheet = forwardRef<
  HTMLDivElement,
  {
    participant: Participant;
    certificateCode?: string;
    approval?: CertificateApproval;
    signerName?: string;
    signerTitle?: string;
    revoked?: boolean;
  }
>(function SalmanScoreSheet(
  { participant, certificateCode, approval, signerName, signerTitle, revoked },
  ref,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body && !compact && body.scrollHeight > body.clientHeight + 1) {
      setCompact(true);
    }
  }, [compact, participant]);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const update = (): void => setScale(Math.min(1, node.clientWidth / 794));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const score = participant.scoring_result;
  if (!score) return null;
  const compactCell = { ...cell, padding: compact ? "6px 5px" : cell.padding };
  const byCriterion = new Map(
    score.result.criteria.map((row) => [row.criterion_id, row]),
  );
  const hasGrades = score.rubric.grades.length > 0;
  const description = score.rubric.groups
    .flatMap((group) =>
      group.criteria.map((criterion) => {
        const result = byCriterion.get(criterion.id);
        const value =
          result?.grade ||
          (result?.normalized == null ? null : number(result.normalized));
        return value ? `${criterion.name}: ${value}` : null;
      }),
    )
    .filter(Boolean)
    .join(" | ");
  const notes = [score.note, score.rubric.note].filter(Boolean);
  const approvalDate = approval
    ? new Date(approval.approved_at).toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Menunggu persetujuan";
  return (
    <section
      aria-label="Halaman 2: Daftar Nilai"
      style={{ width: "100%", marginTop: 24 }}
    >
      <div
        ref={viewport}
        style={{
          width: "100%",
          maxWidth: 794,
          aspectRatio: "794 / 1123",
          marginInline: "auto",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          ref={ref}
          data-certificate-score-sheet
          style={{
            width: 794,
            height: 1123,
            boxSizing: "border-box",
            padding: "62px 70px",
            background: "#fff",
            color: "#111",
            fontFamily: "Arial, sans-serif",
            fontSize: compact ? 13.34 : 16,
            position: "absolute",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div
            ref={bodyRef}
            data-salman-score-body
            style={{ height: 995, overflow: "hidden" }}
          >
            <h2
              style={{ margin: "0 0 6px", textAlign: "center", fontSize: 25 }}
            >
              Daftar Nilai
            </h2>
            <h3
              style={{ margin: "0 0 42px", textAlign: "center", fontSize: 21 }}
            >
              {participant.activity_name}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "145px 1fr",
                gap: "5px 9px",
                marginBottom: 22,
              }}
            >
              <span>Nama Peserta</span>
              <span>: {participant.name}</span>
              {participant.university && (
                <>
                  <span>Universitas</span>
                  <span>: {participant.university}</span>
                </>
              )}
              {participant.certificate_group && (
                <>
                  <span>Kelompok</span>
                  <span>: {participant.certificate_group}</span>
                </>
              )}
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                textAlign: "center",
                fontSize: compact ? 13.34 : 15,
              }}
            >
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...compactCell, width: 40 }}>
                    No
                  </th>
                  <th rowSpan={2} style={{ ...compactCell, width: 140 }}>
                    Karakter
                  </th>
                  <th rowSpan={2} style={compactCell}>
                    Aspek
                  </th>
                  <th colSpan={hasGrades ? 2 : 1} style={compactCell}>
                    Prestasi
                  </th>
                </tr>
                <tr>
                  <th style={{ ...compactCell, width: 90 }}>Nilai</th>
                  {hasGrades && (
                    <th style={{ ...compactCell, width: 75 }}>Indeks</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {score.rubric.groups.flatMap((group) =>
                  group.criteria.map((criterion, index) => {
                    const row = byCriterion.get(criterion.id);
                    return (
                      <tr key={criterion.id}>
                        <td style={compactCell}>
                          {score.rubric.groups
                            .slice(0, score.rubric.groups.indexOf(group))
                            .reduce((n, item) => n + item.criteria.length, 0) +
                            index +
                            1}
                        </td>
                        {index === 0 && (
                          <th
                            scope="rowgroup"
                            rowSpan={group.criteria.length}
                            style={compactCell}
                          >
                            {group.name}
                          </th>
                        )}
                        <td style={{ ...compactCell, textAlign: "left" }}>
                          {criterion.name}
                        </td>
                        <td style={compactCell}>{number(row?.normalized)}</td>
                        {hasGrades && (
                          <td style={compactCell}>{row?.grade || "-"}</td>
                        )}
                      </tr>
                    );
                  }),
                )}
                <tr>
                  <th colSpan={3} style={compactCell}>
                    Total
                  </th>
                  <td style={{ ...compactCell, fontWeight: 700 }}>
                    {number(score.result.total)}
                  </td>
                  {hasGrades && (
                    <td style={{ ...compactCell, fontWeight: 700 }}>
                      {score.result.grade || "-"}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
            {score.result.complete && (
              <div style={{ ...cell, textAlign: "center", padding: 15 }}>
                <em>
                  <strong>Keterangan:</strong>
                  <br />
                  {participant.name} meraih{" "}
                  {score.result.grade
                    ? `predikat ${score.result.grade} (${number(score.result.total)})`
                    : `nilai ${number(score.result.total)}`}
                  {description ? ` dengan profil sifat: ${description}` : ""}
                </em>
              </div>
            )}
            {notes.length > 0 && (
              <div style={{ ...cell, textAlign: "center", padding: 18 }}>
                <strong>Catatan:</strong>
                <br />
                {notes.map((note, index) => (
                  <div key={index} style={{ whiteSpace: "pre-wrap" }}>
                    {note}
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: 42 }}>
              <div>{approvalDate}</div>
              <div style={{ marginTop: 12 }}>
                Disetujui secara elektronik oleh
              </div>
              <strong>
                {approval?.signer_name || signerName || "[Nama penandatangan]"}
              </strong>
              <div>{approval?.signer_title || signerTitle || "[Jabatan]"}</div>
            </div>
            <footer
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                marginTop: 32,
              }}
            >
              <span>{certificateCode || "Pratinjau"}</span>
              <span>Halaman 2 dari 2</span>
            </footer>
          </div>
          {revoked && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 72,
                color: "#b4233355",
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
