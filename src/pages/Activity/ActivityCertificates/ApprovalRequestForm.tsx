import {
  Alert,
  Button,
  ConfigProvider,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  APPROVAL_ERRORS,
  getCertificateSigners,
  requestCertificateApprovals,
} from "../../../api/services/certificateApproval";
import type { IssuancePlan } from "../../../types/services/certificateWorkflow";
import { CERTIFICATE_APPROVAL_THEME } from "../../DigitalCertificate/constants/approval-theme";
import "../../DigitalCertificate/components/certificate-approval.css";

export function ApprovalRequestForm({
  plan,
  onSubmitted,
}: {
  plan: IssuancePlan;
  onSubmitted: () => void;
}): React.ReactElement {
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
    getCertificateSigners(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSigners(data);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Penandatangan gagal dimuat. Coba lagi.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  async function submit(values: {
    signerId: number;
    signerTitle: string;
  }): Promise<void> {
    setBusy(true);
    setError("");
    try {
      let failures = 0;
      const reasons = new Set<string>();
      for (let index = 0; index < plan.registration_ids.length; index += 50) {
        const result = await requestCertificateApprovals(
          plan,
          plan.registration_ids.slice(index, index + 50),
          values.signerId,
          values.signerTitle.trim(),
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
        className="certificate-approval"
        layout="vertical"
        disabled={busy}
        onFinish={submit}
        style={{ maxWidth: 560 }}
      >
        <Typography.Paragraph>
          Pilih satu penandatangan. Sertifikat diterbitkan setelah penandatangan
          meninjau dan menyetujui permintaan ini.
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
            title="Belum ada penandatangan aktif"
            description="Admin memerlukan nama tampilan dan akses persetujuan sertifikat."
          />
        )}
        <Form.Item
          name="signerId"
          label="Penandatangan"
          rules={[{ required: true, message: "Pilih penandatangan." }]}
        >
          <Select
            loading={loading}
            showSearch={{ optionFilterProp: "label" }}
            options={signers.map((signer) => ({
              value: signer.id,
              label: signer.name,
            }))}
            placeholder="Pilih penandatangan"
          />
        </Form.Item>
        <Form.Item
          name="signerTitle"
          label="Jabatan pada sertifikat"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Isi jabatan penandatangan.",
            },
            { max: 120 },
          ]}
        >
          <Input maxLength={120} />
        </Form.Item>
        <Space orientation="vertical">
          <Button
            htmlType="submit"
            type="primary"
            loading={busy}
            disabled={
              loading || !signers.length || !plan.registration_ids.length
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
