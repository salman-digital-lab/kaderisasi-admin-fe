import React from "react";
import { Button, Empty, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { Pagination } from "../../../../types/services/base";
import { Club } from "../../../../types/model/club";
import { createTableSchema } from "../constants/schema";
import type { FilterType } from "../constants/type";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: Club[];
  };
  loading: boolean;
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  onCreate: () => void;
}

const ClubTable = ({
  data,
  loading,
  setParameter,
  onCreate,
}: DataTypeProps) => {
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
          `Menampilkan ${range[0]}-${range[1]} dari ${total} klub`,
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
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada klub yang sesuai dengan filter"
          >
            <Button type="link" icon={<PlusOutlined />} onClick={onCreate}>
              Buat Klub Pertama
            </Button>
          </Empty>
        ),
      }}
    />
  );
};

export default ClubTable;
