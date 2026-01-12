import {
  Descriptions,
  DescriptionsProps,
  Image,
  Flex,
  Typography,
  Divider,
} from "antd";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";

import { getActivity, getRegistrant } from "../../../api/services/activity";
import { getProfileByUserId } from "../../../api/services/member";
import { renderUserLevel } from "../../../constants/render";
import { getCustomFormByFeature } from "../../../api/services/customForm";

const { Title } = Typography;

const RegistrantDetail = () => {
  const { id, participantId } = useParams<{
    id: string;
    participantId: string;
  }>();
  const registrantId = participantId || id;

  const { data: registrantData } = useRequest(() =>
    getRegistrant(registrantId),
  );
  const { data: profileData } = useRequest(
    () => getProfileByUserId(registrantData?.user_id?.toString() || ""),
    {
      ready: Boolean(registrantData?.user_id),
    },
  );

  const { data: activityData } = useRequest(
    () => getActivity(registrantData?.activity_id || 0),
    {
      ready: Boolean(registrantData?.user_id),
    },
  );

  const { data: customFormData } = useRequest(
    () =>
      getCustomFormByFeature(
        "activity_registration",
        registrantData?.activity_id?.toString() || "",
      ),
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
        children: formatAnswerValue(
          registrantData?.questionnaire_answer[field.key],
        ),
      }));
    }

    // Fall back to old questionnaire logic
    return activityData?.additional_config?.additional_questionnaire?.map(
      (question) => ({
        key: question.name,
        label: question.label,
        children: formatAnswerValue(
          registrantData?.questionnaire_answer[question.name!],
        ),
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
      key: "7",
      label: "Tiktok",
      children: profileData?.profile[0]?.tiktok,
    },
    {
      key: "8",
      label: "Linkedin",
      children: profileData?.profile[0]?.linkedin,
    },
    {
      key: "9",
      label: "Provinsi",
      children: profileData?.profile[0]?.province?.name,
    },

    {
      key: "10",
      label: "Universitas",
      children: profileData?.profile[0]?.university?.name,
    },
    {
      key: "11",
      label: "Jurusan",
      children: profileData?.profile[0]?.major,
    },
    {
      key: "12",
      label: "Angkatan",
      children: profileData?.profile[0]?.intake_year,
    },
    {
      key: "13",
      label: "Jenjang",
      children: renderUserLevel(profileData?.profile[0]?.level),
    },
  ];

  return (
    <Flex vertical gap="large" style={{ padding: 12 }}>
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Info Peserta
        </Title>
        <Flex gap="middle" align="start">
          <Image
            width={120}
            style={{ borderRadius: 8 }}
            src={
              profileData?.profile[0]?.picture
                ? `${import.meta.env.VITE_PUBLIC_IMAGE_BASE_URL}/${profileData.profile[0].picture}`
                : undefined
            }
            fallback="https://placehold.co/200x200?text=Tidak ada gambar"
          />
          <Descriptions
            bordered
            items={userInfoDescription}
            size="small"
            style={{ flex: 1 }}
          />
        </Flex>
      </div>

      <Divider style={{ margin: 0 }} />

      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Jawaban Questionnaire
        </Title>
        <Descriptions
          bordered
          items={questionnaireAnswerDescription}
          column={1}
          size="small"
        />
      </div>
    </Flex>
  );
};

export default RegistrantDetail;
