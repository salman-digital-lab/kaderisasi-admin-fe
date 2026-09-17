import { useState, type ReactElement } from "react";
import { Alert, Button, Space } from "antd";
import { downloadAttachmentById } from "../../api/services/form-responses";
import { actionError } from "../../utils/action-error";
export default function FormAnswerFiles({
  formId,
  value,
}: {
  formId: number;
  value: unknown;
}): ReactElement {
  const [busy, setBusy] = useState<string>();
  const [failure, setFailure] = useState("");
  const ids = Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string")
    : [];
  return (
    <div>
      <Space wrap>
        {ids.map((id, index) => (
          <Button
            key={id}
            loading={busy === id}
            onClick={() => {
              setBusy(id);
              setFailure("");
              void downloadAttachmentById(formId, id)
                .catch((error: unknown) => setFailure(actionError(error)))
                .finally(() => setBusy(undefined));
            }}
          >
            Unduh berkas {index + 1}
          </Button>
        ))}
      </Space>
      {failure && <Alert type="error" title={failure} />}
    </div>
  );
}
