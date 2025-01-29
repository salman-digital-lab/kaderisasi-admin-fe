import { useState } from "react";
import { Space } from "antd";
import { useRequest, useToggle } from "ahooks";

import { University } from "../../types/model/university";
import { getUniversities } from "../../api/services/university";

import UniversityForm from "./components/UniversityForm";
import UniversitiesTable from "./components/UniversityTable";
import UniversitiesFilter from "./components/UniversityFilter";

const MainUniversity = () => {
  const [parameters, setParameters] = useState({
    page: 1,
    per_page: 10,
    name: "",
  });
  const [editItem, setEditItem] = useState<University>({ id: 0, name: "" });
  const [state, { toggle }] = useToggle(false);

  const { data, loading } = useRequest(
    () =>
      getUniversities({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  const openModal = (id?: number, name?: string) => {
    id && name ? setEditItem({ id, name }) : setEditItem({ id: 0, name: "" });
    toggle();
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <UniversitiesFilter
        setParameter={setParameters}
        openModal={() => openModal()}
      />
      <UniversitiesTable
        data={data}
        loading={loading}
        setParameter={setParameters}
        openModal={openModal}
      />
      <UniversityForm
        open={state}
        onClose={() => toggle()}
        initialValues={editItem}
      />
    </Space>
  );
};

export default MainUniversity;
