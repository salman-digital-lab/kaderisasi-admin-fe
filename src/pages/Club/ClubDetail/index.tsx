import { Alert, Tabs } from "antd";
import { useParams, useSearchParams } from "react-router-dom";
import type { TabsProps } from "antd";

import ClubDetail from "./components/ClubDetail";
import MediaList from "./components/MediaList";
import LogoUpload from "./components/LogoUpload";
import ClubRegistrationInfo from "../ClubRegistrationInfo";
import ClubRegistrationsPage from "../ClubRegistrations";
import ClubActivitiesPage from "../ClubActivities";

const CLUB_DETAIL_TABS = new Set(["1", "2", "3", "4", "5", "8"]);

const MainClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "1";
  const legacyTab = requestedTab === "7" ? "5" : requestedTab;
  const activeTab = CLUB_DETAIL_TABS.has(legacyTab) ? legacyTab : "1";
  const isSetupFlow = searchParams.get("setup") === "1";

  const dismissSetupGuide = (): void => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("setup");
    setSearchParams(newParams, { replace: true });
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Detail Klub",
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
      {isSetupFlow ? (
        <Alert
          type="info"
          showIcon
          title="Klub dibuat sebagai draf"
          description='Nama dan tipe klub sudah cukup untuk menyimpan draf. Detail lain, logo, dan media dapat dilengkapi sesuai kebutuhan. Form pendaftaran hanya diperlukan jika "Pendaftaran Dibuka" diaktifkan.'
          closable={{ onClose: dismissSetupGuide }}
          style={{ marginBottom: 16 }}
        />
      ) : null}
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
