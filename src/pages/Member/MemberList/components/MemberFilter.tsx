import { Input, Col, Row, Card, Form, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type FieldType = {
  fullname?: string;
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

const MemberFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();

  return (
    <Card>
      <Form
        layout="vertical"
        form={form}
        onFinish={(val) =>
          setParameter((prev) => ({
            ...prev,
            name: val.fullname || "",
            page: 1,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama Jamaah" name="fullname">
              <Input placeholder="Nama Jamaah" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
            Cari
          </Button>
        </Row>
      </Form>
    </Card>
  );
};

export default MemberFilter;
