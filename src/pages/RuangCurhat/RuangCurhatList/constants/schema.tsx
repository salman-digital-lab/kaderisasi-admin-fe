import { Button, TableProps, Tag } from "antd";
import { Link } from "react-router-dom";

import { RuangCurhatData } from "../../../../types/model/ruangcurhat";
import {
  renderProblemOwner,
  renderProblemStatus,
  renderProblemStatusColor,
} from "../../../../constants/render";

import { ArrowRightOutlined } from "@ant-design/icons";

export const TABLE_SCHEMA: TableProps<RuangCurhatData>["columns"] = [
  {
    title: "Pendaftar Masalah",
    dataIndex: "user_id",
    render: (text, record) => (
      <>{<Link to={`/member/${text}`}>{record.publicUser.email}</Link>}</>
    ),
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
