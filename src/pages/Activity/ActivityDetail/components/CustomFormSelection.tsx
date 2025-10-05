import {
  Card,
  Typography,
  Button,
  Space,
  Modal,
  Select,
  Empty,
  Tag,
  Alert,
  Divider,
} from "antd";
import { PlusOutlined, DeleteOutlined, EyeOutlined, FormOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useRequest } from "ahooks";
import { useState } from "react";

import {
  getCustomFormByFeature,
  getUnattachedForms,
  attachFormToActivity,
  detachFormFromActivity,
} from "../../../../api/services/customForm";
import type { CustomForm } from "../../../../types/model/customForm";

const { Title, Text, Paragraph } = Typography;

const CustomFormSelection = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | undefined>();

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
      },
    },
  );

  // Detach form action
  const { loading: detachLoading, runAsync: runDetach } = useRequest(
    (formId: number) => detachFormFromActivity(formId),
    {
      manual: true,
      onSuccess: () => {
        refreshCurrentForm();
      },
    },
  );

  const handleAttachForm = async () => {
    if (!selectedFormId || !id) return;
    await runAttach(selectedFormId, Number(id));
  };

  const handleDetachForm = () => {
    if (!currentForm?.id) return;
    Modal.confirm({
      title: "Lepaskan Form Pendaftaran",
      content:
        "Apakah Anda yakin ingin melepaskan form ini dari kegiatan? Form akan kembali ke status tidak terlampir.",
      okText: "Ya, Lepaskan",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: async () => {
        await runDetach(currentForm.id);
      },
    });
  };

  const unattachedForms = unattachedFormsData?.data || [];

  return (
    <Card loading={currentFormLoading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={3}>Form Pendaftaran Kegiatan</Title>
          <Paragraph type="secondary">
            Form pendaftaran memungkinkan Anda untuk menambahkan pertanyaan
            tambahan pada pendaftaran kegiatan ini. Setiap kegiatan hanya dapat
            memiliki satu form pendaftaran.
          </Paragraph>
        </div>

        {!currentForm && (
          <Alert
            message="Cara Menambahkan Form Pendaftaran"
            description={
              <Space direction="vertical" size="small">
                <Text>
                  • <strong>Lampirkan form yang sudah ada:</strong> Klik tombol "Lampirkan Form Pendaftaran" di bawah untuk memilih dari form yang tersedia
                </Text>
                <Text>
                  • <strong>Buat form baru:</strong> Klik tombol "Kelola Form Pendaftaran" untuk membuat form baru terlebih dahulu
                </Text>
              </Space>
            }
            type="info"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                icon={<FormOutlined />}
                onClick={() => navigate("/custom-form?create=true")}
              >
                Kelola Form Pendaftaran
              </Button>
            }
          />
        )}

        {currentForm ? (
          <Card
            type="inner"
            title={
              <Space>
                <Text strong>{currentForm.form_name}</Text>
                <Tag color="green">Terlampir</Tag>
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() =>
                    navigate(`/custom-form/${currentForm.id}/edit`)
                  }
                >
                  Lihat Detail
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDetachForm}
                  loading={detachLoading}
                >
                  Lepaskan
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {currentForm.form_description && (
                <div>
                  <Text type="secondary">Deskripsi:</Text>
                  <Paragraph>{currentForm.form_description}</Paragraph>
                </div>
              )}
              <div>
                <Text type="secondary">Status: </Text>
                <Tag color={currentForm.is_active ? "success" : "default"}>
                  {currentForm.is_active ? "Aktif" : "Tidak Aktif"}
                </Tag>
              </div>
              {!currentForm.is_active && (
                <Alert
                  message="Form ini tidak aktif"
                  description="Form tidak akan ditampilkan pada halaman pendaftaran kegiatan. Aktifkan form di halaman detail form."
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          </Card>
        ) : (
          <Empty
            description={
              <Space direction="vertical">
                <Text type="secondary">
                  Kegiatan ini belum memiliki form pendaftaran
                </Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Lampirkan form pendaftaran untuk menambahkan pertanyaan
                  tambahan pada pendaftaran
                </Text>
              </Space>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Lampirkan Form Pendaftaran
            </Button>
          </Empty>
        )}
      </Space>

      <Modal
        title="Pilih Form Pendaftaran"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedFormId(undefined);
        }}
        onOk={handleAttachForm}
        okText="Lampirkan"
        cancelText="Batal"
        confirmLoading={attachLoading}
        okButtonProps={{ disabled: !selectedFormId }}
        width={600}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Paragraph type="secondary">
            Pilih form pendaftaran yang akan dilampirkan ke kegiatan ini. Hanya
            form yang belum terlampir yang ditampilkan.
          </Paragraph>
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Pilih atau cari form pendaftaran"
            loading={unattachedLoading}
            value={selectedFormId}
            onChange={setSelectedFormId}
            options={unattachedForms.map((form: CustomForm) => ({
              label: form.form_name,
              value: form.id,
            }))}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={
              <Empty description="Tidak ada form yang tersedia. Buat form baru terlebih dahulu." />
            }
          />
          {selectedFormId && (
            <Alert
              message="Form yang dipilih akan langsung ditampilkan pada halaman pendaftaran kegiatan."
              type="success"
              showIcon
            />
          )}
          
          <Divider>atau</Divider>
          
          <div style={{ textAlign: "center" }}>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              Belum ada form yang sesuai? Buat form baru terlebih dahulu
            </Paragraph>
            <Button
              type="dashed"
              icon={<FormOutlined />}
              onClick={() => {
                setIsModalOpen(false);
                navigate("/custom-form?create=true");
              }}
              block
            >
              Buat Form Pendaftaran Baru
            </Button>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default CustomFormSelection;
