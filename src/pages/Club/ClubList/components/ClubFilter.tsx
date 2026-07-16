import { Input, Card, Button, Space, Tooltip, Select } from "antd";
import { useState } from "react";
import { useToggle } from "ahooks";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import { FilterType } from "../constants/type";
import ClubForm from "./ClubForm";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
  loading?: boolean;
};

const ClubFilter = ({ setParameter, refresh, loading }: FilterProps) => {
  const [state, { toggle }] = useToggle(false);
  const [searchInput, setSearchInput] = useState("");
  const [clubType, setClubType] = useState<string | undefined>();

  const handleSearch = (value: string): void => {
    setParameter((prev) => ({
      ...prev,
      name: value,
      club_type: clubType,
      page: 1,
    }));
  };

  return (
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
          <Input.Search
            placeholder="Cari nama klub"
            allowClear
            style={{ width: 280 }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            aria-label="Cari klub berdasarkan nama"
          />
          <Select
            allowClear
            placeholder="Tipe klub"
            options={CLUB_TYPE_OPTIONS}
            style={{ width: 160 }}
            value={clubType}
            onChange={(value) => {
              setClubType(value);
              setParameter((prev) => ({
                ...prev,
                club_type: value,
                page: 1,
              }));
            }}
          />
        </Space>

        {/* Right: Actions */}
        <Space size={8} wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={toggle}>
            Tambah Klub
          </Button>
          <Tooltip placement="left" title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
              aria-label="Muat ulang daftar klub"
            />
          </Tooltip>
        </Space>
      </div>

      <ClubForm open={state} onClose={toggle} />
    </Card>
  );
};

export default ClubFilter;
