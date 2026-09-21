import { useState } from "react";
import type { ReactElement } from "react";
import { useRequest } from "ahooks";
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Radio,
  Space,
  Spin,
  Typography,
} from "antd";
import { ResponsiveDialog } from "../../../components/common/Responsive/ResponsiveDialog";
import {
  downloadMemberExport,
  getMemberExportPreview,
} from "../../../api/services/member-export";
import type {
  MemberExportFilters,
  MemberExportFormat,
} from "../../../api/services/member-export";

type Props = {
  filters: MemberExportFilters;
  onClose: () => void;
};

export default function ExportMemberModal({
  filters,
  onClose,
}: Props): ReactElement {
  const [columns, setColumns] = useState<string[]>([]);
  const [format, setFormat] = useState<MemberExportFormat>("xlsx");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const { data, loading, error, refresh } = useRequest(
    () => getMemberExportPreview(filters),
    {
      onSuccess: (preview) =>
        setColumns(preview.columns.map((column) => column.key)),
    },
  );

  const download = async (): Promise<void> => {
    setDownloading(true);
    setDownloadError(false);
    try {
      await downloadMemberExport(filters, columns, format);
      onClose();
    } catch {
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ResponsiveDialog
      title="Unduh Data Anggota"
      open
      width={640}
      okText="Unduh"
      cancelText="Batal"
      onCancel={onClose}
      onOk={() => void download()}
      confirmLoading={downloading}
      okButtonProps={{
        "aria-label": "Unduh",
        "aria-busy": downloading,
        disabled: loading || !!error || !data?.total || columns.length === 0,
      }}
      cancelButtonProps={{ disabled: downloading }}
      closable={!downloading}
      keyboard={!downloading}
      maskClosable={!downloading}
    >
      {loading ? (
        <Spin aria-label="Menghitung anggota" />
      ) : error ? (
        <Alert
          type="error"
          title="Jumlah anggota gagal dimuat."
          action={<Button onClick={refresh}>Coba Lagi</Button>}
        />
      ) : data ? (
        <Form layout="vertical">
          <Typography.Paragraph aria-live="polite">
            <strong>{data.total.toLocaleString("id-ID")} baris</strong> sesuai
            filter yang diterapkan pada daftar, mencakup semua halaman.
          </Typography.Paragraph>
          {data.total === 0 && (
            <Alert type="info" title="Tidak ada anggota yang sesuai filter." />
          )}
          <Form.Item label="Format file">
            <Radio.Group
              value={format}
              disabled={downloading}
              onChange={(event) =>
                setFormat(event.target.value as MemberExportFormat)
              }
              options={[
                { label: "Excel (.xlsx)", value: "xlsx" },
                { label: "CSV (.csv)", value: "csv" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={`Kolom yang diekspor (${columns.length}/${data.columns.length})`}
          >
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              <Checkbox
                checked={columns.length === data.columns.length}
                indeterminate={
                  columns.length > 0 && columns.length < data.columns.length
                }
                disabled={downloading}
                onChange={(event) =>
                  setColumns(
                    event.target.checked
                      ? data.columns.map((column) => column.key)
                      : [],
                  )
                }
              >
                Pilih semua kolom
              </Checkbox>
              <Checkbox.Group
                value={columns}
                disabled={downloading}
                onChange={setColumns}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 8,
                  width: "100%",
                }}
                options={data.columns.map((column) => ({
                  label: column.label,
                  value: column.key,
                }))}
              />
            </Space>
          </Form.Item>
          {columns.length === 0 && (
            <Typography.Paragraph type="danger">
              Pilih minimal satu kolom.
            </Typography.Paragraph>
          )}
          <Typography.Paragraph type="secondary">
            Riwayat pendidikan, riwayat pekerjaan, dan data tambahan disimpan
            sebagai JSON dalam satu sel. Jumlah baris dapat berubah jika data
            anggota diperbarui sebelum diunduh.
          </Typography.Paragraph>
        </Form>
      ) : null}
      {downloadError && (
        <Alert
          type="error"
          title="Unduhan gagal. Silakan coba lagi atau periksa akses Super Admin Anda."
        />
      )}
    </ResponsiveDialog>
  );
}
