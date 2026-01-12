import { useState } from "react";
import {
  Form,
  Input,
  Col,
  Row,
  Button,
  DatePicker,
  Typography,
  Select,
  Divider,
  notification,
  Tooltip,
  Collapse,
  Skeleton,
  Tag,
  Space,
  Alert,
} from "antd";
import { SaveOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useRequest } from "ahooks";

import {
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  USER_LEVEL_OPTIONS,
} from "../../../../constants/options";

import { getActivity, putActivity } from "../../../../api/services/activity";
import { RichTextEditor } from "../../../../components/common/RichTextEditor";
import {
  ACTIVITY_CATEGORY_ENUM,
  ACTIVITY_TYPE_ENUM,
} from "../../../../types/constants/activity";
import {
  USER_LEVEL_ENUM,
  ADMIN_ROLE_ENUM,
} from "../../../../types/constants/profile";
import { getUserRole } from "../../../../stores/authStore";

const { Title } = Typography;

type FormType = {
  name: string;
  minimum_level: USER_LEVEL_ENUM;
  badge?: string;
  activity_category: ACTIVITY_CATEGORY_ENUM;
  activity_type: ACTIVITY_TYPE_ENUM;
  registration_date: (dayjs.Dayjs | undefined)[];
  activity_date?: (dayjs.Dayjs | undefined)[];
  is_published: boolean;
  custom_selection_status?: string[];
};

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [form] = Form.useForm<FormType>();
  const activityType = Form.useWatch("activity_type", form);
  const isPublished = Form.useWatch("is_published", form);

  const [isChanged, setIsChanged] = useState(false);

  const { loading: editLoading, runAsync } = useRequest(putActivity, {
    manual: true,
  });

  const [description, setDescription] = useState("");

  const { loading: publishLoading, runAsync: runPublishToggle } = useRequest(
    (newStatus: boolean) =>
      putActivity(Number(id), { is_published: newStatus ? 1 : 0 }),
    {
      manual: true,
      onSuccess: (_, [newStatus]) => {
        form.setFieldValue("is_published", newStatus);
        notification.success({
          message: "Berhasil",
          description: newStatus
            ? "Kegiatan berhasil ditayangkan."
            : "Kegiatan berhasil dikembalikan ke draf.",
        });
      },
    },
  );

  const { data: activityData, loading } = useRequest(
    () => getActivity(Number(id)),
    {
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
          badge: data?.badge,
          custom_selection_status:
            data?.additional_config?.custom_selection_status,
        });
        setDescription(data?.description || "");
      },
    },
  );

  return (
    <Skeleton loading={loading}>
      <div>
        <Form
          form={form}
          id="detail-activity"
          layout="vertical"
          onFinish={async (value) => {
            await runAsync(Number(id), {
              ...value,
              slug: value.name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, "")
                .replaceAll(" ", "-"),
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
              additional_config: {
                ...activityData?.additional_config,
                custom_selection_status:
                  value.custom_selection_status?.map((val) =>
                    val.toUpperCase(),
                  ) || [],
              },
              description: description,
            });
            notification.success({
              message: "Berhasil",
              description: "Data berhasil diubah",
            });
            setIsChanged(false);
          }}
          onValuesChange={() => setIsChanged(true)}
        >
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Space align="center" size="middle">
              <Title level={4} style={{ margin: 0 }}>
                Detail Umum
              </Title>
              <Tag color={isPublished ? "green" : "default"}>
                {isPublished ? "Tayang" : "Draf"}
              </Tag>
            </Space>

            <Space>
              {getUserRole() === ADMIN_ROLE_ENUM.SUPER_ADMIN && (
                <Button
                  type={isPublished ? "default" : "primary"}
                  danger={isPublished}
                  loading={publishLoading}
                  onClick={() => runPublishToggle(!isPublished)}
                >
                  {isPublished ? "Kembalikan ke Draf" : "Tampilkan di Web"}
                </Button>
              )}
              <Button
                form="detail-activity"
                htmlType="submit"
                type="primary"
                icon={<SaveOutlined />}
                loading={editLoading}
                disabled={!isChanged}
              >
                Simpan
              </Button>
            </Space>

            <Form.Item name="is_published" valuePropName="checked" hidden>
              <input type="hidden" />
            </Form.Item>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="Nama Kegiatan"
                extra="Nama kegiatan tidak perlu mengandung kata yang redundan seperti Pendaftaran, Oprec dkk. Kecuali kegiatan yang bertipe Umum - Hanya Pendaftaran"
                required
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="minimum_level"
                label="Jenjang Minimum"
                tooltip="Jenjang minimum agar user dapat mendaftar kegiatan ini."
                required
              >
                <Select
                  placeholder="Pilih Minimum Jenjang"
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
            <Col span={8}>
              <Form.Item
                name="activity_category"
                label="Kategori Kegiatan"
                tooltip="Jika bingung memilih kategori, silahkan konsultasikan dengan Asmen atau Admin IT"
                required
              >
                <Select
                  options={ACTIVITY_CATEGORY_OPTIONS}
                  placeholder="Pilih Kategori Kegiatan"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="activity_type"
                label="Tipe Kegiatan"
                extra="Jika belum tahu, silahkan pilih Umum-Hanya Pendaftaran"
                tooltip="Pilihan tipe mempengaruhi jenjang pendaftar, Tolong baca Guideline atau tolong konsultasikan dengan Asmen atau Admin IT jika perlu"
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
          <Divider style={{ margin: "12px 0" }} />
          <Row style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Detail Waktu
            </Title>
          </Row>
          <Row gutter={16}>
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
                  <DatePicker.RangePicker
                    style={{ width: "100%" }}
                    allowEmpty
                  />
                </Form.Item>
              </Col>
            ) : null}
          </Row>

          <Divider style={{ margin: "12px 0" }} />
          <Row style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Deskripsi Kegiatan
            </Title>
          </Row>
          <Alert
            message="Deskripsi kegiatan tidak boleh kosong, tidak boleh mencantumkan link web kaderisasi, dan tidak perlu memiliki hashtag"
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
          />
          <RichTextEditor
            minHeight="300px"
            value={description}
            onChange={(value) => {
              setDescription(value);
              if (value !== activityData?.description) {
                setIsChanged(true);
              }
            }}
          />

          <Divider style={{ margin: "12px 0" }} />
          <Collapse
            bordered={false}
            ghost
            size="small"
            style={{ background: "transparent" }}
            items={[
              {
                key: "1",
                label: "Pengaturan Tambahan",
                children: (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="badge"
                        label="Lencana Kegiatan"
                        tooltip="Hanya untuk kegiatan khusus. Lencana akan diberikan saat peserta lulus kegiatan (Tolong konsultasi melalui Grup BMKA IT Support jika perlu)"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="custom_selection_status"
                        label="Status Pendaftaran Kegiatan Tambahan"
                        tooltip="Hanya untuk kegiatan khusus yang memiliki seleksi lebih dari 1 tahap! (Tolong konsultasi melalui Grup BMKA IT Support jika perlu)"
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          options={
                            activityData?.additional_config?.custom_selection_status?.map(
                              (val) => ({
                                label: val,
                                value: val,
                              }),
                            ) || []
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Form>
      </div>
    </Skeleton>
  );
};

export default ActivityDetail;
