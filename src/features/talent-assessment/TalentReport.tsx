import { useState, type ReactElement } from "react";
import { Tabs } from "antd";
import type {
  TalentResult,
  TalentScore,
} from "../../api/services/talent-assessment";
import {
  DOMAIN_GUIDES,
  getTalentGuide,
  rankBand,
  REPORT_SOURCE,
} from "./theme-guide";
import ThemeDetail from "./ThemeDetail";
import "./report.css";

export default function TalentReport({
  result,
  participantName,
}: {
  result: TalentResult;
  participantName: string;
}): ReactElement {
  const [selected, setSelected] = useState<TalentScore | null>(null);
  const top = result.talents.slice(0, 7);
  const lower = result.talents.slice(27);
  const flat = result.talents.every(
    (theme) => theme.score === result.talents[0]?.score,
  );
  const maxCount = Math.max(
    ...result.domains.map((domain) => domain.top_seven_count),
  );
  const prominentDomains = result.domains.filter(
    (domain) => domain.top_seven_count === maxCount,
  );
  const submitted = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(result.submitted_at));
  return (
    <div className="talent-report">
      <header className="talent-report-header">
        <p className="talent-report-kicker">BMKA · Profil Bakat</p>
        <h2>{participantName}</h2>
        <p>Gambaran pola bakat untuk refleksi dan pengembangan diri.</p>
        <div className="talent-report-meta">
          <span>Dikirim {submitted} WIB</span>
          <span>170 pernyataan · 34 tema · 4 kelompok</span>
        </div>
      </header>
      <Tabs
        className="talent-report-tabs"
        defaultActiveKey="overview"
        destroyOnHidden
        tabBarGutter={16}
        aria-label="Bagian laporan bakat"
        items={[
          {
            key: "overview",
            label: "Ringkasan",
            children: (
              <section
                id="talent-overview"
                className="talent-report-section"
                aria-labelledby="talent-overview-title"
              >
                <div className="talent-section-intro">
                  <span className="talent-section-number">01</span>
                  <div>
                    <h2 id="talent-overview-title">7 Bakat Menonjol</h2>
                    <p>
                      Tujuh tema dengan urutan tertinggi dalam jawaban asesmen
                      ini. Pilih tema untuk membaca penjelasannya.
                    </p>
                  </div>
                </div>
                {flat ? (
                  <p className="talent-score-context">
                    Skor seluruh tema sama. Urutan tampilan mengikuti aturan
                    pengurutan; jawaban ini belum menunjukkan tema yang lebih
                    menonjol dari tema lain.
                  </p>
                ) : (
                  top.some((theme) => theme.equal_score) && (
                    <p className="talent-score-context">
                      Beberapa tema memiliki skor sama. Perbedaan urutan di
                      antara tema tersebut mengikuti aturan pengurutan, bukan
                      selisih skor.
                    </p>
                  )
                )}
                <ol className="talent-top-list">
                  {top.map((theme) => (
                    <li key={theme.name}>
                      <button
                        type="button"
                        onClick={() => setSelected(theme)}
                        aria-label={`Kenali ${theme.name}, urutan ${theme.rank}`}
                      >
                        <span className="talent-top-rank">
                          {String(theme.rank).padStart(2, "0")}
                        </span>
                        <span className="talent-top-copy">
                          <strong>{theme.name}</strong>
                          <span>{getTalentGuide(theme.name)?.summary}</span>
                          <small>
                            {theme.domain}
                            {theme.equal_score ? " · Skor sama" : ""}
                          </small>
                        </span>
                        <span className="talent-top-score">
                          {theme.score}
                          <small>/100</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="talent-reading-summary">
                  <h3>Membaca pola hasil</h3>
                  <p>
                    {flat
                      ? "Mulai dari tema yang paling sesuai dengan pengalaman sehari-hari, lalu bicarakan contohnya dengan pendamping atau rekan Anda."
                      : `${prominentDomains.map((domain) => domain.name).join(" dan ")} ${prominentDomains.length > 1 ? "memiliki jumlah tema menonjol yang sama" : "memuat tema menonjol terbanyak"}: ${maxCount} dari tujuh tema pada tiap kelompok tersebut. Gunakan sebaran ini untuk membahas bentuk kontribusi yang terasa alami bagi Anda.`}
                  </p>
                  <p>
                    Menurut referensi, bakat yang kuat berkaitan dengan
                    aktivitas yang disukai dan dinikmati. Cocokkan deskripsi
                    dengan pengalaman nyata, bukan hanya nama atau urutannya.
                  </p>
                </div>
              </section>
            ),
          },
          {
            key: "map",
            label: "Peta Bakat",
            children: (
              <section
                id="talent-map"
                className="talent-report-section"
                aria-labelledby="talent-map-title"
              >
                <div className="talent-section-intro">
                  <span className="talent-section-number">02</span>
                  <div>
                    <h2 id="talent-map-title">Peta 34 Bakat</h2>
                    <p>
                      Empat kelompok, empat cara berkontribusi. Nomor
                      menunjukkan urutan tema dalam hasil Anda.
                    </p>
                  </div>
                </div>
                <div
                  className="talent-map-legend"
                  aria-label="Arti penanda urutan"
                >
                  <span className="talent-rank-band talent-rank-top">
                    1–7 · Menonjol
                  </span>
                  <span className="talent-rank-band talent-rank-support">
                    8–27 · Pendukung
                  </span>
                  <span className="talent-rank-band talent-rank-lower">
                    28–34 · Kurang menonjol
                  </span>
                </div>
                <div className="talent-map">
                  {DOMAIN_GUIDES.map((guide) => {
                    const domain = result.domains.find(
                      (item) => item.name === guide.name,
                    );
                    return (
                      <article key={guide.name} className="talent-domain-map">
                        <header>
                          <div>
                            <h3>{guide.name}</h3>
                            <span>{guide.referenceName}</span>
                          </div>
                          <strong>
                            {domain?.top_seven_count ?? 0}
                            <small> dari 7 teratas</small>
                          </strong>
                        </header>
                        <p>{guide.focus}</p>
                        <div
                          className="talent-domain-meter"
                          role="img"
                          aria-label={`Rata-rata skor ${guide.name}: ${domain?.score.toLocaleString("id-ID", { maximumFractionDigits: 1 }) ?? 0} dari 100`}
                        >
                          <span style={{ width: `${domain?.score ?? 0}%` }} />
                        </div>
                        <p className="talent-domain-average">
                          Rata-rata skor{" "}
                          <strong>
                            {domain?.score.toLocaleString("id-ID", {
                              maximumFractionDigits: 1,
                            }) ?? 0}
                            /100
                          </strong>
                        </p>
                        <ul>
                          {result.talents
                            .filter((theme) => theme.domain === guide.name)
                            .map((theme) => (
                              <li key={theme.name}>
                                <button
                                  type="button"
                                  className={`talent-map-theme talent-map-${rankBand(theme.rank).className}`}
                                  onClick={() => setSelected(theme)}
                                  aria-label={`Penjelasan ${theme.name}, urutan ${theme.rank}, ${rankBand(theme.rank).label}`}
                                >
                                  <span>{theme.rank}</span>
                                  <strong>{theme.name}</strong>
                                  <small>{theme.score}/100</small>
                                </button>
                              </li>
                            ))}
                        </ul>
                      </article>
                    );
                  })}
                </div>
              </section>
            ),
          },
          {
            key: "development",
            label: "Pengembangan",
            children: (
              <section
                id="talent-development"
                className="talent-report-section"
                aria-labelledby="talent-development-title"
              >
                <div className="talent-section-intro">
                  <span className="talent-section-number">03</span>
                  <div>
                    <h2 id="talent-development-title">
                      Dari Bakat ke Aktivitas
                    </h2>
                    <p>
                      Contoh aktivitas dari referensi untuk dibahas dan dicoba
                      sesuai kebutuhan Anda.
                    </p>
                  </div>
                </div>
                <div className="talent-activity-list">
                  {top.map((theme) => (
                    <article key={theme.name}>
                      <h3>
                        <span>{String(theme.rank).padStart(2, "0")}</span>
                        {theme.name}
                      </h3>
                      <ul>
                        {getTalentGuide(theme.name)
                          ?.activities.slice(0, 3)
                          .map((activity) => (
                            <li key={activity}>{activity}</li>
                          ))}
                      </ul>
                      <button
                        type="button"
                        className="talent-text-action"
                        onClick={() => setSelected(theme)}
                      >
                        Lihat 10 contoh {theme.name}
                      </button>
                    </article>
                  ))}
                </div>
                <div className="talent-support-section">
                  <h3>Menyikapi Bakat yang Kurang Menonjol</h3>
                  <p>
                    Urutan rendah tidak berarti tidak mampu. Referensi
                    menyarankan tiga cara: berlatih saat dibutuhkan, memakai
                    sistem atau aturan yang membantu, dan bekerja sama dengan
                    orang yang kuat pada tema tersebut.
                  </p>
                  <p>
                    {flat
                      ? "Semua skor dalam hasil ini sama; tema berikut berada di urutan terakhir karena aturan pengurutan."
                      : "Berikut tema pada urutan 28–34, beserta pendekatan yang dapat membantu."}
                  </p>
                  <div className="talent-support-list">
                    {lower.map((theme) => (
                      <article key={theme.name}>
                        <button
                          type="button"
                          className="talent-text-action"
                          onClick={() => setSelected(theme)}
                        >
                          {theme.rank}. {theme.name}
                        </button>
                        <p>{getTalentGuide(theme.name)?.support}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ),
          },
          {
            key: "ranking",
            label: "Semua Skor",
            children: (
              <section
                id="talent-ranking"
                className="talent-report-section"
                aria-labelledby="talent-ranking-title"
              >
                <div className="talent-section-intro">
                  <span className="talent-section-number">04</span>
                  <div>
                    <h2 id="talent-ranking-title">Urutan 34 Bakat</h2>
                    <p>
                      Skor kuesioner 0–100, bukan persentil atau perbandingan
                      dengan orang lain.
                    </p>
                  </div>
                </div>
                <ol className="talent-score-list">
                  {result.talents.map((theme) => (
                    <li key={theme.name}>
                      <div>
                        <button
                          type="button"
                          className="talent-text-action"
                          onClick={() => setSelected(theme)}
                        >
                          {theme.rank}. {theme.name}
                        </button>
                        <span className="talent-ranking-meta">
                          {theme.domain} · {rankBand(theme.rank).label}
                          {theme.equal_score ? " · Skor sama" : ""}
                        </span>
                      </div>
                      <strong>{theme.score}/100</strong>
                    </li>
                  ))}
                </ol>
                <details className="talent-method">
                  <summary>Cara membaca skor dan urutan</summary>
                  <p>
                    Lima jawaban pada setiap tema dijumlahkan, lalu dihitung
                    dengan rumus (total − 5) ÷ 25 × 100. Urutan 1–7 adalah tema
                    menonjol, 8–27 pendukung, dan 28–34 kurang menonjol dalam
                    jawaban ini.
                  </p>
                  <p>
                    Skor sama diurutkan berdasarkan jumlah jawaban 6, kemudian
                    5, lalu urutan bakat dalam kunci. Rata-rata kelompok berasal
                    dari skor tema di dalamnya. Skor rendah bukan batas
                    kemampuan atau alasan mengabaikan tanggung jawab.
                  </p>
                </details>
              </section>
            ),
          },
        ]}
      />
      <footer className="talent-report-footer">
        <strong>Sumber penjelasan</strong>
        <p>
          {REPORT_SOURCE.title}. Deskripsi tema, contoh aktivitas, dan
          pendekatan pengembangan mengikuti dokumen referensi organisasi.
        </p>
      </footer>
      <ThemeDetail theme={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
