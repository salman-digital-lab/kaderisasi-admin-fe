import type { UploadFile } from "antd";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function getValidatedUploadFile(
  info: { file: UploadFile },
  onError?: (errorMessage: string) => void,
): File | null {
  const file = info.file.originFileObj || (info.file as unknown as File);
  if (!(file instanceof File)) {
    onError?.("File tidak dapat dibaca");
    return null;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    onError?.("Gunakan gambar JPG, PNG, atau WebP");
    return null;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    onError?.("Ukuran gambar maksimal 5 MB");
    return null;
  }
  return file;
}
