import type { DescriptionsProps } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { CityRender } from "../../../../components/render/CityRender";
import { ProvinceRender } from "../../../../components/render/ProvinceRender";
import { UniversityRender } from "../../../../components/render/UniversityRender";
import { renderUserLevel } from "../../../../constants/render";
import type {
  ClubRegistration,
  Profile,
} from "../../../../types/model/clubRegistration";
import type { FormField, FormSchema } from "../../../../types/model/customForm";
import {
  currentEducation,
  formatCurrentEducation,
  formatEducationHistory,
  formatWorkHistory,
} from "../../../../utils/education";
import { formatApplicationAnswer } from "./application-answers";

const DEFAULT_FIELDS: FormField[] = [
  { key: "name", label: "Nama", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: false },
  { key: "whatsapp", label: "WhatsApp", type: "text", required: false },
];

function profileValue(
  registration: ClubRegistration,
  field: FormField,
): ReactNode {
  const profile = registration.member?.profile;
  if (field.key === "email") return registration.member?.email || "-";
  if (field.key === "name")
    return profile?.name || registration.member?.email || "Pendaftar";
  if (field.key === "current_education")
    return formatCurrentEducation(currentEducation(profile?.education_history));
  if (field.key === "education_history")
    return formatEducationHistory(profile?.education_history);
  if (field.key === "work_history")
    return formatWorkHistory(profile?.work_history);

  const value = profile?.[field.key as keyof Profile];
  if (value === null || value === undefined || value === "") return "-";
  if (field.key === "province_id" || field.key === "origin_province_id")
    return <ProvinceRender provinceId={Number(value)} />;
  if (field.key === "city_id" || field.key === "origin_city_id")
    return <CityRender cityId={Number(value)} />;
  if (field.key === "university_id")
    return <UniversityRender universityId={Number(value)} />;
  if (field.key === "birth_date")
    return dayjs(String(value)).isValid()
      ? dayjs(String(value)).format("DD MMM YYYY")
      : formatApplicationAnswer(value);
  if (field.key === "level") return renderUserLevel(Number(value));
  if (field.key === "gender")
    return formatApplicationAnswer(
      value,
      field.options?.length
        ? field.options
        : [
            { value: "M", label: "Laki-laki" },
            { value: "F", label: "Perempuan" },
          ],
    );
  return formatApplicationAnswer(value, field.options);
}

export function buildApplicationProfileItems(
  registration: ClubRegistration,
  schema?: FormSchema,
): NonNullable<DescriptionsProps["items"]> {
  const sections = schema?.fields.filter(
    (section) => section.section_name === "profile_data",
  );
  const fields = sections?.length
    ? sections.flatMap((section) => section.fields)
    : DEFAULT_FIELDS;
  const seen = new Set<string>();
  const items: NonNullable<DescriptionsProps["items"]> = [];
  for (const field of fields) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    items.push({
      key: field.key,
      label: field.label,
      children: profileValue(registration, field),
    });
  }
  if (!seen.has("email"))
    items.push({
      key: "email",
      label: "Email",
      children: registration.member?.email || "-",
    });
  return items;
}
