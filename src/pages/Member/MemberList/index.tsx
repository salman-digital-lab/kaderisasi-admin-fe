import { useState } from "react";
import { Space, Button, Input, Tooltip, Card } from "antd";
import { useRequest } from "ahooks";
import { SearchOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";

import { getProfiles } from "../../../api/services/member";

import MemberTable from "./components/MemberTable";
import CreateMemberModal from "./CreateMemberModal";

const MemberListPage = () => {
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
  const [educationInstitutionInput, setEducationInstitutionInput] = useState("");
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
          <Space size={12} wrap>
            <Input
              placeholder="Cari nama atau email"
              allowClear
              style={{ width: 240 }}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              placeholder="ID Anggota"
              allowClear
              style={{ width: 160 }}
              value={memberIdInput}
              onChange={(e) => setMemberIdInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              placeholder="Cari lencana"
              allowClear
              style={{ width: 160 }}
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Input
              placeholder="Cari institusi pendidikan"
              allowClear
              style={{ width: 200 }}
              value={educationInstitutionInput}
              onChange={(e) => setEducationInstitutionInput(e.target.value)}
              onPressEnter={handleSearch}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} />
          </Space>

          <Space size={8} wrap>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
            >
              Tambah Anggota
            </Button>
            <Tooltip placement="left" title="Refresh Data">
              <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading} />
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

      <CreateMemberModal
        isOpen={isCreateOpen}
        setIsOpen={setIsCreateOpen}
        refresh={refresh}
      />
    </div>
  );
};

export default MemberListPage;
