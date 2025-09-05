import { Button, Space, TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { University } from "../../../types/model/university";
export const TABLE_SCHEMA = (
  openModal: (id: number, name: string, province_id?: number) => void,
): TableProps<University>["columns"] => [
  {
    title: "No",
    dataIndex: "id",
    key: "id",
    width: 80,
  },
  {
    title: "Universitas",
    dataIndex: "name",
    key: "name",
    width: 400,
  },
  {
    title: "Provinsi",
    dataIndex: ["province", "name"],
    key: "province",
    width: 300,
    render: (provinceName) => provinceName || "-",
  },
  {
    title: "Action",
    key: "action",
    width: 500,
    render: (_text, record) => (
      <Space size="middle">
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => openModal(record.id, record.name, record.province_id)}
        >
          Edit
        </Button>
      </Space>
    ),
  },
];
