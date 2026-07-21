import { useState } from "react";
import { useRequest } from "ahooks";
import { Alert, Button, Typography } from "antd";

import { getClubs } from "../../../api/services/club";

import ClubTable from "./components/ClubTable";
import ClubFilter from "./components/ClubFilter";
import ClubForm from "./components/ClubForm";
import { FilterType } from "./constants/type";

const ClubList = () => {
  const [parameters, setParameters] = useState<FilterType>({
    page: 1,
    per_page: 10,
    name: "",
  });
  const [createOpen, setCreateOpen] = useState(false);

  const { data, loading, refresh, error } = useRequest(
    () =>
      getClubs({
        per_page: String(parameters.per_page),
        page: String(parameters.page),
        search: parameters.name,
        club_type: parameters.club_type,
        visibility: parameters.visibility,
        registration: parameters.registration,
      }),
    {
      refreshDeps: [parameters],
    },
  );

  return (
    <main style={{ padding: 12 }}>
      <Typography.Title level={2} style={{ marginBottom: 4 }}>
        Klub
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Klub adalah wadah komunitas yang memiliki profil publik, anggota,
        kegiatan, dan pendaftaran opsional.
      </Typography.Paragraph>
      <ClubFilter
        setParameter={setParameters}
        refresh={refresh}
        loading={loading}
        onCreate={() => setCreateOpen(true)}
      />
      <div style={{ marginTop: 12 }}>
        {error ? (
          <Alert
            type="error"
            showIcon
            title="Daftar klub gagal dimuat"
            description="Periksa koneksi atau layanan API, lalu coba kembali."
            action={<Button onClick={refresh}>Coba Lagi</Button>}
          />
        ) : (
          <ClubTable
            data={data}
            loading={loading}
            setParameter={setParameters}
            onCreate={() => setCreateOpen(true)}
          />
        )}
      </div>
      <ClubForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
};

export default ClubList;
