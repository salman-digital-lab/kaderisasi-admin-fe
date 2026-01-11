import { useState } from "react";
import {
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Collapse,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import { getUniversities } from "../../../../api/services/university";
import { getProvinces } from "../../../../api/services/province";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../constants/options";

export interface FilterValues {
  search?: string;
  status?: string;
  university_id?: string;
  province_id?: string;
  intake_year?: string;
}

interface FilterPanelProps {
  onSearch: (values: FilterValues) => void;
  customSelectionStatus?: string[];
  loading?: boolean;
}

const FilterPanel = ({
  onSearch,
  customSelectionStatus = [],
  loading,
}: FilterPanelProps) => {
  const [form] = Form.useForm<FilterValues>();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Fetch universities for dropdown
  const { data: universities } = useRequest(
    () => getUniversities({ page: "1", per_page: "500" }),
    {
      cacheKey: "universities-list",
    },
  );

  // Fetch provinces for dropdown
  const { data: provinces } = useRequest(() => getProvinces({}), {
    cacheKey: "provinces-list",
  });

  // Generate intake year options (last 10 years)
  const currentYear = new Date().getFullYear();
  const intakeYearOptions = Array.from({ length: 10 }, (_, i) => ({
    label: String(currentYear - i),
    value: String(currentYear - i),
  }));

  // Status options combined with custom statuses
  const statusOptions = [
    ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
    ...(customSelectionStatus?.map((val) => ({
      label: val,
      value: val,
    })) || []),
  ];

  const handleSubmit = (values: FilterValues) => {
    // Track which filters are active
    const filters = Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k]) => k);
    setActiveFilters(filters);
    onSearch(values);
  };

  const handleClear = () => {
    form.resetFields();
    setActiveFilters([]);
    onSearch({});
  };

  const handleRemoveFilter = (key: string) => {
    form.setFieldValue(key as keyof FilterValues, undefined);
    const newFilters = activeFilters.filter((f) => f !== key);
    setActiveFilters(newFilters);
    handleSubmit(form.getFieldsValue());
  };

  // Label mapping for active filter display
  const filterLabels: Record<string, string> = {
    search: "Pencarian",
    status: "Status",
    university_id: "Universitas",
    province_id: "Provinsi",
    intake_year: "Angkatan",
  };

  return (
    <Collapse
      defaultActiveKey={[]}
      style={{ marginBottom: 16 }}
      items={[
        {
          key: "1",
          label: (
            <span>
              <FilterOutlined style={{ marginRight: 8 }} />
              Filter & Pencarian
              {activeFilters.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 12 }}>
                  {activeFilters.length} filter aktif
                </Tag>
              )}
            </span>
          ),
          children: (
            <>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="middle"
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label="Cari" name="search">
                      <Input placeholder="Cari nama atau email..." allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label="Status" name="status">
                      <Select
                        placeholder="Pilih status"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={statusOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label="Universitas" name="university_id">
                      <Select
                        placeholder="Pilih universitas"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={universities?.data?.map((u) => ({
                          label: u.name,
                          value: String(u.id),
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label="Provinsi" name="province_id">
                      <Select
                        placeholder="Pilih provinsi"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={provinces?.data?.map((p) => ({
                          label: p.name,
                          value: String(p.id),
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8} lg={6}>
                    <Form.Item label="Angkatan" name="intake_year">
                      <Select
                        placeholder="Pilih angkatan"
                        allowClear
                        showSearch
                        options={intakeYearOptions}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row justify="end">
                  <Space>
                    <Button
                      onClick={handleClear}
                      icon={<ClearOutlined />}
                      disabled={activeFilters.length === 0}
                    >
                      Hapus Filter
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SearchOutlined />}
                      loading={loading}
                    >
                      Cari
                    </Button>
                  </Space>
                </Row>
              </Form>

              {activeFilters.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <Space size={4} wrap>
                    <span style={{ color: "#666", marginRight: 8 }}>
                      Filter aktif:
                    </span>
                    {activeFilters.map((key) => (
                      <Tag
                        key={key}
                        closable
                        onClose={() => handleRemoveFilter(key)}
                        color="blue"
                      >
                        {filterLabels[key] || key}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
            </>
          ),
        },
      ]}
    />
  );
};

export default FilterPanel;
