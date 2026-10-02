import { Alert, Button, Tabs, Dropdown, Skeleton } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { getSetupActivity } from "../../../api/services/activity-setup";
import ActivityOverview from "./components/ActivityOverview";
import type { TabsProps, MenuProps } from "antd";

import ActivityDetail from "./components/ActivityDetail";
import RegistrantList from "./components/RegistrantList";
import QuestionnaireForm from "./components/Questionnaire";

import MandatoryData from "./components/MandatoryData";
import ImageList from "./components/ImageList";
import CustomFormSelection from "./components/CustomFormSelection";
import ActivityScoring from "../ActivityScoring";
import ActivityCoursesTab from "./components/ActivityCoursesTab";
import { usePermissions } from "../../../stores/authStore";
import PageHeader from "../../../components/common/PageHeader";
import {
  PublicationTag,
  RegistrationTag,
} from "../../../components/common/StatusTags";

const MainActivityDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const permissions = usePermissions();
  const activeTab = searchParams.get("tab") || "overview";
  const {
    data: activity,
    error,
    refresh,
  } = useRequest(() => getSetupActivity(Number(id)), {
    refreshDeps: [id, activeTab],
  });

  if (error)
    return (
      <Alert
        type="error"
        title="Detail kegiatan gagal dimuat"
        action={<Button onClick={refresh}>Coba lagi</Button>}
      />
    );
  if (!activity) return <Skeleton active />;

  const items: TabsProps["items"] = [
    {
      key: "overview",
      label: "Ringkasan",
      children: (
        <ActivityOverview
          activity={activity}
          onUpdated={refresh}
          onNavigate={(tab) => setSearchParams({ tab })}
        />
      ),
    },
    {
      key: "1",
      label: "Detail Kegiatan",
      children: <ActivityDetail />,
    },

    {
      key: "3",
      label: "Gambar/Poster",
      children: <ImageList />,
    },
    {
      key: "7",
      label: "Formulir Pendaftaran",
      children: <CustomFormSelection />,
    },
    {
      key: "5",
      label: "Peserta",
      children: <RegistrantList />,
    },
    {
      key: "scoring",
      label: "Penilaian",
      children: <ActivityScoring activityId={activity.id} />,
    },
  ];

  if (
    permissions.includes("activities.manage") ||
    permissions.includes("activity_registrations.read")
  ) {
    items.splice(4, 0, {
      key: "courses",
      label: "Kelas Online",
      children: <ActivityCoursesTab activityId={activity.id} />,
    });
  }

  // Legacy forms - only shown when explicitly selected
  if (activeTab === "4" || activeTab === "6") {
    const legacyTabs = [
      {
        key: "4",
        label: "Formulir data diri (tidak digunakan lagi)",
        children: (
          <>
            <Alert
              message="Formulir Pendaftaran Lama - Tidak Digunakan Lagi"
              description="Formulir ini sudah tidak digunakan lagi. Gunakan 'Formulir Pendaftaran' (tab sebelumnya) untuk membuat formulir yang baru."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <MandatoryData />
          </>
        ),
      },
      {
        key: "6",
        label: "Formulir kuesioner tambahan (tidak digunakan lagi)",
        children: (
          <>
            <Alert
              message="Formulir Pendaftaran Lama - Tidak Digunakan Lagi"
              description="Formulir ini sudah tidak digunakan lagi. Gunakan 'Formulir Pendaftaran' (tab sebelumnya) untuk membuat formulir yang baru."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <QuestionnaireForm />
          </>
        ),
      },
    ];
    items.push(...legacyTabs);
  }

  // Dropdown menu for accessing legacy forms
  const moreMenuItems: MenuProps["items"] = [
    {
      type: "group",
      label: "Formulir pendaftaran lama (tidak digunakan lagi)",
    },
    {
      key: "4",
      label: "Formulir Data Diri (Tidak Digunakan Lagi)",
      onClick: () => setSearchParams({ tab: "4" }),
    },
    {
      key: "6",
      label: "Formulir Kuesioner Tambahan (Tidak Digunakan Lagi)",
      onClick: () => setSearchParams({ tab: "6" }),
    },
  ];

  return (
    <main className="page-container">
      <PageHeader
        back={{ to: "/activity", label: "Kembali ke daftar kegiatan" }}
        title={activity.name}
        tags={
          <>
            <PublicationTag published={activity.is_published} />
            <RegistrationTag open={activity.is_registration_open} />
          </>
        }
        description="Kelola informasi kegiatan, poster, pendaftaran, dan peserta dari satu tempat."
      />
      <Tabs
        activeKey={activeTab}
        onTabClick={(key) => setSearchParams({ tab: key })}
        tabPlacement="top"
        destroyOnHidden
        items={items}
        tabBarExtraContent={
          <Dropdown
            menu={{ items: moreMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              aria-label="Formulir lama"
              title="Formulir lama"
            />
          </Dropdown>
        }
      />
    </main>
  );
};

export default MainActivityDetail;
