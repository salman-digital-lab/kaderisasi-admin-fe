import { useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Card, 
  Upload, 
  Button, 
  Space, 
  List, 
  Image, 
  Typography, 
  Popconfirm, 
  Select, 
  Row, 
  Col,
  Input 
} from "antd";
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  VideoCameraOutlined,
  FileImageOutlined 
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import type { UploadFile } from "antd";

import { 
  getClub, 
  uploadClubImageMedia,
  addClubYoutubeMedia, 
  deleteClubMedia 
} from "../../../../api/services/club";
import { Club, MediaItem } from "../../../../types/model/club";

const { Text } = Typography;
const { Option } = Select;

const MediaList = () => {
  const { id } = useParams<{ id: string }>();
  const [clubData, setClubData] = useState<Club | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const { loading: fetchLoading, refresh } = useRequest(
    () => getClub(Number(id)),
    {
      ready: !!id,
      onSuccess: (data) => {
        if (data) {
          setClubData(data);
        }
      },
    }
  );

  const { loading: uploadLoading, run: uploadImage } = useRequest(
    (file: File) => uploadClubImageMedia(Number(id), file),
    {
      manual: true,
      onSuccess: () => {
        setFileList([]);
        refresh();
      },
    }
  );

  const { loading: youtubeLoading, run: addYoutube } = useRequest(
    (url: string) => addClubYoutubeMedia(Number(id), {
      media_url: url,
      media_type: "video",
      video_source: "youtube"
    }),
    {
      manual: true,
      onSuccess: () => {
        setYoutubeUrl("");
        refresh();
      },
    }
  );

  const { loading: deleteLoading, run: deleteMedia } = useRequest(
    (index: number) => deleteClubMedia(Number(id), { index }),
    {
      manual: true,
      onSuccess: () => {
        refresh();
      },
    }
  );

  const handleImageUpload = () => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      uploadImage(fileList[0].originFileObj);
    }
  };

  const handleYoutubeAdd = () => {
    if (youtubeUrl.trim()) {
      addYoutube(youtubeUrl.trim());
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      alert('Hanya file gambar yang diperbolehkan!');
      return false;
    }

    if (!isLt5M) {
      alert('File harus lebih kecil dari 5MB!');
      return false;
    }

    setFileList([{
      uid: '-1',
      name: file.name,
      status: 'done',
      originFileObj: file,
    } as UploadFile]);
    
    return false; // Prevent automatic upload
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    const isImage = item.media_type === "image";
    const isYoutubeVideo = item.media_type === "video" && item.video_source === "youtube";
    
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

    return (
      <List.Item
        actions={[
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              if (isImage) {
                // Show image preview
                const img = document.createElement('img');
                img.src = mediaUrl;
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(img.outerHTML);
                }
              } else if (isYoutubeVideo) {
                // Open YouTube video in new tab
                window.open(item.media_url, '_blank');
              }
            }}
          >
            Lihat
          </Button>,
          <Popconfirm
            title="Hapus Media"
            description="Apakah Anda yakin ingin menghapus media ini?"
            onConfirm={() => deleteMedia(index)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              loading={deleteLoading}
            >
              Hapus
            </Button>
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            isImage ? (
              <Image
                src={mediaUrl}
                alt="Media"
                style={{ width: 60, height: 60, objectFit: "cover" }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
              />
            ) : (
              <VideoCameraOutlined style={{ fontSize: 40, color: "#ff4d4f" }} />
            )
          }
          title={displayUrl}
          description={
            isYoutubeVideo 
              ? "YouTube Video" 
              : `Tipe: ${item.media_type}`
          }
        />
      </List.Item>
    );
  };

  if (fetchLoading) {
    return <Card loading />;
  }

  return (
    <Card title="Media Club">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Tambah Media Baru" size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Tipe Media:</Text>
              <Select
                value={mediaType}
                onChange={(value) => {
                  setMediaType(value);
                  setFileList([]);
                  setYoutubeUrl("");
                }}
                style={{ width: '100%', marginTop: 8 }}
              >
                <Option value="image">
                  <FileImageOutlined /> Gambar
                </Option>
                <Option value="video">
                  <VideoCameraOutlined /> Video YouTube
                </Option>
              </Select>
            </Col>
            <Col span={16}>
              {mediaType === "image" ? (
                <>
                  <Text strong>File Gambar:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Upload
                      fileList={fileList}
                      beforeUpload={beforeUpload}
                      onRemove={() => setFileList([])}
                      accept="image/*"
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
                : "Masukkan link YouTube dalam format: https://www.youtube.com/watch?v=VIDEO_ID atau https://youtu.be/VIDEO_ID"
              }
            </Text>
          </div>

          {(fileList.length > 0 || (mediaType === "video" && youtubeUrl.trim())) && (
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
                <Button onClick={() => {
                  setFileList([]);
                  setYoutubeUrl("");
                }}>
                  Batal
                </Button>
              </Space>
            </div>
          )}
        </Card>

        <Card title={`Daftar Media (${clubData?.media?.items?.length || 0})`} size="small">
          {clubData?.media?.items && clubData.media.items.length > 0 ? (
            <List
              dataSource={clubData.media.items}
              renderItem={renderMediaItem}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} media`,
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              Belum ada media yang diupload
            </div>
          )}
        </Card>
      </Space>
    </Card>
  );
};

export default MediaList;
