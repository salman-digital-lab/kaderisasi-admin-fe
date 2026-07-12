import React, { useState, useEffect } from "react";
import { Button, Card, Form, message, Skeleton, Space, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { updateClubRegistrationInfo } from "../../../api/services/clubRegistration";
import { getClub } from "../../../api/services/club";
import type { Club } from "../../../types/model/club";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import CustomFormAttachment from "../ClubDetail/components/CustomFormAttachment";

interface ClubRegistrationInfoProps {
  clubId: number;
  onUpdate?: () => void;
}

const { Title } = Typography;

const ClubRegistrationInfo: React.FC<ClubRegistrationInfoProps> = ({
  clubId,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [club, setClub] = useState<Club | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState("");

  useEffect(() => {
    fetchClubData();
  }, [clubId]);

  const fetchClubData = async () => {
    setLoading(true);
    try {
      const response = await getClub(clubId);
      if (response) {
        setClub(response);
        const info = response.registration_info?.registration_info || "";
        setRegistrationInfo(info);
        form.setFieldsValue({
          registration_info: info,
        });
      }
    } catch {
      message.error("Gagal memuat data klub");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Skip form validation since we allow empty values
      const values = form.getFieldsValue();
      setSaving(true);

      await updateClubRegistrationInfo(clubId, {
        registration_info: values.registration_info || "",
      });

      message.success("Informasi keanggotaan berhasil diperbarui");
      onUpdate?.();
      fetchClubData();
    } catch {
      message.error("Gagal memperbarui informasi keanggotaan");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setRegistrationInfo(value);
    form.setFieldsValue({ registration_info: value });
  };

  return (
    <Skeleton loading={loading}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>
          Informasi Pendaftaran{club ? ` - ${club.name}` : ""}
        </Title>

        <Card
          title="Deskripsi Pendaftaran"
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              Simpan Deskripsi
            </Button>
          }
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="registration_info"
              label="Informasi untuk calon anggota (Opsional)"
              help="Informasi ini ditampilkan sebelum pengguna mengisi form pendaftaran. Biarkan kosong jika tidak diperlukan."
              style={{ marginBottom: 0 }}
            >
              <RichTextEditor
                value={registrationInfo}
                onChange={handleEditorChange}
                minHeight="300px"
              />
            </Form.Item>
          </Form>
        </Card>

        {club && <CustomFormAttachment club={club} />}
      </Space>
    </Skeleton>
  );
};

export default ClubRegistrationInfo;
