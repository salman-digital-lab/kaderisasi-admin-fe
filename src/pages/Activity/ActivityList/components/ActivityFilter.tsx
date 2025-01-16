import { Input, Col, Row, Card, Form, Button, Space, Select } from "antd";
import { useToggle } from "ahooks";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
} from "../../../../constants/options";

import { FilterType } from "../constants/type";

import ActivityForm from "./ActivityForm";
import { ACTIVITY_CATEGORY_ENUM } from "../../../../types/constants/activity";
import { ACTIVITY_TYPE_ENUM } from "../../../../types/constants/activity";

type FieldType = {
  fullname?: string;
  activity_type?: ACTIVITY_TYPE_ENUM;
  activity_category?: ACTIVITY_CATEGORY_ENUM;
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
};

const ActivityFilter = ({ setParameter, refresh }: FilterProps) => {
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
            name: val.fullname || "",
            activity_type: val.activity_type,
            activity_category: val.activity_category,
            page: 1,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama Aktivitas" name="fullname">
              <Input placeholder="Nama Aktivitas" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Tipe Aktivitas" name="activity_type">
              <Select
                placeholder="Tipe Aktivitas"
                allowClear
                options={ACTIVITY_TYPE_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item label="Kategori Aktivitas" name="activity_category">
              <Select
                placeholder="Kategori Aktivitas"
                allowClear
                options={ACTIVITY_CATEGORY_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
            <Button onClick={toggle} icon={<PlusOutlined />}>
              Tambah Kegiatan
            </Button>
          </Space>
        </Row>
      </Form>

      <ActivityForm open={state} onClose={toggle} refresh={refresh} />
    </Card>
  );
};

export default ActivityFilter;
