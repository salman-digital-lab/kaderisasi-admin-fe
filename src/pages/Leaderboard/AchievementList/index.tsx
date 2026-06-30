import { useRequest } from "ahooks";
import { useState } from "react";
import { exportAchievements, getAchievements } from "../../../api/services/achievement";
import AchievementTable from "./components/AchievementTable";
import AchievementFilter from "./components/AchievementFilter";
import {
  ACHIEVEMENT_STATUS_ENUM,
  ACHIEVEMENT_TYPE_ENUM,
} from "../../../types/constants/achievement";
import type {
  AchievementSortBy,
  SortOrder,
} from "../../../types/services/achievement";

export type AchievementListParameters = {
  page: number;
  per_page: number;
  status?: ACHIEVEMENT_STATUS_ENUM;
  email?: string;
  name?: string;
  type?: ACHIEVEMENT_TYPE_ENUM;
  sort_by?: AchievementSortBy;
  sort_order?: SortOrder;
};

export default function AchievementList() {
  const [parameters, setParameters] = useState<AchievementListParameters>({
    page: 1,
    per_page: 10,
    status: undefined,
    email: undefined,
    name: undefined,
    type: undefined,
    sort_by: "created_at",
    sort_order: "desc",
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
        sort_by: parameters.sort_by,
        sort_order: parameters.sort_order,
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
        exportAchievements={exportAchievements}
      />
      <div style={{ marginTop: 12 }}>
        <AchievementTable
          data={data}
          loading={loading}
          parameters={parameters}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
