import { useState } from "react";
import { useRequest, useToggle } from "ahooks";
import { Button, Input, Tooltip, Card, Space } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";

import { getProvinces } from "../../api/services/province";
import { Province } from "../../types/model/province";
import ProvinceTable from "./components/ProvinceTable";
import ProvinceForm from "./components/ProvinceForm";

const MainProvince = () => {
  const [parameters, setParameters] = useState({
    name: "",
  });
  const [editItem, setEditItem] = useState<Omit<Province, "is_active">>();
  const [state, { toggle }] = useToggle(false);

  // Local state for search input
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, error, refresh } = useRequest(() => getProvinces({}), {
    refreshDeps: [parameters],
    onError: (err) => {
      console.error("Failed to fetch provinces:", err);
    },
  });

  const openModal = (id?: number, name?: string) => {
    id && name ? setEditItem({ id, name }) : setEditItem(undefined);
    toggle();
  };

  const handleSearch = () => {
    setParameters((prev) => ({
      ...prev,
      name: searchInput.trim(),
    }));
  };

  const cardStyle = {
    borderRadius: 0,
    boxShadow: "none",
  };

  return (
    <div style={{ padding: 12 }}>
      {/* Filter Section */}
      <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
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
          <Space size={12} wrap>
            <Input
              placeholder="Cari provinsi"
              allowClear
              style={{ width: 280 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            />
          </Space>

          {/* Right: Actions */}
          <Space size={8} wrap>
            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      {/* Table Section */}
      <div style={{ ...cardStyle, marginTop: 12 }}>
        <ProvinceTable
          data={data}
          loading={loading}
          error={error}
          onRetry={refresh}
          setParameter={setParameters}
          openModal={openModal}
        />
      </div>

      <ProvinceForm
        open={state}
        onClose={() => toggle()}
        initialValues={editItem}
      />
    </div>
  );
};

export default MainProvince;
