import { useEffect, useRef, useState, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { Alert, Button, Skeleton, Steps, Typography } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { getSetupActivity } from "../../../api/services/activity-setup";
import { postActivityImages } from "../../../api/services/activity";
import UnsavedChangesGuard from "../../../components/common/UnsavedChangesGuard";
import { actionError } from "../../../utils/action-error";
import DraftPosters from "./DraftPosters";
import { ACTIVITY_CREATION_STEPS } from "./steps";

export default function PosterStep(): ReactElement {
  const { id } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const saving = useRef(false);
  const uploaded = useRef(new Set<File>());
  const [savedCount, setSavedCount] = useState(0);
  const {
    data: activity,
    loading,
    error,
    refresh,
  } = useRequest(
    async () => {
      const row = await getSetupActivity(Number(id));
      setSavedCount(row.additional_config.images?.length ?? 0);
      return row;
    },
    { refreshDeps: [id] },
  );
  useEffect(() => {
    if (!loading) document.getElementById("setup-step-title")?.focus();
  }, [loading]);
  const save = async (): Promise<void> => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setFailure("");
    try {
      for (const file of files) {
        if (uploaded.current.has(file)) continue;
        await postActivityImages(Number(id), file);
        uploaded.current.add(file);
        setSavedCount((count) => count + 1);
      }
      flushSync(() => {
        setFiles([]);
        setBusy(false);
      });
      navigate(`/activity/${id}/setup?step=form`, { replace: true });
    } catch (cause) {
      setFiles((current) =>
        current.filter((file) => !uploaded.current.has(file)),
      );
      setFailure(
        actionError(
          cause,
          "Sebagian poster belum tersimpan. Coba lagi untuk mengunggah poster yang tersisa.",
        ),
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  return (
    <main className="guided-page activity-setup-page">
      <header className="activity-setup-header">
        <Typography.Title level={2} className="activity-setup-title">
          {activity?.name ?? "Unggah poster kegiatan"}
        </Typography.Title>
        <p>
          Pilih poster, lalu simpan untuk melanjutkan ke formulir pendaftaran.
        </p>
      </header>
      <Alert
        className="activity-setup-notice"
        role="status"
        type="success"
        showIcon
        title="Informasi kegiatan sudah tersimpan sebagai draf"
        description="Keluar hanya membuang pilihan poster yang belum disimpan. Informasi kegiatan dan poster yang sebelumnya disimpan tetap tersedia."
      />
      <Steps
        current={4}
        size="small"
        items={ACTIVITY_CREATION_STEPS.map((title) => ({ title }))}
        style={{ marginBottom: 24 }}
      />
      {failure && (
        <Alert
          className="activity-setup-notice"
          type="error"
          showIcon
          title={failure}
        />
      )}
      {error ? (
        <Alert
          type="error"
          showIcon
          title="Kegiatan belum berhasil dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      ) : (
        <Skeleton loading={loading}>
          <section className="guided-section">
            <Typography.Title level={3} id="setup-step-title" tabIndex={-1}>
              5. Unggah poster
            </Typography.Title>
            <Alert
              className="activity-setup-notice"
              role="note"
              type="info"
              showIcon
              title="Poster diunggah saat Simpan & Lanjutkan"
              description="Minimal satu poster diperlukan sebelum tayang. Anda boleh melanjutkan tanpa poster dan menambahkannya nanti melalui detail kegiatan."
            />
            {savedCount > 0 && <p>{savedCount} poster sudah tersimpan.</p>}
            <DraftPosters
              files={files}
              savedCount={savedCount}
              disabled={busy}
              onChange={setFiles}
            />
          </section>
        </Skeleton>
      )}
      <footer className="guided-footer guided-actions">
        <span className="guided-save-state" role="status">
          {busy
            ? "Menyimpan poster…"
            : files.length
              ? "Pilihan poster belum disimpan"
              : "Tidak ada poster baru dipilih"}
        </span>
        <Button disabled={busy} onClick={() => navigate("/activity")}>
          Keluar
        </Button>
        <Button
          type="primary"
          aria-label="Simpan & Lanjutkan"
          loading={busy}
          disabled={loading || !!error}
          onClick={() => void save()}
        >
          Simpan & Lanjutkan
        </Button>
      </footer>
      <UnsavedChangesGuard
        dirty={files.length > 0 || busy}
        includeSearchChanges
      />
    </main>
  );
}
