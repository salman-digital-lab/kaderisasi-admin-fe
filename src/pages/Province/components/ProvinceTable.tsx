import React from "react";
import { Table, Card } from "antd";

import { TABLE_SCHEMA } from "../constants/schema";
import { Province } from "../../../types/model/province";

interface DataTypeProps {
  data?: {
    data: Province[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      name: string;
    }>
  >;
  openModal: (id?: number, name?: string) => void;
}

const ProvinceTable = ({
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
        loading={loading}
        onChange={() =>
          setParameter((prev) => ({
            ...prev,
          }))
        }
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default ProvinceTable;
