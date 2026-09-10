import { isValidElement, type ReactElement, type ReactNode } from "react";
import type { ColumnType } from "antd/es/table";
import {
  columnKey,
  isActionColumn,
  primaryColumnIndex,
  recordValue,
} from "./record-columns";

interface MobileRecordCardProps<T extends object> {
  record: T;
  index: number;
  columns: ColumnType<T>[];
}

function asNode(value: unknown): ReactNode {
  if (value == null) return "—";
  if (isValidElement(value)) return value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (Array.isArray(value)) return value.map(asNode);
  if (typeof value === "object" && "children" in value)
    return asNode(value.children);
  return "—";
}

export function MobileRecordCard<T extends object>({
  record,
  index,
  columns,
}: MobileRecordCardProps<T>): ReactElement {
  const primary = primaryColumnIndex(columns);
  const renderCell = (column: ColumnType<T>): ReactNode => {
    const value = recordValue(record, column.dataIndex);
    return asNode(column.render ? column.render(value, record, index) : value);
  };
  const fields = columns.filter(
    (column, i) => i !== primary && !isActionColumn(column),
  );
  const summary = fields.filter(
    (column, i) => i < 2 || /status/i.test(String(column.title)),
  );
  const additional = fields.filter((column) => !summary.includes(column));
  const renderFields = (items: ColumnType<T>[]): ReactElement => (
    <dl className="mobile-record-fields">
      {items.map((column, i) => (
        <div key={columnKey(column, i)}>
          <dt>
            {typeof column.title === "function"
              ? column.title({})
              : column.title}
          </dt>
          <dd>{renderCell(column)}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <article className="mobile-record-card">
      <div className="mobile-record-title">
        {columns[primary] && renderCell(columns[primary])}
      </div>
      {renderFields(summary)}
      {additional.length > 0 && (
        <details
          className="mobile-record-details"
          onClick={(event) => event.stopPropagation()}
        >
          <summary>Detail lainnya ({additional.length})</summary>
          {renderFields(additional)}
        </details>
      )}
      {columns.some(isActionColumn) && (
        <div className="mobile-record-actions">
          {columns.filter(isActionColumn).map((column, i) => (
            <div key={columnKey(column, i)}>{renderCell(column)}</div>
          ))}
        </div>
      )}
    </article>
  );
}
