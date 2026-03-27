import {
  Descriptions,
  DescriptionsProps,
  Image,
  Flex,
  Typography,
  Divider,
  Tag,
} from "antd";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import type { ReactNode } from "react";

import { getActivity, getRegistrant } from "../../../api/services/activity";
import { getProfileByUserId } from "../../../api/services/member";
import { renderUserLevel } from "../../../constants/render";
import { getCustomFormByFeature } from "../../../api/services/customForm";
import { ProvinceRender } from "../../../components/render/ProvinceRender";
import { UniversityRender } from "../../../components/render/UniversityRender";

const { Title } = Typography;

const GENDER_MAP: Record<string, string> = {
  M: "Laki-Laki",
  F: "Perempuan",
};

function formatValue(value: unknown): ReactNode {
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  return (value as string) || "-";
}

/** Render a profile field value with special handling for province/university/gender/level. */
function renderProfileField(
  fieldKey: string,
  rawValue: unknown,
  isGuest: boolean,
): ReactNode {
  if (fieldKey === "province_id" && rawValue != null) {
    return <ProvinceRender provinceId={Number(rawValue)} />;
  }
  if (fieldKey === "university_id" && rawValue != null) {
    return <UniversityRender universityId={Number(rawValue)} />;
  }
  if (fieldKey === "gender") {
    return GENDER_MAP[String(rawValue ?? "")] ?? formatValue(rawValue);
  }
  if (fieldKey === "level" && !isGuest) {
    return renderUserLevel(rawValue as number);
  }
  return formatValue(rawValue);
}

const RegistrantDetail = () => {
  const { id, participantId } = useParams<{
    id: string;
    participantId: string;
  }>();
  const registrantId = participantId || id;

  const { data: registrantData } = useRequest(() =>
    getRegistrant(registrantId),
  );

  const isGuest = registrantData ? registrantData.user_id === null : undefined;

  const { data: profileData } = useRequest(
    () => getProfileByUserId(registrantData?.user_id?.toString() || ""),
    {
      ready: isGuest === false && Boolean(registrantData?.user_id),
    },
  );

  const { data: activityData } = useRequest(
    () => getActivity(registrantData?.activity_id || 0),
    {
      ready: Boolean(registrantData?.activity_id),
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

  const profile = profileData?.profile[0];
  const profileSection = customFormData?.is_active
    ? customFormData.form_schema.fields[0]
    : undefined;

  // "Info Peserta" section
  // When a custom form exists, show only the fields from its first section (Pertanyaan Dasar).
  // Otherwise fall back to the full hardcoded list for logged-in users, or basic info for guests.
  let userInfoDescription: DescriptionsProps["items"];
  if (profileSection) {
    const profileValueMap: Record<string, unknown> = {
      name: profile?.name,
      gender: profile?.gender,
      personal_id: profile?.personal_id,
      whatsapp: profile?.whatsapp,
      line: profile?.line,
      instagram: profile?.instagram,
      tiktok: profile?.tiktok,
      linkedin: profile?.linkedin,
      province_id: profile?.province_id,
      university_id: profile?.university_id,
      major: profile?.major,
      intake_year: profile?.intake_year,
      level: profile?.level,
      birth_date: profile?.birth_date,
    };
    userInfoDescription = profileSection.fields.map((field, idx) => ({
      key: String(idx),
      label: field.label,
      children: renderProfileField(
        field.key,
        isGuest ? registrantData?.guest_data?.[field.key] : profileValueMap[field.key],
        isGuest ?? false,
      ),
    }));
  } else if (isGuest) {
    const guestData = registrantData?.guest_data ?? {};
    userInfoDescription = [
      { key: "name", label: "Nama", children: (guestData["name"] as string) || "-" },
      { key: "email", label: "Email", children: (guestData["email"] as string) || "-" },
      ...(guestData["whatsapp"]
        ? [{ key: "whatsapp", label: "WhatsApp", children: guestData["whatsapp"] as string }]
        : []),
    ];
  } else {
    userInfoDescription = [
      { key: "1", label: "Nama Lengkap", children: profile?.name || "-" },
      { key: "2", label: "Jenis Kelamin", children: GENDER_MAP[profile?.gender ?? ""] ?? "-" },
      { key: "3", label: "No KTP", children: profile?.personal_id },
      { key: "4", label: "No Whatsapp", children: profile?.whatsapp },
      { key: "5", label: "ID Line", children: profile?.line },
      { key: "6", label: "Instagram", children: profile?.instagram },
      { key: "7", label: "Tiktok", children: profile?.tiktok },
      { key: "8", label: "Linkedin", children: profile?.linkedin },
      { key: "9", label: "Provinsi", children: profile?.province?.name },
      { key: "10", label: "Universitas", children: profile?.university?.name },
      { key: "11", label: "Jurusan", children: profile?.major },
      { key: "12", label: "Angkatan", children: profile?.intake_year },
      { key: "13", label: "Jenjang", children: renderUserLevel(profile?.level) },
    ];
  }

  // Questionnaire answers: from all sections after the first one (Pertanyaan Dasar)
  let questionnaireAnswerDescription: DescriptionsProps["items"];
  if (customFormData?.is_active) {
    const allFields = customFormData.form_schema.fields
      .slice(1)
      .flatMap((section) => section.fields);
    questionnaireAnswerDescription =
      allFields.length > 0
        ? allFields.map((field) => ({
            key: field.key,
            label: field.label,
            children: formatValue(registrantData?.questionnaire_answer[field.key]),
          }))
        : undefined;
  } else {
    questionnaireAnswerDescription =
      activityData?.additional_config?.additional_questionnaire?.map((question) => ({
        key: question.name,
        label: question.label,
        children: formatValue(registrantData?.questionnaire_answer[question.name!]),
      }));
  }

  return (
    <Flex vertical gap="large" style={{ padding: 12 }}>
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          Info Peserta
          {isGuest && (
            <Tag color="orange" style={{ marginLeft: 8, fontWeight: "normal" }}>
              Tamu
            </Tag>
          )}
        </Title>
        <Flex gap="middle" align="start">
          {!isGuest && (
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
          )}
          <Descriptions
            bordered
            items={userInfoDescription}
            size="small"
            style={{ flex: 1 }}
          />
        </Flex>
      </div>

      {(questionnaireAnswerDescription?.length ?? 0) > 0 && (
        <>
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
        </>
      )}
    </Flex>
  );
};

export default RegistrantDetail;
