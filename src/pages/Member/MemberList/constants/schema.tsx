import { TableProps } from "antd";
import { Link } from "react-router-dom";

import { UniversityRender } from "../../../../components/render/UniversityRender";
import { renderUserLevel } from "../../../../constants/render";
import { Member } from "../../../../types/model/members";

export const TABLE_SCHEMA: TableProps<Member>["columns"] = [
  {
    title: "Nama Jamaah",
    dataIndex: "name",
    render: (text, data) => (
      <>{data && <Link to={`/member/${data?.id}`}>{text}</Link>}</>
    ),
  },
  {
    title: "Email",
    dataIndex: "publicUser",
    key: "email",
    render: (value) => value?.email,
  },
  {
    title: "Perguruan Tinggi",
    dataIndex: "university_id",
    render: (value) => <UniversityRender universityId={value} />,
  },
  {
    title: "Jenjang",
    dataIndex: "levelName",
    key: "levelName",
    render: (_, data) => <>{renderUserLevel(data.level)}</>,
  },
];
