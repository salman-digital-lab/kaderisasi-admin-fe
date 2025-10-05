import { Alert, Button, Space, Tabs, Dropdown } from "antd";
import { ArrowLeftOutlined, MoreOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import type { TabsProps, MenuProps } from "antd";

import ActivityDetail from "./components/ActivityDetail";
import RegistrantList from "./components/RegistrantList";
import QuestionnaireForm from "./components/Questionnaire";
import ActivityDescription from "./components/ActivityDescription";
import MandatoryData from "./components/MandatoryData";
import ImageList from "./components/ImageList";
import CustomFormSelection from "./components/CustomFormSelection";

const MainActivityDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "1";

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Detil Kegiatan",
      children: <ActivityDetail />,
    },
    {
      key: "2",
      label: "Deskripsi Kegiatan",
      children: <ActivityDescription />,
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
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <Space>
          <Button>
            <Link to="/activity">
              <ArrowLeftOutlined /> Kembali
            </Link>
          </Button>
          <Alert
            message="Setiap kegiatan harus melalui proses review oleh Admin sebelum bisa dibuka ke publik. Silahkan konsultasi melalui Grup BMKA IT Support"
            type="warning"
            showIcon
          />
        </Space>
        <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight" trigger={["click"]}>
          <Button icon={<MoreOutlined />} title="Akses form legacy">
            Lainnya
          </Button>
        </Dropdown>
      </div>
      <Tabs
        activeKey={activeTab}
        onTabClick={(key) => setSearchParams({ tab: key })}
        tabPosition="top"
        items={items}
      />
    </Space>
  );
};

export default MainActivityDetail;
