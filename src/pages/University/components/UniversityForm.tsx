import { useEffect } from "react";
import { Button, Col, Form, Input, Modal, Row } from "antd";
import { addUniversity, putUniversity } from "../../../api/services/university";
import { useRequest } from "ahooks";

interface UniversityFormProps {
  open: boolean;
  onClose: () => void;
  initialValues: { id: number; name: string };
}

type FormType = {
  name?: string;
};

const UniversityForm = ({
  open,
  onClose,
  initialValues,
}: UniversityFormProps) => {
  const [form] = Form.useForm<FormType>();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const { loading: addLoading, runAsync: runAddUniversity } = useRequest(
    addUniversity,
    {
      manual: true,
    },
  );

  const { loading: editLoading, runAsync: runEditUniversity } = useRequest(
    putUniversity,
    {
      manual: true,
    },
  );

  const onFinish = async (values: FormType) => {
    try {
      if (initialValues && initialValues?.id !== 0) {
        await runEditUniversity(initialValues?.id, {
          data: values,
        });
        onClose();
      } else {
        await runAddUniversity({
          data: values,
        });
        onClose();
      }
      form.resetFields();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <Modal
        title={
          initialValues?.id !== 0 ? "Edit Universitas" : "Tambah Univeristas"
        }
        width={720}
        open={open}
        onCancel={onClose}
        footer={[
          <Button key="back" onClick={onClose}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={initialValues ? editLoading : addLoading}
            onClick={() => form.submit()}
          >
            Simpan
          </Button>,
        ]}
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="name" label="Nama Universitas">
                <Input placeholder="Nama Univeristas" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default UniversityForm;
