import { Input, Col, Row, Card, Form, Button, DatePicker } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

type FieldType = {
  name?: string;
  email?: string;
  monthYear?: dayjs.Dayjs;
};

interface MonthlyLeaderboardFilterProps {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      month: string;
      year: string;
      email: string;
      name: string;
    }>
  >;
}

export default function MonthlyLeaderboardFilter({
  setParameter,
}: MonthlyLeaderboardFilterProps) {
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
            month: val.monthYear ? String(val.monthYear.month() + 1) : "",
            year: val.monthYear ? String(val.monthYear.year()) : "",
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
          <Col span={6}>
            <Form.Item label="Bulan & Tahun" name="monthYear">
              <DatePicker.MonthPicker
                placeholder="Pilih bulan dan tahun"
                style={{ width: "100%" }}
                format="MMMM YYYY"
                allowClear
              />
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
