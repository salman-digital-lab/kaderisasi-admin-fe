import { useRequest } from "ahooks";
import { useState } from "react";
import { getLifetimeLeaderboard } from "../../../api/services/leaderboard";
import LifetimeLeaderboardTable from "./components/LifetimeLeaderboardTable";
import LifetimeLeaderboardFilter from "./components/LifetimeLeaderboardFilter";
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";

export default function LifetimeLeaderboard() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    email: "",
    name: "",
  });

  const { data, loading, error, refresh } = useRequest(
    () =>
      getLifetimeLeaderboard({
        page: String(parameters.page),
        per_page: String(parameters.per_page),
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
        title={NAV_LABELS.lifetimeLeaderboard}
        description="Peringkat anggota berdasarkan total poin prestasi."
      />
      {(error || (!loading && !data)) && (
        <LoadErrorAlert title="Peringkat gagal dimuat" onRetry={refresh} />
      )}
      <LifetimeLeaderboardFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <LifetimeLeaderboardTable
          data={data}
          loading={loading}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
