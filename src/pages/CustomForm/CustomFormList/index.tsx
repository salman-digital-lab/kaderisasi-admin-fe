import { useState, useEffect } from "react";
import { useRequest } from "ahooks";
import { useSearchParams } from "react-router-dom";

import { getCustomForms } from "../../../api/services/customForm";

import CustomFormTable from "./components/CustomFormTable";
import CustomFormFilter from "./components/CustomFormFilter";
import { FilterType } from "./constants/type";

const CustomFormList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    search: "",
    feature_type: undefined,
    feature_id: "",
    is_active: undefined,
  });

  // Check if modal should auto-open
  const shouldAutoOpenModal = searchParams.get("create") === "true";

  // Clear the query param after reading it
  useEffect(() => {
    if (shouldAutoOpenModal) {
      setSearchParams({});
    }
  }, [shouldAutoOpenModal, setSearchParams]);

  const { data, loading, refresh } = useRequest(
    () =>
      getCustomForms({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.search,
        feature_type: parameters.feature_type,
        feature_id: parameters.feature_id,
        is_active:
          parameters.is_active !== undefined
            ? String(parameters.is_active)
            : undefined,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <div style={{ padding: 12 }}>
      <CustomFormFilter
        setParameter={setParameters}
        autoOpenModal={shouldAutoOpenModal}
        refresh={refresh}
        loading={loading}
      />
      <div style={{ marginTop: 12 }}>
        <CustomFormTable
          data={data}
          loading={loading}
          setParameter={setParameters}
          refresh={refresh}
        />
      </div>
    </div>
  );
};

export default CustomFormList;
