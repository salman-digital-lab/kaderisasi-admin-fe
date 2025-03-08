import { useRequest } from "ahooks";
import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Select,
  Typography,
} from "antd";
import { useState } from "react";
import { WarningOutlined } from "@ant-design/icons";

import { updateRegistrantsByEmail } from "../../../../../api/services/activity";
import { handleError } from "../../../../../api/errorHandling";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../../constants/options";
import { ACTIVITY_REGISTRANT_STATUS_ENUM } from "../../../../../types/constants/activity";

type ChangeStatusByEmailModalProps = {
  open: boolean;
  toggle: (val?: boolean) => void;
  activityId: string;
  customSelectionStatus?: string[];
};

const { Text } = Typography;
const { TextArea } = Input;

const ChangeStatusByEmailModal = ({
  open,
  toggle,
  activityId,
  customSelectionStatus,
}: ChangeStatusByEmailModalProps) => {
  const { loading, runAsync } = useRequest(updateRegistrantsByEmail, {
    manual: true,
  });

  const [emailText, setEmailText] = useState<string>("");
  const [selectedStatus, setSelectedStatus] =
    useState<ACTIVITY_REGISTRANT_STATUS_ENUM>(
      ACTIVITY_REGISTRANT_STATUS_ENUM.DITERIMA,
    );

  const onOk = async () => {
    // Split the email text by newline and remove any empty lines
    const emails = emailText
      .split("\n")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      notification.error({
        message: "Error",
        description: "Please enter at least one email",
      });
      return;
    }

    try {
      await runAsync(activityId, {
        emails: emails,
        status: selectedStatus,
      });
      notification.success({
        message: "Berhasil",
        description: "Status Peserta Berhasil Diubah",
      });
      setEmailText(""); // Clear the email input
      toggle(false);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Modal
      title="Ubah Status Berdasarkan Email"
      open={open}
      confirmLoading={loading}
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
      <Flex gap={8} align="baseline">
        <WarningOutlined style={{ color: "#faad14" }} />
        <Text type="warning">
          Fitur ini masih memiliki kemungkinan kendala, jika ada kendala muncul
          silahkan konsultasi melalui grup WA.
        </Text>
      </Flex>
      <Form layout="vertical">
        <Form.Item
          label="Daftar Email"
          tooltip="Masukkan email yang ingin diubah statusnya, satu email per baris"
        >
          <TextArea
            rows={6}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="contoh@email.com
email2@example.com
email3@example.com"
          />
        </Form.Item>
        <Form.Item label="Status Baru">
          <Select
            options={[
              ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
              ...(customSelectionStatus?.map((val) => ({
                label: val,
                value: val,
              })) || []),
            ]}
            placeholder="Status Pendaftaran"
            onChange={(val) => setSelectedStatus(val)}
            value={selectedStatus}
            allowClear
          />
        </Form.Item>
      </Form>
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

export default ChangeStatusByEmailModal;
