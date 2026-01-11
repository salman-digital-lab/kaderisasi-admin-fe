import { useRequest } from "ahooks";
import { useState } from "react";
import { getRuangCurhats } from "../../../api/services/ruangcurhat";
import RuangCurhatTable from "./components/RuangCurhatTable";
import RuangCurhatFilter from "./components/RuangCurhatFilter";
import { PROBLEM_STATUS_ENUM } from "../../../types/constants/ruangcurhat";
import { GENDER } from "../../../types/constants/profile";

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

  const { data, loading, refresh } = useRequest(
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
    <div style={{ padding: 12 }}>
      <RuangCurhatFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <RuangCurhatTable
          data={data}
          loading={loading}
          setParameter={setParameters}
        />
      </div>
    </div>
  );
}
