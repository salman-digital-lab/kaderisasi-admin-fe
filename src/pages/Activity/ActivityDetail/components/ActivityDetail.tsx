import {
  Form,
  Input,
  Col,
  Row,
  Button,
  Card,
  DatePicker,
  Typography,
  Select,
  Divider,
  Checkbox,
  notification,
} from "antd";
import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useRequest, useToggle } from "ahooks";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  USER_LEVEL_OPTIONS,
} from "../../../../constants/options";

import { getActivity, putActivity } from "../../../../api/services/activity";
import {
  ACTIVITY_CATEGORY_ENUM,
  ACTIVITY_TYPE_ENUM,
} from "../../../../types/constants/activity";
import { USER_LEVEL_ENUM } from "../../../../types/constants/profile";

const { Title } = Typography;

type FormType = {
  name: string;
  minimum_level: USER_LEVEL_ENUM;
  activity_category: ACTIVITY_CATEGORY_ENUM;
  activity_type: ACTIVITY_TYPE_ENUM;
  registration_date: (dayjs.Dayjs | undefined)[];
  activity_date?: (dayjs.Dayjs | undefined)[];
  is_published: boolean;
};

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [isEdit, { toggle: toggleEdit }] = useToggle(false);
  const [form] = Form.useForm<FormType>();
  const activityType = Form.useWatch("activity_type", form);

  const { loading: editLoading, runAsync } = useRequest(putActivity, {
    manual: true,
  });

  const { loading } = useRequest(() => getActivity(Number(id)), {
    cacheKey: `activity-${id}`,
    onSuccess: (data) => {
      form.setFieldsValue({
        name: data?.name,
        minimum_level: data?.minimum_level,
        activity_category: data?.activity_category,
        activity_type: data?.activity_type,
        registration_date: [
          data?.registration_start
            ? dayjs(data?.registration_start)
            : undefined,
          data?.registration_end ? dayjs(data?.registration_end) : undefined,
        ],
        activity_date: [
          data?.activity_start ? dayjs(data?.activity_start) : undefined,
          data?.activity_end ? dayjs(data?.activity_end) : undefined,
        ],
        is_published: Boolean(data?.is_published),
      });
    },
  });

  return (
    <Card loading={loading}>
      <Row justify="end" align="bottom">
        {isEdit ? (
          <div>
            <Button
              form="detail-activity"
              htmlType="submit"
              type="primary"
              icon={<SaveOutlined />}
              loading={editLoading}
            >
              Simpan
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => toggleEdit()}
          >
            Ubah
          </Button>
        )}
      </Row>

      <Form
        form={form}
        id="detail-activity"
        layout="vertical"
        disabled={!isEdit}
        onFinish={async (value) => {
          await runAsync(Number(id), {
            ...value,
            slug: value.name.trim().toLowerCase().replaceAll(" ", "-"),
            is_published: value.is_published ? 1 : 0,
            registration_start: value.registration_date[0]
              ? value.registration_date[0].format("YYYY-MM-DD")
              : undefined,
            registration_end: value.registration_date[1]
              ? value.registration_date[1].format("YYYY-MM-DD")
              : undefined,
            activity_start:
              value.activity_date && value.activity_date[0]
                ? value.activity_date[0].format("YYYY-MM-DD")
                : undefined,
            activity_end:
              value.activity_date && value.activity_date[1]
                ? value.activity_date[1].format("YYYY-MM-DD")
                : undefined,
          });
          notification.success({
            message: "Berhasil",
            description: "Data berhasil diubah",
          });
          toggleEdit();
        }}
      >
        <Row>
          <Title level={3}>Detil Umum</Title>
        </Row>
        <Row gutter={48}>
          <Col span={12}>
            <Form.Item name="name" label="Nama Kegiatan" required>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minimum_level" label="Jenjang Minimum" required>
              <Select
                placeholder="Pilih Minimum Jenjang"
                options={USER_LEVEL_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={48}>
          <Col span={12}>
            <Form.Item
              name="activity_category"
              label="Kategori Kegiatan"
              required
            >
              <Select
                options={ACTIVITY_CATEGORY_OPTIONS}
                placeholder="Pilih Kategori Kegiatan"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="activity_type" label="Tipe Kegiatan" required>
              <Select
                options={ACTIVITY_TYPE_OPTIONS}
                placeholder="Pilih Tipe Kegiatan"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item name="is_published" valuePropName="checked">
              <Checkbox>
                <b>Tampilkan Di Website</b>
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Row>
          <Title level={3}>Detil Waktu</Title>
        </Row>
        <Row gutter={48}>
          <Col span={12}>
            <Form.Item
              name="registration_date"
              label="Tanggal Mulai & Selesai Pendaftaran"
              required
            >
              <DatePicker.RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          {activityType !== ACTIVITY_TYPE_ENUM.REGISTRATION_ONLY ? (
            <Col span={12}>
              <Form.Item
                label="Tanggal Mulai & Selesai Kegiatan"
                name="activity_date"
              >
                <DatePicker.RangePicker style={{ width: "100%" }} allowEmpty />
              </Form.Item>
            </Col>
          ) : null}
        </Row>
      </Form>
    </Card>
  );
};

export default ActivityDetail;
