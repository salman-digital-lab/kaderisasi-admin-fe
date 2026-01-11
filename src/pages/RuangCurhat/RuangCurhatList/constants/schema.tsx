import { Button, TableProps, Tag, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { RuangCurhatData } from "../../../../types/model/ruangcurhat";
import {
  renderProblemStatus,
  renderProblemStatusColor,
} from "../../../../constants/render";

export const TABLE_SCHEMA: TableProps<RuangCurhatData>["columns"] = [
  {
    title: "Pendaftar Masalah",
    dataIndex: "publicUser",
    key: "name",
    render: (val, record) => (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <span>{val.profile?.name || "Tidak ada nama"}</span>
        <Tooltip title="Lihat Detail">
          <Link to={`/ruang-curhat/${record.id}`}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "4px",
              }}
            />
          </Link>
        </Tooltip>
      </div>
    ),
    width: 260,
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
    render: (value) =>
      value ? value.display_name : "Belum ada yang ditugaskan",
  },
  {
    title: "Tanggal Dibuat",
    dataIndex: "created_at",
    render: (value) => dayjs(value).locale("id").format("DD MMMM YYYY"),
  },
];
