import { useState } from "react";
import { Space } from "antd";
import { useRequest } from "ahooks";

import { getActivities } from "../../../api/services/activity";

import ActivityTable from "./components/ActivityTable";
import ActivityFilter from "./components/ActivityFilter";
import { FilterType } from "./constants/type";

const MainActivity = () => {
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    name: "",
    activity_type: undefined,
    activity_category: undefined,
  });

  const { data, loading, refresh } = useRequest(
    () =>
      getActivities({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        activity_type: parameters.activity_type,
        category: parameters.activity_category,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <ActivityFilter setParameter={setParameters} refresh={refresh} />
      <ActivityTable
        data={data}
        loading={loading}
        setParameter={setParameters}
      />
    </Space>
  );
};

export default MainActivity;
