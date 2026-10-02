import { useEffect, useState, type ReactElement } from "react";
import { Alert, Button, Card, Space, Spin, Typography } from "antd";
import "./assessment.css";
import { useNavigate } from "react-router-dom";
import {
  getTalentState,
  type TalentState,
} from "../../api/services/talent-assessment";
export default function TalentProfileSection(): ReactElement {
  const navigate = useNavigate();
  const [state, setState] = useState<TalentState | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    void getTalentState()
      .then((data) => {
        if (active) setState(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  return (
    <Card
      className="talent-profile-section"
      title="Asesmen Bakat"
      style={{ maxWidth: 640, marginTop: 24 }}
    >
      <Typography.Paragraph>
        Kenali pola bakat Anda melalui 170 pernyataan untuk bahan refleksi dan
        pengembangan diri. Hasil dapat dilihat oleh Anda dan Super Admin.
      </Typography.Paragraph>
      {failed ? (
        <Alert
          type="error"
          title="Status asesmen belum berhasil dimuat"
          action={
            <Button onClick={() => setReload((value) => value + 1)}>
              Coba lagi
            </Button>
          }
        />
      ) : !state ? (
        <Spin aria-label="Memuat status asesmen" />
      ) : (
        <>
          <Typography.Paragraph type="secondary">
            {state.draft
              ? `${state.draft.answers.filter(Boolean).length} dari 170 jawaban tersimpan${state.result ? ". Hasil sebelumnya tetap tersedia selama pengisian ulang." : "."}`
              : state.result
                ? "Asesmen selesai. Hasil Anda tersedia."
                : "Belum mengisi asesmen. Anda dapat berhenti dan melanjutkan kapan saja."}
          </Typography.Paragraph>
          <Space wrap>
            <Button
              type="primary"
              onClick={() =>
                navigate(
                  state.draft || !state.result
                    ? "/profile/talent-assessment"
                    : "/profile/talent-assessment/result",
                )
              }
            >
              {state.draft
                ? "Lanjutkan asesmen"
                : state.result
                  ? "Lihat hasil"
                  : "Mulai asesmen"}
            </Button>
            {state.draft && state.result && (
              <Button
                onClick={() => navigate("/profile/talent-assessment/result")}
              >
                Lihat hasil sebelumnya
              </Button>
            )}
          </Space>
        </>
      )}
    </Card>
  );
}
