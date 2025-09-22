import React from "react";
import { Col, Row, Button, Card, Form, Space, Select, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { PROBLEM_STATUS_ENUM } from "../../../../types/constants/ruangcurhat";
import { PROBLEM_STATUS_OPTIONS, GENDER_OPTION } from "../../../../constants/options";
import { GENDER } from "../../../../types/constants/profile";

type FieldType = {
  status?: PROBLEM_STATUS_ENUM;
  name?: string;
  gender?: GENDER;
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: PROBLEM_STATUS_ENUM;
      name?: string;
      gender?: GENDER;
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
            name: val.name,
            gender: val.gender,
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
          <Col span={6}>
            <Form.Item label="Nama" name="name">
              <Input
                placeholder="Cari berdasarkan nama"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Jenis Kelamin" name="gender">
              <Select
                placeholder="Pilih jenis kelamin"
                allowClear
                options={GENDER_OPTION}
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
