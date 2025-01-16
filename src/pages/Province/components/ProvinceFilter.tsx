import React from "react";
import { Input, Col, Row, Button, Card, Form, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type FieldType = {
  name?: string;
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      // page: number;
      // per_page: number;
      name: string;
    }>
  >;
};

const ProvinceFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();
  // const [state, { toggle }] = useToggle(false);

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
            <Form.Item label="Nama Provinsi" name="name">
              <Input placeholder="Nama Provinsi" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
            {/* <Button onClick={openModal} icon={<PlusOutlined />}>
              Tambah Provinsi
            </Button> */}
          </Space>
        </Row>
      </Form>
      {/* <ProvinceForm open={state} onClose={() => toggle()} /> */}
    </Card>
  );
};

export default ProvinceFilter;
