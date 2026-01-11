import { useState, useCallback } from "react";
import {
  PlusOutlined,
  HolderOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { GetProp, UploadProps } from "antd";
import {
  Typography,
  Upload,
  Image,
  notification,
  Spin,
  Tooltip,
  Button,
  Skeleton,
} from "antd";
import { useParams } from "react-router-dom";
import {
  getActivity,
  postActivityImages,
  putRemoveActivityImage,
  putReorderActivityImages,
} from "../../../../api/services/activity";
import { useRequest } from "ahooks";
import { RcFile } from "antd/es/upload";

const { Title, Text } = Typography;

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

interface ImageItem {
  uid: string;
  name: string;
  url: string;
}

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// Sortable image item component
const SortableImageItem = ({
  item,
  index,
  onPreview,
  onRemove,
  isRemoving,
}: {
  item: ImageItem;
  index: number;
  onPreview: (url: string) => void;
  onRemove: (item: ImageItem, index: number) => void;
  isRemoving: string | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.uid });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const isBeingRemoved = isRemoving === item.uid;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: 8,
          overflow: "hidden",
          position: "relative",
          border: isDragging ? "2px dashed #1677ff" : "1px solid #e8e8e8",
          background: "#fafafa",
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        {isBeingRemoved ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin />
          </div>
        ) : (
          <>
            <img
              src={item.url}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Index indicator */}
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                width: 20,
                height: 20,
                borderRadius: 4,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index + 1}
            </div>
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                borderRadius: 4,
                background: "rgba(0,0,0,0.5)",
                cursor: "grab",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HolderOutlined style={{ color: "#fff", fontSize: 12 }} />
            </div>
            {/* Action buttons overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "6px",
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Tooltip title="Lihat">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined style={{ color: "#fff", fontSize: 14 }} />}
                  onClick={() => onPreview(item.url)}
                  style={{ padding: 2, minWidth: 24, height: 24 }}
                />
              </Tooltip>
              <Tooltip title="Hapus">
                <Button
                  type="text"
                  size="small"
                  icon={
                    <DeleteOutlined
                      style={{ color: "#ff4d4f", fontSize: 14 }}
                    />
                  }
                  onClick={() => onRemove(item, index)}
                  style={{ padding: 2, minWidth: 24, height: 24 }}
                />
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ImageList = () => {
  const { id } = useParams<{ id: string }>();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { loading } = useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      setFileList(
        data?.additional_config.images?.map((imageFile) => ({
          uid: imageFile,
          name: imageFile,
          url: `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${imageFile}`,
        })) || [],
      );
    },
  });

  const handlePreview = (url: string) => {
    setPreviewImage(url);
    setPreviewOpen(true);
  };

  const handleRemove = async (item: ImageItem, index: number) => {
    setRemovingId(item.uid);
    try {
      await putRemoveActivityImage(Number(id) || 0, { index });
      const newFileList = fileList.filter((_, i) => i !== index);
      setFileList(newFileList);
      notification.success({
        message: "Berhasil",
        description: "Gambar berhasil dihapus",
      });
    } catch {
      notification.error({
        message: "Gagal",
        description: "Gagal menghapus gambar",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = fileList.findIndex((item) => item.uid === active.id);
        const newIndex = fileList.findIndex((item) => item.uid === over.id);

        const newFileList = arrayMove(fileList, oldIndex, newIndex);
        setFileList(newFileList);

        // Save new order to backend
        try {
          await putReorderActivityImages(Number(id) || 0, {
            images: newFileList.map((item) => item.name),
          });
          notification.success({
            message: "Berhasil",
            description: "Urutan gambar berhasil diubah",
          });
        } catch {
          // Revert on error
          setFileList(fileList);
          notification.error({
            message: "Gagal",
            description: "Gagal mengubah urutan gambar",
          });
        }
      }
    },
    [fileList, id],
  );

  const handleUpload = async (file: RcFile) => {
    const isCorrectImageType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg" ||
      file.type === "image/webp";
    if (!isCorrectImageType) {
      notification.error({
        message: "Gagal",
        description:
          "Hanya dapat mengupload file Gambar dengan format JPG, PNG, atau WebP",
      });
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 1;
    if (!isLt2M) {
      notification.error({
        message: "Gagal",
        description: "Ukuran gambar harus lebih kecil dari 1MB",
      });
      return false;
    }

    setUploading(true);
    try {
      const uploadKey = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const uploadedFile = new File([file], uploadKey, {
        type: file.type,
      });
      await postActivityImages(Number(id) || 0, uploadedFile);
      setFileList([
        ...fileList,
        {
          uid: uploadKey,
          name: uploadKey,
          url: await getBase64(file),
        },
      ]);
      notification.success({
        message: "Berhasil",
        description: "Gambar berhasil diunggah",
      });
    } catch {
      notification.error({
        message: "Gagal",
        description: "Gagal mengupload gambar",
      });
    } finally {
      setUploading(false);
    }
    return false;
  };

  return (
    <Skeleton loading={loading}>
      <div
        style={{
          borderRadius: 8,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
            Galeri Gambar
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Seret gambar untuk mengatur urutan. Gambar pertama akan menjadi
            gambar utama.
          </Text>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fileList.map((f) => f.uid)}
            strategy={rectSortingStrategy}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                padding: 16,
                background: "#f5f5f5",
                borderRadius: 8,
                minHeight: 160,
              }}
            >
              {fileList.map((item, index) => (
                <SortableImageItem
                  key={item.uid}
                  item={item}
                  index={index}
                  onPreview={handlePreview}
                  onRemove={handleRemove}
                  isRemoving={removingId}
                />
              ))}

              {/* Upload button */}
              {fileList.length < 8 && (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleUpload}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  disabled={uploading}
                >
                  <div
                    style={{
                      width: 128,
                      height: 128,
                      borderRadius: 8,
                      border: "2px dashed #d9d9d9",
                      background: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: uploading ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!uploading) {
                        e.currentTarget.style.borderColor = "#1677ff";
                        e.currentTarget.style.background = "#f0f5ff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#d9d9d9";
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    {uploading ? (
                      <Spin />
                    ) : (
                      <>
                        <PlusOutlined
                          style={{ fontSize: 24, color: "#8c8c8c" }}
                        />
                        <Text
                          type="secondary"
                          style={{ marginTop: 8, fontSize: 12 }}
                        >
                          Tambah Gambar
                        </Text>
                      </>
                    )}
                  </div>
                </Upload>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Empty state */}
        {fileList.length === 0 && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "#8c8c8c",
            }}
          >
            <Text type="secondary">
              Belum ada gambar. Klik tombol di atas untuk menambahkan.
            </Text>
          </div>
        )}

        {/* Image count indicator */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            {fileList.length}/8 gambar
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Format: JPG, PNG, WebP • Maks: 1MB
          </Text>
        </div>

        {/* Preview modal */}
        {previewImage && (
          <Image
            wrapperStyle={{ display: "none" }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(""),
            }}
            src={previewImage}
          />
        )}
      </div>
    </Skeleton>
  );
};

export default ImageList;
