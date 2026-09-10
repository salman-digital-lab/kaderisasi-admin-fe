import { Input, Card, Button, Space, Tooltip, Select } from "antd";
import { useState } from "react";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";

import { FilterType } from "../constants/type";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import type { ClubType } from "../../../../types/model/club";
import { ResponsiveFilters } from "../../../../components/common/Responsive/ResponsiveFilters";
import { useAdminViewport } from "../../../../hooks/useAdminViewport";

const cardStyle = {
  borderRadius: 0,
  boxShadow: "none",
};

type FilterProps = {
  parameters: FilterType;
  setParameter: React.Dispatch<React.SetStateAction<FilterType>>;
  refresh: () => void;
  loading?: boolean;
  onCreate: () => void;
};

const ClubFilter = ({
  parameters,
  setParameter,
  refresh,
  loading,
  onCreate,
}: FilterProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [clubType, setClubType] = useState<ClubType | undefined>();
  const [visibility, setVisibility] = useState<FilterType["visibility"]>();
  const [registration, setRegistration] =
    useState<FilterType["registration"]>();
  const { compact } = useAdminViewport();

  const handleSearch = (value: string): void => {
    setParameter((prev) => ({
      ...prev,
      name: value,
      club_type: clubType,
      visibility,
      registration,
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
        <ResponsiveFilters
          onApply={() => handleSearch(searchInput)}
          values={[searchInput, clubType, visibility, registration]}
          activeCount={
            [
              parameters.name,
              parameters.club_type,
              parameters.visibility,
              parameters.registration,
            ].filter(Boolean).length
          }
          onReset={() => {
            setSearchInput("");
            setClubType(undefined);
            setVisibility(undefined);
            setRegistration(undefined);
            setParameter((prev) => ({
              ...prev,
              page: 1,
              name: "",
              club_type: undefined,
              visibility: undefined,
              registration: undefined,
            }));
          }}
        >
          {({ apply }) => (
            <Space size={12} wrap role="group" aria-label="Filter daftar klub">
              <Input.Search
                placeholder="Cari nama klub"
                allowClear
                style={{ width: 280 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onSearch={apply}
                aria-label="Cari klub berdasarkan nama"
              />
              <Select
                allowClear
                placeholder="Tipe klub"
                options={CLUB_TYPE_OPTIONS}
                style={{ width: 160 }}
                value={clubType}
                aria-label="Tipe klub"
                onChange={(value) => {
                  setClubType(value);
                  if (!compact)
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
                value={visibility}
                options={[
                  { value: "published", label: "Tayang" },
                  { value: "draft", label: "Draf" },
                ]}
                onChange={(value) => {
                  setVisibility(value);
                  if (!compact)
                    setParameter((prev) => ({
                      ...prev,
                      visibility: value,
                      page: 1,
                    }));
                }}
              />
              <Select
                allowClear
                placeholder="Status pendaftaran"
                style={{ width: 190 }}
                aria-label="Filter berdasarkan status pendaftaran"
                value={registration}
                options={[
                  { value: "open", label: "Pendaftaran dibuka" },
                  { value: "closed", label: "Pendaftaran ditutup" },
                ]}
                onChange={(value) => {
                  setRegistration(value);
                  if (!compact)
                    setParameter((prev) => ({
                      ...prev,
                      registration: value,
                      page: 1,
                    }));
                }}
              />
            </Space>
          )}
        </ResponsiveFilters>

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
