import { useState } from "react";
import { Space } from "antd";
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
    }
  );

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <ClubFilter setParameter={setParameters} refresh={refresh} />
      <ClubTable
        data={data}
        loading={loading}
        setParameter={setParameters}
      />
    </Space>
  );
};

export default ClubList;
