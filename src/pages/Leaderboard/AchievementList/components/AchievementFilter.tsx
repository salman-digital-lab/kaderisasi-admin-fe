import React from "react";
import { Row, Button, Card, Form, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
    }>
  >;
};

const AchievementFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm();

  return (
    <Card>
      <Form
        layout="vertical"
        form={form}
        onFinish={() =>
          setParameter((prev) => ({
            ...prev,
            page: 1,
          }))
        }
      >
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default AchievementFilter;
