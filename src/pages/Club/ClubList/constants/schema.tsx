import { Link } from "react-router-dom";
import { TableProps, Button, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { Club } from "../../../../types/model/club";

export const createTableSchema = (): TableProps<Club>["columns"] => [
  {
    title: "Nama Club",
    dataIndex: "name",
    key: "name",
    render: (name, record) => <Link to={`/club/${record.id}`}>{name}</Link>,
    width: 200,
  },

  {
    title: "Logo",
    dataIndex: "logo",
    key: "logo",
    width: 100,
    render: (logo) => 
      logo ? (
        <img 
          src={`${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${logo}`} 
          alt="Logo" 
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ) : (
        "Tidak ada logo"
      ),
  },
  {
    title: "Media",
    dataIndex: "media",
    key: "media",
    width: 100,
    render: (media) => `${media?.items?.length || 0} file`,
  },
  {
    title: "Periode Mulai",
    dataIndex: "start_period",
    key: "start_period",
    width: 120,
    render: (date) => date ? dayjs(date).format("MMM YYYY") : "-",
  },
  {
    title: "Periode Berakhir",
    dataIndex: "end_period",
    key: "end_period",
    width: 120,
    render: (date) => date ? dayjs(date).format("MMM YYYY") : "-",
  },
  {
    title: "Status",
    dataIndex: "is_show",
    key: "is_show",
    width: 100,
    render: (isShow) => (
      <Tag color={isShow ? "green" : "red"}>
        {isShow ? "Tampil" : "Tersembunyi"}
      </Tag>
    ),
  },
  {
    title: "Tanggal Dibuat",
    dataIndex: "created_at",
    key: "created_at",
    width: 150,
    render: (date) => new Date(date).toLocaleDateString("id-ID"),
  },
  {
    title: "Aksi",
    key: "action",
    width: 80,
    render: (_, record) => (
      <Link to={`/club/${record.id}`}>
        <Button icon={<EditOutlined />} size="small">
          Edit
        </Button>
      </Link>
    ),
  },
];
