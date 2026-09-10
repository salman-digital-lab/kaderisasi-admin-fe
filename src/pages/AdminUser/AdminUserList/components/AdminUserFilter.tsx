import { ResponsiveFilters } from "../../../../components/common/Responsive/ResponsiveFilters";
import React, { useState } from "react";
import { Input, Button, Card, Space, Tooltip, Select } from "antd";
import { useRequest } from "ahooks";
import { getRoles } from "../../../../api/services/access";
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AddAdminUser from "./modal/AddAdminUser";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<
    React.SetStateAction<{
      page: number;
      per_page: number;
      name: string;
      role_code: string;
      is_active: string;
    }>
  >;
  refresh?: () => void;
  loading?: boolean;
};

const AdminUserFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const { data: roles = [] } = useRequest(getRoles);
  const reset = (): void => {
    setSearchInput("");
    setRole("");
    setStatus("");
    setParameter((prev) => ({
      ...prev,
      page: 1,
      name: "",
      role_code: "",
      is_active: "",
    }));
  };

  const handleSearch = () => {
    setParameter((prev) => ({
      ...prev,
      name: searchInput,
      role_code: role,
      is_active: status,
      page: 1,
    }));
  };

  return (
    <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
      <AddAdminUser isOpen={isOpen} setIsOpen={setIsOpen} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Left: Filters */}
        <ResponsiveFilters
          onApply={handleSearch}
          values={[searchInput, role, status]}
          onReset={reset}
        >
          {({ apply }) => (
            <Space size={12} wrap>
              <Input.Search
                placeholder="Cari nama atau email"
                aria-label="Cari nama atau email"
                allowClear
                style={{ width: 280 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={apply}
                onPressEnter={apply}
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              />
              <Select
                aria-label="Filter role"
                placeholder="Semua role"
                style={{ width: 200 }}
                allowClear
                value={role || undefined}
                onChange={(value) => setRole(value || "")}
                options={[
                  { value: "unassigned", label: "Belum memiliki role" },
                  ...roles.map((item) => ({
                    value: item.code,
                    label: item.name,
                  })),
                ]}
              />
              <Select
                aria-label="Filter status akun"
                placeholder="Semua status"
                style={{ width: 160 }}
                allowClear
                value={status || undefined}
                onChange={(value) => setStatus(value || "")}
                options={[
                  { value: "true", label: "Aktif" },
                  { value: "false", label: "Nonaktif" },
                ]}
              />
              <Button onClick={apply}>Terapkan</Button>
              <Button onClick={reset}>Reset</Button>
            </Space>
          )}
        </ResponsiveFilters>

        {/* Right: Actions */}
        <Space size={8} wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsOpen(true)}
          >
            Tambah
          </Button>
          {refresh && (
            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default AdminUserFilter;
