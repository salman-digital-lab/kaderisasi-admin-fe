import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Select,
  Space,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  APPROVAL_ERRORS,
  getCertificateSigners,
  getDocumentSigners,
  type DocumentSigner,
  requestCertificateApprovals,
} from "../../../api/services/certificateApproval";
import type { IssuancePlan } from "../../../types/services/certificateWorkflow";
import { CERTIFICATE_APPROVAL_THEME } from "../../DigitalCertificate/constants/approval-theme";
import { preflightSalmanRecipients } from "./preflightSalman";
import "../../DigitalCertificate/components/certificate-approval.css";

export function ApprovalRequestForm({
  plan,
  onSubmitted,
}: {
  plan: IssuancePlan;
  onSubmitted: () => void;
}): React.ReactElement {
  const [form] = Form.useForm();
  const [documentSigners, setDocumentSigners] = useState<DocumentSigner[]>([]);
  const documentSignerKey = Form.useWatch("documentSignerKey", form);
  const selectedSigner = documentSigners.find(
    (signer) => signer.key === documentSignerKey,
  );
  const [signers, setSigners] = useState<Array<{ id: number; name: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      getCertificateSigners(controller.signal),
      getDocumentSigners(controller.signal),
    ])
      .then(([admins, profiles]) => {
        if (!controller.signal.aborted) {
          setSigners(admins);
          setDocumentSigners(profiles);
          if (!form.getFieldValue("documentSignerKey"))
            form.setFieldValue("documentSignerKey", profiles[0]?.key);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Penandatangan gagal dimuat. Coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry, form]);
  async function submit(values: {
    signerId: number;
    documentSignerKey: string;
  }): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const profile = documentSigners.find(
        (signer) => signer.key === values.documentSignerKey,
      );
      if (!profile) {
        setError("Penandatangan tidak tersedia. Muat ulang halaman.");
        return;
      }
      if (
        plan.preview?.template.template_data.scoreSheetLayout === "salman-v1"
      ) {
        const overflow = await preflightSalmanRecipients(
          plan.registration_ids,
          profile.name,
          profile.title,
          setProgress,
        );
        if (overflow.length) {
          setError(
            `Tata letak harus diperbaiki sebelum persetujuan diminta: ${overflow.join("; ")}`,
          );
          return;
        }
      }
      let failures = 0;
      const reasons = new Set<string>();
      for (let index = 0; index < plan.registration_ids.length; index += 50) {
        const result = await requestCertificateApprovals(
          plan,
          plan.registration_ids.slice(index, index + 50),
          values.signerId,
          profile.key,
        );
        for (const item of result)
          if (item.status === "failed") {
            failures += 1;
            reasons.add(
              APPROVAL_ERRORS[item.reason ?? ""] ??
                "Permintaan gagal diproses. Coba lagi.",
            );
          }
        setProgress(
          `${Math.min(index + 50, plan.registration_ids.length)} dari ${plan.registration_ids.length} permintaan diproses.`,
        );
      }
      if (failures)
        setError(
          `${failures} permintaan gagal. ${[...reasons].join(" ")} Permintaan yang berhasil tetap tersimpan; pengiriman ulang tidak menggandakannya.`,
        );
      else onSubmitted();
    } catch {
      setError(
        "Pengiriman terhenti. Permintaan yang sudah tersimpan tetap tersedia. Coba kirim kembali.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <ConfigProvider theme={CERTIFICATE_APPROVAL_THEME}>
      <Form
        form={form}
        className="certificate-approval"
        layout="vertical"
        disabled={busy}
        onFinish={submit}
        style={{ maxWidth: 560 }}
      >
        <Typography.Paragraph>
          Pilih penandatangan yang tercantum pada sertifikat dan admin yang akan
          meninjau serta menyetujui atas namanya. Identitas admin dicatat dalam
          riwayat persetujuan.
        </Typography.Paragraph>
        {error && (
          <Alert
            type="error"
            showIcon
            title={error}
            action={
              <Button
                disabled={busy}
                onClick={() => setRetry((value) => value + 1)}
              >
                Muat ulang
              </Button>
            }
          />
        )}
        {!loading && !error && !signers.length && (
          <Alert
            type="info"
            title="Belum ada admin pemberi persetujuan aktif"
            description="Admin memerlukan nama tampilan dan akses persetujuan sertifikat."
          />
        )}
        <Form.Item
          name="documentSignerKey"
          label="Penandatangan pada sertifikat"
          rules={[{ required: true, message: "Pilih penandatangan dokumen." }]}
        >
          <Select
            loading={loading}
            options={documentSigners.map((signer) => ({
              value: signer.key,
              label: signer.name,
            }))}
          />
        </Form.Item>
        {selectedSigner && (
          <Typography.Paragraph>{selectedSigner.title}</Typography.Paragraph>
        )}
        <Form.Item
          name="signerId"
          label="Admin pemberi persetujuan"
          rules={[
            { required: true, message: "Pilih admin pemberi persetujuan." },
          ]}
        >
          <Select
            loading={loading}
            showSearch={{ optionFilterProp: "label" }}
            options={signers.map((signer) => ({
              value: signer.id,
              label: signer.name,
            }))}
            placeholder="Pilih admin pemberi persetujuan"
          />
        </Form.Item>
        <Space orientation="vertical">
          <Button
            htmlType="submit"
            type="primary"
            loading={busy}
            disabled={
              loading ||
              !signers.length ||
              !documentSigners.length ||
              !plan.registration_ids.length
            }
          >
            Kirim {plan.registration_ids.length} permintaan persetujuan
          </Button>
          <span role="status">{progress}</span>
        </Space>
      </Form>
    </ConfigProvider>
  );
}
