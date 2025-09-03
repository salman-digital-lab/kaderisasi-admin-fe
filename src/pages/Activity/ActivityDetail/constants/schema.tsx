import { Switch, TableProps, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { ColumnType } from "antd/es/table";
import { memo } from "react";

import { ProvinceRender } from "../../../../components/render/ProvinceRender";
import { UniversityRender } from "../../../../components/render/UniversityRender";
import { Registrant } from "../../../../types/model/activity";
// Memoized components for better performance
const NameLink = memo(({ text, recordId }: { text: string; recordId: number }) => (
  <Link to={"/registrant/" + recordId}>
    <Tooltip title={text} placement="topLeft">
      <span style={{ 
        display: 'block',
        maxWidth: '180px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {text}
      </span>
    </Tooltip>
  </Link>
));

const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'diterima': return '#52c41a';
      case 'ditolak': return '#ff4d4f';
      case 'menunggu': return '#faad14';
      case 'lulus kegiatan': return '#722ed1';
      default: return '#1890ff';
    }
  };

  return (
    <span 
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: getStatusColor(status),
        color: 'white',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-block',
        maxWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      title={status}
    >
      {status}
    </span>
  );
});

NameLink.displayName = 'NameLink';
StatusBadge.displayName = 'StatusBadge';

export const REGISTRANT_TABLE_SCHEMA: TableProps<Registrant>["columns"] = [
  {
    title: "Nama Lengkap",
    dataIndex: "name",
    render: (text, record) => (
      <NameLink text={text} recordId={record.id} />
    ),
    width: 200,
    fixed: 'left',
    ellipsis: {
      showTitle: false,
    },
  },
  {
    title: "Status Pendaftaran",
    dataIndex: "status",
    render: (status) => <StatusBadge status={status} />,
    width: 150,
    fixed: 'left',
  },
];

// Memoized render components for better performance
const MemoizedProvinceRender = memo(ProvinceRender);
const MemoizedUniversityRender = memo(UniversityRender);

// Optimized text cell renderer
const TextCell = memo(({ text, maxWidth = 120 }: { text: string; maxWidth?: number }) => (
  <Tooltip title={text} placement="topLeft">
    <span style={{ 
      display: 'block',
      maxWidth: `${maxWidth}px`,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      {text || '-'}
    </span>
  </Tooltip>
));

TextCell.displayName = 'TextCell';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCHEMA_MAP: Record<string, ColumnType<any>> = {
  personal_id: {
    title: "Nomor Identitas",
    dataIndex: "personal_id",
    render: (text) => <TextCell text={text} maxWidth={120} />,
    width: 140,
    ellipsis: {
      showTitle: false,
    },
  },
  intake_year: {
    title: "Angkatan",
    dataIndex: "intake_year",
    render: (text) => text ? <TextCell text={String(text)} maxWidth={80} /> : '-',
    width: 100,
  },
  major: {
    title: "Jurusan",
    dataIndex: "major",
    render: (text) => <TextCell text={text} maxWidth={150} />,
    width: 170,
    ellipsis: {
      showTitle: false,
    },
  },
  instagram: {
    title: "Instagram",
    dataIndex: "instagram",
    render: (text) => text ? (
      <a href={`https://instagram.com/${text.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
        <TextCell text={text} maxWidth={100} />
      </a>
    ) : '-',
    width: 120,
  },
  line: {
    title: "Line",
    dataIndex: "line",
    render: (text) => <TextCell text={text} maxWidth={100} />,
    width: 120,
  },
  whatsapp: {
    title: "Whatsapp",
    dataIndex: "whatsapp",
    render: (text) => text ? (
      <a href={`https://wa.me/${text.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
        <TextCell text={text} maxWidth={120} />
      </a>
    ) : '-',
    width: 140,
  },
  province_id: {
    title: "Provinsi",
    dataIndex: "province_id",
    render: (val) => <MemoizedProvinceRender provinceId={val} />,
    width: 120,
  },
  university_id: {
    title: "Universitas",
    dataIndex: "university_id",
    render: (val) => <MemoizedUniversityRender universityId={val} />,
    width: 200,
  },
};

// Memoized schema generation for better performance
let cachedSchema: any[] | null = null;
let lastMandatoryData: string[] | null = null;

export const generateTableSchema = (mandatoryProfileData: string[]) => {
  // Use cache if mandatory data hasn't changed
  if (cachedSchema && lastMandatoryData && 
      JSON.stringify(lastMandatoryData) === JSON.stringify(mandatoryProfileData)) {
    return cachedSchema;
  }

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
  }).filter(Boolean); // Remove any undefined columns

  const schema = [...REGISTRANT_TABLE_SCHEMA, ...additionalProfileData];
  
  // Cache the result
  cachedSchema = schema;
  lastMandatoryData = [...mandatoryProfileData];
  
  return schema;
};

// Function to clear cache when needed
export const clearSchemaCache = () => {
  cachedSchema = null;
  lastMandatoryData = null;
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
