import { useState } from "react";
import { useRequest } from "ahooks";
import { Alert, Button } from "antd";

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

  const { data, loading, refresh, error } = useRequest(
    () =>
      getClubs({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        club_type: parameters.club_type,
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
        {error ? (
          <Alert
            type="error"
            showIcon
            title="Daftar unit kegiatan gagal dimuat"
            description="Periksa koneksi atau layanan API, lalu coba kembali."
            action={<Button onClick={refresh}>Coba Lagi</Button>}
          />
        ) : (
          <ClubTable
            data={data}
            loading={loading}
            setParameter={setParameters}
          />
        )}
      </div>
    </div>
  );
};

export default ClubList;
