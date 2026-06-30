import { Table } from "antd";
import type { TableProps } from "antd";
import type { Achievement } from "../../../../types/model/achievements";
import type { Pagination } from "../../../../types/services/base";
import { TABLE_SCHEMA } from "../constants/schema";
import type { AchievementListParameters } from "../index";
import type { AchievementSortBy } from "../../../../types/services/achievement";

interface AchievementTableProps {
  data?: {
    meta: Pagination;
    data: Achievement[];
  };
  loading: boolean;
  parameters: AchievementListParameters;
  setParameter: React.Dispatch<React.SetStateAction<AchievementListParameters>>;
}

export default function AchievementTable({
  data,
  loading,
  parameters,
  setParameter,
}: AchievementTableProps) {
  const handleChange: TableProps<Achievement>["onChange"] = (
    pagination,
    _filters,
    sorter,
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortBy = activeSorter?.columnKey as AchievementSortBy | undefined;

    setParameter((prev) => ({
      ...prev,
      page: pagination.current || 1,
      per_page: pagination.pageSize || 10,
      sort_by:
        sortBy === "achievement_date" || sortBy === "created_at"
          ? sortBy
          : undefined,
      sort_order:
        activeSorter?.order === "ascend"
          ? "asc"
          : activeSorter?.order === "descend"
            ? "desc"
            : undefined,
    }));
  };

  return (
    <Table
      rowKey="id"
      columns={TABLE_SCHEMA(parameters.sort_by, parameters.sort_order)}
      dataSource={data?.data}
      pagination={{
        current: data?.meta.current_page,
        pageSize: data?.meta.per_page,
        showSizeChanger: true,
        showQuickJumper: true,
        total: data?.meta.total,
        showTotal: (total, range) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} prestasi`,
        pageSizeOptions: ["10", "20", "50", "100"],
      }}
      loading={loading}
      onChange={handleChange}
      scroll={{ x: 800 }}
      size="small"
      bordered
    />
  );
}
