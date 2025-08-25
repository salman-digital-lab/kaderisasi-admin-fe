import { Input, Col, Row, Card, Form, Button, Space } from "antd";
import { useToggle } from "ahooks";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

import { FilterType } from "../constants/type";
import ClubForm from "./ClubForm";

type FieldType = {
  name?: string;
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
};

const ClubFilter = ({ setParameter, refresh }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();
  const [state, { toggle }] = useToggle(false);

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
          <Col span={8}>
            <Form.Item label="Nama Club" name="name">
              <Input placeholder="Nama Club" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
            <Button onClick={toggle} icon={<PlusOutlined />}>
              Tambah Club
            </Button>
          </Space>
        </Row>
      </Form>

      <ClubForm open={state} onClose={toggle} refresh={refresh} />
    </Card>
  );
};

export default ClubFilter;
