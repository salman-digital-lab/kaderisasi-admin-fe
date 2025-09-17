import { Input, Col, Row, Card, Form, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type FieldType = {
  name?: string;
  email?: string;
};

interface LifetimeLeaderboardFilterProps {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      email: string;
      name: string;
    }>
  >;
}

export default function LifetimeLeaderboardFilter({
  setParameter,
}: LifetimeLeaderboardFilterProps) {
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
            email: val.email || "",
            page: 1,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama" name="name">
              <Input placeholder="Nama" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
            Cari
          </Button>
        </Row>
      </Form>
    </Card>
  );
}
