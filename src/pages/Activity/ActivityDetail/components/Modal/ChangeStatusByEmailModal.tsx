import { useRequest } from "ahooks";
import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Select,
  Typography,
  Alert,
  Space,
  Tag,
  Divider,
} from "antd";
import { useState, useMemo, useCallback } from "react";
import { WarningOutlined, ClearOutlined, CheckCircleOutlined, MailOutlined } from "@ant-design/icons";

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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    useState<ACTIVITY_REGISTRANT_STATUS_ENUM | undefined>(undefined);

  // Parse and validate emails
  const parsedEmails = useMemo(() => {
    const emails = emailText
      .split("\n")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const uniqueEmails = [...new Set(emails)]; // Remove duplicates
    const validEmails = uniqueEmails.filter(email => EMAIL_REGEX.test(email));
    const invalidEmails = uniqueEmails.filter(email => !EMAIL_REGEX.test(email));

    return {
      all: uniqueEmails,
      valid: validEmails,
      invalid: invalidEmails,
      duplicates: emails.length - uniqueEmails.length,
    };
  }, [emailText]);

  const handleClear = useCallback(() => {
    setEmailText("");
  }, []);

  const handlePaste = useCallback((_e: React.ClipboardEvent) => {
    // Allow normal paste behavior but could add custom processing here
  }, []);

  const onOk = async () => {
    if (parsedEmails.valid.length === 0) {
      notification.error({
        message: "Email Tidak Valid",
        description: "Masukkan setidaknya satu email yang valid",
      });
      return;
    }

    if (!selectedStatus) {
      notification.error({
        message: "Status Belum Dipilih",
        description: "Pilih status baru untuk peserta",
      });
      return;
    }

    try {
      await runAsync(activityId, {
        emails: parsedEmails.valid,
        status: selectedStatus,
      });
      notification.success({
        message: "Berhasil",
        description: `${parsedEmails.valid.length} peserta berhasil diubah statusnya`,
      });
      setEmailText("");
      setSelectedStatus(undefined);
      toggle(false);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          <span>Ubah Status Berdasarkan Email</span>
        </Space>
      }
      open={open}
      confirmLoading={loading}
      onCancel={() => toggle(false)}
      width={600}
      destroyOnClose
      footer={[
        <Button key="back" onClick={() => toggle(false)} disabled={loading}>
          Batal
        </Button>,
        <Popconfirm
          title={
            <div>
              <Text strong>Ubah status {parsedEmails.valid.length} peserta?</Text>
              <br />
              <Text type="secondary">
                Status akan diubah menjadi: <strong>{selectedStatus}</strong>
              </Text>
            </div>
          }
          description="Aksi ini tidak dapat dibatalkan. Pastikan email dan status sudah benar."
          onConfirm={onOk}
          okText="Ya, Ubah Status"
          cancelText="Batal"
          disabled={!selectedStatus || parsedEmails.valid.length === 0}
        >
          <Button
            key="submit"
            type="primary"
            loading={loading}
            disabled={!selectedStatus || parsedEmails.valid.length === 0}
          >
            {loading ? "Memproses..." : `Ubah Status (${parsedEmails.valid.length})`}
          </Button>
        </Popconfirm>,
      ]}
    >
      <Form layout="vertical" size="middle">
        {/* Email Input Section */}
        <Form.Item
          label={
            <Space>
              <Text strong>Daftar Email</Text>
              <Text type="warning" style={{ fontSize: '12px' }}>
                ⚠️ Pastikan email terdaftar di dalam sistem
              </Text>
              {parsedEmails.all.length > 0 && (
                <Tag color={parsedEmails.valid.length > 0 ? "success" : "error"}>
                  {parsedEmails.valid.length}/{parsedEmails.all.length} valid
                </Tag>
              )}
            </Space>
          }
          tooltip="Masukkan email yang ingin diubah statusnya, satu email per baris"
          help={
            <Space direction="vertical" size="small">
              <Text type="secondary">
                Format: satu email per baris. Duplikat akan otomatis dihapus.
              </Text>
              {parsedEmails.duplicates > 0 && (
                <Text type="warning">
                  ⚠️ {parsedEmails.duplicates} email duplikat telah dihapus
                </Text>
              )}
            </Space>
          }
          validateStatus={parsedEmails.invalid.length > 0 ? "warning" : "success"}
        >
          <TextArea
            rows={6}
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            onPaste={handlePaste}
            placeholder={`contoh@email.com\nemail2@example.com\nemail3@example.com`}
            disabled={loading}
          />
        </Form.Item>

        {/* Clear Button */}
        {emailText && (
          <Form.Item>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              size="small"
              disabled={loading}
            >
              Hapus Semua Email
            </Button>
          </Form.Item>
        )}

        {/* Invalid Emails Warning */}
        {parsedEmails.invalid.length > 0 && (
          <Alert
            message={`${parsedEmails.invalid.length} Email Tidak Valid`}
            description={
              <div>
                <Text>Email berikut tidak valid dan akan diabaikan:</Text>
                <br />
                <Text code style={{ fontSize: '12px' }}>
                  {parsedEmails.invalid.slice(0, 3).join(', ')}
                  {parsedEmails.invalid.length > 3 && ` +${parsedEmails.invalid.length - 3} lainnya`}
                </Text>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        {/* Status Selection */}
        <Form.Item
          label={<Text strong>Status Baru</Text>}
          required
          validateStatus={!selectedStatus ? "error" : "success"}
          help={!selectedStatus ? "Pilih status yang akan diterapkan" : undefined}
        >
          <Select
            options={[
              ...ACTIVITY_REGISTRANT_STATUS_OPTIONS,
              ...(customSelectionStatus?.map((val) => ({
                label: val,
                value: val,
              })) || []),
            ]}
            placeholder="Pilih status pendaftaran baru"
            onChange={(val) => setSelectedStatus(val)}
            value={selectedStatus}
            allowClear
            disabled={loading}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {/* Critical Action Warning */}
        {selectedStatus === ACTIVITY_REGISTRANT_STATUS_ENUM.LULUS_KEGIATAN && (
          <Alert
            style={{ marginBottom: 16 }}
            message="Peringatan:"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  Mengubah status ke "Lulus Kegiatan" akan:
                </Text>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Mengubah level peserta</li>
                  <li>Memberikan lencana baru</li>
                </ul>
                <Text strong style={{ color: '#d4380d' }}>
                  Efek ini tidak dapat dikembalikan!
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {/* Success Preview */}
        {parsedEmails.valid.length > 0 && selectedStatus && (
          <Alert
            message="Pratinjau Perubahan"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {parsedEmails.valid.length} peserta akan diubah statusnya menjadi:
                </Text>
                <Tag color="processing" style={{ fontWeight: 'bold' }}>
                  {selectedStatus}
                </Tag>
              </Space>
            }
            type="info"
            showIcon={false}
          />
        )}
      </Form>
    </Modal>
  );
};

export default ChangeStatusByEmailModal;
