import type { UploadFile } from "antd";

/**
 * Reads a file from an Ant Design Upload event as a base64 data URL.
 * Consolidates the duplicated FileReader logic used across
 * ElementToolbar, PropertyPanel, etc.
 */
export function readUploadFileAsDataUrl(
  info: { file: UploadFile },
  onResult: (dataUrl: string, file: File) => void,
) {
  const file = info.file.originFileObj || (info.file as unknown as File);
  if (!(file instanceof File)) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      onResult(e.target.result as string, file);
    }
  };
  reader.readAsDataURL(file);
}
