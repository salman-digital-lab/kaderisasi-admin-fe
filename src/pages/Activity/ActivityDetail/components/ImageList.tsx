import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

import type { GetProp, UploadFile, UploadProps } from "antd";

import { Card, Typography, Upload, Image } from "antd";
import { useParams } from "react-router-dom";
import {
  getActivity,
  postActivityImages,
  putRemoveActivityImage,
} from "../../../../api/services/activity";
import { useRequest } from "ahooks";

const { Title } = Typography;

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const ImageList = () => {
  const { id } = useParams<{ id: string }>();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <Card loading={loading}>
      <Title level={3}>Gambar/Poster</Title>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onRemove={async (file) => {
          const index = fileList.indexOf(file);
          await putRemoveActivityImage(Number(id) || 0, { index });

          const newFileList = fileList.slice();
          newFileList.splice(index, 1);
          setFileList(newFileList);
        }}
        beforeUpload={async (file) => {
          const uploadKey = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
          const uploadedFile = new File([file], uploadKey, {
            type: file.type,
          });
          await postActivityImages(Number(id) || 0, uploadedFile);
          setFileList([
            ...fileList,
            { ...file, originFileObj: file, name: uploadKey },
          ]);
          return false;
        }}
      >
        {fileList.length >= 8 ? null : uploadButton}
      </Upload>
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
    </Card>
  );
};

export default ImageList;
