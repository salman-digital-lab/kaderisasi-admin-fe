import React from "react";
import { Table, Empty, Alert, Button } from "antd";
import { ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

import { TABLE_SCHEMA } from "../constants/schema";
import { Province } from "../../../types/model/province";

interface DataTypeProps {
  data?: {
    data: Province[];
  };
  loading: boolean;
  error?: Error | null;
  onRetry?: () => void;
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
  error,
  onRetry,
  setParameter,
  openModal,
}: DataTypeProps) => {
  // Custom empty state
  const customEmpty = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span style={{ color: "#999" }}>
          Belum ada data provinsi yang tersedia
        </span>
      }
    />
  );

  // Error state
  if (error && !loading) {
    return (
      <Alert
        message="Gagal memuat data provinsi"
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
      columns={TABLE_SCHEMA(openModal)}
      dataSource={data?.data}
      loading={loading}
      locale={{
        emptyText: customEmpty(),
      }}
      onChange={() =>
        setParameter((prev) => ({
          ...prev,
        }))
      }
      scroll={{ x: 1200 }}
      size="small"
      bordered
    />
  );
};

export default ProvinceTable;
