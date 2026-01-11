import React from "react";
import { Table } from "antd";

import { Pagination } from "../../../../types/services/base";
import { Club } from "../../../../types/model/club";
import { createTableSchema } from "../constants/schema";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: Club[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
}

const ClubTable = ({ data, loading, setParameter }: DataTypeProps) => {
  const tableSchema = createTableSchema();

  return (
    <Table
      rowKey="id"
      columns={tableSchema}
      dataSource={data?.data}
      pagination={{
        current: data?.meta.current_page,
        pageSize: data?.meta.per_page,
        showSizeChanger: true,
        showQuickJumper: true,
        total: data?.meta.total,
        showTotal: (total, range) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} club`,
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
};

export default ClubTable;
