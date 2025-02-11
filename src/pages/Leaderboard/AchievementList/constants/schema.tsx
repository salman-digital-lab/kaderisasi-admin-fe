import { TableProps } from "antd/es/table/InternalTable";
import dayjs from "dayjs";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { ArrowRightOutlined } from "@ant-design/icons";

import { Achievement } from "../../../../types/model/achievements";

export const TABLE_SCHEMA: TableProps<Achievement>["columns"] = [
  {
    title: "Nama Prestasi",
    dataIndex: "name",
  },
  {
    title: "Tanggal Dibuat",
    dataIndex: "created_at",
    render: (value) => dayjs(value).format("DD MMMM YYYY"),
  },
  {
    title: "",
    dataIndex: "id",
    render: (text) => (
      <Link to={`/achievement/${text}`}>
        <Button icon={<ArrowRightOutlined />} iconPosition="end">
          Lihat Detil
        </Button>
      </Link>
    ),
  },
];
