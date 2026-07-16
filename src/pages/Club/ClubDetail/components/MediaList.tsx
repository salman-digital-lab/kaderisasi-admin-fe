import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Upload,
  Button,
  Space,
  Table,
  Image,
  Typography,
  Popconfirm,
  Select,
  Row,
  Col,
  Input,
  Divider,
  Skeleton,
  Tag,
  message,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import type { UploadFile, UploadProps } from "antd";
import type { ColumnsType } from "antd/es/table";

import {
  getClub,
  uploadClubImageMedia,
  addClubYoutubeMedia,
  deleteClubMedia,
} from "../../../../api/services/club";
import type { Club, MediaItem } from "../../../../types/model/club";
import {
  createMediaDeletePayload,
  createMediaRowKey,
} from "../../utils/mutation-payloads";

const { Text, Title } = Typography;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const YOUTUBE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|embed\/)|youtu\.be\/)[^\s&?]+/i;

type MediaDisplay = {
  displayUrl: string;
  isImage: boolean;
  mediaUrl: string;
};

type MediaTableItem = MediaItem & {
  tableKey: string;
};

const MediaList = () => {
  const { id } = useParams<{ id: string }>();
  const [clubData, setClubData] = useState<Club | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [deletingMediaUrl, setDeletingMediaUrl] = useState<string | null>(null);
  const [messageApi, messageContextHolder] = message.useMessage();

  const updateMedia = (media: Club["media"]): void => {
    setClubData((currentClub) =>
      currentClub ? { ...currentClub, media } : currentClub,
    );
  };

  const { loading: fetchLoading } = useRequest(() => getClub(Number(id)), {
    ready: !!id,
    onSuccess: (data) => {
      if (data) {
        setClubData(data);
      }
    },
  });

  const { loading: uploadLoading, run: uploadImage } = useRequest(
    (file: File) => uploadClubImageMedia(Number(id), file),
    {
      manual: true,
      onSuccess: (data) => {
        setFileList([]);
        updateMedia(data.media);
      },
    },
  );

  const { loading: youtubeLoading, run: addYoutube } = useRequest(
    (url: string) =>
      addClubYoutubeMedia(Number(id), {
        media_url: url,
        media_type: "video",
        video_source: "youtube",
      }),
    {
      manual: true,
      onSuccess: (data) => {
        setYoutubeUrl("");
        updateMedia(data.media);
      },
    },
  );

  const { loading: deleteLoading, runAsync: deleteMedia } = useRequest(
    (mediaUrl: string) =>
      deleteClubMedia(Number(id), createMediaDeletePayload(mediaUrl)),
    {
      manual: true,
      onSuccess: (data) => {
        updateMedia(data.media);
      },
    },
  );

  const handleImageUpload = (): void => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      uploadImage(fileList[0].originFileObj);
    }
  };

  const handleYoutubeAdd = (): void => {
    const normalizedUrl = youtubeUrl.trim();
    if (!YOUTUBE_URL_PATTERN.test(normalizedUrl)) {
      messageApi.error("Masukkan URL video YouTube yang valid.");
      return;
    }
    addYoutube(normalizedUrl);
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const isSupportedImage = ALLOWED_IMAGE_TYPES.has(file.type);
    const isWithinSizeLimit = file.size / 1024 / 1024 <= 5;

    if (!isSupportedImage) {
      messageApi.error("Gunakan gambar berformat JPG, PNG, atau WEBP.");
      return false;
    }

    if (!isWithinSizeLimit) {
      messageApi.error("Ukuran gambar maksimal 5 MB.");
      return false;
    }

    setFileList([
      {
        uid: file.uid,
        name: file.name,
        originFileObj: file,
      },
    ]);

    return false; // Prevent automatic upload
  };

  const handleDeleteMedia = async (mediaUrl: string): Promise<void> => {
    setDeletingMediaUrl(mediaUrl);
    try {
      await deleteMedia(mediaUrl);
    } catch {
      // The API service displays the error and leaves the row in place.
    } finally {
      setDeletingMediaUrl(null);
    }
  };

  const getMediaDisplay = (item: MediaItem): MediaDisplay => {
    const isImage = item.media_type === "image";
    const isYoutubeVideo =
      item.media_type === "video" && item.video_source === "youtube";

    let mediaUrl = item.media_url;
    let displayUrl = item.media_url;

    if (isImage) {
      mediaUrl = `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${item.media_url}`;
      displayUrl = item.media_url;
    } else if (isYoutubeVideo) {
      // Extract video ID for thumbnail
      const videoId = item.media_url.match(/embed\/([^?]+)/)?.[1];
      displayUrl = videoId ? `YouTube Video: ${videoId}` : "YouTube Video";
    }

    return { displayUrl, isImage, mediaUrl };
  };

  const mediaItems: MediaTableItem[] = (clubData?.media?.items || []).map(
    (item, index) => ({
      ...item,
      tableKey: createMediaRowKey(item, index),
    }),
  );

  const columns: ColumnsType<MediaTableItem> = [
    {
      title: "Pratinjau",
      key: "preview",
      width: 100,
      render: (_, item) => {
        const { isImage, mediaUrl } = getMediaDisplay(item);
        return isImage ? (
          <Image
            src={mediaUrl}
            alt={`Pratinjau media ${clubData?.name || "klub"}`}
            width={60}
            height={60}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <VideoCameraOutlined
            role="img"
            aria-label="Video YouTube"
            style={{ fontSize: 40, color: "#ff4d4f" }}
          />
        );
      },
    },
    {
      title: "Media",
      key: "media",
      render: (_, item) => {
        const { displayUrl } = getMediaDisplay(item);
        return <Text copyable={{ text: item.media_url }}>{displayUrl}</Text>;
      },
    },
    {
      title: "Tipe",
      dataIndex: "media_type",
      key: "media_type",
      width: 120,
      render: (value: MediaItem["media_type"]) => (
        <Tag color={value === "image" ? "blue" : "red"}>
          {value === "image" ? "Gambar" : "YouTube"}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 190,
      render: (_, item) => {
        const { isImage, mediaUrl } = getMediaDisplay(item);
        return (
          <Space wrap>
            <Button
              icon={<EyeOutlined />}
              href={isImage ? mediaUrl : item.media_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lihat
            </Button>
            <Popconfirm
              title="Hapus media?"
              description="Media ini akan dihapus permanen dari klub."
              onConfirm={() => handleDeleteMedia(item.media_url)}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                loading={deleteLoading && deletingMediaUrl === item.media_url}
                disabled={deleteLoading && deletingMediaUrl !== item.media_url}
              >
                Hapus
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {messageContextHolder}
      <Skeleton loading={fetchLoading}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <section>
            <Title level={4} style={{ marginTop: 0 }}>
              Tambah Media Baru
            </Title>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Text strong>Tipe Media:</Text>
                <Select
                  value={mediaType}
                  onChange={(value) => {
                    setMediaType(value);
                    setFileList([]);
                    setYoutubeUrl("");
                  }}
                  style={{ width: "100%", marginTop: 8 }}
                  aria-label="Pilih tipe media"
                  options={[
                    {
                      value: "image",
                      label: (
                        <Space size={6}>
                          <FileImageOutlined /> Gambar
                        </Space>
                      ),
                    },
                    {
                      value: "video",
                      label: (
                        <Space size={6}>
                          <VideoCameraOutlined /> Video YouTube
                        </Space>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col xs={24} md={16}>
                {mediaType === "image" ? (
                  <>
                    <Text strong>File Gambar:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Upload
                        fileList={fileList}
                        beforeUpload={beforeUpload}
                        onRemove={() => setFileList([])}
                        accept=".jpg,.jpeg,.png,.webp"
                        maxCount={1}
                        disabled={uploadLoading}
                      >
                        <Button icon={<UploadOutlined />}>Pilih Gambar</Button>
                      </Upload>
                    </div>
                  </>
                ) : (
                  <>
                    <Text strong>Link YouTube:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        aria-label="URL video YouTube"
                        disabled={youtubeLoading}
                      />
                    </div>
                  </>
                )}
              </Col>
            </Row>

            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {mediaType === "image"
                  ? "Format gambar: JPG, PNG, JPEG, WEBP. Maksimal 5MB."
                  : "Masukkan link YouTube dalam format: https://www.youtube.com/watch?v=VIDEO_ID atau https://youtu.be/VIDEO_ID"}
              </Text>
            </div>

            {(fileList.length > 0 ||
              (mediaType === "video" && youtubeUrl.trim())) && (
              <div style={{ marginTop: 16 }}>
                <Space>
                  {mediaType === "image" ? (
                    <Button
                      type="primary"
                      onClick={handleImageUpload}
                      loading={uploadLoading}
                    >
                      Upload Gambar
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={handleYoutubeAdd}
                      loading={youtubeLoading}
                    >
                      Tambah Video YouTube
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setFileList([]);
                      setYoutubeUrl("");
                    }}
                    disabled={uploadLoading || youtubeLoading}
                  >
                    Batal
                  </Button>
                </Space>
              </div>
            )}
          </section>

          <Divider style={{ margin: "4px 0" }} />
          <section>
            <Title level={4} style={{ marginTop: 0 }}>
              Daftar Media ({mediaItems.length})
            </Title>
            <Table
              rowKey="tableKey"
              dataSource={mediaItems}
              columns={columns}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} media`,
              }}
              locale={{ emptyText: "Belum ada media yang diunggah" }}
              scroll={{ x: 720 }}
            />
          </section>
        </Space>
      </Skeleton>
    </>
  );
};

export default MediaList;
