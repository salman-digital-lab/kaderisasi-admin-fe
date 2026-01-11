import { Link } from "react-router-dom";
import { TableProps, Tag, Tooltip, Typography, Button, Space } from "antd";
import { EyeOutlined } from "@ant-design/icons";

import { UniversityRender } from "../../../../components/render/UniversityRender";
import { renderUserLevel } from "../../../../constants/render";
import { Member } from "../../../../types/model/members";

const { Text } = Typography;

export const TABLE_SCHEMA: TableProps<Member>["columns"] = [
  {
    title: "Nama Anggota",
    dataIndex: "name",
    key: "name",
    render: (name, record) => (
      <Space size={8}>
        <div>
          <Text
            ellipsis={{ tooltip: name }}
            style={{
              fontWeight: 500,
              display: "block",
            }}
          >
            {name}
          </Text>
          <Text
            type="secondary"
            style={{ fontSize: 12 }}
            ellipsis={{ tooltip: record.publicUser?.email }}
          >
            {record.publicUser?.email}
          </Text>
        </div>
        <Tooltip title="Lihat detail anggota">
          <Link to={`/member/${record.id}`}>
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
      </Space>
    ),
    width: 260,
  },
  {
    title: "Lencana",
    dataIndex: "badges",
    width: 150,
    render: (values: string[]) => (
      <Space size={4} wrap>
        {values?.map((value, index) => (
          <Tag
            key={index}
            style={{
              borderRadius: "6px",
              fontWeight: 500,
              border: "none",
            }}
          >
            {value}
          </Tag>
        ))}
      </Space>
    ),
  },
  {
    title: "Perguruan Tinggi",
    dataIndex: "university_id",
    width: 180,
    render: (value) => <UniversityRender universityId={value} />,
  },
  {
    title: "Jenjang",
    dataIndex: "levelName",
    key: "levelName",
    width: 120,
    render: (_, data) => <>{renderUserLevel(data.level)}</>,
  },
];
