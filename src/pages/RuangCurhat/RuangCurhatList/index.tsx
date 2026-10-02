import { useRequest } from "ahooks";
import { useState } from "react";
import { getRuangCurhats } from "../../../api/services/ruangcurhat";
import RuangCurhatTable from "./components/RuangCurhatTable";
import RuangCurhatFilter from "./components/RuangCurhatFilter";
import { PROBLEM_STATUS_ENUM } from "../../../types/constants/ruangcurhat";
import { GENDER } from "../../../types/constants/profile";
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";

export default function RuangCurhatList() {
  const [parameters, setParameters] = useState<{
    page: number;
    per_page: number;
    status?: PROBLEM_STATUS_ENUM;
    name?: string;
    gender?: GENDER;
    admin_display_name?: string;
  }>({
    page: 1,
    per_page: 10,
    status: undefined,
    name: undefined,
    gender: undefined,
    admin_display_name: undefined,
  });

  const { data, loading, error, refresh } = useRequest(
    () =>
      getRuangCurhats({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        status: parameters.status,
        name: parameters.name,
        gender: parameters.gender,
        admin_display_name: parameters.admin_display_name,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.counseling}
        description="Kelola permintaan curhat dari anggota dan tetapkan konselor."
      />
      {(error || (!loading && !data)) && (
        <LoadErrorAlert title="Daftar curhat gagal dimuat" onRetry={refresh} />
      )}
      <RuangCurhatFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div
        style={{
          marginTop: 12,
          boxShadow: "none",
        }}
      >
        <RuangCurhatTable
          data={data}
          loading={loading}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
