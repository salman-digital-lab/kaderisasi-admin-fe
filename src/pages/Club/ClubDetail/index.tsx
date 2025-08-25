import { Alert, Button, Space, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { TabsProps } from "antd";
import useUrlState from "@ahooksjs/use-url-state";

import ClubDetail from "./components/ClubDetail";
import MediaList from "./components/MediaList";
import LogoUpload from "./components/LogoUpload";

const MainClubDetail = () => {
  const [state, setState] = useUrlState({ tab: "1" });

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Detail Club",
      children: <ClubDetail />,
    },
    {
      key: "2",
      label: "Logo",
      children: <LogoUpload />,
    },
    {
      key: "3",
      label: "Media",
      children: <MediaList />,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Space>
        <Button>
          <Link to="/club">
            <ArrowLeftOutlined /> Kembali
          </Link>
        </Button>
        <Alert
          message="Kelola data club, upload logo, dan media untuk ditampilkan di website"
          type="info"
          showIcon
        />
      </Space>
      <Tabs
        activeKey={state.tab}
        onTabClick={(key) => setState({ tab: key })}
        tabPosition="top"
        items={items}
      />
    </Space>
  );
};

export default MainClubDetail;
