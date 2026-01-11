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
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Form Pendaftaran
            </Title>
            {!currentForm && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalOpen(true)}
              >
                Tambah Form
              </Button>
            )}
          </div>

          {currentForm ? (
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                border: "1px solid #f0f0f0",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                <Space>
                  <Text strong>{currentForm.form_name}</Text>
                  <Tag color={currentForm.is_active ? "success" : "default"}>
                    {currentForm.is_active ? "Aktif" : "Tidak Aktif"}
                  </Tag>
                </Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate(`/custom-form/${currentForm.id}/edit`)
                  }
                >
                  Ubah Form
                </Button>
              </div>
              {currentForm.form_description && (
                <Text type="secondary">{currentForm.form_description}</Text>
              )}
            </div>
          ) : (
            <Empty description="Belum ada form pendaftaran" />
          )}
        </Space>

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
            <div>
              <Text
                type="secondary"
                style={{ marginBottom: 8, display: "block" }}
              >
                Pilih form yang sudah ada
              </Text>
              <Space.Compact style={{ width: "100%" }}>
                <Select
                  showSearch
                  style={{ width: "100%" }}
                  placeholder="Pilih form"
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
                    <Empty description="Tidak ada form tersedia" />
                  }
                />
                <Button
                  type="primary"
                  onClick={handleAttachForm}
                  loading={attachLoading}
                  disabled={!selectedFormId}
                >
                  Pakai
                </Button>
              </Space.Compact>
            </div>

            <Divider style={{ margin: "12px 0" }}>atau</Divider>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => runCreateAndAttach()}
              loading={createAndAttachLoading}
              disabled={!activityData}
              block
            >
              Buat Form Baru
            </Button>
          </Space>
        </Modal>
      </div>
    </Skeleton>
  );
};

export default CustomFormSelection;
