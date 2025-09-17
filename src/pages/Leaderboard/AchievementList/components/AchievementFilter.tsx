import React from "react";
import { Row, Button, Card, Form, Space, Col, Select, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { ACHIEVEMENT_STATUS_ENUM, ACHIEVEMENT_TYPE_ENUM } from "../../../../types/constants/achievement";
import { ACHIEVEMENT_STATUS_OPTIONS, ACHIEVEMENT_TYPE_OPTIONS } from "../../../../constants/options";
type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: ACHIEVEMENT_STATUS_ENUM;
      email?: string;
      name?: string;
      type?: ACHIEVEMENT_TYPE_ENUM;
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
            email: val.email,
            name: val.name,
            type: val.type,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama" name="name">
              <Input
                placeholder="Cari berdasarkan nama"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Kategori" name="type">
              <Select
                placeholder="Kategori"
                allowClear
                options={ACHIEVEMENT_TYPE_OPTIONS}
              />
            </Form.Item>
          </Col>
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
