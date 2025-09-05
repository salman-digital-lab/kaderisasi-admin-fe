import { useEffect } from "react";
import { Button, Col, Form, Input, Modal, Row, Select } from "antd";
import { addUniversity, putUniversity } from "../../../api/services/university";
import { getProvinces } from "../../../api/services/province";
import { useRequest } from "ahooks";

interface UniversityFormProps {
  open: boolean;
  onClose: () => void;
  initialValues: { id: number; name: string; province_id?: number };
}

type FormType = {
  name: string;
  provinceId: number;
};

const UniversityForm = ({
  open,
  onClose,
  initialValues,
}: UniversityFormProps) => {
  const [form] = Form.useForm<FormType>();

  const { data: provinces } = useRequest(() => getProvinces({}));

  useEffect(() => {
    form.setFieldsValue({
      name: initialValues.name,
      provinceId: initialValues.province_id,
    });
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
              <Form.Item
                name="name"
                label="Nama Universitas"
                rules={[
                  { required: true, message: 'Nama Universitas wajib diisi' },
                  { min: 2, message: 'Nama Universitas minimal 2 karakter' }
                ]}
              >
                <Input placeholder="Nama Univeristas" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="provinceId"
                label="Provinsi"
                rules={[
                  { required: true, message: 'Provinsi wajib dipilih' }
                ]}
              >
                <Select
                  placeholder="Pilih Provinsi"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {provinces?.data?.map((province) => (
                    <Select.Option key={province.id} value={province.id}>
                      {province.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default UniversityForm;
