import { Input, Col, Row, Form, Select, Button } from "antd";
import { useDebounce } from "ahooks";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
} from "../../../../constants/options";

import { FilterType } from "../constants/type";
import { ACTIVITY_CATEGORY_ENUM } from "../../../../types/constants/activity";
import { ACTIVITY_TYPE_ENUM } from "../../../../types/constants/activity";

type FieldType = {
  activity_type?: ACTIVITY_TYPE_ENUM;
  activity_category?: ACTIVITY_CATEGORY_ENUM;
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
  onCreate: () => void;
};

const ActivityFilter = ({ setParameter, onCreate }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();
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
      style={{ marginBottom: 0 }}
    >
      <Row gutter={12} align="bottom">
        <Col xs={24} md={8}>
          <Form.Item label="Pencarian" style={{ marginBottom: 0 }}>
            <Input
              placeholder="Cari nama aktivitas..."
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
            />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item
            label="Tipe"
            name="activity_type"
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Semua Tipe"
              allowClear
              options={ACTIVITY_TYPE_OPTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={12} md={6}>
          <Form.Item
            label="Kategori"
            name="activity_category"
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Semua Kategori"
              allowClear
              options={ACTIVITY_CATEGORY_OPTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={4}>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreate}
              block
            >
              Tambah
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default ActivityFilter;
