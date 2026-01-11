import React from "react";
import { Table, Button, Popconfirm, message } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

import { Pagination } from "../../../../types/services/base";
import { CustomForm } from "../../../../types/model/customForm";
import { TABLE_SCHEMA } from "../constants/schema";
import { deleteCustomForm } from "../../../../api/services/customForm";

interface CustomFormTableProps {
  data?: {
    meta: Pagination;
    data: CustomForm[];
  };
  loading: boolean;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      search: string;
      feature_type?: "activity_registration" | "club_registration";
      feature_id?: string;
      is_active?: boolean;
    }>
  >;
  refresh: () => void;
}

const CustomFormTable: React.FC<CustomFormTableProps> = ({
  data,
  loading,
  setParameter,
  refresh,
}) => {
  const handleDelete = async (id: number) => {
    try {
      await deleteCustomForm(id);
      refresh();
    } catch (error) {
      message.error("Gagal menghapus form");
    }
  };

  const enhancedSchema = TABLE_SCHEMA?.map((column) => {
    if (column.key === "actions") {
      return {
        ...column,
        render: (_: any, record: CustomForm) => (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link to={`/custom-form/${record.id}/edit`}>
              <Button icon={<EditOutlined />} size="small">
                Edit
              </Button>
            </Link>
            <Popconfirm
              title="Hapus Form"
              description="Apakah Anda yakin ingin menghapus form ini?"
              onConfirm={() => handleDelete(record.id)}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                Hapus
              </Button>
            </Popconfirm>
          </div>
        ),
      };
    }
    return column;
  });

  return (
    <Table
      rowKey="id"
      columns={enhancedSchema}
      dataSource={data?.data}
      pagination={{
        current: data?.meta.current_page,
        pageSize: data?.meta.per_page,
        showSizeChanger: true,
        showQuickJumper: true,
        total: data?.meta.total,
        showTotal: (total, range) =>
          `Menampilkan ${range[0]}-${range[1]} dari ${total} form`,
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
      scroll={{ x: 1200 }}
      size="small"
      bordered
    />
  );
};

export default CustomFormTable;
