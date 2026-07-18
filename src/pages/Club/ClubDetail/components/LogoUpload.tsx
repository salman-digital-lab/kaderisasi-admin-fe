import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Upload,
  Button,
  Space,
  Image,
  Skeleton,
  Typography,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import type { UploadFile, UploadProps } from "antd";

import { getClub, uploadClubLogo } from "../../../../api/services/club";
import type { Club } from "../../../../types/model/club";
import {
  getImageUploadError,
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_POLICIES,
} from "../../../../utils/image-upload";

const { Text, Title } = Typography;

const LogoUpload = () => {
  const { id } = useParams<{ id: string }>();
  const [clubData, setClubData] = useState<Club | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, messageContextHolder] = message.useMessage();

  const { loading: fetchLoading, refresh } = useRequest(
    () => getClub(Number(id)),
    {
      ready: !!id,
      onSuccess: (data) => {
        if (data) {
          setClubData(data);
        }
      },
    },
  );

  const { loading: uploadLoading, run: upload } = useRequest(
    (file: File) => uploadClubLogo(Number(id), file),
    {
      manual: true,
      onSuccess: () => {
        setFileList([]);
        refresh();
      },
    },
  );

  const handleUpload = () => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      upload(fileList[0].originFileObj);
    }
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    const error = getImageUploadError(file, IMAGE_UPLOAD_POLICIES.clubLogo);
    if (error) {
      messageApi.error(error);
      return Upload.LIST_IGNORE;
    }

    setFileList([
      {
        uid: "-1",
        name: file.name,
        originFileObj: file,
      } as UploadFile,
    ]);

    return false; // Prevent automatic upload
  };

  return (
    <>
      {messageContextHolder}
      <Skeleton loading={fetchLoading}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            Logo Klub
          </Title>
          {clubData?.logo && (
            <div>
              <Text strong>Logo Saat Ini:</Text>
              <div style={{ marginTop: 8 }}>
                <Image
                  src={`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${clubData.logo}`}
                  alt="Logo klub"
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
                accept={IMAGE_UPLOAD_ACCEPT}
                maxCount={1}
                disabled={uploadLoading}
              >
                <Button icon={<UploadOutlined />} disabled={uploadLoading}>
                  Pilih File
                </Button>
              </Upload>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {IMAGE_UPLOAD_POLICIES.clubLogo.guidance}
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
              <Button onClick={() => setFileList([])}>Batal</Button>
            </Space>
          )}
        </Space>
      </Skeleton>
    </>
  );
};

export default LogoUpload;
