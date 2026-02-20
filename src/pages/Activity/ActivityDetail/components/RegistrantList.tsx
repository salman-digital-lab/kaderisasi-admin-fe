import {
  Button,
  Space,
  Row,
  Col,
  Skeleton,
  Tag,
  Typography,
  Card,
  Form,
  Switch,
  DatePicker,
  Alert,
  notification,
  Divider,
  Select,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useCallback, memo, ReactNode, useState } from "react";
import { useRequest, useToggle } from "ahooks";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import {
  getActivity,
  getRegistrantStatistics,
  putActivity,
} from "../../../../api/services/activity";
import { getCertificateTemplates } from "../../../../api/services/certificateTemplate";

import MembersListModal from "./Modal/MembersListModal";

// Status configuration for display
const statusConfig: Record<
  string,
  { color: string; icon: ReactNode; label: string }
> = {
  TERDAFTAR: {
    color: "blue",
    icon: <ClockCircleOutlined />,
    label: "Terdaftar",
  },
  DITERIMA: {
    color: "green",
    icon: <CheckCircleOutlined />,
    label: "Diterima",
  },
  "LULUS KEGIATAN": {
    color: "purple",
    icon: <TrophyOutlined />,
    label: "Lulus Kegiatan",
  },
  "TIDAK LULUS": {
    color: "red",
    icon: <CloseCircleOutlined />,
    label: "Tidak Lulus",
  },
  "TIDAK DITERIMA": {
    color: "red",
    icon: <CloseCircleOutlined />,
    label: "Tidak Diterima",
  },
};

const RegistrantList = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [modalState, { toggle: toggleModal }] = useToggle();
  const [form] = Form.useForm();
  const [isChanged, setIsChanged] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [originalTemplateId, setOriginalTemplateId] = useState<number | null>(null);
  const [savingCertificate, setSavingCertificate] = useState(false);
  const statusIsVisible = Form.useWatch("status_is_visible", form);
  const statusVisibleAt = Form.useWatch("status_visible_at", form);

  // Fetch activity details
  const {
    data: activityData,
    loading: activityLoading,
    refresh: refreshActivity,
  } = useRequest(() => getActivity(Number(id)), {
    onSuccess: (data) => {
      console.log("Activity data loaded:", data?.additional_config?.certificate_template_id);
      form.setFieldsValue({
        status_is_visible:
          data?.additional_config?.status_visibility?.is_visible ?? true,
        status_visible_at: data?.additional_config?.status_visibility
          ?.visible_at
          ? dayjs(data.additional_config.status_visibility.visible_at)
          : undefined,
        certificate_template_id: data?.additional_config?.certificate_template_id,
      });
      loadTemplates(data);
    },
  });

  // Load certificate templates
  const loadTemplates = async (currentActivityData?: any) => {
    console.log("loadTemplates called with:", currentActivityData?.additional_config?.certificate_template_id);
    try {
      const data = await getCertificateTemplates({
        page: "1",
        per_page: "100",
        is_active: "true",
      });
      if (data?.data) {
        setTemplates(data.data);
        // Set the initial value from activity data after templates are loaded
        const activityConfig = currentActivityData?.additional_config;
        console.log("Setting selectedTemplateId to:", activityConfig?.certificate_template_id);
        const templateId = activityConfig?.certificate_template_id || null;
        setSelectedTemplateId(templateId);
        setOriginalTemplateId(templateId);
        setIsChanged(false);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  // Save status visibility settings
  const { loading: saveLoading, runAsync: saveSettings } = useRequest(
    async (values: {
      status_is_visible: boolean;
      status_visible_at?: dayjs.Dayjs;
    }) => {
      if (!activityData) {
        throw new Error("Activity data not loaded");
      }
      return putActivity(Number(id), {
        additional_config: {
          ...activityData.additional_config,
          status_visibility: {
            is_visible: values.status_is_visible ?? true,
            visible_at: values.status_visible_at
              ? values.status_visible_at.toISOString()
              : undefined,
          },
        },
      });
    },
    {
      manual: true,
      onSuccess: () => {
        notification.success({
          message: "Berhasil",
          description: "Pengaturan pengumuman status berhasil disimpan",
        });
        setIsChanged(false);
        // Refresh the activity data to update the cache
        refreshActivity();
      },
    },
  );

  // Fetch participant statistics
  const { data: stats, loading: statsLoading } = useRequest(
    () => getRegistrantStatistics(id),
    {
      refreshDeps: [id],
    },
  );

  // Navigate to full participant management page
  const handleManageParticipants = useCallback(() => {
    navigate(`/activity/${id}/participants`);
  }, [navigate, id]);

  const primaryStatuses = [
    "TERDAFTAR",
    "DITERIMA",
    "LULUS KEGIATAN",
    "TIDAK LULUS",
    "TIDAK DITERIMA",
  ];
  const byStatus = stats?.by_status || {};
  const total = stats?.total || 0;
  const customStatuses = Object.keys(byStatus).filter(
    (s) => !primaryStatuses.includes(s),
  );

  if (statsLoading || activityLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div>
      <MembersListModal open={modalState} toggle={toggleModal} />

      {/* Summary Banner */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 24 }}
        styles={{ body: { padding: "24px" } }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space direction="vertical" size={4}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Total Peserta Terdaftar
              </Typography.Text>
              <Space align="center" size="small">
                <TeamOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />
                <Typography.Title
                  level={3}
                  style={{ margin: 0, fontWeight: 600 }}
                >
                  {total}
                </Typography.Title>
                <Typography.Text type="secondary">Orang</Typography.Text>
              </Space>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ArrowRightOutlined />}
              onClick={handleManageParticipants}
            >
              Kelola & Lihat Detail Peserta
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Status Visibility Settings */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={() => setIsChanged(true)}
        onFinish={async (values) => {
          await saveSettings(values);
        }}
      >
        <Card variant="outlined" style={{ borderRadius: 0, marginBottom: 24 }}>
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Typography.Title level={5} style={{ margin: 0 }}>
              Pengaturan Pengumuman Status
            </Typography.Title>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saveLoading}
              disabled={!isChanged || !activityData}
              htmlType="submit"
              size="small"
            >
              Simpan
            </Button>
          </Row>
          <Divider style={{ margin: "0 0 16px 0" }} />
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Form.Item
                name="status_is_visible"
                label="Tampilkan Status ke Peserta"
                valuePropName="checked"
                tooltip="Jika dimatikan, peserta akan melihat 'Status Belum Diumumkan' hingga waktu pengumuman tiba"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="Tampil" unCheckedChildren="Sembunyi" />
              </Form.Item>
            </Col>
            {!statusIsVisible && (
              <Col span={12}>
                <Form.Item
                  name="status_visible_at"
                  label="Waktu Pengumuman Status"
                  tooltip="Tanggal dan waktu kapan estimasi status akan ditampilkan ke peserta"
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    placeholder="Pilih waktu pengumuman"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>
          {!statusIsVisible && (
            <Alert
              message="Status saat ini disembunyikan dari peserta"
              description={
                statusVisibleAt
                  ? `Status akan ditampilkan pada ${statusVisibleAt.format("DD MMMM YYYY, HH:mm")}`
                  : "Silakan tentukan waktu pengumuman"
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      </Form>

      {/* Certificate Template Settings */}
      <Card
        variant="outlined"
        style={{ borderRadius: 0, marginBottom: 24 }}
        styles={{ body: { padding: "24px" } }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Space align="center">
            <SafetyCertificateOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Typography.Title level={5} style={{ margin: 0 }}>
              Template Sertifikat
            </Typography.Title>
          </Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={savingCertificate}
            disabled={!activityData || !isChanged}
            onClick={async () => {
              console.log("Selected template id:", selectedTemplateId);
              if (!activityData) return;
              
              setSavingCertificate(true);
              try {
                const currentConfig = activityData.additional_config || {};
                await putActivity(Number(id), {
                  additional_config: {
                    ...currentConfig,
                    certificate_template_id: selectedTemplateId || undefined,
                  },
                });
                notification.success({
                  message: "Berhasil",
                  description: "Template sertifikat berhasil disimpan",
                });
                setOriginalTemplateId(selectedTemplateId);
                setIsChanged(false);
                refreshActivity();
              } catch (error) {
                notification.error({
                  message: "Gagal",
                  description: "Gagal menyimpan template sertifikat",
                });
              } finally {
                setSavingCertificate(false);
              }
            }}
            size="small"
          >
            Simpan
          </Button>
        </Row>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form.Item
          label="Pilih template sertifikat untuk kegiatan ini"
          tooltip="Template sertifikat yang akan digunakan untuk peserta yang LULUS KEGIATAN"
        >
          <Select
            placeholder="Pilih template sertifikat"
            allowClear
            value={selectedTemplateId}
            onChange={(value) => {
              setSelectedTemplateId(value);
              form.setFieldsValue({ certificate_template_id: value });
              setIsChanged(value !== originalTemplateId);
            }}
            options={templates.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
            loading={templates.length === 0}
          />
        </Form.Item>
        {templates.length === 0 && (
          <Alert
            message="Tidak ada template sertifikat"
            description="Silakan buat template sertifikat terlebih dahulu di halaman Digital Certificate"
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Statistics by Status */}
      <div>
        <Typography.Title level={5} style={{ marginBottom: 16 }}>
          Ringkasan Status Peserta
        </Typography.Title>
        <Row gutter={[16, 16]}>
          {primaryStatuses.map((status) => {
            const count = byStatus[status] || 0;
            const config = statusConfig[status];
            if (!config) return null;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
                <Card
                  variant="outlined"
                  style={{
                    height: "100%",
                    borderRadius: 0,
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                      >
                        {config.label}
                      </Typography.Text>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Title
                          level={3}
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {count}
                        </Typography.Title>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {total > 0 ? Math.round((count / total) * 100) : 0}%
                        </Typography.Text>
                      </div>
                    </div>
                    <div
                      style={{
                        color:
                          config.color === "blue"
                            ? "#1890ff"
                            : config.color === "green"
                              ? "#52c41a"
                              : config.color === "red"
                                ? "#ff4d4f"
                                : "#722ed1",
                        fontSize: 20,
                      }}
                    >
                      {config.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}

          {/* Custom statuses */}
          {customStatuses.map((status) => {
            const count = byStatus[status] || 0;

            return (
              <Col xs={12} sm={8} md={6} lg={4} key={status}>
                <Card
                  variant="outlined"
                  style={{
                    height: "100%",
                    borderRadius: 0,
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ width: "100%" }}>
                      <Tag
                        style={{
                          margin: "0 0 4px 0",
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {status}
                      </Tag>
                      <div>
                        <Typography.Title
                          level={3}
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {count}
                        </Typography.Title>
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {total > 0 ? Math.round((count / total) * 100) : 0}%
                        </Typography.Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default memo(RegistrantList);
