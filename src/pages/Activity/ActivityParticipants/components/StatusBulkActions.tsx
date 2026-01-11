import { useState } from "react";
import {
  Button,
  Dropdown,
  Modal,
  Select,
  Input,
  Alert,
  Typography,
  message,
  Divider,
} from "antd";
import type { MenuProps } from "antd";
import {
  EditOutlined,
  MailOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRequest } from "ahooks";
import {
  putRegistrant,
  updateRegistrantsByEmail,
} from "../../../../api/services/activity";
import { ACTIVITY_REGISTRANT_STATUS_OPTIONS } from "../../../../constants/options";

const { TextArea } = Input;
const { Text } = Typography;

interface StatusBulkActionsProps {
  selectedRowKeys: React.Key[];
  activityId: string;
  customSelectionStatus?: string[];
  onSuccess: () => void;
}

const StatusBulkActions = ({
  selectedRowKeys,
  activityId,
  customSelectionStatus = [],
  onSuccess,
}: StatusBulkActionsProps) => {
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [emailStatusModalOpen, setEmailStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [emailList, setEmailList] = useState<string>("");

  // Status options
  const statusOptions = [
    ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
    ...(customSelectionStatus?.map((val) => ({
      label: val,
      value: val,
    })) || []),
  ];

  // Bulk update by selection
  const { loading: bulkLoading, run: runBulkUpdate } = useRequest(
    async () => {
      await putRegistrant({
        registrations_id: selectedRowKeys.map(String),
        status: selectedStatus as any,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        message.success(
          `Berhasil mengubah status ${selectedRowKeys.length} peserta`,
        );
        setBulkStatusModalOpen(false);
        setSelectedStatus("");
        onSuccess();
      },
      onError: (err) => {
        message.error(`Gagal mengubah status: ${err.message}`);
      },
    },
  );

  // Update by email list
  const { loading: emailLoading, run: runEmailUpdate } = useRequest(
    async () => {
      const emails = emailList
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emails.length === 0) {
        throw new Error("Tidak ada email yang valid");
      }

      await updateRegistrantsByEmail(activityId, {
        emails,
        status: selectedStatus,
      });
    },
    {
      manual: true,
      onSuccess: () => {
        message.success("Berhasil mengubah status berdasarkan email");
        setEmailStatusModalOpen(false);
        setSelectedStatus("");
        setEmailList("");
        onSuccess();
      },
      onError: (err) => {
        message.error(`Gagal mengubah status: ${err.message}`);
      },
    },
  );

  const handleBulkStatusClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Pilih peserta terlebih dahulu");
      return;
    }
    setBulkStatusModalOpen(true);
  };

  const handleEmailStatusClick = () => {
    setEmailStatusModalOpen(true);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "bulk-status",
      label: `Ubah Status (${selectedRowKeys.length} dipilih)`,
      icon: <EditOutlined />,
      disabled: selectedRowKeys.length === 0,
      onClick: handleBulkStatusClick,
    },
    {
      type: "divider",
    },
    {
      key: "email-status",
      label: "Ubah Status Berdasarkan Email",
      icon: <MailOutlined />,
      onClick: handleEmailStatusClick,
    },
  ];

  const parsedEmails = emailList
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
        <Button
          icon={<EditOutlined />}
          type={selectedRowKeys.length > 0 ? "primary" : "default"}
        >
          Ubah Status <DownOutlined />
        </Button>
      </Dropdown>

      {/* Bulk Status Modal */}
      <Modal
        title={
          <>
            <ExclamationCircleOutlined
              style={{ color: "#faad14", marginRight: 8 }}
            />
            Ubah Status Peserta
          </>
        }
        open={bulkStatusModalOpen}
        onCancel={() => setBulkStatusModalOpen(false)}
        onOk={runBulkUpdate}
        okText="Ubah Status"
        cancelText="Batal"
        confirmLoading={bulkLoading}
        okButtonProps={{ disabled: !selectedStatus }}
      >
        <Alert
          message={`Anda akan mengubah status ${selectedRowKeys.length} peserta`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <Text strong>Pilih Status Baru:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Pilih status"
            value={selectedStatus || undefined}
            onChange={setSelectedStatus}
            options={statusOptions}
          />
        </div>
      </Modal>

      {/* Email Status Modal */}
      <Modal
        title={
          <>
            <MailOutlined style={{ color: "#1890ff", marginRight: 8 }} />
            Ubah Status Berdasarkan Email
          </>
        }
        open={emailStatusModalOpen}
        onCancel={() => setEmailStatusModalOpen(false)}
        onOk={runEmailUpdate}
        okText="Ubah Status"
        cancelText="Batal"
        confirmLoading={emailLoading}
        okButtonProps={{
          disabled: !selectedStatus || parsedEmails.length === 0,
        }}
        width={600}
      >
        <Alert
          message="Masukkan daftar email peserta yang ingin diubah statusnya"
          description="Email yang tidak ditemukan dalam kegiatan ini akan diabaikan."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <Text strong>Daftar Email:</Text>
          <TextArea
            style={{ marginTop: 8 }}
            rows={8}
            placeholder={`Masukkan email, pisahkan dengan enter, koma, atau titik koma.\n\nContoh:\nemail1@example.com\nemail2@example.com, email3@example.com`}
            value={emailList}
            onChange={(e) => setEmailList(e.target.value)}
          />
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            {parsedEmails.length} email terdeteksi
          </Text>
        </div>

        <Divider />

        <div>
          <Text strong>Pilih Status Baru:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Pilih status"
            value={selectedStatus || undefined}
            onChange={setSelectedStatus}
            options={statusOptions}
          />
        </div>
      </Modal>
    </>
  );
};

export default StatusBulkActions;
