import type { ColumnsType, ColumnType } from "antd/es/table";
import type { Key } from "react";

export function flattenColumns<T extends object>(
  columns: ColumnsType<T> = [],
): ColumnType<T>[] {
  return columns.flatMap((column) => {
    if (column.hidden) return [];
    if ("children" in column) return flattenColumns(column.children);
    return [column];
  });
}

export function columnKey<T extends object>(
  column: ColumnType<T>,
  index: number,
): Key {
  return (
    column.key ??
    (Array.isArray(column.dataIndex)
      ? column.dataIndex.join(".")
      : (column.dataIndex as string | undefined)) ??
    String(index)
  );
}

export function recordValue(record: object, path: unknown): unknown {
  const keys = Array.isArray(path) ? path : [path];
  return keys.reduce<unknown>((value, key: unknown) => {
    if (value === null || typeof value !== "object" || key == null)
      return undefined;
    return (value as Record<string, unknown>)[String(key)];
  }, record);
}

export function isActionColumn<T extends object>(
  column: ColumnType<T>,
): boolean {
  return (
    /^(actions?|next-action|aksi|tindakan)$/i.test(
      String(column.key ?? column.dataIndex ?? column.title ?? ""),
    ) ||
    (typeof column.title === "string" &&
      /^(aksi|tindakan)$/i.test(column.title))
  );
}

export function primaryColumnIndex<T extends object>(
  columns: ColumnType<T>[],
): number {
  const nameIndex = columns.findIndex((column) =>
    /nama|judul|^role$|^modul$/i.test(
      typeof column.title === "string" ? column.title : "",
    ),
  );
  return nameIndex >= 0
    ? nameIndex
    : Math.max(
        0,
        columns.findIndex((column) => !isActionColumn(column)),
      );
}

export type ListView = "cards" | "table";

export function readListView(
  storage: Pick<Storage, "getItem"> | undefined,
  key: string,
): ListView {
  try {
    return storage?.getItem(key) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}
