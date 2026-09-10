import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Select } from "antd";
import { useRequest } from "ahooks";

import { getCounselorOptions } from "../../../../api/services/ruangcurhat";
import type { PutRuangCurhatReq } from "../../../../types/services/ruangcurhat";
import type { RuangCurhatData } from "../../../../types/model/ruangcurhat";

type EditCounselorProps = {
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
}: EditCounselorProps) {
  const { id } = useParams<{ id: string }>();

  const { data: counselors, loading } = useRequest(getCounselorOptions, {
    ready: isOpen,
  });

  const [newData, setNewData] = useState(counselorId);

  useEffect(() => {
    if (isOpen) setNewData(counselorId);
  }, [counselorId, isOpen]);

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
        options={counselors?.map((item) => ({
          label: item.display_name || item.email,
          value: item.id,
        }))}
      />
    </Modal>
  );
}
