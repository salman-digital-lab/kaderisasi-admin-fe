import { TableProps, Tooltip, Tag, Button } from "antd";
import { Link } from "react-router-dom";
import { EyeOutlined } from "@ant-design/icons";
import { memo } from "react";
import { ProvinceRender } from "../../../../components/render/ProvinceRender";
import { UniversityRender } from "../../../../components/render/UniversityRender";
import { Registrant } from "../../../../types/model/activity";
import { USER_LEVEL_OPTIONS } from "../../../../constants/options";

// Memoized text cell component
const TextCell = memo(
  ({ text, maxWidth = 120 }: { text: string; maxWidth?: number }) => (
    <Tooltip title={text} placement="topLeft">
      <span
        style={{
          display: "block",
          maxWidth: `${maxWidth}px`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {text || "-"}
      </span>
    </Tooltip>
  ),
);

TextCell.displayName = "TextCell";

// Memoized name link component
const NameLink = memo(
  ({
    text,
    recordId,
    email,
    activityId,
  }: {
    text: string;
    recordId: number;
    email?: string;
    activityId: number;
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Tooltip title={text} placement="topLeft">
          <span
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: "1.2",
              fontWeight: 500,
            }}
          >
            {text}
          </span>
        </Tooltip>
        {email && (
          <Tooltip title={email} placement="topLeft">
            <span
              style={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "11px",
                color: "#8c8c8c",
                marginTop: "2px",
                lineHeight: "1.2",
              }}
            >
              {email}
            </span>
          </Tooltip>
        )}
      </div>
      <Link to={`/activity/${activityId}/participants/${recordId}`}>
        <Button size="small" icon={<EyeOutlined />} />
      </Link>
    </div>
  ),
);

NameLink.displayName = "NameLink";

// Status badge with colors
const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DITERIMA":
        return "green";
      case "DITOLAK":
      case "TIDAK DITERIMA":
      case "TIDAK LULUS":
        return "red";
      case "TERDAFTAR":
        return "blue";
      case "LULUS KEGIATAN":
        return "purple";
      default:
        return "default";
    }
  };

  return <Tag color={getStatusColor(status)}>{status}</Tag>;
});

StatusBadge.displayName = "StatusBadge";

// Memoized render components
const MemoizedProvinceRender = memo(ProvinceRender);
const MemoizedUniversityRender = memo(UniversityRender);

export interface ColumnConfig {
  key: string;
  title: string;
  dataIndex: string;
  visible: boolean;
  fixed?: "left" | "right" | boolean;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: Registrant) => React.ReactNode;
}

// All available columns for participant management
export const ALL_COLUMNS: ColumnConfig[] = [
  {
    key: "name",
    title: "Nama Lengkap",
    dataIndex: "name",
    visible: true,
    fixed: "left",
    width: 200,
    sortable: true,
    filterable: true,
    render: (text, record) => (
      <NameLink
        text={text as string}
        recordId={record.id}
        email={record.email}
        activityId={record.activity_id}
      />
    ),
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    visible: true,
    width: 150,
    sortable: true,
    filterable: true,
    render: (status) => <StatusBadge status={status as string} />,
  },
  {
    key: "whatsapp",
    title: "Whatsapp",
    dataIndex: "whatsapp",
    visible: true,
    width: 140,
    sortable: false,
    filterable: false,
    render: (text) =>
      text ? (
        <a
          href={`https://wa.me/${(text as string).replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <TextCell text={text as string} maxWidth={120} />
        </a>
      ) : (
        "-"
      ),
  },
  {
    key: "university_id",
    title: "Universitas",
    dataIndex: "university_id",
    visible: true,
    width: 200,
    sortable: true,
    filterable: true,
    render: (val) => <MemoizedUniversityRender universityId={val as number} />,
  },
  {
    key: "province_id",
    title: "Provinsi",
    dataIndex: "province_id",
    visible: false,
    width: 150,
    sortable: true,
    filterable: true,
    render: (val) => <MemoizedProvinceRender provinceId={val as number} />,
  },
  {
    key: "major",
    title: "Jurusan",
    dataIndex: "major",
    visible: true,
    width: 170,
    sortable: true,
    filterable: false,
    render: (text) => <TextCell text={text as string} maxWidth={150} />,
  },
  {
    key: "intake_year",
    title: "Angkatan",
    dataIndex: "intake_year",
    visible: true,
    width: 100,
    sortable: true,
    filterable: true,
    render: (text) =>
      text ? <TextCell text={String(text)} maxWidth={80} /> : "-",
  },
  {
    key: "personal_id",
    title: "Nomor Identitas",
    dataIndex: "personal_id",
    visible: false,
    width: 140,
    sortable: false,
    filterable: false,
    render: (text) => <TextCell text={text as string} maxWidth={120} />,
  },
  {
    key: "instagram",
    title: "Instagram",
    dataIndex: "instagram",
    visible: false,
    width: 120,
    sortable: false,
    filterable: false,
    render: (text) =>
      text ? (
        <a
          href={`https://instagram.com/${(text as string).replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <TextCell text={text as string} maxWidth={100} />
        </a>
      ) : (
        "-"
      ),
  },
  {
    key: "line",
    title: "Line",
    dataIndex: "line",
    visible: false,
    width: 120,
    sortable: false,
    filterable: false,
    render: (text) => <TextCell text={text as string} maxWidth={100} />,
  },
  {
    key: "level",
    title: "Jenjang",
    dataIndex: "level",
    visible: false,
    width: 100,
    sortable: true,
    filterable: false,
    render: (level) => {
      const option = USER_LEVEL_OPTIONS.find((opt) => opt.value === level);
      return option?.label || String(level);
    },
  },
];

// Convert column config to Ant Design table columns
export const generateTableColumns = (
  columns: ColumnConfig[],
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (field: string) => void,
): TableProps<Registrant>["columns"] => {
  return columns
    .filter((col) => col.visible)
    .map((col) => ({
      title: col.sortable ? (
        <div
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => onSort?.(col.key)}
        >
          {col.title}{" "}
          {sortBy === col.key && (
            <span style={{ marginLeft: 4 }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      ) : (
        col.title
      ),
      dataIndex: col.dataIndex,
      key: col.key,
      fixed: col.fixed,
      width: col.width,
      ellipsis: { showTitle: false },
      render: col.render,
    }));
};

// Get default column order
export const getDefaultColumns = (): ColumnConfig[] => {
  return ALL_COLUMNS.map((col) => ({ ...col }));
};

// Storage key for column preferences
export const COLUMN_STORAGE_KEY = "participant_column_preferences";

// Load column preferences from localStorage
export const loadColumnPreferences = (
  activityId: string,
): ColumnConfig[] | null => {
  try {
    const stored = localStorage.getItem(`${COLUMN_STORAGE_KEY}_${activityId}`);
    if (stored) {
      const parsed = JSON.parse(stored) as Array<{
        key: string;
        visible: boolean;
      }>;
      // Merge with current ALL_COLUMNS to handle new columns
      return ALL_COLUMNS.map((col) => {
        const saved = parsed.find((p) => p.key === col.key);
        return saved ? { ...col, visible: saved.visible } : col;
      }).sort((a, b) => {
        const aIndex = parsed.findIndex((p) => p.key === a.key);
        const bIndex = parsed.findIndex((p) => p.key === b.key);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
  } catch (e) {
    console.error("Failed to load column preferences:", e);
  }
  return null;
};

// Save column preferences to localStorage
export const saveColumnPreferences = (
  activityId: string,
  columns: ColumnConfig[],
): void => {
  try {
    const toSave = columns.map((col) => ({
      key: col.key,
      visible: col.visible,
    }));
    localStorage.setItem(
      `${COLUMN_STORAGE_KEY}_${activityId}`,
      JSON.stringify(toSave),
    );
  } catch (e) {
    console.error("Failed to save column preferences:", e);
  }
};
