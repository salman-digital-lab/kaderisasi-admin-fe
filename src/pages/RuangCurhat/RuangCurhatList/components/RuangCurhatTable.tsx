import React from "react";
import { Table } from "antd";

import { Pagination } from "../../../../types/services/base";
import { RuangCurhatData } from "../../../../types/model/ruangcurhat";
import { TABLE_SCHEMA } from "../constants/schema";
import { PROBLEM_STATUS_ENUM } from "../../../../types/constants/ruangcurhat";
import { GENDER } from "../../../../types/constants/profile";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: RuangCurhatData[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      status?: PROBLEM_STATUS_ENUM;
      name?: string;
      gender?: GENDER;
    }>
  >;
}

const RuangCurhatTable = ({ data, loading, setParameter }: DataTypeProps) => {
  return (
    <Table
      rowKey="id"
      columns={TABLE_SCHEMA}
      dataSource={data?.data}
      pagination={{
        current: data?.meta.current_page,
        pageSize: data?.meta.per_page,
        showSizeChanger: true,
        showQuickJumper: true,
        total: data?.meta.total,
        showTotal: (total, range) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} masalah`,
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

export default RuangCurhatTable;
