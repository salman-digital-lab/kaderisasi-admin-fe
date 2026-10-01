import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Card, Progress, Space, Spin, Typography } from "antd";
import { isAxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getTalentResult,
  getTalentState,
  type TalentResult,
} from "../../api/services/talent-assessment";
import { useIsSuperAdmin } from "../../stores/authStore";
import "./assessment.css";

export default function TalentResults(): ReactElement {
  const { adminID } = useParams<{ adminID: string }>();
  const isSuperAdmin = useIsSuperAdmin();
  const navigate = useNavigate();
  const [result, setResult] = useState<TalentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (adminID && !isSuperAdmin) return;
    let active = true;
    setError(null);
    setMissing(false);
    setResult(null);
    void Promise.all([
      getTalentResult(adminID),
      adminID ? Promise.resolve(null) : getTalentState(),
    ])
      .then(([data, state]) => {
        if (active) {
          setResult(data);
          setHasDraft(Boolean(state?.draft));
        }
      })
      .catch((reason) => {
        if (!active) return;
        if (isAxiosError(reason) && reason.response?.status === 404)
          setMissing(true);
        else
          setError(
            isAxiosError(reason) && reason.response?.status === 403
              ? "Anda tidak memiliki akses ke hasil ini."
              : "Hasil asesmen belum berhasil dimuat.",
          );
      });
    return () => {
      active = false;
    };
  }, [adminID, isSuperAdmin, reload]);
  if (adminID && !isSuperAdmin)
    return (
      <div className="talent-page">
        <Alert type="error" title="Anda tidak memiliki akses ke hasil ini." />
      </div>
    );
  return (
    <div className="talent-page">
      <Link to={adminID ? "/admin-users" : "/profile"}>
        {adminID ? "Kembali ke Akun Admin" : "Kembali ke Profil Saya"}
      </Link>
      <Typography.Title level={1} className="talent-page-title">
        Hasil Asesmen Bakat
        {adminID ? ` · ${result?.participant_name || `Akun #${adminID}`}` : ""}
      </Typography.Title>
      {missing ? (
        <Card>
          <Typography.Paragraph>
            Belum ada hasil asesmen yang dikirim.
          </Typography.Paragraph>
          {!adminID && (
            <Button
              type="primary"
              onClick={() => navigate("/profile/talent-assessment")}
            >
              Mulai Asesmen
            </Button>
          )}
        </Card>
      ) : error ? (
        <Alert
          type="error"
          title={error}
          action={
            <Button onClick={() => setReload((value) => value + 1)}>
              Coba lagi
            </Button>
          }
        />
      ) : !result ? (
        <Spin aria-label="Memuat hasil asesmen" />
      ) : (
        <>
          <Typography.Paragraph type="secondary">
            Dikirim{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Jakarta",
            }).format(new Date(result.submitted_at))}{" "}
            WIB
          </Typography.Paragraph>
          <Card
            title={<h2 className="talent-section-title">7 Bakat Menonjol</h2>}
            className="talent-spaced"
          >
            <Typography.Paragraph>
              Bakat dengan skor tertinggi dalam jawaban Anda. Gunakan sebagai
              bahan diskusi tentang pola kontribusi dan pengembangan diri.
            </Typography.Paragraph>
            <ol className="talent-results-top">
              {result.talents.slice(0, 7).map((theme) => (
                <li key={theme.name}>
                  <Typography.Text strong>{theme.name}</Typography.Text> —{" "}
                  {theme.score}/100 · {theme.domain}
                </li>
              ))}
            </ol>
          </Card>
          <Typography.Title
            level={2}
            className="talent-section-title talent-spaced"
          >
            Empat Kelompok Bakat
          </Typography.Title>
          <div className="talent-domains">
            {result.domains.map((domain) => (
              <Card
                key={domain.name}
                title={<h3 className="talent-section-title">{domain.name}</h3>}
              >
                <Typography.Text>
                  Rata-rata skor:{" "}
                  {domain.score.toLocaleString("id-ID", {
                    maximumFractionDigits: 1,
                  })}
                  /100
                </Typography.Text>
                <Progress
                  percent={domain.score}
                  showInfo={false}
                  aria-label={`Skor ${domain.name}: ${domain.score.toFixed(1)} dari 100`}
                />
                <Typography.Text>
                  {domain.top_seven_count} bakat dalam 7 teratas
                </Typography.Text>
              </Card>
            ))}
          </div>
          <Card
            title={<h2 className="talent-section-title">Urutan 34 Bakat</h2>}
            className="talent-spaced"
          >
            <Typography.Paragraph type="secondary">
              Skor kuesioner 0–100, bukan persentil atau perbandingan dengan
              orang lain. Skor sama diurutkan berdasarkan jumlah jawaban 6,
              kemudian 5, lalu urutan bakat dalam kunci.
            </Typography.Paragraph>
            <Typography.Paragraph>
              1–7: Bakat menonjol · 8–27: Bakat pendukung · 28–34: Bakat paling
              lemah dalam jawaban asesmen ini. Skor rendah tidak berarti Anda
              tidak mampu melakukannya.
            </Typography.Paragraph>
            <ol className="talent-score-list">
              {result.talents.map((theme) => (
                <li key={theme.name}>
                  <div>
                    <Typography.Text strong>
                      {theme.rank}. {theme.name}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {theme.domain} · {theme.group}
                      {theme.equal_score
                        ? " · Skor sama dengan bakat lain"
                        : ""}
                    </Typography.Text>
                  </div>
                  <Typography.Text strong>{theme.score}/100</Typography.Text>
                </li>
              ))}
            </ol>
          </Card>
          {!adminID && (
            <Space wrap className="talent-spaced">
              <Button onClick={() => navigate("/profile/talent-assessment")}>
                {hasDraft ? "Lanjutkan Asesmen" : "Ulangi Asesmen"}
              </Button>
              <Typography.Text type="secondary">
                Hasil lama diganti saat asesmen baru dikirim. Riwayat tidak
                disimpan.
              </Typography.Text>
            </Space>
          )}
        </>
      )}
    </div>
  );
}
