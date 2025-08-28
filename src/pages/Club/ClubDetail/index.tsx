import { Alert, Button, Space, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import type { TabsProps } from "antd";
import useUrlState from "@ahooksjs/use-url-state";

import ClubDetail from "./components/ClubDetail";
import MediaList from "./components/MediaList";
import LogoUpload from "./components/LogoUpload";
import ClubRegistrationInfo from "../ClubRegistrationInfo";
import ClubRegistrationsPage from "../ClubRegistrations";

const MainClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useUrlState({ tab: "1" });

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Detil Klub",
      children: <ClubDetail />,
    },
    {
      key: "2",
      label: "Logo Klub",
      children: <LogoUpload />,
    },
    {
      key: "3",
      label: "Media Klub",
      children: <MediaList />,
    },
    {
      key: "4",
      label: "Info Pendaftaran",
      children: <ClubRegistrationInfo clubId={Number(id)} />,
    },
    {
      key: "5",
      label: "Keanggotaan",
      children: <ClubRegistrationsPage />,
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
