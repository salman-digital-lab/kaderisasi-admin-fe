import React from "react";
import { Table, Empty, Alert, Button, Tag } from "antd";
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
      member_id: string;
      education_institution: string;
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

  const columnsWithStatus = [
    ...(TABLE_SCHEMA ?? []),
    {
      title: "Status Akun",
      dataIndex: "publicUser",
      key: "account_status",
      width: 120,
      render: (publicUser: Member["publicUser"]) => {
        const status = publicUser?.account_status ?? "no_account";
        return status === "active" ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="default">Tanpa Akun</Tag>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columnsWithStatus}
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
      locale={{ emptyText: customEmpty() }}
      onChange={(pagination) =>
        setParameter((prev) => ({
          ...prev,
          page: pagination.current || 1,
          per_page: pagination.pageSize || 10,
        }))
      }
      scroll={{ x: 900 }}
      size="small"
      className={styles["member-table"]}
      bordered
    />
  );
};

export default MemberTable;
