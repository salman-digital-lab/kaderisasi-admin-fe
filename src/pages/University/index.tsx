import { useState } from "react";
import { Button, Input, Tooltip, Card, Space } from "antd";
import { useRequest, useToggle } from "ahooks";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { University } from "../../types/model/university";
import { getUniversities } from "../../api/services/university";

import UniversityForm from "./components/UniversityForm";
import UniversitiesTable from "./components/UniversityTable";

const MainUniversity = () => {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    name: "",
  });
  const [editItem, setEditItem] = useState<University>({
    id: 0,
    name: "",
    province_id: undefined,
  });
  const [state, { toggle }] = useToggle(false);

  // Local state for search input
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, error, refresh } = useRequest(
    () =>
      getUniversities({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
      }),
    {
      refreshDeps: [parameters],
      onError: (err) => {
        console.error("Failed to fetch universities:", err);
      },
    },
  );

  const openModal = (id?: number, name?: string, province_id?: number) => {
    id && name
      ? setEditItem({ id, name, province_id })
      : setEditItem({ id: 0, name: "", province_id: undefined });
    toggle();
  };

  const handleSearch = () => {
    setParameters((prev) => ({
      ...prev,
      name: searchInput.trim(),
      page: 1,
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
              placeholder="Cari universitas"
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
            <Button onClick={() => openModal()} icon={<PlusOutlined />}>
              Tambah Universitas
            </Button>
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
        <UniversitiesTable
          data={data}
          loading={loading}
          error={error}
          onRetry={refresh}
          setParameter={setParameters}
          openModal={openModal}
        />
      </div>

      <UniversityForm
        open={state}
        onClose={() => toggle()}
        initialValues={editItem}
      />
    </div>
  );
};

export default MainUniversity;
