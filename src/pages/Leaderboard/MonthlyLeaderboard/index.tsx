import { useRequest } from "ahooks";
import { useState } from "react";
import { getMonthlyLeaderboard } from "../../../api/services/leaderboard";
import MonthlyLeaderboardTable from "./components/MonthlyLeaderboardTable";
import MonthlyLeaderboardFilter from "./components/MonthlyLeaderboardFilter";

export default function MonthlyLeaderboard() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    month: "",
    year: "",
    email: "",
    name: "",
  });

  const { data, loading, refresh } = useRequest(
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
    <div style={{ padding: 12 }}>
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
