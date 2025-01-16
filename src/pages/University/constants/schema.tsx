import { Button, Space, TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { University } from "../../../types/model/university";
export const TABLE_SCHEMA = (
  openModal: (id: number, name: string) => void,
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
    width: 500,
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
          onClick={() => openModal(record.id, record.name)}
        >
          Edit
        </Button>
      </Space>
    ),
  },
];
