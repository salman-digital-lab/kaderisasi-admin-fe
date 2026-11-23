import { ResponsiveDialog as Modal } from "../../../../../components/common/Responsive/ResponsiveDialog";
import { Input } from "antd";
import { putAdminUserPassword } from "../../../../../api/services/adminuser";
import { useRequest } from "ahooks";
import { useState } from "react";
import { type AdminUser } from "../../../../../types/model/adminuser";

type EditPasswordAdminUserProps = {
  data: AdminUser | undefined;
  setData: (state: AdminUser | undefined) => void;
};

export default function EditPasswordAdminUser({
  data,
  setData,
}: EditPasswordAdminUserProps) {
  const { run, loading } = useRequest(putAdminUserPassword, {
    manual: true,
  });

  const [newData, setNewData] = useState("");

  const handleChange = (val: string) => {
    setNewData(val);
  };

  return (
    <Modal
      title="Ubah kata sandi akun admin"
      open={!!data}
      confirmLoading={loading}
      onOk={() => {
        if (newData !== undefined && data) {
          run({ id: String(data.id), data: { password: newData } });
          setNewData("");
          setData(undefined);
        }
      }}
      onCancel={() => {
        setNewData("");
        setData(undefined);
      }}
    >
      <Input.Password
        placeholder="Kata sandi"
        onChange={(e) => handleChange(e.target.value)}
      />
    </Modal>
  );
}
