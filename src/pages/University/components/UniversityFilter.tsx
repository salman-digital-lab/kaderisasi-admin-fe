import React from "react";
import { Input, Col, Row, Button, Card, Form, Space } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

type FieldType = {
  name?: string;
};

interface FilterProps {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
  openModal: () => void;
}

const UniversitiesFilter = ({ setParameter, openModal }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();

  return (
    <Card>
      <Form
        layout="vertical"
        form={form}
        onFinish={(val) =>
          setParameter((prev) => ({
            ...prev,
            name: val.name || "",
            page: 1,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama Universitas" name="name">
              <Input placeholder="Nama Universitas" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
            <Button onClick={openModal} icon={<PlusOutlined />}>
              Tambah Universitas
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default UniversitiesFilter;
