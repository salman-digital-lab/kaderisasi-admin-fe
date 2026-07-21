import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { EditOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import {
  attachFormToClub,
  createCustomForm,
  getUnattachedForms,
} from "../../../../api/services/customForm";
import { getClub } from "../../../../api/services/club";
import type { CustomForm } from "../../../../types/model/customForm";
import type { Club } from "../../../../types/model/club";

const { Text, Title } = Typography;

interface CustomFormAttachmentProps {
  club: Club;
}

const getQuestionCount = (form: CustomForm): number =>
  form.form_schema?.fields?.reduce(
    (total, section) => total + (section.fields?.length ?? 0),
    0,
  ) ?? 0;

const CustomFormAttachment = ({
  club: initialClub,
}: CustomFormAttachmentProps) => {
  const navigate = useNavigate();
  const [club, setClub] = useState<Club>(initialClub);
  const [unattachedForms, setUnattachedForms] = useState<CustomForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number>();
  const [existingFormModalOpen, setExistingFormModalOpen] = useState(false);
  const [existingFormsLoading, setExistingFormsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const clubId = initialClub.id;

  const fetchClub = async (): Promise<void> => {
    const result = await getClub(clubId);
    if (result) setClub(result);
  };

  const fetchUnattachedForms = async (): Promise<void> => {
    setExistingFormsLoading(true);
    try {
      const result = await getUnattachedForms({
        page: "1",
        per_page: "1000",
      });
      setUnattachedForms(result?.data ?? []);
    } finally {
      setExistingFormsLoading(false);
    }
  };

  useEffect(() => {
    setClub(initialClub);
  }, [initialClub]);

  const openExistingFormModal = (): void => {
    setExistingFormModalOpen(true);
    setSelectedFormId(undefined);
    void fetchUnattachedForms();
  };

  const closeExistingFormModal = (): void => {
    if (attaching) return;
    setExistingFormModalOpen(false);
    setSelectedFormId(undefined);
  };

  const handleCreateForm = async (): Promise<void> => {
    setCreating(true);
    try {
      const newForm = await createCustomForm({
        formName: club.name,
        formDescription: `Form pendaftaran untuk ${club.name}`,
        featureType: "club_registration",
        featureId: clubId,
        isActive: true,
        formSchema: { fields: [] },
      });

      if (!newForm?.id) {
        message.error("Form berhasil diproses tetapi tidak dapat dibuka");
        return;
      }

      message.success("Form berhasil dibuat dan dilampirkan ke klub");
      navigate(`/club/${clubId}/form/${newForm.id}/edit`);
    } catch {
      // The API service displays the server error and the empty state stays intact.
    } finally {
      setCreating(false);
    }
  };

  const handleAttachForm = async (): Promise<void> => {
    if (!selectedFormId) return;

    setAttaching(true);
    try {
      await attachFormToClub(selectedFormId, clubId);
      message.success("Form berhasil dilampirkan ke klub");
      setExistingFormModalOpen(false);
      setSelectedFormId(undefined);
      await fetchClub();
    } catch {
      // Keep the modal open so the user can retry or choose another form.
    } finally {
      setAttaching(false);
    }
  };

  const attachedForm = club?.attachedCustomForm;

  return (
    <Card title="Form Pendaftaran" styles={{ body: { padding: 24 } }}>
      {!attachedForm ? (
        <div
          style={{
            padding: "32px 16px",
            textAlign: "center",
            background: "#fafafa",
            border: "1px dashed #d9d9d9",
            borderRadius: 8,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text strong>Belum ada form pendaftaran</Text>
                <Text type="secondary">
                  {club.is_registration_open
                    ? "Form aktif diperlukan selama pendaftaran klub dibuka."
                    : "Form ini opsional selama pendaftaran klub ditutup."}
                </Text>
              </Space>
            }
          >
            <Space wrap style={{ justifyContent: "center" }}>
              <Button
                type={club.is_registration_open ? "primary" : "default"}
                size="large"
                icon={<PlusOutlined />}
                loading={creating}
                onClick={() => void handleCreateForm()}
              >
                Buat Form Pendaftaran
              </Button>
              <Button
                size="large"
                icon={<LinkOutlined />}
                disabled={creating}
                onClick={openExistingFormModal}
              >
                Pilih Form yang Sudah Ada
              </Button>
            </Space>
          </Empty>
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <Space direction="vertical" size={4}>
              <Space wrap>
                <Title level={5} style={{ margin: 0 }}>
                  {attachedForm.form_name}
                </Title>
                <Tag color={attachedForm.is_active ? "success" : "default"}>
                  {attachedForm.is_active ? "Aktif" : "Tidak Aktif"}
                </Tag>
              </Space>
              {attachedForm.form_description ? (
                <Text type="secondary">{attachedForm.form_description}</Text>
              ) : (
                <Text type="secondary" italic>
                  Tidak ada deskripsi
                </Text>
              )}
            </Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                navigate(`/club/${clubId}/form/${attachedForm.id}/edit`)
              }
            >
              Edit Form
            </Button>
          </div>

          {!attachedForm.is_active && (
            <Alert
              title="Form belum aktif"
              description="Aktifkan form ini sebelum membuka pendaftaran klub."
              type="warning"
              showIcon
            />
          )}

          {club?.is_registration_open && (
            <Alert
              title="Pendaftaran sedang dibuka"
              description="Beberapa pengaturan form tidak dapat diubah selama pendaftaran klub dibuka."
              type="info"
              showIcon
            />
          )}

          <Divider style={{ margin: 0 }} />
          <Space size="large" wrap>
            <div>
              <Text type="secondary">Total Pertanyaan</Text>
              <div>
                <Text strong>{getQuestionCount(attachedForm)}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Terakhir Diperbarui</Text>
              <div>
                <Text strong>
                  {attachedForm.updated_at
                    ? dayjs(attachedForm.updated_at).format("DD MMM YYYY HH:mm")
                    : "-"}
                </Text>
              </div>
            </div>
          </Space>
        </Space>
      )}

      <Modal
        title="Pilih Form yang Sudah Ada"
        open={existingFormModalOpen}
        onCancel={closeExistingFormModal}
        okText="Lampirkan Form"
        cancelText="Batal"
        confirmLoading={attaching}
        okButtonProps={{ disabled: !selectedFormId }}
        onOk={() => void handleAttachForm()}
        destroyOnHidden
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Hanya form yang belum digunakan oleh kegiatan atau klub lain yang
            ditampilkan.
          </Text>
          <Select
            showSearch
            allowClear
            style={{ width: "100%" }}
            placeholder="Cari nama form"
            value={selectedFormId}
            loading={existingFormsLoading}
            onChange={setSelectedFormId}
            options={unattachedForms.map((form) => ({
              label: form.form_name,
              value: form.id,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            notFoundContent={
              existingFormsLoading ? null : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Tidak ada form yang tersedia"
                />
              )
            }
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default CustomFormAttachment;
