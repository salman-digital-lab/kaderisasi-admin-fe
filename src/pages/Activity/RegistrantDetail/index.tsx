import { Button, Card, Descriptions, DescriptionsProps, Space, Image } from "antd";
import { Link, useParams } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";

import { getActivity, getRegistrant } from "../../../api/services/activity";
import { getProfileByUserId } from "../../../api/services/member";
import { renderUserLevel } from "../../../constants/render";
import { getCustomFormByFeature } from "../../../api/services/customForm";

const RegistrantDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: registrantData, loading: loadingRegistrant } = useRequest(() =>
    getRegistrant(id),
  );
  const { data: profileData, loading: loadingProfile } = useRequest(
    () => getProfileByUserId(registrantData?.user_id?.toString() || ""),
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

  const { data: customFormData, loading: loadingCustomForm } = useRequest(
    () => getCustomFormByFeature("activity_registration", registrantData?.activity_id?.toString() || ""),
    {
      ready: Boolean(registrantData?.activity_id),
    },
  );

  // Helper function to format boolean values to Indonesian strings
  const formatAnswerValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? "Ya" : "Tidak";
    }
    return value || "-";
  };

  const questionnaireAnswerDescription: DescriptionsProps["items"] = (() => {
    // Use custom form if it exists and is active
    if (customFormData?.is_active && customFormData?.form_schema?.fields) {
      // Flatten all fields from all sections, excluding profile_data section
      const allFields = customFormData.form_schema.fields
        .filter((section) => section.section_name !== "profile_data")
        .flatMap((section) => section.fields);

      return allFields.map((field) => ({
        key: field.key,
        label: field.label,
        children: formatAnswerValue(registrantData?.questionnaire_answer[field.key]),
      }));
    }

    // Fall back to old questionnaire logic
    return activityData?.additional_config?.additional_questionnaire?.map(
      (question) => ({
        key: question.name,
        label: question.label,
        children: formatAnswerValue(registrantData?.questionnaire_answer[question.name!]),
      }),
    );
  })();

  const userInfoDescription: DescriptionsProps["items"] = [
    {
      key: "1",
      label: "Nama Lengkap",
      children: profileData?.profile[0]?.name || "-",
    },
    {
      key: "2",
      label: "Jenis Kelamin",
      children:
        profileData?.profile[0]?.gender === "F" ? "Perempuan" : "Laki-Laki",
    },
    {
      key: "3",
      label: "No KTP",
      children: profileData?.profile[0]?.personal_id,
    },
    {
      key: "4",
      label: "No Whatsapp",
      children: profileData?.profile[0]?.whatsapp,
    },
    {
      key: "5",
      label: "ID Line",
      children: profileData?.profile[0]?.line,
    },
    {
      key: "6",
      label: "Instagram",
      children: profileData?.profile[0]?.instagram,
    },
    {
      key: "5",
      label: "Tiktok",
      children: profileData?.profile[0]?.tiktok,
    },
    {
      key: "5",
      label: "Linkedin",
      children: profileData?.profile[0]?.linkedin,
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
      children: profileData?.profile[0]?.major,
    },
    {
      key: "5",
      label: "Angkatan",
      children: profileData?.profile[0]?.intake_year,
    },
    {
      key: "5",
      label: "Jenjang",
      children: renderUserLevel(profileData?.profile[0]?.level),
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Button>
        <Link to={`/activity/${registrantData?.activity_id}?tab=5`}>
          <ArrowLeftOutlined /> Kembali
        </Link>
      </Button>
      <Image
        style={{ flex: 1 }}
        width={200}
        height={200}
        src={profileData?.profile[0]?.picture
          ? `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${profileData.profile[0].picture}`
          : undefined
        }
        fallback="data:image/png;base64,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"
      />
      <Card loading={loadingRegistrant || loadingProfile}>
        <Descriptions
          title="Info Peserta"
          bordered
          items={userInfoDescription}
        />
      </Card>

      <Card loading={loadingRegistrant || loadingActivity || loadingCustomForm}>
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
