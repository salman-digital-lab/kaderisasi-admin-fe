import { Switch, TableProps } from "antd";
import { Link } from "react-router-dom";
import { ColumnType } from "antd/es/table";

import { ProvinceRender } from "../../../../components/render/ProvinceRender";
import { UniversityRender } from "../../../../components/render/UniversityRender";
import { Registrant } from "../../../../types/model/activity";
export const REGISTRANT_TABLE_SCHEMA: TableProps<Registrant>["columns"] = [
  {
    title: "Nama Lengkap",
    dataIndex: "name",
    render: (text, record) => (
      <Link to={"/registrant/" + record.id}>{text}</Link>
    ),
    width: 200,
  },

  {
    title: "Status Pendaftaran",
    dataIndex: "status",
    width: 120,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCHEMA_MAP: Record<string, ColumnType<any>> = {
  personal_id: {
    title: "Nomor Identitas",
    dataIndex: "personal_id",
    width: 80,
  },
  intake_year: {
    title: "Angkatan",
    dataIndex: "intake_year",
    width: 80,
  },
  major: {
    title: "Jurusan",
    dataIndex: "major",
    width: 80,
  },
  instagram: {
    title: "Instagram",
    dataIndex: "instagram",
    width: 80,
  },
  line: {
    title: "Line",
    dataIndex: "line",
    width: 80,
  },
  whatsapp: {
    title: "Whatsapp",
    dataIndex: "whatsapp",
    width: 80,
  },
  province_id: {
    title: "Provinsi",
    dataIndex: "province_id",
    render: (val) => <ProvinceRender provinceId={val} />,
    width: 80,
  },
  university_id: {
    title: "Universitas",
    dataIndex: "university_id",
    render: (val) => <UniversityRender universityId={val} />,
    width: 80,
  },
};

export const generateTableSchema = (mandatoryProfileData: string[]) => {
  const ALLOWED_DATA = [
    "personal_id",
    "whatsapp",
    "province_id",
    "university_id",
    "instagram",
    "line",
    "major",
    "intake_year",
  ];

  const cleanList = mandatoryProfileData.filter((val) =>
    ALLOWED_DATA.includes(val),
  );
  const additionalProfileData = cleanList.map((val) => {
    return SCHEMA_MAP[val];
  });

  return [...REGISTRANT_TABLE_SCHEMA, ...additionalProfileData];
};

export const MANDATORY_DATA_TABLE_COLUMNS: (
  onChange: React.Dispatch<
    React.SetStateAction<
      {
        is_shown: boolean;
        required: boolean;
      }[]
    >
  >,
) => TableProps<{
  key: number;
  fieldname: string;
  label: string;
  required?: boolean;
  is_shown?: boolean;
}>["columns"] = (onChange) => [
  {
    title: "Nama Data",
    dataIndex: "label",
  },
  {
    title: "Tampil Pada Form",
    dataIndex: "is_shown",
    render: (val: boolean, rec: { key: number }) => (
      <Switch
        checked={val}
        onChange={() =>
          onChange((prev) => {
            const resArr = [...prev];
            resArr[rec.key] = {
              ...resArr[rec.key],
              is_shown: !resArr[rec.key].is_shown,
              required: !resArr[rec.key].is_shown,
            };
            return resArr;
          })
        }
      />
    ),
  },
  {
    title: "Wajib Di Isi",
    dataIndex: "required",
    render: (val: boolean, rec: { key: number }) => (
      <Switch
        checked={val}
        onChange={() =>
          onChange((prev) => {
            const resArr = [...prev];
            resArr[rec.key] = {
              ...resArr[rec.key],
              required: !resArr[rec.key].required,
            };
            return resArr;
          })
        }
      />
    ),
  },
];
