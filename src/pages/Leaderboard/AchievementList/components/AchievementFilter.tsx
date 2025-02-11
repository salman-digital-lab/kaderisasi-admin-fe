import React from "react";
import { Row, Button, Card, Form, Space, Col, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ACHIEVEMENT_STATUS_ENUM } from "../../../../types/constants/achievement";
import { ACHIEVEMENT_STATUS_OPTIONS } from "../../../../constants/options";
type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: ACHIEVEMENT_STATUS_ENUM;
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
        onFinish={(val) =>
          setParameter((prev) => ({
            ...prev,
            page: 1,
            status: val.status,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Status" name="status">
              <Select
                placeholder="Status"
                allowClear
                options={ACHIEVEMENT_STATUS_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>
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
