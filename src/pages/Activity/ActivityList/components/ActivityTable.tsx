import React from "react";
import { Card, Table, Empty, Alert, Button } from "antd";
import { ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

import { Pagination } from "../../../../types/services/base";
import { Activity } from "../../../../types/model/activity";
import { TABLE_SCHEMA } from "../constants/schema";
import styles from "./ActivityTable.module.css";

interface DataTypeProps {
  data?: {
    meta: Pagination;
    data: Activity[];
  };
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
    }>
  >;
}

const ActivityTable = ({ data, loading, error, onRetry, setParameter }: DataTypeProps) => {
  // Custom empty state
  const customEmpty = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span style={{ color: '#999' }}>
          Belum ada data aktivitas yang tersedia
        </span>
      }
    />
  );

  // Error state
  if (error && !loading) {
    return (
      <Card>
        <Alert
          message="Gagal memuat data aktivitas"
          description={error.message || "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
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
          style={{ margin: '24px 0' }}
        />
      </Card>
    );
  }

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
          showQuickJumper: true,
          total: data?.meta.total,
          showTotal: (total, range) =>
            `Menampilkan ${range[0]}-${range[1]} dari ${total} aktivitas`,
          pageSizeOptions: ['10', '20', '50', '100'],
          showLessItems: window.innerWidth < 768, // Responsive pagination
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
        scroll={{ x: 1200 }}
        size="middle"
        className={styles['activity-table']}
      />
    </Card>
  );
};

export default ActivityTable;
