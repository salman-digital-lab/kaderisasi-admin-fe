import { useRequest } from "ahooks";
import { useState } from "react";
import { getLifetimeLeaderboard } from "../../../api/services/leaderboard";
import LifetimeLeaderboardTable from "./components/LifetimeLeaderboardTable";
import LifetimeLeaderboardFilter from "./components/LifetimeLeaderboardFilter";

export default function LifetimeLeaderboard() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    email: "",
    name: "",
  });

  const { data, loading, refresh } = useRequest(
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
    <div style={{ padding: 12 }}>
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
