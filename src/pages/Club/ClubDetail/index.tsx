import LinkedCoursesTab from "../../../components/LinkedCourses/LinkedCoursesTab";
import { usePermissions } from "../../../stores/authStore";
import { useState } from "react";
import { Alert, Button, Skeleton, Tabs } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import { useRequest } from "ahooks";
import type { TabsProps } from "antd";

import { getClub } from "../../../api/services/club";
import DeleteFeatureButton from "../../../components/common/DeleteFeatureButton";
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
import PageHeader from "../../../components/common/PageHeader";
import {
  PublicationTag,
  RegistrationTag,
} from "../../../components/common/StatusTags";

const MainClubDetail = () => {
  const permissions = usePermissions();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [club, setClub] = useState<Club | null>(null);
  const requestedSection = resolveClubSection(
    searchParams.get("section"),
    searchParams.get("tab"),
  );
  const canReadActivities = permissions.includes("activities.read");
  const activeSection =
    requestedSection === "activities" && !canReadActivities
      ? "overview"
      : requestedSection;
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
              Coba lagi
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
  ];

  if (canReadActivities) {
    items.push({
      key: "activities",
      label: "Kegiatan",
      children: <ClubActivitiesPage />,
    });
  }

  if (
    permissions.includes("clubs.manage") ||
    permissions.includes("club_registrations.read")
  ) {
    items.splice(3, 0, {
      key: "courses",
      label: "Kelas Online",
      destroyOnHidden: true,
      children: <LinkedCoursesTab kind="club" ownerId={club.id} />,
    });
  }

  return (
    <main className="page-container">
      <PageHeader
        back={{ to: "/club", label: "Kembali ke daftar klub" }}
        title={club.name}
        tags={
          <>
            <PublicationTag published={club.is_show} />
            <RegistrationTag open={club.is_registration_open} />
          </>
        }
        description="Kelola profil publik, pendaftaran, anggota, dan kegiatan dari satu tempat."
        extra={
          <>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={refresh}
            >
              Muat ulang
            </Button>
            <DeleteFeatureButton
              kind="club"
              id={club.id}
              name={club.name}
              disabled={loading}
            />
          </>
        }
      />

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
