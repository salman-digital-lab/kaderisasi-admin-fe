import { Table } from "antd";
import { LifetimeLeaderboardType } from "../../../../types/services/leaderboard";
import { Pagination } from "../../../../types/services/base";
import { TABLE_SCHEMA } from "../constants/schema";

interface LifetimeLeaderboardTableProps {
  data?: {
    meta: Pagination;
    data: LifetimeLeaderboardType[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      email: string;
      name: string;
    }>
  >;
}

export default function LifetimeLeaderboardTable({
  data,
  loading,
  setParameter,
}: LifetimeLeaderboardTableProps) {
  return (
    <Table
      rowKey="id"
      columns={TABLE_SCHEMA}
      dataSource={data?.data?.map((item, index) => ({
        ...item,
        rank: (data.meta.current_page - 1) * data.meta.per_page + index + 1,
      }))}
      pagination={{
        current: data?.meta.current_page,
        pageSize: data?.meta.per_page,
        showSizeChanger: true,
        showQuickJumper: true,
        total: data?.meta.total,
        showTotal: (total, range) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} data`,
        pageSizeOptions: ["10", "20", "50", "100"],
      }}
      loading={loading}
      onChange={(pagination) =>
        setParameter((prev) => ({
          ...prev,
          page: pagination.current || 1,
          per_page: pagination.pageSize || 10,
        }))
      }
      scroll={{ x: 800 }}
      size="small"
      bordered
    />
  );
}
