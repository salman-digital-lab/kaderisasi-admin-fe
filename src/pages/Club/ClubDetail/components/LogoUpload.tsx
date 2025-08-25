import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Upload, Button, Space, Image, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import type { UploadFile } from "antd";

import { getClub, uploadClubLogo } from "../../../../api/services/club";
import { Club } from "../../../../types/model/club";

const { Text } = Typography;

const LogoUpload = () => {
  const { id } = useParams<{ id: string }>();
  const [clubData, setClubData] = useState<Club | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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

  const { loading: uploadLoading, run: upload } = useRequest(
    (file: File) => uploadClubLogo(Number(id), file),
    {
      manual: true,
      onSuccess: () => {
        setFileList([]);
        refresh();
      },
    }
  );

  const handleUpload = () => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      upload(fileList[0].originFileObj);
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isLt2M = file.size / 1024 / 1024 < 2;

    if (!isImage) {
      alert('Hanya file gambar yang diperbolehkan!');
      return false;
    }
    if (!isLt2M) {
      alert('File harus lebih kecil dari 2MB!');
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

  if (fetchLoading) {
    return <Card loading />;
  }

  return (
    <Card title="Logo Club">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {clubData?.logo && (
          <div>
            <Text strong>Logo Saat Ini:</Text>
            <div style={{ marginTop: 8 }}>
              <Image
                src={`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${clubData.logo}`}
                alt="Club Logo"
                style={{ maxWidth: 200, maxHeight: 200 }}
              />
            </div>
          </div>
        )}

        <div>
          <Text strong>Upload Logo Baru:</Text>
          <div style={{ marginTop: 8 }}>
            <Upload
              fileList={fileList}
              beforeUpload={beforeUpload}
              onRemove={() => setFileList([])}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Pilih File</Button>
            </Upload>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                Format yang didukung: JPG, PNG, JPEG, WEBP. Maksimal 2MB.
              </Text>
            </div>
          </div>
        </div>

        {fileList.length > 0 && (
          <Space>
            <Button 
              type="primary" 
              onClick={handleUpload}
              loading={uploadLoading}
            >
              Upload Logo
            </Button>
            <Button onClick={() => setFileList([])}>
              Batal
            </Button>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default LogoUpload;
