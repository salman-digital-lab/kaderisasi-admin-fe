import { Flex } from "antd";
import { useRequest } from "ahooks";
import { useState } from "react";
import { getRuangCurhats } from "../../../api/services/ruangcurhat";
import RuangCurhatTable from "./components/RuangCurhatTable";
import RuangCurhatFilter from "./components/RuangCurhatFilter";
import { PROBLEM_STATUS_ENUM } from "../../../types/constants/ruangcurhat";

export default function RuangCurhatList() {
  const [parameters, setParameters] = useState<{
    page: number;
    per_page: number;
    status?: PROBLEM_STATUS_ENUM;
  }>({
    page: 1,
    per_page: 10,
    status: undefined,
  });

  const { data, loading } = useRequest(
    () =>
      getRuangCurhats({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        status: parameters.status,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <Flex vertical gap="middle">
      <RuangCurhatFilter setParameter={setParameters} />
      <RuangCurhatTable
        data={data}
        loading={loading}
        setParameter={setParameters}
      />
    </Flex>
  );
}
