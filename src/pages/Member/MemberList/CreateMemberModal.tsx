import { useRequest } from "ahooks";
import { Form, Input, Modal, Select } from "antd";
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

        <Form.Item
          label="Jenis Kelamin"
          name="gender"
          rules={[{ required: true, message: "Jenis kelamin wajib dipilih" }]}
        >
          <Select
            style={{ width: "100%" }}
            options={GENDER_OPTION}
            placeholder="Pilih jenis kelamin"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
