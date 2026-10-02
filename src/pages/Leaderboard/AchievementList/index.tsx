import { useRequest } from "ahooks";
import { useState } from "react";
import {
  exportAchievements,
  getAchievements,
} from "../../../api/services/achievement";
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
import PageHeader from "../../../components/common/PageHeader";
import { NAV_LABELS } from "../../../constants/navigation";
import LoadErrorAlert from "../../../components/common/LoadErrorAlert";

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

  const { data, loading, error, refresh } = useRequest(
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
    <div className="page-container">
      <PageHeader
        title={NAV_LABELS.achievements}
        description="Tinjau dan setujui prestasi yang diajukan anggota."
      />
      {(error || (!loading && !data)) && (
        <LoadErrorAlert
          title="Daftar prestasi gagal dimuat"
          onRetry={refresh}
        />
      )}
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
