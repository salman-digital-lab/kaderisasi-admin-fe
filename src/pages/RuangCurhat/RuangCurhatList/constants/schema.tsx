import { Button, TableProps, Tag } from "antd";
import { Link } from "react-router-dom";

import { RuangCurhatData } from "../../../../types/model/ruangcurhat";
import {
  renderProblemOwner,
  renderProblemStatus,
  renderProblemStatusColor,
} from "../../../../constants/render";

import { ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export const TABLE_SCHEMA: TableProps<RuangCurhatData>["columns"] = [
  {
    title: "Pendaftar Masalah",
    dataIndex: "publicUser",
    render: (val) => val.email,
  },
  {
    title: "Nama",
    dataIndex: "publicUser",
    render: (val) => val.profile?.name || "Tidak ada nama",
  },
  {
    title: "Jenis Kelamin",
    dataIndex: "publicUser",
    render: (val) => {
      const gender = val.profile?.gender;
      return gender === "F" ? "Perempuan" : gender === "M" ? "Laki-Laki" : "-";
    },
  },
  {
    title: "Kepemilikan Masalah",
    dataIndex: "problem_ownership",
    render: (text) => renderProblemOwner(text),
  },

  {
    title: "Status",
    dataIndex: "status",
    render: (text) => (
      <Tag color={renderProblemStatusColor(text)}>
        {renderProblemStatus(text)}
      </Tag>
    ),
  },

  {
    title: "Konselor yg Ditugaskan",
    dataIndex: "adminUser",
    render: (value) => (value ? value.email : "Belum ada yang ditugaskan"),
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
      <Link to={`/ruang-curhat/${text}`}>
        <Button icon={<ArrowRightOutlined />} iconPosition="end">
          Lihat Detil
        </Button>
      </Link>
    ),
  },
];
