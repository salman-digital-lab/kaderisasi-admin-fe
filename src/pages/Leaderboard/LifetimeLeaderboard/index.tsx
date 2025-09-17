import { useRequest } from "ahooks";
import { useState } from "react";
import { getLifetimeLeaderboard } from "../../../api/services/leaderboard";
import LifetimeLeaderboardTable from "./components/LifetimeLeaderboardTable";
import LifetimeLeaderboardFilter from "./components/LifetimeLeaderboardFilter";
import { Flex } from "antd";

export default function LifetimeLeaderboard() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    email: "",
    name: "",
  });

  const { data, loading } = useRequest(() =>
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
    <Flex vertical gap="middle">
      <LifetimeLeaderboardFilter setParameter={setParameters} />
      <LifetimeLeaderboardTable
        data={data}
        loading={loading}
        setParameter={setParameters}
      />
    </Flex>
  );
}
