import React from "react";
import { Col, Row, Button, Card, Form, Space, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { PROBLEM_STATUS_ENUM } from "../../../../types/constants/ruangcurhat";
import { PROBLEM_STATUS_OPTIONS } from "../../../../constants/options";

type FieldType = {
  status?: PROBLEM_STATUS_ENUM;
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: PROBLEM_STATUS_ENUM;
    }>
  >;
};

const RuangCurhatFilter = ({ setParameter }: FilterProps) => {
  const [form] = Form.useForm<FieldType>();

  return (
    <Card>
      <Form
        layout="vertical"
        form={form}
        onFinish={(val) =>
          setParameter((prev) => ({
            ...prev,
            status: val.status,
            page: 1,
          }))
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Status" name="status">
              <Select
                placeholder="Status"
                allowClear
                options={PROBLEM_STATUS_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Space>
            <Button icon={<SearchOutlined />} type="primary" htmlType="submit">
              Cari
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default RuangCurhatFilter;
