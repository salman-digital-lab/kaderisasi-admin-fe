import { Alert, App, Button, Tabs, Dropdown, Skeleton } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useParams, useSearchParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { getSetupActivity } from "../../../api/services/activity-setup";
import ActivityOverview from "./components/ActivityOverview";
import type { TabsProps, MenuProps } from "antd";
import { useState, type ReactNode } from "react";
import { actionError } from "../../../utils/action-error";
import type {
  Activity,
  ActivityOptionalFeature,
} from "../../../types/model/activity";
import { useOptionalFeatures } from "./hooks/useOptionalFeatures";

import ActivityDetail from "./components/ActivityDetail";
import RegistrantList from "./components/RegistrantList";
import QuestionnaireForm from "./components/Questionnaire";

import MandatoryData from "./components/MandatoryData";
import ImageList from "./components/ImageList";
import CustomFormSelection from "./components/CustomFormSelection";
import ActivityScoring from "../ActivityScoring";
import ActivityCoursesTab from "./components/ActivityCoursesTab";
import PageHeader from "../../../components/common/PageHeader";
import {
  PublicationTag,
  RegistrationTag,
} from "../../../components/common/StatusTags";

const MainActivityDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
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
      <div className="page-container">
        <Alert
          type="error"
          title="Detail kegiatan gagal dimuat"
          action={<Button onClick={refresh}>Coba lagi</Button>}
        />
      </div>
    );
  if (!activity)
    return (
      <div className="page-container">
        <Skeleton active />
      </div>
    );
  return (
    <ActivityWorkspace
      activity={activity}
      activeTab={activeTab}
      refresh={refresh}
      openTab={(tab) => setSearchParams({ tab })}
    />
  );
};

const ActivityWorkspace = ({
  activity,
  activeTab,
  refresh,
  openTab,
}: {
  activity: Activity;
  activeTab: string;
  refresh: () => void;
  openTab: (tab: string) => void;
}) => {
  const { message } = App.useApp();
  const features = useOptionalFeatures(activity, refresh);
  const [enabling, setEnabling] = useState<ActivityOptionalFeature>();

  /**
   * Optional tabs appear when enabled. A deep link (for example from the
   * certificate page) still opens the workspace, with a prompt to enable it.
   */
  const optionalTab = (
    feature: ActivityOptionalFeature,
    label: string,
    content: ReactNode,
  ): NonNullable<TabsProps["items"]>[number] | null => {
    const state = features[feature];
    if (!state.available || (!state.enabled && activeTab !== feature))
      return null;
    return {
      key: feature,
      label,
      children: (
        <>
          {!state.enabled && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title={`${label} belum diaktifkan untuk kegiatan ini`}
              description="Aktifkan agar tab ini selalu tampil. Anda juga dapat mengaturnya di Ringkasan › Fitur tambahan."
              action={
                features.canManage && (
                  <Button
                    type="primary"
                    loading={enabling === feature}
                    onClick={() => {
                      setEnabling(feature);
                      void features
                        .setEnabled(feature, true)
                        .then(() => message.success(`${label} diaktifkan`))
                        .catch((cause: unknown) =>
                          message.error(actionError(cause)),
                        )
                        .finally(() => setEnabling(undefined));
                    }}
                  >
                    Aktifkan
                  </Button>
                )
              }
            />
          )}
          {content}
        </>
      ),
    };
  };

  const items: TabsProps["items"] = [
    {
      key: "overview",
      label: "Ringkasan",
      children: (
        <ActivityOverview
          activity={activity}
          features={features}
          onUpdated={refresh}
          onNavigate={openTab}
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
    optionalTab(
      "courses",
      "Kelas Online",
      <ActivityCoursesTab activityId={activity.id} />,
    ),
    optionalTab(
      "scoring",
      "Penilaian",
      <ActivityScoring activityId={activity.id} />,
    ),
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  // Legacy forms - only shown when explicitly selected
  if (activeTab === "4" || activeTab === "6") {
    const legacyTabs = [
      {
        key: "4",
        label: "Formulir data diri (tidak digunakan lagi)",
        children: (
          <>
            <Alert
              title="Formulir lama — tidak digunakan lagi"
              description="Gunakan tab Formulir Pendaftaran untuk membuat formulir baru."
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
              title="Formulir lama — tidak digunakan lagi"
              description="Gunakan tab Formulir Pendaftaran untuk membuat formulir baru."
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
      label: "Formulir data diri (tidak digunakan lagi)",
      onClick: () => openTab("4"),
    },
    {
      key: "6",
      label: "Formulir kuesioner tambahan (tidak digunakan lagi)",
      onClick: () => openTab("6"),
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
        onTabClick={openTab}
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
