import { Alert, Button } from "antd";
import type { ReactElement } from "react";

/** Standard inline error for data that failed to load, with a retry action. */
export default function LoadErrorAlert({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <Alert
      type="error"
      showIcon
      title={title}
      description="Periksa koneksi atau layanan API, lalu coba lagi."
      action={<Button onClick={onRetry}>Coba lagi</Button>}
      style={{ marginBottom: 12 }}
    />
  );
}
