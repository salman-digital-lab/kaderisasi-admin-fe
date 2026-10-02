import { ResponsiveDialog as Modal } from "../../../../components/common/Responsive/ResponsiveDialog";
import {
  Typography,
  Button,
  Space,
  Select,
  Empty,
  Tag,
  Divider,
  Skeleton,
  notification,
  Card,
  Tooltip,
  Alert,
  message,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useRequest } from "ahooks";
import { useState } from "react";
import dayjs from "dayjs";

import {
  getCustomForms,
  getUnattachedForms,
  attachFormToActivity,
  createCustomForm,
  toggleCustomFormActive,
} from "../../../../api/services/customForm";
import type { CustomForm } from "../../../../types/model/customForm";
import { getActivity } from "../../../../api/services/activity";
import { DIALOG_WIDTH } from "../../../../theme/tokens";

const { Title, Text } = Typography;

const CustomFormSelection = ({ setup = false }: { setup?: boolean }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | undefined>();

  // Fetch activity data to get activity name
  const { data: activityData } = useRequest(
    () => {
      if (!id) return Promise.resolve(undefined);
      return getActivity(Number(id));
    },
    {
      refreshDeps: [id],
      ready: !!id,
    },
  );

  // Fetch currently attached form
  const {
    data: currentForm,
    loading: currentFormLoading,
    error: currentFormError,
    refresh: refreshCurrentForm,
  } = useRequest(
    () => {
      if (!id) return Promise.resolve(undefined);
      return getCustomForms({
        feature_type: "activity_registration",
        feature_id: id,
        per_page: "100",
      }).then((result) => result?.data[0]);
    },
    {
      refreshDeps: [id],
      ready: !!id,
    },
  );

  // Fetch unattached forms for selection
  const { data: unattachedFormsData, loading: unattachedLoading } = useRequest(
    () => getUnattachedForms({ per_page: "100" }),
    {
      ready: isModalOpen,
      refreshDeps: [isModalOpen],
    },
  );

  // Attach form action
  const {
    loading: attachLoading,
    error: attachError,
    run: runAttach,
  } = useRequest(
    (formId: number, activityId: number) =>
      attachFormToActivity(formId, activityId),
    {
      manual: true,
      onSuccess: () => {
        refreshCurrentForm();
        setIsModalOpen(false);
        setSelectedFormId(undefined);
        message.success("Formulir berhasil dilampirkan ke kegiatan");
      },
    },
  );

  // Create and attach form action
  const {
    loading: createAndAttachLoading,
    error: createError,
    run: runCreateAndAttach,
  } = useRequest(
    async () => {
      if (!activityData || !id) return;

      const newForm = await createCustomForm({
        formName: `Pendaftaran ${activityData.name}`.slice(0, 100),
        formDescription: `Formulir pendaftaran untuk kegiatan ${activityData.name}`,
        featureType: "activity_registration",
        featureId: Number(id),
        isActive: false,
        formSchema: {
          fields: [],
        },
      });

      if (!newForm?.id) {
        throw new Error("Failed to create formulir");
      }

      refreshCurrentForm();
      setIsModalOpen(false);
      navigate(
        `/activity/${id}/form/${newForm.id}/edit${setup ? "?setup=1" : ""}`,
      );
      message.success("Formulir berhasil dibuat");
      return newForm;
    },
    {
      manual: true,
    },
  );

  const handleAttachForm = (): void => {
    if (!selectedFormId || !id) return;
    runAttach(selectedFormId, Number(id));
  };

  const unattachedForms = unattachedFormsData?.data || [];

  if (currentFormError && !currentFormLoading) {
    return (
      <Alert
        type="error"
        showIcon
        title="Formulir pendaftaran belum berhasil dimuat"
        description="Coba muat ulang untuk melihat formulir kegiatan ini."
        action={<Button onClick={refreshCurrentForm}>Coba lagi</Button>}
      />
    );
  }

  return (
    <Skeleton loading={currentFormLoading}>
      <div>
        {!currentForm ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--app-color-fill-header)",
              border: "1px dashed var(--app-color-border)",
            }}
          >
            <Space orientation="vertical" size="large">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space orientation="vertical" size="small">
                    <Text strong style={{ fontSize: 16 }}>
                      Belum Ada Formulir Pendaftaran
                    </Text>
                    <Text type="secondary" style={{ maxWidth: 400 }}>
                      Kegiatan ini belum memiliki formulir pendaftaran. Anda
                      dapat membuat form baru atau memilih dari form yang sudah
                      ada.
                    </Text>
                  </Space>
                }
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => setIsModalOpen(true)}
              >
                Buat atau pilih formulir
              </Button>
            </Space>
          </div>
        ) : (
          <Space orientation="vertical" size="large" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Formulir Terlampir
              </Title>
              {/* If we want to allow replacing the form, we can adding a change button later */}
            </div>

            <Card
              type="inner"
              title={
                <Space>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentForm.form_name}
                  </Text>
                  <Tag color={currentForm.is_active ? "success" : "default"}>
                    {currentForm.is_active ? "Aktif" : "Tidak Aktif"}
                  </Tag>
                  <Tooltip title="Ubah formulir & pertanyaan">
                    <Button
                      aria-label="Ubah formulir & pertanyaan"
                      icon={<EditOutlined />}
                      onClick={() =>
                        navigate(
                          `/activity/${id}/form/${currentForm.id}/edit${setup ? "?setup=1" : ""}`,
                        )
                      }
                    >
                      Ubah formulir
                    </Button>
                  </Tooltip>
                </Space>
              }
              style={{
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
              }}
            >
              <Space
                orientation="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Deskripsi Formulir
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {currentForm.form_description ? (
                      <Text>{currentForm.form_description}</Text>
                    ) : (
                      <Text type="secondary" italic>
                        Tidak ada deskripsi
                      </Text>
                    )}
                  </div>
                </div>

                {!currentForm.is_active && (
                  <Button
                    onClick={async () => {
                      try {
                        await toggleCustomFormActive(currentForm.id);
                        refreshCurrentForm();
                      } catch {
                        notification.error({
                          title:
                            "Formulir belum berhasil diaktifkan. Coba lagi.",
                        });
                      }
                    }}
                  >
                    Aktifkan formulir yang sudah siap
                  </Button>
                )}
                <Text>
                  Formulir aktif diperlukan sebelum pendaftaran dibuka.
                  Mengaktifkan formulir tidak membuka pendaftaran kegiatan.
                </Text>
                <Divider style={{ margin: "8px 0" }} />

                <div
                  style={{
                    background: "var(--app-color-fill-header)",
                    padding: "12px 16px",
                    border: "1px solid var(--app-color-border-secondary)",
                  }}
                >
                  <Space size="middle" split={<Divider type="vertical" />}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Total Pertanyaan
                      </Text>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>
                        {currentForm.form_schema?.fields?.reduce(
                          (acc, section) => acc + (section.fields?.length || 0),
                          0,
                        ) || 0}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Terakhir Diupdate
                      </Text>
                      <div style={{ fontSize: 14 }}>
                        {currentForm.updated_at
                          ? dayjs(currentForm.updated_at).format(
                              "DD MMM YYYY HH:mm",
                            )
                          : "-"}
                      </div>
                    </div>
                  </Space>
                </div>
              </Space>
            </Card>
          </Space>
        )}

        <Modal
          title="Tambah Formulir Pendaftaran"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedFormId(undefined);
          }}
          footer={null}
          width={DIALOG_WIDTH.small}
        >
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            {(attachError || createError) && (
              <Alert
                type="error"
                showIcon
                title="Formulir belum berhasil disimpan. Coba lagi."
              />
            )}
            <div
              style={{
                background: "var(--app-color-fill-header)",
                padding: 16,
                marginBottom: 8,
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Opsi 1: Pilih Form Tersedia
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: "block", marginBottom: 12 }}
              >
                Gunakan formulir yang sudah pernah dibuat tetapi belum digunakan
                dimanapun.
              </Text>
              <Space.Compact style={{ width: "100%" }}>
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  placeholder="Cari nama formulir..."
                  loading={unattachedLoading}
                  value={selectedFormId}
                  onChange={setSelectedFormId}
                  options={unattachedForms.map((form: CustomForm) => ({
                    label: form.form_name,
                    value: form.id,
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="Tidak ada formulir tersedia"
                    />
                  }
                />
                <Button
                  type="primary"
                  onClick={handleAttachForm}
                  loading={attachLoading}
                  disabled={!selectedFormId}
                >
                  Gunakan
                </Button>
              </Space.Compact>
            </div>

            <div
              style={{
                textAlign: "center",
                color: "var(--app-color-text-secondary)",
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                ATAU
              </Text>
            </div>

            <div
              style={{
                background: "var(--app-color-primary-bg)",
                padding: 16,
                border: "1px solid var(--app-color-primary)",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Opsi 2: Buat Baru
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: "block", marginBottom: 12 }}
              >
                Buat formulir pendaftaran baru khusus untuk kegiatan ini secara
                otomatis.
              </Text>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => runCreateAndAttach()}
                loading={createAndAttachLoading}
                disabled={!activityData}
                block
              >
                Buat formulir baru sekarang
              </Button>
            </div>
          </Space>
        </Modal>
      </div>
    </Skeleton>
  );
};

export default CustomFormSelection;
