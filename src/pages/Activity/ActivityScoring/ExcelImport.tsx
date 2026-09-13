import { useState, type ReactElement } from "react";
import { Alert, Button, Modal, Table, Typography, Upload } from "antd";
import { importScoring } from "../../../api/services/scoring";
import type {
  ScoringPreview,
  ScoringRubric,
} from "../../../types/services/scoring";
import { actionError } from "../../../utils/action-error";

export default function ExcelImport({
  activityId,
  rubric,
  onSaved,
}: {
  activityId: number;
  rubric: ScoringRubric;
  onSaved: () => void;
}): ReactElement {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<ScoringPreview>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const inspect = async (next: File): Promise<void> => {
    setFile(next);
    setPreview(undefined);
    setFailure("");
    setBusy(true);
    try {
      setPreview(await importScoring(activityId, next));
    } catch (error) {
      setFailure(
        actionError(
          error,
          "Berkas tidak dapat dibaca. Gunakan templat terbaru dan periksa format .xlsx.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const commit = async (): Promise<void> => {
    if (!file || !preview) return;
    setBusy(true);
    setFailure("");
    try {
      await importScoring(activityId, file, preview.hash);
      setFile(undefined);
      setPreview(undefined);
      onSaved();
    } catch (error) {
      setFailure(actionError(error));
      setPreview(undefined);
    } finally {
      setBusy(false);
    }
  };
  const criteria = rubric.groups.flatMap((group) => group.criteria);
  return (
    <>
      <Upload
        accept=".xlsx"
        showUploadList={false}
        disabled={busy}
        beforeUpload={(next) => {
          void inspect(next);
          return false;
        }}
      >
        <Button loading={busy}>Impor Excel</Button>
      </Upload>
      <Modal
        open={!!file}
        title="Tinjau impor nilai"
        width={1000}
        onCancel={() => {
          if (!busy) {
            setFile(undefined);
            setPreview(undefined);
          }
        }}
        maskClosable={false}
        footer={
          <>
            <Button
              disabled={busy}
              onClick={() => {
                setFile(undefined);
                setPreview(undefined);
              }}
            >
              Tutup
            </Button>
            {!preview && file && (
              <Button loading={busy} onClick={() => void inspect(file)}>
                Periksa ulang
              </Button>
            )}
            <Button
              type="primary"
              loading={busy}
              disabled={
                !preview || !!preview.errors.length || !preview.changes.length
              }
              onClick={() => void commit()}
            >
              Simpan {preview?.changes.length ?? 0} draf
            </Button>
          </>
        }
      >
        <Typography.Paragraph>
          Sel kosong mempertahankan nilai dan catatan yang tersimpan. Impor
          hanya menyimpan draf.
        </Typography.Paragraph>
        {failure && <Alert type="error" title={failure} role="alert" />}
        {preview && (
          <>
            {!!preview.errors.length && (
              <Alert
                type="error"
                title={`${preview.errors.length} kesalahan harus diperbaiki sebelum menyimpan`}
                description={
                  <ul>
                    {preview.errors.map((error, index) => (
                      <li key={index}>
                        Baris {error.row}, {error.column}: {error.message}
                      </li>
                    ))}
                  </ul>
                }
              />
            )}
            <Table
              rowKey="registration_id"
              size="small"
              dataSource={preview.changes}
              scroll={{ x: Math.max(650, criteria.length * 130) }}
              columns={[
                { title: "Baris", dataIndex: "row", width: 60 },
                { title: "Peserta", dataIndex: "name", width: 180 },
                ...criteria.map((criterion) => ({
                  title: criterion.name,
                  key: criterion.id,
                  render: (
                    _: unknown,
                    row: ScoringPreview["changes"][number],
                  ): string =>
                    row.draft.scores[criterion.id]?.toLocaleString("id-ID") ??
                    "Belum dinilai",
                })),
                {
                  title: "Catatan",
                  render: (
                    _: unknown,
                    row: ScoringPreview["changes"][number],
                  ): string => row.draft.note,
                },
              ]}
              locale={{
                emptyText: "Tidak ada perubahan nilai pada berkas ini",
              }}
            />
          </>
        )}
      </Modal>
    </>
  );
}
