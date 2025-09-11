import { Alert, Button, Space, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useSearchParams } from "react-router-dom";
import type { TabsProps } from "antd";

import ActivityDetail from "./components/ActivityDetail";
import RegistrantList from "./components/RegistrantList";
import QuestionnaireForm from "./components/Questionnaire";
import ActivityDescription from "./components/ActivityDescription";
import MandatoryData from "./components/MandatoryData";
import ImageList from "./components/ImageList";

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
      key: "4",
      label: "Form Data Diri",
      children: <MandatoryData />,
    },
    {
      key: "6",
      label: "Form Kuesioner Tambahan",
      children: <QuestionnaireForm />,
    },
    {
      key: "5",
      label: "Peserta",
      children: <RegistrantList />,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
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
