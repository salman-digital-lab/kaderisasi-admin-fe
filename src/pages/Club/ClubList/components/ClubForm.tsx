import { Modal, Form, Input, Button, DatePicker, Row, Col, Switch } from "antd";
import { useRequest } from "ahooks";
import dayjs from "dayjs";

import { postClub } from "../../../../api/services/club";

type ClubFormProps = {
  open: boolean;
  onClose: () => void;
  refresh: () => void;
};

type FieldType = {
  name: string;
  short_description?: string;
  start_period?: any;
  end_period?: any;
  is_registration_open?: boolean;
  registration_end_date?: any;
};

const ClubForm = ({ open, onClose, refresh }: ClubFormProps) => {
  const [form] = Form.useForm<FieldType>();

  const { loading, run } = useRequest(
    (data: FieldType) => postClub({ 
      ...data, 
      start_period: data.start_period ? dayjs(data.start_period).format('YYYY-MM-DD') : undefined,
      end_period: data.end_period ? dayjs(data.end_period).format('YYYY-MM-DD') : undefined,
      registration_end_date: data.registration_end_date ? dayjs(data.registration_end_date).format('YYYY-MM-DD') : undefined,
    }),
    {
      manual: true,
      onSuccess: () => {
        form.resetFields();
        onClose();
        refresh();
      },
    }
  );

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      run(values);
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Tambah Club"
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Batal
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Simpan
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Nama Club"
          name="name"
          rules={[{ required: true, message: "Nama club wajib diisi!" }]}
        >
          <Input placeholder="Masukkan nama club" />
        </Form.Item>
        <Form.Item
          label="Deskripsi Singkat"
          name="short_description"
          rules={[
            { max: 200, message: "Deskripsi singkat maksimal 200 karakter!" }
          ]}
        >
          <Input.TextArea 
            placeholder="Masukkan deskripsi singkat club (maks. 200 karakter)"
            maxLength={200}
            showCount
            rows={3}
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Periode Mulai" name="start_period">
              <DatePicker 
                picker="month" 
                placeholder="Pilih bulan mulai"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Periode Berakhir" name="end_period">
              <DatePicker 
                picker="month" 
                placeholder="Pilih bulan berakhir"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Pendaftaran Dibuka" name="is_registration_open" valuePropName="checked">
              <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Tanggal Berakhir Pendaftaran" name="registration_end_date">
              <DatePicker 
                placeholder="Pilih tanggal berakhir pendaftaran"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ClubForm;
