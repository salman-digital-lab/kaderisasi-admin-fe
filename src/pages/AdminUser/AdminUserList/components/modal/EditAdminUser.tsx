import { Modal, Select } from "antd";
import { putAdminUser } from "../../../../../api/services/adminuser";
import { useRequest } from "ahooks";
import { useState } from "react";
import { AdminUser } from "../../../../../types/model/adminuser";
import { ADMIN_ROLE_OPTIONS } from "../../../../../constants/options";

type EditAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
};

export default function EditAdminUser({ data, setData }: EditAdminUserProps) {

  const { runAsync, loading } = useRequest(putAdminUser, { manual: true });

  const [newData, setNewData] = useState(data?.role);

  const handleChange = (val: number) => {
    setNewData(val);
  };

  return (
    <Modal
      title="Ubah Role Akun Admin"
      open={!!data}
      confirmLoading={loading}
      onOk={() => {
        if (newData !== undefined && data) {
          runAsync({ id: String(data.id), data: { role: newData } });
          setNewData(undefined);
          setData(undefined);
        }
      }}
      onCancel={() => {
        setNewData(undefined);
        setData(undefined);
      }}
    >
      <Select
        style={{ width: "100%" }}
        onChange={handleChange}
        value={newData || data?.role}
        options={ADMIN_ROLE_OPTIONS}
      />
    </Modal>
  );
}
