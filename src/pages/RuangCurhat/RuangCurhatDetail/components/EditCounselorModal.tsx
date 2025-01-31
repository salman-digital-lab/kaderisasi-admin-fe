import { useState } from "react";
import { useParams } from "react-router-dom";
import { Modal, Select } from "antd";
import { useRequest } from "ahooks";

import { getAdminUsers } from "../../../../api/services/adminuser";
import { PutRuangCurhatReq } from "../../../../types/services/ruangcurhat";
import { RuangCurhatData } from "../../../../types/model/ruangcurhat";

type EditAdminUserProps = {
  counselorId?: number;
  isOpen: boolean;
  run: (props: PutRuangCurhatReq) => Promise<RuangCurhatData | undefined>;
  toggle: () => void;
  dataRefresh: () => void;
};

export default function EditCounselorModal({
  run,
  toggle,
  dataRefresh,
  counselorId,
  isOpen,
}: EditAdminUserProps) {
  const { id } = useParams<{ id: string }>();

  const { data: rolesData, loading } = useRequest(
    () =>
      getAdminUsers({
        per_page: "1000",
        page: "1",
        search: "",
      }),
    {},
  );

  const [newData, setNewData] = useState(counselorId);

  const handleChange = (val: number) => {
    setNewData(val);
  };

  return (
    <Modal
      title="Ubah Konselor"
      open={isOpen}
      onOk={() => {
        if (newData)
          run({ id: id || "", data: { counselor_id: newData } }).then(() => {
            dataRefresh();
            toggle();
          });
      }}
      onCancel={() => {
        toggle();
        setNewData(undefined);
      }}
    >
      <Select
        showSearch
        style={{ width: "100%" }}
        onChange={handleChange}
        optionFilterProp="label"
        loading={loading}
        value={newData || counselorId}
        options={rolesData?.data.map((item) => ({
          label: item.email,
          value: item.id,
        }))}
      />
    </Modal>
  );
}
