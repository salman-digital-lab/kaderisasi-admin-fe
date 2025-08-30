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
    title: "Pendaftaran",
    dataIndex: "is_registration_open",
    key: "is_registration_open",
    width: 120,
    render: (isOpen) => (
      <Tag color={isOpen ? "green" : "red"}>
        {isOpen ? "Dibuka" : "Ditutup"}
      </Tag>
    ),
  },
  {
    title: "Berakhir Pendaftaran",
    dataIndex: "registration_end_date",
    key: "registration_end_date",
    width: 150,
    render: (date) => date ? dayjs(date).format("DD MMM YYYY") : "-",
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
