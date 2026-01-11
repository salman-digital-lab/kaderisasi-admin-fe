import { useState } from "react";
import { Button, Typography, notification, Flex, Alert, Skeleton } from "antd";
import { useParams } from "react-router-dom";
import { SaveOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

import { RichTextEditor } from "../../../../components/common/RichTextEditor";
import { getActivity, putActivity } from "../../../../api/services/activity";

const { Title } = Typography;

const ActivityDescription = () => {
  const { id } = useParams<{ id: string }>();

  const [description, setDescription] = useState("");

  const { loading } = useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      setDescription(data?.description || "");
    },
  });

  const { loading: editLoading, runAsync } = useRequest(putActivity, {
    manual: true,
  });

  return (
    <Skeleton loading={loading}>
      <div>
        <Flex justify="space-between" align="middle">
          <Alert
            message="Deskripsi kegiatan tidak boleh kosong, tidak boleh mencantumkan link web kaderisasi, dan tidak perlu memiliki hashtag"
            type="warning"
            showIcon
          />
          <Button
            type="primary"
            loading={editLoading}
            icon={<SaveOutlined />}
            onClick={async () => {
              await runAsync(Number(id), { description: description });
              notification.success({
                message: "Berhasil",
                description: "Data berhasil diubah",
              });
            }}
          >
            Simpan
          </Button>
        </Flex>
        <Title level={3} style={{ marginTop: 10 }}>
          Deskripsi
        </Title>
        <RichTextEditor
          minHeight="calc(100vh - 400px)"
          value={description}
          onChange={(value) => setDescription(value)}
        />
      </div>
    </Skeleton>
  );
};

export default ActivityDescription;
