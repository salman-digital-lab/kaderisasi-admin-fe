import { Switch, type TableProps, Tooltip } from "antd";
import { Link } from "react-router-dom";
import { memo } from "react";

const NameLink = memo(
  ({ text, recordId }: { text: string; recordId: number }) => (
    <Link to={"/registrant/" + recordId}>
      <Tooltip title={text} placement="topLeft">
        <span
          style={{
            display: "block",
            maxWidth: "180px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </Tooltip>
    </Link>
  ),
);

NameLink.displayName = "NameLink";

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
    title: "Tampil Pada Formulir",
    dataIndex: "is_shown",
    render: (val: boolean, rec: { key: number }) => (
      <Switch
        checked={val}
        onChange={() =>
          onChange((prev) => {
            const current = prev[rec.key];
            if (!current) return prev;
            const resArr = [...prev];
            resArr[rec.key] = {
              ...current,
              is_shown: !current.is_shown,
              required: !current.is_shown,
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
            const current = prev[rec.key];
            if (!current) return prev;
            const resArr = [...prev];
            resArr[rec.key] = { ...current, required: !current.required };
            return resArr;
          })
        }
      />
    ),
  },
];
