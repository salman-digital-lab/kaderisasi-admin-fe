import { useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import { Alert, Button } from "antd";
import { downloadAttachmentById } from "../../api/services/form-responses";
import { actionError } from "../../utils/action-error";
import PageHeader from "../../components/common/PageHeader";

export default function FormAttachment(): ReactElement {
  const { formId, attachmentId } = useParams();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  return (
    <div className="page-container">
      <PageHeader
        title="Berkas Jawaban Formulir"
        description="Berkas hanya dapat diunduh oleh admin yang memiliki akses formulir."
        back={{
          to: `/custom-form/${formId}/edit`,
          label: "Kembali ke formulir",
        }}
      />
      {failure && (
        <Alert type="error" title={failure} style={{ marginBottom: 12 }} />
      )}
      <Button
        type="primary"
        loading={busy}
        onClick={() => {
          if (!formId || !attachmentId) return;
          setBusy(true);
          setFailure("");
          void downloadAttachmentById(Number(formId), attachmentId)
            .catch((error: unknown) => setFailure(actionError(error)))
            .finally(() => setBusy(false));
        }}
      >
        Unduh berkas
      </Button>
    </div>
  );
}
