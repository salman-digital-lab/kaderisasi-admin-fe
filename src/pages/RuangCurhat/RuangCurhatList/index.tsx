import { Flex } from "antd";
import { useRequest } from "ahooks";
import { useState } from "react";
import { getRuangCurhats } from "../../../api/services/ruangcurhat";
import RuangCurhatTable from "./components/RuangCurhatTable";

export default function RuangCurhatList() {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
  });

  const { data, loading } = useRequest(
    () =>
      getRuangCurhats({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <Flex vertical gap="middle">
      <RuangCurhatTable
        data={data}
        loading={loading}
        setParameter={setParameters}
      />
    </Flex>
  );
}
