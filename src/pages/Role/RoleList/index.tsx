import { Button, Card, Space } from "antd";
import { Link } from "react-router-dom";

import { ArrowLeftOutlined } from "@ant-design/icons";

export default function RoleList() {
  return (
    <Space direction="vertical">
      <Button>
        <Link to="/member">
          <ArrowLeftOutlined /> Kembali
        </Link>
      </Button>
      <Card title="Role Info"></Card>
    </Space>
  );
}
