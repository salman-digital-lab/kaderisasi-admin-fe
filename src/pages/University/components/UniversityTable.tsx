import React from "react";
import { Table, Card } from "antd";
import { Pagination } from "../../../types/services/base";
import { TABLE_SCHEMA } from "../constants/schema";
import { University } from "../../../types/model/university";
interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: University[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
  openModal: (id: number, name: string) => void;
}

const UniversitiesTable = ({
  data,
  loading,
  setParameter,
  openModal,
}: DataTypeProps) => {
  return (
    <Card>
      <Table
        rowKey="id"
        columns={TABLE_SCHEMA(openModal)}
        dataSource={data?.data}
        pagination={{
          current: data?.meta?.current_page,
          pageSize: data?.meta?.per_page,
          showSizeChanger: true,
          total: data?.meta?.total,
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

export default UniversitiesTable;
