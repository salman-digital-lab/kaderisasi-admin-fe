import { useState } from "react";
import { Button, Card, Typography, notification, Flex } from "antd";
import { useParams } from "react-router-dom";
import { SaveOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

import QuillEditor from "../../../../components/common/RichTextEditor";
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
    <Card loading={loading}>
      <Flex justify="end" align="middle">
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
      <Title level={3}>Deskripsi</Title>
      <QuillEditor
        style={{ minHeight: "calc(100vh - 400px)" }}
        value={description}
        onChange={(value) => setDescription(value)}
      />
    </Card>
  );
};

export default ActivityDescription;
