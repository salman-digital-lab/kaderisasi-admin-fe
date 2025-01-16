import { Modal, Select } from "antd";
import { getRoles, putAdminUser } from "../../../../../api/services/adminuser";
import { useRequest } from "ahooks";
import { useState } from "react";
import { AdminUser } from "../../../../../types/model/adminuser";

type EditAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
};

export default function EditAdminUser({ data, setData }: EditAdminUserProps) {
  const { data: rolesData, loading } = useRequest(
    () =>
      getRoles({
        per_page: "1000",
        page: "1",
      }),
    {},
  );

  const { runAsync } = useRequest(putAdminUser, { manual: true });

  const [newData, setNewData] = useState(data?.role_id);

  const handleChange = (val: number) => {
    setNewData(val);
  };

  return (
    <Modal
      title="Ubah Role Akun Admin"
      open={!!data}
      onOk={() => {
        if (newData && data)
          runAsync({ id: String(data.id), data: { role_id: newData } });
      }}
      onCancel={() => {
        setNewData(undefined);
        setData(undefined);
      }}
    >
      <Select
        style={{ width: "100%" }}
        onChange={handleChange}
        loading={loading}
        value={newData || data?.role_id}
        options={rolesData?.data.map((item) => ({
          label: item.role_name,
          value: item.id,
        }))}
      />
    </Modal>
  );
}
