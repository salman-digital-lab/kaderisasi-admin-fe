import { Alert, Button, Upload } from "antd";
import type { UploadFile } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useState, type ReactElement } from "react";
import {
  getImageUploadError,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_POLICIES,
  MAX_ACTIVITY_IMAGES,
} from "../../../utils/image-upload";

export default function DraftPosters({
  files,
  disabled,
  savedCount,
  onChange,
}: {
  files: File[];
  disabled: boolean;
  savedCount: number;
  onChange: (files: File[]) => void;
}): ReactElement {
  const [error, setError] = useState("");
  const [previews, setPreviews] = useState<UploadFile[]>([]);
  useEffect(() => {
    const items = files.map((file, index) => ({
      uid: String(index),
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setPreviews(items);
    return () => items.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);
  return (
    <>
      {error && <Alert type="error" showIcon title={error} />}
      <Upload
        accept={IMAGE_UPLOAD_ACCEPT}
        listType="picture"
        fileList={previews}
        disabled={disabled}
        beforeUpload={(file) => {
          const problem = getImageUploadError(
            file,
            IMAGE_UPLOAD_POLICIES.activity,
          );
          if (problem || files.length + savedCount >= MAX_ACTIVITY_IMAGES) {
            setError(problem ?? `Maksimal ${MAX_ACTIVITY_IMAGES} poster.`);
            return Upload.LIST_IGNORE;
          }
          setError("");
          onChange([...files, file]);
          return false;
        }}
        onRemove={(file) => {
          onChange(files.filter((_, index) => String(index) !== file.uid));
          return true;
        }}
        showUploadList={{ showPreviewIcon: false }}
      >
        <Button
          icon={<PlusOutlined />}
          disabled={
            disabled || files.length + savedCount >= MAX_ACTIVITY_IMAGES
          }
        >
          Pilih poster
        </Button>
      </Upload>
      <p>
        {IMAGE_UPLOAD_POLICIES.activity.guidance} Maksimal {MAX_ACTIVITY_IMAGES}{" "}
        poster. Poster pertama menjadi gambar utama.
      </p>
    </>
  );
}
