import {
  Typography,
  Button,
  Space,
  Modal,
  Select,
  Empty,
  Tag,
  Divider,
  Skeleton,
  notification,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useRequest } from "ahooks";
import { useState } from "react";

import {
  getCustomFormByFeature,
  getUnattachedForms,
  attachFormToActivity,
  createCustomForm,
} from "../../../../api/services/customForm";
import type { CustomForm } from "../../../../types/model/customForm";
import { getActivity } from "../../../../api/services/activity";

const { Title, Text } = Typography;

const CustomFormSelection = () => {
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
    refresh: refreshCurrentForm,
  } = useRequest(
    () => {
      if (!id) return Promise.resolve(undefined);
      return getCustomFormByFeature("activity_registration", id);
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
  const { loading: attachLoading, runAsync: runAttach } = useRequest(
    (formId: number, activityId: number) =>
      attachFormToActivity(formId, activityId),
    {
      manual: true,
      onSuccess: () => {
        refreshCurrentForm();
        setIsModalOpen(false);
        setSelectedFormId(undefined);
        notification.success({
          message: "Berhasil",
          description: "Form berhasil dilampirkan ke kegiatan",
        });
      },
    },
  );

  // Create and attach form action
  const { loading: createAndAttachLoading, runAsync: runCreateAndAttach } =
    useRequest(
      async () => {
        if (!activityData || !id) return;

        const newForm = await createCustomForm({
          formName: activityData.name,
          formDescription: `Form pendaftaran untuk kegiatan ${activityData.name}`,
          featureType: "activity_registration",
          featureId: Number(id),
          isActive: true,
          formSchema: {
            fields: [],
          },
        });

        if (!newForm?.id) {
          throw new Error("Failed to create form");
        }

        refreshCurrentForm();
        setIsModalOpen(false);
        notification.success({
          message: "Berhasil",
          description: "Form berhasil dibuat",
        });
        return newForm;
      },
      {
        manual: true,
      },
    );

  const handleAttachForm = async () => {
    if (!selectedFormId || !id) return;
    await runAttach(selectedFormId, Number(id));
  };

  const unattachedForms = unattachedFormsData?.data || [];

  return (
    <Skeleton loading={currentFormLoading}>
      <div>
        {!currentForm ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#fafafa",
              borderRadius: 8,
              border: "1px dashed #d9d9d9",
            }}
          >
            <Space direction="vertical" size="large">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 16 }}>
                      Belum Ada Form Pendaftaran
                    </Text>
                    <Text type="secondary" style={{ maxWidth: 400 }}>
                      Kegiatan ini belum memiliki form pendaftaran. Anda dapat
                      membuat form baru atau memilih dari form yang sudah ada.
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
                Buat atau Pilih Form
              </Button>
            </Space>
          </div>
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                Form Terlampir
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
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  ghost
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate(`/activity/${id}/form/${currentForm.id}/edit`)
                  }
                >
                  Edit Form & Pertanyaan
                </Button>
              }
              style={{
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                borderRadius: 8,
              }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Deskripsi Form
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

                <Divider style={{ margin: "8px 0" }} />

                <div
                  style={{
                    background: "#f9f9f9",
                    padding: "12px 16px",
                    borderRadius: 6,
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <Space size="middle" split={<Divider type="vertical" />}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Total Pertanyaan
                      </Text>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>
                        {currentForm.form_schema?.fields?.length || 0}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Terakhir Diupdate
                      </Text>
                      <div style={{ fontSize: 14 }}>
                        {/* Assuming we might have updated_at later, for now placeholder or nothing */}
                        -
                      </div>
                    </div>
                  </Space>
                </div>
              </Space>
            </Card>
          </Space>
        )}

        <Modal
          title="Tambah Form Pendaftaran"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedFormId(undefined);
          }}
          footer={null}
          width={500}
        >
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div
              style={{
                background: "#f5f5f5",
                padding: 16,
                borderRadius: 8,
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
                Gunakan form yang sudah pernah dibuat tetapi belum digunakan
                dimanapun.
              </Text>
              <Space.Compact style={{ width: "100%" }}>
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  placeholder="Cari nama form..."
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
                      description="Tidak ada form tersedia"
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

            <div style={{ textAlign: "center", color: "#999" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ATAU
              </Text>
            </div>

            <div
              style={{
                background: "#e6f7ff",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #91d5ff",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                Opsi 2: Buat Baru
              </Text>
              <Text
                type="secondary"
                style={{ fontSize: 13, display: "block", marginBottom: 12 }}
              >
                Buat form pendaftaran baru khusus untuk kegiatan ini secara
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
                Buat Form Baru Sekarang
              </Button>
            </div>
          </Space>
        </Modal>
      </div>
    </Skeleton>
  );
};

export default CustomFormSelection;
