import { Link } from "react-router-dom";
import { TableProps, Button, Space } from "antd";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";

import { CustomForm } from "../../../../types/model/customForm";

export const TABLE_SCHEMA: TableProps<CustomForm>["columns"] = [
  {
    title: "Nama Form",
    dataIndex: "form_name",
    key: "form_name",
    render: (formName, record) => (
      <Link to={`/custom-form/${record.id}/edit`}>{formName}</Link>
    ),
    width: 200,
  },
  {
    title: "Deskripsi",
    dataIndex: "form_description",
    key: "form_description",
    render: (description) => description || "-",
    width: 250,
  },
  {
    title: "Tipe Fitur",
    dataIndex: "feature_type",
    key: "feature_type",
    width: 180,
    render: (featureType) => {
      const typeMap: Record<string, string> = {
        activity_registration: "Pendaftaran Aktivitas",
        club_registration: "Pendaftaran Unit Kegiatan",
      };
      return typeMap[featureType] || featureType;
    },
  },
  {
    title: "ID Fitur",
    dataIndex: "feature_id",
    key: "feature_id",
    width: 100,
  },
  {
    title: "Jumlah Section",
    dataIndex: "form_schema",
    key: "section_count",
    width: 120,
    render: (formSchema) => formSchema?.fields?.length || 0,
  },
  {
    title: "Jumlah Field",
    dataIndex: "form_schema",
    key: "field_count",
    width: 120,
    render: (formSchema) => {
      if (!formSchema?.fields) return 0;
      return formSchema.fields.reduce((total: number, section: any) => total + section.fields.length, 0);
    },
  },

  {
    title: "Aksi",
    key: "actions",
    width: 200,
    render: (_, record) => (
      <Space>
        <Link to={`/custom-form/${record.id}`}>
          <Button type="primary" icon={<EyeOutlined />} size="small">
            Lihat
          </Button>
        </Link>
        <Link to={`/custom-form/${record.id}/edit`}>
          <Button icon={<EditOutlined />} size="small">
            Edit
          </Button>
        </Link>

      </Space>
    ),
  },
];
