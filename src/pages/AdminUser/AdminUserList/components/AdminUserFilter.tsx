import React, { useState } from "react";
import { Input, Col, Row, Button, Card, Form, Space } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import AddAdminUser from "./modal/AddAdminUser";

type FieldType = {
  name?: string;
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
};

const AdminUserFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <AddAdminUser isOpen={isOpen} setIsOpen={setIsOpen} />
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
            <Form.Item label="Email" name="name">
              <Input placeholder="Email" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setIsOpen(true)}
            >
              Tambah
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default AdminUserFilter;
