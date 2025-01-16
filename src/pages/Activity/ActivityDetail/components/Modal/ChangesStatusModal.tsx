import { useRequest } from "ahooks";
import { Form, Modal, notification, Select } from "antd";
import { useState } from "react";

import { putRegistrant } from "../../../../../api/services/activity";
import { handleError } from "../../../../../api/errorHandling";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../../constants/options";
import { ACTIVITY_REGISTRANT_STATUS_ENUM } from "../../../../../types/constants/activity";

type ChangeStatusModalProps = {
  open: boolean;
  toggle: (val?: boolean) => void;
  selectedRegistrationID: React.Key[];
};

const ChangeStatusModal = ({
  open,
  toggle,
  selectedRegistrationID,
}: ChangeStatusModalProps) => {
  const { loading: addLoading, runAsync } = useRequest(putRegistrant, {
    manual: true,
  });

  const [selectedStatus, setSelectedStatus] =
    useState<ACTIVITY_REGISTRANT_STATUS_ENUM>(
      ACTIVITY_REGISTRANT_STATUS_ENUM.DITERIMA,
    );

  const onOk = async () => {
    try {
      await runAsync({
        registrations_id: selectedRegistrationID.map((val) => val.toString()),
        status: selectedStatus,
      });
      notification.success({
        message: "Berhasil",
        description: "Status Peserta Berhasil Diubah",
      });
      toggle(false);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Modal
      title="Ubah Status"
      open={open}
      onOk={onOk}
      confirmLoading={addLoading}
      onCancel={() => toggle(false)}
    >
      <Form.Item>
        <Select
          options={ACTIVITY_REGISTRANT_STATUS_OPTIONS}
          placeholder="Status Pendaftaran"
          onChange={(val) => setSelectedStatus(val)}
          value={selectedStatus}
          allowClear
        />
      </Form.Item>
    </Modal>
  );
};

export default ChangeStatusModal;
