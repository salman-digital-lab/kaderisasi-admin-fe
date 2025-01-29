import { useRequest } from "ahooks";
import {
  Button,
  Flex,
  Form,
  Modal,
  notification,
  Popconfirm,
  Select,
  Typography,
} from "antd";
import { useState } from "react";

import { WarningOutlined } from "@ant-design/icons";

import { putRegistrant } from "../../../../../api/services/activity";
import { handleError } from "../../../../../api/errorHandling";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../../constants/options";
import { ACTIVITY_REGISTRANT_STATUS_ENUM } from "../../../../../types/constants/activity";

type ChangeStatusModalProps = {
  open: boolean;
  toggle: (val?: boolean) => void;
  selectedRegistrationID: React.Key[];
};

const { Text } = Typography;

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
      confirmLoading={addLoading}
      onCancel={() => toggle(false)}
      footer={[
        <Button key="back" onClick={() => toggle(false)}>
          Batal
        </Button>,
        <Popconfirm
          title="Ubah status peserta?"
          description="Apakah anda yakin ingin mengubah status peserta?"
          onConfirm={onOk}
          okText="Ya"
          cancelText="Tidak"
        >
          <Button key="submit" type="primary">
            Ubah
          </Button>
        </Popconfirm>,
      ]}
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
      {selectedStatus === ACTIVITY_REGISTRANT_STATUS_ENUM.LULUS_KEGIATAN && (
        <Flex gap={8} align="baseline">
          <WarningOutlined style={{ color: "#faad14" }} />
          <Text type="warning">
            Aksi ini akan mengubah level dan lencana dari peserta. Efek aksi ini
            tidak dapat dikembalikan.
          </Text>
        </Flex>
      )}
    </Modal>
  );
};

export default ChangeStatusModal;
