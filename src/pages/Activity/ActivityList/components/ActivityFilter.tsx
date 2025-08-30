import { Input, Col, Row, Card, Form, Button, Space, Select } from "antd";
import { useToggle, useDebounce } from "ahooks";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
} from "../../../../constants/options";

import { FilterType } from "../constants/type";

import ActivityForm from "./ActivityForm";
import { ACTIVITY_CATEGORY_ENUM } from "../../../../types/constants/activity";
import { ACTIVITY_TYPE_ENUM } from "../../../../types/constants/activity";

type FieldType = {
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
  const [searchValue, setSearchValue] = useState<string>("");

  // Debounce search input for better performance
  const debouncedSearchValue = useDebounce(searchValue, { wait: 500 });

  // Auto-search when debounced value changes
  useEffect(() => {
    setParameter((prev) => ({
      ...prev,
      name: debouncedSearchValue,
      page: 1,
    }));
  }, [debouncedSearchValue, setParameter]);

  const handleSearch = () => {
    const formValues = form.getFieldsValue();
    setParameter((prev) => ({
      ...prev,
      name: searchValue,
      activity_type: formValues.activity_type,
      activity_category: formValues.activity_category,
      page: 1,
    }));
  };

  return (
    <Card>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSearch}
        onValuesChange={(changedValues) => {
          // Auto-apply filters for selects (except search)
          if (
            changedValues.activity_type !== undefined ||
            changedValues.activity_category !== undefined
          ) {
            const formValues = form.getFieldsValue();
            setParameter((prev) => ({
              ...prev,
              activity_type: formValues.activity_type,
              activity_category: formValues.activity_category,
              page: 1,
            }));
          }
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Nama Aktivitas">
              <Input
                placeholder="Ketik untuk mencari..."
                allowClear
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onPressEnter={handleSearch}
                suffix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Tipe Aktivitas" name="activity_type">
              <Select
                placeholder="Pilih tipe aktivitas"
                allowClear
                options={ACTIVITY_TYPE_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item label="Kategori Aktivitas" name="activity_category">
              <Select
                placeholder="Pilih kategori aktivitas"
                allowClear
                options={ACTIVITY_CATEGORY_OPTIONS}
              />
            </Form.Item>
          </Col>

          <Col span={6} style={{ display: "flex", alignItems: "end" }}>
            <Form.Item style={{ marginBottom: 0, width: "100%" }}>
              <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                <Button
                  onClick={toggle}
                  icon={<PlusOutlined />}
                  type="primary"
                  title="Tambah aktivitas baru"
                >
                  Tambah Kegiatan
                </Button>
                <Button
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  title="Cari aktivitas"
                >
                  Cari
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <ActivityForm open={state} onClose={toggle} refresh={refresh} />
    </Card>
  );
};

export default ActivityFilter;
