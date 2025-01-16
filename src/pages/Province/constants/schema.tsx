import { Button, Space, TableProps } from "antd";
import { EditOutlined } from "@ant-design/icons";

import { Province } from "../../../types/model/province";

export const TABLE_SCHEMA = (
  openModal: (id: number, name: string) => void,
): TableProps<Province>["columns"] => [
  {
    title: "No",
    dataIndex: "id",
    key: "id",
    width: 80,
  },
  {
    title: "Nama",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
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
