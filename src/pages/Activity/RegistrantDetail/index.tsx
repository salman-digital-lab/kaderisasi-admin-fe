import { Button, Card, Descriptions, DescriptionsProps, Space } from "antd";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

import { getActivity, getRegistrant } from "../../../api/services/activity";
import { getProfile } from "../../../api/services/member";
import { renderUserLevel } from "../../../constants/render";

const RegistrantDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: registrantData, loading: loadingRegistrant } = useRequest(() =>
    getRegistrant(id),
  );
  const { data: profileData, loading: loadingProfile } = useRequest(
    () => getProfile(registrantData?.user_id?.toString() || ""),
    {
      ready: Boolean(registrantData?.user_id),
    },
  );

  const { data: activityData, loading: loadingActivity } = useRequest(
    () => getActivity(registrantData?.activity_id || 0),
    {
      ready: Boolean(registrantData?.user_id),
    },
  );

  const questionnaireAnswerDescription: DescriptionsProps["items"] =
    activityData?.additional_config?.additional_questionnaire?.map(
      (question) => ({
        key: question.name,
        label: question.label,
        children: registrantData?.questionnaire_answer[question.name!] || "-",
      }),
    );

  const userInfoDescription: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Nama Lengkap",
      children: profileData?.profile[0].name,
    },
    {
      key: "2",
      label: "Jenis Kelamin",
      children:
        profileData?.profile[0].gender === "F" ? "Perempuan" : "Laki-Laki",
    },
    {
      key: "3",
      label: "No KTP",
      children: profileData?.profile[0].personal_id,
    },
    {
      key: "4",
      label: "No Whatsapp",
      children: profileData?.profile[0].whatsapp,
    },
    {
      key: "5",
      label: "ID Line",
      children: profileData?.profile[0].line,
    },
    {
      key: "6",
      label: "Instagram",
      children: profileData?.profile[0].instagram,
    },
    {
      key: "5",
      label: "Tiktok",
      children: profileData?.profile[0].tiktok,
    },
    {
      key: "5",
      label: "Linkedin",
      children: profileData?.profile[0].linkedin,
    },
    {
      key: "5",
      label: "Provinsi",
      children: profileData?.profile[0]?.province?.name,
    },

    {
      key: "5",
      label: "Universitas",
      children: profileData?.profile[0]?.university?.name,
    },
    {
      key: "5",
      label: "Jurusan",
      children: profileData?.profile[0].major,
    },
    {
      key: "5",
      label: "Angkatan",
      children: profileData?.profile[0].intake_year,
    },
    {
      key: "5",
      label: "Jenjang",
      children: renderUserLevel(profileData?.profile[0].level),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Button>
        <Link to={`/activity/${registrantData?.activity_id}?tab=4`}>
          <ArrowLeftOutlined /> Kembali
        </Link>
      </Button>
      <Card loading={loadingRegistrant || loadingProfile}>
        <Descriptions
          title="Info Peserta"
          bordered
          items={userInfoDescription}
        />
      </Card>

      <Card loading={loadingRegistrant || loadingActivity}>
        <Descriptions
          title="Jawaban Questionnaire"
          bordered
          items={questionnaireAnswerDescription}
          column={1}
        />
      </Card>
    </Space>
  );
};

export default RegistrantDetail;
