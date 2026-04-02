import { useRequest } from "ahooks";
import { Col, Form, Input, Modal, Row, Select } from "antd";
import { createMember } from "../../../api/services/member";
import { GENDER_OPTION } from "../../../constants/options";

type CreateMemberModalProps = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  refresh: () => void;
};

export default function CreateMemberModal({
  isOpen,
  setIsOpen,
  refresh,
}: CreateMemberModalProps) {
  const { runAsync, loading } = useRequest(createMember, { manual: true });

  const [form] = Form.useForm();

  return (
    <Modal
      title="Tambah Anggota"
      open={isOpen}
      confirmLoading={loading}
      okText="Simpan"
      cancelText="Batal"
      width={640}
      onOk={async () => {
        const data = await form.validateFields();
        const result = await runAsync(data);
        if (result) {
          form.resetFields();
          setIsOpen(false);
          refresh();
        }
      }}
      onCancel={() => {
        form.resetFields();
        setIsOpen(false);
      }}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Nama Lengkap"
          name="name"
          rules={[{ required: true, message: "Nama tidak boleh kosong" }]}
        >
          <Input placeholder="Nama Lengkap" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Email (opsional)"
              name="email"
              rules={[{ type: "email", message: "Format email tidak valid" }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Password (opsional)"
              name="password"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value.length >= 8) return Promise.resolve();
                    return Promise.reject("Password minimal 8 karakter");
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Password" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="ID Anggota (opsional)" name="member_id">
          <Input placeholder="Diisi otomatis jika kosong" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Jenis Kelamin" name="gender">
              <Select
                style={{ width: "100%" }}
                options={GENDER_OPTION}
                placeholder="Pilih jenis kelamin"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Nomor WhatsApp" name="whatsapp">
              <Input placeholder="Cth: 6281234567890" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Instagram" name="instagram">
              <Input placeholder="Instagram" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Nomor Identitas" name="personal_id">
              <Input placeholder="NIK / NIM" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tempat Lahir" name="place_of_birth">
              <Input placeholder="Tempat lahir" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tanggal Lahir" name="birth_date">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Negara Domisili" name="country">
          <Input placeholder="Negara domisili saat ini" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
