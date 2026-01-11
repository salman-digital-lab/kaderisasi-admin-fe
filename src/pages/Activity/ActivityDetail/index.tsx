import { Alert, Button, Tabs, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import type { TabsProps, MenuProps } from "antd";

import ActivityDetail from "./components/ActivityDetail";
import RegistrantList from "./components/RegistrantList";
import QuestionnaireForm from "./components/Questionnaire";

import MandatoryData from "./components/MandatoryData";
import ImageList from "./components/ImageList";
import CustomFormSelection from "./components/CustomFormSelection";

const MainActivityDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "1";

  const items: TabsProps["items"] = [
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
    <div style={{ padding: 12 }}>
      <Tabs
        activeKey={activeTab}
        onTabClick={(key) => setSearchParams({ tab: key })}
        tabPosition="top"
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
    </div>
  );
};

export default MainActivityDetail;
