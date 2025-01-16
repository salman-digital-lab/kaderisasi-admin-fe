import { Link } from "react-router-dom";
import { TableProps, Tag } from "antd";

import {
  renderActivityCategory,
  renderActivityType,
} from "../../../../constants/render";
import { Activity } from "../../../../types/model/activity";

export const TABLE_SCHEMA: TableProps<Activity>["columns"] = [
  {
    title: "Judul Aktivitas/Kegiatan",
    dataIndex: "name",
    key: "name",
    render: (name, record) => <Link to={`/activity/${record.id}`}>{name}</Link>,
    width: 200,
  },
  {
    title: "Tipe Aktivitas",
    dataIndex: "activity_type",
    width: 150,
    render: (value) => renderActivityType(value),
  },
  {
    title: "Kategori Aktivitas",
    dataIndex: "activity_category",
    width: 150,
    render: (value) => renderActivityCategory(value),
  },
  {
    title: "Tampil Pada Web",
    dataIndex: "is_published",
    width: 120,
    render: (value) => (
      <Tag color={value == 0 ? "purple" : "green"}>
        {value == 0 ? "Tidak" : "Iya"}
      </Tag>
    ),
  },
];
