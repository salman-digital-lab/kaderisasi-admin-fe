import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Modal,
  Progress,
  Radio,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
} from "react-router-dom";
import { isAxiosError } from "axios";
import {
  getTalentDefinition,
  getTalentState,
  startTalentDraft,
  submitTalentDraft,
  type TalentDefinition,
  type TalentDraft,
  type TalentState,
} from "../../api/services/talent-assessment";
import { useTalentDraft } from "./use-draft";
import "./assessment.css";

const CHOICES = [
  "Sangat Tidak Setuju",
  "Tidak Setuju",
  "Agak Tidak Setuju",
  "Agak Setuju",
  "Setuju",
  "Sangat Setuju",
];

export default function TalentAssessment(): ReactElement {
  const [definition, setDefinition] = useState<TalentDefinition | null>(null);
  const [state, setState] = useState<TalentState | null>(null);
  const [error, setError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setError(false);
    setState(null);
    void Promise.all([getTalentDefinition(), getTalentState()])
      .then(([def, status]) => {
        if (active) {
          setDefinition(def);
          setState(status);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const start = async (): Promise<void> => {
    setStarting(true);
    try {
      const draft = await startTalentDraft();
      setState((previous) => ({ draft, result: previous?.result ?? null }));
    } catch {
      setError(true);
    } finally {
      setStarting(false);
    }
  };
  if (error)
    return (
      <div className="talent-page">
        <Alert
          type="error"
          title="Asesmen belum berhasil dimuat"
          action={
            <Button onClick={() => setReload((value) => value + 1)}>
              Coba lagi
            </Button>
          }
        />
      </div>
    );
  if (!definition || !state)
    return (
      <div className="talent-page">
        <Spin aria-label="Memuat asesmen" />
      </div>
    );
  if (state.draft) {
    if (state.draft.definition_version !== definition.version)
      return (
        <div className="talent-page">
          <Alert
            type="warning"
            title="Versi asesmen telah berubah"
            description="Hubungi pengelola untuk melanjutkan draf ini."
          />
        </div>
      );
    return (
      <AssessmentRunner
        key={`${state.draft.draft_id}-${reload}`}
        initial={state.draft}
        definition={definition}
        hasResult={Boolean(state.result)}
        reload={() => setReload((value) => value + 1)}
      />
    );
  }
  return (
    <div className="talent-page">
      <Link to="/profile">Kembali ke Profil Saya</Link>
      <Typography.Title level={1} className="talent-page-title">
        Asesmen Bakat
      </Typography.Title>
      <Card>
        <Typography.Title level={2} className="talent-section-title">
          Jawab sesuai diri Anda sehari-hari
        </Typography.Title>
        <Typography.Paragraph>
          Tidak ada jawaban benar atau salah. Pilih seberapa sesuai setiap
          pernyataan dengan diri Anda apa adanya, bukan diri yang ideal.
        </Typography.Paragraph>
        <ul className="talent-instructions">
          <li>
            170 pernyataan, satu per layar, dengan enam pilihan dari Sangat
            Tidak Setuju hingga Sangat Setuju.
          </li>
          <li>
            Tekan Berikutnya setelah memilih. Anda dapat kembali untuk mengubah
            jawaban.
          </li>
          <li>
            Jawaban disimpan otomatis. Tunggu status tersimpan atau gunakan
            Simpan &amp; Keluar sebelum berhenti.
          </li>
          <li>
            Lengkapi semua jawaban sebelum mengirim. Tidak ada batas waktu.
          </li>
        </ul>
        {state.result && (
          <Typography.Paragraph className="talent-spaced">
            Hasil sebelumnya tetap tersedia. Hasil tersebut akan diganti setelah
            Anda mengirim seluruh jawaban asesmen ulang. Riwayat hasil tidak
            disimpan.
          </Typography.Paragraph>
        )}
        <Button
          type="primary"
          className="talent-spaced"
          loading={starting}
          onClick={() => {
            if (state.result)
              Modal.confirm({
                title: "Ulangi asesmen?",
                content:
                  "Hasil lama diganti saat asesmen baru selesai dikirim. Riwayat hasil tidak disimpan.",
                okText: "Ulangi Asesmen",
                cancelText: "Batal",
                onOk: start,
              });
            else void start();
          }}
        >
          {state.result ? "Ulangi Asesmen" : "Mulai Asesmen"}
        </Button>
      </Card>
    </div>
  );
}

function AssessmentRunner({
  initial,
  definition,
  hasResult,
  reload,
}: {
  initial: TalentDraft;
  definition: TalentDefinition;
  hasResult: boolean;
  reload: () => void;
}): ReactElement {
  const session = useTalentDraft(initial);
  const { draft, dirty, saving, error, conflict, update, flush } = session;
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const blocker = useBlocker(() => session.hasPending());
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  useEffect(() => {
    heading.current?.focus();
  }, [draft.current_question, review]);
  const count = draft.answers.filter(Boolean).length;
  const selected = draft.answers[draft.current_question - 1];
  const go = (question: number): void => {
    update([...draft.answers], question);
    setReview(false);
    setNavigatorOpen(false);
  };
  const submit = async (): Promise<void> => {
    setSubmitting(true);
    setSubmissionError(null);
    try {
      if (!(await flush())) return;
      await submitTalentDraft(session.latest());
      navigate("/profile/talent-assessment/result", { replace: true });
    } catch (reason) {
      setSubmissionError(
        isAxiosError(reason) && reason.response?.status === 409
          ? "Draf berubah di tab lain. Muat draf terbaru sebelum mengirim."
          : "Hasil belum berhasil dikirim. Coba kirim lagi; pengiriman ulang tidak membuat hasil ganda.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="talent-page">
      <Typography.Title level={1} className="talent-page-title">
        Asesmen Bakat
      </Typography.Title>
      <div className="talent-toolbar">
        <Typography.Text>{count} dari 170 jawaban terisi</Typography.Text>
        <span role="status" aria-live="polite">
          {saving
            ? "Menyimpan…"
            : dirty
              ? "Ada perubahan belum tersimpan"
              : "Semua perubahan tersimpan"}
        </span>
      </div>
      <Progress
        percent={Math.round((count / 170) * 100)}
        aria-label={`${count} dari 170 jawaban terisi`}
      />
      {error && (
        <Alert
          className="talent-spaced"
          type="error"
          showIcon
          title={error}
          action={
            conflict ? (
              <Button
                onClick={() =>
                  Modal.confirm({
                    title: "Muat draf terbaru?",
                    content:
                      "Perubahan yang belum tersimpan di layar ini akan dibuang. Draf tersimpan di server akan dimuat.",
                    okText: "Muat Draf",
                    cancelText: "Batal",
                    onOk: reload,
                  })
                }
              >
                Muat Draf Terbaru
              </Button>
            ) : (
              <Button
                loading={saving}
                onClick={() => {
                  void flush();
                }}
              >
                Coba Simpan Lagi
              </Button>
            )
          }
        />
      )}
      {submissionError && (
        <Alert
          className="talent-spaced"
          type="error"
          title={submissionError}
          action={
            <Button
              onClick={() =>
                Modal.confirm({
                  title: "Muat draf terbaru?",
                  content: "Perubahan belum tersimpan akan dibuang.",
                  okText: "Muat Draf",
                  cancelText: "Batal",
                  onOk: reload,
                })
              }
            >
              Muat Draf Terbaru
            </Button>
          }
        />
      )}
      <Card className="talent-question-card">
        {review ? (
          <>
            <h2 ref={heading} tabIndex={-1} className="talent-question-heading">
              Periksa sebelum mengirim
            </h2>
            <Typography.Paragraph>
              {count} dari 170 pernyataan telah dijawab. Anda dapat meninjau
              atau mengubah jawaban melalui daftar pertanyaan.
            </Typography.Paragraph>
            {hasResult && (
              <Typography.Paragraph className="talent-spaced">
                Pengiriman ini mengganti hasil sebelumnya. Riwayat hasil tidak
                disimpan.
              </Typography.Paragraph>
            )}
            {count < 170 && (
              <Alert
                type="warning"
                title="Lengkapi seluruh jawaban sebelum mengirim"
              />
            )}
            <Space wrap className="talent-spaced">
              <Button onClick={() => setNavigatorOpen(true)}>
                Tinjau Jawaban
              </Button>
              <Button
                type="primary"
                disabled={count !== 170 || conflict}
                loading={submitting}
                onClick={() => {
                  void submit();
                }}
              >
                Kirim Asesmen
              </Button>
            </Space>
          </>
        ) : (
          <>
            <Typography.Text type="secondary">
              Pernyataan {draft.current_question} dari 170
            </Typography.Text>
            <h2
              ref={heading}
              tabIndex={-1}
              className="talent-question-heading"
              id="talent-statement"
            >
              {definition.questions[draft.current_question - 1].statement}
            </h2>
            <Radio.Group
              className="talent-choices"
              aria-labelledby="talent-statement"
              name={`question-${draft.current_question}`}
              value={selected || undefined}
              disabled={submitting || conflict}
              onChange={(event) => {
                const answers = [...draft.answers];
                answers[draft.current_question - 1] = Number(
                  event.target.value,
                );
                update(answers, draft.current_question);
              }}
            >
              {CHOICES.map((label, index) => (
                <Radio
                  key={label}
                  value={index + 1}
                  className={`talent-choice${selected === index + 1 ? " talent-choice-selected" : ""}`}
                >
                  {label}
                </Radio>
              ))}
            </Radio.Group>
            <div className="talent-question-navigation">
              <Button
                disabled={draft.current_question === 1 || submitting}
                onClick={() => go(draft.current_question - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                type="primary"
                disabled={!selected || submitting || conflict}
                onClick={() => {
                  if (draft.current_question === 170) setReview(true);
                  else go(draft.current_question + 1);
                }}
              >
                {draft.current_question === 170
                  ? "Periksa Jawaban"
                  : "Berikutnya"}
              </Button>
            </div>
          </>
        )}
      </Card>
      <Space wrap className="talent-spaced">
        <Button disabled={submitting} onClick={() => setNavigatorOpen(true)}>
          Daftar Pertanyaan
        </Button>
        {count === 170 && !review && (
          <Button onClick={() => setReview(true)}>Periksa Jawaban</Button>
        )}
        <Button
          loading={saving}
          disabled={submitting || conflict}
          onClick={async () => {
            if (await flush()) navigate("/profile");
          }}
        >
          Simpan &amp; Keluar
        </Button>
      </Space>
      <Drawer
        title="Daftar Pertanyaan"
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        size="large"
      >
        <Typography.Paragraph>
          Pilih nomor untuk meninjau jawaban. Tanda ✓ menunjukkan jawaban sudah
          terisi.
        </Typography.Paragraph>
        <div className="talent-question-grid">
          {draft.answers.map((answer, index) => (
            <Button
              key={index}
              type={
                index + 1 === draft.current_question ? "primary" : "default"
              }
              aria-label={`Pernyataan ${index + 1}, ${answer ? "terisi" : "belum terisi"}`}
              disabled={submitting || conflict}
              onClick={() => go(index + 1)}
            >
              {index + 1}
              {answer ? " ✓" : ""}
            </Button>
          ))}
        </div>
      </Drawer>
      <Modal
        open={blocker.state === "blocked"}
        title="Jawaban belum tersimpan"
        okText="Simpan & Keluar"
        cancelText="Tetap Mengisi"
        confirmLoading={saving}
        onCancel={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onOk={async () => {
          if ((await flush()) && blocker.state === "blocked") blocker.proceed();
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space wrap>
            <Button
              danger
              onClick={() => {
                if (blocker.state === "blocked") blocker.proceed();
              }}
            >
              Keluar Tanpa Menyimpan
            </Button>
            <CancelBtn />
            <OkBtn />
          </Space>
        )}
      >
        <p>
          Simpan perubahan sebelum keluar agar jawaban dapat dilanjutkan nanti.
        </p>
        {error && <Alert type="error" title={error} />}
      </Modal>
    </div>
  );
}
