import {
  Alert,
  Button,
  Tabs,
  Dropdown,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
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
      <Alert
        type="error"
        title="Detail kegiatan gagal dimuat"
        action={<Button onClick={refresh}>Coba Lagi</Button>}
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
      label: "Form Pendaftaran",
      children: <CustomFormSelection />,
    },
    {
      key: "5",
      label: "Peserta",
      children: <RegistrantList />,
    },
  ];

  // Legacy forms - only shown when explicitly selected
  if (activeTab === "4" || activeTab === "6") {
    const legacyTabs = [
      {
        key: "4",
        label: "Form Data Diri (Tidak Digunakan Lagi)",
        children: (
          <>
            <Alert
              message="Form Pendaftaran Lama - Tidak Digunakan Lagi"
              description="Form ini sudah tidak digunakan lagi. Gunakan 'Form Pendaftaran' (tab sebelumnya) untuk membuat form yang baru."
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
        label: "Form Kuesioner Tambahan (Tidak Digunakan Lagi)",
        children: (
          <>
            <Alert
              message="Form Pendaftaran Lama - Tidak Digunakan Lagi"
              description="Form ini sudah tidak digunakan lagi. Gunakan 'Form Pendaftaran' (tab sebelumnya) untuk membuat form yang baru."
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
      label: "Form Pendaftaran Lama (Tidak Digunakan Lagi)",
    },
    {
      key: "4",
      label: "Form Data Diri (Tidak Digunakan Lagi)",
      onClick: () => setSearchParams({ tab: "4" }),
    },
    {
      key: "6",
      label: "Form Kuesioner Tambahan (Tidak Digunakan Lagi)",
      onClick: () => setSearchParams({ tab: "6" }),
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
            <Typography.Title level={2} style={{ margin: 0 }}>
              {activity.name}
            </Typography.Title>
            <Tag color={activity.is_published ? "success" : "default"}>
              {activity.is_published ? "Tayang" : "Draf"}
            </Tag>
            <Tag
              color={activity.is_registration_open ? "processing" : "default"}
            >
              {activity.is_registration_open
                ? "Pendaftaran Dibuka"
                : "Pendaftaran Ditutup"}
            </Tag>
          </Space>
          <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Kelola informasi kegiatan, poster, pendaftaran, dan peserta dari
            satu tempat.
          </Typography.Paragraph>
        </div>
      </header>
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
              title="Akses form legacy"
            />
          </Dropdown>
        }
      />
    </main>
  );
};

export default MainActivityDetail;
