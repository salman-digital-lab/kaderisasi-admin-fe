import { useState } from "react";
import { Flex } from "antd";
import { useRequest } from "ahooks";

import { getProfiles } from "../../../api/services/member";

import MemberTable from "./components/MemberTable";
import MemberFilter from "./components/MemberFilter";

const MemberListPage = () => {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    name: "",
    badge: "",
    email: "",
  });

  const { data, loading } = useRequest(
    () =>
      getProfiles({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        badge: parameters.badge,
        email: parameters.email,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <Flex vertical gap="middle">
      <MemberFilter setParameter={setParameters} />
      <MemberTable data={data} loading={loading} setParameter={setParameters} />
    </Flex>
  );
};

export default MemberListPage;
