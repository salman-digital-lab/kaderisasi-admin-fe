import React from "react";
import { Card, Table } from "antd";

import { Pagination } from "../../../../types/services/base";
import { TABLE_SCHEMA } from "../constants/schema";
import { Member } from "../../../../types/model/members";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: Member[];
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

const MemberTable = ({ data, loading, setParameter }: DataTypeProps) => {
  return (
    <Card>
      <Table
        rowKey="id"
        columns={TABLE_SCHEMA}
        dataSource={data?.data}
        pagination={{
          current: data?.meta.current_page,
          pageSize: data?.meta.per_page,
          showSizeChanger: true,
          total: data?.meta.total,
        }}
        loading={loading}
        onChange={(pagination) =>
          setParameter((prev) => ({
            ...prev,
            page: pagination.current || 1,
            per_page: pagination.pageSize || 10,
          }))
        }
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default MemberTable;
