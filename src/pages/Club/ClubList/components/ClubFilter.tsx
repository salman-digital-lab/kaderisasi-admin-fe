import { Input, Card, Button, Space, Tooltip, Select } from "antd";
import { useState } from "react";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import { FilterType } from "../constants/type";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import type { ClubType } from "../../../../types/model/club";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
  loading?: boolean;
  onCreate: () => void;
};

const ClubFilter = ({
  setParameter,
  refresh,
  loading,
  onCreate,
}: FilterProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [clubType, setClubType] = useState<ClubType | undefined>();

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
        <Space size={12} wrap role="group" aria-label="Filter daftar klub">
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
          <Select
            allowClear
            placeholder="Status publik"
            style={{ width: 150 }}
            aria-label="Filter berdasarkan status publik"
            options={[
              { value: "published", label: "Tayang" },
              { value: "draft", label: "Draf" },
            ]}
            onChange={(value) =>
              setParameter((prev) => ({
                ...prev,
                visibility: value,
                page: 1,
              }))
            }
          />
          <Select
            allowClear
            placeholder="Status pendaftaran"
            style={{ width: 190 }}
            aria-label="Filter berdasarkan status pendaftaran"
            options={[
              { value: "open", label: "Pendaftaran dibuka" },
              { value: "closed", label: "Pendaftaran ditutup" },
            ]}
            onChange={(value) =>
              setParameter((prev) => ({
                ...prev,
                registration: value,
                page: 1,
              }))
            }
          />
        </Space>

        <Space size={8} wrap>
          <Button
            id="club-create-action"
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            Buat Klub
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
    </Card>
  );
};

export default ClubFilter;
