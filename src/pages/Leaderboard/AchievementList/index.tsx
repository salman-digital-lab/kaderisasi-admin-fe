import { useRequest } from "ahooks";
import { useState } from "react";
import { getAchievements } from "../../../api/services/achievement";
import AchievementTable from "./components/AchievementTable";
import AchievementFilter from "./components/AchievementFilter";
import {
  ACHIEVEMENT_STATUS_ENUM,
  ACHIEVEMENT_TYPE_ENUM,
} from "../../../types/constants/achievement";

export default function AchievementList() {
  const [parameters, setParameters] = useState<{
    page: number;
    per_page: number;
    status?: ACHIEVEMENT_STATUS_ENUM;
    email?: string;
    name?: string;
    type?: ACHIEVEMENT_TYPE_ENUM;
  }>({
    page: 1,
    per_page: 10,
    status: undefined,
    email: undefined,
    name: undefined,
    type: undefined,
  });

  const { data, loading, refresh } = useRequest(
    () =>
      getAchievements({
        page: String(parameters.page),
        per_page: String(parameters.per_page),
        status: parameters.status,
        email: parameters.email,
        name: parameters.name,
        type: parameters.type,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <div style={{ padding: 12 }}>
      <AchievementFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <AchievementTable
          data={data}
          loading={loading}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
