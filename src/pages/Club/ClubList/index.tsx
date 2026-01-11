import { useState } from "react";
import { useRequest } from "ahooks";

import { getClubs } from "../../../api/services/club";

import ClubTable from "./components/ClubTable";
import ClubFilter from "./components/ClubFilter";
import { FilterType } from "./constants/type";

const ClubList = () => {
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    name: "",
  });

  const { data, loading, refresh } = useRequest(
    () =>
      getClubs({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <div style={{ padding: 12 }}>
      <ClubFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <ClubTable data={data} loading={loading} setParameter={setParameters} />
      </div>
    </div>
  );
};

export default ClubList;
