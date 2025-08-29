import { useEffect, useState } from "react";
import { Button, Card, Select, Space, Modal, Alert, Form } from "antd";
import {
  LinkOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";

import {
  getUnattachedForms,
  attachFormToClub,
  detachFormFromClub,
} from "../../../../api/services/customForm";
import { getClub } from "../../../../api/services/club";
import type { CustomForm } from "../../../../types/model/customForm";

const { confirm } = Modal;

interface ClubWithForm {
  id: number;
  name: string;
  attachedCustomForm?: CustomForm;
}

const CustomFormAttachment = () => {
  const { id } = useParams<{ id: string }>();
  const [unattachedForms, setUnattachedForms] = useState<CustomForm[]>([]);
  const [club, setClub] = useState<ClubWithForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [detaching, setDetaching] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  const fetchUnattachedForms = async () => {
    setLoading(true);
    try {
      const result = await getUnattachedForms({
        page: "1",
        per_page: "1000", // Get all forms for select dropdown
        search: undefined,
      });
      if (result) {
        setUnattachedForms(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch unattached forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClub = async () => {
    if (!id) return;
    try {
      const result = await getClub(Number(id));
      if (result) {
        setClub(result);
      }
    } catch (error) {
      console.error("Failed to fetch club:", error);
    }
  };

  useEffect(() => {
    fetchUnattachedForms();
    fetchClub();
  }, [id]);

  const handleAttachForm = async () => {
    if (!id || !selectedFormId) return;

    setAttaching(true);
    try {
      await attachFormToClub(Number(selectedFormId), Number(id));
      setSelectedFormId(""); // Reset selection
      await fetchUnattachedForms();
      await fetchClub();
    } catch (error) {
      console.error("Failed to attach form:", error);
    } finally {
      setAttaching(false);
    }
  };

  const handleDetachForm = async () => {
    if (!club?.attachedCustomForm) return;

    const attachedForm = club.attachedCustomForm;
    confirm({
      title: "Lepas Form",
      icon: <ExclamationCircleOutlined />,
      content: `Apakah Anda yakin ingin melepaskan form "${attachedForm.form_name}" dari klub ini?`,
      okText: "Ya, Lepas",
      cancelText: "Batal",
      onOk: async () => {
        setDetaching(true);
        try {
          await detachFormFromClub(attachedForm.id);
          await fetchUnattachedForms();
          await fetchClub();
        } catch (error) {
          console.error("Failed to detach form:", error);
        } finally {
          setDetaching(false);
        }
      },
    });
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      {/* Current Attached Form */}
      <Card title="Form yang Dilampirkan" size="small">
        {club?.attachedCustomForm ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <strong>{club.attachedCustomForm.form_name}</strong>
              {club.attachedCustomForm.form_description && (
                <div style={{ color: "#666", marginTop: 4 }}>
                  {club.attachedCustomForm.form_description}
                </div>
              )}
            </div>
            <Space>
              <Button
                danger
                icon={<DisconnectOutlined />}
                loading={detaching}
                onClick={handleDetachForm}
              >
                Lepas Form
              </Button>
            </Space>
          </Space>
        ) : (
          <Alert
            message="Tidak ada form yang dilampirkan"
            description="Pilih form dari daftar di bawah untuk dilampirkan ke klub ini."
            type="info"
            showIcon
          />
        )}
      </Card>

      {/* Available Forms */}
      <Card title="Lampirkan Form Baru" size="small">
        <Form layout="vertical">
          <Form.Item label="Pilih Form">
            <Select
              placeholder="Pilih form yang ingin dilampirkan..."
              value={selectedFormId}
              onChange={setSelectedFormId}
              loading={loading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={!!club?.attachedCustomForm}
            >
              {unattachedForms.map((form) => (
                <Select.Option key={form.id} value={form.id.toString()}>
                  {form.form_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              loading={attaching}
              onClick={handleAttachForm}
              disabled={!selectedFormId || !!club?.attachedCustomForm}
            >
              Lampirkan Form
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default CustomFormAttachment;
