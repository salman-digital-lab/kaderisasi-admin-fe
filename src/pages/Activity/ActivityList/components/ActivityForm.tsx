import {
  Alert,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tooltip,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  USER_LEVEL_OPTIONS,
} from "../../../../constants/options";
import { useRequest } from "ahooks";
import { postActivity } from "../../../../api/services/activity";
import { ACTIVITY_TYPE_ENUM } from "../../../../types/constants/activity";
import { USER_LEVEL_ENUM } from "../../../../types/constants/profile";
import { ACTIVITY_CATEGORY_ENUM } from "../../../../types/constants/activity";
interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  refresh: () => void;
}

type FormType = {
  name: string;
  minimum_level: USER_LEVEL_ENUM;
  activity_category: ACTIVITY_CATEGORY_ENUM;
  activity_type: ACTIVITY_TYPE_ENUM;
  registration_date: dayjs.Dayjs[];
  activity_date?: dayjs.Dayjs[];
};

const ActivityForm = ({ open, onClose, refresh }: ActivityFormProps) => {
  const [form] = Form.useForm<FormType>();
  const formActivityType = Form.useWatch("activity_type", form);

  const { loading, runAsync } = useRequest(postActivity, {
    manual: true,
  });

  return (
    <>
      <Modal
        title="Tambah Kegiatan Umum"
        width={720}
        open={open}
        onCancel={onClose}
        cancelText="Batal"
        okText="Buat Kegiatan"
        okButtonProps={{ htmlType: "submit", form: "add-activity-form" }}
        confirmLoading={loading}
      >
        <Form
          id="add-activity-form"
          layout="vertical"
          form={form}
          onFinish={async (value) => {
            await runAsync({
              ...value,
              slug: value.name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replace(" ", "-"),
              registration_start:
                value.registration_date[0].format("YYYY-MM-DD"),
              registration_end: value.registration_date[1].format("YYYY-MM-DD"),
              activity_start: value.activity_date
                ? value.activity_date[0].format("YYYY-MM-DD")
                : undefined,
              activity_end: value.activity_date
                ? value.activity_date[1].format("YYYY-MM-DD")
                : undefined,
            });
            form.resetFields();
            refresh();
            onClose();
          }}
        >
          <Alert
            style={{ marginBottom: 16 }}
            message="Pengisian gambar/poster, deskripsi kegiatan, dan form pendaftarandilakukan setelah anda membuat kegiatan"
            showIcon
          />
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Nama Kegiatan"
                rules={[
                  { required: true, message: "Tolong masukkan nama kegiatan" },
                ]}
                help={
                  formActivityType !== ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY &&
                  "Nama kegiatan tidak perlu mengandung kata yang redundan seperti Pendaftaran, Oprec dkk. Kecuali kegiatan yang bertipe Umum - Hanya Pendaftaran"
                }
              >
                <Input placeholder="Nama Kegiatan" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="minimum_level" label="Minimum Jenjang" required>
                <Select
                  placeholder="Pilih Minimum Jenjang"
                  defaultValue={0}
                  optionRender={(option) => {
                    const content = (
                      <div
                        style={{
                          padding: "4px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <span>{option.data.label}</span>
                        {option.data.title && (
                          <InfoCircleOutlined
                            style={{
                              color: "#1890ff",
                              fontSize: "12px",
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                    );

                    return option.data.title ? (
                      <Tooltip title={option.data.title} placement="right">
                        {content}
                      </Tooltip>
                    ) : (
                      content
                    );
                  }}
                  options={USER_LEVEL_OPTIONS}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="activity_category"
                label="Kategori Kegiatan"
                tooltip="Jika belum tahu, silahkan konsultasikan dengan Asmen"
                required
              >
                <Select
                  options={ACTIVITY_CATEGORY_OPTIONS}
                  placeholder="Pilih Kategori Kegiatan"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="activity_type"
                label="Tipe Kegiatan"
                tooltip="Jika belum tahu, silahkan pilih Umum-Hanya Pendaftaran"
                required
              >
                <Select
                  optionRender={(option) => {
                    const content = (
                      <div
                        style={{
                          padding: "4px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <span>{option.data.label}</span>
                        {option.data.title && (
                          <InfoCircleOutlined
                            style={{
                              color: "#1890ff",
                              fontSize: "12px",
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </div>
                    );

                    return option.data.title ? (
                      <Tooltip title={option.data.title} placement="right">
                        {content}
                      </Tooltip>
                    ) : (
                      content
                    );
                  }}
                  options={ACTIVITY_TYPE_OPTIONS}
                  placeholder="Pilih Tipe Kegiatan"
                />
              </Form.Item>
            </Col>
          </Row>
          <Divider />
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="registration_date"
                label="Tanggal Mulai & Selesai Pendaftaran"
                tooltip="Kegiatan akan otomatis di tutup jika tanggal selesai pendaftaran sudah lewat"
                required
              >
                <DatePicker.RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            {formActivityType !== ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY ? (
              <Col span={12}>
                <Form.Item
                  name="activity_date"
                  label="Tanggal Mulai & Selesai Kegiatan"
                >
                  <DatePicker.RangePicker style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            ) : null}
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default ActivityForm;
