import type { ReactElement } from "react";
import { Drawer } from "antd";
import type { TalentScore } from "../../api/services/talent-assessment";
import TalentName from "./TalentName";
import {
  getTalentGuide,
  getTalentLabel,
  rankBand,
  REPORT_SOURCE,
  THEME_COMPARISONS,
} from "./theme-guide";

export default function ThemeDetail({
  theme,
  onClose,
}: {
  theme: TalentScore | null;
  onClose: () => void;
}): ReactElement {
  const guide = theme ? getTalentGuide(theme.name) : undefined;
  return (
    <Drawer
      title={
        theme ? (
          <>
            Kenali <TalentName name={theme.name} />
          </>
        ) : (
          "Penjelasan bakat"
        )
      }
      open={Boolean(theme)}
      onClose={onClose}
      size="large"
      className="talent-detail-drawer"
    >
      {theme && guide && (
        <article className="talent-detail">
          <div className="talent-detail-meta">
            <span
              className={`talent-rank-band talent-rank-${rankBand(theme.rank).className}`}
            >
              {rankBand(theme.rank).label}
            </span>
            <span>
              Urutan {theme.rank} · {theme.domain} · {theme.score}/100
            </span>
          </div>
          <p className="talent-term-original">
            Istilah asli: <strong>{theme.name}</strong>
          </p>
          <p className="talent-detail-summary">{guide.summary}</p>
          <h2>Ciri khas tema</h2>
          <p>{guide.characteristics}</p>
          <h2>10 contoh aktivitas</h2>
          <p>
            Gunakan contoh berikut untuk mengenali pengalaman yang sesuai dengan
            diri Anda.
          </p>
          <ul>
            {guide.activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
          <h2>Bila bakat ini kurang menonjol</h2>
          <p>{guide.support}</p>
          {THEME_COMPARISONS.filter((comparison) =>
            comparison.themes.includes(theme.name),
          ).map((comparison) => (
            <section key={comparison.themes.join("-")}>
              <h2>{comparison.themes.map(getTalentLabel).join(" dan ")}</h2>
              <p>{comparison.description}</p>
            </section>
          ))}
          <p className="talent-source-note">
            Referensi: {REPORT_SOURCE.title}.
          </p>
        </article>
      )}
    </Drawer>
  );
}
