import { Button, Col, Form, Input, Modal, Row } from "antd";
import { useRequest } from "ahooks";

import { addProvince, updateProvince } from "../../../api/services/province";
import { useEffect } from "react";

interface ProvinceFormProps {
  open: boolean;
  onClose: () => void;
  initialValues?: { id: number; name: string };
}

type FormType = {
  name: string;
};

const ProvinceForm = ({ open, onClose, initialValues }: ProvinceFormProps) => {
  const [form] = Form.useForm<FormType>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
  }, [initialValues]);

  const { loading: addLoading, runAsync: runAddProvince } = useRequest(
    addProvince,
    {
      manual: true,
    },
  );

  const { loading: editLoading, runAsync: runUpdateProvince } = useRequest(
    updateProvince,
    {
      manual: true,
    },
  );

  const onFinish = async (values: FormType) => {
    try {
      if (initialValues) {
        await runUpdateProvince(initialValues?.id, {
          ...values,
        });
      } else {
        await runAddProvince({
          ...values,
        });
      }
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Modal
      title={initialValues ? "Edit Provinsi" : "Tambah Provinsi"}
      width={720}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Batal
        </Button>,
        <Button
          key="submit"
          htmlType="submit"
          form="submit-form"
          type="primary"
          loading={initialValues ? editLoading : addLoading}
        >
          Simpan
        </Button>,
      ]}
    >
      <Form
        id="submit-form"
        layout="vertical"
        form={form}
        onFinish={onFinish}
        initialValues={initialValues}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="name" label="Nama Provinsi" required>
              <Input placeholder="Nama Provinsi" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ProvinceForm;
