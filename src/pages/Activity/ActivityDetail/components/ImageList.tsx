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

import type { UploadProps } from "antd";
import {
  Typography,
  Upload,
  Image,
  notification,
  Spin,
  Tooltip,
  Button,
  Skeleton,
  Popconfirm,
} from "antd";
import { useParams } from "react-router-dom";
import {
  getActivity,
  postActivityImages,
  putRemoveActivityImage,
  putReorderActivityImages,
} from "../../../../api/services/activity";
import { useRequest } from "ahooks";
import {
  getImageUploadError,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_POLICIES,
  MAX_ACTIVITY_IMAGES,
} from "../../../../utils/image-upload";

const { Title, Text } = Typography;

interface ImageItem {
  uid: string;
  name: string;
  url: string;
}

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
  onRemove: (item: ImageItem) => void;
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
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Ubah urutan gambar ${index + 1}`}
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
                padding: 0,
                border: 0,
              }}
            >
              <HolderOutlined style={{ color: "#fff", fontSize: 12 }} />
            </button>
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
                  aria-label={`Pratinjau gambar ${index + 1}`}
                  style={{ padding: 2, minWidth: 24, height: 24 }}
                />
              </Tooltip>
              <Tooltip title="Hapus">
                <Popconfirm
                  title="Hapus gambar?"
                  description="Gambar akan dihapus permanen dari aktivitas."
                  okText="Hapus"
                  cancelText="Batal"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onRemove(item)}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <DeleteOutlined
                        style={{ color: "#ff4d4f", fontSize: 14 }}
                      />
                    }
                    aria-label={`Hapus gambar ${index + 1}`}
                    style={{ padding: 2, minWidth: 24, height: 24 }}
                  />
                </Popconfirm>
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

  const handleRemove = async (item: ImageItem) => {
    setRemovingId(item.uid);
    try {
      await putRemoveActivityImage(Number(id) || 0, { image: item.name });
      setFileList((currentFiles) =>
        currentFiles.filter((currentItem) => currentItem.uid !== item.uid),
      );
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

  const handleUpload: UploadProps["beforeUpload"] = async (file) => {
    const error = getImageUploadError(file, IMAGE_UPLOAD_POLICIES.activity);
    if (error) {
      notification.error({
        message: "Gagal",
        description: error,
      });
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const uploaded = await postActivityImages(Number(id) || 0, file);
      const imageKey = uploaded.image;
      setFileList((currentFiles) => [
        ...currentFiles,
        {
          uid: imageKey,
          name: imageKey,
          url: `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${imageKey}`,
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
              {fileList.length < MAX_ACTIVITY_IMAGES && (
                <Upload
                  showUploadList={false}
                  beforeUpload={handleUpload}
                  accept={IMAGE_UPLOAD_ACCEPT}
                  disabled={uploading}
                >
                  <button
                    type="button"
                    aria-label="Tambah gambar aktivitas"
                    disabled={uploading}
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
                      padding: 0,
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
                  </button>
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
            {fileList.length}/{MAX_ACTIVITY_IMAGES} gambar
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {IMAGE_UPLOAD_POLICIES.activity.guidance}
          </Text>
        </div>

        {/* Preview modal */}
        {previewImage && (
          <Image
            styles={{ root: { display: "none" } }}
            preview={{
              open: previewOpen,
              onOpenChange: (visible) => setPreviewOpen(visible),
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
