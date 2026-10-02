import { useRequest } from "ahooks";
import { useState } from "react";
import { getMonthlyLeaderboard } from "../../../api/services/leaderboard";
import MonthlyLeaderboardTable from "./components/MonthlyLeaderboardTable";
import MonthlyLeaderboardFilter from "./components/MonthlyLeaderboardFilter";
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";

export default function MonthlyLeaderboard() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    month: "",
    year: "",
    email: "",
    name: "",
  });

  const { data, loading, error, refresh } = useRequest(
    () =>
      getMonthlyLeaderboard({
        page: String(parameters.page),
        per_page: String(parameters.per_page),
        month: parameters.month || undefined,
        year: parameters.year || undefined,
        email: parameters.email || undefined,
        name: parameters.name || undefined,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.monthlyLeaderboard}
        description="Peringkat anggota berdasarkan poin prestasi setiap bulan."
      />
      {(error || (!loading && !data)) && (
        <LoadErrorAlert
          title="Peringkat bulanan gagal dimuat"
          onRetry={refresh}
        />
      )}
      <MonthlyLeaderboardFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <MonthlyLeaderboardTable
          data={data}
          loading={loading}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
