import { useState } from "react";
import { Alert, Button, Skeleton, Space, Tabs, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import { useRequest } from "ahooks";
import type { TabsProps } from "antd";

import { getClub } from "../../../api/services/club";
import type { Club } from "../../../types/model/club";
import ClubRegistrationInfo from "../ClubRegistrationInfo";
import ClubActivitiesPage from "../ClubActivities";
import ClubOverview from "./components/ClubOverview";
import ClubPeople from "./components/ClubPeople";
import ClubProfile from "./components/ClubProfile";
import {
  getClubReadiness,
  resolveClubSection,
  type ClubSection,
} from "../utils/club-workspace";

const { Paragraph, Title } = Typography;

const MainClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [club, setClub] = useState<Club | null>(null);
  const activeSection = resolveClubSection(
    searchParams.get("section"),
    searchParams.get("tab"),
  );
  const isNewDraft = searchParams.get("setup") === "1";

  const { loading, error, refresh } = useRequest(() => getClub(Number(id)), {
    ready: Boolean(id),
    refreshDeps: [id],
    onSuccess: setClub,
  });

  const navigateToSection = (section: ClubSection): void => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("section", section);
    nextParams.delete("tab");
    nextParams.delete("setup");
    setSearchParams(nextParams);
  };

  if (loading && !club) {
    return (
      <div style={{ padding: 12 }}>
        <Skeleton active />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div style={{ padding: 12 }}>
        <Alert
          type="error"
          showIcon
          title="Detail klub gagal dimuat"
          description="Periksa koneksi atau layanan API, lalu coba kembali."
          action={
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              Coba Lagi
            </Button>
          }
        />
      </div>
    );
  }

  const readiness = getClubReadiness(club);
  const items: TabsProps["items"] = [
    {
      key: "overview",
      label: "Ringkasan",
      children: (
        <ClubOverview
          club={club}
          readiness={readiness}
          isNewDraft={isNewDraft}
          onUpdated={setClub}
          onNavigate={navigateToSection}
        />
      ),
    },
    {
      key: "profile",
      label: "Profil Publik",
      children: <ClubProfile club={club} onUpdated={setClub} />,
    },
    {
      key: "registration",
      label: "Pendaftaran",
      children: <ClubRegistrationInfo club={club} onUpdated={setClub} />,
    },
    {
      key: "people",
      label: "Pendaftar & Anggota",
      children: <ClubPeople club={club} />,
    },
    {
      key: "activities",
      label: "Kegiatan",
      children: <ClubActivitiesPage />,
    },
  ];

  return (
    <main style={{ minWidth: 0, width: "100%", padding: 12 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div>
          <Space size="small" wrap>
            <Title level={2} style={{ margin: 0 }}>
              {club.name}
            </Title>
            <Tag color={club.is_show ? "success" : "default"}>
              {club.is_show ? "Tayang" : "Draf"}
            </Tag>
            <Tag color={club.is_registration_open ? "processing" : "default"}>
              {club.is_registration_open
                ? "Pendaftaran Dibuka"
                : "Pendaftaran Ditutup"}
            </Tag>
          </Space>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Kelola profil publik, pendaftaran, anggota, dan kegiatan dari satu
            tempat.
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
          Muat Ulang
        </Button>
      </header>

      <Tabs
        activeKey={activeSection}
        onChange={(key) => navigateToSection(key as ClubSection)}
        tabPlacement="top"
        items={items}
      />
    </main>
  );
};

export default MainClubDetail;
