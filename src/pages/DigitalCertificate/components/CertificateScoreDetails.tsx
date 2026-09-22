import { Card, Typography } from "antd";
import type { ReactElement } from "react";
import type { PublishedScoringResult } from "../../../types/services/scoring";
import styles from "./certificate-preview.module.css";

const number = (value: number | null | undefined): string =>
  value == null
    ? "Tidak tersedia"
    : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export function CertificateScoreDetails({
  score,
}: {
  score: PublishedScoringResult;
}): ReactElement {
  const results = new Map(
    score.result.criteria.map((criterion) => [
      criterion.criterion_id,
      criterion,
    ]),
  );
  const hasGrades = score.rubric.grades.length > 0;
  return (
    <Card className={styles.scoreDetails} data-certificate-score-details>
      <Typography.Title level={2} style={{ fontSize: 20, marginTop: 0 }}>
        Hasil penilaian
      </Typography.Title>
      <Typography.Paragraph>
        Nilai terbit{" "}
        {new Date(score.published_at).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Typography.Paragraph>
      <div className={styles.total}>
        <div>
          <Typography.Text strong>Nilai akhir</Typography.Text>
          <div>Rata-rata berbobot · skala 0–100</div>
        </div>
        <Typography.Text strong style={{ fontSize: 24 }}>
          {number(score.result.total)} / 100
          {score.result.grade ? ` · ${score.result.grade}` : ""}
        </Typography.Text>
      </div>
      {score.rubric.groups.map((group) => (
        <section key={group.id} aria-label={group.name}>
          <Typography.Title level={3} style={{ fontSize: 18, marginTop: 24 }}>
            {group.name}
          </Typography.Title>
          <ul className={styles.criteria}>
            {group.criteria.map((criterion) => {
              const result = results.get(criterion.id);
              return (
                <li key={criterion.id} className={styles.criterion}>
                  <Typography.Text strong>{criterion.name}</Typography.Text>
                  <dl className={styles.metrics}>
                    <div>
                      <dt>Nilai / maks.</dt>
                      <dd>
                        {number(result?.score)} / {number(criterion.maximum)}
                      </dd>
                    </div>
                    <div>
                      <dt>Skala 100</dt>
                      <dd>{number(result?.normalized)}</dd>
                    </div>
                    <div>
                      <dt>Bobot</dt>
                      <dd>{number(criterion.weight)}</dd>
                    </div>
                    {hasGrades && (
                      <div>
                        <dt>Indeks</dt>
                        <dd>{result?.grade ?? "Tidak ada"}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {[
        ["Catatan peserta", score.note],
        ["Catatan kegiatan", score.rubric.note],
      ].map(([label, note]) =>
        note ? (
          <section key={label}>
            <Typography.Title level={3} style={{ fontSize: 18 }}>
              {label}
            </Typography.Title>
            <Typography.Paragraph className={styles.note}>
              {note}
            </Typography.Paragraph>
          </section>
        ) : null,
      )}
    </Card>
  );
}
