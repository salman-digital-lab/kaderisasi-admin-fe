import { message, notification, Typography } from "antd";
import { AxiosError } from "axios";
import { renderNotification } from "../constants/render";

const { Paragraph, Text } = Typography;

const STATUS_MESSAGES: Record<number, string> = {
  400: "Data yang dikirim belum valid. Periksa kembali isian Anda.",
  403: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
  404: "Data tidak ditemukan atau sudah dihapus.",
  409: "Data sudah berubah atau sudah ada. Muat ulang halaman, lalu coba lagi.",
  413: "Berkas terlalu besar.",
  422: "Data yang dikirim belum valid. Periksa kembali isian Anda.",
  429: "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.",
};

const GENERIC_MESSAGE =
  "Terjadi kesalahan. Silakan coba lagi beberapa saat lagi.";

const describeStatus = (status: number): string =>
  STATUS_MESSAGES[status] ??
  (status >= 500
    ? "Server sedang bermasalah. Silakan coba lagi beberapa saat lagi."
    : GENERIC_MESSAGE);

const showError = (description: string, status?: number): void => {
  notification.error({
    title: "Terjadi kesalahan",
    description: (
      <>
        <Paragraph style={{ marginBottom: status ? 4 : 0 }}>
          {description}
        </Paragraph>
        {status && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kode kesalahan: {status}
          </Text>
        )}
      </>
    ),
  });
};

export const handleError = (error: unknown) => {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      // 401 errors are handled by the axios interceptor.
      if (status === 401) return;
      const serverMessage =
        data &&
        typeof data === "object" &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : undefined;
      const translated = serverMessage
        ? renderNotification(serverMessage)
        : undefined;
      // Untranslated server codes are logged for support, not shown raw.
      if (serverMessage && translated === serverMessage) {
        console.error("Unhandled API message:", serverMessage, status);
      }
      showError(
        translated && translated !== serverMessage
          ? translated
          : describeStatus(status),
        status,
      );
    } else if (axiosError.request) {
      showError(
        "Tidak dapat menghubungi server. Periksa koneksi internet Anda, lalu coba lagi.",
      );
    } else {
      showError(GENERIC_MESSAGE);
    }
  } else if (error instanceof Error && error.message) {
    showError(renderNotification(error.message));
  } else {
    console.error("Unexpected error:", error);
    showError(GENERIC_MESSAGE);
  }
};

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}

export const handleSuccess = (code: string) => {
  message.success(renderNotification(code));
};
