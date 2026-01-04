import { Space, Tabs } from "antd";
import { useParams, useSearchParams } from "react-router-dom";
import type { TabsProps } from "antd";

import ClubDetail from "./components/ClubDetail";
import MediaList from "./components/MediaList";
import LogoUpload from "./components/LogoUpload";
import ClubRegistrationInfo from "../ClubRegistrationInfo";
import ClubRegistrationsPage from "../ClubRegistrations";
import CustomFormAttachment from "./components/CustomFormAttachment";

const MainClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "1";

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Detail Unit Kegiatan",
      children: <ClubDetail />,
    },
    {
      key: "2",
      label: "Logo Unit Kegiatan",
      children: <LogoUpload />,
    },
    {
      key: "3",
      label: "Media Unit Kegiatan",
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
    {
      key: "6",
      label: "Form Tambahan",
      children: <CustomFormAttachment />,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Tabs
        activeKey={activeTab}
        onTabClick={(key) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("tab", key);
          setSearchParams(newParams);
        }}
        tabPosition="top"
        items={items}
      />
    </Space>
  );
};

export default MainClubDetail;
