import { Tabs } from "antd";
import { useParams, useSearchParams } from "react-router-dom";
import type { TabsProps } from "antd";

import ClubDetail from "./components/ClubDetail";
import MediaList from "./components/MediaList";
import LogoUpload from "./components/LogoUpload";
import ClubRegistrationInfo from "../ClubRegistrationInfo";
import ClubRegistrationsPage from "../ClubRegistrations";
import ClubActivitiesPage from "../ClubActivities";

const MainClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "1";
  const activeTab = requestedTab === "7" ? "5" : requestedTab;

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
      label: "Anggota & Pendaftaran",
      children: <ClubRegistrationsPage />,
    },
    {
      key: "8",
      label: "Kegiatan",
      children: <ClubActivitiesPage />,
    },
  ];

  return (
    <div style={{ minWidth: 0, width: "100%", padding: 12 }}>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("tab", key);
          setSearchParams(newParams);
        }}
        tabPlacement="top"
        items={items}
      />
    </div>
  );
};

export default MainClubDetail;
