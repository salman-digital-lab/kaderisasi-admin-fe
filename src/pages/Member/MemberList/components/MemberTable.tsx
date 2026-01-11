import React from "react";
import { Table, Empty, Alert, Button } from "antd";
import { ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

import { Pagination } from "../../../../types/services/base";
import { TABLE_SCHEMA } from "../constants/schema";
import { Member } from "../../../../types/model/members";
import styles from "./MemberTable.module.css";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: Member[];
  };
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      search: string;
      badge: string;
    }>
  >;
}

const MemberTable = ({
  data,
  loading,
  error,
  onRetry,
  setParameter,
}: DataTypeProps) => {
  // Custom empty state
  const customEmpty = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span style={{ color: "#999" }}>
          Belum ada data anggota yang tersedia
        </span>
      }
    />
  );

  // Error state
  if (error && !loading) {
    return (
      <Alert
        message="Gagal memuat data anggota"
        description={
          error.message ||
          "Terjadi kesalahan saat memuat data. Silakan coba lagi."
        }
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        action={
          onRetry && (
            <Button size="small" onClick={onRetry} icon={<ReloadOutlined />}>
              Coba Lagi
            </Button>
          )
        }
        style={{ margin: "24px 0" }}
      />
    );
  }

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
          `Menampilkan ${range[0]}-${range[1]} dari ${total} anggota`,
        pageSizeOptions: ["10", "20", "50", "100"],
        showLessItems: window.innerWidth < 768,
      }}
      loading={loading}
      locale={{
        emptyText: customEmpty(),
      }}
      onChange={(pagination) =>
        setParameter((prev) => ({
          ...prev,
          page: pagination.current || 1,
          per_page: pagination.pageSize || 10,
        }))
      }
      scroll={{ x: 800 }}
      size="small"
      className={styles["member-table"]}
      bordered
    />
  );
};

export default MemberTable;
