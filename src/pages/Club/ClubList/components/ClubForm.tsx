import { Alert, Form, Input, Modal, Select, Typography } from "antd";
import { useRequest } from "ahooks";
import { useNavigate } from "react-router-dom";

import { postClub } from "../../../../api/services/club";
import { CLUB_TYPE_OPTIONS } from "../../../../constants/options";
import {
  CLUB_TYPE_DESCRIPTIONS,
  type ClubType,
} from "../../../../types/model/club";
import { createDraftClubPayload } from "../../utils/mutation-payloads";

type ClubFormProps = {
  open: boolean;
  onClose: () => void;
};

type FieldType = {
  name: string;
  club_type: ClubType;
};

const ClubForm = ({ open, onClose }: ClubFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FieldType>();
  const selectedClubType = Form.useWatch("club_type", form) || "UNIT";

  const { loading, run } = useRequest(
    (data: FieldType) => postClub(createDraftClubPayload(data)),
    {
      manual: true,
      onSuccess: (createdClub) => {
        form.resetFields();
        onClose();
        navigate(`/club/${createdClub.id}?section=overview&setup=1`);
      },
    },
  );

  const handleCancel = (): void => {
    if (loading) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Buat Draf Klub"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      okText="Buat dan Lanjutkan"
      cancelText="Batal"
      confirmLoading={loading}
      cancelButtonProps={{ disabled: loading }}
      closable={!loading}
      keyboard={!loading}
      maskClosable={!loading}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        title="Mulai dengan informasi dasar"
        description="Klub disimpan sebagai draf. Profil, logo, media, dan pendaftaran dapat dilengkapi pada langkah berikutnya."
        style={{ marginBottom: 16 }}
      />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ club_type: "UNIT" }}
        onFinish={run}
      >
        <Form.Item
          label="Tipe Klub"
          name="club_type"
          rules={[{ required: true, message: "Tipe klub wajib dipilih!" }]}
        >
          <Select options={CLUB_TYPE_OPTIONS} placeholder="Pilih tipe klub" />
        </Form.Item>
        <Typography.Paragraph
          type="secondary"
          role="status"
          aria-live="polite"
          style={{ marginTop: -16 }}
        >
          {CLUB_TYPE_DESCRIPTIONS[selectedClubType]}
        </Typography.Paragraph>

        <Form.Item
          label="Nama Klub"
          name="name"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Nama klub wajib diisi!",
            },
          ]}
        >
          <Input
            placeholder="Contoh: Klub Desain Produk"
            autoFocus
            maxLength={150}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ClubForm;
