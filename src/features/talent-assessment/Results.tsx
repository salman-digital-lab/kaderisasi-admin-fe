import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Card, Space, Spin, Typography } from "antd";
import { isAxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getTalentResult,
  getTalentState,
  type TalentResult,
} from "../../api/services/talent-assessment";
import { useIsSuperAdmin, useUser } from "../../stores/authStore";
import "./assessment.css";
import TalentReport from "./TalentReport";

export default function TalentResults(): ReactElement {
  const { adminID } = useParams<{ adminID: string }>();
  const isSuperAdmin = useIsSuperAdmin();
  const user = useUser();
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
              Mulai asesmen
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
          <TalentReport
            result={result}
            participantName={
              adminID
                ? result.participant_name || `Akun #${adminID}`
                : user?.display_name || user?.email || "Profil Saya"
            }
          />
          {!adminID && (
            <Space wrap className="talent-spaced">
              <Button onClick={() => navigate("/profile/talent-assessment")}>
                {hasDraft ? "Lanjutkan asesmen" : "Ulangi asesmen"}
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
