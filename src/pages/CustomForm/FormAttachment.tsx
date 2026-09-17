import { useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";
import { Alert, Button, Typography } from "antd";
import { downloadAttachmentById } from "../../api/services/form-responses";
import { actionError } from "../../utils/action-error";

export default function FormAttachment(): ReactElement {
  const { formId, attachmentId } = useParams();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  return (
    <div>
      <Typography.Title level={2}>Berkas jawaban formulir</Typography.Title>
      <p>Berkas hanya dapat diunduh oleh admin yang memiliki akses formulir.</p>
      {failure && <Alert type="error" title={failure} />}
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
