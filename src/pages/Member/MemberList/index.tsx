import { ResponsiveFilters } from "../../../components/common/Responsive/ResponsiveFilters";
import { useState } from "react";
import { Space, Button, Input, Tooltip, Card } from "antd";
import { useRequest } from "ahooks";
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { getProfiles } from "../../../api/services/member";

import MemberTable from "./components/MemberTable";
import CreateMemberModal from "./CreateMemberModal";
import { usePermissions } from "../../../stores/authStore";

const MemberListPage = () => {
  const canManage = usePermissions().includes("members.manage");
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    search: "",
    badge: "",
    member_id: "",
    education_institution: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const [badgeInput, setBadgeInput] = useState("");
  const [memberIdInput, setMemberIdInput] = useState("");
  const [educationInstitutionInput, setEducationInstitutionInput] =
    useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data, loading, error, refresh } = useRequest(
    () =>
      getProfiles({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.search,
        badge: parameters.badge,
        member_id: parameters.member_id,
        education_institution: parameters.education_institution,
      }),
    {
      refreshDeps: [parameters],
      retryCount: 3,
      retryInterval: 1000,
      onError: (err) => {
        console.error("Failed to fetch members:", err);
      },
    },
  );

  const handleSearch = () => {
    setParameters((prev) => ({
      ...prev,
      search: searchInput.trim(),
      badge: badgeInput.trim(),
      member_id: memberIdInput.trim(),
      education_institution: educationInstitutionInput.trim(),
      page: 1,
    }));
  };

  const cardStyle = { borderRadius: 0, boxShadow: "none" };

  return (
    <div style={{ padding: 12 }}>
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
            onApply={handleSearch}
            values={[
              searchInput,
              badgeInput,
              memberIdInput,
              educationInstitutionInput,
            ]}
            onReset={() => {
              setSearchInput("");
              setBadgeInput("");
              setMemberIdInput("");
              setEducationInstitutionInput("");
              setParameters((prev) => ({
                ...prev,
                page: 1,
                search: "",
                badge: "",
                member_id: "",
                education_institution: "",
              }));
            }}
          >
            {({ apply }) => (
              <Space size={12} wrap>
                <Input
                  placeholder="Cari nama atau email"
                  allowClear
                  style={{ width: 240 }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onPressEnter={apply}
                />
                <Input
                  placeholder="ID Anggota"
                  allowClear
                  style={{ width: 160 }}
                  value={memberIdInput}
                  onChange={(e) => setMemberIdInput(e.target.value)}
                  onPressEnter={apply}
                />
                <Input
                  placeholder="Cari lencana"
                  allowClear
                  style={{ width: 160 }}
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  onPressEnter={apply}
                />
                <Input
                  placeholder="Cari institusi pendidikan"
                  allowClear
                  style={{ width: 200 }}
                  value={educationInstitutionInput}
                  onChange={(e) => setEducationInstitutionInput(e.target.value)}
                  onPressEnter={apply}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={apply}
                  aria-label="Terapkan pencarian anggota"
                />
              </Space>
            )}
          </ResponsiveFilters>

          <Space size={8} wrap>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateOpen(true)}
              >
                Tambah Anggota
              </Button>
            )}
            <Tooltip placement="left" title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
                aria-label="Muat ulang anggota"
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      <div style={{ ...cardStyle, marginTop: 12 }}>
        <MemberTable
          data={data}
          loading={loading}
          error={error}
          onRetry={refresh}
          setParameter={setParameters}
        />
      </div>

      {canManage && (
        <CreateMemberModal
          isOpen={isCreateOpen}
          setIsOpen={setIsCreateOpen}
          refresh={refresh}
        />
      )}
    </div>
  );
};

export default MemberListPage;
