import { useRef, useState, type ReactElement } from "react";
import { Button, Segmented, Select, Space, Table } from "antd";
import type { TableProps } from "antd";
import type {
  SorterResult,
  TablePaginationConfig,
} from "antd/es/table/interface";
import { useAdminViewport } from "../../../hooks/useAdminViewport";
import { MobileRecordCard } from "./MobileRecordCard";
import {
  columnKey,
  flattenColumns,
  readListView,
  primaryColumnIndex,
  recordValue,
  type ListView,
} from "./record-columns";

export interface ResponsiveTableProps<T extends object> extends TableProps<T> {
  listId: string;
}

export function ResponsiveTable<T extends object>({
  listId,
  ...props
}: ResponsiveTableProps<T>): ReactElement {
  const { compact } = useAdminViewport();
  const storageKey = `admin-list-view:${listId}`;
  const [view, setView] = useState<ListView>(() => {
    try {
      return readListView(window.sessionStorage, storageKey);
    } catch {
      return "cards";
    }
  });
  const [sorter, setSorter] = useState<SorterResult<T> | SorterResult<T>[]>({});
  const paginationRef = useRef<TablePaginationConfig>({});
  const flatColumns = flattenColumns(props.columns);
  const columns = flatColumns.map((column, index) => {
    const key = columnKey(column, index);
    const active = (Array.isArray(sorter) ? sorter : [sorter]).find(
      (item) => item.columnKey === key,
    );
    return {
      ...column,
      key,
      ...(!("sortOrder" in column) && active
        ? { sortOrder: active.order }
        : {}),
    };
  });
  const sortable = columns.filter((column) => column.sorter);
  const selectedSort = sortable.find((column) => column.sortOrder);
  const cards = compact && view === "cards";
  const rowSelection = props.rowSelection
    ? {
        ...props.rowSelection,
        ...(compact ? { fixed: false } : {}),
        getCheckboxProps: (record: T) => {
          const existing = props.rowSelection?.getCheckboxProps?.(record);
          const identity = recordValue(
            record,
            flatColumns[primaryColumnIndex(flatColumns)]?.dataIndex,
          );
          const key =
            typeof props.rowKey === "function"
              ? props.rowKey(record)
              : recordValue(record, props.rowKey ?? "key");
          return {
            "aria-label": `Pilih ${typeof identity === "string" || typeof identity === "number" ? identity : (key ?? "data")}`,
            ...existing,
          };
        },
      }
    : undefined;
  const changeView = (next: ListView): void => {
    setView(next);
    try {
      sessionStorage.setItem(storageKey, next);
    } catch {
      /* Optional preference storage. */
    }
  };
  const sortBy = (value: string): void => {
    const [index, order] = value.split(":");
    const column = sortable[Number(index)];
    const next: SorterResult<T> = column
      ? {
          column,
          columnKey: column.key,
          field: column.dataIndex as SorterResult<T>["field"],
          order: order === "ascend" ? "ascend" : "descend",
        }
      : {};
    // Null clears old controlled sorting in Ant Table without remounting it.
    setSorter(
      columns
        .filter((item) => item.sorter)
        .map((item) => ({
          column: item,
          columnKey: item.key,
          field: item.dataIndex as SorterResult<T>["field"],
          order: item.key === next.columnKey ? next.order : null,
        })),
    );
    const pagination =
      props.pagination === false
        ? {}
        : {
            pageSize: 10,
            ...paginationRef.current,
            ...props.pagination,
            current: 1,
          };
    paginationRef.current = pagination;
    props.onChange?.(pagination, {}, next, {
      action: "sort",
      currentDataSource: [...(props.dataSource ?? [])],
    });
  };
  const onChange: NonNullable<TableProps<T>["onChange"]> = (
    pagination,
    filters,
    nextSorter,
    extra,
  ) => {
    paginationRef.current = pagination;
    setSorter(nextSorter);
    props.onChange?.(pagination, filters, nextSorter, extra);
  };

  return (
    <section
      className={`responsive-record-list ${cards ? "responsive-record-list-cards" : ""}`}
      aria-label="Daftar data"
      data-list-id={listId}
    >
      {compact && (
        <Space className="responsive-list-controls" wrap>
          <Segmented<ListView>
            aria-label="Tampilan daftar"
            value={view}
            onChange={changeView}
            options={[
              { label: "Kartu", value: "cards" },
              { label: "Tabel", value: "table" },
            ]}
          />
          {cards && sortable.length > 0 && (
            <Select
              aria-label="Urutkan data"
              placeholder="Urutkan data"
              value={
                selectedSort
                  ? `${sortable.indexOf(selectedSort)}:${selectedSort.sortOrder}`
                  : undefined
              }
              onChange={sortBy}
              options={sortable.flatMap((column, index) =>
                (["ascend", "descend"] as const).map((order) => ({
                  value: `${index}:${order}`,
                  label: `${typeof column.title === "string" ? column.title : "Kolom"} · ${order === "ascend" ? "menaik" : "menurun"}`,
                })),
              )}
            />
          )}
          {props.rowSelection?.selectedRowKeys?.length ? (
            <div className="responsive-selection-bar" role="status">
              <span>{props.rowSelection.selectedRowKeys.length} dipilih</span>
              <Button
                onClick={() =>
                  props.rowSelection?.onChange?.([], [], { type: "none" })
                }
              >
                Batal pilih
              </Button>
            </div>
          ) : null}
        </Space>
      )}
      <Table<T>
        {...props}
        columns={
          cards
            ? [
                ...columns.map((column) => ({
                  ...column,
                  hidden: true,
                  responsive: undefined,
                })),
                {
                  key: "mobile-record",
                  title: "Data",
                  render: (_value: unknown, record: T, index: number) => (
                    <MobileRecordCard
                      record={record}
                      index={index}
                      columns={flatColumns}
                    />
                  ),
                },
              ]
            : compact
              ? columns.map((column) => ({ ...column, fixed: undefined }))
              : columns
        }
        rowSelection={rowSelection}
        onChange={onChange}
        scroll={
          cards
            ? undefined
            : compact
              ? { ...props.scroll, y: undefined }
              : props.scroll
        }
        sticky={compact ? false : props.sticky}
        showHeader={cards ? Boolean(props.rowSelection) : props.showHeader}
        size={compact ? "middle" : props.size}
        pagination={
          props.pagination === false
            ? false
            : {
                ...paginationRef.current,
                ...props.pagination,
                ...(compact
                  ? {
                      simple: true,
                      showQuickJumper: false,
                      showSizeChanger:
                        props.pagination?.showSizeChanger ?? true,
                    }
                  : {}),
              }
        }
      />
    </section>
  );
}
