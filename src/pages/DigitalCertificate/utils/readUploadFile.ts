import type { UploadFile } from "antd";
import {
  getImageUploadError,
  IMAGE_UPLOAD_POLICIES,
} from "../../../utils/image-upload";

export function getValidatedUploadFile(
  info: { file: UploadFile },
  onError?: (errorMessage: string) => void,
): File | null {
  const file = info.file.originFileObj || (info.file as unknown as File);
  if (!(file instanceof File)) {
    onError?.("File tidak dapat dibaca");
    return null;
  }
  const error = getImageUploadError(file, IMAGE_UPLOAD_POLICIES.certificate);
  if (error) {
    onError?.(error);
    return null;
  }
  return file;
}
