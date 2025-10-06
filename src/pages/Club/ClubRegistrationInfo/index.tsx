import React, { useState, useEffect } from "react";
import { Card, Form, Button, message, Spin, Space } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { updateClubRegistrationInfo } from "../../../api/services/clubRegistration";
import { getClub } from "../../../api/services/club";
import { Club } from "../../../types/model/club";
import { RichTextEditor } from "../../../components/common/RichTextEditor";

interface ClubRegistrationInfoProps {
  clubId: number;
  onUpdate?: () => void;
}

const ClubRegistrationInfo: React.FC<ClubRegistrationInfoProps> = ({
  clubId,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [club, setClub] = useState<Club | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState("");
  const [afterRegistrationInfo, setAfterRegistrationInfo] = useState("");

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
        const afterInfo = response.registration_info?.after_registration_info || "";
        setRegistrationInfo(info);
        setAfterRegistrationInfo(afterInfo);
        form.setFieldsValue({
          registration_info: info,
          after_registration_info: afterInfo,
        });
      }
    } catch (error) {
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
        after_registration_info: values.after_registration_info || "",
      });

      message.success("Informasi keanggotaan berhasil diperbarui");
      onUpdate?.();
      fetchClubData();
    } catch (error) {
      message.error("Gagal memperbarui informasi keanggotaan");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setRegistrationInfo(value);
    form.setFieldsValue({ registration_info: value });
  };

  const handleAfterEditorChange = (value: string) => {
    setAfterRegistrationInfo(value);
    form.setFieldsValue({ after_registration_info: value });
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={`Informasi Pendaftaran Unit Kegiatan${club ? ` - ${club.name}` : ""}`}
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          Simpan Perubahan
        </Button>
      }
    >
      <Form form={form} layout="vertical">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Form.Item
            name="registration_info"
            label="Deskripsi Pendaftaran (Opsional)"
            help="Informasi ini akan ditampilkan kepada pengguna di halaman pendaftaran klub. Anda dapat menggunakan editor teks kaya untuk memformat teks, menambahkan daftar, dan styling lainnya. Biarkan kosong jika tidak diperlukan."
          >
            <RichTextEditor
              value={registrationInfo}
              onChange={handleEditorChange}
              minHeight="300px"
            />
          </Form.Item>

          <Form.Item
            name="after_registration_info"
            label="Informasi Setelah Pendaftaran (Opsional)"
            help="Informasi ini akan ditampilkan kepada pengguna setelah mereka berhasil mendaftar ke klub. Anda dapat menggunakan editor teks kaya untuk memformat teks, menambahkan daftar, dan styling lainnya. Biarkan kosong jika tidak diperlukan."
          >
            <RichTextEditor
              value={afterRegistrationInfo}
              onChange={handleAfterEditorChange}
              minHeight="300px"
            />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
};

export default ClubRegistrationInfo;
