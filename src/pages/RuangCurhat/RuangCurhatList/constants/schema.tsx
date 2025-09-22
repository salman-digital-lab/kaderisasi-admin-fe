import { Button, TableProps, Tag } from "antd";
import { Link } from "react-router-dom";

import { RuangCurhatData } from "../../../../types/model/ruangcurhat";
import {
  renderProblemStatus,
  renderProblemStatusColor,
} from "../../../../constants/render";

import { ArrowRightOutlined } from "@ant-design/icons";

export const TABLE_SCHEMA: TableProps<RuangCurhatData>["columns"] = [
  {
    title: "Pendaftar Masalah",
    dataIndex: "publicUser",
    key: "name",
    render: (val) => val.profile?.name || "Tidak ada nama",
  },
  {
    title: "Jenis Kelamin",
    dataIndex: "publicUser",
    key: "gender",
    render: (val) => {
      const gender = val.profile?.gender;
      return gender === "F" ? "Perempuan" : gender === "M" ? "Laki-Laki" : "-";
    },
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
