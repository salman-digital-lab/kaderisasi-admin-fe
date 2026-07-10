import type { UploadFile } from "antd";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Reads a file from an Ant Design Upload event as a base64 data URL.
 * Consolidates the duplicated FileReader logic used across
 * ElementToolbar, PropertyPanel, etc.
 */
export function readUploadFileAsDataUrl(
  info: { file: UploadFile },
  onResult: (dataUrl: string, file: File) => void,
  onError?: (errorMessage: string) => void,
): void {
  const file = info.file.originFileObj || (info.file as unknown as File);
  if (!(file instanceof File)) {
    onError?.("File tidak dapat dibaca");
    return;
  }
  if (!file.type.startsWith("image/")) {
    onError?.("Pilih file gambar yang valid");
    return;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    onError?.("Ukuran gambar maksimal 10 MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      onResult(e.target.result as string, file);
    }
  };
  reader.onerror = () => onError?.("Gambar gagal dibaca");
  reader.readAsDataURL(file);
}
