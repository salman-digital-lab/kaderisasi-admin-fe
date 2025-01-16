import { useState } from "react";
import { useRequest, useToggle } from "ahooks";
import { Space } from "antd";

import { getProvinces } from "../../api/services/province";
import { Province } from "../../types/model/province";
import ProvinceTable from "./components/ProvinceTable";
import ProvinceFilter from "./components/ProvinceFilter";
import ProvinceForm from "./components/ProvinceForm";

const MainProvince = () => {
  const [parameters, setParameters] = useState({
    name: "",
  });
  const [editItem, setEditItem] = useState<Omit<Province, "is_active">>();
  const [state, { toggle }] = useToggle(false);

  const { data, loading } = useRequest(() => getProvinces({}), {
    refreshDeps: [parameters],
  });

  const openModal = (id?: number, name?: string) => {
    id && name ? setEditItem({ id, name }) : setEditItem(undefined);
    toggle();
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <ProvinceFilter setParameter={setParameters} />
      <ProvinceTable
        data={data}
        loading={loading}
        setParameter={setParameters}
        openModal={openModal}
      />
      <ProvinceForm
        open={state}
        onClose={() => toggle()}
        initialValues={editItem}
      />
    </Space>
  );
};

export default MainProvince;
